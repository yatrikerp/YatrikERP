"""
Naive Bayes - Route Performance Classification
===============================================
Classifies routes into High/Medium/Low performance categories.

Input Features:
- occupancy_percentage
- fuel_cost
- delay_count
- revenue_per_km

Output: Performance class (High/Medium/Low)

Metrics: Accuracy, Precision, Recall, F1-Score
Visualization: Confusion matrix heatmap
"""

import pandas as pd
import numpy as np
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import StandardScaler
from sklearn.naive_bayes import GaussianNB
from sklearn.metrics import accuracy_score, precision_score, recall_score, f1_score, confusion_matrix
import matplotlib.pyplot as plt
import seaborn as sns
from datetime import datetime, timedelta
import base64
from io import BytesIO

from config import *
from utils import get_mongo_client, save_model_report


def fetch_route_performance_data():
    """Fetch route performance data from MongoDB"""
    client = get_mongo_client()
    db = client[DB_NAME]
    
    # Aggregate trips with route, booking, and fuel data
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
            '$project': {
                'route_id': '$route_info._id',
                'route_name': '$route_info.name',
                'distance': '$route_info.distance',
                'capacity': '$bus.capacity',
                'seats_booked': {'$sum': '$bookings.seats'},
                'revenue': {'$sum': '$bookings.fare'},
                'scheduled_departure': '$scheduledDeparture',
                'actual_departure': '$actualDeparture',
                'fuel_cost': {'$ifNull': ['$fuelCost', 0]}
            }
        }
    ]
    
    trips = list(db[TRIPS_COLLECTION].aggregate(pipeline))
    client.close()
    
    return pd.DataFrame(trips)


def calculate_performance_features(df):
    """Calculate performance features for classification"""
    # Occupancy percentage
    df['occupancy_percentage'] = (df['seats_booked'] / df['capacity'].replace(0, 1)) * 100
    df['occupancy_percentage'] = df['occupancy_percentage'].clip(0, 100)
    
    # Revenue per km
    df['revenue_per_km'] = df['revenue'] / df['distance'].replace(0, 1)
    
    # Delay calculation (in minutes)
    df['scheduled_departure'] = pd.to_datetime(df['scheduled_departure'], errors='coerce')
    df['actual_departure'] = pd.to_datetime(df['actual_departure'], errors='coerce')
    df['delay_minutes'] = (df['actual_departure'] - df['scheduled_departure']).dt.total_seconds() / 60
    df['delay_minutes'] = df['delay_minutes'].fillna(0)
    
    # Fuel cost per km
    df['fuel_per_km'] = df['fuel_cost'] / df['distance'].replace(0, 1)
    
    # Group by route to get aggregate metrics
    route_metrics = df.groupby('route_id').agg({
        'occupancy_percentage': 'mean',
        'fuel_per_km': 'mean',
        'delay_minutes': lambda x: (x > 15).sum(),  # Count delays > 15 min
        'revenue_per_km': 'mean'
    }).reset_index()
    
    route_metrics.rename(columns={'delay_minutes': 'delay_count'}, inplace=True)
    
    return route_metrics


def classify_performance(df):
    """Classify routes into High/Medium/Low performance"""
    # Composite score calculation
    df['performance_score'] = (
        df['occupancy_percentage'] * 0.4 +
        df['revenue_per_km'] * 0.4 -
        df['delay_count'] * 2 -
        df['fuel_per_km'] * 0.2
    )
    
    # Classify based on percentiles
    high_threshold = df['performance_score'].quantile(0.67)
    low_threshold = df['performance_score'].quantile(0.33)
    
    df['performance_class'] = df['performance_score'].apply(
        lambda x: 'High' if x >= high_threshold else ('Low' if x <= low_threshold else 'Medium')
    )
    
    return df


def train_naive_bayes_model(X_train, y_train, X_test, y_test):
    """Train Naive Bayes classifier"""
    # Standardize features
    scaler = StandardScaler()
    X_train_scaled = scaler.fit_transform(X_train)
    X_test_scaled = scaler.transform(X_test)
    
    # Train Gaussian Naive Bayes
    nb = GaussianNB()
    nb.fit(X_train_scaled, y_train)
    
    # Predictions
    y_pred_train = nb.predict(X_train_scaled)
    y_pred_test = nb.predict(X_test_scaled)
    
    return nb, scaler, y_pred_train, y_pred_test


def calculate_classification_metrics(y_true, y_pred):
    """Calculate classification metrics"""
    accuracy = accuracy_score(y_true, y_pred)
    precision = precision_score(y_true, y_pred, average='weighted', zero_division=0)
    recall = recall_score(y_true, y_pred, average='weighted', zero_division=0)
    f1 = f1_score(y_true, y_pred, average='weighted', zero_division=0)
    
    return {
        'Accuracy': float(accuracy),
        'Precision': float(precision),
        'Recall': float(recall),
        'F1_Score': float(f1)
    }


def create_confusion_matrix_heatmap(y_test, y_pred, class_labels):
    """Create confusion matrix heatmap"""
    cm = confusion_matrix(y_test, y_pred, labels=class_labels)
    
    plt.figure(figsize=(10, 8), dpi=DPI)
    sns.heatmap(cm, annot=True, fmt='d', cmap='Blues', 
                xticklabels=class_labels, yticklabels=class_labels,
                cbar_kws={'label': 'Count'})
    
    plt.xlabel('Predicted Class', fontsize=12)
    plt.ylabel('Actual Class', fontsize=12)
    plt.title('Naive Bayes: Route Performance Confusion Matrix', fontsize=14, fontweight='bold')
    
    # Save to base64
    buffer = BytesIO()
    plt.savefig(buffer, format='png', bbox_inches='tight')
    buffer.seek(0)
    image_base64 = base64.b64encode(buffer.read()).decode()
    plt.close()
    
    return f"data:image/png;base64,{image_base64}"


def run_naive_bayes_classification():
    """Main function to run Naive Bayes route performance classification"""
    print("🚀 Starting Naive Bayes Route Performance Classification...")
    
    # Fetch data
    print("📊 Fetching trip data...")
    df = fetch_route_performance_data()
    
    if df.empty:
        print("❌ No trip data found!")
        return None
    
    print(f"✅ Loaded {len(df)} trip records")
    
    # Calculate features
    print("🔄 Calculating performance features...")
    route_metrics = calculate_performance_features(df)
    
    # Classify performance
    route_metrics = classify_performance(route_metrics)
    
    print(f"📊 Performance distribution:")
    print(route_metrics['performance_class'].value_counts())
    
    # Prepare features
    feature_cols = ['occupancy_percentage', 'fuel_per_km', 'delay_count', 'revenue_per_km']
    target_col = 'performance_class'
    
    X = route_metrics[feature_cols].values
    y = route_metrics[target_col].values
    
    # Train-test split
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=TEST_SIZE, random_state=RANDOM_STATE, stratify=y
    )
    
    print(f"📈 Training set: {len(X_train)}, Test set: {len(X_test)}")
    
    # Train model
    print("🤖 Training Naive Bayes model...")
    nb, scaler, y_pred_train, y_pred_test = train_naive_bayes_model(X_train, y_train, X_test, y_test)
    
    # Calculate metrics
    train_metrics = calculate_classification_metrics(y_train, y_pred_train)
    test_metrics = calculate_classification_metrics(y_test, y_pred_test)
    
    print("📊 Training Metrics:", train_metrics)
    print("📊 Testing Metrics:", test_metrics)
    
    # Create visualization
    print("📈 Creating confusion matrix...")
    class_labels = sorted(route_metrics['performance_class'].unique())
    viz_image = create_confusion_matrix_heatmap(y_test, y_pred_test, class_labels)
    
    # Prepare report
    report_data = {
        'model_type': 'Gaussian Naive Bayes',
        'description': 'Route performance classification (High/Medium/Low)',
        'train_metrics': train_metrics,
        'test_metrics': test_metrics,
        'visualization': viz_image,
        'class_distribution': route_metrics['performance_class'].value_counts().to_dict(),
        'feature_importance': {
            'features': feature_cols,
            'weights': [0.4, 0.2, 0.2, 0.4]
        }
    }
    
    # Save to MongoDB
    print("💾 Saving report to MongoDB...")
    report_id = save_model_report('nb_route_performance', report_data)
    print(f"✅ Report saved with ID: {report_id}")
    
    return report_data


if __name__ == '__main__':
    result = run_naive_bayes_classification()
    if result:
        print("\n✅ Naive Bayes Route Performance Classification completed successfully!")
