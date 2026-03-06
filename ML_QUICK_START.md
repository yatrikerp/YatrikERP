# ML Research Quick Start Guide

## 🎯 Start Here: Your First ML Model in 1 Week

This guide will help you train your first ML model for passenger demand prediction in just 7 days.

---

## Day 1: Setup & Data Collection

### Install Dependencies
```bash
# Python ML libraries
pip install tensorflow pandas numpy scikit-learn matplotlib seaborn jupyter

# Node.js (already installed)
cd backend
npm install
```

### Collect Training Data
```bash
# Run data collection script
node ml-research/collect_training_data.js

# Expected output:
# ✅ Collected 1500+ demand records
# ✅ Collected 800+ fatigue records
# ✅ Collected 50+ route performance records
```

### Verify Data Quality
```bash
# Check collected data
ls -la ml-research/data/

# You should see:
# - demand_training_data.json
# - fatigue_training_data.json
# - route_performance_data.json
# - data_summary.json
```

---

## Day 2: Exploratory Data Analysis (EDA)

### Create Jupyter Notebook
```bash
jupyter notebook ml-research/exploratory_analysis.ipynb
```

### Analysis Checklist
```python
import pandas as pd
import matplotlib.pyplot as plt
import seaborn as sns

# Load data
df = pd.read_json('data/demand_training_data.json')

# 1. Basic statistics
print(df.describe())
print(df.info())

# 2. Check for missing values
print(df.isnull().sum())

# 3. Visualize passenger distribution
plt.figure(figsize=(10, 6))
plt.hist(df['passengers'], bins=30)
plt.title('Passenger Distribution')
plt.xlabel('Passengers')
plt.ylabel('Frequency')
plt.show()

# 4. Analyze by day of week
df.groupby('day_of_week')['passengers'].mean().plot(kind='bar')
plt.title('Average Passengers by Day of Week')
plt.show()

# 5. Analyze by time slot
df.groupby('hour')['passengers'].mean().plot(kind='line')
plt.title('Average Passengers by Hour')
plt.show()

# 6. Check correlations
correlation_matrix = df[['passengers', 'hour', 'day_of_week', 
                         'is_weekend', 'is_peak_hour']].corr()
sns.heatmap(correlation_matrix, annot=True)
plt.show()
```

### Key Questions to Answer
- ✅ How many data points do we have?
- ✅ What is the average passenger count?
- ✅ Are there any missing values?
- ✅ What are the peak hours?
- ✅ How does demand vary by day of week?
- ✅ Are there any outliers?

---

## Day 3-4: Train LSTM Model

### Prepare Data
```python
# ml-research/train_demand_model.py
import pandas as pd
import numpy as np
from sklearn.preprocessing import MinMaxScaler
from sklearn.model_selection import train_test_split

# Load data
df = pd.read_json('data/demand_training_data.json')

# Sort by date
df['date'] = pd.to_datetime(df['date'])
df = df.sort_values('date')

# Create features
features = ['passengers', 'day_of_week', 'hour', 'is_weekend', 
            'is_peak_hour', 'month']

# Normalize
scaler = MinMaxScaler()
scaled_data = scaler.fit_transform(df[features])

# Create sequences (7-day lookback)
sequence_length = 7
X, y = [], []

for i in range(len(scaled_data) - sequence_length):
    X.append(scaled_data[i:i+sequence_length])
    y.append(scaled_data[i+sequence_length, 0])  # Predict passengers

X = np.array(X)
y = np.array(y)

# Split data
X_train, X_test, y_train, y_test = train_test_split(
    X, y, test_size=0.2, random_state=42
)

print(f"Training samples: {len(X_train)}")
print(f"Test samples: {len(X_test)}")
print(f"Input shape: {X_train.shape}")
```

### Build and Train Model
```python
from tensorflow.keras.models import Sequential
from tensorflow.keras.layers import LSTM, Dense, Dropout
from tensorflow.keras.callbacks import EarlyStopping

# Build model
model = Sequential([
    LSTM(128, return_sequences=True, input_shape=(sequence_length, len(features))),
    Dropout(0.2),
    LSTM(64, return_sequences=False),
    Dropout(0.2),
    Dense(32, activation='relu'),
    Dense(1)
])

model.compile(
    optimizer='adam',
    loss='mse',
    metrics=['mae', 'mape']
)

print(model.summary())

# Train model
early_stop = EarlyStopping(monitor='val_loss', patience=10, restore_best_weights=True)

history = model.fit(
    X_train, y_train,
    validation_data=(X_test, y_test),
    epochs=50,
    batch_size=32,
    callbacks=[early_stop],
    verbose=1
)

# Save model
model.save('models/demand_lstm_model.h5')
print("Model saved!")
```

---

## Day 5: Evaluate Model

### Calculate Metrics
```python
from sklearn.metrics import mean_absolute_error, mean_squared_error, r2_score

# Make predictions
y_pred = model.predict(X_test)

# Inverse transform to get actual values
y_test_actual = scaler.inverse_transform(
    np.concatenate([y_test.reshape(-1, 1), 
                   np.zeros((len(y_test), len(features)-1))], axis=1)
)[:, 0]

y_pred_actual = scaler.inverse_transform(
    np.concatenate([y_pred, 
                   np.zeros((len(y_pred), len(features)-1))], axis=1)
)[:, 0]

# Calculate metrics
mae = mean_absolute_error(y_test_actual, y_pred_actual)
rmse = np.sqrt(mean_squared_error(y_test_actual, y_pred_actual))
mape = np.mean(np.abs((y_test_actual - y_pred_actual) / y_test_actual)) * 100
r2 = r2_score(y_test_actual, y_pred_actual)

print("\n=== Model Performance ===")
print(f"MAE: {mae:.2f} passengers")
print(f"RMSE: {rmse:.2f} passengers")
print(f"MAPE: {mape:.2f}%")
print(f"R² Score: {r2:.4f}")

# Target metrics:
# MAE < 5 passengers ✅
# RMSE < 8 passengers ✅
# MAPE < 15% ✅
# R² > 0.85 ✅
```

### Visualize Results
```python
import matplotlib.pyplot as plt

# Plot predictions vs actual
plt.figure(figsize=(15, 6))
plt.plot(y_test_actual[:100], label='Actual', marker='o')
plt.plot(y_pred_actual[:100], label='Predicted', marker='x')
plt.title('Demand Prediction: Actual vs Predicted')
plt.xlabel('Sample')
plt.ylabel('Passengers')
plt.legend()
plt.grid(True)
plt.savefig('results/demand_prediction_comparison.png')
plt.show()

# Plot training history
plt.figure(figsize=(12, 4))

plt.subplot(1, 2, 1)
plt.plot(history.history['loss'], label='Training Loss')
plt.plot(history.history['val_loss'], label='Validation Loss')
plt.title('Model Loss')
plt.xlabel('Epoch')
plt.ylabel('Loss')
plt.legend()

plt.subplot(1, 2, 2)
plt.plot(history.history['mae'], label='Training MAE')
plt.plot(history.history['val_mae'], label='Validation MAE')
plt.title('Model MAE')
plt.xlabel('Epoch')
plt.ylabel('MAE')
plt.legend()

plt.tight_layout()
plt.savefig('results/training_history.png')
plt.show()
```

---

## Day 6: Compare with Baseline

### Test Against Rule-Based System
```python
# Load your current rule-based predictions
# (from demandPredictionService.js)

# Compare metrics
comparison = pd.DataFrame({
    'Method': ['Rule-Based', 'LSTM Model'],
    'MAE': [rule_based_mae, lstm_mae],
    'RMSE': [rule_based_rmse, lstm_rmse],
    'MAPE': [rule_based_mape, lstm_mape],
    'R²': [rule_based_r2, lstm_r2]
})

print("\n=== Method Comparison ===")
print(comparison)

# Calculate improvement
improvement = ((rule_based_mae - lstm_mae) / rule_based_mae) * 100
print(f"\nImprovement: {improvement:.1f}%")
```

### Statistical Significance Test
```python
from scipy import stats

# Paired t-test
t_stat, p_value = stats.ttest_rel(
    np.abs(y_test_actual - rule_based_pred),
    np.abs(y_test_actual - y_pred_actual)
)

print(f"\nT-statistic: {t_stat:.4f}")
print(f"P-value: {p_value:.4f}")

if p_value < 0.05:
    print("✅ LSTM is significantly better than rule-based (p < 0.05)")
else:
    print("❌ No significant difference")
```

---

## Day 7: Deploy Model

### Create API Endpoint
```javascript
// backend/routes/mlPrediction.js
const express = require('express');
const router = express.Router();
const { spawn } = require('child_process');

router.post('/predict-demand-ml', async (req, res) => {
  try {
    const { routeId, date, timeSlot } = req.body;
    
    // Call Python script
    const python = spawn('python', [
      'ml-research/predict.py',
      routeId,
      date,
      timeSlot
    ]);
    
    let prediction = '';
    
    python.stdout.on('data', (data) => {
      prediction += data.toString();
    });
    
    python.on('close', (code) => {
      if (code === 0) {
        res.json({
          success: true,
          prediction: JSON.parse(prediction),
          model: 'LSTM',
          version: '1.0'
        });
      } else {
        res.status(500).json({ error: 'Prediction failed' });
      }
    });
    
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
```

### Python Prediction Script
```python
# ml-research/predict.py
import sys
import json
import numpy as np
from tensorflow.keras.models import load_model
import joblib

# Load model and scaler
model = load_model('models/demand_lstm_model.h5')
scaler = joblib.load('models/demand_scaler.pkl')

# Get input
route_id = sys.argv[1]
date = sys.argv[2]
time_slot = sys.argv[3]

# Prepare features
# ... (feature engineering)

# Make prediction
prediction = model.predict(features)

# Output JSON
result = {
    'routeId': route_id,
    'date': date,
    'timeSlot': time_slot,
    'predictedPassengers': int(prediction[0][0]),
    'confidence': 0.85,
    'model': 'LSTM'
}

print(json.dumps(result))
```

### Test API
```bash
curl -X POST http://localhost:5000/api/ml/predict-demand-ml \
  -H "Content-Type: application/json" \
  -d '{
    "routeId": "ROUTE_ID",
    "date": "2026-03-10",
    "timeSlot": "08:00"
  }'
```

---

## 📊 Success Checklist

After 7 days, you should have:

- ✅ Collected 1000+ training samples
- ✅ Performed EDA and understood data patterns
- ✅ Trained LSTM model with MAE < 5 passengers
- ✅ Achieved MAPE < 15%
- ✅ Compared with baseline (rule-based system)
- ✅ Deployed model via REST API
- ✅ Documented results and metrics

---

## 🎓 Next Steps

### Week 2: Crew Fatigue Model
- Collect fatigue data with ground truth
- Train Random Forest/XGBoost
- Compare with formula-based system

### Week 3-4: Optimization Algorithms
- Implement PSO, ACO, Simulated Annealing
- Benchmark against current GA
- Analyze convergence and performance

### Month 2: Write Research Paper
- Document methodology
- Prepare results and visualizations
- Write paper draft
- Submit to IEEE ITSC 2026

---

## 🆘 Troubleshooting

### Issue: Not Enough Data
**Solution**: 
- Run system for 2-3 more months to collect data
- Use data augmentation techniques
- Consider synthetic data generation

### Issue: Poor Model Performance
**Solution**:
- Check for data quality issues
- Try different architectures (GRU, Transformer)
- Tune hyperparameters (learning rate, layers, units)
- Add more features (weather, events)

### Issue: Overfitting
**Solution**:
- Increase dropout rate (0.3-0.5)
- Add L2 regularization
- Use early stopping
- Collect more training data

### Issue: Slow Training
**Solution**:
- Use GPU (Google Colab free tier)
- Reduce batch size
- Use fewer epochs with early stopping
- Simplify model architecture

---

## 📚 Resources

### Tutorials
- [LSTM for Time Series](https://machinelearningmastery.com/lstm-for-time-series-prediction/)
- [TensorFlow Keras Guide](https://www.tensorflow.org/guide/keras)
- [Scikit-learn Documentation](https://scikit-learn.org/)

### Papers to Read
1. "LSTM Networks for Time Series Prediction" - Hochreiter & Schmidhuber
2. "Passenger Demand Forecasting in Public Transportation" - Various
3. "Deep Learning for Transportation" - Survey papers

### Tools
- **Google Colab**: Free GPU for training
- **Weights & Biases**: Experiment tracking
- **TensorBoard**: Visualization
- **MLflow**: Model management

---

**Ready to start? Run this command:**
```bash
cd backend
node ml-research/collect_training_data.js
```

**Good luck with your research! 🚀**
