#!/bin/bash
set -e

echo "Running migrations..."
php artisan migrate --force --isolated

echo "Seeding database..."
php artisan db:seed --class=AdminSeeder --force
php artisan db:seed --class=SpecializationsTableSeeder --force
php artisan db:seed --class=FaqSeeder --force

echo "Clearing all caches..."
php artisan config:clear
php artisan route:clear
php artisan view:clear
php artisan cache:clear

echo "Application initialized successfully!"
