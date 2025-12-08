# LegalKonect Quick Deploy Guide

**Get your app live in 30 minutes!**

---

## 🎯 What You Need

1. **Cloudflare Account** (for R2 storage)
2. **Railway Account** (for backend)
3. **Vercel Account** (for frontend)
4. Your **GitHub repository** with LegalKonect code

---

## ⚡ Quick Steps

### 1️⃣ Cloudflare R2 (5 minutes)

1. Go to **R2 Object Storage** in Cloudflare dashboard
2. Click **Create bucket** → Name it `legalkonect-credentials`
3. Click **Manage R2 API Tokens** → **Create API Token**
4. Copy these values:
   - Access Key ID
   - Secret Access Key
   - Endpoint URL

### 2️⃣ Railway Backend (10 minutes)

1. Go to **railway.app** → **New Project** → **Deploy from GitHub**
2. Select your `legalkonect` repository
3. Click **Add Database** → **MySQL**
4. Go to **Variables** tab and paste:

```env
APP_NAME=LegalKonect
APP_ENV=production
APP_DEBUG=false
APP_URL=https://your-project.up.railway.app

DOCUMENT_ENCRYPTION_KEY=base64:sIrk+RzEacYWu1HLGLg16X2yPCzA9yFoAsJ8XbO6kRY=

FRONTEND_URL=https://your-app.vercel.app
SANCTUM_STATEFUL_DOMAINS=your-app.vercel.app

FILESYSTEM_DISK=r2
AWS_ACCESS_KEY_ID=<paste_from_cloudflare>
AWS_SECRET_ACCESS_KEY=<paste_from_cloudflare>
AWS_DEFAULT_REGION=auto
AWS_BUCKET=legalkonect-credentials
AWS_ENDPOINT=<paste_from_cloudflare>
AWS_URL=https://pub-xxxxx.r2.dev
AWS_USE_PATH_STYLE_ENDPOINT=false

MAIL_MAILER=resend
RESEND_KEY=your_resend_api_key_here
MAIL_FROM_ADDRESS=onboarding@resend.dev
MAIL_FROM_NAME=LegalKonect

GOOGLE_CLIENT_ID=your_google_client_id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your_google_client_secret
GOOGLE_REDIRECT_URI=https://your-project.up.railway.app/api/google/callback
GOOGLE_AUTH_REDIRECT_URI=https://your-project.up.railway.app/api/auth/google/callback

CLOUDINARY_CLOUD_NAME=your_cloudinary_cloud_name
CLOUDINARY_API_KEY=your_cloudinary_api_key
CLOUDINARY_API_SECRET=your_cloudinary_api_secret
```

5. Click **Deploy** - Railway will build and run migrations automatically
6. Copy your Railway URL (something like `https://legalkonect-production-xxxx.up.railway.app`)

### 3️⃣ Vercel Frontend (10 minutes)

1. Go to **vercel.com** → **Add New** → **Project**
2. Import your `legalkonect` repository
3. Configure:
   - **Framework**: Create React App
   - **Root Directory**: `frontend`
   - **Build Command**: `npm run build`
   - **Output Directory**: `build`

4. Add **Environment Variables**:

```env
REACT_APP_API_URL=https://your-railway-url.up.railway.app/api
REACT_APP_GOOGLE_MAPS_API_KEY=your_google_maps_api_key
REACT_APP_GOOGLE_CLIENT_ID=your_google_client_id.apps.googleusercontent.com
REACT_APP_PAYMONGO_PUBLIC_KEY=your_paymongo_public_key
```

5. Click **Deploy**
6. Copy your Vercel URL (something like `https://legalkonect.vercel.app`)

### 4️⃣ Connect Frontend & Backend (5 minutes)

1. Go back to **Railway** → Your project → **Variables**
2. Update these:
   ```env
   FRONTEND_URL=https://your-actual-vercel-url.vercel.app
   SANCTUM_STATEFUL_DOMAINS=your-actual-vercel-url.vercel.app
   APP_URL=https://your-actual-railway-url.up.railway.app
   GOOGLE_REDIRECT_URI=https://your-actual-railway-url.up.railway.app/api/google/callback
   GOOGLE_AUTH_REDIRECT_URI=https://your-actual-railway-url.up.railway.app/api/auth/google/callback
   ```
3. Railway will automatically redeploy

---

## ✅ Test Your Deployment

1. Visit your Vercel URL
2. Click **Register** and create a test account
3. Try logging in
4. Try booking an appointment
5. Test lawyer registration with credential upload

---

## 🚨 Common Issues

**"Network Error" or CORS errors**
- Check `FRONTEND_URL` matches your Vercel URL exactly
- Check `SANCTUM_STATEFUL_DOMAINS` (no https://, just domain)

**"500 Server Error"**
- Check Railway logs for errors
- Verify database is connected
- Check R2 credentials are correct

**Storage uploads fail**
- Verify R2 endpoint URL is correct
- Check R2 bucket name matches
- Verify API keys are correct

**Can't login**
- Clear browser cookies
- Check `SESSION_DRIVER=database` in Railway
- Verify `FRONTEND_URL` is correct

---

## 🎉 You're Live!

Your app is now deployed:
- **Frontend**: https://your-app.vercel.app
- **Backend**: https://your-backend.up.railway.app
- **Storage**: Cloudflare R2

### Default Admin Credentials
After deployment, create super admin:
```bash
# In Railway console
php artisan db:seed --class=SuperAdminSeeder
```

Then login with:
- **Email**: admin@legalkonect.com
- **Password**: password123

**⚠️ CHANGE THIS IMMEDIATELY AFTER FIRST LOGIN**

---

## 📚 Next Steps

- [ ] Change admin password
- [ ] Test all features
- [ ] Add custom domain (optional)
- [ ] Set up monitoring
- [ ] Create backups

For detailed instructions, see [HOSTING_SETUP_GUIDE.md](HOSTING_SETUP_GUIDE.md)

---

## 💰 Cost Estimate

- **Railway**: $5/month (Hobby) or $20/month (Pro)
- **Vercel**: Free (Hobby) or $20/month (Pro)
- **Cloudflare R2**: ~$1-5/month (storage + operations)

**Total**: $5-45/month depending on plan and usage

