# YATRIK ERP - Machine Learning Models

## 📋 Overview
This package contains five machine learning models for the YATRIK ERP Bus Transport Management System. Each model provides AI-powered insights using real data from MongoDB collections (Trips, Routes, Bookings, Crew).

## 🎯 Models Implemented

### 1. KNN - Passenger Demand Prediction (`knn_demand.py`)
**Purpose:** Predict passenger count for routes based on time and route characteristics.

**Algorithm:** K-Nearest Neighbors (KNN) Regressor

**Input Features:**
- `route_id` (encoded)
- `day_of_week` (0-6)
- `hour_of_day` (0-23)
- `fare` (in INR)
- `distance` (in km)

**Output:** Passenger count (continuous value)

**Metrics:**
- Mean Squared Error (MSE)
- Root Mean Squared Error (RMSE)
- Mean Absolute Error (MAE)
- R² Score

**Visualization:** Scatter plot (Actual vs Predicted passenger demand)

---

### 2. Naive Bayes - Route Performance Classification (`nb_route_performance.py`)
**Purpose:** Classify routes into High/Medium/Low performance categories.

**Algorithm:** Gaussian Naive Bayes

**Input Features:**
- `occupancy_percentage` (0-100%)
- `fuel_per_km` (fuel cost per kilometer)
- `delay_count` (number of delays > 15 min)
- `revenue_per_km` (revenue efficiency)

**Output:** Performance class (High, Medium, Low)

**Metrics:**
- Accuracy
- Precision (weighted)
- Recall (weighted)
- F1-Score (weighted)

**Visualization:** Confusion matrix heatmap

---

### 3. Decision Tree - Trip Delay Prediction (`dt_delay.py`)
**Purpose:** Predict whether a trip will be on-time or delayed.

**Algorithm:** Decision Tree Classifier

**Input Features:**
- `route_length` (in km)
- `shift_hours` (crew shift duration)
- `traffic_factor` (low=1, medium=2, high=3)
- `passenger_load` (percentage)
- `day_of_week` (0-6)
- `hour_of_day` (0-23)

**Output:** Binary classification (On-time / Delayed)

**Metrics:**
- Accuracy
- Precision
- Recall
- F1-Score

**Visualization:** Feature importance bar chart

---

### 4. SVM - Route Optimization Suggestion (`svm_route_opt.py`)
**Purpose:** Suggest whether a route needs optimization.

**Algorithm:** Support Vector Machine (SVM) with RBF kernel

**Input Features:**
- `occupancy_rate` (percentage)
- `avg_delay_minutes` (average delay)
- `fuel_per_km` (fuel efficiency)
- `revenue_per_km` (revenue efficiency)

**Output:** Binary classification (Optimized / Needs Optimization)

**Metrics:**
- Accuracy
- Precision
- Recall
- F1-Score

**Visualization:** 2D decision boundary plot (using PCA)

---

### 5. Neural Network - Crew Load Balancing (`nn_crewload.py`)
**Purpose:** Predict crew fitness score for load balancing.

**Algorithm:** Deep Neural Network (TensorFlow/Keras)

**Architecture:**
- Input Layer: 5 features
- Hidden Layer 1: 64 neurons (ReLU + Dropout 0.2)
- Hidden Layer 2: 32 neurons (ReLU + Dropout 0.2)
- Hidden Layer 3: 16 neurons (ReLU)
- Output Layer: 1 neuron (Sigmoid) - Fitness score [0, 1]

**Input Features:**
- `route_length` (in km)
- `trips_per_day` (workload)
- `rest_hours` (recovery time)
- `consecutive_days` (fatigue indicator)
- `avg_trip_duration` (hours)

**Output:** Crew fitness score (0-1, continuous)

**Metrics:**
- Mean Squared Error (MSE)
- Root Mean Squared Error (RMSE)
- Mean Absolute Error (MAE)
- R² Score

**Visualization:** Training loss vs epoch curve

---

## 🚀 Installation & Setup

### 1. Install Python Dependencies
```bash
cd backend/ml_models
pip install -r requirements.txt
```

**Requirements:**
- pandas==2.1.4
- numpy==1.26.2
- scikit-learn==1.3.2
- matplotlib==3.8.2
- seaborn==0.13.0
- tensorflow==2.15.0
- pymongo==4.6.1
- flask==3.0.0
- flask-cors==4.0.0
- python-dotenv==1.0.0
- joblib==1.3.2

### 2. Configure Environment Variables
Add to your `.env` file:
```env
MONGO_URI=mongodb+srv://your-connection-string
ML_SERVICE_URL=http://localhost:5000
PY_SERVICE_PORT=5000
```

### 3. Start ML Microservice
```bash
# From backend directory
python ml_service.py
```

The Flask server will start on port 5000 (or `PY_SERVICE_PORT`).

### 4. Start Node.js Backend
```bash
# From backend directory
npm start
```

### 5. Start React Frontend
```bash
# From frontend directory
npm run dev
```

---

## 📡 API Endpoints

### Flask ML Service (Port 5000)

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/health` | GET | Health check |
| `/run_all` | POST | Run all 5 models |
| `/run/<model_name>` | POST | Run specific model |
| `/metrics/<model_name>` | GET | Get model metrics |
| `/metrics/all` | GET | Get all metrics |
| `/comparison` | GET | Compare all models |
| `/models` | GET | List available models |

### Node.js Proxy (Port 5000/api/ai)

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/ai/health` | GET | Check ML service |
| `/api/ai/analytics` | GET | Get all metrics |
| `/api/ai/analytics/run-all` | POST | Run all models |
| `/api/ai/analytics/run/:model` | POST | Run specific model |
| `/api/ai/analytics/metrics/:model` | GET | Get model metrics |
| `/api/ai/analytics/comparison` | GET | Compare models |
| `/api/ai/models` | GET | List models |

**Authentication:** All endpoints require JWT token with `admin` role.

---

## 💾 MongoDB Schema

### Collection: `ml_reports`
```javascript
{
  _id: ObjectId,
  model_name: String,  // e.g., "knn_demand_prediction"
  metrics: {
    model_type: String,
    description: String,
    train_metrics: {
      Accuracy/R2_Score: Number,
      MSE/F1_Score: Number,
      // ... other metrics
    },
    test_metrics: {
      Accuracy/R2_Score: Number,
      MSE/F1_Score: Number,
      // ... other metrics
    },
    visualization: String,  // Base64 encoded image
    feature_importance: Object,
    hyperparameters: Object
  },
  timestamp: Date,
  status: String  // "completed", "failed", "running"
}
```

---

## 🖥️ Usage

### Running Models via API
```bash
# Run all models
curl -X POST http://localhost:5000/run_all

# Run specific model
curl -X POST http://localhost:5000/run/knn_demand_prediction

# Get metrics
curl http://localhost:5000/metrics/all
```

### Running Models Directly (Python)
```bash
cd backend/ml_models

# Run individual models
python knn_demand.py
python nb_route_performance.py
python dt_delay.py
python svm_route_opt.py
python nn_crewload.py
```

### Using React Dashboard
1. Navigate to Admin Dashboard
2. Click "ML Analytics" in the menu
3. Click "Run All Models" button
4. View real-time visualizations and metrics

---

## 📊 Data Requirements

For optimal results, ensure your MongoDB has:

- **Trips Collection:** At least 100 trip records
- **Bookings Collection:** At least 200 booking records
- **Routes Collection:** At least 10 routes
- **Duties/Crew Collections:** At least 50 duty assignments

**Note:** Models will adapt to available data but may have reduced accuracy with minimal datasets.

---

## 🔧 Configuration

### Model Hyperparameters

You can modify hyperparameters in each model file:

**KNN:**
```python
knn = KNeighborsRegressor(n_neighbors=5, weights='distance')
```

**Decision Tree:**
```python
dt = DecisionTreeClassifier(max_depth=5, min_samples_split=20)
```

**SVM:**
```python
svm = SVC(kernel='rbf', C=1.0, gamma='scale')
```

**Neural Network:**
```python
model.compile(optimizer=keras.optimizers.Adam(learning_rate=0.001))
```

---

## 🐛 Troubleshooting

### Issue: TensorFlow Import Error
```
Solution: Install TensorFlow or use fallback Ridge Regression model
pip install tensorflow==2.15.0
```

### Issue: MongoDB Connection Error
```
Solution: Check MONGO_URI in .env file and network connectivity
```

### Issue: ML Service Offline
```
Solution: Ensure Flask server is running on correct port
python ml_service.py
```

### Issue: No Data Available
```
Solution: Populate MongoDB with sample data using setup scripts
npm run seed-data
```

---

## 📈 Performance Metrics Explained

### Classification Models (Naive Bayes, Decision Tree, SVM)
- **Accuracy:** Overall correctness (TP + TN) / Total
- **Precision:** True positives / (True positives + False positives)
- **Recall:** True positives / (True positives + False negatives)
- **F1-Score:** Harmonic mean of Precision and Recall

### Regression Models (KNN, Neural Network)
- **MSE:** Mean Squared Error (average squared difference)
- **RMSE:** Root Mean Squared Error (MSE in original units)
- **MAE:** Mean Absolute Error (average absolute difference)
- **R²:** Coefficient of determination (0-1, higher is better)

---

## 🔄 Continuous Integration

### Scheduled Model Retraining
You can set up a cron job to retrain models periodically:

```javascript
// backend/services/mlSync.js (add cron functionality)
const cron = require('node-cron');

cron.schedule('0 0 * * 0', async () => {
  // Run models every Sunday at midnight
  await mlService.runAllModels();
});
```

---

## 📝 Model Comparison Table

| Model | Algorithm | Task Type | Best Use Case | Avg Training Time |
|-------|-----------|-----------|---------------|-------------------|
| KNN | K-Nearest Neighbors | Regression | Demand forecasting | ~2s |
| Naive Bayes | Gaussian NB | Classification | Performance categorization | ~1s |
| Decision Tree | CART | Classification | Delay prediction | ~1s |
| SVM | RBF Kernel | Classification | Route optimization | ~3s |
| Neural Network | Deep Learning | Regression | Crew load balancing | ~15s |

---

## 🎓 Model Selection Guide

- **High Accuracy Needed:** Neural Network, SVM
- **Fast Training Required:** Naive Bayes, Decision Tree
- **Interpretability Important:** Decision Tree (feature importance)
- **Small Dataset:** KNN, Naive Bayes
- **Complex Patterns:** Neural Network, SVM

---

## 🤝 Contributing

To add new models:
1. Create new Python file in `ml_models/`
2. Follow existing model structure
3. Add to Flask `MODELS` registry
4. Update `modelNames` in React component

---

## 📄 License

Part of YATRIK ERP - Bus Transport Management System

---

## 🆘 Support

For issues or questions:
- Check logs: `backend/ml_models/*.log`
- Review error messages in Flask console
- Verify MongoDB data integrity
- Contact: support@yatrik-erp.com

---

**Version:** 1.0.0  
**Last Updated:** 2025-10-20  
**Author:** YATRIK ERP Team
