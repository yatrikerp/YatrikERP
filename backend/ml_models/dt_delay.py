"""
Decision Tree - Trip Delay Prediction
======================================
Predicts whether a trip will be on-time or delayed.

Input Features:
- route_length
- shift_hours
- traffic_factor
- passenger_load
- day_of_week
- hour_of_day

Output: Binary class (On-time / Delayed)

Metrics: Accuracy, Precision, Recall, F1-Score
Visualization: Feature importance bar chart
"""

import pandas as pd
import numpy as np
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import StandardScaler
from sklearn.tree import DecisionTreeClassifier
from sklearn.metrics import accuracy_score, precision_score, recall_score, f1_score, confusion_matrix
import matplotlib.pyplot as plt
import seaborn as sns
from datetime import datetime
import base64
from io import BytesIO

from config import *
from utils import get_mongo_client, save_model_report


def fetch_trip_delay_data():
    """Fetch trip data with delay information"""
    client = get_mongo_client()
    db = client[DB_NAME]
    
    # Aggregate trips with route and booking info
    pipeline = [
        {
            '$lookup': {
                'from': 'routes',
                'localField': 'route',
                'foreignField': '_id',
                'as': 'route_info'
            }
        },
        {'$unwind': '$route_info'},
        {
            '$lookup': {
                'from': 'bookings',
                'localField': '_id',
                'foreignField': 'trip',
                'as': 'bookings'
            }
        },
        {
            '$lookup': {
                'from': 'duties',
                'localField': '_id',
                'foreignField': 'trips',
                'as': 'duty_info'
            }
        },
        {
            '$project': {
                'route_length': '$route_info.distance',
                'scheduled_departure': '$scheduledDeparture',
                'actual_departure': '$actualDeparture',
                'scheduled_arrival': '$scheduledArrival',
                'actual_arrival': '$actualArrival',
                'capacity': '$bus.capacity',
                'seats_booked': {'$sum': '$bookings.seats'},
                'shift_hours': {'$ifNull': [{'$first': '$duty_info.hours'}, 8]},
                'traffic_level': {'$ifNull': ['$trafficLevel', 'medium']}
            }
        }
    ]
    
    trips = list(db[TRIPS_COLLECTION].aggregate(pipeline))
    client.close()
    
    return pd.DataFrame(trips)


def preprocess_delay_data(df):
    """Preprocess trip data and extract features"""
    # Convert timestamps
    df['scheduled_departure'] = pd.to_datetime(df['scheduled_departure'], errors='coerce')
    df['actual_departure'] = pd.to_datetime(df['actual_departure'], errors='coerce')
    
    # Calculate delay in minutes
    df['delay_minutes'] = (df['actual_departure'] - df['scheduled_departure']).dt.total_seconds() / 60
    df['delay_minutes'] = df['delay_minutes'].fillna(0)
    
    # Binary classification: Delayed if > 10 minutes
    df['is_delayed'] = (df['delay_minutes'] > 10).astype(int)
    
    # Passenger load percentage
    df['passenger_load'] = (df['seats_booked'] / df['capacity'].replace(0, 1)) * 100
    df['passenger_load'] = df['passenger_load'].clip(0, 100)
    
    # Time features
    df['day_of_week'] = df['scheduled_departure'].dt.dayofweek
    df['hour_of_day'] = df['scheduled_departure'].dt.hour
    
    # Traffic factor encoding
    traffic_mapping = {'low': 1, 'medium': 2, 'high': 3}
    df['traffic_factor'] = df['traffic_level'].map(traffic_mapping).fillna(2)
    
    # Remove rows with missing critical data
    df = df.dropna(subset=['route_length', 'shift_hours', 'is_delayed'])
    
    return df


def train_decision_tree_model(X_train, y_train, X_test, y_test):
    """Train Decision Tree classifier"""
    # Train Decision Tree with constraints to prevent overfitting
    dt = DecisionTreeClassifier(
        max_depth=5,
        min_samples_split=20,
        min_samples_leaf=10,
        random_state=RANDOM_STATE
    )
    dt.fit(X_train, y_train)
    
    # Predictions
    y_pred_train = dt.predict(X_train)
    y_pred_test = dt.predict(X_test)
    
    return dt, y_pred_train, y_pred_test


def calculate_classification_metrics(y_true, y_pred):
    """Calculate classification metrics"""
    accuracy = accuracy_score(y_true, y_pred)
    precision = precision_score(y_true, y_pred, zero_division=0)
    recall = recall_score(y_true, y_pred, zero_division=0)
    f1 = f1_score(y_true, y_pred, zero_division=0)
    
    return {
        'Accuracy': float(accuracy),
        'Precision': float(precision),
        'Recall': float(recall),
        'F1_Score': float(f1)
    }


def create_feature_importance_plot(model, feature_names):
    """Create feature importance bar chart"""
    importances = model.feature_importances_
    indices = np.argsort(importances)[::-1]
    
    plt.figure(figsize=FIG_SIZE, dpi=DPI)
    plt.bar(range(len(importances)), importances[indices], color='steelblue', edgecolor='black')
    plt.xticks(range(len(importances)), [feature_names[i] for i in indices], rotation=45, ha='right')
    plt.xlabel('Features', fontsize=12)
    plt.ylabel('Importance Score', fontsize=12)
    plt.title('Decision Tree: Feature Importance for Trip Delay Prediction', fontsize=14, fontweight='bold')
    plt.grid(True, alpha=0.3, axis='y')
    plt.tight_layout()
    
    # Save to base64
    buffer = BytesIO()
    plt.savefig(buffer, format='png', bbox_inches='tight')
    buffer.seek(0)
    image_base64 = base64.b64encode(buffer.read()).decode()
    plt.close()
    
    return f"data:image/png;base64,{image_base64}"


def run_decision_tree_delay_prediction():
    """Main function to run Decision Tree trip delay prediction"""
    print("🚀 Starting Decision Tree Trip Delay Prediction...")
    
    # Fetch data
    print("📊 Fetching trip data...")
    df = fetch_trip_delay_data()
    
    if df.empty:
        print("❌ No trip data found!")
        return None
    
    print(f"✅ Loaded {len(df)} trip records")
    
    # Preprocess
    print("🔄 Preprocessing data...")
    processed_df = preprocess_delay_data(df)
    
    print(f"📊 Delay distribution:")
    print(f"On-time: {(processed_df['is_delayed'] == 0).sum()}")
    print(f"Delayed: {(processed_df['is_delayed'] == 1).sum()}")
    
    # Prepare features
    feature_cols = ['route_length', 'shift_hours', 'traffic_factor', 'passenger_load', 'day_of_week', 'hour_of_day']
    target_col = 'is_delayed'
    
    X = processed_df[feature_cols].values
    y = processed_df[target_col].values
    
    # Handle class imbalance if necessary
    if len(y) > 0:
        # Train-test split
        X_train, X_test, y_train, y_test = train_test_split(
            X, y, test_size=TEST_SIZE, random_state=RANDOM_STATE, stratify=y
        )
    else:
        print("❌ Insufficient data for training!")
        return None
    
    print(f"📈 Training set: {len(X_train)}, Test set: {len(X_test)}")
    
    # Train model
    print("🤖 Training Decision Tree model...")
    dt, y_pred_train, y_pred_test = train_decision_tree_model(X_train, y_train, X_test, y_test)
    
    # Calculate metrics
    train_metrics = calculate_classification_metrics(y_train, y_pred_train)
    test_metrics = calculate_classification_metrics(y_test, y_pred_test)
    
    print("📊 Training Metrics:", train_metrics)
    print("📊 Testing Metrics:", test_metrics)
    
    # Create visualization
    print("📈 Creating feature importance plot...")
    viz_image = create_feature_importance_plot(dt, feature_cols)
    
    # Feature importance details
    feature_importance = {
        feature: float(importance) 
        for feature, importance in zip(feature_cols, dt.feature_importances_)
    }
    
    # Prepare report
    report_data = {
        'model_type': 'Decision Tree Classifier',
        'description': 'Trip delay prediction (On-time vs Delayed)',
        'train_metrics': train_metrics,
        'test_metrics': test_metrics,
        'visualization': viz_image,
        'feature_importance': feature_importance,
        'hyperparameters': {
            'max_depth': 5,
            'min_samples_split': 20,
            'min_samples_leaf': 10
        },
        'class_distribution': {
            'on_time': int((y == 0).sum()),
            'delayed': int((y == 1).sum())
        }
    }
    
    # Save to MongoDB
    print("💾 Saving report to MongoDB...")
    report_id = save_model_report('dt_delay_prediction', report_data)
    print(f"✅ Report saved with ID: {report_id}")
    
    return report_data


if __name__ == '__main__':
    result = run_decision_tree_delay_prediction()
    if result:
        print("\n✅ Decision Tree Trip Delay Prediction completed successfully!")
