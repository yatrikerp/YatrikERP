# 🚀 Quick Login Guide

## 📱 Test the App NOW

### Step 1: Open the App
The app should already be running on your Moto G40 Fusion

### Step 2: Use These Credentials

#### 👤 Passenger Account (Recommended for Testing)
```
Email: passenger@yatrik.com
Password: Passenger@123
```

#### 👨‍💼 Admin Account (For AI Features)
```
Email: admin@yatrik.com
Password: Admin@123
```

#### 🚌 Conductor Account
```
Email: conductor@yatrik.com
Password: Conductor@123
```

---

## 🔧 If Login Fails

### Quick Fix 1: Check Internet
- Ensure your phone has internet connection
- Try opening a browser and visiting: https://yatrikerp.onrender.com

### Quick Fix 2: Wait for Backend
- The backend might be sleeping (Render free tier)
- First request takes 30-60 seconds to wake up
- Just wait and try again

### Quick Fix 3: Check Console
- Look at the Flutter console output
- You should see:
  ```
  🌐 POST: https://yatrikerp.onrender.com/api/auth/login
  ✅ Status: 200
  ```

---

## 🎯 What to Test

### As Passenger:
1. Login with `passenger@yatrik.com`
2. Search for trips
3. Book a ticket
4. View bookings

### As Admin:
1. Login with `admin@yatrik.com`
2. Go to Admin Dashboard
3. Click "AI Scheduling Dashboard"
4. Test AI features:
   - Demand Prediction
   - Crew Fatigue
   - AI Scheduling

### As Conductor:
1. Login with `conductor@yatrik.com`
2. View assigned trips
3. Scan QR codes
4. Manage bookings

---

## 📊 All Test Accounts

| Role | Email | Password |
|------|-------|----------|
| Passenger | passenger@yatrik.com | Passenger@123 |
| Admin | admin@yatrik.com | Admin@123 |
| Conductor | conductor@yatrik.com | Conductor@123 |
| Depot Manager | depot@yatrik.com | Depot@123 |
| Super Admin | superadmin@yatrik.com | SuperAdmin@123 |
| Vendor | vendor@yatrik.com | Vendor@123 |

---

## 🌐 API Status

**Production URL**: https://yatrikerp.onrender.com

**Check if backend is up**:
```bash
curl https://yatrikerp.onrender.com/api/health
```

Should return: `{"status":"ok"}`

---

## 💡 Pro Tips

1. **First login is slow**: Backend wakes up from sleep (30-60 seconds)
2. **Subsequent logins are fast**: Backend stays awake for 15 minutes
3. **Use Passenger account first**: Easiest to test
4. **Check Flutter console**: Look for 🌐 and ✅ emojis
5. **Network errors are normal**: Just retry after 30 seconds

---

## 🆘 Still Not Working?

### Check These:

1. **Phone has internet** ✓
2. **Backend is awake** (visit URL in browser)
3. **Correct credentials** (copy-paste from above)
4. **Wait 30 seconds** (for backend to wake up)
5. **Check Flutter console** (for error messages)

### Common Errors:

**"Network error: TimeoutException"**
- Backend is waking up, wait 30 seconds and retry

**"Network error: SocketException"**
- Check phone's internet connection

**"Invalid credentials"**
- Double-check email and password (case-sensitive)

---

**Quick Start**: Use `passenger@yatrik.com` / `Passenger@123` 🎉
