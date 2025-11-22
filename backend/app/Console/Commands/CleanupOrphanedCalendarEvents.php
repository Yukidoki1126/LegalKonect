<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Models\Lawyer;
use App\Models\Appointment;
use App\Services\GoogleCalendarService;
use Carbon\Carbon;
use Illuminate\Support\Facades\Log;

class CleanupOrphanedCalendarEvents extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'calendar:cleanup-orphaned {--lawyer-id= : Specific lawyer ID to cleanup}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Clean up orphaned Google Calendar consultation events that no longer have corresponding appointments in the database';

    private GoogleCalendarService $googleCalendarService;

    public function __construct(GoogleCalendarService $googleCalendarService)
    {
        parent::__construct();
        $this->googleCalendarService = $googleCalendarService;
    }

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $this->info('Starting cleanup of orphaned Google Calendar events...');

        $lawyerId = $this->option('lawyer-id');

        // Get lawyers with Google Calendar connected
        $query = Lawyer::where('google_calendar_connected', true);

        if ($lawyerId) {
            $query->where('id', $lawyerId);
        }

        $lawyers = $query->get();

        if ($lawyers->isEmpty()) {
            $this->warn('No lawyers with Google Calendar connected found.');
            return 0;
        }

        $this->info("Found {$lawyers->count()} lawyer(s) with Google Calendar connected.");

        $totalDeleted = 0;

        foreach ($lawyers as $lawyer) {
            $this->line("Processing lawyer: {$lawyer->user->name} (ID: {$lawyer->id})");

            try {
                $deleted = $this->cleanupLawyerEvents($lawyer);
                $totalDeleted += $deleted;

                if ($deleted > 0) {
                    $this->info("  ✓ Deleted {$deleted} orphaned event(s)");
                } else {
                    $this->line("  ✓ No orphaned events found");
                }
            } catch (\Exception $e) {
                $this->error("  ✗ Error: {$e->getMessage()}");
                Log::error('Cleanup failed for lawyer', [
                    'lawyer_id' => $lawyer->id,
                    'error' => $e->getMessage()
                ]);
            }
        }

        $this->newLine();
        $this->info("Cleanup completed! Total orphaned events deleted: {$totalDeleted}");

        return 0;
    }

    /**
     * Clean up orphaned events for a specific lawyer
     */
    private function cleanupLawyerEvents(Lawyer $lawyer): int
    {
        // Get events from the past 30 days to 60 days in the future
        $startDate = Carbon::now()->subDays(30)->format('Y-m-d');
        $endDate = Carbon::now()->addDays(60)->format('Y-m-d');

        // Get all Google Calendar events for this date range
        $events = $this->googleCalendarService->getEvents($lawyer, $startDate, $endDate);

        $deletedCount = 0;

        foreach ($events as $event) {
            // Only process "Consultation - " events (not availability blocks)
            $summary = $event['summary'] ?? '';

            if (strpos($summary, 'Consultation - ') !== 0) {
                continue;
            }

            // Check if this event exists in the database
            $eventId = $event['id'];
            $appointmentExists = Appointment::where('google_event_id', $eventId)
                ->exists();

            if (!$appointmentExists) {
                // This is an orphaned event - delete it
                $this->line("  Deleting orphaned event: {$summary} ({$event['start']})");

                try {
                    $this->googleCalendarService->deleteAppointmentEvent($lawyer, $eventId);
                    $deletedCount++;

                    Log::info('Orphaned Google Calendar event deleted', [
                        'lawyer_id' => $lawyer->id,
                        'event_id' => $eventId,
                        'summary' => $summary,
                        'start' => $event['start']
                    ]);
                } catch (\Exception $e) {
                    $this->error("  Failed to delete event {$eventId}: {$e->getMessage()}");
                    Log::error('Failed to delete orphaned event', [
                        'lawyer_id' => $lawyer->id,
                        'event_id' => $eventId,
                        'error' => $e->getMessage()
                    ]);
                }
            }
        }

        return $deletedCount;
    }
}
