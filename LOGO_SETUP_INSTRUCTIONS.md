# LegalKonect Logo Setup Instructions

## Adding the Logo Image

To complete the logo integration, you need to save the logo image file to the frontend public folder.

### Steps:

1. **Save the logo image** (the circular badge with scales of justice and "LEGALKONECT" text) as `legalkonect-logo.png`

2. **Place it in the frontend public folder:**
   ```
   frontend/public/legalkonect-logo.png
   ```

3. **The logo is now integrated in all these locations:**
   - ✅ Browser tab favicon (Chrome, Firefox, Safari, etc.)
   - ✅ Main navigation bar (Navbar component)
   - ✅ Lawyer portal navigation
   - ✅ Admin dashboard navigation
   - ✅ Login page
   - ✅ Register page
   - ✅ Apple touch icon (for iOS devices)

### Recommended Logo Specifications:

- **Format:** PNG with transparent background
- **Dimensions:** 512x512 pixels (or larger, will be automatically resized)
- **File size:** Under 200KB for optimal loading
- **Design:** The circular badge with scales of justice that you provided

### Quick Copy Command:

If you have the logo file ready, simply copy it to the public folder:

**Windows:**
```powershell
Copy-Item "path\to\your\legalkonect-logo.png" "frontend\public\legalkonect-logo.png"
```

**Mac/Linux:**
```bash
cp /path/to/your/legalkonect-logo.png frontend/public/legalkonect-logo.png
```

### Verification:

After adding the logo file, you should see:
1. The logo in the browser tab (favicon)
2. The logo in the navigation bar of all pages
3. The logo on login and registration pages

### Files Updated:

The following files have been updated to use the logo:
- `frontend/public/index.html` - Favicon and meta tags
- `frontend/src/components/Navbar.tsx` - Main navigation
- `frontend/src/pages/lawyer/LawyerLayout.tsx` - Lawyer portal
- `frontend/src/pages/admin/AdminDashboard.tsx` - Admin dashboard
- `frontend/src/pages/Login.tsx` - Login page
- `frontend/src/pages/Register.tsx` - Register page

### Note:

The logo will appear on all pages throughout the application once you add the image file. No additional configuration is needed!

---

**Need Help?**
If you encounter any issues, check that:
1. The file is named exactly `legalkonect-logo.png` (case-sensitive)
2. The file is in the `frontend/public/` directory
3. The frontend development server is restarted after adding the file
