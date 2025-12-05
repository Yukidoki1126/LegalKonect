# 🚀 Simple Railway Deployment Guide - LegalKonect

## ✅ Your System Uses MANUAL PAYMENT

**Important:** Your system does NOT use PayMongo or any payment gateway!

**Payment Flow:**
1. Client books appointment
2. Client pays via **GCash or Bank Transfer** to lawyer
3. Client **uploads payment proof** (screenshot of receipt)
4. Lawyer **confirms payment** manually in dashboard
5. Appointment confirmed!

---

## 📋 What You Need to Sign Up For

### Required (3 services only!):
1. ✅ **Railway** - Hosting (Free $5 credits)
2. ✅ **Cloudflare R2** - Document & Payment Proof Storage
3. ✅ **Resend** - Email Notifications

### Optional:
4. ⚪ **Google Cloud** - Calendar integration (can add later)

**No PayMongo needed!** ❌

---

## 🚀 Quick Deployment Steps

### **Step 1: Railway (5 minutes)**

1. Go to https://railway.app
2. Click "Login with GitHub"
3. Click "New Project" → "Deploy from GitHub repo"
4. Select: `Yukidoki1126/LegalKonect`
5. Branch: `production-hosting`
6. Click "+ New" → "Database" → "MySQL"

**Done! Railway is deploying...** ✅

---

### **Step 2: Cloudflare R2 (5 minutes)**

**Why R2?** Stores lawyer IDs, payment proof screenshots, encrypted documents

1. Go to https://dash.cloudflare.com
2. Sign up (free)
3. Click "R2" in sidebar
4. Click "Create bucket"
   - Name: `legalkonect-storage`
   - Click "Create"
5. Click "Manage R2 API Tokens"
6. Click "Create API Token"
   - Name: `LegalKonect`
   - Permissions: "Object Read & Write"
   - Click "Create"
7. **SAVE THESE** (copy to notepad):
   - Access Key ID: `xxxxxxxxx`
   - Secret Access Key: `xxxxxxxxx`
   - Endpoint: `https://xxxxxxxxx.r2.cloudflarestorage.com`

**Done!** ✅

---

### **Step 3: Resend Email (3 minutes)**

**Why Resend?** Sends appointment confirmations, notifications

1. Go to https://resend.com
2. Sign up (free)
3. Click "API Keys" → "Create API Key"
   - Name: `LegalKonect`
   - Click "Create"
4. **SAVE THIS**:
   - API Key: `re_xxxxxxxxx`

**Done!** ✅

---

### **Step 4: Configure Railway Backend (10 minutes)**

1. In Railway, click on your **backend service**
2. Go to **"Settings"**
   - Set Root Directory: `backend`
3. Go to **"Variables"** tab
4. Add these variables:

```env
# Basic Config
APP_NAME=LegalKonect
APP_ENV=production
APP_DEBUG=false

# Generate APP_KEY (click "+ Variable" → "Generate")
APP_KEY=(Railway will generate this)

# Database (Railway auto-provides these)
DB_CONNECTION=mysql
DB_HOST=${{MYSQLHOST}}
DB_PORT=${{MYSQLPORT}}
DB_DATABASE=${{MYSQLDATABASE}}
DB_USERNAME=${{MYSQLUSER}}
DB_PASSWORD=${{MYSQLPASSWORD}}

# Storage (your R2 credentials from Step 2)
FILESYSTEM_DISK=s3
AWS_ACCESS_KEY_ID=your_r2_access_key
AWS_SECRET_ACCESS_KEY=your_r2_secret_key
AWS_DEFAULT_REGION=auto
AWS_BUCKET=legalkonect-storage
AWS_ENDPOINT=https://your-account-id.r2.cloudflarestorage.com
AWS_USE_PATH_STYLE_ENDPOINT=false

# Email (your Resend key from Step 3)
MAIL_MAILER=resend
RESEND_KEY=re_your_key
MAIL_FROM_ADDRESS=noreply@legalkonect.com
MAIL_FROM_NAME=LegalKonect

# Session & Cache
SESSION_DRIVER=database
CACHE_STORE=database
QUEUE_CONNECTION=database
```

5. Get your backend URL:
   - Go to "Settings" → "Networking"
   - Click "Generate Domain"
   - Copy URL: `https://xxxxxx.up.railway.app`

6. Add these variables:
```env
APP_URL=https://your-backend-url.up.railway.app
```

**Done!** ✅

---

### **Step 5: Configure Railway Frontend (5 minutes)**

1. In Railway, click "+ New" → "GitHub Repo"
2. Select: `Yukidoki1126/LegalKonect`
3. Branch: `production-hosting`
4. In frontend service:
   - Settings → Root Directory: `frontend`
5. Go to "Variables" tab:

```env
REACT_APP_API_URL=https://your-backend-url.up.railway.app/api
```

6. Get your frontend URL:
   - Settings → Networking
   - Click "Generate Domain"
   - Copy URL: `https://xxxxxx.up.railway.app`

7. Go back to **backend service** → Variables:
```env
FRONTEND_URL=https://your-frontend-url.up.railway.app
SANCTUM_STATEFUL_DOMAINS=your-frontend-url.up.railway.app
```

**Done!** ✅

---

### **Step 6: Setup Database (5 minutes)**

1. Install Railway CLI:
```bash
npm install -g @railway/cli
```

2. Login and link:
```bash
railway login
cd c:\Users\Yuki\legalkonect\backend
railway link
```

3. Run migrations:
```bash
railway run php artisan migrate --force
```

4. Seed database:
```bash
railway run php artisan db:seed --class=SpecializationsSeeder
railway run php artisan db:seed --class=FAQSeeder
```

5. Create admin account:
```bash
railway run php artisan tinker
```

Then paste:
```php
// In admins table
DB::table('admins')->insert([
    'name' => 'Admin',
    'email' => 'admin@legalkonect.com',
    'password' => bcrypt('YourPassword123!'),
    'role' => 'super_admin',
    'is_active' => true,
    'created_at' => now(),
    'updated_at' => now()
]);

// In users table (for FK)
DB::table('users')->insert([
    'name' => 'Admin',
    'email' => 'admin@legalkonect.com',
    'password' => bcrypt('YourPassword123!'),
    'role' => 'super_admin',
    'status' => 'active',
    'created_at' => now(),
    'updated_at' => now()
]);

exit
```

**Done!** ✅

---

## ✅ Test Your Deployment

### 1. Test Frontend
Visit: `https://your-frontend-url.up.railway.app`

### 2. Test Admin Login
- Go to: `/login`
- Email: `admin@legalkonect.com`
- Password: `YourPassword123!`

### 3. Test Manual Payment Flow
**As Client:**
1. Register as client
2. Book appointment with a lawyer
3. See lawyer's GCash/Bank details
4. Upload payment proof (screenshot)

**As Lawyer:**
1. Go to dashboard
2. See pending payment confirmations
3. Verify payment proof
4. Confirm payment
5. Appointment confirmed!

---

## 📊 Cost Summary

| Service | Cost | What It Does |
|---------|------|--------------|
| Railway (Free Trial) | $0 (first month) | Hosting |
| Railway (Hobby Plan) | $5/month (after trial) | Hosting |
| Cloudflare R2 | ~$1.50/month | Storage for IDs, payment proofs |
| Resend Email | FREE (up to 3000/month) | Email notifications |
| **TOTAL** | **$6.50/month** | After free trial |

**No PayMongo fees!** Since you use manual payment ✅

---

## 🔄 Can You Change Branches?

**YES!** Anytime:

```bash
# Switch to another branch
git checkout reservation-feature

# Or update production-hosting
git checkout production-hosting
git merge reservation-feature
git push

# Railway will auto-redeploy
```

**In Railway Dashboard:**
- Go to your service
- Settings → "Source"
- Change branch to any branch you want
- Railway redeploysautomatically

---

## 🎯 What's Actually Needed

### ✅ Required Services:
1. Railway (hosting)
2. Cloudflare R2 (file storage)
3. Resend (email)

### ❌ NOT Needed:
- ~~PayMongo~~ - You use manual payment!
- ~~Google Calendar~~ - Optional, add later if needed

---

## 🆘 Common Issues

### "Migrations fail"
```bash
# Check database connection
railway run php artisan migrate:status

# Retry migrations
railway run php artisan migrate:fresh --force
```

### "Can't upload files"
- Check R2 credentials in backend variables
- Test: `railway run php artisan tinker`
- Run: `Storage::disk('s3')->put('test.txt', 'Hello');`

### "Frontend can't reach backend"
- Check `REACT_APP_API_URL` in frontend
- Check `SANCTUM_STATEFUL_DOMAINS` in backend
- Make sure URLs don't have trailing slashes

---

## 🎉 You're Done!

Your LegalKonect platform is now live with:

✅ Manual payment system (GCash/Bank Transfer)
✅ Payment proof uploads
✅ Lawyer payment confirmation
✅ Encrypted document storage
✅ Email notifications
✅ Admin dashboard

**Total time:** ~30-40 minutes
**Cost:** $6.50/month (after $5 free trial)

**No payment gateway needed - your manual payment system is already built!** 🎉

---

**Need Help?**
- Check Railway logs: `railway logs`
- View full guide: [RAILWAY_DEPLOYMENT_GUIDE.md](./RAILWAY_DEPLOYMENT_GUIDE.md)
- Report issues: https://github.com/Yukidoki1126/LegalKonect/issues

**Ready to deploy?** Start with Step 1! 🚀
