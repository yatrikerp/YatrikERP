"""
Flask ML Microservice
=====================
Provides REST API endpoints to run ML models and fetch results.

Endpoints:
- GET /health - Health check
- POST /run_all - Run all 5 ML models
- POST /run/<model_name> - Run specific model
- GET /metrics/<model_name> - Get latest metrics for a model
- GET /metrics/all - Get all model metrics
- GET /comparison - Compare all model results
"""

import sys
import os

# Add ml_models to path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'ml_models'))

from flask import Flask, jsonify, request
from flask_cors import CORS
from datetime import datetime
import traceback

# Import ML models
try:
    from ml_models.knn_demand import run_knn_demand_prediction
    from ml_models.nb_route_performance import run_naive_bayes_classification
    from ml_models.dt_delay import run_decision_tree_delay_prediction
    from ml_models.svm_route_opt import run_svm_route_optimization
    from ml_models.nn_crewload import run_neural_network_crew_load
    from ml_models.utils import get_latest_report, get_mongo_client
    from ml_models.config import DB_NAME, ML_REPORTS_COLLECTION
except ImportError as e:
    print(f"Warning: Could not import ML models: {e}")
    print("Make sure to install requirements: pip install -r ml_models/requirements.txt")

app = Flask(__name__)
CORS(app)

# Model registry
MODELS = {
    'knn_demand_prediction': {
        'name': 'KNN Passenger Demand Prediction',
        'function': run_knn_demand_prediction
    },
    'nb_route_performance': {
        'name': 'Naive Bayes Route Performance',
        'function': run_naive_bayes_classification
    },
    'dt_delay_prediction': {
        'name': 'Decision Tree Trip Delay',
        'function': run_decision_tree_delay_prediction
    },
    'svm_route_optimization': {
        'name': 'SVM Route Optimization',
        'function': run_svm_route_optimization
    },
    'nn_crew_load_balancing': {
        'name': 'Neural Network Crew Load',
        'function': run_neural_network_crew_load
    }
}


@app.route('/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    return jsonify({
        'status': 'healthy',
        'service': 'YATRIK ML Service',
        'timestamp': datetime.utcnow().isoformat(),
        'models_available': len(MODELS)
    })


@app.route('/run_all', methods=['POST'])
def run_all_models():
    """Run all ML models sequentially"""
    results = {}
    errors = {}
    
    print("=" * 60)
    print("🚀 Running all ML models...")
    print("=" * 60)
    
    for model_key, model_info in MODELS.items():
        try:
            print(f"\n▶️  Running {model_info['name']}...")
            result = model_info['function']()
            
            if result:
                results[model_key] = {
                    'status': 'success',
                    'name': model_info['name'],
                    'timestamp': datetime.utcnow().isoformat()
                }
                print(f"✅ {model_info['name']} completed successfully!")
            else:
                errors[model_key] = 'Model returned no results'
                print(f"⚠️  {model_info['name']} returned no results")
                
        except Exception as e:
            errors[model_key] = str(e)
            print(f"❌ Error running {model_info['name']}: {e}")
            traceback.print_exc()
    
    print("\n" + "=" * 60)
    print(f"✅ Completed: {len(results)}/{len(MODELS)} models")
    print("=" * 60)
    
    return jsonify({
        'status': 'completed',
        'results': results,
        'errors': errors,
        'total_models': len(MODELS),
        'successful': len(results),
        'failed': len(errors)
    })


@app.route('/run/<model_name>', methods=['POST'])
def run_specific_model(model_name):
    """Run a specific ML model"""
    if model_name not in MODELS:
        return jsonify({
            'status': 'error',
            'message': f'Model "{model_name}" not found',
            'available_models': list(MODELS.keys())
        }), 404
    
    try:
        print(f"🚀 Running {MODELS[model_name]['name']}...")
        result = MODELS[model_name]['function']()
        
        if result:
            return jsonify({
                'status': 'success',
                'model': model_name,
                'name': MODELS[model_name]['name'],
                'timestamp': datetime.utcnow().isoformat()
            })
        else:
            return jsonify({
                'status': 'error',
                'message': 'Model returned no results'
            }), 500
            
    except Exception as e:
        print(f"❌ Error running {model_name}: {e}")
        traceback.print_exc()
        return jsonify({
            'status': 'error',
            'message': str(e)
        }), 500


@app.route('/metrics/<model_name>', methods=['GET'])
def get_model_metrics(model_name):
    """Get latest metrics for a specific model"""
    try:
        report = get_latest_report(model_name)
        
        if report:
            return jsonify({
                'status': 'success',
                'model': model_name,
                'report': report
            })
        else:
            return jsonify({
                'status': 'not_found',
                'message': f'No reports found for model "{model_name}"'
            }), 404
            
    except Exception as e:
        return jsonify({
            'status': 'error',
            'message': str(e)
        }), 500


@app.route('/metrics/all', methods=['GET'])
def get_all_metrics():
    """Get latest metrics for all models"""
    results = {}
    
    for model_key in MODELS.keys():
        try:
            report = get_latest_report(model_key)
            if report:
                results[model_key] = report
        except Exception as e:
            print(f"Error fetching {model_key}: {e}")
    
    return jsonify({
        'status': 'success',
        'reports': results,
        'count': len(results)
    })


@app.route('/comparison', methods=['GET'])
def compare_models():
    """Compare all model results"""
    comparison = []
    
    for model_key, model_info in MODELS.items():
        try:
            report = get_latest_report(model_key)
            
            if report:
                # Extract key metrics
                test_metrics = report.get('metrics', {}).get('test_metrics', {})
                
                comparison.append({
                    'model': model_key,
                    'name': model_info['name'],
                    'type': report.get('metrics', {}).get('model_type', 'N/A'),
                    'metrics': test_metrics,
                    'timestamp': report.get('timestamp', '').isoformat() if hasattr(report.get('timestamp', ''), 'isoformat') else str(report.get('timestamp', ''))
                })
        except Exception as e:
            print(f"Error comparing {model_key}: {e}")
    
    return jsonify({
        'status': 'success',
        'comparison': comparison,
        'count': len(comparison)
    })


@app.route('/models', methods=['GET'])
def list_models():
    """List all available models"""
    return jsonify({
        'status': 'success',
        'models': {
            key: {'name': info['name']}
            for key, info in MODELS.items()
        }
    })


@app.errorhandler(404)
def not_found(error):
    return jsonify({
        'status': 'error',
        'message': 'Endpoint not found'
    }), 404


@app.errorhandler(500)
def internal_error(error):
    return jsonify({
        'status': 'error',
        'message': 'Internal server error'
    }), 500


if __name__ == '__main__':
    port = int(os.getenv('PY_SERVICE_PORT', 5000))
    print("=" * 60)
    print(f"🚀 YATRIK ML Service starting on port {port}")
    print("=" * 60)
    print(f"Available models: {len(MODELS)}")
    for key, info in MODELS.items():
        print(f"  - {info['name']} ({key})")
    print("=" * 60)
    
    app.run(host='0.0.0.0', port=port, debug=True)
