# LegalKonect Deployment & Branch Strategy

## 📊 Branch Structure

### **Production Branch: `production-hosting`** ⭐
**Purpose:** Production-ready code for hosting deployment
**Status:** Ready for deployment to Railway/Render
**Database:** MySQL (fully migrated from SQL Server)
**Latest:** MySQL migration fixes + Admin verification fixes

**Use this branch for:**
- Deploying to Railway/Render
- Production hosting
- Live environment

### **Development Branch: `reservation-feature`** 🔄
**Purpose:** Active development with reservation features
**Status:** Safe backup of your working code
**Database:** MySQL compatible

**Use this branch for:**
- Continuing development
- Testing new features
- Fallback if production has issues

### **Main Branch: `develop`**
**Purpose:** Main development branch
**Status:** Stable base for features

---

## 🚀 Deployment Workflow

### **Option 1: Deploy to Railway (Recommended)**

1. **Connect GitHub Repository:**
   ```bash
   # Go to railway.app
   # Click "New Project" → "Deploy from GitHub repo"
   # Select: Yukidoki1126/LegalKonect
   # Branch: production-hosting
   ```

2. **Configure Services:**
   - **Backend Service:** Laravel (PHP 8.2)
   - **Frontend Service:** React (Node 18+)
   - **Database:** MySQL 8.0

3. **Set Environment Variables:**
   ```env
   # Backend (.env)
   APP_ENV=production
   APP_DEBUG=false
   APP_URL=https://your-backend.up.railway.app

   DB_CONNECTION=mysql
   DB_HOST=${{ MYSQL_HOST }}
   DB_PORT=3306
   DB_DATABASE=${{ MYSQL_DATABASE }}
   DB_USERNAME=${{ MYSQL_USER }}
   DB_PASSWORD=${{ MYSQL_PASSWORD }}

   # PayMongo
   PAYMONGO_PUBLIC_KEY=your_key
   PAYMONGO_SECRET_KEY=your_secret

   # Google OAuth
   GOOGLE_CLIENT_ID=your_client_id
   GOOGLE_CLIENT_SECRET=your_secret

   # Frontend URLs
   FRONTEND_URL=https://your-frontend.up.railway.app
   SANCTUM_STATEFUL_DOMAINS=your-frontend.up.railway.app
   ```

4. **Run Migrations:**
   ```bash
   # Railway will auto-run, or manually:
   php artisan migrate --force
   php artisan db:seed --class=SpecializationsSeeder
   php artisan db:seed --class=FAQSeeder
   ```

### **Option 2: Deploy to Render**

Similar setup, use `production-hosting` branch

---

## 🔐 Storage Configuration (AWS S3 / Cloudflare R2)

### **Current Setup (Local):**
- Documents stored in: `backend/storage/app/encrypted_documents/`
- Encryption: AES-256 with Laravel encryption

### **Production Setup (S3/R2):**

1. **Install AWS SDK:**
   ```bash
   composer require league/flysystem-aws-s3-v3 "^3.0"
   ```

2. **Update `.env`:**
   ```env
   FILESYSTEM_DISK=s3

   AWS_ACCESS_KEY_ID=your_key
   AWS_SECRET_ACCESS_KEY=your_secret
   AWS_DEFAULT_REGION=ap-southeast-1
   AWS_BUCKET=legalkonect-credentials
   AWS_USE_PATH_STYLE_ENDPOINT=false
   ```

3. **For Cloudflare R2 (Recommended):**
   ```env
   FILESYSTEM_DISK=s3

   AWS_ACCESS_KEY_ID=your_r2_access_key
   AWS_SECRET_ACCESS_KEY=your_r2_secret_key
   AWS_DEFAULT_REGION=auto
   AWS_BUCKET=legalkonect-credentials
   AWS_ENDPOINT=https://YOUR_ACCOUNT_ID.r2.cloudflarestorage.com
   AWS_USE_PATH_STYLE_ENDPOINT=false
   ```

4. **S3 Bucket Configuration:**
   - **Access:** Private (no public access)
   - **Encryption:** AES-256 (Server-Side)
   - **Versioning:** Enabled (recommended)
   - **CORS:** Configure for your domain

---

## 📋 Pre-Deployment Checklist

- [x] MySQL database fully migrated (49/49 migrations)
- [x] Admin verification working with users table FK
- [x] SQL Server syntax converted to MySQL
- [x] Environment files configured
- [ ] Update `APP_URL` in `.env`
- [ ] Update `FRONTEND_URL` in backend `.env`
- [ ] Set up S3/R2 bucket for documents
- [ ] Configure PayMongo API keys
- [ ] Configure Google OAuth credentials
- [ ] Test migrations on production database
- [ ] Seed production database
- [ ] Create production admin account
- [ ] Test lawyer registration flow
- [ ] Test payment integration
- [ ] Test Google Calendar integration

---

## 🔄 Switching Branches

### **To deploy production:**
```bash
git checkout production-hosting
git pull origin production-hosting
```

### **To continue development:**
```bash
git checkout reservation-feature
git pull origin reservation-feature
```

### **To rollback production if issues occur:**
```bash
# On production-hosting branch
git reset --hard <previous-commit-hash>
git push --force origin production-hosting
```

---

## 🆘 Emergency Rollback

If production fails:
1. **Switch to previous working branch:**
   ```bash
   git checkout reservation-feature
   ```

2. **Redeploy from safe branch:**
   - Railway: Change deployment branch to `reservation-feature`
   - Or force push previous commit

---

## 💾 Database Backup Strategy

### **Before Deployment:**
```bash
# Export current database
mysqldump -u root legalkonect > backup_pre_deployment.sql
```

### **Production Backups:**
- Railway: Automatic daily backups
- Manual: Use Railway CLI or database dashboard

---

## 📝 Important Notes

1. **Never force push to `develop` or `main`**
2. **Always test on `production-hosting` before deploying**
3. **Keep `reservation-feature` as your safe backup**
4. **Document all production changes**
5. **Use environment variables for all secrets**
6. **Never commit `.env` files**

---

## 🎯 Current Status

✅ **Ready for Production:**
- MySQL migration complete
- Admin system fixed
- Documentation complete
- Branch created and pushed

🔄 **Next Steps:**
1. Choose hosting platform (Railway recommended)
2. Set up S3/R2 storage
3. Configure environment variables
4. Deploy and test

---

**Last Updated:** 2025-12-05
**Branch:** production-hosting
**Status:** Ready for deployment ✅
