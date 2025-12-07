#!/bin/bash
set -e

echo "Running migrations..."
php artisan migrate --force --isolated

echo "Seeding database..."
php artisan db:seed --class=AdminSeeder --force
php artisan db:seed --class=SpecializationsTableSeeder --force
php artisan db:seed --class=FaqSeeder --force

echo "Caching config..."
php artisan config:cache

echo "Caching routes..."
php artisan route:cache

echo "Caching views..."
php artisan view:cache

echo "Application initialized successfully!"
