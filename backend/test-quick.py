"""Quick ML service test"""
import requests

print("Testing ML Service...")
try:
    response = requests.get('http://localhost:5001/health', timeout=5)
    print(f"Status Code: {response.status_code}")
    print(f"Response: {response.json()}")
except Exception as e:
    print(f"Error: {e}")
