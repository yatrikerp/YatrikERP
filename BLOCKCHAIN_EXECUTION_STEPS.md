# 🚀 Blockchain Ticket System - Execution Steps

## Quick Start (15 Minutes)

Follow these steps exactly to get blockchain tickets working:

---

## ✅ Step 1: Install Dependencies (2 min)

Open terminal in `backend` folder:

```bash
cd backend
npm install ethers@^6.9.0 @openzeppelin/contracts@^5.0.0 hardhat@^2.19.0 @nomicfoundation/hardhat-toolbox@^4.0.0
```

Or run the batch file:
```bash
BLOCKCHAIN_QUICK_START.bat
```

---

## ✅ Step 2: Create Wallet (1 min)

Generate a new wallet for blockchain operations:

```bash
node -e "const ethers = require('ethers'); const wallet = ethers.Wallet.createRandom(); console.log('Address:', wallet.address); console.log('Private Key:', wallet.privateKey);"
```

**Save the output!** You'll need:
- Address: `0x...` (your wallet address)
- Private Key: `0x...` (keep this SECRET!)

---

## ✅ Step 3: Get Test MATIC (3 min)

1. Go to: https://faucet.polygon.technology/
2. Select "Mumbai" network
3. Paste your wallet address
4. Click "Submit"
5. Wait 1-2 minutes

You'll receive 0.5 test MATIC (free).

---

## ✅ Step 4: Configure Environment (1 min)

Add to your `backend/.env` file:

```env
# Blockchain Configuration
POLYGON_RPC_URL=https://rpc-mumbai.maticvigil.com
BLOCKCHAIN_PRIVATE_KEY=0x_paste_your_private_key_here
TICKET_CONTRACT_ADDRESS=
```

Replace `0x_paste_your_private_key_here` with your actual private key from Step 2.

---

## ✅ Step 5: Compile Contract (1 min)

```bash
cd backend
npx hardhat compile
```

Expected output:
```
Compiled 1 Solidity file successfully
```

---

## ✅ Step 6: Deploy Contract (2 min)

```bash
npx hardhat run scripts/deploy.js --network mumbai
```

Expected output:
```
🚀 Deploying BusTicket contract...
📍 Deploying with account: 0x...
💰 Account balance: 0.5 MATIC
✅ BusTicket deployed to: 0xABC123...
```

**Copy the contract address!**

---

## ✅ Step 7: Update Environment (1 min)

Add the contract address to `backend/.env`:

```env
TICKET_CONTRACT_ADDRESS=0xABC123_your_contract_address
```

---

## ✅ Step 8: Update Server (2 min)

Add to your `backend/server.js` (after MongoDB connection):

```javascript
// Initialize blockchain service
const blockchainService = require('./services/blockchainService');
blockchainService.initialize().catch(console.error);

// Add blockchain routes
const blockchainRoutes = require('./routes/blockchain');
app.use('/api/blockchain', blockchainRoutes);
```

---

## ✅ Step 9: Test the System (2 min)

```bash
node scripts/test-blockchain.js
```

Expected output:
```
🧪 Testing Blockchain Service
💰 Balance: 0.5 MATIC
🎫 Testing ticket issuance...
✅ Ticket issued: { tokenId: '1', transactionHash: '0x...' }
✅ All tests passed!
```

---

## ✅ Step 10: Restart Server

```bash
npm start
```

Or use your existing restart script.

---

## 🎯 Test API Endpoints

### Test 1: Issue Ticket

```bash
curl -X POST http://localhost:5000/api/blockchain/issue-ticket \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{"bookingId": "YOUR_BOOKING_ID"}'
```

### Test 2: Verify Ticket

```bash
curl http://localhost:5000/api/blockchain/verify-ticket/1
```

### Test 3: Get Stats

```bash
curl http://localhost:5000/api/blockchain/stats \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

## 🔗 Integration with Existing Code

### Option A: Automatic (Recommended)

Modify your booking creation endpoint to automatically issue blockchain tickets:

```javascript
// In your booking controller
const booking = await Booking.create(bookingData);

// Auto-issue blockchain ticket
if (process.env.TICKET_CONTRACT_ADDRESS) {
    try {
        await fetch('http://localhost:5000/api/blockchain/issue-ticket', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': req.headers.authorization
            },
            body: JSON.stringify({ bookingId: booking._id })
        });
    } catch (error) {
        console.error('Blockchain ticket failed:', error);
        // Continue - booking is still valid
    }
}
```

### Option B: Manual

Add a button in your admin panel to issue blockchain tickets for existing bookings.

---

## 📊 Monitor Your Blockchain Activity

### View on PolygonScan
```
https://mumbai.polygonscan.com/address/YOUR_CONTRACT_ADDRESS
```

### Check Wallet Balance
```bash
curl http://localhost:5000/api/blockchain/balance
```

### View All Tickets
```bash
curl http://localhost:5000/api/blockchain/stats
```

---

## 🎉 Success Checklist

- [ ] Dependencies installed
- [ ] Wallet created and funded
- [ ] Contract compiled
- [ ] Contract deployed
- [ ] Environment configured
- [ ] Server updated
- [ ] Test passed
- [ ] API endpoints working

---

## 🚨 Common Issues

### "Insufficient funds"
**Solution**: Get more MATIC from faucet

### "Contract not found"
**Solution**: Check TICKET_CONTRACT_ADDRESS in .env

### "Private key error"
**Solution**: Ensure private key starts with 0x

### "Network error"
**Solution**: Check internet connection and RPC URL

---

## 💰 Cost Per Ticket

**Mumbai Testnet**: FREE (test MATIC)
**Polygon Mainnet**: ~$0.001 per ticket

---

## 📈 What You Get

✅ Immutable ticket records
✅ Fraud prevention
✅ Transparent verification
✅ Automatic refunds via smart contracts
✅ Cross-platform compatibility
✅ Audit trail for compliance

---

## 🎯 Next Steps

1. Test with real bookings
2. Add QR code with tokenId
3. Integrate with conductor app
4. Add analytics dashboard
5. Deploy to mainnet (when ready)

---

**You're now running blockchain-based ticketing!** 🚀

Need help? Check `BLOCKCHAIN_SETUP_GUIDE.md` for detailed documentation.
