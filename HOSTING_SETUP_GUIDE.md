# LegalKonect Hosting Setup Guide

This guide will help you deploy LegalKonect with:
- **Railway** - Backend (Laravel API)
- **Vercel** - Frontend (React)
- **Cloudflare R2** - Storage (Encrypted lawyer credentials)

## 📋 Prerequisites

Before starting, you'll need:
1. Railway account (https://railway.app)
2. Vercel account (https://vercel.com)
3. Cloudflare account with R2 enabled (https://cloudflare.com)
4. MySQL database (Railway provides this)

---

## 🗄️ Step 1: Set Up Cloudflare R2 Storage

Cloudflare R2 is S3-compatible storage for encrypted lawyer credentials.

### 1.1 Create R2 Bucket

1. Log in to Cloudflare Dashboard
2. Go to **R2 Object Storage**
3. Click **Create bucket**
4. Name: `legalkonect-credentials` (or your preferred name)
5. Location: Choose closest to your users
6. Click **Create bucket**

### 1.2 Generate R2 API Tokens

1. In R2 dashboard, click **Manage R2 API Tokens**
2. Click **Create API token**
3. Token name: `legalkonect-backend`
4. Permissions: **Object Read & Write**
5. Specify bucket: Select your bucket
6. Click **Create API Token**
7. **IMPORTANT**: Copy these values (you can't see them again):
   - `Access Key ID`
   - `Secret Access Key`
   - `Endpoint URL` (format: `https://<account-id>.r2.cloudflarestorage.com`)

### 1.3 Configure Public Access (Optional)

For profile pictures and GCash QR codes that need to be publicly accessible:

1. Go to your bucket → **Settings**
2. Under **Public access**, click **Allow Access**
3. Note the public URL: `https://pub-<id>.r2.dev`

---

## 🚂 Step 2: Deploy Backend to Railway

### 2.1 Create Railway Project

1. Go to https://railway.app
2. Click **New Project**
3. Select **Deploy from GitHub repo**
4. Connect your GitHub account
5. Select your `legalkonect` repository
6. Railway will detect the Laravel app

### 2.2 Add MySQL Database

1. In your Railway project, click **New**
2. Select **Database** → **MySQL**
3. Railway will automatically create a MySQL instance
4. Note: Database credentials are automatically injected

### 2.3 Configure Environment Variables

In Railway dashboard, go to your backend service → **Variables** and add:

#### Required Variables

```env
# App Configuration
APP_NAME=LegalKonect
APP_ENV=production
APP_KEY=base64:YOUR_APP_KEY_HERE
APP_DEBUG=false
APP_URL=https://your-backend.up.railway.app

# Document Encryption Key (IMPORTANT: Same as local)
DOCUMENT_ENCRYPTION_KEY=base64:sIrk+RzEacYWu1HLGLg16X2yPCzA9yFoAsJ8XbO6kRY=

# Frontend URL (will be your Vercel URL)
FRONTEND_URL=https://your-app.vercel.app
SANCTUM_STATEFUL_DOMAINS=your-app.vercel.app

# Database (Railway auto-injects these, but you can override)
DB_CONNECTION=mysql
DB_HOST=${{MYSQL_HOST}}
DB_PORT=${{MYSQL_PORT}}
DB_DATABASE=${{MYSQL_DATABASE}}
DB_USERNAME=${{MYSQL_USER}}
DB_PASSWORD=${{MYSQL_PASSWORD}}

# Session & Cache
SESSION_DRIVER=database
CACHE_STORE=database
QUEUE_CONNECTION=database

# Storage - Cloudflare R2
FILESYSTEM_DISK=r2
AWS_ACCESS_KEY_ID=your_r2_access_key_id
AWS_SECRET_ACCESS_KEY=your_r2_secret_access_key
AWS_DEFAULT_REGION=auto
AWS_BUCKET=legalkonect-credentials
AWS_ENDPOINT=https://your-account-id.r2.cloudflarestorage.com
AWS_URL=https://pub-your-id.r2.dev
AWS_USE_PATH_STYLE_ENDPOINT=false

# Email (Resend)
MAIL_MAILER=resend
RESEND_KEY=your_resend_api_key_here
MAIL_FROM_ADDRESS=onboarding@resend.dev
MAIL_FROM_NAME=LegalKonect

# Google OAuth
GOOGLE_CLIENT_ID=your_google_client_id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your_google_client_secret
GOOGLE_REDIRECT_URI=https://your-backend.up.railway.app/api/google/callback
GOOGLE_AUTH_REDIRECT_URI=https://your-backend.up.railway.app/api/auth/google/callback

# Cloudinary (for profile pictures - optional if using R2)
CLOUDINARY_CLOUD_NAME=your_cloudinary_cloud_name
CLOUDINARY_API_KEY=your_cloudinary_api_key
CLOUDINARY_API_SECRET=your_cloudinary_api_secret
```

### 2.4 Configure Build & Deploy

Railway should auto-detect Laravel, but verify:

**Root Directory**: `backend`

**Build Command**: (Handled by Nixpacks automatically)

**Start Command**: Already configured in `Procfile`

### 2.5 Run Migrations

After first deployment:

1. Go to Railway project → Backend service
2. Open **Settings** → **Deploy**
3. In the deployment logs, you'll see migrations run automatically via `railway/init-app.sh`

Or manually run:
```bash
php artisan migrate --force
php artisan db:seed --class=SuperAdminSeeder --force
```

---

## ▲ Step 3: Deploy Frontend to Vercel

### 3.1 Create Vercel Project

1. Go to https://vercel.com
2. Click **Add New** → **Project**
3. Import your GitHub repository
4. Select `legalkonect` repo

### 3.2 Configure Project Settings

**Framework Preset**: Create React App

**Root Directory**: `frontend`

**Build Command**: `npm run build`

**Output Directory**: `build`

**Install Command**: `npm install`

### 3.3 Configure Environment Variables

In Vercel project → **Settings** → **Environment Variables**, add:

```env
# API Configuration (Use your Railway backend URL)
REACT_APP_API_URL=https://your-backend.up.railway.app/api

# Google Services
REACT_APP_GOOGLE_MAPS_API_KEY=your_google_maps_api_key
REACT_APP_GOOGLE_CLIENT_ID=your_google_client_id.apps.googleusercontent.com

# PayMongo (Not actively used - manual payment system)
REACT_APP_PAYMONGO_PUBLIC_KEY=your_paymongo_public_key
```

### 3.4 Deploy

1. Click **Deploy**
2. Vercel will build and deploy your frontend
3. Note your deployment URL: `https://your-app.vercel.app`

### 3.5 Update Backend URLs

Go back to Railway and update:
- `FRONTEND_URL=https://your-app.vercel.app`
- `SANCTUM_STATEFUL_DOMAINS=your-app.vercel.app`

---

## 🔧 Step 4: Configure Laravel for R2

### 4.1 Install Required Package

The S3 driver should already be installed, but verify:

```bash
composer require league/flysystem-aws-s3-v3
```

### 4.2 Add R2 Disk Configuration

The `config/filesystems.php` already has S3 configuration. Add a dedicated R2 disk:

```php
'r2' => [
    'driver' => 's3',
    'key' => env('AWS_ACCESS_KEY_ID'),
    'secret' => env('AWS_SECRET_ACCESS_KEY'),
    'region' => env('AWS_DEFAULT_REGION', 'auto'),
    'bucket' => env('AWS_BUCKET'),
    'url' => env('AWS_URL'),
    'endpoint' => env('AWS_ENDPOINT'),
    'use_path_style_endpoint' => env('AWS_USE_PATH_STYLE_ENDPOINT', false),
    'throw' => false,
    'report' => false,
],
```

### 4.3 Update Storage References

All encrypted lawyer credentials are stored via `EncryptionService`. Verify it uses the configured disk:

```php
// In app/Services/EncryptionService.php
Storage::disk(config('filesystems.default'))->put($path, $encrypted);
```

---

## ✅ Step 5: Verify Deployment

### 5.1 Backend Health Check

Visit: `https://your-backend.up.railway.app/api/health`

Should return: `{"status": "ok"}`

### 5.2 Frontend Check

Visit: `https://your-app.vercel.app`

Should load the LegalKonect homepage

### 5.3 Test Features

1. **User Registration** - Create a test account
2. **Lawyer Registration** - Upload credentials (should go to R2)
3. **Login** - Test authentication
4. **Appointments** - Test booking flow
5. **Admin Panel** - Verify admin access

---

## 🔒 Security Checklist

- [ ] `APP_DEBUG=false` in production
- [ ] `DOCUMENT_ENCRYPTION_KEY` is secure and matches local
- [ ] R2 bucket has proper permissions
- [ ] CORS configured in Laravel for Vercel domain
- [ ] Google OAuth redirect URLs updated
- [ ] Database credentials secured
- [ ] API rate limiting enabled
- [ ] SSL/HTTPS enabled (automatic on Railway/Vercel)

---

## 🚨 Troubleshooting

### Issue: CORS Errors

**Solution**: Update `config/cors.php`:

```php
'allowed_origins' => [env('FRONTEND_URL')],
'supports_credentials' => true,
```

### Issue: Storage Upload Fails

**Solution**:
1. Verify R2 credentials in Railway environment
2. Check bucket permissions
3. Verify endpoint URL format

### Issue: Migrations Failed

**Solution**:
1. Check Railway logs
2. Manually run: `php artisan migrate --force`
3. Verify database connection variables

### Issue: Session/Auth Issues

**Solution**:
1. Verify `SANCTUM_STATEFUL_DOMAINS` matches Vercel domain
2. Check `SESSION_DOMAIN` is null or matches
3. Verify cookies are being set

---

## 📊 Monitoring

### Railway

- Monitor logs: Railway Dashboard → Service → Logs
- View metrics: CPU, Memory, Network
- Set up alerts for downtime

### Vercel

- Analytics: Vercel Dashboard → Analytics
- Function logs for API routes
- Performance insights

### Cloudflare R2

- Storage usage: R2 Dashboard → Bucket → Metrics
- Request analytics
- Bandwidth monitoring

---

## 💰 Estimated Costs

### Railway (Backend + Database)
- **Hobby Plan**: $5/month (500 hours included)
- **Pro Plan**: $20/month (unlimited hours)

### Vercel (Frontend)
- **Hobby**: Free (100 GB bandwidth)
- **Pro**: $20/month (1 TB bandwidth)

### Cloudflare R2 (Storage)
- **Storage**: $0.015/GB/month
- **Operations**: Free (10M class A, 10M class B per month)
- **Egress**: Free (no bandwidth charges!)

**Total Estimated**: ~$5-25/month depending on usage

---

## 🎯 Next Steps

1. Set up custom domain (optional)
2. Configure CDN (Cloudflare)
3. Set up automated backups
4. Configure monitoring & alerts
5. Set up CI/CD pipeline
6. Performance optimization

---

## 📝 Important Notes

### Encrypted Credentials

The `DOCUMENT_ENCRYPTION_KEY` in your `.env` must **NEVER** change once lawyers have uploaded credentials. If it changes, existing encrypted files cannot be decrypted.

### Backup Strategy

1. **Database**: Railway provides automatic backups
2. **R2 Storage**: Enable R2 object versioning
3. **Environment Variables**: Keep secure backup of all `.env` values

### Scaling Considerations

- Railway auto-scales based on traffic
- Vercel auto-scales globally
- R2 scales automatically
- Consider Redis for caching if needed

---

## 🆘 Support

- Railway: https://railway.app/help
- Vercel: https://vercel.com/support
- Cloudflare: https://support.cloudflare.com

