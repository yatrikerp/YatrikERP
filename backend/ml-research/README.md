# ML Research - Training Your Models

## 📁 Files in This Folder

### Data Collection
- **collect_training_data.js** - Export data from MongoDB for ML training

### Model Training (Google Colab)
- **colab_demand_prediction.py** - LSTM model for passenger demand prediction
- **demand_prediction_lstm.py** - Alternative LSTM implementation
- **crew_fatigue_ml.py** - Random Forest/XGBoost for crew fatigue

### Data Folder (Created After Collection)
- **data/demand_training_data.json** - Passenger demand data
- **data/fatigue_training_data.json** - Crew fatigue data
- **data/route_performance_data.json** - Route statistics
- **data/data_summary.json** - Data collection summary

### Models Folder (Created After Training)
- **models/demand_lstm_model.h5** - Trained LSTM model
- **models/demand_scaler.pkl** - Data scaler
- **models/feature_columns.json** - Feature configuration
- **models/fatigue_model.pkl** - Trained fatigue model

---

## 🚀 Quick Start

### Step 1: Collect Data
```bash
cd backend
node ml-research/collect_training_data.js
```

### Step 2: Train on Google Colab
1. Go to https://colab.research.google.com/
2. Upload `colab_demand_prediction.py`
3. Enable GPU (Runtime → Change runtime type → GPU)
4. Run all cells
5. Upload `data/demand_training_data.json` when prompted
6. Wait 20-30 minutes
7. Download trained model files

### Step 3: Deploy Model
```bash
# Copy downloaded files to models folder
mkdir -p ml-research/models
# Place downloaded files here:
# - demand_lstm_model.h5
# - demand_scaler.pkl
# - feature_columns.json
```

---

## 📊 What Each Script Does

### collect_training_data.js
**Purpose**: Export historical data from MongoDB

**What it collects**:
- Trip data (passengers, routes, times)
- Crew fatigue records
- Route performance metrics

**Output**: JSON files in `data/` folder

**Run time**: 1-2 minutes

### colab_demand_prediction.py
**Purpose**: Train LSTM model for demand prediction

**What it does**:
1. Load and analyze data
2. Preprocess and normalize
3. Create time-series sequences
4. Build LSTM architecture
5. Train model with GPU
6. Evaluate performance
7. Save trained model

**Run time**: 20-30 minutes (with GPU)

**Requirements**: 
- 1000+ training records
- Google Colab account
- GPU enabled

### crew_fatigue_ml.py
**Purpose**: Train ML model for fatigue prediction

**What it does**:
1. Load fatigue data
2. Feature engineering
3. Train Random Forest/XGBoost
4. Compare models
5. Feature importance analysis
6. Save best model

**Run time**: 5-10 minutes

**Requirements**:
- 500+ fatigue records
- Ground truth fatigue scores

---

## 📈 Expected Performance

### Demand Prediction Model
- MAE: 3-5 passengers
- RMSE: 5-8 passengers
- MAPE: 10-15%
- R²: 0.85-0.92

### Fatigue Prediction Model
- MAE: 5-10 fatigue points
- RMSE: 8-15 fatigue points
- R²: 0.75-0.85
- Accuracy: 80-90%

---

## 🔧 Troubleshooting

### "Not enough data"
**Solution**: Run system for 2-3 more months to collect data

### "GPU not available in Colab"
**Solution**: Runtime → Change runtime type → GPU (T4)

### "Model overfitting"
**Solution**: Increase dropout, reduce complexity, or collect more data

### "Poor performance"
**Solution**: Check data quality, try different hyperparameters

---

## 📚 Documentation

- **GOOGLE_COLAB_TRAINING_GUIDE.md** - Complete Colab tutorial
- **COLAB_QUICK_REFERENCE.md** - Quick reference card
- **ML_RESEARCH_ROADMAP.md** - 6-month research plan
- **ML_QUICK_START.md** - 7-day quick start guide

---

## 🎯 Next Steps

1. ✅ Collect data → `node collect_training_data.js`
2. ✅ Train model → Upload to Google Colab
3. ✅ Evaluate results → Check metrics
4. ✅ Deploy model → Integrate with backend
5. ✅ Monitor performance → Track accuracy

---

## 🆘 Need Help?

See the main documentation files in the project root:
- `ML_RESEARCH_SUMMARY.md` - Overview
- `GOOGLE_COLAB_TRAINING_GUIDE.md` - Detailed guide
- `COLAB_QUICK_REFERENCE.md` - Quick tips

---

**Last Updated**: March 3, 2026
**Status**: Ready for Training
