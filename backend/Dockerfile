FROM php:8.2-fpm

# Install system dependencies including Nginx and Supervisor
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
    nginx \
    supervisor \
    gettext-base \
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

# Configure PHP-FPM and OPcache (optimized for Railway's resource limits)
RUN echo "memory_limit=256M" > /usr/local/etc/php/conf.d/memory.ini \
    && echo "upload_max_filesize=25M" >> /usr/local/etc/php/conf.d/memory.ini \
    && echo "post_max_size=25M" >> /usr/local/etc/php/conf.d/memory.ini \
    && echo "max_execution_time=300" >> /usr/local/etc/php/conf.d/memory.ini \
    && echo "opcache.enable=1" > /usr/local/etc/php/conf.d/opcache.ini \
    && echo "opcache.enable_cli=0" >> /usr/local/etc/php/conf.d/opcache.ini \
    && echo "opcache.memory_consumption=64" >> /usr/local/etc/php/conf.d/opcache.ini \
    && echo "opcache.interned_strings_buffer=8" >> /usr/local/etc/php/conf.d/opcache.ini \
    && echo "opcache.max_accelerated_files=5000" >> /usr/local/etc/php/conf.d/opcache.ini \
    && echo "opcache.validate_timestamps=0" >> /usr/local/etc/php/conf.d/opcache.ini \
    && echo "opcache.jit=off" >> /usr/local/etc/php/conf.d/opcache.ini \
    && echo "opcache.jit_buffer_size=0" >> /usr/local/etc/php/conf.d/opcache.ini

# Configure PHP-FPM worker limits to prevent memory exhaustion
RUN echo "[www]" > /usr/local/etc/php-fpm.d/zz-railway.conf \
    && echo "pm = dynamic" >> /usr/local/etc/php-fpm.d/zz-railway.conf \
    && echo "pm.max_children = 5" >> /usr/local/etc/php-fpm.d/zz-railway.conf \
    && echo "pm.start_servers = 2" >> /usr/local/etc/php-fpm.d/zz-railway.conf \
    && echo "pm.min_spare_servers = 1" >> /usr/local/etc/php-fpm.d/zz-railway.conf \
    && echo "pm.max_spare_servers = 3" >> /usr/local/etc/php-fpm.d/zz-railway.conf \
    && echo "pm.max_requests = 500" >> /usr/local/etc/php-fpm.d/zz-railway.conf

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

# Configure Nginx template (will be processed with envsubst at runtime)
RUN rm -f /etc/nginx/sites-enabled/default
COPY <<'EOF' /etc/nginx/sites-available/laravel.template
server {
    listen ${PORT};
    server_name _;
    root /var/www/html/public;

    index index.php;

    charset utf-8;

    location / {
        try_files $uri $uri/ /index.php?$query_string;
    }

    location = /favicon.ico { access_log off; log_not_found off; }
    location = /robots.txt  { access_log off; log_not_found off; }

    error_page 404 /index.php;

    location ~ \.php$ {
        fastcgi_pass 127.0.0.1:9000;
        fastcgi_param SCRIPT_FILENAME $realpath_root$fastcgi_script_name;
        include fastcgi_params;
        fastcgi_read_timeout 300;
    }

    location ~ /\.(?!well-known).* {
        deny all;
    }
}
EOF

# Symlink will be created at runtime after envsubst processes the template

# Configure Supervisor to manage both Nginx and PHP-FPM
COPY <<'EOF' /etc/supervisor/conf.d/supervisord.conf
[supervisord]
nodaemon=true
user=root
logfile=/var/log/supervisor/supervisord.log
pidfile=/var/run/supervisord.pid

[program:php-fpm]
command=/usr/local/sbin/php-fpm
autostart=true
autorestart=true
priority=5
stdout_logfile=/dev/stdout
stdout_logfile_maxbytes=0
stderr_logfile=/dev/stderr
stderr_logfile_maxbytes=0

[program:nginx]
command=/usr/sbin/nginx -g "daemon off;"
autostart=true
autorestart=true
priority=10
stdout_logfile=/dev/stdout
stdout_logfile_maxbytes=0
stderr_logfile=/dev/stderr
stderr_logfile_maxbytes=0
EOF

# Copy and use our init script
COPY railway/init-app.sh /init-app.sh
RUN chmod +x /init-app.sh

# Create startup script that configures nginx, runs init, then starts supervisor
RUN echo '#!/bin/bash\n\
set -e\n\
echo "Configuring Nginx with PORT=${PORT:-8080}..."\n\
envsubst "\$PORT" < /etc/nginx/sites-available/laravel.template > /etc/nginx/sites-available/laravel\n\
ln -sf /etc/nginx/sites-available/laravel /etc/nginx/sites-enabled/\n\
echo "Waiting for database connection..."\n\
until php artisan db:show 2>/dev/null; do\n\
  echo "Database is unavailable - sleeping"\n\
  sleep 2\n\
done\n\
echo "Database connection successful!"\n\
echo "Running init script..."\n\
/init-app.sh\n\
echo "Starting Nginx + PHP-FPM via Supervisor..."\n\
exec /usr/bin/supervisord -c /etc/supervisor/conf.d/supervisord.conf' > /start.sh && chmod +x /start.sh

EXPOSE 8080

CMD ["/start.sh"]
