<?php

require 'vendor/autoload.php';
$app = require 'bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

use App\Models\Appointment;

echo "=== Checking Pending Refunds ===" . PHP_EOL;

// Check for pending_review refunds
$pendingReview = Appointment::where('refund_status', 'pending_review')->get();
echo "Pending Review: " . $pendingReview->count() . PHP_EOL;

foreach ($pendingReview as $apt) {
    echo "  - ID: {$apt->id}, Payment: {$apt->payment_status}, Refund: {$apt->refund_status}" . PHP_EOL;
}

// Check all cancelled appointments with payment
echo PHP_EOL . "=== All Cancelled Paid Appointments ===" . PHP_EOL;
$cancelled = Appointment::where('status', 'cancelled')
    ->where('payment_status', 'paid')
    ->get(['id', 'status', 'payment_status', 'refund_status', 'refund_amount', 'refund_reason']);

echo "Found: " . $cancelled->count() . PHP_EOL;
foreach ($cancelled as $apt) {
    echo "  - ID: {$apt->id}, Refund Status: " . ($apt->refund_status ?? 'NULL') . ", Amount: " . ($apt->refund_amount ?? 'NULL') . PHP_EOL;
}

// Check latest logs
echo PHP_EOL . "=== Recent Cancellation Logs ===" . PHP_EOL;
$logFile = storage_path('logs/laravel.log');
if (file_exists($logFile)) {
    $logs = file_get_contents($logFile);
    // Get last 50 lines
    $lines = explode("\n", $logs);
    $lastLines = array_slice($lines, -50);
    foreach ($lastLines as $line) {
        if (stripos($line, 'cancel') !== false || stripos($line, 'refund') !== false) {
            echo $line . PHP_EOL;
        }
    }
}
