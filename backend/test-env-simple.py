"""Simple environment test without TensorFlow"""
import sys
print(f"Python: {sys.version}")

print("\n1. Testing pandas...")
import pandas
print(f"✅ pandas: {pandas.__version__}")

print("\n2. Testing numpy...")
import numpy
print(f"✅ numpy: {numpy.__version__}")

print("\n3. Testing sklearn...")
import sklearn
print(f"✅ sklearn: {sklearn.__version__}")

print("\n4. Testing matplotlib...")
import matplotlib
print(f"✅ matplotlib: {matplotlib.__version__}")

print("\n5. Testing seaborn (THIS MAY HANG)...")
import seaborn
print(f"✅ seaborn: {seaborn.__version__}")

print("\n6. Testing pymongo...")
import pymongo
print(f"✅ pymongo: {pymongo.__version__}")

print("\n7. Testing flask...")
import flask
print(f"✅ flask: OK")

print("\n8. Testing dotenv...")
from dotenv import load_dotenv
print(f"✅ dotenv: OK")

print("\n✅ All imports successful (without TensorFlow)!")
