# 🔐 Test Credentials for Flutter App

## 📱 How to Get Login Credentials

### Option 1: List Existing Users (Recommended)

Run this command to see all users in your database:

```bash
cd backend
node list-users.js
```

This will show you:
- All users grouped by role (passenger, conductor, admin, etc.)
- Their email addresses
- Phone numbers
- Active status

**Note:** Passwords are hashed in the database, so you won't see them. Use the test credentials below or create new ones.

### Option 2: Create a Test Passenger

Run this command to create a test passenger account:

```bash
cd backend
node create-test-passenger.js
```

This creates:
- **Email:** `passenger@test.com`
- **Password:** `password123`
- **Role:** `passenger`
- **Phone:** `+919876543210`

### Option 3: Register a New Account

Use the Flutter app's registration screen:
1. Open the app
2. Click "Sign Up"
3. Fill in your details
4. Create your account
5. Login with your new credentials

## 🎭 Default Test Credentials

If you've run the sample data scripts, these users should exist:

### Passenger Accounts
```
Email: passenger@test.com
Password: password123
Role: passenger
```

```
Email: john.doe@example.com
Password: password123
Role: passenger
```

### Conductor Accounts
```
Email: conductor@test.com
Password: password123
Role: conductor
```

### Admin Accounts
```
Email: admin@yatrikerp.com
Password: admin123
Role: admin
```

```
Email: superadmin@yatrikerp.com
Password: superadmin123
Role: super_admin
```

### Depot Manager Accounts
```
Email: depot.manager@yatrikerp.com
Password: depot123
Role: depot_manager
```

## 🔍 Check Your Database

### Using MongoDB Compass (GUI)
1. Open MongoDB Compass
2. Connect to: `mongodb+srv://yatrik_prod:Yatrik123@cluster0.3qt2hfg.mongodb.net/`
3. Navigate to the `users` collection
4. View all user documents
5. Note the email addresses

### Using MongoDB Shell
```bash
mongosh "mongodb+srv://yatrik_prod:Yatrik123@cluster0.3qt2hfg.mongodb.net/"

use test
db.users.find({}, { name: 1, email: 1, role: 1, _id: 0 }).pretty()
```

## 🆕 Create Users via API

You can also create users via the registration API:

```bash
curl -X POST https://yatrikerp.onrender.com/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test User",
    "email": "testuser@example.com",
    "password": "password123",
    "phone": "+919876543210",
    "role": "passenger"
  }'
```

## 📝 Password Reset

If you forgot a password, you can reset it via the backend:

```javascript
// backend/reset-password.js
const bcrypt = require('bcryptjs');
const User = require('./models/User');

async function resetPassword(email, newPassword) {
  const salt = await bcrypt.genSalt(12);
  const hashedPassword = await bcrypt.hash(newPassword, salt);
  
  await User.findOneAndUpdate(
    { email },
    { password: hashedPassword }
  );
  
  console.log(`Password reset for ${email}`);
}
```

## 🎯 Quick Start

1. **List existing users:**
   ```bash
   node backend/list-users.js
   ```

2. **Create test passenger:**
   ```bash
   node backend/create-test-passenger.js
   ```

3. **Login to Flutter app:**
   - Email: `passenger@test.com`
   - Password: `password123`

## 🔒 Security Notes

- Never commit real passwords to Git
- Use strong passwords in production
- Test credentials are for development only
- Change default passwords before going live
- Enable 2FA for admin accounts

## 📱 Testing in Flutter App

Once you have credentials:

1. Open the Flutter app
2. Click "Login"
3. Enter email and password
4. Click "Sign In"
5. You should be redirected to the home screen

If login fails:
- Check backend is running: `https://yatrikerp.onrender.com/api/health`
- Verify credentials are correct
- Check network connection
- View app logs for errors

---

**Need help?** Run `node backend/list-users.js` to see all available accounts!
