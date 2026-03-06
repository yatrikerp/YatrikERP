"""
LSTM-based Passenger Demand Prediction Model
Research Area: Time-Series Forecasting for Transportation

This script trains a real LSTM model for passenger demand prediction
"""

import numpy as np
import pandas as pd
from tensorflow.keras.models import Sequential
from tensorflow.keras.layers import LSTM, Dense, Dropout
from sklearn.preprocessing import MinMaxScaler
from sklearn.model_selection import train_test_split
import joblib

class DemandPredictionLSTM:
    def __init__(self, sequence_length=7):
        self.sequence_length = sequence_length
        self.scaler = MinMaxScaler()
        self.model = None
        
    def prepare_data(self, df):
        """
        Prepare time-series data for LSTM
        df should have columns: date, route_id, passengers, day_of_week, 
                                is_weekend, is_holiday, time_slot
        """
        # Feature engineering
        features = ['passengers', 'day_of_week', 'is_weekend', 
                   'is_holiday', 'hour', 'month']
        
        # Normalize features
        scaled_data = self.scaler.fit_transform(df[features])
        
        # Create sequences
        X, y = [], []
        for i in range(len(scaled_data) - self.sequence_length):
            X.append(scaled_data[i:i+self.sequence_length])
            y.append(scaled_data[i+self.sequence_length, 0])  # Predict passengers
            
        return np.array(X), np.array(y)
    
    def build_model(self, input_shape):
        """Build LSTM architecture"""
        self.model = Sequential([
            LSTM(128, return_sequences=True, input_shape=input_shape),
            Dropout(0.2),
            LSTM(64, return_sequences=False),
            Dropout(0.2),
            Dense(32, activation='relu'),
            Dense(1)  # Output: predicted passengers
        ])
        
        self.model.compile(
            optimizer='adam',
            loss='mse',
            metrics=['mae', 'mape']
        )
        
        return self.model
    
    def train(self, X_train, y_train, X_val, y_val, epochs=50, batch_size=32):
        """Train the model"""
        history = self.model.fit(
            X_train, y_train,
            validation_data=(X_val, y_val),
            epochs=epochs,
            batch_size=batch_size,
            verbose=1
        )
        return history
    
    def predict(self, X):
        """Make predictions"""
        predictions = self.model.predict(X)
        return predictions
    
    def save_model(self, model_path='demand_lstm_model.h5', 
                   scaler_path='demand_scaler.pkl'):
        """Save trained model and scaler"""
        self.model.save(model_path)
        joblib.dump(self.scaler, scaler_path)
        print(f"Model saved to {model_path}")
        print(f"Scaler saved to {scaler_path}")

# Example usage
if __name__ == "__main__":
    # TODO: Load data from MongoDB
    # df = load_data_from_mongodb()
    
    # Initialize model
    lstm_model = DemandPredictionLSTM(sequence_length=7)
    
    # Prepare data
    # X, y = lstm_model.prepare_data(df)
    # X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2)
    
    # Build and train
    # lstm_model.build_model(input_shape=(X_train.shape[1], X_train.shape[2]))
    # history = lstm_model.train(X_train, y_train, X_test, y_test)
    
    # Save model
    # lstm_model.save_model()
    
    print("LSTM Demand Prediction Model - Ready for training")
    print("Next steps:")
    print("1. Export historical trip data from MongoDB")
    print("2. Prepare features (date, time, passengers, etc.)")
    print("3. Train model with at least 6 months of data")
    print("4. Evaluate using MAE, RMSE, MAPE metrics")
    print("5. Deploy model and integrate with Node.js backend")
