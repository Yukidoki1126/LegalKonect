<?php

require 'vendor/autoload.php';
$app = require 'bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

$apt = App\Models\Appointment::find(37);

echo "Appointment ID: 37\n";
echo "Date: " . $apt->appointment_date . "\n";
echo "Time: " . $apt->appointment_time . "\n";
echo "Status: " . $apt->status . "\n";
echo "Now date: " . now()->toDateString() . "\n";
echo "Now time: " . now()->toTimeString() . "\n";
echo "Date comparison: " . ($apt->appointment_date >= now()->toDateString() ? 'true' : 'false') . "\n";
echo "Status in array: " . (in_array($apt->status, ['pending', 'confirmed']) ? 'true' : 'false') . "\n";
echo "Can be cancelled: " . ($apt->canBeCancelled() ? 'Yes' : 'No') . "\n";
