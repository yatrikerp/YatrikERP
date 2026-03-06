# 🔗 Blockchain Ticket System - Setup Guide

## Overview
This guide will help you set up blockchain-based ticket issuance for your Kerala bus system using Polygon (low gas fees).

## 📋 Prerequisites

1. Node.js installed
2. Basic understanding of blockchain
3. Polygon Mumbai testnet MATIC (free from faucet)

---

## 🚀 Step-by-Step Setup

### Step 1: Install Dependencies

```bash
cd backend
npm install ethers@^6.9.0 @openzeppelin/contracts@^5.0.0 hardhat@^2.19.0 @nomicfoundation/hardhat-toolbox@^4.0.0
```

### Step 2: Create Wallet

You need a wallet to deploy contracts and issue tickets.

**Option A: Create New Wallet**
```bash
node -e "const ethers = require('ethers'); const wallet = ethers.Wallet.createRandom(); console.log('Address:', wallet.address); console.log('Private Key:', wallet.privateKey);"
```

**Option B: Use Existing MetaMask Wallet**
- Export private key from MetaMask (Settings > Security & Privacy > Reveal Private Key)

⚠️ **IMPORTANT**: Never share your private key! Keep it secure!

### Step 3: Get Test MATIC

1. Go to [Polygon Mumbai Faucet](https://faucet.polygon.technology/)
2. Enter your wallet address
3. Request test MATIC (free)
4. Wait 1-2 minutes for confirmation

### Step 4: Configure Environment

Add to your `backend/.env` file:

```env
# Blockchain Configuration
POLYGON_RPC_URL=https://rpc-mumbai.maticvigil.com
BLOCKCHAIN_PRIVATE_KEY=your_private_key_here
TICKET_CONTRACT_ADDRESS=will_be_set_after_deployment
```

### Step 5: Compile Smart Contract

```bash
cd backend
npx hardhat compile
```

Expected output:
```
✓ Compiled 1 Solidity file successfully
```

### Step 6: Deploy Contract

```bash
npx hardhat run scripts/deploy.js --network mumbai
```

Expected output:
```
🚀 Deploying BusTicket contract...
📍 Deploying with account: 0x...
💰 Account balance: 0.5 MATIC
✅ BusTicket deployed to: 0x...
📄 Contract ABI saved
```

Copy the contract address and add it to `.env`:
```env
TICKET_CONTRACT_ADDRESS=0x_your_contract_address_here
```

### Step 7: Initialize Blockchain Service

Add to your `backend/server.js` (or main file):

```javascript
const blockchainService = require('./services/blockchainService');

// After MongoDB connection
blockchainService.initialize().catch(console.error);

// Add blockchain routes
const blockchainRoutes = require('./routes/blockchain');
app.use('/api/blockchain', blockchainRoutes);
```

### Step 8: Update Booking Model

Add blockchain reference to your Booking model:

```javascript
// In backend/models/Booking.js
blockchainTicketId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'BlockchainTicket',
    default: null
}
```

### Step 9: Test the System

```bash
node scripts/test-blockchain.js
```

Expected output:
```
🧪 Testing Blockchain Service
💰 Balance: 0.5 MATIC
🎫 Testing ticket issuance...
✅ Ticket issued
✅ All tests passed!
```

---

## 🎯 API Endpoints

### Issue Blockchain Ticket
```http
POST /api/blockchain/issue-ticket
Authorization: Bearer <token>
Content-Type: application/json

{
  "bookingId": "65abc123..."
}
```

Response:
```json
{
  "success": true,
  "message": "Blockchain ticket issued successfully",
  "data": {
    "tokenId": "1",
    "transactionHash": "0x...",
    "blockNumber": 12345,
    "explorerUrl": "https://mumbai.polygonscan.com/tx/0x..."
  }
}
```

### Verify Ticket
```http
GET /api/blockchain/verify-ticket/:tokenId
```

### Mark Ticket as Used
```http
POST /api/blockchain/use-ticket
Content-Type: application/json

{
  "tokenId": "1"
}
```

### Refund Ticket
```http
POST /api/blockchain/refund-ticket
Content-Type: application/json

{
  "tokenId": "1"
}
```

### Get Blockchain Stats
```http
GET /api/blockchain/stats
```

---

## 🔄 Integration Flow

### When Passenger Books Ticket:

1. **Normal booking flow** (existing code)
2. **After successful payment**, call blockchain API:

```javascript
// In your booking controller
const booking = await Booking.create(bookingData);

// Issue blockchain ticket
try {
    const response = await fetch('http://localhost:5000/api/blockchain/issue-ticket', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ bookingId: booking._id })
    });
    
    const result = await response.json();
    console.log('Blockchain ticket issued:', result.data.tokenId);
} catch (error) {
    console.error('Blockchain issuance failed:', error);
    // Booking still valid, blockchain is optional
}
```

### When Conductor Scans Ticket:

```javascript
// Verify on blockchain
const response = await fetch(`http://localhost:5000/api/blockchain/verify-ticket/${tokenId}`);
const result = await response.json();

if (result.data.isValid) {
    // Mark as used
    await fetch('http://localhost:5000/api/blockchain/use-ticket', {
        method: 'POST',
        body: JSON.stringify({ tokenId })
    });
}
```

---

## 💰 Cost Estimation

### Polygon Mumbai (Testnet)
- Free MATIC from faucet
- Perfect for testing

### Polygon Mainnet (Production)
- Issue ticket: ~0.001 MATIC (~$0.0008)
- Mark used: ~0.0005 MATIC (~$0.0004)
- Refund: ~0.0005 MATIC (~$0.0004)

**For 1000 tickets/day**: ~$0.80/day or ~$24/month

---

## 🔍 Monitoring

### Check Transaction on PolygonScan
```
https://mumbai.polygonscan.com/tx/<transaction_hash>
```

### Check Contract
```
https://mumbai.polygonscan.com/address/<contract_address>
```

### Check Wallet Balance
```bash
curl http://localhost:5000/api/blockchain/balance
```

---

## 🚨 Troubleshooting

### "Insufficient funds"
- Get more test MATIC from faucet
- Check wallet balance

### "Contract not deployed"
- Run deployment script again
- Verify TICKET_CONTRACT_ADDRESS in .env

### "Transaction failed"
- Check gas price
- Verify network connection
- Check wallet has MATIC

### "Private key error"
- Ensure private key starts with 0x
- Check .env file is loaded
- Verify key is valid

---

## 🔐 Security Best Practices

1. **Never commit private keys** to Git
2. **Use environment variables** for sensitive data
3. **Rotate keys regularly** in production
4. **Use hardware wallet** for mainnet
5. **Implement rate limiting** on API endpoints
6. **Monitor wallet balance** and set alerts

---

## 📈 Next Steps

1. ✅ Test on Mumbai testnet
2. ✅ Integrate with booking flow
3. ✅ Add QR code with tokenId
4. ⬜ Deploy to Polygon mainnet
5. ⬜ Add passenger wallet support
6. ⬜ Implement ticket transfers
7. ⬜ Add analytics dashboard

---

## 🎉 Benefits

✅ **Immutable Records**: Tickets can't be forged or duplicated
✅ **Transparent**: All transactions visible on blockchain
✅ **Verifiable**: Anyone can verify ticket authenticity
✅ **Low Cost**: ~$0.001 per ticket on Polygon
✅ **Fast**: Transactions confirm in 2-3 seconds
✅ **Decentralized**: No single point of failure

---

## 📞 Support

- Polygon Docs: https://docs.polygon.technology/
- Hardhat Docs: https://hardhat.org/docs
- Ethers.js Docs: https://docs.ethers.org/

---

**Ready to revolutionize bus ticketing with blockchain!** 🚀
