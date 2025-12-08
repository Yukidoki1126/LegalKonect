# LegalKonect Deployment Checklist

Use this checklist to ensure a smooth deployment to production.

## 📦 Pre-Deployment

### Code Preparation
- [ ] All features tested locally
- [ ] No console.log or debug statements in production code
- [ ] Build succeeds without errors (`npm run build` in frontend)
- [ ] Backend tests pass (if any)
- [ ] Git branch is clean and committed

### Environment Variables
- [ ] All production `.env` values documented
- [ ] `DOCUMENT_ENCRYPTION_KEY` copied from local (CRITICAL!)
- [ ] `APP_KEY` generated for production
- [ ] API keys validated (Google, Resend, Cloudinary)

### Database
- [ ] Migration files reviewed
- [ ] Seeders prepared (SuperAdminSeeder)
- [ ] Database backup plan in place

---

## ☁️ Cloudflare R2 Setup

### Create Bucket
- [ ] R2 bucket created: `legalkonect-credentials`
- [ ] Bucket region selected
- [ ] Public access configured (if needed)

### Generate Credentials
- [ ] API token generated
- [ ] Access Key ID saved
- [ ] Secret Access Key saved
- [ ] Endpoint URL noted
- [ ] Public URL noted (if applicable)

### Test Access
- [ ] Can upload test file
- [ ] Can download test file
- [ ] Can delete test file
- [ ] Permissions verified

---

## 🚂 Railway Backend Deployment

### Project Setup
- [ ] Railway project created
- [ ] GitHub repo connected
- [ ] MySQL database added to project
- [ ] Root directory set to `backend`

### Environment Variables
Copy from `backend/.env.production.example`:
- [ ] `APP_NAME`, `APP_ENV`, `APP_KEY`
- [ ] `APP_DEBUG=false`, `APP_URL`
- [ ] `DOCUMENT_ENCRYPTION_KEY` (CRITICAL!)
- [ ] `FRONTEND_URL`, `SANCTUM_STATEFUL_DOMAINS`
- [ ] Database variables (use Railway references)
- [ ] R2 credentials (all 6 variables)
- [ ] Email credentials (Resend)
- [ ] Google OAuth credentials
- [ ] Cloudinary credentials (optional)

### Deployment
- [ ] Initial deployment successful
- [ ] Migrations ran automatically
- [ ] SuperAdminSeeder ran
- [ ] No build errors in logs
- [ ] Health check passes (`/api/health`)

### Post-Deployment Tests
- [ ] Can access API endpoint
- [ ] Database connection works
- [ ] Storage upload works (R2)
- [ ] Email sending works (Resend)
- [ ] Google OAuth redirect works

---

## ▲ Vercel Frontend Deployment

### Project Setup
- [ ] Vercel project created
- [ ] GitHub repo connected
- [ ] Framework preset: Create React App
- [ ] Root directory set to `frontend`
- [ ] Build command: `npm run build`
- [ ] Output directory: `build`

### Environment Variables
Copy from `frontend/.env.production.example`:
- [ ] `REACT_APP_API_URL` (use Railway URL)
- [ ] `REACT_APP_GOOGLE_MAPS_API_KEY`
- [ ] `REACT_APP_GOOGLE_CLIENT_ID`
- [ ] `REACT_APP_PAYMONGO_PUBLIC_KEY`

### Deployment
- [ ] Initial deployment successful
- [ ] No build warnings or errors
- [ ] Static assets loading
- [ ] Homepage renders correctly

### Update Backend
- [ ] Update Railway `FRONTEND_URL` with Vercel URL
- [ ] Update Railway `SANCTUM_STATEFUL_DOMAINS` with Vercel domain
- [ ] Redeploy Railway backend

### Post-Deployment Tests
- [ ] Frontend loads successfully
- [ ] Can reach backend API
- [ ] CORS working (no errors)
- [ ] Authentication works
- [ ] Google Maps displays
- [ ] Image uploads work

---

## 🔧 Integration Testing

### User Flows
- [ ] User registration works
- [ ] User login works
- [ ] Password reset works
- [ ] Google OAuth login works

### Lawyer Flows
- [ ] Lawyer registration works
- [ ] Credentials upload to R2 (encrypted)
- [ ] Admin can view/verify lawyers
- [ ] Lawyer dashboard accessible
- [ ] Google Calendar integration works

### Booking Flow
- [ ] Search lawyers works
- [ ] Booking modal works
- [ ] Time slot selection works
- [ ] Payment proof upload works
- [ ] Email notifications sent

### Admin Flows
- [ ] Admin login works
- [ ] Can verify lawyers
- [ ] Can view encrypted credentials
- [ ] Can manage users
- [ ] Analytics display correctly

---

## 🔒 Security Verification

### SSL/HTTPS
- [ ] Railway backend uses HTTPS
- [ ] Vercel frontend uses HTTPS
- [ ] No mixed content warnings

### Environment
- [ ] `APP_DEBUG=false` in production
- [ ] No sensitive data in logs
- [ ] API keys secured
- [ ] Database credentials secured

### CORS
- [ ] CORS configured correctly
- [ ] Only Vercel domain allowed
- [ ] Credentials support enabled

### Encryption
- [ ] `DOCUMENT_ENCRYPTION_KEY` matches local
- [ ] Lawyer credentials decrypt correctly
- [ ] No plaintext credentials in logs

---

## 📊 Monitoring Setup

### Railway
- [ ] Logs accessible
- [ ] Metrics visible
- [ ] Alerts configured (optional)

### Vercel
- [ ] Analytics enabled
- [ ] Function logs accessible
- [ ] Performance insights reviewed

### Cloudflare R2
- [ ] Storage metrics visible
- [ ] Request analytics available
- [ ] Bandwidth monitoring set up

---

## 🚨 Troubleshooting Reference

### Common Issues

**CORS Errors**
- Check `FRONTEND_URL` in Railway
- Verify `SANCTUM_STATEFUL_DOMAINS`
- Check `config/cors.php` settings

**Storage Upload Fails**
- Verify R2 credentials
- Check bucket permissions
- Verify endpoint URL format

**Database Connection Failed**
- Check Railway MySQL is running
- Verify database variable references
- Check connection in logs

**Session/Auth Issues**
- Verify `SESSION_DRIVER=database`
- Check `SANCTUM_STATEFUL_DOMAINS`
- Clear browser cookies

**Email Not Sending**
- Verify Resend API key
- Check email settings in Railway
- Review logs for errors

---

## 🎯 Post-Deployment Tasks

### Documentation
- [ ] Update README with production URLs
- [ ] Document environment variables
- [ ] Create user guide (optional)

### Backups
- [ ] Database backup enabled (Railway automatic)
- [ ] R2 versioning enabled (optional)
- [ ] Environment variables backed up securely

### Performance
- [ ] Test load times
- [ ] Optimize images (if needed)
- [ ] Enable caching (if needed)

### Custom Domain (Optional)
- [ ] Domain purchased
- [ ] DNS configured
- [ ] SSL certificate installed
- [ ] Environment variables updated with new domain

---

## ✅ Deployment Complete

### Final Checks
- [ ] All features working in production
- [ ] No critical errors in logs
- [ ] Users can register and login
- [ ] Lawyers can be verified
- [ ] Appointments can be booked
- [ ] Payments can be processed
- [ ] Admin dashboard accessible

### Handoff
- [ ] Production URLs documented
- [ ] Admin credentials provided securely
- [ ] Monitoring access granted
- [ ] Support process established

---

## 📞 Support Contacts

**Railway**: https://railway.app/help
**Vercel**: https://vercel.com/support
**Cloudflare**: https://support.cloudflare.com
**Google Cloud**: https://cloud.google.com/support

---

## 🔄 Rollback Plan

If deployment fails:

1. **Keep old environment running** (if applicable)
2. **Check logs** for specific errors
3. **Verify environment variables** are correct
4. **Test database connection** separately
5. **Redeploy** after fixing issues
6. **Contact platform support** if needed

---

**Deployment Date**: _______________
**Deployed By**: _______________
**Production URLs**:
- Frontend: _______________
- Backend: _______________
- Database: _______________

