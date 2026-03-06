# Google Colab ML Training Guide

## 🎯 Train Your ML Models on Free GPU

This guide shows you how to train your passenger demand prediction model using Google Colab's free GPU.

---

## 📋 Prerequisites

1. Google account (Gmail)
2. Training data collected from your MongoDB
3. Basic understanding of Python (helpful but not required)

---

## 🚀 Step-by-Step Instructions

### Step 1: Collect Training Data (5 minutes)

On your local machine, run:

```bash
cd backend
node ml-research/collect_training_data.js
```

This creates `ml-research/data/demand_training_data.json`

**Verify you have enough data:**
- Minimum: 1000 records
- Recommended: 2000+ records
- Ideal: 5000+ records

### Step 2: Open Google Colab (2 minutes)

1. Go to https://colab.research.google.com/
2. Sign in with your Google account
3. You'll see the Colab welcome screen

### Step 3: Create New Notebook (1 minute)

**Option A: Upload the Python script**
1. Click "File" → "Upload notebook"
2. Upload `backend/ml-research/colab_demand_prediction.py`
3. Colab will convert it to a notebook

**Option B: Copy-paste code**
1. Click "File" → "New notebook"
2. Copy code from `colab_demand_prediction.py`
3. Paste into cells (each `# CELL X:` comment = new cell)

### Step 4: Enable GPU (IMPORTANT!) (1 minute)

1. Click "Runtime" → "Change runtime type"
2. Hardware accelerator: Select "GPU"
3. GPU type: "T4 GPU" (free tier)
4. Click "Save"

**Verify GPU is enabled:**
Run this in a cell:
```python
import tensorflow as tf
print("GPU Available:", tf.config.list_physical_devices('GPU'))
```

Should show: `GPU Available: [PhysicalDevice(name='/physical_device:GPU:0', device_type='GPU')]`

### Step 5: Upload Your Data (2 minutes)

When you reach the "Upload Data File" cell, it will prompt you:

1. Click "Choose Files"
2. Select `demand_training_data.json` from your computer
3. Wait for upload to complete (usually 10-30 seconds)

### Step 6: Run All Cells (20-30 minutes)

**Option A: Run all at once**
- Click "Runtime" → "Run all"
- Sit back and watch the magic happen ✨

**Option B: Run cell by cell**
- Click the play button (▶) on each cell
- Wait for each cell to complete before running the next
- This helps you understand what's happening

### Step 7: Monitor Training (20 minutes)

You'll see:
- Installation progress (Cell 1)
- Data loading confirmation (Cell 3)
- Beautiful visualizations (Cell 4)
- Training progress bar (Cell 8)
- Real-time loss/accuracy updates

**Training typically takes 15-25 minutes with GPU**

### Step 8: Review Results (5 minutes)

After training completes, you'll see:

```
📊 MODEL PERFORMANCE METRICS
==================================================
Mean Absolute Error (MAE):  3.45 passengers
Root Mean Squared Error:    5.23 passengers
Mean Absolute % Error:      12.34%
R² Score:                   0.8912
==================================================

🎯 Target Benchmarks:
MAE < 5 passengers:  ✅ PASS
RMSE < 8 passengers: ✅ PASS
MAPE < 15%:          ✅ PASS
R² > 0.85:           ✅ PASS
```

### Step 9: Download Trained Model (2 minutes)

The notebook automatically downloads 3 files:
1. `demand_lstm_model.h5` - Your trained model
2. `demand_scaler.pkl` - Data scaler (needed for predictions)
3. `feature_columns.json` - Feature configuration
4. `training_report.json` - Performance report

**Save these files!** You'll need them for deployment.

---

## 📊 Understanding the Visualizations

### 1. Exploratory Data Analysis (Cell 4)

**Passenger Distribution**
- Shows how many trips had X passengers
- Should be roughly bell-shaped
- Outliers indicate special events

**Passengers by Day of Week**
- 0 = Sunday, 6 = Saturday
- Helps identify weekend patterns
- Useful for validating seasonal factors

**Passengers by Hour**
- Shows peak hours (usually 7-9 AM, 5-7 PM)
- Validates your peak hour detection
- Identifies off-peak opportunities

**Correlation Heatmap**
- Red = positive correlation
- Blue = negative correlation
- Helps identify important features

### 2. Training History (Cell 10)

**Loss Graph**
- Should decrease over time
- Training and validation should be close
- If validation increases → overfitting

**MAE Graph**
- Mean Absolute Error over epochs
- Lower is better
- Target: < 5 passengers

**MAPE Graph**
- Percentage error
- Lower is better
- Target: < 15%

### 3. Predictions vs Actual (Cell 10)

**Line Plot**
- Blue line = actual passengers
- Orange line = predicted passengers
- Closer lines = better predictions
- Red shaded area = error

**Scatter Plot**
- Points near red line = good predictions
- Points far from line = poor predictions
- Should cluster around diagonal

---

## 🔧 Troubleshooting

### Issue: "Not enough data"

**Symptoms:**
```
Training samples: 234
Test samples: 59
```

**Solution:**
- You need at least 1000 records
- Run your system for 2-3 more months
- Or use data augmentation (advanced)

### Issue: "GPU not available"

**Symptoms:**
```
GPU Available: []
```

**Solution:**
1. Runtime → Change runtime type → GPU
2. If still not working, try:
   - Disconnect and delete runtime
   - Reconnect
   - Change runtime type again

### Issue: "Model overfitting"

**Symptoms:**
- Training loss keeps decreasing
- Validation loss increases or plateaus
- Large gap between training and validation metrics

**Solution:**
- Increase dropout rate (change 0.2 to 0.3-0.5)
- Reduce model complexity (fewer LSTM units)
- Collect more training data
- Add regularization

### Issue: "Poor performance (MAPE > 20%)"

**Symptoms:**
```
MAPE: 25.67%
R² Score: 0.6234
```

**Solution:**
1. Check data quality (missing values, outliers)
2. Try different sequence lengths (14 days instead of 7)
3. Add more features (weather, events)
4. Increase model complexity (more LSTM layers)
5. Train for more epochs

### Issue: "Training too slow"

**Symptoms:**
- Each epoch takes > 2 minutes
- Training stuck at 0%

**Solution:**
1. Verify GPU is enabled (see Step 4)
2. Reduce batch size (32 → 16)
3. Reduce sequence length (7 → 5)
4. Use fewer features

### Issue: "Out of memory"

**Symptoms:**
```
ResourceExhaustedError: OOM when allocating tensor
```

**Solution:**
1. Reduce batch size (32 → 16 → 8)
2. Reduce model size (128 → 64 LSTM units)
3. Reduce sequence length
4. Clear runtime: Runtime → Factory reset runtime

---

## 💡 Tips for Better Results

### 1. Data Quality
- Remove outliers (passengers > 100 or < 0)
- Handle missing values properly
- Ensure dates are sorted chronologically

### 2. Feature Engineering
- Add weather data (if available)
- Add holiday indicators
- Add special events (festivals, strikes)
- Add route difficulty/popularity

### 3. Model Tuning
- Try different sequence lengths (5, 7, 14, 30 days)
- Experiment with LSTM units (64, 128, 256)
- Adjust dropout rates (0.1, 0.2, 0.3)
- Try bidirectional LSTM

### 4. Training Strategy
- Use early stopping (already included)
- Use learning rate reduction (already included)
- Train for more epochs if not converging
- Use cross-validation for robust evaluation

---

## 📈 Advanced: Hyperparameter Tuning

Want to squeeze out more performance? Try these variations:

### Experiment 1: Deeper Network
```python
model = Sequential([
    LSTM(256, return_sequences=True, input_shape=input_shape),
    Dropout(0.3),
    LSTM(128, return_sequences=True),
    Dropout(0.3),
    LSTM(64, return_sequences=False),
    Dropout(0.2),
    Dense(32, activation='relu'),
    Dense(1)
])
```

### Experiment 2: Bidirectional LSTM
```python
from tensorflow.keras.layers import Bidirectional

model = Sequential([
    Bidirectional(LSTM(128, return_sequences=True), input_shape=input_shape),
    Dropout(0.2),
    Bidirectional(LSTM(64, return_sequences=False)),
    Dropout(0.2),
    Dense(32, activation='relu'),
    Dense(1)
])
```

### Experiment 3: Longer Sequence
```python
SEQUENCE_LENGTH = 14  # Use 14 days instead of 7
```

### Experiment 4: Different Optimizer
```python
from tensorflow.keras.optimizers import Adam

model.compile(
    optimizer=Adam(learning_rate=0.001),
    loss='huber',  # More robust to outliers
    metrics=['mae', 'mape']
)
```

---

## 🎓 Next Steps After Training

### 1. Deploy Model to Backend

Copy the downloaded files to your backend:
```bash
# On your local machine
mkdir backend/ml-models
cp demand_lstm_model.h5 backend/ml-models/
cp demand_scaler.pkl backend/ml-models/
cp feature_columns.json backend/ml-models/
```

### 2. Create Prediction API

See `ML_QUICK_START.md` Day 7 for API integration code.

### 3. A/B Test

Compare ML predictions vs. rule-based predictions:
- Run both systems in parallel
- Track accuracy over 1 week
- Choose the better performer

### 4. Monitor Performance

Track these metrics in production:
- Prediction accuracy (MAE, MAPE)
- Response time
- Error rate
- User feedback

### 5. Retrain Periodically

- Collect new data monthly
- Retrain model every 3 months
- Compare new model vs. old model
- Deploy if improvement > 5%

---

## 📚 Resources

### Google Colab Tutorials
- [Colab Basics](https://colab.research.google.com/notebooks/basic_features_overview.ipynb)
- [Using GPU](https://colab.research.google.com/notebooks/gpu.ipynb)
- [TensorFlow Tutorial](https://www.tensorflow.org/tutorials)

### LSTM Resources
- [Understanding LSTM Networks](http://colah.github.io/posts/2015-08-Understanding-LSTMs/)
- [Time Series Forecasting with LSTM](https://machinelearningmastery.com/time-series-forecasting-long-short-term-memory-network-python/)

### Research Papers
- "Long Short-Term Memory" - Hochreiter & Schmidhuber (1997)
- "Passenger Demand Forecasting" - Various recent papers

---

## ✅ Checklist

Before starting:
- [ ] Collected training data (1000+ records)
- [ ] Have Google account
- [ ] Opened Google Colab
- [ ] Enabled GPU runtime

During training:
- [ ] Uploaded data file successfully
- [ ] GPU is enabled and working
- [ ] Training is progressing (loss decreasing)
- [ ] No errors in any cells

After training:
- [ ] MAE < 5 passengers ✅
- [ ] RMSE < 8 passengers ✅
- [ ] MAPE < 15% ✅
- [ ] R² > 0.85 ✅
- [ ] Downloaded all 4 files
- [ ] Saved files safely

---

## 🆘 Need Help?

### Common Questions

**Q: How long does training take?**
A: 15-30 minutes with GPU, 2-4 hours without GPU

**Q: Can I close my browser during training?**
A: No! Keep the tab open. Colab will disconnect if inactive.

**Q: How much does Google Colab cost?**
A: Free tier includes GPU! Colab Pro ($10/month) offers faster GPUs.

**Q: Can I train multiple models?**
A: Yes! Just create a new notebook for each model.

**Q: What if my data is too large?**
A: Colab has 12GB RAM. If data > 1GB, use sampling or Colab Pro.

---

## 🎉 Success!

Once you see:
```
✅ All done! Your model is ready for deployment.
```

You've successfully trained your first ML model! 🚀

**Next:** Follow `ML_QUICK_START.md` Day 7 to deploy your model.

---

**Created**: March 3, 2026
**Last Updated**: March 3, 2026
**Estimated Time**: 45 minutes (including training)
**Difficulty**: ⭐⭐ Easy (beginner-friendly)
