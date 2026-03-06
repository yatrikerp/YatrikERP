# Fix: MongoDB Connection Timeout

## ❌ Error You're Seeing

```
❌ Error collecting data: MongooseError: Operation `trips.find()` buffering timed out after 10000ms
```

## 🔧 Quick Fixes

### Fix 1: Make Sure MongoDB is Running

**Check if MongoDB is running:**
```bash
# Windows
tasklist | findstr mongod

# If not running, start MongoDB service:
net start MongoDB
```

### Fix 2: Check Your .env File

Open `backend/.env` and verify:
```env
MONGODB_URI=mongodb://localhost:27017/yatrik-erp
# OR if using MongoDB Atlas:
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/yatrik-erp
```

### Fix 3: Stop Backend Server First

If your backend server is running, stop it:
```bash
# Press Ctrl+C in the terminal where server is running
```

Then try data collection again:
```bash
node ml-research/collect_training_data.js
```

### Fix 4: Test MongoDB Connection

Create a test file to verify connection:

```bash
# In backend folder, create test-mongo.js
```

```javascript
const mongoose = require('mongoose');

mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/yatrik-erp', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  serverSelectionTimeoutMS: 5000
})
.then(() => {
  console.log('✅ MongoDB connected successfully!');
  process.exit(0);
})
.catch((err) => {
  console.error('❌ MongoDB connection failed:', err.message);
  process.exit(1);
});
```

Run it:
```bash
node test-mongo.js
```

---

## 🎯 Alternative: Use Sample Data

If you don't have enough real data yet, I can create sample data for testing:

### Option A: Generate Sample Data

```bash
# Run this to create sample trips
node backend/check-and-create-sample-data.js
```

### Option B: Use Minimal Data Collection

Create a simpler version that doesn't require much data:

```bash
# Create ml-research/collect_minimal_data.js
```

I'll create this file for you below.

---

## 📊 Check How Much Data You Have

Before collecting, check your database:

```javascript
// In backend folder, create check-data.js
const mongoose = require('mongoose');
const Trip = require('./models/Trip');
const CrewFatigue = require('./models/CrewFatigue');

mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/yatrik-erp')
  .then(async () => {
    const tripCount = await Trip.countDocuments();
    const fatigueCount = await CrewFatigue.countDocuments();
    
    console.log(`📊 Data Available:`);
    console.log(`Trips: ${tripCount}`);
    console.log(`Fatigue Records: ${fatigueCount}`);
    console.log(`\nML Readiness:`);
    console.log(`Demand Prediction: ${tripCount >= 1000 ? '✅ Ready' : '❌ Need ' + (1000 - tripCount) + ' more'}`);
    console.log(`Fatigue Prediction: ${fatigueCount >= 500 ? '✅ Ready' : '❌ Need ' + (500 - fatigueCount) + ' more'}`);
    
    process.exit(0);
  })
  .catch(err => {
    console.error('❌ Error:', err.message);
    process.exit(1);
  });
```

Run it:
```bash
node check-data.js
```

---

## 🚀 What to Do Now

### If MongoDB is Not Running:
1. Start MongoDB service
2. Try data collection again

### If You Don't Have Enough Data:
1. Run your system for 2-3 more months
2. OR use sample data for testing
3. OR proceed with limited data (results may be poor)

### If Connection Still Fails:
1. Check firewall settings
2. Verify MongoDB port (27017) is not blocked
3. Try connecting with MongoDB Compass to test

---

## 💡 Quick Workaround: Use Existing Data

If you have ANY trips in your database, you can still train a model (even with limited data):

```bash
# I'll create a minimal data collector that works with any amount of data
```

Let me know if you want me to create this!

---

## ✅ Once Fixed

After fixing the connection, run:
```bash
cd backend
node ml-research/collect_training_data.js
```

You should see:
```
🚀 Starting ML training data collection...
🔌 Connecting to MongoDB...
✅ MongoDB connected successfully

📊 Collecting demand prediction data...
✅ Collected 1523 demand records

😴 Collecting crew fatigue data...
✅ Collected 847 fatigue records
```

---

## 🆘 Still Not Working?

Try this diagnostic:

```bash
# Check MongoDB status
mongosh --eval "db.adminCommand('ping')"

# If that works, MongoDB is running
# If not, start MongoDB service
```

Or just tell me what error you see and I'll help fix it!
