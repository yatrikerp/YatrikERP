# Google Colab Quick Reference Card

## 🚀 5-Minute Quick Start

### 1. Collect Data (Local Machine)
```bash
cd backend
node ml-research/collect_training_data.js
```

### 2. Open Colab
Go to: https://colab.research.google.com/

### 3. Upload Script
- File → Upload notebook
- Select: `backend/ml-research/colab_demand_prediction.py`

### 4. Enable GPU
- Runtime → Change runtime type → GPU (T4)

### 5. Run All
- Runtime → Run all
- Upload `demand_training_data.json` when prompted

### 6. Wait 20-30 minutes ☕

### 7. Download Results
- `demand_lstm_model.h5`
- `demand_scaler.pkl`
- `feature_columns.json`
- `training_report.json`

---

## 📊 Expected Results

```
MAE:  3-5 passengers
RMSE: 5-8 passengers
MAPE: 10-15%
R²:   0.85-0.92
```

---

## 🔧 Keyboard Shortcuts

| Action | Shortcut |
|--------|----------|
| Run cell | Ctrl+Enter |
| Run cell and move to next | Shift+Enter |
| Insert cell above | Ctrl+M A |
| Insert cell below | Ctrl+M B |
| Delete cell | Ctrl+M D |
| Interrupt execution | Ctrl+M I |

---

## 🆘 Quick Fixes

### GPU Not Working
```python
# Run this to check:
import tensorflow as tf
print(tf.config.list_physical_devices('GPU'))

# If empty [], go to:
# Runtime → Change runtime type → GPU
```

### Out of Memory
```python
# Reduce batch size in Cell 8:
batch_size=16  # Instead of 32
```

### Poor Performance
```python
# Try longer sequence in Cell 6:
SEQUENCE_LENGTH = 14  # Instead of 7
```

### Training Too Slow
```python
# Reduce epochs in Cell 8:
epochs=50  # Instead of 100
```

---

## 📁 Files You'll Get

1. **demand_lstm_model.h5** (5-10 MB)
   - Your trained LSTM model
   - Use for predictions

2. **demand_scaler.pkl** (< 1 MB)
   - Data normalization scaler
   - Required for preprocessing

3. **feature_columns.json** (< 1 KB)
   - List of features used
   - For consistency

4. **training_report.json** (< 1 KB)
   - Performance metrics
   - For documentation

---

## 🎯 Success Criteria

✅ MAE < 5 passengers
✅ RMSE < 8 passengers  
✅ MAPE < 15%
✅ R² > 0.85

If all pass → Deploy to production!

---

## 📞 Support

- Full Guide: `GOOGLE_COLAB_TRAINING_GUIDE.md`
- ML Roadmap: `ML_RESEARCH_ROADMAP.md`
- Quick Start: `ML_QUICK_START.md`

---

**Time Required**: 45 minutes total
**Cost**: FREE (with Google account)
**Difficulty**: ⭐⭐ Easy
