@echo off
echo ================================================
echo LegalKonect - Switch to MySQL Database (XAMPP)
echo ================================================
echo.

REM Check if XAMPP is installed
if not exist "C:\xampp\mysql\bin\mysql.exe" (
    echo ERROR: XAMPP not found at C:\xampp
    echo.
    echo Please install XAMPP first:
    echo 1. Download from: https://www.apachefriends.org/download.html
    echo 2. Install to C:\xampp (default location)
    echo 3. Start MySQL from XAMPP Control Panel
    echo 4. Run this script again
    echo.
    pause
    exit /b 1
)

echo Found XAMPP installation at C:\xampp
echo.

REM Check if MySQL is running
netstat -an | find "3306" >nul
if errorlevel 1 (
    echo ERROR: MySQL is not running!
    echo.
    echo Please start MySQL:
    echo 1. Open XAMPP Control Panel
    echo 2. Click "Start" next to MySQL
    echo 3. Wait until background turns green
    echo 4. Run this script again
    echo.
    pause
    exit /b 1
)

echo MySQL is running on port 3306
echo.

cd backend

echo Step 1: Creating MySQL database...
C:\xampp\mysql\bin\mysql.exe -u root -e "CREATE DATABASE IF NOT EXISTS legalkonect CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"
if %errorlevel% neq 0 (
    echo ERROR: Failed to create database.
    echo Trying with password prompt...
    C:\xampp\mysql\bin\mysql.exe -u root -p -e "CREATE DATABASE IF NOT EXISTS legalkonect CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"
    if %errorlevel% neq 0 (
        echo ERROR: Could not create database. Please check MySQL credentials.
        pause
        exit /b 1
    )
)

echo Database created successfully!
echo.

echo Step 2: Updating .env configuration...
powershell -Command "(Get-Content .env) -replace 'DB_CONNECTION=.*', 'DB_CONNECTION=mysql' | Set-Content .env"
powershell -Command "(Get-Content .env) -replace 'DB_HOST=.*', 'DB_HOST=127.0.0.1' | Set-Content .env"
powershell -Command "(Get-Content .env) -replace 'DB_PORT=.*', 'DB_PORT=3306' | Set-Content .env"
powershell -Command "(Get-Content .env) -replace 'DB_DATABASE=.*', 'DB_DATABASE=legalkonect' | Set-Content .env"
powershell -Command "(Get-Content .env) -replace 'DB_USERNAME=.*', 'DB_USERNAME=root' | Set-Content .env"
powershell -Command "(Get-Content .env) -replace 'DB_PASSWORD=.*', 'DB_PASSWORD=' | Set-Content .env"

echo .env updated successfully!
echo.

echo Step 3: Clearing config cache...
php artisan config:clear
php artisan cache:clear

echo.
echo Step 4: Running fresh migrations...
php artisan migrate:fresh
if %errorlevel% neq 0 (
    echo ERROR: Migrations failed.
    echo Check the error above and try again.
    pause
    exit /b 1
)

echo.
echo Step 5: Seeding database...
php artisan db:seed

echo.
echo Step 6: Creating admin account...
php artisan tinker --execute="App\Models\Admin::create(['name' => 'Admin User', 'email' => 'admin@legalkonect.com', 'password' => bcrypt('admin123'), 'role' => 'super_admin', 'is_active' => true]);"

echo.
echo Step 7: Verifying database connection...
php artisan db:show

echo.
echo ================================================
echo Migration Complete!
echo ================================================
echo.
echo Database Information:
echo   Platform: MySQL (via XAMPP)
echo   Host: 127.0.0.1:3306
echo   Database: legalkonect
echo   Username: root
echo   Password: (empty)
echo.
echo Test Credentials:
echo   Client: test@example.com / password
echo   Admin: admin@legalkonect.com / admin123
echo.
echo Next Steps:
echo   1. Stop current backend server (Ctrl+C)
echo   2. Restart: cd backend ^&^& php artisan serve
echo   3. Open http://localhost:3000 and test login
echo.
pause
