# Common Mistakes & How to Avoid Them
## YATRIK ERP ML Integration

**Last Updated:** 2025-10-20

---

## ❌ Mistake #1: Using the Wrong Python Command

### What You Might Do (WRONG):
```cmd
cd d:\YATRIK ERP\backend
python ml_service.py
```

or

```cmd
cd d:\YATRIK ERP\backend
python.exe ml_service.py
```

### Why It's Wrong:
- `python` or `python.exe` uses Python 3.13
- ML packages are installed in Python 3.9
- You'll get: `No module named 'seaborn'`

### What to Do Instead (RIGHT):

**✅ Option 1: Use the Batch File (Easiest)**
```cmd
cd d:\YATRIK ERP\backend
start-ml-service.bat
```

**✅ Option 2: Use Full Python 3.9 Path**
```cmd
cd d:\YATRIK ERP\backend
C:\Users\akhil\AppData\Local\Programs\Python\Python39\python.exe ml_service.py
```

**✅ Option 3: Install to Python 3.13**
```cmd
cd d:\YATRIK ERP\backend
python.exe -m pip install -r ml_models\requirements.txt
```
Then you can use `python.exe ml_service.py`

---

## ❌ Mistake #2: Running ML Service on Wrong Port

### What You Might Do (WRONG):
```python
# In .env file
ML_SERVICE_URL=http://localhost:5000
PY_SERVICE_PORT=5000
```

### Why It's Wrong:
- Port 5000 is used by Node.js backend
- Port conflict prevents ML service from starting
- Tests will fail with 404 errors

### What to Do Instead (RIGHT):
```env
# In .env file
ML_SERVICE_URL=http://localhost:5001
PY_SERVICE_PORT=5001
```

**Node.js:** port 5000  
**ML Flask:** port 5001

---

## ❌ Mistake #3: Forgetting to Add MONGO_URI

### What You Might Do (WRONG):
```env
# In .env file - only this:
MONGODB_URI=mongodb+srv://...
```

### Why It's Wrong:
- Node.js backend uses `MONGODB_URI`
- ML models use `MONGO_URI`
- MongoDB tests will fail

### What to Do Instead (RIGHT):
```env
# In .env file - both variables:
MONGODB_URI=mongodb+srv://yatrikerp:Yatrik123@cluster0...
MONGO_URI=mongodb+srv://yatrikerp:Yatrik123@cluster0...
```

---

## ❌ Mistake #4: Running Tests Without Setting Matplotlib Backend

### What You Might Do (WRONG):
```python
import seaborn
# Script hangs here...
```

### Why It's Wrong:
- Matplotlib tries to open GUI
- Seaborn imports matplotlib
- Tests hang in headless environments

### What to Do Instead (RIGHT):
```python
# Set backend BEFORE importing matplotlib/seaborn
import matplotlib
matplotlib.use('Agg')  # Non-interactive backend

import seaborn  # Now it's safe
```

This is already fixed in `test-ml-integration.py`

---

## ❌ Mistake #5: Not Checking Which Python Is Being Used

### What You Might Do (WRONG):
```cmd
python --version
```
Shows Python 3.13, but packages are in 3.9

### What to Do Instead (RIGHT):
```cmd
where python
```

Shows ALL Python installations:
```
C:\Python313\python.exe          ← Default (no packages)
C:\Users\akhil\AppData\Local\Programs\Python\Python39\python.exe  ← Has packages
```

**Always use the second one for ML!**

---

## ❌ Mistake #6: Installing Packages Without Specifying Python Version

### What You Might Do (WRONG):
```cmd
pip install pandas
```

### Why It's Wrong:
- Installs to default Python (might be 3.13)
- ML service uses Python 3.9
- Package won't be found when running ML service

### What to Do Instead (RIGHT):
```cmd
C:\Users\akhil\AppData\Local\Programs\Python\Python39\python.exe -m pip install pandas
```

Or install all at once:
```cmd
C:\Users\akhil\AppData\Local\Programs\Python\Python39\python.exe -m pip install -r ml_models\requirements.txt
```

---

## ❌ Mistake #7: Not Checking if ML Service is Running

### What You Might Do (WRONG):
Run tests without starting ML service first

### Why It's Wrong:
- Tests will fail with "ML Service returned status 404"
- Models can't execute
- Metrics can't be retrieved

### What to Do Instead (RIGHT):

**First, check if it's running:**
```cmd
curl http://localhost:5001/health
```

**If not running, start it:**
```cmd
cd d:\YATRIK ERP\backend
start-ml-service.bat
```

**Keep the terminal open!**

---

## ❌ Mistake #8: Using `python` in Batch Files

### What You Might Do (WRONG):
```batch
@echo off
python ml_service.py
```

### Why It's Wrong:
- Uses default Python (3.13)
- Packages not available

### What to Do Instead (RIGHT):
```batch
@echo off
set PYTHON39=C:\Users\akhil\AppData\Local\Programs\Python\Python39\python.exe
%PYTHON39% ml_service.py
```

This is already done in `start-ml-service.bat` and `start-all-services.bat`

---

## ❌ Mistake #9: Expecting Models to Work Without Data

### What You Might Do (WRONG):
```cmd
curl -X POST http://localhost:5001/run/knn_demand_prediction
```

Expect results immediately

### Why It's Wrong:
- Database has 0 trips, 0 routes, 0 bookings
- Models need historical data to train
- Will return minimal/fallback results

### What to Do Instead (RIGHT):

**Check data first:**
```javascript
// In MongoDB or via Node.js API
db.trips.countDocuments()
db.routes.countDocuments()
db.bookings.countDocuments()
```

**If empty, populate with sample data first**

Models will work but with limited accuracy until real data is available.

---

## ❌ Mistake #10: Forgetting to Wait for ML Service to Start

### What You Might Do (WRONG):
```cmd
cd backend
start /B python ml_service.py
curl http://localhost:5001/health
```

Curl runs immediately and fails

### Why It's Wrong:
- ML service takes 2-3 seconds to start
- Curl runs before service is ready

### What to Do Instead (RIGHT):
```cmd
cd backend
start /B python ml_service.py
timeout /t 3 /nobreak
curl http://localhost:5001/health
```

This is already handled in `start-all-services.bat`

---

## ✅ Best Practices Checklist

When working with YATRIK ERP ML integration:

- [ ] Always use Python 3.9 for ML operations
- [ ] Use `start-ml-service.bat` instead of manual commands
- [ ] Check ML service health before running tests
- [ ] Keep ML service running in separate terminal
- [ ] Use port 5001 for ML, port 5000 for Node.js
- [ ] Have both `MONGO_URI` and `MONGODB_URI` in `.env`
- [ ] Run `test-ml-integration.bat` before starting work
- [ ] Check `where python` to see all Python installations
- [ ] Don't expect accurate predictions without data
- [ ] Wait 3 seconds after starting services

---

## 🔍 Quick Diagnostic Commands

**Check which Python is default:**
```cmd
where python
```

**Check if packages are installed in Python 3.9:**
```cmd
C:\Users\akhil\AppData\Local\Programs\Python\Python39\python.exe -c "import pandas, numpy, sklearn, seaborn; print('OK')"
```

**Check if ML service is running:**
```cmd
curl http://localhost:5001/health
```

**Check database data availability:**
```javascript
// Via mongo shell or Node.js
use yatrik_erp
db.trips.countDocuments()
db.bookings.countDocuments()
```

**Check port usage:**
```cmd
netstat -ano | findstr :5001
netstat -ano | findstr :5000
```

---

## 📖 Related Documentation

- **Quick Start:** `ML_INTEGRATION_QUICKSTART.md`
- **Troubleshooting:** `ML_INTEGRATION_TROUBLESHOOTING.md`
- **Status Report:** `ML_INTEGRATION_STATUS_REPORT.md`
- **Fix Summary:** `ML_FIX_SUMMARY.md`

---

## 💡 Pro Tips

1. **Create an alias** (if using PowerShell):
   ```powershell
   Set-Alias py39 C:\Users\akhil\AppData\Local\Programs\Python\Python39\python.exe
   ```
   Then use: `py39 ml_service.py`

2. **Add Python 3.9 to PATH first** (advanced):
   - Makes `python` point to 3.9 instead of 3.13
   - Not recommended if other projects need 3.13

3. **Use virtual environments** (advanced):
   ```cmd
   C:\Users\akhil\AppData\Local\Programs\Python\Python39\python.exe -m venv venv
   venv\Scripts\activate
   pip install -r ml_models\requirements.txt
   ```

4. **Always use batch files**:
   - `start-ml-service.bat` - Start ML only
   - `start-all-services.bat` - Start everything
   - `test-ml-integration.bat` - Test everything

---

**Remember:** When in doubt, use the batch files! They handle all the complexity for you.

---

**Last Updated:** 2025-10-20  
**Most Common Mistake:** Using `python` instead of Python 3.9  
**Easiest Solution:** Use `start-ml-service.bat`
