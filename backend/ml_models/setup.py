"""
Setup script to verify ML environment and dependencies
"""
import sys
import subprocess

def check_python_version():
    """Check if Python version is 3.8+"""
    version = sys.version_info
    print(f"🐍 Python version: {version.major}.{version.minor}.{version.micro}")
    
    if version.major < 3 or (version.major == 3 and version.minor < 8):
        print("❌ Python 3.8+ is required!")
        return False
    
    print("✅ Python version is compatible")
    return True

def install_dependencies():
    """Install all required packages"""
    print("\n📦 Installing ML dependencies...")
    
    try:
        subprocess.check_call([
            sys.executable, 
            "-m", 
            "pip", 
            "install", 
            "-r", 
            "requirements.txt",
            "--upgrade"
        ])
        print("✅ Dependencies installed successfully")
        return True
    except subprocess.CalledProcessError as e:
        print(f"❌ Failed to install dependencies: {e}")
        return False

def verify_imports():
    """Verify all required packages can be imported"""
    print("\n🔍 Verifying package imports...")
    
    packages = [
        'pandas',
        'numpy',
        'sklearn',
        'matplotlib',
        'seaborn',
        'pymongo',
        'flask',
        'flask_cors'
    ]
    
    failed = []
    
    for package in packages:
        try:
            if package == 'sklearn':
                __import__('sklearn')
            elif package == 'flask_cors':
                __import__('flask_cors')
            else:
                __import__(package)
            print(f"  ✅ {package}")
        except ImportError:
            print(f"  ❌ {package}")
            failed.append(package)
    
    # TensorFlow is optional
    try:
        import tensorflow as tf
        print(f"  ✅ tensorflow (version {tf.__version__})")
    except ImportError:
        print(f"  ⚠️  tensorflow (optional - will use fallback model)")
    
    if failed:
        print(f"\n❌ Failed to import: {', '.join(failed)}")
        return False
    
    print("\n✅ All required packages verified")
    return True

def test_mongodb_connection():
    """Test MongoDB connection"""
    print("\n🔌 Testing MongoDB connection...")
    
    try:
        from config import MONGO_URI, DB_NAME
        import pymongo
        
        client = pymongo.MongoClient(MONGO_URI, serverSelectionTimeoutMS=5000)
        client.server_info()
        
        db = client[DB_NAME]
        collections = db.list_collection_names()
        
        print(f"✅ Connected to MongoDB: {DB_NAME}")
        print(f"📊 Found {len(collections)} collections")
        
        client.close()
        return True
        
    except Exception as e:
        print(f"❌ MongoDB connection failed: {e}")
        print("⚠️  Make sure MONGO_URI is set in .env file")
        return False

def main():
    """Main setup routine"""
    print("=" * 60)
    print("YATRIK ERP - ML Models Setup")
    print("=" * 60)
    
    # Check Python version
    if not check_python_version():
        sys.exit(1)
    
    # Install dependencies
    if not install_dependencies():
        sys.exit(1)
    
    # Verify imports
    if not verify_imports():
        print("\n⚠️  Some packages failed to import.")
        print("Try running: pip install -r requirements.txt --upgrade")
        sys.exit(1)
    
    # Test MongoDB connection
    test_mongodb_connection()
    
    print("\n" + "=" * 60)
    print("✅ ML Models setup complete!")
    print("=" * 60)
    print("\nNext steps:")
    print("1. Start Flask ML service: python ml_service.py")
    print("2. Test endpoints: curl http://localhost:5000/health")
    print("3. Run models: curl -X POST http://localhost:5000/run_all")
    print("=" * 60)

if __name__ == '__main__':
    main()
