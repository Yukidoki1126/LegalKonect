#!/bin/bash
set -e

echo "Running migrations..."
php artisan migrate --force --isolated

echo "Caching config..."
php artisan config:cache

echo "Caching routes..."
php artisan route:cache

echo "Caching views..."
php artisan view:cache

echo "Application initialized successfully!"
