# Setup Guide

## Prerequisites
- PHP 8.1+
- Composer
- Node.js 16+
- MySQL 8.0+
- Git

## Step 1: Clone the Repository
```bash
git clone https://github.com/your-username/legalkonect.git
cd legalkonect
git checkout expiremental
```

## Step 2: Receive .env File
**IMPORTANT:** Ask your partner to send you the `backend/.env` file through a SECURE channel:
- WhatsApp/Signal (encrypted messaging)
- Email with password-protected zip
- USB drive (if in-person)
- Never via GitHub or public channels!

## Step 3: Backend Setup
```bash
cd backend

# Place the .env file you received here: backend/.env

# Install PHP dependencies
composer install

# Generate application key (if not in .env)
php artisan key:generate

# Run database migrations
php artisan migrate

# Seed the database (optional - creates sample data)
php artisan db:seed

# Start the Laravel server
php artisan serve
# Backend will run on http://localhost:8000
```

## Step 4: Frontend Setup
```bash
cd ../frontend

# Install Node dependencies
npm install

# Start the development server
npm run dev
# Frontend will run on http://localhost:5173
```

## Step 5: Configure Database
Make sure your MySQL database matches the credentials in `.env`:
```
DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=legalkonect
DB_USERNAME=root
DB_PASSWORD=your_password
```

Create the database if it doesn't exist:
```sql
CREATE DATABASE legalkonect;
```

## Step 6: Test the Application
1. Open browser to `http://localhost:5173`
2. Try logging in or registering
3. Check if API calls work (backend should be running)

## Common Issues

### Port Already in Use
**Frontend (5173):**
```bash
# Kill process on port 5173
npx kill-port 5173
npm run dev
```

**Backend (8000):**
```bash
# Kill process on port 8000
npx kill-port 8000
php artisan serve
```

### Database Connection Error
- Check MySQL is running
- Verify credentials in `.env`
- Ensure database exists

### Composer/NPM Errors
```bash
# Clear caches
composer clear-cache
npm cache clean --force

# Reinstall
rm -rf vendor node_modules
composer install
npm install
```

## Important Files to Keep Secure
- `backend/.env` - Contains API keys, database credentials, etc.
- Never commit this to Git
- Always share through secure channels

## Environment Variables You Need
The `.env` file should contain:
- Database credentials
- Google OAuth credentials (CLIENT_ID, CLIENT_SECRET)
- Paymongo API keys
- Mail configuration (Resend API key)
- JWT secrets
- Any other API keys

## Questions?
Contact your partner if you encounter any issues during setup.
