# ⚡ Blockchain Quick Test Guide

## Test Your Blockchain Integration in 5 Minutes!

---

## ✅ Prerequisites

- [ ] Backend server running
- [ ] Blockchain setup complete (wallet, contract deployed)
- [ ] Frontend running

---

## 🚀 Quick Test Steps

### Step 1: Check Server Started (30 seconds)

Look for these lines in your terminal:

```bash
✅ Connected to Atlas MongoDB successfully
✅ Blockchain service initialized
📍 Network: { name: 'maticmum', chainId: 80001 }
💼 Wallet: 0x742d35Cc...
✅ Server running on port 5000
```

✅ If you see these, blockchain is ready!

❌ If not, check:
- .env has BLOCKCHAIN_PRIVATE_KEY
- .env has TICKET_CONTRACT_ADDRESS
- Restart server

---

### Step 2: Test API Directly (1 minute)

Open a new terminal and run:

```bash
# Test blockchain stats
curl http://localhost:5000/api/blockchain/stats
```

**Expected output:**
```json
{
  "success": true,
  "data": {
    "totalTickets": 0,
    "byStatus": [],
    "contractAddress": "0xABC123..."
  }
}
```

✅ If you see this, API is working!

---

### Step 3: Create Test Booking (2 minutes)

#### Option A: Use Your Booking Form
1. Go to booking page
2. Select route, date, seats
3. Complete payment
4. Note the PNR (e.g., BK12345)

#### Option B: Use API
```bash
curl -X POST http://localhost:5000/api/booking/confirm \
  -H "Content-Type: application/json" \
  -d '{"bookingId": "TEST_BK12345", "paymentStatus": "completed"}'
```

**Look for in response:**
```json
{
  "success": true,
  "data": {
    "ticket": {
      "blockchain": {
        "tokenId": "1",
        "transactionHash": "0x...",
        "explorerUrl": "https://mumbai.polygonscan.com/tx/0x..."
      }
    }
  }
}
```

✅ If you see `blockchain` object, ticket was issued on blockchain!

---

### Step 4: View Ticket (1 minute)

Open browser:
```
http://localhost:3000/passenger/ticket/BK12345
```
(Replace BK12345 with your PNR)

**What to look for:**

```
┌─────────────────────────────────────┐
│  🛡️ Blockchain Verified             │
│  ✓ Token ID: 1                      │
│  [View on PolygonScan →]            │
└─────────────────────────────────────┘
```

✅ If you see the blue blockchain badge, it's working!

---

### Step 5: Verify on Blockchain (30 seconds)

Click the "View on PolygonScan" link

**What you'll see:**
- Transaction details
- Status: Success
- Your ticket data
- Permanent blockchain record

✅ If you see the transaction, your ticket is on blockchain!

---

## 🎯 Quick Verification Checklist

After testing, verify:

- [ ] Server logs show "Blockchain ticket issued"
- [ ] API response has blockchain object
- [ ] Ticket page shows blockchain badge
- [ ] Token ID is displayed
- [ ] PolygonScan link works
- [ ] Transaction visible on PolygonScan

**All checked?** Blockchain is working! 🎉

---

## 🐛 Quick Troubleshooting

### Issue: "Blockchain service not initialized"

**Fix:**
```bash
# Check .env file
cat backend/.env | grep BLOCKCHAIN

# Should see:
# BLOCKCHAIN_PRIVATE_KEY=0x...
# TICKET_CONTRACT_ADDRESS=0x...

# If missing, add them and restart server
```

### Issue: "Blockchain object not in response"

**Check server logs:**
```bash
# Look for:
⚠️ Blockchain ticket issuance failed: ...

# Common causes:
# - No MATIC in wallet
# - Wrong contract address
# - Network error
```

**Fix:**
```bash
# Check wallet balance
curl http://localhost:5000/api/blockchain/balance

# Should show: { "balance": "0.5" }
# If 0, get more from faucet
```

### Issue: "Badge not showing on ticket page"

**Check:**
1. API response has blockchain object
2. React component imported correctly
3. Browser console for errors

**Quick fix:**
```bash
# Restart frontend
cd frontend
npm start
```

---

## 📊 Expected Results

### Server Console:
```
🎫 Issuing ticket for booking: BK12345
⏳ Transaction sent: 0x8f3b2a...
✅ Transaction confirmed
✅ Blockchain ticket issued: 1
```

### API Response:
```json
{
  "blockchain": {
    "tokenId": "1",
    "transactionHash": "0x8f3b2a...",
    "explorerUrl": "https://mumbai.polygonscan.com/tx/0x..."
  }
}
```

### Ticket Page:
- Blue blockchain badge
- Token ID displayed
- PolygonScan link

### PolygonScan:
- Transaction found
- Status: Success
- Ticket data visible

---

## 🎉 Success!

If all steps passed, your blockchain ticketing is working!

**What you achieved:**
- ✅ Tickets issued on blockchain
- ✅ Fraud-proof verification
- ✅ Immutable records
- ✅ Transparent operations
- ✅ Beautiful UI display

---

## 📈 Next Steps

### 1. Test Full Flow
- Book ticket through UI
- Complete payment
- View ticket
- Verify on blockchain

### 2. Test Conductor Verification
```bash
# Verify ticket
curl http://localhost:5000/api/blockchain/verify-ticket/1

# Mark as used
curl -X POST http://localhost:5000/api/blockchain/use-ticket \
  -H "Content-Type: application/json" \
  -d '{"tokenId": "1"}'
```

### 3. Monitor Statistics
```bash
# Check stats
curl http://localhost:5000/api/blockchain/stats

# Check balance
curl http://localhost:5000/api/blockchain/balance
```

### 4. View All Transactions
```
https://mumbai.polygonscan.com/address/YOUR_CONTRACT_ADDRESS
```

---

## 💡 Pro Tips

### Tip 1: Test Mode
Use Mumbai testnet for unlimited free testing

### Tip 2: Monitor Logs
Keep server terminal open to see blockchain activity

### Tip 3: Check PolygonScan
Bookmark your contract address for easy access

### Tip 4: Save Test PNRs
Keep a list of test bookings for quick testing

### Tip 5: Use Postman
Create API collection for easy testing

---

## 🔗 Quick Links

### Your Resources:
```
Server: http://localhost:5000
Frontend: http://localhost:3000
API Docs: http://localhost:5000/api/health
```

### Blockchain:
```
Faucet: https://faucet.polygon.technology/
PolygonScan: https://mumbai.polygonscan.com/
Your Contract: https://mumbai.polygonscan.com/address/YOUR_ADDRESS
```

### Documentation:
```
Setup: BLOCKCHAIN_STEP_BY_STEP_TUTORIAL.md
Integration: BLOCKCHAIN_INTEGRATION_COMPLETE.md
Results: WHERE_TO_SEE_BLOCKCHAIN_RESULTS.md
```

---

## ⏱️ Time Breakdown

- Server check: 30 seconds
- API test: 1 minute
- Create booking: 2 minutes
- View ticket: 1 minute
- Verify blockchain: 30 seconds

**Total: 5 minutes** ⚡

---

## 🎊 You're Done!

Your blockchain ticketing system is live and working!

**Test it now:**
1. Create a booking
2. View the ticket
3. See the blockchain badge
4. Click PolygonScan link
5. Celebrate! 🎉

---

**Questions?** Check the troubleshooting section or documentation files.

**Ready for production?** Follow BLOCKCHAIN_SETUP_GUIDE.md to move to Polygon mainnet.

**Happy blockchain ticketing!** 🚀🔗
