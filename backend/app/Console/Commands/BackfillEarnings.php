<?php

namespace App\Console\Commands;

use App\Models\Appointment;
use App\Models\Earning;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;

class BackfillEarnings extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'earnings:backfill';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Backfill earnings table from existing paid appointments';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $this->info('Starting earnings backfill...');

        // Get all paid appointments that don't have earning records
        $appointments = Appointment::where('payment_status', 'paid')
            ->whereDoesntHave('earning')
            ->with('lawyer')
            ->get();

        if ($appointments->isEmpty()) {
            $this->info('No appointments to backfill.');
            return 0;
        }

        $this->info("Found {$appointments->count()} appointments to backfill.");

        $bar = $this->output->createProgressBar($appointments->count());
        $bar->start();

        $created = 0;
        $errors = 0;

        foreach ($appointments as $appointment) {
            try {
                $grossAmount = $appointment->consultation_fee ?? 100;
                $platformFeePercentage = config('app.platform_fee_percentage', 10);
                $platformFee = ($grossAmount * $platformFeePercentage) / 100;
                $netAmount = $grossAmount - $platformFee;

                Earning::create([
                    'lawyer_id' => $appointment->lawyer_id,
                    'appointment_id' => $appointment->id,
                    'gross_amount' => $grossAmount,
                    'platform_fee' => $platformFee,
                    'net_amount' => $netAmount,
                    'platform_fee_percentage' => $platformFeePercentage,
                    'status' => $appointment->status === 'completed' ? 'completed' : 'pending',
                    'completed_at' => $appointment->status === 'completed' ? $appointment->updated_at : null,
                ]);

                $created++;

            } catch (\Exception $e) {
                $this->error("\nError creating earning for appointment {$appointment->id}: {$e->getMessage()}");
                $errors++;
            }

            $bar->advance();
        }

        $bar->finish();
        $this->newLine();

        $this->info("Backfill completed!");
        $this->info("Created: {$created} earnings");
        if ($errors > 0) {
            $this->warn("Errors: {$errors}");
        }

        return 0;
    }
}
