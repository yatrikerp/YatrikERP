"""
Utility functions for ML models
"""
import pymongo
from datetime import datetime
import numpy as np
import pandas as pd
from config import MONGO_URI, DB_NAME, ML_REPORTS_COLLECTION

def get_mongo_client():
    """Get MongoDB client connection"""
    return pymongo.MongoClient(MONGO_URI)

def save_model_report(model_name, metrics, timestamp=None):
    """Save model metrics to ml_reports collection"""
    client = get_mongo_client()
    db = client[DB_NAME]
    collection = db[ML_REPORTS_COLLECTION]
    
    report = {
        'model_name': model_name,
        'metrics': metrics,
        'timestamp': timestamp or datetime.utcnow(),
        'status': 'completed'
    }
    
    result = collection.insert_one(report)
    client.close()
    return str(result.inserted_id)

def get_latest_report(model_name):
    """Get latest report for a model"""
    client = get_mongo_client()
    db = client[DB_NAME]
    collection = db[ML_REPORTS_COLLECTION]
    
    report = collection.find_one(
        {'model_name': model_name},
        sort=[('timestamp', pymongo.DESCENDING)]
    )
    client.close()
    
    if report:
        report['_id'] = str(report['_id'])
    return report

def encode_categorical(df, column):
    """Encode categorical column"""
    unique_vals = df[column].unique()
    mapping = {val: idx for idx, val in enumerate(unique_vals)}
    return df[column].map(mapping), mapping

def prepare_features(df, feature_columns, target_column):
    """Prepare features and target"""
    X = df[feature_columns].values
    y = df[target_column].values
    return X, y
