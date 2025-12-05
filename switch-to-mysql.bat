@echo off
echo ================================================
echo LegalKonect - Switch to MySQL Database
echo ================================================
echo.

cd backend

echo Step 1: Creating MySQL database...
mysql -u root -p -e "CREATE DATABASE IF NOT EXISTS legalkonect CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"
if %errorlevel% neq 0 (
    echo ERROR: Failed to create database. Make sure MySQL is running.
    pause
    exit /b 1
)

echo.
echo Step 2: Updating .env configuration...
powershell -Command "(Get-Content .env) -replace 'DB_CONNECTION=sqlsrv', 'DB_CONNECTION=mysql' | Set-Content .env"
powershell -Command "(Get-Content .env) -replace 'DB_HOST=.*', 'DB_HOST=127.0.0.1' | Set-Content .env"
powershell -Command "(Get-Content .env) -replace 'DB_PORT=.*', 'DB_PORT=3306' | Set-Content .env"
powershell -Command "(Get-Content .env) -replace 'DB_DATABASE=.*', 'DB_DATABASE=legalkonect' | Set-Content .env"
powershell -Command "(Get-Content .env) -replace 'DB_USERNAME=.*', 'DB_USERNAME=root' | Set-Content .env"

echo.
echo Step 3: Clearing config cache...
php artisan config:clear

echo.
echo Step 4: Running fresh migrations...
php artisan migrate:fresh
if %errorlevel% neq 0 (
    echo ERROR: Migrations failed.
    pause
    exit /b 1
)

echo.
echo Step 5: Seeding database...
php artisan db:seed

echo.
echo Step 6: Creating admin account...
php artisan tinker --execute="App\Models\Admin::create(['name' => 'Admin User', 'email' => 'admin@legalkonect.com', 'password' => bcrypt('admin123'), 'role' => 'super_admin']);"

echo.
echo ================================================
echo Migration Complete!
echo ================================================
echo.
echo Test Credentials:
echo   Client: test@example.com / password
echo   Admin: admin@legalkonect.com / admin123
echo.
echo Database: legalkonect (MySQL)
echo.
pause
