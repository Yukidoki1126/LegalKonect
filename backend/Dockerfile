FROM php:8.2-apache

# Install system dependencies
RUN apt-get update && apt-get install -y \
    git \
    curl \
    libpng-dev \
    libonig-dev \
    libxml2-dev \
    libpq-dev \
    zip \
    unzip \
    && apt-get clean && rm -rf /var/lib/apt/lists/*

# Install PHP extensions (MySQL, PostgreSQL, and others)
RUN docker-php-ext-install pdo_mysql mbstring exif pcntl bcmath gd pdo_pgsql pgsql

# Configure PHP for larger file uploads
RUN echo "upload_max_filesize = 25M" >> /usr/local/etc/php/conf.d/uploads.ini \
    && echo "post_max_size = 30M" >> /usr/local/etc/php/conf.d/uploads.ini \
    && echo "memory_limit = 256M" >> /usr/local/etc/php/conf.d/uploads.ini \
    && echo "max_execution_time = 120" >> /usr/local/etc/php/conf.d/uploads.ini \
    && echo "max_input_time = 120" >> /usr/local/etc/php/conf.d/uploads.ini

# Get latest Composer
COPY --from=composer:latest /usr/bin/composer /usr/bin/composer

# Set working directory
WORKDIR /var/www/html

# Copy application files
COPY . /var/www/html

# Install dependencies
RUN composer install --no-dev --optimize-autoloader --no-interaction

# Create storage directories and set permissions
RUN mkdir -p storage/framework/sessions \
    storage/framework/views \
    storage/framework/cache \
    storage/logs \
    bootstrap/cache \
    && chown -R www-data:www-data /var/www/html \
    && chmod -R 755 /var/www/html/storage \
    && chmod -R 755 /var/www/html/bootstrap/cache

# Enable Apache mod_rewrite
RUN a2enmod rewrite

# Configure Apache DocumentRoot to point to Laravel's public directory
ENV APACHE_DOCUMENT_ROOT=/var/www/html/public
RUN sed -ri -e 's!/var/www/html!${APACHE_DOCUMENT_ROOT}!g' /etc/apache2/sites-available/*.conf
RUN sed -ri -e 's!/var/www/!${APACHE_DOCUMENT_ROOT}!g' /etc/apache2/apache2.conf /etc/apache2/conf-available/*.conf

# Copy Apache configuration for Laravel
RUN echo '<Directory /var/www/html/public>\n\
    Options Indexes FollowSymLinks\n\
    AllowOverride All\n\
    Require all granted\n\
</Directory>' > /etc/apache2/conf-available/laravel.conf && a2enconf laravel

# Expose port 80 (Render will handle external port mapping)
EXPOSE 80

# Create startup script that runs migrations and starts Apache
RUN echo '#!/bin/bash\n\
set -e\n\
echo "Clearing all caches..."\n\
php artisan cache:clear || true\n\
php artisan config:clear || true\n\
php artisan route:clear || true\n\
php artisan view:clear || true\n\
echo "Running migrations..."\n\
php artisan migrate --force --no-interaction\n\
echo "Dumping autoload..."\n\
composer dump-autoload\n\
echo "Seeding specializations..."\n\
php artisan db:seed --class=SpecializationsTableSeeder --force\n\
echo "Seeding super admin..."\n\
php artisan db:seed --class=SuperAdminSeeder --force\n\
echo "Seeding faq..."\n\
php artisan db:seed --class=FaqSeeder --force\n\
echo "Caching configuration..."\n\
php artisan config:cache\n\
echo "Caching routes..."\n\
php artisan route:cache\n\
echo "Starting Apache..."\n\
apache2-foreground' > /start.sh && chmod +x /start.sh

CMD ["/start.sh"]
