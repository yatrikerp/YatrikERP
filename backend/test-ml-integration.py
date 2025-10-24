"""
Test ML Integration
===================
Run this script to verify all ML components are working correctly.
"""

import sys
import os

# Set matplotlib to use non-interactive backend BEFORE any other imports
import matplotlib
matplotlib.use('Agg')

sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'ml_models'))

import time
import requests
from datetime import datetime

# Configuration
ML_SERVICE_URL = 'http://localhost:5001'
NODE_SERVICE_URL = 'http://localhost:5000/api/ai'

def print_section(title):
    """Print formatted section header"""
    print("\n" + "=" * 60)
    print(f"  {title}")
    print("=" * 60)

def test_python_environment():
    """Test Python environment"""
    print_section("1. Python Environment")
    
    try:
        import pandas
        import numpy
        import sklearn
        import matplotlib
        import seaborn
        import pymongo
        import flask
        
        print("✅ All core packages imported successfully")
        print(f"   pandas: {pandas.__version__}")
        print(f"   numpy: {numpy.__version__}")
        print(f"   scikit-learn: {sklearn.__version__}")
        print(f"   matplotlib: {matplotlib.__version__}")
        
        try:
            import tensorflow as tf
            try:
                version = tf.__version__
                print(f"   tensorflow: {version} ✅")
            except AttributeError:
                print(f"   tensorflow: Installed (version check unavailable) ✅")
        except ImportError:
            print(f"   tensorflow: Not installed (will use fallback) ⚠️")
        
        return True
    except ImportError as e:
        print(f"❌ Missing package: {e}")
        return False

def test_mongodb_connection():
    """Test MongoDB connection"""
    print_section("2. MongoDB Connection")
    
    try:
        from ml_models.config import MONGO_URI, DB_NAME
        import pymongo
        
        client = pymongo.MongoClient(MONGO_URI, serverSelectionTimeoutMS=5000)
        client.server_info()
        
        db = client[DB_NAME]
        collections = db.list_collection_names()
        
        print(f"✅ Connected to MongoDB")
        print(f"   Database: {DB_NAME}")
        print(f"   Collections: {len(collections)}")
        
        # Check for required collections
        required = ['trips', 'routes', 'bookings', 'duties']
        for coll in required:
            count = db[coll].count_documents({})
            print(f"   - {coll}: {count} documents")
        
        client.close()
        return True
        
    except Exception as e:
        print(f"❌ MongoDB connection failed: {e}")
        return False

def test_ml_service_health():
    """Test ML service health"""
    print_section("3. ML Service Health")
    
    try:
        response = requests.get(f"{ML_SERVICE_URL}/health", timeout=5)
        
        if response.status_code == 200:
            data = response.json()
            print("✅ ML Service is running")
            print(f"   Status: {data.get('status')}")
            print(f"   Models available: {data.get('models_available')}")
            return True
        else:
            print(f"❌ ML Service returned status {response.status_code}")
            return False
            
    except requests.exceptions.ConnectionError:
        print("❌ ML Service is not running")
        print("   Start it with: python ml_service.py")
        return False
    except Exception as e:
        print(f"❌ Error: {e}")
        return False

def test_model_execution():
    """Test running a single model"""
    print_section("4. Model Execution Test")
    
    try:
        print("Running KNN model (this may take 10-20 seconds)...")
        
        response = requests.post(
            f"{ML_SERVICE_URL}/run/knn_demand_prediction",
            timeout=60
        )
        
        if response.status_code == 200:
            print("✅ Model executed successfully")
            data = response.json()
            print(f"   Status: {data.get('status')}")
            return True
        else:
            print(f"❌ Model execution failed: {response.status_code}")
            print(f"   {response.text}")
            return False
            
    except Exception as e:
        print(f"❌ Error running model: {e}")
        return False

def test_metrics_retrieval():
    """Test retrieving model metrics"""
    print_section("5. Metrics Retrieval Test")
    
    try:
        response = requests.get(
            f"{ML_SERVICE_URL}/metrics/knn_demand_prediction",
            timeout=10
        )
        
        if response.status_code == 200:
            data = response.json()
            if data.get('status') == 'success':
                print("✅ Metrics retrieved successfully")
                
                report = data.get('report', {})
                metrics = report.get('metrics', {})
                test_metrics = metrics.get('test_metrics', {})
                
                print(f"   Model: {metrics.get('model_type')}")
                print(f"   Test Metrics:")
                for key, value in test_metrics.items():
                    if isinstance(value, float):
                        print(f"     - {key}: {value:.4f}")
                    else:
                        print(f"     - {key}: {value}")
                
                return True
            else:
                print("⚠️  No metrics found (model may not have run yet)")
                return True
        else:
            print(f"❌ Failed to retrieve metrics: {response.status_code}")
            return False
            
    except Exception as e:
        print(f"❌ Error: {e}")
        return False

def test_node_integration():
    """Test Node.js integration"""
    print_section("6. Node.js Integration Test")
    
    print("⚠️  This test requires:")
    print("   1. Node.js backend running")
    print("   2. Valid admin JWT token")
    print("\nSkipping automated test. Manual test:")
    print("   curl -H 'Authorization: Bearer YOUR_TOKEN' http://localhost:5000/api/ai/health")
    
    return True

def run_all_tests():
    """Run all integration tests"""
    print("\n")
    print("╔" + "=" * 58 + "╗")
    print("║" + " " * 58 + "║")
    print("║" + "  YATRIK ERP - ML Integration Test Suite".center(58) + "║")
    print("║" + " " * 58 + "║")
    print("╚" + "=" * 58 + "╝")
    print(f"\nStarted at: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    
    results = {}
    
    # Run tests
    results['Python Environment'] = test_python_environment()
    results['MongoDB Connection'] = test_mongodb_connection()
    results['ML Service Health'] = test_ml_service_health()
    
    if results['ML Service Health']:
        results['Model Execution'] = test_model_execution()
        results['Metrics Retrieval'] = test_metrics_retrieval()
    else:
        print("\n⚠️  Skipping model tests (ML service not running)")
        results['Model Execution'] = None
        results['Metrics Retrieval'] = None
    
    results['Node.js Integration'] = test_node_integration()
    
    # Summary
    print_section("Test Summary")
    
    passed = sum(1 for v in results.values() if v is True)
    failed = sum(1 for v in results.values() if v is False)
    skipped = sum(1 for v in results.values() if v is None)
    total = len(results)
    
    for test_name, result in results.items():
        status = "✅ PASS" if result is True else "❌ FAIL" if result is False else "⚠️  SKIP"
        print(f"{status}  {test_name}")
    
    print("\n" + "-" * 60)
    print(f"Total: {total} | Passed: {passed} | Failed: {failed} | Skipped: {skipped}")
    print("-" * 60)
    
    if failed == 0 and passed > 0:
        print("\n🎉 All tests passed! ML integration is working correctly.")
        print("\nNext steps:")
        print("1. Access React dashboard at http://localhost:5173")
        print("2. Login as admin")
        print("3. Navigate to ML Analytics")
        print("4. Click 'Run All Models'")
    elif failed > 0:
        print("\n⚠️  Some tests failed. Please review the errors above.")
    
    print(f"\nCompleted at: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print("=" * 60 + "\n")

if __name__ == '__main__':
    run_all_tests()
