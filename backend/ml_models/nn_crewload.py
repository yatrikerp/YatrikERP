"""
Neural Network - Crew Load Balancing
=====================================
Predicts crew fitness score for load balancing across routes.

Input Features:
- route_length
- trips_per_day
- rest_hours
- consecutive_days_worked
- avg_trip_duration

Output: Crew fitness score (0-1, continuous)

Metrics: MSE, MAE, R²
Visualization: Training loss vs epoch curve
"""

import pandas as pd
import numpy as np
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import StandardScaler, MinMaxScaler
from sklearn.metrics import mean_squared_error, mean_absolute_error, r2_score
import matplotlib.pyplot as plt
import seaborn as sns
from datetime import datetime, timedelta
import base64
from io import BytesIO

try:
    import tensorflow as tf
    from tensorflow import keras
    from tensorflow.keras import layers
    TF_AVAILABLE = True
except ImportError:
    TF_AVAILABLE = False
    print("Warning: TensorFlow not available. Using fallback model.")

from config import *
from utils import get_mongo_client, save_model_report


def fetch_crew_load_data():
    """Fetch crew duty and trip data"""
    client = get_mongo_client()
    db = client[DB_NAME]
    
    # Aggregate duties with crew and trip info
    pipeline = [
        {
            '$lookup': {
                'from': 'drivers',
                'localField': 'driver',
                'foreignField': '_id',
                'as': 'driver_info'
            }
        },
        {
            '$lookup': {
                'from': 'conductors',
                'localField': 'conductor',
                'foreignField': '_id',
                'as': 'conductor_info'
            }
        },
        {
            '$lookup': {
                'from': 'trips',
                'localField': 'trips',
                'foreignField': '_id',
                'as': 'trip_list'
            }
        },
        {
            '$project': {
                'crew_id': {'$ifNull': [{'$first': '$driver_info._id'}, {'$first': '$conductor_info._id'}]},
                'crew_type': {'$cond': [{'$gt': [{'$size': '$driver_info'}, 0]}, 'driver', 'conductor']},
                'date': '$date',
                'shift_hours': '$hours',
                'trips_count': {'$size': '$trip_list'},
                'rest_hours': {'$ifNull': ['$restHours', 8]},
                'route_length': {'$avg': '$trip_list.route.distance'}
            }
        }
    ]
    
    duties = list(db['duties'].aggregate(pipeline))
    client.close()
    
    return pd.DataFrame(duties)


def calculate_crew_features(df):
    """Calculate crew workload features"""
    # Convert date
    df['date'] = pd.to_datetime(df['date'], errors='coerce')
    
    # Sort by crew and date
    df = df.sort_values(['crew_id', 'date'])
    
    # Calculate consecutive days worked
    df['days_since_last'] = df.groupby('crew_id')['date'].diff().dt.days
    df['consecutive_days'] = df.groupby('crew_id').cumcount() + 1
    
    # Calculate average trip duration (estimate based on route length)
    df['avg_trip_duration'] = df['route_length'] / 40  # Assume 40 km/hr avg speed
    
    # Trips per day
    df['trips_per_day'] = df['trips_count']
    
    # Fill missing values
    df['rest_hours'] = df['rest_hours'].fillna(8)
    df['route_length'] = df['route_length'].fillna(df['route_length'].median())
    df['avg_trip_duration'] = df['avg_trip_duration'].fillna(df['avg_trip_duration'].median())
    
    # Calculate fitness score (target variable)
    # Higher rest, fewer consecutive days, moderate trips = higher fitness
    max_consecutive = df['consecutive_days'].max() or 1
    max_trips = df['trips_per_day'].max() or 1
    
    df['fitness_score'] = (
        (df['rest_hours'] / 12) * 0.4 +
        (1 - df['consecutive_days'] / max_consecutive) * 0.3 +
        (1 - df['trips_per_day'] / max_trips) * 0.3
    )
    df['fitness_score'] = df['fitness_score'].clip(0, 1)
    
    # Remove invalid rows
    df = df.dropna(subset=['route_length', 'trips_per_day', 'rest_hours', 'fitness_score'])
    
    return df


def build_neural_network(input_dim):
    """Build neural network model"""
    if not TF_AVAILABLE:
        return None
    
    model = keras.Sequential([
        layers.Dense(64, activation='relu', input_dim=input_dim),
        layers.Dropout(0.2),
        layers.Dense(32, activation='relu'),
        layers.Dropout(0.2),
        layers.Dense(16, activation='relu'),
        layers.Dense(1, activation='sigmoid')  # Output in range [0, 1]
    ])
    
    model.compile(
        optimizer=keras.optimizers.Adam(learning_rate=0.001),
        loss='mse',
        metrics=['mae']
    )
    
    return model


def train_neural_network(X_train, y_train, X_test, y_test):
    """Train neural network model"""
    if not TF_AVAILABLE:
        # Fallback to simple linear regression
        from sklearn.linear_model import Ridge
        model = Ridge(alpha=1.0)
        model.fit(X_train, y_train)
        
        y_pred_train = model.predict(X_train)
        y_pred_test = model.predict(X_test)
        
        history = None
        return model, None, y_pred_train, y_pred_test, history
    
    # Standardize features
    scaler = StandardScaler()
    X_train_scaled = scaler.fit_transform(X_train)
    X_test_scaled = scaler.transform(X_test)
    
    # Build model
    model = build_neural_network(X_train.shape[1])
    
    # Early stopping
    early_stop = keras.callbacks.EarlyStopping(
        monitor='val_loss',
        patience=10,
        restore_best_weights=True
    )
    
    # Train
    history = model.fit(
        X_train_scaled, y_train,
        validation_split=0.2,
        epochs=100,
        batch_size=32,
        callbacks=[early_stop],
        verbose=0
    )
    
    # Predictions
    y_pred_train = model.predict(X_train_scaled, verbose=0).flatten()
    y_pred_test = model.predict(X_test_scaled, verbose=0).flatten()
    
    return model, scaler, y_pred_train, y_pred_test, history


def calculate_regression_metrics(y_true, y_pred):
    """Calculate regression metrics"""
    mse = mean_squared_error(y_true, y_pred)
    rmse = np.sqrt(mse)
    mae = mean_absolute_error(y_true, y_pred)
    r2 = r2_score(y_true, y_pred)
    
    return {
        'MSE': float(mse),
        'RMSE': float(rmse),
        'MAE': float(mae),
        'R2_Score': float(r2)
    }


def create_loss_curve_plot(history):
    """Create training loss vs epoch curve"""
    if history is None:
        # Create placeholder plot
        plt.figure(figsize=FIG_SIZE, dpi=DPI)
        plt.text(0.5, 0.5, 'TensorFlow not available\nUsing fallback model', 
                ha='center', va='center', fontsize=14)
        plt.xlim(0, 1)
        plt.ylim(0, 1)
        plt.title('Neural Network Training', fontsize=14, fontweight='bold')
    else:
        plt.figure(figsize=FIG_SIZE, dpi=DPI)
        
        plt.plot(history.history['loss'], label='Training Loss', linewidth=2)
        plt.plot(history.history['val_loss'], label='Validation Loss', linewidth=2)
        
        plt.xlabel('Epoch', fontsize=12)
        plt.ylabel('Loss (MSE)', fontsize=12)
        plt.title('Neural Network: Training Loss vs Epoch', fontsize=14, fontweight='bold')
        plt.legend()
        plt.grid(True, alpha=0.3)
    
    # Save to base64
    buffer = BytesIO()
    plt.savefig(buffer, format='png', bbox_inches='tight')
    buffer.seek(0)
    image_base64 = base64.b64encode(buffer.read()).decode()
    plt.close()
    
    return f"data:image/png;base64,{image_base64}"


def run_neural_network_crew_load():
    """Main function to run Neural Network crew load balancing"""
    print("🚀 Starting Neural Network Crew Load Balancing...")
    
    # Fetch data
    print("📊 Fetching crew duty data...")
    df = fetch_crew_load_data()
    
    if df.empty:
        print("❌ No crew duty data found!")
        return None
    
    print(f"✅ Loaded {len(df)} duty records")
    
    # Calculate features
    print("🔄 Calculating crew workload features...")
    crew_df = calculate_crew_features(df)
    
    print(f"📊 Fitness score stats:")
    print(crew_df['fitness_score'].describe())
    
    # Prepare features
    feature_cols = ['route_length', 'trips_per_day', 'rest_hours', 'consecutive_days', 'avg_trip_duration']
    target_col = 'fitness_score'
    
    X = crew_df[feature_cols].values
    y = crew_df[target_col].values
    
    # Train-test split
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=TEST_SIZE, random_state=RANDOM_STATE
    )
    
    print(f"📈 Training set: {len(X_train)}, Test set: {len(X_test)}")
    
    # Train model
    print("🤖 Training Neural Network model...")
    model, scaler, y_pred_train, y_pred_test, history = train_neural_network(X_train, y_train, X_test, y_test)
    
    # Calculate metrics
    train_metrics = calculate_regression_metrics(y_train, y_pred_train)
    test_metrics = calculate_regression_metrics(y_test, y_pred_test)
    
    print("📊 Training Metrics:", train_metrics)
    print("📊 Testing Metrics:", test_metrics)
    
    # Create visualization
    print("📈 Creating loss curve...")
    viz_image = create_loss_curve_plot(history)
    
    # Prepare report
    report_data = {
        'model_type': 'Neural Network (TensorFlow)' if TF_AVAILABLE else 'Ridge Regression (Fallback)',
        'description': 'Crew fitness score prediction for load balancing',
        'train_metrics': train_metrics,
        'test_metrics': test_metrics,
        'visualization': viz_image,
        'architecture': {
            'layers': [64, 32, 16, 1] if TF_AVAILABLE else 'Ridge Regression',
            'activation': 'relu, sigmoid',
            'dropout': 0.2
        } if TF_AVAILABLE else {'type': 'Ridge', 'alpha': 1.0},
        'features': feature_cols
    }
    
    # Save to MongoDB
    print("💾 Saving report to MongoDB...")
    report_id = save_model_report('nn_crew_load_balancing', report_data)
    print(f"✅ Report saved with ID: {report_id}")
    
    return report_data


if __name__ == '__main__':
    result = run_neural_network_crew_load()
    if result:
        print("\n✅ Neural Network Crew Load Balancing completed successfully!")
