@echo off
echo ================================================
echo Enable MySQL Extension in PHP
echo ================================================
echo.

echo Finding php.ini location...
php --ini | findstr "Loaded Configuration File"
echo.

echo Enabling PDO MySQL extension...
powershell -Command "(Get-Content 'C:\php\php.ini') -replace ';extension=pdo_mysql', 'extension=pdo_mysql' | Set-Content 'C:\php\php.ini'"

echo Enabling MySQL extension...
powershell -Command "(Get-Content 'C:\php\php.ini') -replace ';extension=mysql', 'extension=mysqli' | Set-Content 'C:\php\php.ini'"

echo.
echo ================================================
echo MySQL Extensions Enabled!
echo ================================================
echo.
echo Verifying extensions are loaded...
php -m | findstr -i mysql

echo.
echo If you see "mysqli" and "pdo_mysql" above, extensions are enabled!
echo.
echo Next: Run the database migration
echo Command: cd backend ^&^& php artisan migrate:fresh
echo.
pause
