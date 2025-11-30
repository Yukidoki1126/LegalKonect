<?php

require 'vendor/autoload.php';
$app = require 'bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

use App\Models\User;
use App\Models\Lawyer;
use App\Models\Appointment;

// Find Ken Test user
$user = User::where('name', 'like', '%Ken%')->first();
$lawyer = Lawyer::find(2); // Henry Lawyerr

if (!$user) {
    echo "User Ken not found!\n";
    exit(1);
}

echo "User: {$user->id} - {$user->name}\n";
echo "Lawyer: {$lawyer->id} - {$lawyer->first_name} {$lawyer->last_name}\n";

// Create appointment for tomorrow morning (less than 24 hours but in the future)
$appointmentDate = now()->addHours(18)->format('Y-m-d');
$appointmentTime = '14:00'; // 2 PM

echo "Appointment Date: {$appointmentDate} at {$appointmentTime}\n";
echo "Hours until appointment: ~18 hours (less than 24)\n";

$appointment = new Appointment();
$appointment->user_id = $user->id;
$appointment->lawyer_id = $lawyer->id;
$appointment->appointment_date = $appointmentDate;
$appointment->appointment_time = $appointmentTime;
$appointment->duration_minutes = 60;
$appointment->status = 'confirmed';
$appointment->consultation_fee = 500;
$appointment->payment_status = 'paid';
$appointment->payment_method = 'card';
$appointment->payment_reference = 'pi_test_less24hrs_' . time();
$appointment->meeting_type = 'in-person';
$appointment->save();

echo "\n✅ Created Appointment ID: {$appointment->id}\n";
echo "This appointment is scheduled for less than 24 hours from now.\n";
echo "When cancelled, it will require admin review for refund.\n";
