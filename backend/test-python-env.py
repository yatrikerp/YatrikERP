"""Quick Python environment test"""
import sys
print(f"Python version: {sys.version}")
print("\nTesting imports...")

try:
    import pandas
    print(f"✅ pandas: {pandas.__version__}")
except ImportError as e:
    print(f"❌ pandas: {e}")

try:
    import numpy
    print(f"✅ numpy: {numpy.__version__}")
except ImportError as e:
    print(f"❌ numpy: {e}")

try:
    import sklearn
    print(f"✅ scikit-learn: {sklearn.__version__}")
except ImportError as e:
    print(f"❌ scikit-learn: {e}")

try:
    import matplotlib
    print(f"✅ matplotlib: {matplotlib.__version__}")
except ImportError as e:
    print(f"❌ matplotlib: {e}")

try:
    import seaborn
    print(f"✅ seaborn: {seaborn.__version__}")
except ImportError as e:
    print(f"❌ seaborn: {e}")

try:
    import pymongo
    print(f"✅ pymongo: {pymongo.__version__}")
except ImportError as e:
    print(f"❌ pymongo: {e}")

try:
    import flask
    print(f"✅ flask: {flask.__version__}")
except ImportError as e:
    print(f"❌ flask: {e}")

try:
    from dotenv import load_dotenv
    print(f"✅ python-dotenv: OK")
except ImportError as e:
    print(f"❌ python-dotenv: {e}")

print("\n⚠️ Testing TensorFlow (this may take a while)...")
try:
    import tensorflow as tf
    print(f"✅ tensorflow: {tf.__version__}")
except ImportError as e:
    print(f"⚠️ tensorflow: {e}")

print("\n✅ Environment test complete!")
