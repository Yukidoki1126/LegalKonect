# 🚂 Railway Deployment Guide for LegalKonect

## ✅ Pre-Deployment Readiness Check

### System Status: **READY FOR DEPLOYMENT** ✅

| Component | Status | Notes |
|-----------|--------|-------|
| MySQL Migrations | ✅ Ready | 49/49 migrations MySQL-compatible |
| Admin System | ✅ Fixed | Verification FK using users table |
| Branch Structure | ✅ Ready | production-hosting branch created |
| Dependencies | ✅ Ready | PHP 8.2, Laravel 12, React 19 |
| Configuration Files | ✅ Created | Procfile, nixpacks.toml, railway.json |
| Documentation | ✅ Complete | Migration guides, deployment strategy |

---

## 📋 What's Already Done

✅ **Database Migration to MySQL**
- All 49 migrations successfully converted from SQL Server
- Fixed SQL Server-specific syntax (GETDATE → NOW)
- Removed incompatible check constraints
- MariaDB/MySQL compatible

✅ **Admin Verification System Fixed**
- Foreign key constraint issue resolved
- Admin users properly migrated to users table
- Verification workflow working

✅ **Branch Management**
- `production-hosting` branch created and pushed
- `reservation-feature` as safe backup
- All critical fixes committed

✅ **Configuration Files Created**
- `Procfile` - Railway deployment command
- `nixpacks.toml` - PHP extensions and build steps
- `railway.json` - Railway configuration
- `.env.production.example` - Production environment template

---

## 🚀 Railway Deployment Steps

### Step 1: Sign Up for Railway

1. Go to https://railway.app
2. Sign in with GitHub
3. Authorize Railway to access your repositories

### Step 2: Create New Project

1. Click **"New Project"**
2. Select **"Deploy from GitHub repo"**
3. Choose **`Yukidoki1126/LegalKonect`**
4. Select branch: **`production-hosting`**

### Step 3: Add MySQL Database

1. In your Railway project, click **"+ New"**
2. Select **"Database"** → **"MySQL"**
3. Railway will automatically create MySQL service
4. Copy the connection variables (Railway provides these automatically)

### Step 4: Configure Backend Service

#### A. Set Root Directory
```
Root Directory: backend
```

#### B. Set Environment Variables

**Automatic from Railway:**
- `MYSQLHOST` - Auto-provided by Railway
- `MYSQLPORT` - Auto-provided by Railway
- `MYSQLDATABASE` - Auto-provided by Railway
- `MYSQLUSER` - Auto-provided by Railway
- `MYSQLPASSWORD` - Auto-provided by Railway

**Manual Configuration Required:**

```env
# Application
APP_NAME=LegalKonect
APP_ENV=production
APP_DEBUG=false
APP_URL=https://your-backend.up.railway.app

# Generate APP_KEY using: php artisan key:generate --show
APP_KEY=base64:your-generated-key-here

# Database (Railway auto-injects these)
DB_CONNECTION=mysql
DB_HOST=${MYSQLHOST}
DB_PORT=${MYSQLPORT}
DB_DATABASE=${MYSQLDATABASE}
DB_USERNAME=${MYSQLUSER}
DB_PASSWORD=${MYSQLPASSWORD}

# Frontend URL (add after frontend deployed)
FRONTEND_URL=https://your-frontend.up.railway.app
SANCTUM_STATEFUL_DOMAINS=your-frontend.up.railway.app

# Session & Cache
SESSION_DRIVER=database
CACHE_STORE=database
QUEUE_CONNECTION=database

# Email (Resend - sign up at resend.com)
MAIL_MAILER=resend
RESEND_KEY=re_your_resend_api_key
MAIL_FROM_ADDRESS=noreply@legalkonect.com
MAIL_FROM_NAME=LegalKonect

# Storage (S3 or Cloudflare R2)
FILESYSTEM_DISK=s3
AWS_ACCESS_KEY_ID=your_access_key
AWS_SECRET_ACCESS_KEY=your_secret_key
AWS_DEFAULT_REGION=ap-southeast-1
AWS_BUCKET=legalkonect-credentials
AWS_USE_PATH_STYLE_ENDPOINT=false

# PayMongo (sign up at paymongo.com)
PAYMONGO_PUBLIC_KEY=pk_test_your_key
PAYMONGO_SECRET_KEY=sk_test_your_key
PAYMONGO_WEBHOOK_SECRET=whsec_your_secret

# Google Calendar API (from console.cloud.google.com)
GOOGLE_CLIENT_ID=your_client_id
GOOGLE_CLIENT_SECRET=your_client_secret
GOOGLE_REDIRECT_URI=https://your-backend.up.railway.app/api/google/callback

# Google OAuth
GOOGLE_OAUTH_CLIENT_ID=your_oauth_client_id
GOOGLE_OAUTH_CLIENT_SECRET=your_oauth_secret

# Document Encryption (generate 32-char random string)
ENCRYPTION_KEY=your-32-character-encryption-key
```

#### C. Build Configuration
Railway will auto-detect from `nixpacks.toml`

### Step 5: Deploy Frontend

1. Click **"+ New"** → **"GitHub Repo"**
2. Select **`Yukidoki1126/LegalKonect`**
3. Branch: **`production-hosting`**

#### Frontend Environment Variables:

```env
# Root Directory
Root Directory: frontend

# Environment Variables
REACT_APP_API_URL=https://your-backend.up.railway.app/api
REACT_APP_GOOGLE_CLIENT_ID=your_google_oauth_client_id
```

### Step 6: Run Database Migrations

After backend is deployed, Railway automatically runs:
```bash
php artisan migrate --force
```

This is configured in the `Procfile`.

**Alternatively, use Railway CLI:**
```bash
# Install Railway CLI
npm i -g @railway/cli

# Login
railway login

# Link to project
railway link

# Run migrations manually
railway run php artisan migrate --force

# Seed database
railway run php artisan db:seed --class=SpecializationsSeeder
railway run php artisan db:seed --class=FAQSeeder
```

### Step 7: Create Admin Account

```bash
# Via Railway shell or CLI
railway run php artisan tinker

# In tinker:
DB::table('admins')->insert([
    'name' => 'Super Admin',
    'email' => 'admin@legalkonect.com',
    'password' => bcrypt('your-secure-password'),
    'role' => 'super_admin',
    'is_active' => true,
    'created_at' => now(),
    'updated_at' => now()
]);

# Also add to users table
DB::table('users')->insert([
    'name' => 'Super Admin',
    'email' => 'admin@legalkonect.com',
    'password' => bcrypt('your-secure-password'),
    'role' => 'super_admin',
    'status' => 'active',
    'created_at' => now(),
    'updated_at' => now()
]);
```

---

## 🔐 Setting Up Cloudflare R2 (Recommended for Documents)

### Why R2 Instead of S3?
- ✅ Same S3-compatible API
- ✅ **FREE egress** (no download fees)
- ✅ Cheaper storage ($0.015/GB vs S3's $0.023/GB)
- ✅ Fast for Philippines region

### Setup Steps:

1. **Create R2 Bucket:**
   - Go to https://dash.cloudflare.com
   - Navigate to R2
   - Click **"Create bucket"**
   - Name: `legalkonect-credentials`
   - Location: Automatic (best performance)

2. **Get API Credentials:**
   - Click **"Manage R2 API Tokens"**
   - Create new token with read/write permissions
   - Copy Access Key ID and Secret Access Key

3. **Configure Laravel:**
   ```env
   FILESYSTEM_DISK=s3
   AWS_ACCESS_KEY_ID=your_r2_access_key_id
   AWS_SECRET_ACCESS_KEY=your_r2_secret_access_key
   AWS_DEFAULT_REGION=auto
   AWS_BUCKET=legalkonect-credentials
   AWS_ENDPOINT=https://YOUR_ACCOUNT_ID.r2.cloudflarestorage.com
   AWS_USE_PATH_STYLE_ENDPOINT=false
   ```

4. **Install S3 Package (already in composer.json):**
   ```bash
   composer require league/flysystem-aws-s3-v3 "^3.0"
   ```

---

## 📧 Setting Up Email (Resend)

1. Sign up at https://resend.com
2. Verify your domain (or use test domain)
3. Create API key
4. Add to Railway environment:
   ```env
   RESEND_KEY=re_your_api_key_here
   ```

---

## 💳 Setting Up PayMongo

1. Sign up at https://paymongo.com
2. Get test API keys from dashboard
3. Add to Railway environment:
   ```env
   PAYMONGO_PUBLIC_KEY=pk_test_...
   PAYMONGO_SECRET_KEY=sk_test_...
   ```
4. For production, switch to live keys

---

## 🔍 Post-Deployment Verification

### 1. Check Backend Health
```bash
curl https://your-backend.up.railway.app/api/health
```

### 2. Check Database Connection
```bash
railway run php artisan migrate:status
```

### 3. Test Frontend
- Visit `https://your-frontend.up.railway.app`
- Try login
- Check admin dashboard

### 4. Test Lawyer Registration
- Register as lawyer
- Upload documents
- Verify encryption working

### 5. Test Payments
- Use test card: `4120 0000 0000 0007`
- CVV: any 3 digits
- Expiry: any future date

---

## 🆘 Troubleshooting

### Issue: Migrations Fail
```bash
# Check database connection
railway run php artisan tinker
>>> DB::connection()->getPdo();

# Run migrations with verbose output
railway run php artisan migrate --force -vvv
```

### Issue: Storage Not Working
```bash
# Test S3/R2 connection
railway run php artisan tinker
>>> Storage::disk('s3')->put('test.txt', 'Hello');
>>> Storage::disk('s3')->exists('test.txt');
```

### Issue: Admin Can't Login
- Check if admin exists in both `admins` and `users` tables
- Verify password hash is correct
- Check `SANCTUM_STATEFUL_DOMAINS` matches frontend URL

---

## 📊 Monitoring

### Railway Dashboard
- View logs: Click on service → **"Logs"** tab
- Check metrics: **"Metrics"** tab
- Database backups: MySQL service → **"Backups"**

### Laravel Logging
```bash
# View real-time logs
railway logs

# View specific service
railway logs --service backend
```

---

## 💰 Estimated Monthly Costs

| Service | Cost |
|---------|------|
| Railway (Hobby Plan) | $5/month |
| MySQL Database | Included |
| Cloudflare R2 (100GB) | ~$1.50/month |
| Resend (Email - 3000/month) | FREE |
| PayMongo | Transaction fees only |
| **Total** | **~$6.50/month** |

---

## ✅ Ready to Deploy?

Your system is **100% ready** for Railway deployment!

**Final Checklist:**
- [ ] Railway account created
- [ ] GitHub repo connected
- [ ] MySQL database added
- [ ] Backend environment variables set
- [ ] Frontend environment variables set
- [ ] S3/R2 bucket created
- [ ] Email service configured
- [ ] PayMongo keys obtained
- [ ] Google OAuth configured
- [ ] Migrations run successfully
- [ ] Admin account created
- [ ] Test appointment booked

**Next Step:** Go to https://railway.app and click "New Project"! 🚀

---

**Need Help?**
- Railway Docs: https://docs.railway.app
- Laravel Deployment: https://laravel.com/docs/deployment
- This project's issues: https://github.com/Yukidoki1126/LegalKonect/issues
