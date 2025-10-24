"""Test TensorFlow import"""
print("Starting TensorFlow import test...")
print("Importing tensorflow...")

try:
    import tensorflow as tf
    print("✅ TensorFlow imported successfully")
    
    try:
        print(f"Version: {tf.__version__}")
    except AttributeError:
        print("⚠️ Version attribute not available")
        
except ImportError as e:
    print(f"❌ Failed to import TensorFlow: {e}")
except Exception as e:
    print(f"❌ Error: {e}")

print("Test complete!")
