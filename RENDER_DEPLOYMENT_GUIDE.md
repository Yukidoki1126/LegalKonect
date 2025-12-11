# LegalKonect - Render Deployment Guide

This guide will help you deploy your LegalKonect application to Render.

## 📋 Prerequisites

- Render account (sign up at https://render.com)
- GitHub repository (push your code to GitHub)
- Google Cloud Console access (for OAuth and Maps API)
- Resend account for email (or another email service)

---

## 🚀 Part 1: Deploying the Backend (Laravel API)

### Step 1: Create a New Render Project

1. Go to https://dashboard.render.com
2. Click "New +" → "Web Service"
3. Connect your GitHub repository
4. Select your `legalkonect` repository

### Step 2: Configure Backend Service

**Service Settings:**
- **Name:** `legalkonect-backend`
- **Region:** Choose closest to your users
- **Branch:** `main` or `develop`
- **Root Directory:** `backend`
- **Runtime:** `Docker`
- **Dockerfile Path:** `./Dockerfile`

**Instance Type:**
- Start with **Free** tier for testing
- Upgrade to **Starter ($7/month)** or higher for production

### Step 3: Add MySQL Database

1. In Render Dashboard, click "New +" → "PostgreSQL" or "MySQL"
   - **Note:** Render doesn't offer MySQL directly. Use PostgreSQL or external MySQL.
   - **Alternative:** Use [PlanetScale](https://planetscale.com) (free tier) or [Railway](https://railway.app) for MySQL

2. For PostgreSQL on Render:
   - Name: `legalkonect-db`
   - Database: `legalkonect`
   - User: `legalkonect`
   - Region: Same as backend
   - Plan: Free (for testing) or Starter ($7/month)

3. After creation, copy the **Internal Database URL**

### Step 4: Configure Environment Variables

In your backend service settings, go to "Environment" and add these variables:

#### Required Variables:

```env
# Application
APP_NAME=LegalKonect
APP_ENV=production
APP_DEBUG=false
APP_URL=https://your-backend-url.onrender.com
FRONTEND_URL=https://your-frontend-url.onrender.com

# Database (if using PostgreSQL on Render)
DB_CONNECTION=pgsql
DB_HOST=<from_render_database>
DB_PORT=5432
DB_DATABASE=legalkonect
DB_USERNAME=<from_render_database>
DB_PASSWORD=<from_render_database>

# OR if using external MySQL (PlanetScale/Railway)
# DB_CONNECTION=mysql
# DB_HOST=<your_mysql_host>
# DB_PORT=3306
# DB_DATABASE=<your_database_name>
# DB_USERNAME=<your_username>
# DB_PASSWORD=<your_password>

# CORS (comma-separated, no spaces)
CORS_ALLOWED_ORIGINS=https://your-frontend-url.onrender.com,https://your-custom-domain.com

# Sanctum (comma-separated, no spaces)
SANCTUM_STATEFUL_DOMAINS=your-frontend-url.onrender.com,your-custom-domain.com

# Session & Cache
SESSION_DRIVER=database
SESSION_LIFETIME=120
SESSION_ENCRYPT=false
CACHE_STORE=database
QUEUE_CONNECTION=database

# Mail (Resend)
MAIL_MAILER=resend
RESEND_KEY=re_your_resend_api_key_here
MAIL_FROM_ADDRESS=noreply@yourdomain.com
MAIL_FROM_NAME=LegalKonect

# Google OAuth & Calendar
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
GOOGLE_REDIRECT_URI=https://your-backend-url.onrender.com/api/google/callback
GOOGLE_OAUTH_CLIENT_ID=your_google_oauth_client_id
GOOGLE_OAUTH_CLIENT_SECRET=your_google_oauth_client_secret

# Storage
FILESYSTEM_DISK=local

# Logging
LOG_CHANNEL=stack
LOG_LEVEL=info
```

#### Auto-Generated:
- `APP_KEY` - Render can generate this automatically if you select "Generate Value"

### Step 5: Deploy Backend

1. Click "Create Web Service"
2. Render will build your Docker container and deploy
3. Wait for the build to complete (5-10 minutes)
4. Check logs for any errors

### Step 6: Run Database Migrations

The Dockerfile is configured to run migrations automatically on startup. Check the logs to confirm:

```
Running migrations...
Migration complete
```

If migrations fail, you can run them manually via Render Shell:
1. Go to your service → "Shell" tab
2. Run: `php artisan migrate --force`

---

## 🎨 Part 2: Deploying the Frontend (React)

### Step 1: Create Frontend Service

1. In Render Dashboard, click "New +" → "Static Site"
2. Connect the same GitHub repository
3. Select your `legalkonect` repository

### Step 2: Configure Frontend Service

**Service Settings:**
- **Name:** `legalkonect-frontend`
- **Branch:** `main` or `develop`
- **Root Directory:** Leave empty (or set to root)
- **Build Command:** 
  ```bash
  cd frontend && npm install && npm run build
  ```
- **Publish Directory:** `frontend/build`

### Step 3: Configure Environment Variables

Add these environment variables in the frontend service:

```env
REACT_APP_API_URL=https://your-backend-url.onrender.com/api
REACT_APP_STORAGE_URL=https://your-backend-url.onrender.com
REACT_APP_GOOGLE_MAPS_API_KEY=your_google_maps_api_key
```

### Step 4: Configure Routing (SPA Support)

Render automatically handles client-side routing for React apps, but ensure your `render.yaml` has:

```yaml
routes:
  - type: rewrite
    source: /*
    destination: /index.html
```

### Step 5: Deploy Frontend

1. Click "Create Static Site"
2. Render will build and deploy your React app
3. Wait for build to complete (3-5 minutes)

---

## 🔧 Part 3: Post-Deployment Configuration

### Update Google OAuth Redirect URIs

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Navigate to **APIs & Services** → **Credentials**
3. Edit your OAuth 2.0 Client ID
4. Add Authorized Redirect URIs:
   ```
   https://your-backend-url.onrender.com/api/google/callback
   ```
5. Add Authorized JavaScript Origins:
   ```
   https://your-frontend-url.onrender.com
   ```

### Update Google Maps API

1. In Google Cloud Console, go to **APIs & Services** → **Credentials**
2. Edit your API Key
3. Under "Application restrictions" → "HTTP referrers"
4. Add:
   ```
   https://your-frontend-url.onrender.com/*
   ```

### Test Your Deployment

1. Visit your frontend URL
2. Test user registration and login
3. Test lawyer registration with document upload
4. Test appointment booking
5. Test payment flows
6. Check that emails are being sent

---

## 🗄️ Part 4: File Storage Considerations

### Default (Local Storage - Ephemeral)

**Current Setup:**
- Files stored in `storage/app/private/`
- **⚠️ Warning:** Files will be lost on redeploy or service restart

**Good For:**
- Testing and development
- Non-critical uploads

**Not Good For:**
- Production lawyer documents
- Payment proofs
- Profile pictures

### Option 1: Render Persistent Disk (Paid)

1. In your backend service, go to "Disks"
2. Click "Add Disk"
3. Configure:
   - **Name:** `legalkonect-storage`
   - **Mount Path:** `/var/storage`
   - **Size:** 1-10 GB (based on needs)
   - **Cost:** ~$0.25/GB/month

4. Update `backend/config/filesystems.php`:
   ```php
   'disks' => [
       'render' => [
           'driver' => 'local',
           'root' => env('RENDER_DISK_PATH', '/var/storage'),
       ],
   ],
   ```

5. Add to backend environment variables:
   ```env
   FILESYSTEM_DISK=render
   RENDER_DISK_PATH=/var/storage
   ```

### Option 2: AWS S3 (Recommended for Production)

**Free Tier:** 5GB storage, 20,000 GET requests, 2,000 PUT requests per month

1. Create AWS S3 Bucket:
   - Go to [AWS S3 Console](https://s3.console.aws.amazon.com)
   - Create bucket with private access
   - Enable versioning (optional)

2. Create IAM User with S3 access:
   - Go to IAM → Users → Add User
   - Attach policy: `AmazonS3FullAccess` (or create custom restrictive policy)
   - Save Access Key ID and Secret Access Key

3. Update backend environment variables:
   ```env
   FILESYSTEM_DISK=s3
   AWS_ACCESS_KEY_ID=your_access_key_id
   AWS_SECRET_ACCESS_KEY=your_secret_access_key
   AWS_DEFAULT_REGION=us-east-1
   AWS_BUCKET=your-bucket-name
   AWS_USE_PATH_STYLE_ENDPOINT=false
   ```

4. Laravel S3 is already configured in `config/filesystems.php`

5. Install AWS SDK (if not already):
   ```bash
   composer require league/flysystem-aws-s3-v3
   ```

### Option 3: Backblaze B2 (Cheapest)

**Free Tier:** 10GB storage, 1GB download/day

- Similar to S3 but cheaper for larger storage
- S3-compatible API
- Configuration similar to S3 option

---

## 📊 Part 5: Monitoring & Maintenance

### Check Application Health

Render provides a health check endpoint. Your backend already has:
- Health endpoint: `https://your-backend-url.onrender.com/up`

### View Logs

1. Go to service → "Logs" tab
2. Monitor for errors or issues
3. Enable log shipping for long-term storage (paid feature)

### Performance Monitoring

- Render provides basic metrics (CPU, memory, requests)
- Consider adding [Sentry](https://sentry.io) for error tracking
- Use [New Relic](https://newrelic.com) or [DataDog](https://datadoghq.com) for APM (optional)

### Backup Database

**For Render PostgreSQL:**
- Automatic daily backups on paid plans
- Manual backup: Service → "Backups" → "Create Backup"

**For External MySQL:**
- Set up automatic backups with your provider
- Use `mysqldump` for manual backups

---

## 🔒 Part 6: Security Checklist

- [x] `APP_DEBUG=false` in production
- [x] `APP_ENV=production`
- [x] CORS configured with specific origins (not `*`)
- [x] HTTPS enabled (automatic on Render)
- [x] Sanctum stateful domains configured
- [x] Database credentials secured (environment variables)
- [x] API keys not hardcoded
- [x] File uploads validated and encrypted
- [x] Rate limiting enabled (Laravel default)
- [ ] Enable CSRF protection for forms
- [ ] Regular security updates (`composer update`, `npm audit fix`)

---

## 💰 Part 7: Cost Estimation

### Free Tier (Testing Only)
- Backend: Free (sleeps after inactivity)
- Frontend: Free
- Database: Free (750 hours/month)
- **Total:** $0/month
- **Limitations:** Services sleep, not suitable for production

### Starter Tier (Production Ready)
- Backend: $7/month (always on)
- Frontend: Free
- Database: $7/month (PostgreSQL) or external MySQL
- Persistent Disk: $2.50/month (10GB)
- **Total:** ~$16.50/month

### With S3 Storage (Recommended)
- Backend: $7/month
- Frontend: Free
- Database: $7/month
- S3: ~$0-5/month (depends on usage)
- **Total:** ~$14-19/month

---

## 🆘 Common Issues & Solutions

### Issue: CORS Errors

**Solution:**
1. Verify `CORS_ALLOWED_ORIGINS` includes your frontend URL
2. Check `SANCTUM_STATEFUL_DOMAINS` is correct
3. Ensure no trailing slashes in URLs
4. Clear browser cache

### Issue: 502 Bad Gateway

**Solution:**
1. Check backend logs for errors
2. Verify database connection
3. Ensure migrations ran successfully
4. Check Dockerfile build logs

### Issue: Static Files 404

**Solution:**
1. Run `php artisan storage:link` (if using public storage)
2. Verify `FILESYSTEM_DISK` configuration
3. Check file permissions

### Issue: Email Not Sending

**Solution:**
1. Verify `RESEND_KEY` is correct
2. Check Resend dashboard for errors
3. Verify sender email domain is verified
4. Check Laravel logs: `storage/logs/laravel.log`

### Issue: File Uploads Lost After Redeploy

**Solution:**
- Use Render Persistent Disk or S3 (see Part 4)

---

## 📚 Additional Resources

- [Render Documentation](https://render.com/docs)
- [Laravel Deployment](https://laravel.com/docs/deployment)
- [React Deployment](https://create-react-app.dev/docs/deployment/)

---

## ✅ Deployment Checklist

Before going live:

### Backend
- [ ] Environment variables configured
- [ ] Database connected and migrated
- [ ] CORS and Sanctum configured
- [ ] Email service configured and tested
- [ ] Google OAuth configured
- [ ] File storage configured
- [ ] APP_DEBUG=false
- [ ] Health check endpoint working

### Frontend
- [ ] API_URL points to production backend
- [ ] Google Maps API key configured
- [ ] Build successful
- [ ] All pages load correctly
- [ ] Client-side routing works

### Testing
- [ ] User registration works
- [ ] Lawyer registration works
- [ ] Document upload works
- [ ] Login/logout works
- [ ] Appointments can be booked
- [ ] Payments can be processed
- [ ] Emails are being sent
- [ ] Admin panel accessible

### Security
- [ ] HTTPS enabled
- [ ] Secrets secured
- [ ] CORS properly configured
- [ ] Database secured

---

## 🎉 Next Steps

After successful deployment:

1. **Custom Domain** (Optional)
   - Purchase domain from Namecheap, Google Domains, etc.
   - Configure DNS in Render
   - Update environment variables with new domain

2. **SSL Certificate**
   - Automatic with Render for custom domains

3. **Monitoring**
   - Set up Sentry for error tracking
   - Configure uptime monitoring

4. **Backups**
   - Enable automatic database backups
   - Set up file storage backups

5. **Performance**
   - Enable Redis for caching (optional, paid)
   - Configure CDN for static assets (optional)

---

**Congratulations! Your LegalKonect application is now live on Render! 🚀**
