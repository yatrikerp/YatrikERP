# 📸 Blockchain Visual Guide

This guide shows you what to expect at each step with descriptions of what you'll see.

---

## 🖥️ Step 1: Open Terminal

### What to do:
Press `Windows + R`, type `cmd`, press Enter

### What you'll see:
```
Microsoft Windows [Version 10.0.19045.3803]
(c) Microsoft Corporation. All rights reserved.

C:\Users\YourName>
```

### Navigate to backend:
```bash
cd C:\path\to\your\project\backend
```

### Verify location:
```bash
dir
```

### What you'll see:
```
Directory of C:\...\backend

03/05/2026  10:30 AM    <DIR>          models
03/05/2026  10:30 AM    <DIR>          routes
03/05/2026  10:30 AM    <DIR>          services
03/05/2026  10:30 AM    <DIR>          controllers
03/05/2026  10:30 AM             1,234 server.js
03/05/2026  10:30 AM               567 package.json
```

✅ You're in the right place!

---

## 📦 Step 2: Install Packages

### Command:
```bash
npm install ethers@6.9.0 @openzeppelin/contracts@5.0.0 hardhat@2.19.0 @nomicfoundation/hardhat-toolbox@4.0.0
```

### What you'll see (takes 2-3 minutes):
```
npm WARN deprecated ...
npm WARN deprecated ...

added 234 packages, and audited 567 packages in 2m

45 packages are looking for funding
  run `npm fund` for details

found 0 vulnerabilities
```

✅ Success! Packages installed.

---

## 👛 Step 3: Create Wallet

### Command:
```bash
node -e "const ethers = require('ethers'); const wallet = ethers.Wallet.createRandom(); console.log('=== YOUR WALLET ==='); console.log('Address:', wallet.address); console.log('Private Key:', wallet.privateKey); console.log('===================');"
```

### What you'll see:
```
=== YOUR WALLET ===
Address: 0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb
Private Key: 0x8da4ef21b864d2cc526dbdb2a120bd2874c36c9d0a1fb7f8c63d7f7a8b41de8f
===================
```

### 📝 SAVE THIS!
Open Notepad and save:
```
My Blockchain Wallet
====================
Address: 0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb
Private Key: 0x8da4ef21b864d2cc526dbdb2a120bd2874c36c9d0a1fb7f8c63d7f7a8b41de8f
Date: March 5, 2026
```

Save as: `my-blockchain-wallet.txt`

⚠️ Keep this file safe! Never share the private key!

---

## 💰 Step 4: Get Test MATIC

### 4.1: Open Browser
Go to: `https://faucet.polygon.technology/`

### What you'll see:
```
┌─────────────────────────────────────┐
│   Polygon Faucet                    │
│                                     │
│   Network: [Mumbai ▼]              │
│                                     │
│   Wallet Address:                   │
│   [_________________________]       │
│                                     │
│   [ Submit ]                        │
└─────────────────────────────────────┘
```

### 4.2: Select Mumbai
Click the dropdown, select "Mumbai"

### 4.3: Paste Address
Paste your wallet address from Step 3

### 4.4: Complete Captcha
Check "I'm not a robot"

### 4.5: Click Submit

### What you'll see:
```
✅ Success!
0.5 MATIC sent to 0x742d35Cc...
Transaction: 0x8f3b2a1c...

Check your balance on PolygonScan
```

### 4.6: Verify (Optional)
Click the PolygonScan link to see your transaction

### What you'll see on PolygonScan:
```
Transaction Details
Status: ✅ Success
From: Polygon Faucet
To: 0x742d35Cc... (Your Address)
Value: 0.5 MATIC
```

✅ You have test money!

---

## ⚙️ Step 5: Configure Environment

### 5.1: Open .env file
In your backend folder, open `.env` file with Notepad

### What you'll see:
```
PORT=5000
MONGODB_URI=mongodb://localhost:27017/busdb
JWT_SECRET=your_secret_key
# ... other variables
```

### 5.2: Add at the bottom:
```env

# Blockchain Configuration
POLYGON_RPC_URL=https://rpc-mumbai.maticvigil.com
BLOCKCHAIN_PRIVATE_KEY=0x8da4ef21b864d2cc526dbdb2a120bd2874c36c9d0a1fb7f8c63d7f7a8b41de8f
TICKET_CONTRACT_ADDRESS=
```

Replace the private key with YOUR private key from Step 3!

### 5.3: Save file
Press `Ctrl + S`

✅ Environment configured!

---

## 🔨 Step 6: Compile Contract

### Command:
```bash
npx hardhat compile
```

### What you'll see:
```
Downloading compiler 0.8.19
Compiling 1 file with 0.8.19
Compilation finished successfully
Compiled 1 Solidity file successfully
```

### Files created:
```
backend/
├── artifacts/
│   └── contracts/
│       └── BusTicket.sol/
│           └── BusTicket.json
└── cache/
    └── solidity-files-cache.json
```

✅ Contract compiled!

---

## 🚀 Step 7: Deploy Contract

### Command:
```bash
npx hardhat run scripts/deploy.js --network mumbai
```

### What you'll see (takes 30-60 seconds):
```
🚀 Deploying BusTicket contract...
📍 Deploying with account: 0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb
💰 Account balance: 0.5 MATIC

Deploying contract...
Waiting for confirmation...

✅ BusTicket deployed to: 0xABC123456789ABCDEF123456789ABCDEF1234567
📄 Contract ABI saved to contracts/BusTicket.json

⚠️  Add this to your .env file:
TICKET_CONTRACT_ADDRESS=0xABC123456789ABCDEF123456789ABCDEF1234567

🔍 Verify on PolygonScan:
https://mumbai.polygonscan.com/address/0xABC123456789ABCDEF123456789ABCDEF1234567
```

### 7.1: Copy contract address
Copy: `0xABC123456789ABCDEF123456789ABCDEF1234567`

### 7.2: Update .env
Open `.env` again and update:
```env
TICKET_CONTRACT_ADDRESS=0xABC123456789ABCDEF123456789ABCDEF1234567
```

### 7.3: Save file
Press `Ctrl + S`

✅ Contract deployed!

---

## 🧪 Step 8: Test System

### Command:
```bash
node scripts/test-blockchain.js
```

### What you'll see:
```
🧪 Testing Blockchain Service

Initializing blockchain service...
✅ Blockchain service initialized
📍 Network: { name: 'maticmum', chainId: 80001 }
💼 Wallet: 0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb

💰 Checking wallet balance...
Balance: 0.499 MATIC

🎫 Testing ticket issuance...
Issuing ticket for booking: TEST_1709636400000
⏳ Transaction sent: 0x8f3b2a1c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c3d4e5f6a7b8c9d0e1f2
Waiting for confirmation...
✅ Transaction confirmed: 0x8f3b2a1c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c3d4e5f6a7b8c9d0e1f2

✅ Ticket issued: {
  success: true,
  transactionHash: '0x8f3b2a1c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c3d4e5f6a7b8c9d0e1f2',
  tokenId: '1',
  blockNumber: 12345678,
  gasUsed: '123456'
}

Token ID: 1
Transaction: https://mumbai.polygonscan.com/tx/0x8f3b2a1c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c3d4e5f6a7b8c9d0e1f2

🔍 Verifying ticket...
✅ Ticket verified: {
  isValid: true,
  ticket: {
    bookingId: 'TEST_1709636400000',
    routeId: 'ROUTE_001',
    passengerName: 'Test Passenger',
    fare: '0.001',
    issueDate: 2026-03-05T10:30:00.000Z,
    travelDate: 2026-03-05T10:30:00.000Z,
    isUsed: false,
    isRefunded: false
  }
}

✅ All tests passed!
```

✅ System working!

---

## 🌐 Step 9: View on PolygonScan

### 9.1: Copy transaction link
From test output, copy the link:
```
https://mumbai.polygonscan.com/tx/0x8f3b2a1c...
```

### 9.2: Open in browser

### What you'll see:
```
┌─────────────────────────────────────────────────┐
│ Transaction Details                             │
├─────────────────────────────────────────────────┤
│ Transaction Hash:                               │
│ 0x8f3b2a1c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a... │
│                                                 │
│ Status: ✅ Success                              │
│ Block: 12345678                                 │
│ Timestamp: 2 mins ago                           │
│                                                 │
│ From: 0x742d35Cc... (Your Wallet)              │
│ To: 0xABC12345... (BusTicket Contract)         │
│                                                 │
│ Value: 0 MATIC                                  │
│ Transaction Fee: 0.000123 MATIC                 │
│                                                 │
│ Input Data: [Function: issueTicket]            │
└─────────────────────────────────────────────────┘
```

🎉 Your transaction is on the blockchain!

---

## 🖥️ Step 10: Start Server

### Command:
```bash
npm start
```

### What you'll see:
```
> backend@1.0.0 start
> node server.js

Server running on port 5000
MongoDB connected successfully
✅ Blockchain service initialized
📍 Network: { name: 'maticmum', chainId: 80001 }
💼 Wallet: 0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb
```

✅ Server running with blockchain!

---

## 🎫 Step 11: Issue Real Ticket

### Open new terminal (keep server running)

### Command:
```bash
curl -X POST http://localhost:5000/api/blockchain/issue-ticket ^
  -H "Content-Type: application/json" ^
  -H "Authorization: Bearer YOUR_AUTH_TOKEN" ^
  -d "{\"bookingId\": \"65abc123def456789\"}"
```

### What you'll see:
```json
{
  "success": true,
  "message": "Blockchain ticket issued successfully",
  "data": {
    "tokenId": "2",
    "transactionHash": "0x9a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b",
    "blockNumber": 12345679,
    "explorerUrl": "https://mumbai.polygonscan.com/tx/0x9a1b2c3d..."
  }
}
```

✅ Real ticket issued on blockchain!

---

## 📊 Step 12: Check Stats

### Command:
```bash
curl http://localhost:5000/api/blockchain/stats
```

### What you'll see:
```json
{
  "success": true,
  "data": {
    "totalTickets": 2,
    "byStatus": [
      { "_id": "issued", "count": 2 }
    ],
    "contractAddress": "0xABC123456789ABCDEF123456789ABCDEF1234567"
  }
}
```

✅ You can see all your blockchain tickets!

---

## 🎉 Success Indicators

Throughout the process, look for these:

### ✅ Green Checkmarks
```
✅ Blockchain service initialized
✅ Compiled successfully
✅ Deployed to: 0x...
✅ Transaction confirmed
✅ All tests passed
```

### 📍 Location Info
```
📍 Network: maticmum
📍 Deploying with account: 0x...
```

### 💰 Balance Info
```
💰 Account balance: 0.5 MATIC
```

### 🎫 Ticket Info
```
🎫 Testing ticket issuance...
Token ID: 1
```

---

## ❌ Error Indicators

If you see these, check the troubleshooting section:

### ❌ Red X or Error
```
❌ Blockchain initialization failed
❌ Insufficient funds
❌ Contract not found
```

### ⚠️ Warnings (Usually OK)
```
⚠️ npm WARN deprecated
⚠️ Add this to your .env file
```

---

## 🎯 Final Checklist

After completing all steps, verify:

- [ ] Terminal shows: `✅ Blockchain service initialized`
- [ ] You have a wallet address saved
- [ ] You have test MATIC in wallet
- [ ] Contract is deployed (you have contract address)
- [ ] Test script passed
- [ ] Server is running
- [ ] You can issue tickets via API
- [ ] You can see transactions on PolygonScan

**All checked?** You're done! 🎉

---

## 📸 What Your Ticket Looks Like

### In Your Database:
```json
{
  "_id": "65abc123def456789",
  "bookingId": "65abc123def456789",
  "tokenId": "2",
  "transactionHash": "0x9a1b2c3d...",
  "blockNumber": 12345679,
  "status": "issued",
  "metadata": {
    "routeId": "ROUTE_001",
    "passengerName": "John Doe",
    "fare": 5000,
    "travelDate": "2026-03-10"
  }
}
```

### On Blockchain:
```
Token ID: 2
Owner: 0x742d35Cc...
Booking ID: 65abc123def456789
Route: ROUTE_001
Fare: 0.05 MATIC
Status: Not Used
Immutable: ✅
```

### For Passenger (QR Code):
```
┌─────────────────────┐
│  ████████████████   │
│  ██  ██████  ████   │
│  ██  ██████  ████   │
│  ████████████████   │
│                     │
│  Token ID: 2        │
│  Kochi → Trivandrum │
│  ₹50.00             │
│                     │
│  Blockchain Verified│
└─────────────────────┘
```

---

## 🎊 Congratulations!

You now have:
- ✅ Working blockchain system
- ✅ Fraud-proof tickets
- ✅ Transparent verification
- ✅ Immutable records
- ✅ Real-time confirmation

**Welcome to Web3!** 🚀

---

**Next:** Read `BLOCKCHAIN_INTEGRATION_GUIDE.md` to connect this with your booking system.
