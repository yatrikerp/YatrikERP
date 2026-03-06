"""
Machine Learning Model for Crew Fatigue Prediction
Research Area: Human Factors in Transportation Safety

Uses Random Forest and XGBoost for fatigue prediction
"""

import numpy as np
import pandas as pd
from sklearn.ensemble import RandomForestRegressor, GradientBoostingRegressor
from xgboost import XGBRegressor
from sklearn.model_selection import train_test_split, cross_val_score
from sklearn.metrics import mean_absolute_error, mean_squared_error, r2_score
import joblib

class CrewFatiguePredictor:
    def __init__(self, model_type='random_forest'):
        """
        Initialize fatigue predictor
        model_type: 'random_forest', 'xgboost', or 'gradient_boosting'
        """
        self.model_type = model_type
        self.model = None
        self.feature_importance = None
        
    def prepare_features(self, df):
        """
        Prepare features for fatigue prediction
        
        Expected columns:
        - daily_working_hours
        - total_distance_covered
        - consecutive_working_days
        - night_shift_count
        - rest_hours_since_last_shift
        - age (optional)
        - experience_years (optional)
        - trips_completed_today
        - long_distance_trips
        
        Target: fatigue_score (0-100)
        """
        features = [
            'daily_working_hours',
            'total_distance_covered',
            'consecutive_working_days',
            'night_shift_count',
            'rest_hours_since_last_shift',
            'trips_completed_today',
            'long_distance_trips'
        ]
        
        # Add optional features if available
        if 'age' in df.columns:
            features.append('age')
        if 'experience_years' in df.columns:
            features.append('experience_years')
            
        X = df[features]
        y = df['fatigue_score'] if 'fatigue_score' in df.columns else None
        
        return X, y, features
    
    def build_model(self):
        """Build the ML model"""
        if self.model_type == 'random_forest':
            self.model = RandomForestRegressor(
                n_estimators=200,
                max_depth=15,
                min_samples_split=5,
                min_samples_leaf=2,
                random_state=42,
                n_jobs=-1
            )
        elif self.model_type == 'xgboost':
            self.model = XGBRegressor(
                n_estimators=200,
                max_depth=8,
                learning_rate=0.1,
                subsample=0.8,
                colsample_bytree=0.8,
                random_state=42
            )
        elif self.model_type == 'gradient_boosting':
            self.model = GradientBoostingRegressor(
                n_estimators=200,
                max_depth=8,
                learning_rate=0.1,
                subsample=0.8,
                random_state=42
            )
        else:
            raise ValueError(f"Unknown model type: {self.model_type}")
            
        return self.model
    
    def train(self, X_train, y_train):
        """Train the model"""
        print(f"Training {self.model_type} model...")
        self.model.fit(X_train, y_train)
        
        # Get feature importance
        if hasattr(self.model, 'feature_importances_'):
            self.feature_importance = self.model.feature_importances_
            
        print("Training complete!")
        return self.model
    
    def evaluate(self, X_test, y_test):
        """Evaluate model performance"""
        predictions = self.model.predict(X_test)
        
        mae = mean_absolute_error(y_test, predictions)
        rmse = np.sqrt(mean_squared_error(y_test, predictions))
        r2 = r2_score(y_test, predictions)
        
        # Calculate MAPE
        mape = np.mean(np.abs((y_test - predictions) / y_test)) * 100
        
        results = {
            'MAE': mae,
            'RMSE': rmse,
            'R2': r2,
            'MAPE': mape
        }
        
        print("\n=== Model Evaluation ===")
        print(f"Mean Absolute Error: {mae:.2f}")
        print(f"Root Mean Squared Error: {rmse:.2f}")
        print(f"R² Score: {r2:.4f}")
        print(f"MAPE: {mape:.2f}%")
        
        return results
    
    def cross_validate(self, X, y, cv=5):
        """Perform cross-validation"""
        scores = cross_val_score(
            self.model, X, y, 
            cv=cv, 
            scoring='neg_mean_absolute_error'
        )
        
        print(f"\nCross-validation MAE: {-scores.mean():.2f} (+/- {scores.std():.2f})")
        return scores
    
    def predict(self, X):
        """Make predictions"""
        predictions = self.model.predict(X)
        # Clip predictions to valid range [0, 100]
        return np.clip(predictions, 0, 100)
    
    def get_feature_importance(self, feature_names):
        """Get feature importance ranking"""
        if self.feature_importance is None:
            return None
            
        importance_df = pd.DataFrame({
            'feature': feature_names,
            'importance': self.feature_importance
        }).sort_values('importance', ascending=False)
        
        print("\n=== Feature Importance ===")
        print(importance_df)
        
        return importance_df
    
    def save_model(self, model_path='fatigue_model.pkl'):
        """Save trained model"""
        joblib.dump(self.model, model_path)
        print(f"\nModel saved to {model_path}")
    
    def load_model(self, model_path='fatigue_model.pkl'):
        """Load trained model"""
        self.model = joblib.load(model_path)
        print(f"Model loaded from {model_path}")
        return self.model

# Example usage and comparison
if __name__ == "__main__":
    print("Crew Fatigue ML Predictor")
    print("=" * 50)
    
    # TODO: Load data from MongoDB
    # df = load_fatigue_data_from_mongodb()
    
    # Example: Compare different models
    models_to_test = ['random_forest', 'xgboost', 'gradient_boosting']
    
    print("\nNext steps:")
    print("1. Collect crew fatigue data (historical + actual fatigue scores)")
    print("2. Include crew surveys or incident reports as ground truth")
    print("3. Train and compare Random Forest, XGBoost, Gradient Boosting")
    print("4. Validate with cross-validation")
    print("5. Deploy best model to production")
    print("\nResearch Questions:")
    print("- Which features are most predictive of fatigue?")
    print("- Can we predict fatigue-related incidents?")
    print("- How does model accuracy compare to rule-based system?")
    print("- What is the optimal fatigue threshold for safety?")
