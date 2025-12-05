# MySQL Migration Guide for LegalKonect

## Prerequisites

You need MySQL installed on your system. Choose one:

### Option 1: XAMPP (Recommended for Windows)
1. Download: https://www.apachefriends.org/download.html
2. Install XAMPP
3. Open XAMPP Control Panel
4. Start "MySQL" module
5. Default credentials: `root` / (no password)

### Option 2: MySQL Community Server
1. Download: https://dev.mysql.com/downloads/mysql/
2. Install MySQL
3. Set root password during installation
4. Start MySQL service

---

## Automated Migration (Easiest)

Once MySQL is installed and running:

```bash
# Run the migration script
switch-to-mysql.bat
```

Enter your MySQL root password when prompted.

**That's it!** The script will:
- Create the database
- Update .env configuration
- Run all migrations
- Seed test data
- Create admin account

---

## Manual Migration Steps

If you prefer to do it manually:

### Step 1: Create Database

```bash
mysql -u root -p
```

```sql
CREATE DATABASE legalkonect CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
EXIT;
```

### Step 2: Update .env File

Edit `backend/.env`:

```env
DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=legalkonect
DB_USERNAME=root
DB_PASSWORD=your_mysql_password
```

### Step 3: Clear Config Cache

```bash
cd backend
php artisan config:clear
```

### Step 4: Run Migrations

```bash
php artisan migrate:fresh
```

### Step 5: Seed Database

```bash
php artisan db:seed
```

### Step 6: Create Admin Account

```bash
php artisan tinker
```

```php
App\Models\Admin::create([
    'name' => 'Admin User',
    'email' => 'admin@legalkonect.com',
    'password' => bcrypt('admin123'),
    'role' => 'super_admin'
]);
exit
```

---

## Verify Migration

### Test Database Connection

```bash
php artisan db:show
```

Should show:
- Platform: MySQL
- Database: legalkonect

### Check Tables

```bash
php artisan tinker
```

```php
// Should return 1
App\Models\User::count();

// Should return 1
App\Models\Admin::count();

// Should return multiple
App\Models\Specialization::count();
```

### Test Login

Start the servers:
```bash
# Backend
cd backend
php artisan serve

# Frontend (new terminal)
cd frontend
npm start
```

Login with:
- Client: `test@example.com` / `password`
- Admin: `admin@legalkonect.com` / `admin123`

---

## Troubleshooting

### Error: "Access denied for user 'root'@'localhost'"

**Solution:** Update DB_PASSWORD in .env with your MySQL root password

### Error: "Database 'legalkonect' doesn't exist"

**Solution:** Create the database manually:
```sql
mysql -u root -p -e "CREATE DATABASE legalkonect CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"
```

### Error: "SQLSTATE[HY000] [2002] No connection could be made"

**Solution:** Make sure MySQL is running
- XAMPP: Check MySQL is started in Control Panel
- Standalone: Check MySQL service in Windows Services

### Error: "Class 'PDO' not found"

**Solution:** Enable PDO MySQL extension in php.ini:
```ini
extension=pdo_mysql
```

Restart after making changes.

---

## Migration Complete Checklist

- [ ] MySQL installed and running
- [ ] Database 'legalkonect' created
- [ ] .env updated with MySQL credentials
- [ ] All migrations ran successfully (46 tables)
- [ ] Database seeded with test data
- [ ] Admin account created
- [ ] Backend server starts without errors
- [ ] Frontend can connect to backend
- [ ] Login works for test@example.com
- [ ] Login works for admin@legalkonect.com

---

## Production Notes

### For Railway Deployment:

Railway provides MySQL automatically. You'll need to:

1. Add MySQL service in Railway dashboard
2. Copy connection details to environment variables:
   - `DB_HOST`
   - `DB_PORT`
   - `DB_DATABASE`
   - `DB_USERNAME`
   - `DB_PASSWORD`

3. Run migrations on Railway:
```bash
php artisan migrate --force
php artisan db:seed
```

### Database Connection String Format:

Railway uses this format:
```
mysql://user:password@host:port/database
```

Laravel uses individual variables (which is better for security).

---

## Backup Your Data (If Needed)

If you have important data in SQL Server:

### Export from SQL Server:
```bash
# In your SQL Server
bcp legalkonect.dbo.users out users.csv -c -t, -S localhost -T
```

### Import to MySQL:
```sql
LOAD DATA INFILE 'users.csv'
INTO TABLE users
FIELDS TERMINATED BY ','
LINES TERMINATED BY '\n';
```

**Note:** For test/development data, it's easier to just start fresh!

---

## Next Steps After Migration

1. Test all features locally with MySQL
2. Commit the .env.example changes
3. Update railway-mysql-deploy branch
4. Deploy to Railway with MySQL database
5. Run migrations on production

---

## Support

If you encounter any issues:
1. Check MySQL is running: `mysql --version`
2. Test connection: `php artisan db:show`
3. Check logs: `storage/logs/laravel.log`
4. Clear cache: `php artisan config:clear && php artisan cache:clear`
