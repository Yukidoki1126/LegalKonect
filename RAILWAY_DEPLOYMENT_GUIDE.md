# LegalKonect Railway Deployment Guide

This guide will help you deploy your LegalKonect application to Railway and migrate from SQL Server to MySQL.

## 📋 Prerequisites

- Railway account (sign up at https://railway.app)
- GitHub repository (push your code to GitHub)
- Google Cloud Console access (for updating OAuth redirect URIs)

## 🚀 Part 1: Deploying the Backend (Laravel API)

### Step 1: Create a New Railway Project

1. Go to https://railway.app
2. Click "Start a New Project"
3. Select "Deploy from GitHub repo"
4. Authorize Railway to access your GitHub account
5. Select your `legalkonect` repository

### Step 2: Add MySQL Database

1. In your Railway project, click "+ New"
2. Select "Database" → "Add MySQL"
3. Railway will automatically create a MySQL database with credentials

### Step 3: Configure Backend Service

1. In Railway, click "+ New" → "GitHub Repo"
2. Select your repository
3. Click on "Settings" → "General"
4. Set **Root Directory** to: `backend`
5. Click on "Settings" → "Deploy"
6. Set **Build Command**: `composer install --no-dev --optimize-autoloader`
7. Set **Start Command**: `php artisan migrate --force && php artisan serve --host=0.0.0.0 --port=$PORT`

### Step 4: Configure Environment Variables

Click on "Variables" tab and add these environment variables:

```env
APP_NAME=LegalKonect
APP_ENV=production
APP_KEY=base64:GENERATE_NEW_KEY_WITH_php_artisan_key:generate
APP_DEBUG=false
APP_URL=https://your-backend-url.railway.app

APP_LOCALE=en
APP_FALLBACK_LOCALE=en
FRONTEND_URL=https://your-frontend-url.railway.app
SANCTUM_STATEFUL_DOMAINS=your-frontend-url.railway.app

LOG_CHANNEL=stack
LOG_LEVEL=info

# MySQL Database - Railway provides these automatically
DB_CONNECTION=mysql
DB_HOST=${{MySQL.MYSQL_HOST}}
DB_PORT=${{MySQL.MYSQL_PORT}}
DB_DATABASE=${{MySQL.MYSQL_DATABASE}}
DB_USERNAME=${{MySQL.MYSQL_USER}}
DB_PASSWORD=${{MySQL.MYSQL_PASSWORD}}

SESSION_DRIVER=database
SESSION_LIFETIME=120

FILESYSTEM_DISK=local
QUEUE_CONNECTION=database
CACHE_STORE=database

# Mail Configuration
MAIL_MAILER=resend
RESEND_KEY=your_resend_api_key_here
MAIL_FROM_ADDRESS=onboarding@resend.dev
MAIL_FROM_NAME=LegalKonect

# Google OAuth - Update these with production URLs
GOOGLE_CLIENT_ID=your_google_client_id_here
GOOGLE_CLIENT_SECRET=your_google_client_secret_here
GOOGLE_REDIRECT_URI=https://your-backend-url.railway.app/api/google/callback
GOOGLE_AUTH_REDIRECT_URI=https://your-backend-url.railway.app/api/auth/google/callback
```

**Important Notes:**
- Replace `your-backend-url.railway.app` with your actual Railway backend URL
- Replace `your-frontend-url.railway.app` with your actual Railway frontend URL
- Railway will automatically inject MySQL variables using `${{MySQL.VARIABLE_NAME}}`
- Generate a new `APP_KEY` for production by running: `php artisan key:generate --show`

### Step 5: Deploy Backend

1. Click "Deploy" or wait for automatic deployment
2. Monitor the deployment logs
3. Once deployed, get your backend URL from Railway (e.g., `https://legalkonect-backend-production.up.railway.app`)

---

## 🎨 Part 2: Deploying the Frontend (React App)

### Step 1: Create Frontend Service

1. In the same Railway project, click "+ New" → "GitHub Repo"
2. Select your repository again
3. Click on "Settings" → "General"
4. Set **Root Directory** to: `frontend`

### Step 2: Configure Build Settings

1. Go to "Settings" → "Deploy"
2. Railway will auto-detect it's a React app
3. Verify these settings:
   - **Build Command**: `npm run build`
   - **Start Command**: `npx serve -s build -l $PORT`

### Step 3: Add Environment Variables

Click on "Variables" tab and add:

```env
REACT_APP_API_URL=https://your-backend-url.railway.app/api
REACT_APP_GOOGLE_CLIENT_ID=your_google_client_id_here
```

### Step 4: Install serve package

Create a `frontend/.railwayignore` file (optional) and update `frontend/package.json`:

Add to dependencies:
```json
"serve": "^14.2.1"
```

Or Railway will install it automatically via the start command.

### Step 5: Deploy Frontend

1. Click "Deploy"
2. Wait for build to complete
3. Get your frontend URL (e.g., `https://legalkonect-frontend-production.up.railway.app`)

---

## 🔧 Part 3: Post-Deployment Configuration

### Step 1: Update Backend Environment with Frontend URL

1. Go to your backend service in Railway
2. Update these variables with your actual frontend URL:
   - `FRONTEND_URL=https://your-actual-frontend-url.railway.app`
   - `SANCTUM_STATEFUL_DOMAINS=your-actual-frontend-url.railway.app`
3. Redeploy the backend

### Step 2: Update Google OAuth Redirect URIs

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Navigate to "APIs & Services" → "Credentials"
3. Click on your OAuth 2.0 Client ID
4. Add these to **Authorized redirect URIs**:
   - `https://your-backend-url.railway.app/api/google/callback`
   - `https://your-backend-url.railway.app/api/auth/google/callback`
5. Add these to **Authorized JavaScript origins**:
   - `https://your-frontend-url.railway.app`
   - `https://your-backend-url.railway.app`
6. Save changes

### Step 3: Configure CORS (Already done in your Laravel app)

Your Laravel app should already have CORS configured in `config/cors.php`. Verify it includes:

```php
'paths' => ['api/*', 'sanctum/csrf-cookie'],
'allowed_origins' => [env('FRONTEND_URL')],
'supports_credentials' => true,
```

### Step 4: Run Database Migrations

Railway should automatically run migrations on deployment (configured in start command). To manually run migrations:

1. Go to your backend service in Railway
2. Click on "Settings" → "Deployments"
3. Find the latest deployment
4. Click the three dots → "View Logs"
5. Verify migrations ran successfully

Or use Railway CLI:
```bash
railway login
railway link
railway run php artisan migrate --force
```

---

## 🗄️ Part 4: SQL Server to MySQL Migration

### Key Differences to Be Aware Of:

1. **String Length**: MySQL has a default string length limit of 191 characters for indexed columns (your migrations look good!)

2. **Enum Types**: MySQL and SQL Server handle enums differently, but Laravel abstracts this well

3. **Boolean Types**:
   - SQL Server uses `BIT`
   - MySQL uses `TINYINT(1)`
   - Laravel handles this automatically

4. **JSON Columns**: Both support JSON, Laravel handles differences

5. **Foreign Key Constraints**: Your migrations already handle this properly

### Your Migrations Are Already Compatible! ✅

Good news! I reviewed your migrations and they are already compatible with MySQL because:

- You're using Laravel's schema builder (which abstracts database differences)
- String lengths are appropriate for MySQL
- Foreign key constraints are properly defined
- No SQL Server-specific syntax found

### Test Locally with MySQL (Optional)

If you want to test with MySQL locally before deploying:

1. Install MySQL locally or use XAMPP/WAMP
2. Create a test database
3. Create a `.env.mysql` file:

```env
DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=legalkonect_test
DB_USERNAME=root
DB_PASSWORD=your_password
```

4. Run migrations:
```bash
cd backend
php artisan migrate --env=mysql
```

---

## 🔒 Part 5: Security Checklist

- [ ] Set `APP_DEBUG=false` in production
- [ ] Generate new `APP_KEY` for production
- [ ] Update `SANCTUM_STATEFUL_DOMAINS` with production domain
- [ ] Verify CORS settings
- [ ] Update Google OAuth redirect URIs
- [ ] Secure your Resend API key (consider using environment variables)
- [ ] Enable Railway's automatic HTTPS (enabled by default)
- [ ] Set up custom domain (optional)

---

## 📦 Part 6: File Storage Considerations

Your app uses `FILESYSTEM_DISK=local`. For production, consider:

1. **Railway Persistent Storage**: Files are deleted on each deployment
2. **AWS S3**: Recommended for production
   - Update `.env` with AWS credentials
   - Change `FILESYSTEM_DISK=s3`
   - Install AWS SDK: `composer require league/flysystem-aws-s3-v3`

3. **Cloudinary** or **DigitalOcean Spaces**: Alternative options

---

## 🚀 Part 7: Deployment Checklist

### Backend:
- [ ] MySQL database created in Railway
- [ ] Environment variables configured
- [ ] Root directory set to `backend`
- [ ] Deployment successful
- [ ] Migrations ran successfully
- [ ] Backend URL accessible

### Frontend:
- [ ] Root directory set to `frontend`
- [ ] Environment variables configured
- [ ] Build successful
- [ ] Frontend URL accessible
- [ ] Can connect to backend API

### Post-Deployment:
- [ ] Google OAuth redirect URIs updated
- [ ] Frontend URL updated in backend env
- [ ] Test user registration
- [ ] Test user login
- [ ] Test lawyer registration
- [ ] Test booking system
- [ ] Test Google Calendar integration
- [ ] Test payment system

---

## 🐛 Troubleshooting

### Backend Won't Start

**Check logs:**
1. Go to Railway → Your backend service
2. Click "View Logs"
3. Look for errors

**Common issues:**
- Missing `APP_KEY`: Generate one with `php artisan key:generate --show`
- Database connection failed: Verify MySQL variables
- Port binding: Ensure using `--port=$PORT` in start command

### Frontend Can't Connect to Backend

**Check:**
1. `REACT_APP_API_URL` is set correctly
2. CORS is configured in Laravel
3. `FRONTEND_URL` and `SANCTUM_STATEFUL_DOMAINS` are set in backend
4. Both services are running

### Database Migration Failed

**Run manually:**
```bash
# Using Railway CLI
railway login
railway link
railway run php artisan migrate:fresh --force
```

### 500 Internal Server Error

**Enable debug temporarily:**
1. Set `APP_DEBUG=true` in Railway backend variables
2. Check error details
3. Set back to `false` after fixing

---

## 💡 Tips

1. **Use Railway CLI** for easier management:
   ```bash
   npm i -g @railway/cli
   railway login
   railway link
   ```

2. **Monitor Logs**: Railway provides real-time logs for debugging

3. **Custom Domains**: Railway allows adding custom domains for free

4. **Environment Groups**: Use Railway's environment groups for staging/production

5. **Database Backups**: Railway doesn't auto-backup free-tier databases. Consider manual backups:
   ```bash
   railway run mysqldump -h $DB_HOST -u $DB_USERNAME -p$DB_PASSWORD $DB_DATABASE > backup.sql
   ```

---

## 📚 Additional Resources

- [Railway Documentation](https://docs.railway.app)
- [Laravel Deployment Guide](https://laravel.com/docs/deployment)
- [MySQL vs SQL Server Differences](https://www.guru99.com/mysql-vs-sql-server.html)

---

## ✅ Summary

Your application is **ready for Railway deployment**! Your migrations are already compatible with MySQL, so no code changes are needed. Just follow this guide step by step, and you'll have your application running on Railway with MySQL in no time.

**Key Points:**
- ✅ Migrations are MySQL-compatible
- ✅ No code changes required
- ✅ Use separate `.env` files for local (SQL Server) and production (MySQL)
- ✅ Railway auto-manages MySQL connection
- ✅ Remember to update Google OAuth URLs

Good luck with your deployment! 🚀
