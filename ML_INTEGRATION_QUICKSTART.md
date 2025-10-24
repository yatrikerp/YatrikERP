# ML Integration Quick Start Guide
## Get Started in 5 Minutes

**Last Updated:** 2025-10-20  
**Status:** ✅ Production Ready

---

## 🚀 One-Command Quick Start

```cmd
cd d:\YATRIK ERP
test-ml-integration.bat
```

This will automatically:
- ✅ Check Python 3.9 installation
- ✅ Verify all ML packages
- ✅ Test MongoDB connection
- ✅ Check ML service health
- ✅ Verify system readiness

---

## 📋 Expected Output

```
======================================
  YATRIK ERP ML Integration Tests
======================================

[PASS] Python 3.9 found
[PASS] Node.js found
[PASS] Python packages installed
[PASS] MongoDB configuration found
[PASS] ML service is running on port 5001
[PASS] Node.js backend is running

======================================
  Test Summary
======================================

✅ All systems operational!
```

---

## 🎯 Three Common Scenarios

### Scenario 1: Just Test Everything
```cmd
cd d:\YATRIK ERP
test-ml-integration.bat
```

**What it does:** Runs all diagnostic tests  
**Time:** ~5 seconds  
**When to use:** Before starting work, after system restart

---

### Scenario 2: Start ML Service Only

**EASIEST WAY - Use the batch file:**
```cmd
cd d:\YATRIK ERP\backend
start-ml-service.bat
```

**Or use Python 3.9 directly:**
```cmd
cd d:\YATRIK ERP\backend
C:\Users\akhil\AppData\Local\Programs\Python\Python39\python.exe ml_service.py
```

**⚠️ DON'T use `python.exe ml_service.py` - it uses the wrong Python version!**

**What it does:** Starts Flask ML microservice on port 5001  
**When to use:** When you only need ML functionality  
**Keep running:** Yes, leave terminal open

**Expected output:**
```
🚀 YATRIK ML Service starting on port 5001
Available models: 5
  - KNN Passenger Demand Prediction
  - Naive Bayes Route Performance
  - Decision Tree Trip Delay
  - SVM Route Optimization
  - Neural Network Crew Load
```

---

### Scenario 3: Start Everything
```cmd
cd d:\YATRIK ERP
start-all-services.bat
```

**What it does:**
- Starts ML Flask service (port 5001)
- Starts Node.js backend (port 5000)
- Creates log files

**When to use:** Full system development/testing  
**Logs location:** `d:\YATRIK ERP\logs\`

---

## 🧪 Run Comprehensive Tests

```cmd
cd d:\YATRIK ERP\backend
C:\Users\akhil\AppData\Local\Programs\Python\Python39\python.exe test-ml-integration.py
```

**Test Coverage:**
1. ✅ Python Environment (all packages)
2. ✅ MongoDB Connection
3. ✅ ML Service Health
4. ⚠️ Model Execution (skipped if no data)
5. ⚠️ Metrics Retrieval (skipped if no data)
6. ✅ Node.js Integration

**Time:** ~3 seconds  
**Output:** Detailed test report with emojis

---

## 🔍 Quick Health Checks

### Check ML Service
```cmd
curl http://localhost:5001/health
```

**Good response:**
```json
{
  "status": "healthy",
  "models_available": 5
}
```

### Check Python Packages
```cmd
C:\Users\akhil\AppData\Local\Programs\Python\Python39\python.exe -c "import pandas, numpy, sklearn, seaborn, pymongo, flask; print('All packages OK')"
```

### Check MongoDB
```cmd
C:\Users\akhil\AppData\Local\Programs\Python\Python39\python.exe -c "from ml_models.config import MONGO_URI; import pymongo; pymongo.MongoClient(MONGO_URI).server_info(); print('MongoDB OK')"
```

---

## 🆘 Troubleshooting (One-Liners)

### ML Service Not Running?
```cmd
cd d:\YATRIK ERP\backend && C:\Users\akhil\AppData\Local\Programs\Python\Python39\python.exe ml_service.py
```

### Port Already in Use?
```cmd
netstat -ano | findstr :5001
```
Then kill the process or use different port.

### Python Packages Missing?
```cmd
cd d:\YATRIK ERP\backend && C:\Users\akhil\AppData\Local\Programs\Python\Python39\python.exe -m pip install -r ml_models\requirements.txt
```

### Clear Python Cache?
```cmd
cd d:\YATRIK ERP\backend\ml_models && rmdir /S /Q __pycache__
```

---

## 📱 Using the ML API

### Run All Models
```bash
curl -X POST http://localhost:5001/run_all
```

### Run Specific Model
```bash
curl -X POST http://localhost:5001/run/knn_demand_prediction
```

### Get Model Metrics
```bash
curl http://localhost:5001/metrics/knn_demand_prediction
```

### Get All Metrics
```bash
curl http://localhost:5001/metrics/all
```

---

## 🎯 Key Ports Reference

| Service | Port | URL |
|---------|------|-----|
| Node.js Backend | 5000 | http://localhost:5000 |
| ML Flask Service | 5001 | http://localhost:5001 |
| React Frontend | 5173 | http://localhost:5173 |
| MongoDB Atlas | N/A | Cloud-hosted |

---

## 📁 Important File Locations

```
d:\YATRIK ERP\
├── test-ml-integration.bat          ← Quick test (START HERE)
├── start-all-services.bat            ← Start everything
├── backend\
│   ├── .env                          ← Environment config
│   ├── ml_service.py                 ← ML Flask service
│   ├── test-ml-integration.py        ← Full test suite
│   ├── test-ml-integration.bat       ← Quick test
│   └── ml_models\
│       ├── requirements.txt          ← Python packages
│       ├── knn_demand.py             ← Model 1
│       ├── nb_route_performance.py   ← Model 2
│       ├── dt_delay.py               ← Model 3
│       ├── svm_route_opt.py          ← Model 4
│       └── nn_crewload.py            ← Model 5
└── logs\
    └── ml_service.log                ← Service logs
```

---

## ✅ Daily Workflow

### Morning Startup
```cmd
cd d:\YATRIK ERP
test-ml-integration.bat
```
If all pass → start working  
If any fail → check troubleshooting guide

### Start Development
```cmd
start-all-services.bat
```

### End of Day
Press `Ctrl+C` in terminals to stop services

---

## 📚 More Help?

| Topic | Document |
|-------|----------|
| Issues & Fixes | `ML_INTEGRATION_TROUBLESHOOTING.md` |
| Detailed Status | `ML_INTEGRATION_STATUS_REPORT.md` |
| Full Guide | `ML_INTEGRATION_GUIDE.md` |
| Installation | `ML_INSTALLATION_CHECKLIST.md` |
| API Reference | `ML_QUICK_REFERENCE.md` |

---

## 🎉 Success Indicators

You know everything is working when:

- ✅ `test-ml-integration.bat` shows all green
- ✅ `curl http://localhost:5001/health` returns JSON
- ✅ ML service shows 5 models available
- ✅ No errors in terminal when starting services
- ✅ Test output shows "Passed: 3/3" or better

---

**Quick Start Complete!** 🚀  
You're ready to use the YATRIK ERP ML system.

For detailed information, see the full documentation in the repository.
