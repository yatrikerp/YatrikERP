"""
SVM - Route Optimization Suggestion
====================================
Suggests whether a route needs optimization based on performance metrics.

Input Features:
- occupancy_rate
- avg_delay_minutes
- fuel_per_km
- revenue_efficiency

Output: Binary class (Optimized / Needs Optimization)

Metrics: Accuracy, Precision, Recall, F1-Score
Visualization: Decision boundary plot (2D projection)
"""

import pandas as pd
import numpy as np
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import StandardScaler
from sklearn.svm import SVC
from sklearn.decomposition import PCA
from sklearn.metrics import accuracy_score, precision_score, recall_score, f1_score
import matplotlib.pyplot as plt
import seaborn as sns
from datetime import datetime
import base64
from io import BytesIO

from config import *
from utils import get_mongo_client, save_model_report


def fetch_route_optimization_data():
    """Fetch route data for optimization analysis"""
    client = get_mongo_client()
    db = client[DB_NAME]
    
    # Aggregate trips with route and booking data
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


def calculate_optimization_features(df):
    """Calculate features for route optimization"""
    # Occupancy rate
    df['occupancy_rate'] = (df['seats_booked'] / df['capacity'].replace(0, 1)) * 100
    df['occupancy_rate'] = df['occupancy_rate'].clip(0, 100)
    
    # Delay calculation
    df['scheduled_departure'] = pd.to_datetime(df['scheduled_departure'], errors='coerce')
    df['actual_departure'] = pd.to_datetime(df['actual_departure'], errors='coerce')
    df['delay_minutes'] = (df['actual_departure'] - df['scheduled_departure']).dt.total_seconds() / 60
    df['delay_minutes'] = df['delay_minutes'].fillna(0).abs()
    
    # Fuel efficiency
    df['fuel_per_km'] = df['fuel_cost'] / df['distance'].replace(0, 1)
    
    # Revenue efficiency
    df['revenue_per_km'] = df['revenue'] / df['distance'].replace(0, 1)
    
    # Group by route
    route_stats = df.groupby('route_id').agg({
        'occupancy_rate': 'mean',
        'delay_minutes': 'mean',
        'fuel_per_km': 'mean',
        'revenue_per_km': 'mean'
    }).reset_index()
    
    route_stats.rename(columns={'delay_minutes': 'avg_delay_minutes'}, inplace=True)
    
    return route_stats


def classify_optimization_need(df):
    """Classify routes as needing optimization or not"""
    # Optimization score (higher is better)
    df['optimization_score'] = (
        df['occupancy_rate'] * 0.3 +
        (100 - df['avg_delay_minutes']) * 0.3 +
        df['revenue_per_km'] * 0.2 -
        df['fuel_per_km'] * 0.2
    )
    
    # Binary classification based on median
    median_score = df['optimization_score'].median()
    df['needs_optimization'] = (df['optimization_score'] < median_score).astype(int)
    
    return df


def train_svm_model(X_train, y_train, X_test, y_test):
    """Train SVM classifier"""
    # Standardize features (critical for SVM)
    scaler = StandardScaler()
    X_train_scaled = scaler.fit_transform(X_train)
    X_test_scaled = scaler.transform(X_test)
    
    # Train SVM with RBF kernel
    svm = SVC(kernel='rbf', C=1.0, gamma='scale', random_state=RANDOM_STATE)
    svm.fit(X_train_scaled, y_train)
    
    # Predictions
    y_pred_train = svm.predict(X_train_scaled)
    y_pred_test = svm.predict(X_test_scaled)
    
    return svm, scaler, y_pred_train, y_pred_test


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


def create_decision_boundary_plot(X, y, model, scaler, feature_names):
    """Create 2D decision boundary plot using PCA"""
    # Standardize data
    X_scaled = scaler.transform(X)
    
    # Reduce to 2D using PCA
    pca = PCA(n_components=2)
    X_pca = pca.fit_transform(X_scaled)
    
    # Create mesh
    h = 0.02  # step size
    x_min, x_max = X_pca[:, 0].min() - 1, X_pca[:, 0].max() + 1
    y_min, y_max = X_pca[:, 1].min() - 1, X_pca[:, 1].max() + 1
    xx, yy = np.meshgrid(np.arange(x_min, x_max, h), np.arange(y_min, y_max, h))
    
    # Train a simple SVM on PCA data for visualization
    svm_2d = SVC(kernel='rbf', C=1.0, gamma='scale', random_state=RANDOM_STATE)
    svm_2d.fit(X_pca, y)
    
    # Predict on mesh
    Z = svm_2d.predict(np.c_[xx.ravel(), yy.ravel()])
    Z = Z.reshape(xx.shape)
    
    # Plot
    plt.figure(figsize=FIG_SIZE, dpi=DPI)
    plt.contourf(xx, yy, Z, alpha=0.3, cmap='RdYlGn')
    
    # Plot data points
    scatter = plt.scatter(X_pca[:, 0], X_pca[:, 1], c=y, cmap='RdYlGn', 
                         edgecolors='k', s=100, alpha=0.7)
    
    plt.xlabel(f'PC1 ({pca.explained_variance_ratio_[0]:.2%} variance)', fontsize=12)
    plt.ylabel(f'PC2 ({pca.explained_variance_ratio_[1]:.2%} variance)', fontsize=12)
    plt.title('SVM: Route Optimization Decision Boundary', fontsize=14, fontweight='bold')
    plt.colorbar(scatter, label='Needs Optimization')
    plt.grid(True, alpha=0.3)
    
    # Save to base64
    buffer = BytesIO()
    plt.savefig(buffer, format='png', bbox_inches='tight')
    buffer.seek(0)
    image_base64 = base64.b64encode(buffer.read()).decode()
    plt.close()
    
    return f"data:image/png;base64,{image_base64}"


def run_svm_route_optimization():
    """Main function to run SVM route optimization"""
    print("🚀 Starting SVM Route Optimization Suggestion...")
    
    # Fetch data
    print("📊 Fetching route data...")
    df = fetch_route_optimization_data()
    
    if df.empty:
        print("❌ No route data found!")
        return None
    
    print(f"✅ Loaded {len(df)} trip records")
    
    # Calculate features
    print("🔄 Calculating optimization features...")
    route_stats = calculate_optimization_features(df)
    
    # Classify optimization need
    route_stats = classify_optimization_need(route_stats)
    
    print(f"📊 Optimization need distribution:")
    print(f"Optimized: {(route_stats['needs_optimization'] == 0).sum()}")
    print(f"Needs Optimization: {(route_stats['needs_optimization'] == 1).sum()}")
    
    # Prepare features
    feature_cols = ['occupancy_rate', 'avg_delay_minutes', 'fuel_per_km', 'revenue_per_km']
    target_col = 'needs_optimization'
    
    X = route_stats[feature_cols].values
    y = route_stats[target_col].values
    
    # Train-test split
    if len(y) > 10:
        X_train, X_test, y_train, y_test = train_test_split(
            X, y, test_size=TEST_SIZE, random_state=RANDOM_STATE, stratify=y
        )
    else:
        print("❌ Insufficient data for training!")
        return None
    
    print(f"📈 Training set: {len(X_train)}, Test set: {len(X_test)}")
    
    # Train model
    print("🤖 Training SVM model...")
    svm, scaler, y_pred_train, y_pred_test = train_svm_model(X_train, y_train, X_test, y_test)
    
    # Calculate metrics
    train_metrics = calculate_classification_metrics(y_train, y_pred_train)
    test_metrics = calculate_classification_metrics(y_test, y_pred_test)
    
    print("📊 Training Metrics:", train_metrics)
    print("📊 Testing Metrics:", test_metrics)
    
    # Create visualization
    print("📈 Creating decision boundary plot...")
    viz_image = create_decision_boundary_plot(X, y, svm, scaler, feature_cols)
    
    # Prepare report
    report_data = {
        'model_type': 'SVM (RBF Kernel)',
        'description': 'Route optimization suggestion (Optimized vs Needs Optimization)',
        'train_metrics': train_metrics,
        'test_metrics': test_metrics,
        'visualization': viz_image,
        'hyperparameters': {
            'kernel': 'rbf',
            'C': 1.0,
            'gamma': 'scale'
        },
        'class_distribution': {
            'optimized': int((y == 0).sum()),
            'needs_optimization': int((y == 1).sum())
        },
        'feature_weights': {
            'occupancy_rate': 0.3,
            'avg_delay_minutes': 0.3,
            'revenue_per_km': 0.2,
            'fuel_per_km': 0.2
        }
    }
    
    # Save to MongoDB
    print("💾 Saving report to MongoDB...")
    report_id = save_model_report('svm_route_optimization', report_data)
    print(f"✅ Report saved with ID: {report_id}")
    
    return report_data


if __name__ == '__main__':
    result = run_svm_route_optimization()
    if result:
        print("\n✅ SVM Route Optimization completed successfully!")
