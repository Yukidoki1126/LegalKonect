FROM php:8.2-cli

# Install system dependencies
RUN apt-get update && apt-get install -y \
    git \
    curl \
    libpng-dev \
    libonig-dev \
    libxml2-dev \
    libicu-dev \
    libsodium-dev \
    libssl-dev \
    zip \
    unzip \
    && apt-get clean && rm -rf /var/lib/apt/lists/*

# Install PHP extensions (including sodium for Sanctum)
RUN docker-php-ext-install \
    pdo_mysql \
    mbstring \
    exif \
    pcntl \
    bcmath \
    gd \
    intl \
    sodium \
    opcache

# Configure PHP for production
RUN echo "memory_limit=256M" > /usr/local/etc/php/conf.d/custom.ini \
    && echo "upload_max_filesize=25M" >> /usr/local/etc/php/conf.d/custom.ini \
    && echo "post_max_size=25M" >> /usr/local/etc/php/conf.d/custom.ini \
    && echo "max_execution_time=300" >> /usr/local/etc/php/conf.d/custom.ini \
    && echo "opcache.enable=1" >> /usr/local/etc/php/conf.d/custom.ini \
    && echo "opcache.memory_consumption=64" >> /usr/local/etc/php/conf.d/custom.ini \
    && echo "opcache.jit=off" >> /usr/local/etc/php/conf.d/custom.ini

# Get Composer
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

# Copy init script
COPY railway/init-app.sh /init-app.sh
RUN chmod +x /init-app.sh

# Create startup script
RUN echo '#!/bin/bash\n\
set -e\n\
echo "Waiting for database connection..."\n\
until php artisan db:show 2>/dev/null; do\n\
  echo "Database is unavailable - sleeping"\n\
  sleep 2\n\
done\n\
echo "Database connection successful!"\n\
echo "Running init script..."\n\
/init-app.sh\n\
echo "Starting Laravel on port ${PORT:-8000}..."\n\
exec php artisan serve --host=0.0.0.0 --port=${PORT:-8000}' > /start.sh && chmod +x /start.sh

CMD ["/start.sh"]
