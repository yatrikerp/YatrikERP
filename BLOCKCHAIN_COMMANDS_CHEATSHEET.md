# 🎯 Blockchain Commands Cheatsheet

Quick reference for all blockchain commands.

---

## 📦 Installation

```bash
# Install blockchain tools
npm install ethers@6.9.0 @openzeppelin/contracts@5.0.0 hardhat@2.19.0 @nomicfoundation/hardhat-toolbox@4.0.0
```

---

## 👛 Wallet Commands

```bash
# Create new wallet
node -e "const ethers = require('ethers'); const wallet = ethers.Wallet.createRandom(); console.log('Address:', wallet.address); console.log('Private Key:', wallet.privateKey);"

# Check wallet balance (after server is running)
curl http://localhost:5000/api/blockchain/balance
```

---

## 🔧 Smart Contract Commands

```bash
# Compile contract
npx hardhat compile

# Deploy to Mumbai testnet
npx hardhat run scripts/deploy.js --network mumbai

# Deploy to Polygon mainnet (later)
npx hardhat run scripts/deploy.js --network polygon
```

---

## 🧪 Testing Commands

```bash
# Test blockchain service
node scripts/test-blockchain.js

# Test with curl (Windows)
curl -X POST http://localhost:5000/api/blockchain/issue-ticket ^
  -H "Content-Type: application/json" ^
  -H "Authorization: Bearer YOUR_TOKEN" ^
  -d "{\"bookingId\": \"TEST_123\"}"
```

---

## 📊 Monitoring Commands

```bash
# Get blockchain stats
curl http://localhost:5000/api/blockchain/stats

# Get wallet balance
curl http://localhost:5000/api/blockchain/balance

# Verify ticket
curl http://localhost:5000/api/blockchain/verify-ticket/1
```

---

## 🌐 Useful URLs

```bash
# Mumbai Faucet (get free test MATIC)
https://faucet.polygon.technology/

# PolygonScan Mumbai (view transactions)
https://mumbai.polygonscan.com/

# Check your wallet
https://mumbai.polygonscan.com/address/YOUR_WALLET_ADDRESS

# Check your contract
https://mumbai.polygonscan.com/address/YOUR_CONTRACT_ADDRESS

# Check transaction
https://mumbai.polygonscan.com/tx/YOUR_TRANSACTION_HASH
```

---

## 📝 Environment Variables

Add to `.env` file:

```env
# Blockchain Configuration
POLYGON_RPC_URL=https://rpc-mumbai.maticvigil.com
BLOCKCHAIN_PRIVATE_KEY=0x_your_private_key_here
TICKET_CONTRACT_ADDRESS=0x_your_contract_address_here
```

---

## 🔄 Server Commands

```bash
# Start server
npm start

# Or use your restart script
RESTART_SERVER.bat

# Check if blockchain initialized (look for this in logs)
✅ Blockchain service initialized
```

---

## 🎫 API Endpoints

### Issue Ticket
```bash
POST /api/blockchain/issue-ticket
Body: { "bookingId": "65abc123..." }
```

### Verify Ticket
```bash
GET /api/blockchain/verify-ticket/:tokenId
```

### Mark Ticket Used
```bash
POST /api/blockchain/use-ticket
Body: { "tokenId": "1" }
```

### Refund Ticket
```bash
POST /api/blockchain/refund-ticket
Body: { "tokenId": "1" }
```

### Get Ticket by Booking
```bash
GET /api/blockchain/ticket/:bookingId
```

### Get Stats
```bash
GET /api/blockchain/stats
```

### Get Balance
```bash
GET /api/blockchain/balance
```

---

## 🐛 Troubleshooting Commands

```bash
# Check if in correct directory
dir

# Check Node.js version
node --version

# Check npm version
npm --version

# Check if packages installed
npm list ethers

# Clear npm cache (if installation fails)
npm cache clean --force

# Reinstall packages
npm install
```

---

## 📋 Quick Setup Checklist

```bash
# 1. Install tools
npm install ethers@6.9.0 @openzeppelin/contracts@5.0.0 hardhat@2.19.0 @nomicfoundation/hardhat-toolbox@4.0.0

# 2. Create wallet
node -e "const ethers = require('ethers'); const wallet = ethers.Wallet.createRandom(); console.log('Address:', wallet.address); console.log('Private Key:', wallet.privateKey);"

# 3. Get test MATIC
# Go to: https://faucet.polygon.technology/

# 4. Update .env file
# Add: BLOCKCHAIN_PRIVATE_KEY=0x...

# 5. Compile contract
npx hardhat compile

# 6. Deploy contract
npx hardhat run scripts/deploy.js --network mumbai

# 7. Update .env with contract address
# Add: TICKET_CONTRACT_ADDRESS=0x...

# 8. Test
node scripts/test-blockchain.js

# 9. Start server
npm start
```

---

## 💰 Cost Reference

### Mumbai Testnet
- Everything: **FREE**
- Get MATIC from faucet

### Polygon Mainnet
- Issue ticket: ~0.001 MATIC (~$0.0008)
- Mark used: ~0.0005 MATIC (~$0.0004)
- Refund: ~0.0005 MATIC (~$0.0004)

---

## 🔐 Security Reminders

```bash
# ❌ NEVER commit .env to Git
# ❌ NEVER share private key
# ✅ Keep private key in .env only
# ✅ Add .env to .gitignore
```

---

## 📱 Integration Example

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
    console.log('Blockchain ticket:', result.data.tokenId);
} catch (error) {
    console.error('Blockchain failed:', error);
    // Booking still valid
}
```

---

## 🎯 Common Error Solutions

### "Insufficient funds"
```bash
# Get more MATIC from faucet
https://faucet.polygon.technology/
```

### "Contract not found"
```bash
# Check .env file
# Make sure TICKET_CONTRACT_ADDRESS is set
```

### "Private key error"
```bash
# Check .env file
# Make sure BLOCKCHAIN_PRIVATE_KEY starts with 0x
# No extra spaces
```

### "Network error"
```bash
# Check internet connection
# Try again in 1 minute
# Check RPC URL in .env
```

---

## 📚 File Locations

```
backend/
├── contracts/
│   └── BusTicket.sol              # Smart contract
├── services/
│   └── blockchainService.js       # Blockchain service
├── routes/
│   └── blockchain.js              # API routes
├── models/
│   └── BlockchainTicket.js        # Database model
├── scripts/
│   ├── deploy.js                  # Deployment script
│   └── test-blockchain.js         # Test script
├── examples/
│   └── booking-with-blockchain.js # Integration examples
├── hardhat.config.js              # Hardhat config
└── .env                           # Environment variables
```

---

## 🎉 Success Indicators

Look for these in your terminal:

```bash
✅ Blockchain service initialized
✅ Compiled 1 Solidity file successfully
✅ BusTicket deployed to: 0x...
✅ Transaction confirmed
✅ All tests passed!
```

---

**Keep this cheatsheet handy for quick reference!** 📌
