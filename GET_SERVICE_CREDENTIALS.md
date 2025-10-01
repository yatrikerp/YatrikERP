# 🔑 Getting Service Credentials

## 🗺️ Mapbox Token (FREE)

### Quick Steps:
1. Visit: https://account.mapbox.com/auth/signup/
2. Sign up with email or GitHub
3. After signup, you'll be on the dashboard
4. Click on "Access tokens" in the menu
5. Copy the "Default public token"
6. Token format: `pk.eyJ1...` (starts with `pk.`)

### What to Copy:
```
Token name: Default public token
Token: pk.eyJ1IjoiWU9VUl9VU0VSTkFNRSIsImEiOiJjbGtzdHZsaWswMXkwM2RxdnMzNGRsMzR5In0.xxxxxxxxxxxxx
```

### Where to Use:
- Vercel Environment Variable: `REACT_APP_MAPBOX_TOKEN`

---

## 💳 Razorpay Key (FREE for Testing)

### Quick Steps:
1. Visit: https://dashboard.razorpay.com/signup
2. Sign up with email
3. Fill business details (can be test data)
4. After login, go to **Settings** (left menu)
5. Click **API Keys**
6. Click **Generate Test Keys**
7. Copy the **Key ID** (NOT the secret)

### What to Copy:
```
Mode: Test Mode
Key ID: rzp_test_xxxxxxxxxxxxx  ← Copy this one
Key Secret: xxxxxxxxxxxxxxx     ← Don't use this in frontend!
```

### Where to Use:
- Vercel Environment Variable: `REACT_APP_RAZORPAY_KEY_ID`
- Use ONLY the Key ID (starts with `rzp_test_`)

---

## ⚙️ Backend URL (Already Have This!)

```
REACT_APP_API_URL=https://yatrik-erp-production-075e.up.railway.app
```

This is your Railway backend URL - already deployed and working! ✅

---

## 📋 Complete Environment Variables for Vercel

Once you have all credentials:

```env
REACT_APP_API_URL=https://yatrik-erp-production-075e.up.railway.app
REACT_APP_MAPBOX_TOKEN=pk.eyJ1IjoieW91ci11c2VybmFtZSIsImEiOiJ5b3VyLXRva2VuIn0.xxxxx
REACT_APP_RAZORPAY_KEY_ID=rzp_test_xxxxxxxxxxxxx
```

---

## 🚀 For Quick Testing (Use Temporary Values)

If you want to deploy NOW and get credentials later:

```env
REACT_APP_API_URL=https://yatrik-erp-production-075e.up.railway.app
REACT_APP_MAPBOX_TOKEN=pk.eyJ1IjoibWFwYm94IiwiYSI6ImNpejY4NXVycTA2emYycXBndHRqcmZ3N3gifQ.rJcFIG214AriISLbB6B5aw
REACT_APP_RAZORPAY_KEY_ID=rzp_test_1234567890
```

**Note:** 
- Mapbox token above is a public demo token (limited features)
- Razorpay test key won't process real payments but app will work
- Replace with real values later for full functionality

---

## 🔄 Updating Variables Later

If you deploy with temporary values:

### In Vercel Dashboard:
1. Go to your project
2. Click **Settings** tab
3. Click **Environment Variables**
4. Find the variable you want to update
5. Click **Edit**
6. Paste new value
7. Click **Save**
8. **Redeploy** the project for changes to take effect

---

## ✅ Variables Checklist

Before deploying:

- [ ] `REACT_APP_API_URL` - Your Railway backend URL (required)
- [ ] `REACT_APP_MAPBOX_TOKEN` - Mapbox token (required for maps)
- [ ] `REACT_APP_RAZORPAY_KEY_ID` - Razorpay key (required for payments)

---

## 🎯 Quick Decision Matrix

### Option 1: Deploy with real credentials (Recommended)
- ✅ All features work immediately
- ✅ No need to redeploy later
- ⏱️ Takes 10 extra minutes to get credentials

### Option 2: Deploy with temporary values (Faster)
- ✅ Deploy in 2 minutes
- ⚠️ Limited map functionality
- ⚠️ Payment testing limited
- 🔄 Need to update and redeploy later

**My recommendation:** Use Option 2 now, get real credentials later!

---

## 📞 Support Links

- Mapbox Docs: https://docs.mapbox.com/help/getting-started/access-tokens/
- Razorpay Docs: https://razorpay.com/docs/payments/dashboard/account-settings/api-keys/
- Vercel Env Vars: https://vercel.com/docs/projects/environment-variables

---

**Ready to deploy? Add the variables and click Deploy!** 🚀

