# AI Features Quick Start Guide

## 🚀 Quick Setup (5 Minutes)

### Step 1: Install Dependencies
```bash
cd flutter
flutter pub get
```

### Step 2: Configure API
Edit `flutter/lib/config/api_config.dart`:
```dart
class ApiConfig {
  static const String baseUrl = 'https://your-api-url.com';
}
```

### Step 3: Run the App
```bash
flutter run
```

## 📱 How to Access AI Features

### For Admin Users:

1. **Login** as admin
2. Navigate to **Admin Dashboard**
3. Click **"AI Scheduling Dashboard"**
4. Choose your feature:
   - 🔮 **Predictive Demand Model**
   - 🧬 **AI Scheduling Engine**
   - 😴 **Crew Fatigue Management**
   - 💰 **Dynamic Fare Optimization**
   - ✅ **Smart Concession Verification**

## 🎯 Feature Overview

### 1. Predictive Demand Model
**What it does**: Forecasts passenger demand for routes

**How to use**:
1. Enter Route ID
2. Select prediction date
3. Choose time slot (06:00, 09:00, 12:00, etc.)
4. Click "Predict Demand"

**Output**:
- Predicted passenger count
- Confidence score
- Demand level (low/medium/high/very_high)

---

### 2. AI Scheduling Engine
**What it does**: Optimizes trip schedules using Genetic Algorithm

**How to use**:
1. Enter Depot ID
2. Select start date
3. Select end date
4. Click "Generate Schedule"

**Output**:
- Fitness score
- Number of generations
- Execution time
- Optimization improvement percentage

---

### 3. Crew Fatigue Management
**What it does**: Monitors crew fatigue and eligibility

**How to use**:
1. Enter Depot ID
2. Select report date
3. Click "Generate Report"

**Output**:
- Total crew records
- Average fatigue score
- High fatigue count
- Ineligible crew members
- Individual crew details

---

### 4. Dynamic Fare Optimization
**Status**: Coming soon (backend integration pending)
**What it does**: AI-powered fare adjustments based on demand

---

### 5. Smart Concession Verification
**Status**: Coming soon (backend integration pending)
**What it does**: Automated validation of concession passes

## 🔧 Technical Details

### Files Created:
```
flutter/lib/
├── services/
│   └── ai_service.dart                      # AI API calls
├── providers/
│   └── ai_scheduling_provider.dart          # State management
└── screens/admin/
    ├── ai_scheduling_dashboard.dart         # Main hub
    ├── demand_prediction_screen.dart        # Demand forecasting
    ├── crew_fatigue_screen.dart             # Fatigue management
    ├── genetic_scheduling_screen.dart       # AI scheduling
    ├── fare_optimization_screen.dart        # Fare optimization
    └── concession_verification_screen.dart  # Concession verification
```

### Routes Added:
```dart
'/admin/ai-dashboard'              // AI features hub
'/admin/demand-prediction'         // Demand forecasting
'/admin/crew-fatigue'              // Fatigue management
'/admin/genetic-scheduling'        // AI scheduling
'/admin/fare-optimization'         // Fare optimization
'/admin/concession-verification'   // Concession verification
```

## 📊 API Endpoints Used

| Feature | Endpoint | Method |
|---------|----------|--------|
| Predict Demand | `/api/ai-scheduling/predict-demand` | POST |
| Batch Predict | `/api/ai-scheduling/batch-predict` | POST |
| Get Predictions | `/api/ai-scheduling/predictions/:routeId` | GET |
| Calculate Fatigue | `/api/ai-scheduling/calculate-fatigue` | POST |
| Batch Fatigue | `/api/ai-scheduling/batch-calculate-fatigue` | POST |
| Eligible Crew | `/api/ai-scheduling/eligible-crew` | GET |
| Fatigue Report | `/api/ai-scheduling/fatigue-report/:depotId` | GET |
| Genetic Schedule | `/api/ai-scheduling/genetic-schedule` | POST |
| Analytics | `/api/ai-scheduling/analytics` | GET |

## 🎨 UI Components

### Dashboard Cards
- Analytics overview with stats
- Feature cards with icons
- Color-coded demand levels
- Fatigue score indicators

### Forms
- Date pickers for scheduling
- Dropdown for time slots
- Text inputs for IDs
- Validation on all fields

### Results Display
- Stat cards with icons
- Color-coded alerts
- Detailed reports
- Performance metrics

## 💡 Tips

1. **Test with Real Data**: Use actual route IDs and depot IDs from your database
2. **Check Backend**: Ensure backend AI services are running
3. **Monitor Performance**: Watch for API response times
4. **Handle Errors**: Check error messages in SnackBars
5. **Refresh Data**: Pull down to refresh on any screen

## 🐛 Troubleshooting

### "Failed to predict demand"
- Check if route ID exists
- Verify API endpoint is accessible
- Check authentication token

### "Failed to calculate fatigue"
- Verify depot ID is correct
- Ensure crew data exists
- Check date range

### "Failed to schedule"
- Confirm depot has buses and routes
- Check date range is valid
- Verify sufficient crew available

## ✅ Testing Checklist

- [ ] Login as admin user
- [ ] Access AI Dashboard
- [ ] Test demand prediction
- [ ] Test crew fatigue report
- [ ] Test genetic scheduling
- [ ] Check analytics display
- [ ] Verify error handling
- [ ] Test refresh functionality

## 📈 Next Steps

1. **Test all features** with real data
2. **Gather feedback** from admin users
3. **Monitor performance** metrics
4. **Complete remaining features** (fare optimization, concession verification)
5. **Add visualizations** (charts, graphs)
6. **Implement notifications** for alerts

## 🎉 Success!

You now have AI-powered features in your Flutter app that match the web dashboard functionality!

---

**Need Help?** Check `FLUTTER_AI_FEATURES_INTEGRATION.md` for detailed documentation.
