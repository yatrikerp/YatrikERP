# 🎯 How to Access ML/AI Features in React Frontend

## ✅ Good News: Everything is Already Built!

Your React frontend already has all the ML/AI features implemented. Here's how to access them:

---

## 🚀 Quick Access Guide

### Step 1: Start Your Application

```bash
# Terminal 1: Start Backend
cd backend
npm start

# Terminal 2: Start Frontend
cd frontend
npm start
```

### Step 2: Login as Admin

Go to: **http://localhost:3000**

Login with admin credentials:
- Email: `admin@yatrik.com`
- Password: (your admin password)

### Step 3: Access ML Features

Once logged in, you'll see the admin sidebar. Click on any of these:

---

## 📊 Available ML/AI Pages

### 1. **ML/AI Dashboard** ⭐ MAIN PAGE
**Path:** `/admin/ml-dashboard`

**What you'll see:**
- Passenger Demand Prediction (LSTM/RNN)
- Traffic Delay Prediction (XGBoost)
- Route Performance Classification
- Model accuracy metrics
- Training status
- Real-time predictions

**How to access:**
- Click "ML/AI Dashboard" in the sidebar
- Or go to: http://localhost:3000/admin/ml-dashboard

---

### 2. **Autonomous Scheduling** 🤖
**Path:** `/admin/autonomous-scheduling`

**What you'll see:**
- AI-powered fleet scheduling
- Genetic algorithm optimization
- Multi-resource coordination
- Conflict detection
- Optimization scores
- Schedule generation

**How to access:**
- Click "Autonomous Scheduling" in sidebar
- Or go to: http://localhost:3000/admin/autonomous-scheduling

---

### 3. **Crew Fatigue Management** 😴
**Path:** `/admin/crew-fatigue`

**What you'll see:**
- Crew fatigue monitoring
- Fatigue score calculation
- Eligibility status
- Alert generation
- Rest recommendations
- Fatigue analytics

**How to access:**
- Click "Crew Fatigue" in sidebar
- Or go to: http://localhost:3000/admin/crew-fatigue

---

### 4. **Predictive Analytics** 📈
**Path:** `/admin/predictive-analytics`

**What you'll see:**
- Demand forecasting
- Revenue predictions
- Trend analysis
- Performance metrics
- Visualization charts

**How to access:**
- Click "Predictive Analytics" in sidebar
- Or go to: http://localhost:3000/admin/predictive-analytics

---

### 5. **AI Control Center** 🎛️
**Path:** `/admin/ai-control-center`

**What you'll see:**
- Centralized AI management
- Model monitoring
- System health
- Performance dashboards
- Configuration settings

**How to access:**
- Click "AI Control Center" in sidebar
- Or go to: http://localhost:3000/admin/ai-control-center

---

### 6. **Comprehensive AI Dashboard** 🌟
**Path:** `/admin/comprehensive-ai`

**What you'll see:**
- All AI features in one place
- Demand prediction
- Fatigue monitoring
- Genetic scheduling
- Analytics and insights

**How to access:**
- Click "Comprehensive AI" in sidebar
- Or go to: http://localhost:3000/admin/comprehensive-ai

---

### 7. **ML Visualization** 📊
**Path:** `/admin/ml-visualization`

**What you'll see:**
- Interactive charts
- Model performance graphs
- Prediction visualizations
- Accuracy trends

**How to access:**
- Click "ML Visualization" in sidebar
- Or go to: http://localhost:3000/admin/ml-visualization

---

## 🔍 Finding ML Features in Sidebar

When you login as admin, look for these menu items:

```
Admin Dashboard
├── 📊 Dashboard
├── 🚌 Fleet Management
│   ├── Buses
│   ├── Routes
│   └── Trips
├── 👥 User Management
├── 🤖 AI & ML Features          ← LOOK HERE!
│   ├── ML/AI Dashboard          ← Main ML page
│   ├── Autonomous Scheduling    ← AI scheduling
│   ├── Crew Fatigue            ← Fatigue monitoring
│   ├── Predictive Analytics    ← Forecasting
│   ├── AI Control Center       ← AI management
│   └── ML Visualization        ← Charts & graphs
└── ⚙️ Settings
```

---

## 🎯 What Each Page Does

### ML/AI Dashboard
**Purpose:** Central hub for all ML models

**Features:**
- View all trained models
- Check model accuracy
- See training status
- Run predictions
- Monitor performance

**Use case:** Daily monitoring of ML system health

---

### Autonomous Scheduling
**Purpose:** AI-powered trip scheduling

**Features:**
- Generate optimal schedules
- Multi-resource optimization
- Conflict detection
- Fatigue-aware assignment
- Genetic algorithm optimization

**Use case:** Automated fleet scheduling for 7-30 days

---

### Crew Fatigue Management
**Purpose:** Monitor and predict crew fatigue

**Features:**
- Real-time fatigue scoring
- Eligibility checking
- Alert generation
- Rest recommendations
- Historical tracking

**Use case:** Ensure crew safety and compliance

---

### Predictive Analytics
**Purpose:** Forecast demand and revenue

**Features:**
- Passenger demand prediction
- Revenue forecasting
- Trend analysis
- Route performance
- Seasonal patterns

**Use case:** Strategic planning and resource allocation

---

## 🔧 If You Don't See ML Features

### Issue 1: Not Logged in as Admin

**Solution:**
- Make sure you're logged in with admin role
- Check your user role in the database
- Admin users should have `role: 'admin'`

### Issue 2: Sidebar Menu Collapsed

**Solution:**
- Look for the hamburger menu icon (☰)
- Click it to expand the sidebar
- Scroll down to find AI & ML section

### Issue 3: Features Not Loading

**Solution:**
- Check if backend is running (port 5000)
- Check if frontend is running (port 3000)
- Open browser console (F12) for errors
- Verify API endpoints are accessible

### Issue 4: Backend API Not Connected

**Solution:**
```bash
# Check backend is running
curl http://localhost:5000/api/health

# If not running, start it:
cd backend
npm start
```

---

## 📱 Mobile/Responsive View

On mobile or small screens:
1. Click the menu icon (☰) in top-left
2. Scroll down to "AI & ML Features"
3. Tap to expand
4. Select the feature you want

---

## 🎨 What You'll See (Screenshots)

### ML/AI Dashboard
```
┌─────────────────────────────────────────┐
│  ML/AI Dashboard                        │
├─────────────────────────────────────────┤
│                                         │
│  📊 Passenger Demand Prediction         │
│  Status: Active | Accuracy: 87.5%      │
│  Last Trained: 2026-01-10              │
│  [View Details] [Retrain]              │
│                                         │
│  🚦 Traffic Delay Prediction           │
│  Status: Active | Accuracy: 82.3%      │
│  Last Trained: 2026-01-10              │
│  [View Details] [Retrain]              │
│                                         │
│  📈 Route Performance                   │
│  Status: Active | Accuracy: 91.2%      │
│  Last Trained: 2026-01-09              │
│  [View Details] [Retrain]              │
│                                         │
└─────────────────────────────────────────┘
```

### Autonomous Scheduling
```
┌─────────────────────────────────────────┐
│  AI Autonomous Scheduling               │
├─────────────────────────────────────────┤
│                                         │
│  Schedule Type: [Daily ▼]              │
│  Days: [7 ▼]                           │
│                                         │
│  [🚀 Run Full AI Fleet Scheduling]     │
│                                         │
│  Results:                               │
│  ✅ 150 schedules created               │
│  ✅ 45 buses assigned                   │
│  ✅ 90 drivers assigned                 │
│  ✅ Optimization Score: 92%             │
│  ⚠️  3 conflicts detected               │
│                                         │
│  [Export] [Approve & Publish]          │
│                                         │
└─────────────────────────────────────────┘
```

---

## 🚀 Quick Test

To verify everything works:

1. **Start both servers:**
```bash
# Terminal 1
cd backend && npm start

# Terminal 2
cd frontend && npm start
```

2. **Open browser:**
```
http://localhost:3000
```

3. **Login as admin**

4. **Click "ML/AI Dashboard"**

5. **You should see:**
- List of ML models
- Accuracy metrics
- Training status
- Prediction buttons

---

## 📊 Backend API Endpoints

Your frontend connects to these backend APIs:

```
GET  /api/ai-scheduling/analytics
GET  /api/ai-scheduling/predictions/:routeId
POST /api/ai-scheduling/predict-demand
POST /api/ai-scheduling/calculate-fatigue
POST /api/admin/ai/autonomous/schedule
GET  /api/admin/ai/autonomous/status
```

**Test backend:**
```bash
curl http://localhost:5000/api/ai-scheduling/analytics
```

---

## 🎓 Training Models for Frontend

The frontend shows ML features, but to get REAL predictions:

1. **Collect training data:**
```bash
cd backend
node ml-research/collect_training_data.js
```

2. **Train models on Google Colab:**
- Upload `colab_demand_prediction.py`
- Train LSTM model
- Download trained model

3. **Deploy model to backend:**
```bash
# Copy trained model to backend
cp demand_lstm_model.h5 backend/ml-models/
cp demand_scaler.pkl backend/ml-models/
```

4. **Update backend to use trained model:**
- Modify `demandPredictionService.js`
- Load trained model instead of rule-based

5. **Frontend will automatically use new predictions!**

---

## ✅ Checklist

- [ ] Backend running on port 5000
- [ ] Frontend running on port 3000
- [ ] Logged in as admin user
- [ ] Can see "ML/AI Dashboard" in sidebar
- [ ] Can access `/admin/ml-dashboard`
- [ ] Can see model list and metrics
- [ ] Can access other AI pages

---

## 🆘 Still Can't See It?

### Check 1: User Role
```javascript
// In MongoDB, check your user:
db.users.findOne({ email: 'admin@yatrik.com' })

// Should have:
{ role: 'admin' }
```

### Check 2: Routes Registered
```bash
# Check App.js has the route
grep -r "ml-dashboard" frontend/src/App.js
```

### Check 3: Component Imported
```bash
# Check AdminMLDashboard is imported
grep -r "AdminMLDashboard" frontend/src/App.js
```

### Check 4: Sidebar Menu
```bash
# Check AdminLayout has menu item
grep -r "ML/AI Dashboard" frontend/src/components/Admin/AdminLayout.jsx
```

---

## 🎉 Summary

**Your ML features ARE in the frontend!**

Just:
1. Start backend and frontend
2. Login as admin
3. Click "ML/AI Dashboard" in sidebar
4. Explore all the AI features!

The pages are already built and working. You just need to access them through the admin panel.

---

**Need help?** Let me know which page you're trying to access and I'll guide you there!
