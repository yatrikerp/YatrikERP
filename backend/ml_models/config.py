"""
Configuration for ML Models
"""
import os
from dotenv import load_dotenv

load_dotenv()

# MongoDB Configuration
MONGO_URI = os.getenv('MONGO_URI', 'mongodb://localhost:27017/yatrik_erp')
DB_NAME = 'yatrik_erp'

# Collections
TRIPS_COLLECTION = 'trips'
ROUTES_COLLECTION = 'routes'
BOOKINGS_COLLECTION = 'bookings'
CREW_COLLECTION = 'crews'
DRIVERS_COLLECTION = 'drivers'
CONDUCTORS_COLLECTION = 'conductors'
ML_REPORTS_COLLECTION = 'ml_reports'

# Model Settings
RANDOM_STATE = 42
TEST_SIZE = 0.2

# Visualization Settings
FIG_SIZE = (12, 6)
DPI = 100
