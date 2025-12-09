#!/bin/bash
set -e

echo "Removing corrupted bootstrap cache files..."
rm -rf bootstrap/cache/*.php
mkdir -p bootstrap/cache
chmod -R 775 bootstrap/cache

echo "Setting up session storage..."
mkdir -p storage/framework/sessions
chmod -R 775 storage/framework/sessions

echo "Clearing all caches..."
php artisan config:clear
php artisan route:clear
php artisan view:clear
php artisan cache:clear

echo "Running migrations..."
php artisan migrate --force --isolated

echo "Seeding database..."
php artisan db:seed --class=AdminSeeder --force
php artisan db:seed --class=SpecializationsTableSeeder --force
php artisan db:seed --class=FaqSeeder --force

echo "Application initialized successfully!"
