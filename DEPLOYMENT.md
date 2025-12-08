# LegalKonect Deployment Guide

## Table of Contents
1. [Prerequisites](#prerequisites)
2. [Pre-Deployment Checklist](#pre-deployment-checklist)
3. [Backend Deployment (Railway)](#backend-deployment-railway)
4. [Frontend Deployment (Vercel)](#frontend-deployment-vercel)
5. [Post-Deployment Tasks](#post-deployment-tasks)
6. [Troubleshooting](#troubleshooting)
7. [Monitoring & Maintenance](#monitoring--maintenance)

---

## Prerequisites

### Required Services & Accounts
- Railway account (for backend + MySQL database)
- Vercel account (for frontend)
- Cloudflare R2 account (for file storage)
- Resend account (for email service)
- Google Cloud Console project (for OAuth & Calendar)
- Domain name (optional but recommended)

### Required Tools
- Git
- Node.js 18+
- PHP 8.2+
- Composer 2.x

---

## Pre-Deployment Checklist

### 1. Rotate All Credentials   CRITICAL

**Why**: Your current `.env` file may contain active credentials that should NEVER be used in production.

Generate new credentials for:

**Google OAuth 2.0 Credentials**
- Go to [Google Cloud Console](https://console.cloud.google.com/)
- Create new OAuth 2.0 Client ID
- Add authorized redirect URIs:
  - `https://your-backend.up.railway.app/api/google/callback`
  - `https://your-backend.up.railway.app/api/auth/google/callback`

**Resend API Key**
- Go to [Resend Dashboard](https://resend.com/api-keys)
- Create new API key for production

**Cloudflare R2 Credentials**
- Go to [Cloudflare Dashboard](https://dash.cloudflare.com/)
- Navigate to R2 > Manage R2 API Tokens
- Create new R2 access token with read/write permissions

**Laravel Application Keys**
```bash
cd backend
php artisan key:generate --show  # For APP_KEY
php artisan key:generate --show  # For DOCUMENT_ENCRYPTION_KEY
```

### 2. Verify Codebase

- All migrations are committed
- No hardcoded localhost URLs
- `.gitignore` includes `.env`
- Recent commits addressing deployment issues
- Google services configured with graceful degradation

---

## Backend Deployment (Railway)

### Step 1: Create Railway Project

1. Go to [Railway](https://railway.app/)
2. Click "New Project" ’ "Deploy from GitHub repo"
3. Select your `legalkonect` repository
4. Railway will detect the Dockerfile automatically

### Step 2: Add MySQL Database

1. In your Railway project, click "+ New"
2. Select "Database" ’ "MySQL"
3. Railway will auto-inject these variables:
   - `MYSQL_HOST`
   - `MYSQL_PORT`
   - `MYSQL_DATABASE`
   - `MYSQL_USER`
   - `MYSQL_PASSWORD`

### Step 3: Configure Environment Variables

Copy settings from `backend/.env.railway.example` and update:

#### Application
```
APP_NAME=LegalKonect
APP_ENV=production
APP_KEY=base64:[YOUR_GENERATED_KEY]
APP_DEBUG=false
APP_URL=https://legalkonect-backend.up.railway.app
DOCUMENT_ENCRYPTION_KEY=base64:[YOUR_GENERATED_KEY]
```

#### Frontend & CORS
```
FRONTEND_URL=https://legalkonect.vercel.app
SANCTUM_STATEFUL_DOMAINS=legalkonect.vercel.app
```

#### Database (auto-injected by Railway)
```
DB_CONNECTION=mysql
DB_HOST=${MYSQL_HOST}
DB_PORT=${MYSQL_PORT}
DB_DATABASE=${MYSQL_DATABASE}
DB_USERNAME=${MYSQL_USER}
DB_PASSWORD=${MYSQL_PASSWORD}
```

#### Session & Security
```
SESSION_DRIVER=database
SESSION_LIFETIME=120
SESSION_SECURE_COOKIE=true
SESSION_HTTP_ONLY=true
SESSION_SAME_SITE=lax
CACHE_STORE=database
QUEUE_CONNECTION=database
```

#### Cloudflare R2 Storage
```
FILESYSTEM_DISK=r2
AWS_ACCESS_KEY_ID=[your_r2_access_key]
AWS_SECRET_ACCESS_KEY=[your_r2_secret_key]
AWS_DEFAULT_REGION=auto
AWS_BUCKET=legalkonect-credentials
AWS_ENDPOINT=https://[account-id].r2.cloudflarestorage.com
AWS_URL=https://pub-[id].r2.dev
AWS_USE_PATH_STYLE_ENDPOINT=false
```

#### Email (Resend)
```
MAIL_MAILER=resend
RESEND_KEY=[your_resend_api_key]
MAIL_FROM_ADDRESS=noreply@yourdomain.com
MAIL_FROM_NAME=LegalKonect
```

#### Google Services
```
GOOGLE_CLIENT_ID=[your-id].apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=[your-secret]
GOOGLE_REDIRECT_URI=https://legalkonect-backend.up.railway.app/api/google/callback
GOOGLE_AUTH_REDIRECT_URI=https://legalkonect-backend.up.railway.app/api/auth/google/callback
```

#### Logging
```
LOG_CHANNEL=stack
LOG_STACK=single
LOG_LEVEL=error
BCRYPT_ROUNDS=12
```

### Step 4: Deploy

1. Railway will automatically build and deploy using the `Dockerfile`
2. The `Procfile` will run migrations and seeders automatically
3. Check deployment logs for any errors

### Step 5: Verify Backend Health

Visit: `https://your-backend.up.railway.app/api/health`

Expected response:
```json
{
  "status": "healthy",
  "timestamp": "2025-12-08T10:30:00Z",
  "service": "LegalKonect API"
}
```

---

## Frontend Deployment (Vercel)

### Step 1: Connect to Vercel

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Click "Add New" ’ "Project"
3. Import your GitHub repository
4. Set root directory to `frontend`
5. Framework Preset: Create React App

### Step 2: Configure Environment Variables

Add these in Vercel project settings:

```
REACT_APP_API_URL=https://legalkonect-backend.up.railway.app/api
REACT_APP_GOOGLE_MAPS_API_KEY=[your_google_maps_key]
REACT_APP_GOOGLE_CLIENT_ID=[your_google_client_id].apps.googleusercontent.com
REACT_APP_PAYMONGO_PUBLIC_KEY=pk_live_[your_key]
```

### Step 3: Deploy

1. Click "Deploy"
2. Vercel will automatically build and deploy
3. You'll get a URL like: `https://legalkonect.vercel.app`

### Step 4: Update Backend CORS

Go back to Railway and update:
```
FRONTEND_URL=https://legalkonect.vercel.app
SANCTUM_STATEFUL_DOMAINS=legalkonect.vercel.app
```

Redeploy Railway backend for changes to take effect.

---

## Post-Deployment Tasks

### 1. Verify Core Functionality 

Test these features:

- **Health Check**: Backend `/api/health` returns 200
- **User Registration**: Create a new user account
- **User Login**: Login with registered account
- **Lawyer Registration**: Register as a lawyer
- **File Upload**: Upload profile picture (tests R2)
- **Email**: Verify welcome email received (tests Resend)
- **Admin Access**: Login to admin dashboard
- **Lawyer Verification**: Admin can verify lawyer accounts
- **Appointment Booking**: Book an appointment

### 2. Test Google Services (Optional)

- **Google OAuth Login**: Lawyer login via Google
- **Google Calendar Sync**: Verify calendar integration works

### 3. Security Verification

- HTTPS enforced on all pages
- API returns JSON errors (not HTML)
- Session cookies are secure and httpOnly
- CORS properly configured
- No exposed credentials in code

### 4. Performance Checks

- API response times < 500ms
- Frontend loads < 3 seconds
- Images load quickly from R2
- Database queries are optimized

---

## Troubleshooting

### Common Issues

#### 1. "Invalid URI" Error During Migration

**Cause**: Missing Google credentials

**Solution**: This is expected! Google services fail gracefully when credentials are missing. If you need Google features:
1. Add Google credentials to Railway environment variables
2. Redeploy

#### 2. CORS Errors in Frontend

**Cause**: Mismatch between frontend URL and backend CORS settings

**Solution**:
1. Verify `FRONTEND_URL` in Railway matches your Vercel deployment URL
2. Update `SANCTUM_STATEFUL_DOMAINS` to match (without https://)
3. Redeploy Railway backend

#### 3. Database Connection Failed

**Cause**: MySQL service not running or wrong credentials

**Solution**:
1. Ensure MySQL database service is running in Railway
2. Verify Railway has injected MySQL variables
3. Check Railway logs for connection errors

#### 4. File Upload Fails

**Cause**: R2 credentials incorrect or bucket doesn't exist

**Solution**:
1. Verify R2 credentials in Railway
2. Create R2 bucket in Cloudflare dashboard
3. Ensure bucket name matches `AWS_BUCKET` variable
4. Test with a simple file upload

#### 5. Emails Not Sending

**Cause**: Resend API key invalid or email not verified

**Solution**:
1. Verify Resend API key in Railway
2. Verify sender email domain in Resend dashboard
3. Check Railway logs for email errors
4. Start with Resend's test domain for initial testing

---

## Monitoring & Maintenance

### Daily Tasks

- Check Railway logs for errors
- Monitor database size (Railway free tier: 1GB)
- Verify email delivery rates in Resend dashboard
- Check R2 storage usage

### Weekly Tasks

- Review application performance metrics
- Check for failed payment confirmations
- Verify lawyer verification queue
- Review user feedback and support tickets

### Monthly Tasks

- Database backup (Railway provides automatic backups)
- Review and rotate API keys if needed
- Update dependencies (security patches)
- Performance optimization review

### Backup Strategy

**Railway MySQL**:
- Automatic daily backups (retained for 7 days)
- Manual backup: Use Railway dashboard or mysqldump

**R2 Storage**:
- Configure Cloudflare R2 versioning
- Enable lifecycle policies for old files

**Environment Variables**:
- Keep secure copy of all environment variables
- Document any changes made post-deployment

---

## Rollback Procedure

If deployment fails or critical issues occur:

1. **Railway**: Click "Rollback" to previous deployment
2. **Vercel**: Go to Deployments ’ select previous version ’ "Promote to Production"
3. **Database**: Restore from Railway backup if schema changed
4. **Notify users**: If downtime > 5 minutes, send notification

---

## Support & Resources

- **Railway Docs**: https://docs.railway.app/
- **Vercel Docs**: https://vercel.com/docs
- **Laravel Docs**: https://laravel.com/docs
- **React Docs**: https://react.dev/

---

## Security Reminders  

1. **NEVER** commit `.env` files to Git
2. **ALWAYS** use strong, unique passwords for all services
3. **ROTATE** credentials if exposed or compromised
4. **MONITOR** logs for suspicious activity
5. **UPDATE** dependencies regularly for security patches
6. **USE** Railway's secret management for sensitive values
7. **ENABLE** 2FA on all service accounts (Railway, Vercel, Cloudflare, etc.)

---

## Deployment Checklist Summary

- [ ] All credentials rotated (Google, Resend, R2)
- [ ] Railway project created with MySQL database
- [ ] Backend environment variables configured
- [ ] Backend deployed successfully
- [ ] Backend health check passing
- [ ] Vercel project created
- [ ] Frontend environment variables configured
- [ ] Frontend deployed successfully
- [ ] CORS updated with final frontend URL
- [ ] User registration tested
- [ ] User login tested
- [ ] Lawyer registration tested
- [ ] File uploads tested (R2)
- [ ] Emails tested (Resend)
- [ ] Admin dashboard accessible
- [ ] Google OAuth tested (if enabled)
- [ ] No errors in Railway logs
- [ ] Performance acceptable
- [ ] Monitoring configured
- [ ] Backup strategy documented

---

**Last Updated**: 2025-12-08
**Version**: 1.0.0
**Prepared By**: Claude Code Deployment Assistant
