#!/bin/bash

# YATRIK ERP - Start All Services
# Starts Node.js backend and Flask ML microservice concurrently

echo "======================================"
echo "🚀 YATRIK ERP - Starting All Services"
echo "======================================"

# Check if Python is installed
if ! command -v python &> /dev/null && ! command -v python3 &> /dev/null
then
    echo "❌ Python is not installed. Please install Python 3.8+ first."
    exit 1
fi

# Determine Python command
if command -v python3 &> /dev/null
then
    PYTHON_CMD=python3
else
    PYTHON_CMD=python
fi

echo "✅ Python found: $PYTHON_CMD"

# Check if Node.js is installed
if ! command -v node &> /dev/null
then
    echo "❌ Node.js is not installed. Please install Node.js first."
    exit 1
fi

echo "✅ Node.js found: $(node --version)"

# Install Python dependencies if needed
if [ ! -d "backend/ml_models/__pycache__" ]; then
    echo "📦 Installing Python ML dependencies..."
    cd backend/ml_models
    $PYTHON_CMD -m pip install -r requirements.txt
    cd ../..
fi

# Create log directory
mkdir -p logs

# Start Flask ML Service in background
echo "🐍 Starting Flask ML Service on port 5000..."
cd backend
$PYTHON_CMD ml_service.py > ../logs/ml_service.log 2>&1 &
ML_PID=$!
cd ..

# Wait for ML service to start
sleep 3

# Check if ML service started successfully
if ps -p $ML_PID > /dev/null; then
    echo "✅ Flask ML Service started (PID: $ML_PID)"
else
    echo "❌ Flask ML Service failed to start. Check logs/ml_service.log"
    exit 1
fi

# Start Node.js Backend
echo "🟢 Starting Node.js Backend..."
cd backend
npm start

# Cleanup on exit
trap "echo '🛑 Stopping services...'; kill $ML_PID 2>/dev/null; exit" INT TERM EXIT
