# 🚀 Quick Start - Deploy to Render

## Before You Start
Make sure you have:
- [x] Code changes committed and pushed to GitHub
- [ ] Render account created ([render.com](https://render.com))
- [ ] Resend account for emails ([resend.com](https://resend.com))
- [ ] Google Cloud credentials ready
- [ ] Google Maps API key ready

---

## 📦 Step 1: Deploy Backend (5-10 minutes)

1. **Create MySQL Database** (if not using Render PostgreSQL)
   - Option A: [PlanetScale](https://planetscale.com) (Free tier)
   - Option B: [Railway](https://railway.app) (Free $5 credit)
   - Save connection details

2. **Create Backend Service in Render**
   - Go to Render Dashboard
   - Click "New +" → "Web Service"
   - Connect GitHub repo: `legalkonect`
   - Configure:
     - Name: `legalkonect-backend`
     - Root Directory: `backend`
     - Runtime: `Docker`
     - Dockerfile Path: `./Dockerfile`
     - Plan: Start with Free (upgrade later)

3. **Configure Environment Variables**
   - Copy from `backend/.env.render.example`
   - Fill in all placeholders
   - Generate APP_KEY: `php artisan key:generate --show`
   - **Important:** Update `APP_URL` and `FRONTEND_URL` after deployment

4. **Deploy**
   - Click "Create Web Service"
   - Wait for build (~5-10 min)
   - Copy the backend URL: `https://your-backend.onrender.com`

5. **Update Environment Variables**
   - Go back to backend service → Environment
   - Update `APP_URL` with your actual backend URL
   - Update `FRONTEND_URL` (will get this in Step 2)
   - Save changes (triggers redeploy)

---

## 🎨 Step 2: Deploy Frontend (3-5 minutes)

1. **Create Frontend Service in Render**
   - Click "New +" → "Static Site"
   - Connect same GitHub repo: `legalkonect`
   - Configure:
     - Name: `legalkonect-frontend`
     - Build Command: `cd frontend && npm install && npm run build`
     - Publish Directory: `frontend/build`

2. **Configure Environment Variables**
   - Copy from `frontend/.env.render.example`
   - Set `REACT_APP_API_URL` to: `https://your-backend.onrender.com/api`
   - Set `REACT_APP_STORAGE_URL` to: `https://your-backend.onrender.com`
   - Set `REACT_APP_GOOGLE_MAPS_API_KEY`

3. **Deploy**
   - Click "Create Static Site"
   - Wait for build (~3-5 min)
   - Copy the frontend URL: `https://your-frontend.onrender.com`

4. **Update Backend Environment Variables**
   - Go to backend service → Environment
   - Update `FRONTEND_URL` with your frontend URL
   - Update `CORS_ALLOWED_ORIGINS` with your frontend URL
   - Update `SANCTUM_STATEFUL_DOMAINS` (domain only, no https://)
   - Save changes (triggers redeploy)

---

## 🔧 Step 3: Configure Google Services (5 minutes)

### Google OAuth
1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Navigate to **APIs & Services** → **Credentials**
3. Edit your OAuth 2.0 Client ID
4. **Authorized Redirect URIs:**
   ```
   https://your-backend.onrender.com/api/google/callback
   ```
5. **Authorized JavaScript Origins:**
   ```
   https://your-frontend.onrender.com
   ```
6. Save

### Google Maps
1. Same console → **Credentials** → Edit API Key
2. **Application restrictions** → **HTTP referrers**
3. Add:
   ```
   https://your-frontend.onrender.com/*
   ```
4. Save

---

## ✅ Step 4: Test Your Deployment (10 minutes)

Visit your frontend URL and test:

- [ ] Homepage loads
- [ ] User registration works
- [ ] Login works
- [ ] Google Sign-In works
- [ ] Lawyer registration works
- [ ] Document upload works
- [ ] Browse lawyers page works
- [ ] Book appointment works
- [ ] Payment flow works
- [ ] Email is sent (check spam folder)
- [ ] Admin login works
- [ ] Lawyer dashboard works

---

## 🐛 Common Issues

### "CORS Error" in browser console
**Fix:** Check backend `CORS_ALLOWED_ORIGINS` includes frontend URL (no trailing slash)

### "502 Bad Gateway"
**Fix:** Check backend logs in Render dashboard → Logs tab

### "File upload fails"
**Fix:** Currently using local storage. For production, add Persistent Disk or S3 (see full guide)

### "Email not sending"
**Fix:** Verify `RESEND_KEY` is correct. Check Resend dashboard for errors.

### "Google Sign-In fails"
**Fix:** Verify redirect URIs are configured correctly in Google Cloud Console

---

## 💰 Current Cost

### Free Tier (Sleeps after inactivity)
- Backend: Free
- Frontend: Free
- Database: Free (external service)
- **Total: $0/month**

### Always-On (Recommended for production)
- Backend: $7/month
- Frontend: Free
- Database: $0-7/month (depends on provider)
- **Total: $7-14/month**

### Upgrade Later
- Persistent Disk: +$2.50/month (10GB)
- Larger instance: +$20/month
- PostgreSQL: +$7/month (if using Render)

---

## 📚 Need More Help?

- **Full Guide:** Read `RENDER_DEPLOYMENT_GUIDE.md`
- **Summary:** Read `HOSTING_READINESS_SUMMARY.md`
- **Render Docs:** [render.com/docs](https://render.com/docs)
- **Support:** Render has chat support for debugging

---

## 🎉 You're Done!

Your LegalKonect application is now live! 🚀

**Next Steps:**
1. Test thoroughly
2. Share with users
3. Monitor logs for issues
4. Set up backups
5. Consider custom domain

**Remember:**
- Free tier sleeps after 15 min inactivity (first request will be slow)
- Upgrade to $7/month for always-on service
- Local file storage is temporary (upgrade to S3 for production)

---

**Total Time:** ~30 minutes
**Difficulty:** Easy to Medium
**Cost:** Free to start, $7-14/month for production
