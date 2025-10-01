# 👨‍💼 Creating Admin User for YATRIK ERP

## 🎯 Quick Admin Setup

After your application is deployed, you need an admin user to access all features.

---

## Method 1: Using Backend Script (Recommended)

### Option A: Direct Database Insert (MongoDB Atlas)

1. **Go to MongoDB Atlas**: https://cloud.mongodb.com
2. **Select your cluster** → **Browse Collections**
3. **Select database**: `yatrik-erp` (or your database name)
4. **Select collection**: `users`
5. **Click "Insert Document"**
6. **Paste this JSON**:

```json
{
  "name": "Admin User",
  "email": "admin@yatrik.com",
  "phone": "9876543210",
  "password": "$2a$10$rQZ1YB7qF.YXF1hZ1QXqv.ZvZ9QzQzQzQzQzQzQzQzQzQzQzQz",
  "role": "admin",
  "status": "active",
  "isActive": true,
  "authProvider": "local",
  "emailVerified": true,
  "phoneVerified": true,
  "createdAt": {"$date": "2025-10-01T00:00:00.000Z"},
  "updatedAt": {"$date": "2025-10-01T00:00:00.000Z"}
}
```

**Login Credentials:**
- Email: `admin@yatrik.com`
- Password: `admin123`

### Option B: Using Railway CLI or Local Script

If you have access to your backend code locally:

1. **Create a script** `create-admin.js` in backend folder:

```javascript
require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');

async function createAdmin() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    
    const adminExists = await User.findOne({ email: 'admin@yatrik.com' });
    
    if (adminExists) {
      console.log('Admin user already exists!');
      process.exit(0);
    }
    
    const admin = new User({
      name: 'Admin User',
      email: 'admin@yatrik.com',
      phone: '9876543210',
      password: 'admin123',
      role: 'admin',
      status: 'active',
      isActive: true,
      authProvider: 'local',
      emailVerified: true,
      phoneVerified: true
    });
    
    await admin.save();
    console.log('✅ Admin user created successfully!');
    console.log('Email: admin@yatrik.com');
    console.log('Password: admin123');
    
    process.exit(0);
  } catch (error) {
    console.error('Error creating admin:', error);
    process.exit(1);
  }
}

createAdmin();
```

2. **Run the script**:
```bash
cd backend
node create-admin.js
```

---

## Method 2: Sign Up as Regular User, Then Upgrade

### Step 1: Sign Up
1. Go to your Vercel URL
2. Click **Sign Up**
3. Register as a regular user

### Step 2: Upgrade to Admin in Database
1. Go to **MongoDB Atlas**
2. Find the **users** collection
3. Find your user document
4. Click **Edit**
5. Change `"role": "passenger"` to `"role": "admin"`
6. **Update** the document

---

## Method 3: Use API to Create Admin (If Auth is Open)

You can use Postman or curl:

```bash
curl -X POST https://yatrik-erp-production-075e.up.railway.app/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Admin User",
    "email": "admin@yatrik.com",
    "phone": "9876543210",
    "password": "admin123",
    "role": "admin"
  }'
```

Then manually update role to 'admin' in database if needed.

---

## 🎯 Default Admin Credentials (After Setup)

```
Email: admin@yatrik.com
Password: admin123
```

**⚠️ IMPORTANT:** Change this password immediately after first login!

---

## 🔐 Create Other User Roles

### Depot Manager:
```json
{
  "name": "Depot Manager",
  "email": "depot@yatrik.com",
  "phone": "9876543211",
  "password": "depot123",
  "role": "depot_manager",
  "depotId": "your-depot-id-here"
}
```

### Driver:
```json
{
  "name": "Driver User",
  "email": "driver@yatrik.com",
  "phone": "9876543212",
  "password": "driver123",
  "role": "driver"
}
```

### Conductor:
```json
{
  "name": "Conductor User",
  "email": "conductor@yatrik.com",
  "phone": "9876543213",
  "password": "conductor123",
  "role": "conductor"
}
```

### Passenger (Regular User):
```json
{
  "name": "Passenger User",
  "email": "passenger@yatrik.com",
  "phone": "9876543214",
  "password": "passenger123",
  "role": "passenger"
}
```

---

## ✅ After Creating Admin

1. **Go to your Vercel URL**
2. **Click Login**
3. **Enter credentials**:
   - Email: `admin@yatrik.com`
   - Password: `admin123`
4. **You should see Admin Dashboard** ✅

---

## 🧪 Test Admin Features

After login, you should have access to:

- ✅ Admin Dashboard
- ✅ Depot Management
- ✅ Fleet Management
- ✅ Route Management
- ✅ Trip Scheduling
- ✅ Staff Management
- ✅ Reports & Analytics
- ✅ System Configuration

---

## 🔍 Troubleshooting

### Cannot Login
- Check if user exists in database
- Verify role is set to 'admin'
- Clear browser cache and cookies
- Check browser console for errors

### Password Not Working
- Password should be hashed by bcrypt automatically
- If manually inserting, use the hashed password provided
- Or use the script to create user properly

### Role Not Working
- Ensure role is exactly "admin" (lowercase)
- Check status is "active"
- Verify isActive is true

---

## 🎉 You're All Set!

Once admin user is created, you can:
1. Login to admin dashboard
2. Create depots
3. Add buses and routes
4. Manage the entire system
5. Create other users from admin panel

**Your YATRIK ERP is fully operational!** 🚀

