"""
KNN - Passenger Demand Prediction
==================================
Predicts passenger count based on route characteristics, time, and fare.

Input Features:
- route_id (encoded)
- day_of_week
- hour_of_day
- fare
- distance

Output: Passenger count

Metrics: MSE, R², MAE
Visualization: Actual vs Predicted scatter plot
"""

import pandas as pd
import numpy as np
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import StandardScaler
from sklearn.neighbors import KNeighborsRegressor
from sklearn.metrics import mean_squared_error, r2_score, mean_absolute_error
import matplotlib.pyplot as plt
import seaborn as sns
from datetime import datetime
import base64
from io import BytesIO

from config import *
from utils import get_mongo_client, save_model_report


def fetch_booking_data():
    """Fetch booking and trip data from MongoDB"""
    client = get_mongo_client()
    db = client[DB_NAME]
    
    # Aggregate bookings with trip and route info
    pipeline = [
        {
            '$lookup': {
                'from': 'trips',
                'localField': 'trip',
                'foreignField': '_id',
                'as': 'trip_info'
            }
        },
        {'$unwind': '$trip_info'},
        {
            '$lookup': {
                'from': 'routes',
                'localField': 'trip_info.route',
                'foreignField': '_id',
                'as': 'route_info'
            }
        },
        {'$unwind': '$route_info'},
        {
            '$project': {
                'route_id': '$route_info._id',
                'route_name': '$route_info.name',
                'distance': '$route_info.distance',
                'fare': '$fare',
                'seats_booked': '$seats',
                'booking_time': '$createdAt',
                'trip_date': '$trip_info.date'
            }
        }
    ]
    
    bookings = list(db[BOOKINGS_COLLECTION].aggregate(pipeline))
    client.close()
    
    return pd.DataFrame(bookings)


def preprocess_data(df):
    """Preprocess data for KNN model"""
    # Extract time features
    df['booking_time'] = pd.to_datetime(df['booking_time'])
    df['day_of_week'] = df['booking_time'].dt.dayofweek
    df['hour_of_day'] = df['booking_time'].dt.hour
    
    # Encode route_id
    route_mapping = {route: idx for idx, route in enumerate(df['route_id'].unique())}
    df['route_encoded'] = df['route_id'].map(route_mapping)
    
    # Group by route, day, hour to get passenger demand
    grouped = df.groupby(['route_encoded', 'day_of_week', 'hour_of_day']).agg({
        'seats_booked': 'sum',
        'fare': 'mean',
        'distance': 'mean'
    }).reset_index()
    
    grouped.rename(columns={'seats_booked': 'passenger_count'}, inplace=True)
    
    return grouped, route_mapping


def train_knn_model(X_train, y_train, X_test, y_test):
    """Train KNN model and return predictions"""
    # Standardize features
    scaler = StandardScaler()
    X_train_scaled = scaler.fit_transform(X_train)
    X_test_scaled = scaler.transform(X_test)
    
    # Train KNN model with optimal k=5
    knn = KNeighborsRegressor(n_neighbors=5, weights='distance')
    knn.fit(X_train_scaled, y_train)
    
    # Predictions
    y_pred_train = knn.predict(X_train_scaled)
    y_pred_test = knn.predict(X_test_scaled)
    
    return knn, scaler, y_pred_train, y_pred_test


def calculate_metrics(y_true, y_pred):
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


def create_visualization(y_test, y_pred):
    """Create actual vs predicted scatter plot"""
    plt.figure(figsize=FIG_SIZE, dpi=DPI)
    
    plt.scatter(y_test, y_pred, alpha=0.6, edgecolors='k')
    plt.plot([y_test.min(), y_test.max()], 
             [y_test.min(), y_test.max()], 
             'r--', lw=2, label='Perfect Prediction')
    
    plt.xlabel('Actual Passenger Count', fontsize=12)
    plt.ylabel('Predicted Passenger Count', fontsize=12)
    plt.title('KNN: Actual vs Predicted Passenger Demand', fontsize=14, fontweight='bold')
    plt.legend()
    plt.grid(True, alpha=0.3)
    
    # Save to base64
    buffer = BytesIO()
    plt.savefig(buffer, format='png', bbox_inches='tight')
    buffer.seek(0)
    image_base64 = base64.b64encode(buffer.read()).decode()
    plt.close()
    
    return f"data:image/png;base64,{image_base64}"


def run_knn_demand_prediction():
    """Main function to run KNN passenger demand prediction"""
    print("🚀 Starting KNN Passenger Demand Prediction...")
    
    # Fetch data
    print("📊 Fetching booking data...")
    df = fetch_booking_data()
    
    if df.empty:
        print("❌ No booking data found!")
        return None
    
    print(f"✅ Loaded {len(df)} booking records")
    
    # Preprocess
    print("🔄 Preprocessing data...")
    processed_df, route_mapping = preprocess_data(df)
    
    # Prepare features
    feature_cols = ['route_encoded', 'day_of_week', 'hour_of_day', 'fare', 'distance']
    target_col = 'passenger_count'
    
    X = processed_df[feature_cols].values
    y = processed_df[target_col].values
    
    # Train-test split
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=TEST_SIZE, random_state=RANDOM_STATE
    )
    
    print(f"📈 Training set: {len(X_train)}, Test set: {len(X_test)}")
    
    # Train model
    print("🤖 Training KNN model...")
    knn, scaler, y_pred_train, y_pred_test = train_knn_model(X_train, y_train, X_test, y_test)
    
    # Calculate metrics
    train_metrics = calculate_metrics(y_train, y_pred_train)
    test_metrics = calculate_metrics(y_test, y_pred_test)
    
    print("📊 Training Metrics:", train_metrics)
    print("📊 Testing Metrics:", test_metrics)
    
    # Create visualization
    print("📈 Creating visualization...")
    viz_image = create_visualization(y_test, y_pred_test)
    
    # Prepare report
    report_data = {
        'model_type': 'KNN Regressor',
        'description': 'Passenger demand prediction based on route, time, and fare',
        'train_metrics': train_metrics,
        'test_metrics': test_metrics,
        'visualization': viz_image,
        'feature_importance': {
            'features': feature_cols,
            'description': 'All features equally weighted in KNN'
        },
        'hyperparameters': {
            'n_neighbors': 5,
            'weights': 'distance'
        }
    }
    
    # Save to MongoDB
    print("💾 Saving report to MongoDB...")
    report_id = save_model_report('knn_demand_prediction', report_data)
    print(f"✅ Report saved with ID: {report_id}")
    
    return report_data


if __name__ == '__main__':
    result = run_knn_demand_prediction()
    if result:
        print("\n✅ KNN Passenger Demand Prediction completed successfully!")
