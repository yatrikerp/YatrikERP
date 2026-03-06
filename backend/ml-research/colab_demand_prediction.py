"""
Google Colab - Passenger Demand Prediction with LSTM
Upload this file to Google Colab and run all cells

Instructions:
1. Go to https://colab.research.google.com/
2. File > Upload notebook > Upload this file
3. Runtime > Change runtime type > GPU (T4 GPU - Free)
4. Upload your demand_training_data.json file
5. Run all cells
"""

# ============================================================================
# CELL 1: Install Dependencies
# ============================================================================
!pip install tensorflow pandas numpy scikit-learn matplotlib seaborn

# ============================================================================
# CELL 2: Import Libraries
# ============================================================================
import pandas as pd
import numpy as np
import matplotlib.pyplot as plt
import seaborn as sns
from sklearn.preprocessing import MinMaxScaler
from sklearn.model_selection import train_test_split
from sklearn.metrics import mean_absolute_error, mean_squared_error, r2_score
import tensorflow as tf
from tensorflow.keras.models import Sequential
from tensorflow.keras.layers import LSTM, Dense, Dropout, Bidirectional
from tensorflow.keras.callbacks import EarlyStopping, ReduceLROnPlateau
import json
import joblib

print("TensorFlow version:", tf.__version__)
print("GPU Available:", tf.config.list_physical_devices('GPU'))

# ============================================================================
# CELL 3: Upload Data File
# ============================================================================
from google.colab import files

print("Upload your demand_training_data.json file:")
uploaded = files.upload()

# Load data
data_file = list(uploaded.keys())[0]
with open(data_file, 'r') as f:
    data = json.load(f)

df = pd.DataFrame(data)
print(f"\n✅ Loaded {len(df)} records")
print("\nFirst few rows:")
print(df.head())

# ============================================================================
# CELL 4: Exploratory Data Analysis
# ============================================================================
print("\n=== Data Summary ===")
print(df.describe())
print("\n=== Data Info ===")
print(df.info())
print("\n=== Missing Values ===")
print(df.isnull().sum())

# Visualizations
fig, axes = plt.subplots(2, 2, figsize=(15, 10))

# Passenger distribution
axes[0, 0].hist(df['passengers'], bins=30, edgecolor='black')
axes[0, 0].set_title('Passenger Distribution')
axes[0, 0].set_xlabel('Passengers')
axes[0, 0].set_ylabel('Frequency')

# Passengers by day of week
df.groupby('day_of_week')['passengers'].mean().plot(kind='bar', ax=axes[0, 1])
axes[0, 1].set_title('Average Passengers by Day of Week')
axes[0, 1].set_xlabel('Day (0=Sunday, 6=Saturday)')
axes[0, 1].set_ylabel('Average Passengers')

# Passengers by hour
df.groupby('hour')['passengers'].mean().plot(kind='line', marker='o', ax=axes[1, 0])
axes[1, 0].set_title('Average Passengers by Hour')
axes[1, 0].set_xlabel('Hour')
axes[1, 0].set_ylabel('Average Passengers')
axes[1, 0].grid(True)

# Utilization distribution
axes[1, 1].hist(df['utilization'], bins=30, edgecolor='black')
axes[1, 1].set_title('Bus Utilization Distribution')
axes[1, 1].set_xlabel('Utilization (%)')
axes[1, 1].set_ylabel('Frequency')

plt.tight_layout()
plt.show()

# Correlation heatmap
plt.figure(figsize=(10, 8))
correlation_cols = ['passengers', 'hour', 'day_of_week', 'is_weekend', 
                   'is_peak_hour', 'month', 'utilization']
correlation_matrix = df[correlation_cols].corr()
sns.heatmap(correlation_matrix, annot=True, cmap='coolwarm', center=0)
plt.title('Feature Correlation Matrix')
plt.show()

# ============================================================================
# CELL 5: Data Preprocessing
# ============================================================================
# Convert date to datetime
df['date'] = pd.to_datetime(df['date'])
df = df.sort_values('date').reset_index(drop=True)

# Select features
feature_columns = ['passengers', 'day_of_week', 'hour', 'is_weekend', 
                  'is_peak_hour', 'month', 'utilization']

# Handle missing values
df[feature_columns] = df[feature_columns].fillna(df[feature_columns].mean())

# Normalize features
scaler = MinMaxScaler()
scaled_data = scaler.fit_transform(df[feature_columns])

print(f"✅ Data preprocessed: {scaled_data.shape}")
print(f"Feature columns: {feature_columns}")

# ============================================================================
# CELL 6: Create Sequences for LSTM
# ============================================================================
def create_sequences(data, sequence_length=7):
    """Create sequences for LSTM training"""
    X, y = [], []
    
    for i in range(len(data) - sequence_length):
        X.append(data[i:i+sequence_length])
        y.append(data[i+sequence_length, 0])  # Predict passengers (first column)
    
    return np.array(X), np.array(y)

# Create sequences
SEQUENCE_LENGTH = 7  # Use 7 days of history
X, y = create_sequences(scaled_data, SEQUENCE_LENGTH)

print(f"✅ Created sequences")
print(f"X shape: {X.shape} (samples, sequence_length, features)")
print(f"y shape: {y.shape} (samples,)")

# Split data
X_train, X_test, y_train, y_test = train_test_split(
    X, y, test_size=0.2, random_state=42, shuffle=False
)

print(f"\n📊 Data Split:")
print(f"Training samples: {len(X_train)}")
print(f"Test samples: {len(X_test)}")

# ============================================================================
# CELL 7: Build LSTM Model
# ============================================================================
def build_lstm_model(input_shape):
    """Build LSTM model architecture"""
    model = Sequential([
        # First LSTM layer with return sequences
        LSTM(128, return_sequences=True, input_shape=input_shape),
        Dropout(0.2),
        
        # Second LSTM layer
        LSTM(64, return_sequences=False),
        Dropout(0.2),
        
        # Dense layers
        Dense(32, activation='relu'),
        Dropout(0.1),
        Dense(16, activation='relu'),
        Dense(1)  # Output: predicted passengers (normalized)
    ])
    
    model.compile(
        optimizer='adam',
        loss='mse',
        metrics=['mae', 'mape']
    )
    
    return model

# Build model
model = build_lstm_model(input_shape=(X_train.shape[1], X_train.shape[2]))

print("✅ Model built successfully")
print("\n=== Model Architecture ===")
model.summary()

# ============================================================================
# CELL 8: Train Model
# ============================================================================
# Callbacks
early_stop = EarlyStopping(
    monitor='val_loss',
    patience=15,
    restore_best_weights=True,
    verbose=1
)

reduce_lr = ReduceLROnPlateau(
    monitor='val_loss',
    factor=0.5,
    patience=5,
    min_lr=0.00001,
    verbose=1
)

# Train model
print("\n🚀 Starting training...")
history = model.fit(
    X_train, y_train,
    validation_data=(X_test, y_test),
    epochs=100,
    batch_size=32,
    callbacks=[early_stop, reduce_lr],
    verbose=1
)

print("\n✅ Training complete!")

# ============================================================================
# CELL 9: Evaluate Model
# ============================================================================
# Make predictions
y_pred = model.predict(X_test)

# Inverse transform to get actual values
def inverse_transform_predictions(y_normalized, scaler, n_features):
    """Convert normalized predictions back to actual values"""
    y_reshaped = np.concatenate([
        y_normalized.reshape(-1, 1),
        np.zeros((len(y_normalized), n_features - 1))
    ], axis=1)
    y_actual = scaler.inverse_transform(y_reshaped)[:, 0]
    return y_actual

y_test_actual = inverse_transform_predictions(y_test, scaler, len(feature_columns))
y_pred_actual = inverse_transform_predictions(y_pred.flatten(), scaler, len(feature_columns))

# Calculate metrics
mae = mean_absolute_error(y_test_actual, y_pred_actual)
rmse = np.sqrt(mean_squared_error(y_test_actual, y_pred_actual))
mape = np.mean(np.abs((y_test_actual - y_pred_actual) / (y_test_actual + 1e-10))) * 100
r2 = r2_score(y_test_actual, y_pred_actual)

print("\n" + "="*50)
print("📊 MODEL PERFORMANCE METRICS")
print("="*50)
print(f"Mean Absolute Error (MAE):  {mae:.2f} passengers")
print(f"Root Mean Squared Error:    {rmse:.2f} passengers")
print(f"Mean Absolute % Error:      {mape:.2f}%")
print(f"R² Score:                   {r2:.4f}")
print("="*50)

# Target benchmarks
print("\n🎯 Target Benchmarks:")
print(f"MAE < 5 passengers:  {'✅ PASS' if mae < 5 else '❌ FAIL'}")
print(f"RMSE < 8 passengers: {'✅ PASS' if rmse < 8 else '❌ FAIL'}")
print(f"MAPE < 15%:          {'✅ PASS' if mape < 15 else '❌ FAIL'}")
print(f"R² > 0.85:           {'✅ PASS' if r2 > 0.85 else '❌ FAIL'}")

# ============================================================================
# CELL 10: Visualize Results
# ============================================================================
# Plot training history
fig, axes = plt.subplots(1, 3, figsize=(18, 5))

# Loss
axes[0].plot(history.history['loss'], label='Training Loss')
axes[0].plot(history.history['val_loss'], label='Validation Loss')
axes[0].set_title('Model Loss Over Epochs')
axes[0].set_xlabel('Epoch')
axes[0].set_ylabel('Loss (MSE)')
axes[0].legend()
axes[0].grid(True)

# MAE
axes[1].plot(history.history['mae'], label='Training MAE')
axes[1].plot(history.history['val_mae'], label='Validation MAE')
axes[1].set_title('Mean Absolute Error Over Epochs')
axes[1].set_xlabel('Epoch')
axes[1].set_ylabel('MAE')
axes[1].legend()
axes[1].grid(True)

# MAPE
axes[2].plot(history.history['mape'], label='Training MAPE')
axes[2].plot(history.history['val_mape'], label='Validation MAPE')
axes[2].set_title('Mean Absolute Percentage Error')
axes[2].set_xlabel('Epoch')
axes[2].set_ylabel('MAPE (%)')
axes[2].legend()
axes[2].grid(True)

plt.tight_layout()
plt.show()

# Plot predictions vs actual
plt.figure(figsize=(16, 6))
sample_size = min(100, len(y_test_actual))
indices = range(sample_size)

plt.plot(indices, y_test_actual[:sample_size], 
         label='Actual', marker='o', linestyle='-', linewidth=2)
plt.plot(indices, y_pred_actual[:sample_size], 
         label='Predicted', marker='x', linestyle='--', linewidth=2)
plt.fill_between(indices, y_test_actual[:sample_size], y_pred_actual[:sample_size], 
                 alpha=0.2, color='red')
plt.title('Demand Prediction: Actual vs Predicted (First 100 samples)')
plt.xlabel('Sample Index')
plt.ylabel('Number of Passengers')
plt.legend()
plt.grid(True, alpha=0.3)
plt.show()

# Error distribution
errors = y_test_actual - y_pred_actual
plt.figure(figsize=(12, 5))

plt.subplot(1, 2, 1)
plt.hist(errors, bins=30, edgecolor='black')
plt.title('Prediction Error Distribution')
plt.xlabel('Error (Actual - Predicted)')
plt.ylabel('Frequency')
plt.axvline(x=0, color='red', linestyle='--', label='Zero Error')
plt.legend()

plt.subplot(1, 2, 2)
plt.scatter(y_test_actual, y_pred_actual, alpha=0.5)
plt.plot([y_test_actual.min(), y_test_actual.max()], 
         [y_test_actual.min(), y_test_actual.max()], 
         'r--', lw=2, label='Perfect Prediction')
plt.title('Actual vs Predicted Scatter Plot')
plt.xlabel('Actual Passengers')
plt.ylabel('Predicted Passengers')
plt.legend()
plt.grid(True, alpha=0.3)

plt.tight_layout()
plt.show()

# ============================================================================
# CELL 11: Save Model
# ============================================================================
# Save model
model.save('demand_lstm_model.h5')
print("✅ Model saved as 'demand_lstm_model.h5'")

# Save scaler
joblib.dump(scaler, 'demand_scaler.pkl')
print("✅ Scaler saved as 'demand_scaler.pkl'")

# Save feature columns
with open('feature_columns.json', 'w') as f:
    json.dump(feature_columns, f)
print("✅ Feature columns saved")

# Download files
from google.colab import files
files.download('demand_lstm_model.h5')
files.download('demand_scaler.pkl')
files.download('feature_columns.json')

print("\n🎉 Training complete! Download the files above.")

# ============================================================================
# CELL 12: Generate Report
# ============================================================================
report = {
    "model_info": {
        "model_type": "LSTM",
        "architecture": "128-64-32-16-1",
        "sequence_length": SEQUENCE_LENGTH,
        "features": feature_columns,
        "total_parameters": model.count_params()
    },
    "training_info": {
        "training_samples": len(X_train),
        "test_samples": len(X_test),
        "epochs_trained": len(history.history['loss']),
        "batch_size": 32
    },
    "performance_metrics": {
        "mae": float(mae),
        "rmse": float(rmse),
        "mape": float(mape),
        "r2_score": float(r2)
    },
    "benchmarks": {
        "mae_target": 5.0,
        "mae_pass": mae < 5.0,
        "rmse_target": 8.0,
        "rmse_pass": rmse < 8.0,
        "mape_target": 15.0,
        "mape_pass": mape < 15.0,
        "r2_target": 0.85,
        "r2_pass": r2 > 0.85
    }
}

# Save report
with open('training_report.json', 'w') as f:
    json.dump(report, f, indent=2)

print("\n" + "="*60)
print("📄 TRAINING REPORT")
print("="*60)
print(json.dumps(report, indent=2))
print("="*60)

files.download('training_report.json')

print("\n✅ All done! Your model is ready for deployment.")
