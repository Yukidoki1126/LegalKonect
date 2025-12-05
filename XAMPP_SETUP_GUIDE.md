# XAMPP Setup Guide for LegalKonect

## Step 1: Download XAMPP

1. Click this link: https://www.apachefriends.org/download.html
2. Download **XAMPP 8.2.12 for Windows (64 bit)** - 149 MB
3. Save the installer file (e.g., `xampp-windows-x64-8.2.12-0-VS16-installer.exe`)

---

## Step 2: Install XAMPP

### 2.1 Run the Installer

1. **Double-click** the downloaded installer
2. If Windows shows "User Account Control", click **Yes**

### 2.2 Installation Wizard

**Screen 1: Welcome**
- Click **Next**

**Screen 2: Select Components**
- ✅ Keep these checked:
  - Apache
  - MySQL
  - PHP
  - phpMyAdmin
- ❌ Uncheck (not needed):
  - FileZilla FTP Server
  - Mercury Mail Server
  - Tomcat
  - Perl
  - Webalizer
- Click **Next**

**Screen 3: Installation Folder**
- Default: `C:\xampp`
- ⚠️ **Keep the default** - Click **Next**

**Screen 4: Language**
- Select **English**
- Click **Next**

**Screen 5: Bitnami**
- Uncheck "Learn more about Bitnami for XAMPP"
- Click **Next**

**Screen 6: Ready to Install**
- Click **Next**

**Installation Progress**
- Wait 2-5 minutes for installation
- ☕ Grab a coffee!

**Screen 7: Completed**
- ✅ Check "Do you want to start the Control Panel now?"
- Click **Finish**

---

## Step 3: Configure XAMPP Control Panel

### 3.1 First Launch

When XAMPP Control Panel opens:

1. **Language Selection** (if prompted)
   - Choose **English**
   - Click **Save**

2. **Windows Firewall Alert** (if prompted)
   - Click **Allow Access** for both Apache and MySQL

### 3.2 Start MySQL

In the XAMPP Control Panel:

1. Find the **MySQL** row
2. Click the **Start** button next to MySQL
3. Wait until the background turns **green**
4. You should see: `Port(s): 3306`

✅ **MySQL is now running!**

### 3.3 Optional: Make MySQL Auto-Start

1. Click the checkbox next to **MySQL** (left side)
2. This makes MySQL start automatically when you open XAMPP

---

## Step 4: Verify MySQL Installation

### Method 1: Using XAMPP Shell

1. In XAMPP Control Panel, click **Shell** button
2. Type:
   ```bash
   mysql --version
   ```
3. You should see: `mysql  Ver 8.x.x for Win64`

### Method 2: Using phpMyAdmin (GUI)

1. Make sure **Apache** is also started (click Start button)
2. Open browser: http://localhost/phpmyadmin
3. You should see the phpMyAdmin interface

✅ **MySQL is working!**

---

## Step 5: Create LegalKonect Database

### Option A: Using XAMPP Shell (Recommended)

1. Click **Shell** in XAMPP Control Panel
2. Type:
   ```bash
   mysql -u root
   ```
3. In the MySQL prompt, type:
   ```sql
   CREATE DATABASE legalkonect CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
   SHOW DATABASES;
   EXIT;
   ```

### Option B: Using phpMyAdmin (GUI)

1. Open http://localhost/phpmyadmin
2. Click **New** in the left sidebar
3. Database name: `legalkonect`
4. Collation: `utf8mb4_unicode_ci`
5. Click **Create**

✅ **Database created!**

---

## Step 6: Update LegalKonect Configuration

### 6.1 Update .env File

Open `c:\Users\Yuki\legalkonect\backend\.env` in a text editor.

**Find these lines** and **update them**:

```env
# Change FROM:
DB_CONNECTION=sqlsrv
DB_HOST=...
DB_PORT=...
DB_DATABASE=...
DB_USERNAME=...
DB_PASSWORD=...

# Change TO:
DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=legalkonect
DB_USERNAME=root
DB_PASSWORD=
```

⚠️ **Important:** Leave `DB_PASSWORD` empty (XAMPP has no password by default)

### 6.2 Clear Laravel Cache

Open Command Prompt or Terminal:

```bash
cd c:\Users\Yuki\legalkonect\backend
php artisan config:clear
php artisan cache:clear
```

---

## Step 7: Run Database Migrations

### Option A: Automated Script (Easiest)

1. **Open Command Prompt** in LegalKonect folder
2. Run:
   ```bash
   switch-to-mysql.bat
   ```
3. When asked for password, just **press Enter** (no password needed)

### Option B: Manual Migration

```bash
cd c:\Users\Yuki\legalkonect\backend

# Run migrations
php artisan migrate:fresh

# Seed database
php artisan db:seed

# Create admin
php artisan tinker
```

In tinker:
```php
App\Models\Admin::create(['name' => 'Admin User', 'email' => 'admin@legalkonect.com', 'password' => bcrypt('admin123'), 'role' => 'super_admin']);
exit
```

---

## Step 8: Restart Your Application

### 8.1 Stop Current Servers

If backend/frontend are still running:
- Press **Ctrl+C** in each terminal
- Close the terminals

### 8.2 Start Backend

```bash
cd c:\Users\Yuki\legalkonect\backend
php artisan serve
```

Should show:
```
Server running on http://127.0.0.1:8000
```

### 8.3 Start Frontend (New Terminal)

```bash
cd c:\Users\Yuki\legalkonect\frontend
npm start
```

---

## Step 9: Test Everything

### 9.1 Test Database Connection

```bash
cd backend
php artisan db:show
```

Should show:
- **Platform:** MySQL
- **Database:** legalkonect

### 9.2 Test Login

1. Open browser: http://localhost:3000
2. Try logging in:
   - **Client:** test@example.com / password
   - **Admin:** admin@legalkonect.com / admin123

✅ **If login works, migration is successful!**

---

## Troubleshooting

### ❌ MySQL Won't Start

**Error:** "Port 3306 is already in use"

**Solution:**
1. Open Task Manager (Ctrl+Shift+Esc)
2. Find "mysqld.exe" or "MySQL"
3. End the task
4. Try starting MySQL in XAMPP again

**OR:**

1. Uninstall any other MySQL installations
2. Restart computer
3. Start XAMPP MySQL

---

### ❌ "Access Denied" Error

**Error:** `Access denied for user 'root'@'localhost'`

**Solution 1:** Reset MySQL Password

1. In XAMPP Control Panel, stop MySQL
2. Click **Shell**
3. Run:
   ```bash
   cd mysql/bin
   mysqladmin -u root password ""
   ```
4. Start MySQL again

**Solution 2:** Update .env

Make sure `.env` has:
```env
DB_PASSWORD=
```
(Leave empty, no quotes)

---

### ❌ "Database doesn't exist" Error

**Solution:**
```bash
mysql -u root -e "CREATE DATABASE legalkonect CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"
```

---

### ❌ "Class 'PDO' not found"

**Solution:**

1. Open `C:\xampp\php\php.ini`
2. Find this line:
   ```ini
   ;extension=pdo_mysql
   ```
3. Remove the semicolon:
   ```ini
   extension=pdo_mysql
   ```
4. Save file
5. Restart XAMPP

---

## XAMPP Control Panel Tips

### Useful Buttons

- **Start/Stop:** Start or stop services
- **Admin:** Open phpMyAdmin (for MySQL)
- **Config:** Configure service settings
- **Logs:** View error logs
- **Shell:** Open command prompt with XAMPP paths
- **Netstat:** Check which ports are in use

### Making XAMPP Start with Windows

1. Right-click XAMPP Control Panel icon
2. Create shortcut
3. Press `Win + R`
4. Type: `shell:startup`
5. Move shortcut to the Startup folder

---

## Quick Reference

### XAMPP Locations

- **Installation:** `C:\xampp`
- **MySQL Data:** `C:\xampp\mysql\data`
- **PHP:** `C:\xampp\php`
- **Logs:** `C:\xampp\mysql\data\*.err`

### Default Credentials

- **MySQL User:** root
- **MySQL Password:** (empty)
- **phpMyAdmin:** http://localhost/phpmyadmin

### Important Ports

- **Apache:** 80, 443
- **MySQL:** 3306

---

## Next Steps After Setup

1. ✅ XAMPP installed and MySQL running
2. ✅ Database created
3. ✅ Migrations ran successfully
4. ✅ Application tested locally
5. 🚀 Ready for production deployment!

---

## Need Help?

- XAMPP not starting? Check logs in Control Panel
- Database issues? Try phpMyAdmin: http://localhost/phpmyadmin
- Port conflicts? Change ports in XAMPP Config
- Still stuck? Check Laravel logs: `backend/storage/logs/laravel.log`
