# LegalKonect - Vercel Frontend Deployment (5 Minutes)

## ✅ Prerequisites Checklist

- [x] Code ready (all changes committed to `Render-Hosting` branch)
- [x] Backend deployed on Render (or ready to deploy)
- [ ] Vercel account (sign up at https://vercel.com)
- [ ] GitHub repository pushed
- [ ] Google Maps API key ready

---

## 🚀 Quick Deploy (5 Minutes)

### Step 1: Deploy Backend on Render First (If Not Done)

**If backend is not deployed yet:**
1. Follow `RENDER_DEPLOYMENT_GUIDE.md` 
2. Deploy backend first
3. Get your backend URL: `https://your-backend.onrender.com`
4. Come back here for frontend deployment

**If backend is already deployed:**
- ✅ You're ready to deploy frontend!

---

### Step 2: Sign Up for Vercel

1. Go to https://vercel.com
2. Click **"Sign Up"**
3. Choose **"Continue with GitHub"**
4. Authorize Vercel to access your repositories

---

### Step 3: Import Your Project

1. **On Vercel Dashboard:**
   - Click **"Add New..."** → **"Project"**
   - Select **"Import Git Repository"**

2. **Find Your Repo:**
   - Search for `legalkonect`
   - Click **"Import"**

3. **Configure Project:**
   - **Framework Preset:** Create React App (should auto-detect)
   - **Root Directory:** Click **"Edit"** → Select **`frontend`**
   - **Build Command:** `npm run build` (auto-filled)
   - **Output Directory:** `build` (auto-filled)
   - **Install Command:** `npm install` (auto-filled)

---

### Step 4: Add Environment Variables

**Click "Environment Variables" and add these:**

```env
REACT_APP_API_URL
https://your-backend.onrender.com/api

REACT_APP_STORAGE_URL
https://your-backend.onrender.com

REACT_APP_GOOGLE_MAPS_API_KEY
your_google_maps_api_key_here
```

**Important:**
- Replace `your-backend.onrender.com` with your actual Render backend URL
- No trailing slashes
- Include `/api` for API_URL
- Don't include `/api` for STORAGE_URL

---

### Step 5: Deploy

1. Click **"Deploy"**
2. Wait ~30 seconds for build to complete
3. Get your URL: `https://legalkonect-xxxxx.vercel.app`

**That's it! Your frontend is live! 🎉**

---

### Step 6: Update Backend CORS

Now that frontend is deployed, update your Render backend:

1. **Go to Render Dashboard** → Your backend service
2. **Environment Tab** → Edit these variables:

```env
CORS_ALLOWED_ORIGINS=https://legalkonect-xxxxx.vercel.app
SANCTUM_STATEFUL_DOMAINS=legalkonect-xxxxx.vercel.app
FRONTEND_URL=https://legalkonect-xxxxx.vercel.app
```

3. **Save** → Backend will restart automatically

---

### Step 7: Update Google Cloud Console

1. **Go to** [Google Cloud Console](https://console.cloud.google.com)
2. **APIs & Services** → **Credentials**

**Update OAuth 2.0 Client:**
- **Authorized JavaScript origins:**
  - Add: `https://legalkonect-xxxxx.vercel.app`
- **Authorized redirect URIs:**
  - Add: `https://your-backend.onrender.com/api/google/callback`

**Update Google Maps API:**
- **API Key** → **Application restrictions**
- **HTTP referrers:**
  - Add: `https://legalkonect-xxxxx.vercel.app/*`

---

### Step 8: Test Your Deployment

1. **Visit:** `https://legalkonect-xxxxx.vercel.app`
2. **Test these features:**
   - [ ] Home page loads
   - [ ] Find lawyers page works
   - [ ] Registration works
   - [ ] Login works
   - [ ] Google OAuth works
   - [ ] Lawyer details load
   - [ ] No CORS errors in console

**Check Browser Console (F12):**
- ✅ Should see API calls to your Render backend
- ✅ No CORS errors
- ✅ Status 200 responses

---

## 🎯 Deployment Configuration Summary

### What Gets Deployed

**Frontend (Vercel):**
- React production build
- Environment variables embedded at build time
- Served from global CDN
- Automatic HTTPS

**Backend (Render):**
- Laravel API via Docker
- Connected to database
- Handles all business logic
- Validates CORS requests

### How They Connect

```
User Browser
    ↓
Vercel (React Frontend)
    ↓ (API Calls with CORS)
Render (Laravel Backend)
    ↓
Database (MySQL/PostgreSQL)
```

---

## 🔧 Managing Your Deployment

### Automatic Deployments

**Vercel auto-deploys when you push to GitHub:**
- Push to `Render-Hosting` branch → Auto-deploy
- Push to `main` branch → Auto-deploy to production
- Create PR → Get preview URL

### Manual Redeploy

**Vercel:**
1. Go to project dashboard
2. Click "Redeploy" on latest deployment

**Render (Backend):**
1. Go to service dashboard
2. Click "Manual Deploy" → Deploy latest commit

### Updating Environment Variables

**Frontend (Vercel):**
1. Project Settings → Environment Variables
2. Edit value → Click "Save"
3. **Important:** Must redeploy for changes to take effect
   - Go to Deployments → Redeploy

**Backend (Render):**
1. Service → Environment tab
2. Edit variable → Save
3. Service restarts automatically

---

## 🌐 Custom Domain (Optional)

### Add Custom Domain to Vercel

1. **Purchase domain** (Namecheap, Google Domains, etc.)
2. **In Vercel:**
   - Project Settings → Domains
   - Add your domain: `www.legalkonect.com`
   - Follow DNS instructions

3. **Update Backend CORS:**
   ```env
   CORS_ALLOWED_ORIGINS=https://www.legalkonect.com,https://legalkonect-xxxxx.vercel.app
   SANCTUM_STATEFUL_DOMAINS=www.legalkonect.com,legalkonect-xxxxx.vercel.app
   ```

4. **Update Google OAuth** with new domain

**SSL Certificate:** Automatic and free with Vercel!

---

## 🔍 Troubleshooting

### Issue: CORS Errors

**Symptoms:**
- Console shows: `Access-Control-Allow-Origin` errors
- API calls fail with status 0 or CORS error

**Solution:**
1. Check `CORS_ALLOWED_ORIGINS` in Render backend
2. Ensure it matches your Vercel URL exactly
3. No trailing slashes
4. Restart Render backend service

**Verify:**
```bash
# Open browser console on your Vercel site
fetch('https://your-backend.onrender.com/api/test')
  .then(r => r.json())
  .then(console.log)
```

### Issue: API Calls Go to Wrong URL

**Symptoms:**
- API calls go to `localhost:8000`
- 404 errors on API endpoints

**Solution:**
1. Check environment variables in Vercel
2. Ensure `REACT_APP_API_URL` is set correctly
3. Redeploy frontend (variables are build-time)

### Issue: Images/Files Not Loading

**Symptoms:**
- Profile pictures broken
- QR codes don't display

**Solution:**
1. Check `REACT_APP_STORAGE_URL` in Vercel
2. Ensure it points to backend without `/api`
3. Verify backend storage is configured

### Issue: Build Fails on Vercel

**Common causes:**
- Missing dependencies in `package.json`
- TypeScript errors
- Environment variables not set

**Solution:**
1. Check build logs in Vercel
2. Fix any errors shown
3. Push changes to trigger rebuild

### Issue: Blank Page After Deploy

**Symptoms:**
- Vercel shows deployment succeeded
- Site shows blank page
- Console shows errors

**Solution:**
1. Check browser console for errors
2. Verify all environment variables are set
3. Check Network tab for failed requests
4. Ensure `homepage` in package.json is correct (should be `/` or not set)

---

## 📊 Performance Monitoring

### Vercel Analytics (Free)

1. **Enable in Project Settings:**
   - Settings → Analytics → Enable

2. **View Metrics:**
   - Real-time visitors
   - Page performance
   - Geographic distribution

### Check Build Times

**Vercel:**
- Deployments tab shows build duration
- Typically 30-60 seconds for React

**What to Monitor:**
- Build success rate
- Deployment frequency
- Traffic patterns

---

## 💰 Costs

### Vercel (Frontend)

**Free Tier (Hobby):**
- ✅ Unlimited projects
- ✅ Unlimited bandwidth
- ✅ 100GB-hours serverless execution
- ✅ Automatic SSL
- ✅ Custom domains

**Pro Tier ($20/month):**
- Only needed for teams or high traffic
- You won't need this for your use case

### Render (Backend)

**Free Tier:**
- $0/month
- ⚠️ Sleeps after 15 min inactivity
- Not recommended for production

**Starter ($7/month):**
- ✅ Always-on
- ✅ 512MB RAM
- ✅ Recommended for production

**Total Cost: $7/month for production setup**
- Frontend: Free (Vercel)
- Backend: $7 (Render Starter)
- Database: $0-7 (Render free PostgreSQL or PlanetScale free MySQL)

---

## 🎯 Deployment Checklist

### Pre-Deployment
- [x] Code committed to `Render-Hosting` branch
- [x] Backend deployed on Render
- [x] Backend URL obtained
- [x] Environment variables prepared

### Vercel Deployment
- [ ] Vercel account created
- [ ] Project imported
- [ ] Environment variables set
- [ ] Deployment successful
- [ ] Frontend URL obtained

### Post-Deployment
- [ ] Backend CORS updated
- [ ] Google OAuth updated
- [ ] Google Maps restrictions updated
- [ ] All features tested
- [ ] No console errors

### Testing
- [ ] User registration works
- [ ] Login works
- [ ] Google Sign-In works
- [ ] Lawyer profiles load
- [ ] Appointments can be created
- [ ] File uploads work
- [ ] Admin panel accessible

---

## 🚀 Quick Commands Reference

### Push Changes and Auto-Deploy

```bash
# Switch to Render-Hosting branch
git checkout Render-Hosting

# Make changes, then:
git add .
git commit -m "Your changes"
git push origin Render-Hosting

# Vercel auto-deploys in ~30 seconds!
```

### Roll Back Deployment

**In Vercel Dashboard:**
1. Deployments tab
2. Find previous working deployment
3. Click "..." → "Promote to Production"

### View Logs

**Vercel:**
- Deployment → View Function Logs

**Render:**
- Service → Logs tab

---

## 🎉 You're Done!

Your LegalKonect app is now live on:
- **Frontend:** Vercel (blazing fast, global CDN)
- **Backend:** Render (reliable PHP/Laravel hosting)

### What You Get

✅ **Automatic Deployments:** Push to GitHub → Auto-deploy
✅ **Global CDN:** Fast loading worldwide
✅ **Free SSL:** Automatic HTTPS
✅ **Scalability:** Handles traffic spikes
✅ **Reliability:** 99.9% uptime
✅ **Low Cost:** $7/month total

### Next Steps

1. 📱 **Add Custom Domain** (optional)
2. 📊 **Enable Analytics** (free in Vercel)
3. 🔐 **Set up Monitoring** (Sentry for errors)
4. 💾 **Configure Backups** (database backups)
5. 🎨 **Customize** (branding, content)

---

## 📚 Resources

- [Vercel Documentation](https://vercel.com/docs)
- [Render Documentation](https://render.com/docs)
- [Your Backend Guide](./RENDER_DEPLOYMENT_GUIDE.md)
- [System Summary](./HOSTING_READINESS_SUMMARY.md)

---

**Need help? Check the troubleshooting section or review the deployment logs in Vercel/Render dashboards.**

**Happy Hosting! 🚀**
