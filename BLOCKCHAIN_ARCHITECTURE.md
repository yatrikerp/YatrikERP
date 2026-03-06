# 🏗️ Blockchain Ticket System - Architecture

## System Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                    PASSENGER BOOKS TICKET                        │
│                   (Flutter App / Web App)                        │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│                    BACKEND API (Node.js)                         │
│                   http://localhost:5000                          │
├─────────────────────────────────────────────────────────────────┤
│  1. Create Booking (MongoDB)                                     │
│  2. Process Payment                                              │
│  3. Issue Blockchain Ticket                                      │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│              BLOCKCHAIN SERVICE (blockchainService.js)           │
├─────────────────────────────────────────────────────────────────┤
│  - Connect to Polygon Network                                    │
│  - Sign transaction with wallet                                  │
│  - Call smart contract                                           │
│  - Wait for confirmation                                         │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│                 POLYGON BLOCKCHAIN (Mumbai/Mainnet)              │
├─────────────────────────────────────────────────────────────────┤
│  Smart Contract: BusTicket.sol                                   │
│  - Mint NFT ticket                                               │
│  - Store ticket data                                             │
│  - Emit TicketIssued event                                       │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│                    TRANSACTION CONFIRMED                         │
│                   (2-3 seconds on Polygon)                       │
├─────────────────────────────────────────────────────────────────┤
│  Returns:                                                        │
│  - Token ID (unique ticket number)                               │
│  - Transaction Hash                                              │
│  - Block Number                                                  │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│              SAVE TO DATABASE (MongoDB)                          │
├─────────────────────────────────────────────────────────────────┤
│  BlockchainTicket Collection:                                    │
│  - bookingId                                                     │
│  - tokenId                                                       │
│  - transactionHash                                               │
│  - status (issued/used/refunded)                                 │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│                  GENERATE QR CODE                                │
│              (Contains tokenId + bookingId)                      │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│                  PASSENGER RECEIVES TICKET                       │
│              (QR Code + Blockchain Proof)                        │
└─────────────────────────────────────────────────────────────────┘
```

---

## Ticket Verification Flow

```
┌─────────────────────────────────────────────────────────────────┐
│              CONDUCTOR SCANS QR CODE                             │
│                   (Conductor App)                                │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│              EXTRACT TOKEN ID FROM QR                            │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│         VERIFY TICKET ON BLOCKCHAIN                              │
│    GET /api/blockchain/verify-ticket/:tokenId                    │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│              BLOCKCHAIN SERVICE CHECKS:                          │
│  ✓ Ticket exists                                                 │
│  ✓ Not already used                                              │
│  ✓ Not refunded                                                  │
│  ✓ Valid for travel date                                         │
└────────────────────────┬────────────────────────────────────────┘
                         │
                    ┌────┴────┐
                    │         │
              VALID │         │ INVALID
                    ▼         ▼
        ┌──────────────┐  ┌──────────────┐
        │ MARK AS USED │  │ SHOW ERROR   │
        │ ON BLOCKCHAIN│  │ (Already used│
        │              │  │  or invalid) │
        └──────┬───────┘  └──────────────┘
               │
               ▼
        ┌──────────────┐
        │ UPDATE DB    │
        │ status='used'│
        └──────┬───────┘
               │
               ▼
        ┌──────────────┐
        │ ALLOW ENTRY  │
        └──────────────┘
```

---

## Data Flow

### 1. Booking Creation
```javascript
Booking (MongoDB)
    ↓
{
  _id: "65abc123...",
  userId: "65xyz789...",
  routeId: "ROUTE_001",
  fare: 5000,  // ₹50.00
  travelDate: "2026-03-10",
  status: "confirmed"
}
```

### 2. Blockchain Ticket Issuance
```javascript
Smart Contract Call
    ↓
issueTicket(
  passenger: "0x742d35Cc...",
  bookingId: "65abc123...",
  routeId: "ROUTE_001",
  passengerName: "John Doe",
  fare: 0.05 MATIC,
  travelDate: 1741564800
)
    ↓
Transaction Confirmed
    ↓
{
  tokenId: "1",
  transactionHash: "0x8f3b2a...",
  blockNumber: 12345678
}
```

### 3. Database Record
```javascript
BlockchainTicket (MongoDB)
    ↓
{
  bookingId: "65abc123...",
  tokenId: "1",
  transactionHash: "0x8f3b2a...",
  blockNumber: 12345678,
  contractAddress: "0xABC123...",
  status: "issued",
  metadata: {
    routeId: "ROUTE_001",
    passengerName: "John Doe",
    fare: 5000,
    travelDate: "2026-03-10"
  }
}
```

---

## Smart Contract Structure

```solidity
contract BusTicket {
    
    struct Ticket {
        string bookingId;      // Link to MongoDB booking
        string routeId;        // Bus route
        string passengerName;  // Passenger name
        uint256 fare;          // Ticket price
        uint256 issueDate;     // When issued
        uint256 travelDate;    // Travel date
        bool isUsed;           // Used flag
        bool isRefunded;       // Refund flag
    }
    
    mapping(uint256 => Ticket) public tickets;
    mapping(string => uint256) public bookingToToken;
    
    function issueTicket(...) → tokenId
    function markTicketUsed(tokenId) → success
    function refundTicket(tokenId) → success
    function verifyTicket(tokenId) → isValid
    function getTicket(tokenId) → Ticket
}
```

---

## API Endpoints

### Issue Ticket
```
POST /api/blockchain/issue-ticket
Body: { bookingId: "65abc123..." }
Response: { tokenId, transactionHash, explorerUrl }
```

### Verify Ticket
```
GET /api/blockchain/verify-ticket/:tokenId
Response: { isValid, ticket: {...} }
```

### Use Ticket
```
POST /api/blockchain/use-ticket
Body: { tokenId: "1" }
Response: { success, transactionHash }
```

### Refund Ticket
```
POST /api/blockchain/refund-ticket
Body: { tokenId: "1" }
Response: { success, transactionHash }
```

### Get Stats
```
GET /api/blockchain/stats
Response: { totalTickets, byStatus, contractAddress }
```

---

## Database Schema

### BlockchainTicket Collection
```javascript
{
  bookingId: ObjectId (ref: Booking),
  tokenId: String (unique),
  transactionHash: String,
  blockNumber: Number,
  contractAddress: String,
  passengerWallet: String (optional),
  status: Enum ['issued', 'used', 'refunded'],
  issuedAt: Date,
  usedAt: Date,
  refundedAt: Date,
  gasUsed: String,
  metadata: {
    routeId: String,
    passengerName: String,
    fare: Number,
    travelDate: Date
  },
  timestamps: true
}
```

### Booking Collection (Updated)
```javascript
{
  // ... existing fields ...
  blockchainTicketId: ObjectId (ref: BlockchainTicket)
}
```

---

## Security Features

### 1. Immutability
- Once issued, ticket data cannot be altered
- All changes recorded on blockchain

### 2. Verification
- Anyone can verify ticket authenticity
- No need to trust central authority

### 3. Fraud Prevention
- Tickets cannot be duplicated
- Used tickets cannot be reused
- Refunded tickets cannot be used

### 4. Transparency
- All transactions visible on PolygonScan
- Audit trail for compliance

### 5. Access Control
- Only contract owner can issue/use/refund tickets
- Wallet-based authentication

---

## Cost Analysis

### Mumbai Testnet (Testing)
- **Free** - Get test MATIC from faucet
- Perfect for development

### Polygon Mainnet (Production)
| Operation | Gas Cost | USD Cost* |
|-----------|----------|-----------|
| Issue Ticket | ~0.001 MATIC | ~$0.0008 |
| Mark Used | ~0.0005 MATIC | ~$0.0004 |
| Refund | ~0.0005 MATIC | ~$0.0004 |

*Based on MATIC = $0.80

### Monthly Cost Estimate
- 1,000 tickets/day = ~$0.80/day
- 30,000 tickets/month = ~$24/month

**Much cheaper than traditional payment processing fees!**

---

## Benefits

### For Passengers
✅ Tamper-proof tickets
✅ Easy verification
✅ Transparent refunds
✅ Portable across platforms

### For Operators
✅ Fraud prevention
✅ Automated refunds
✅ Reduced disputes
✅ Compliance audit trail

### For System
✅ Decentralized
✅ No single point of failure
✅ Interoperable
✅ Future-proof

---

## Technology Stack

```
Frontend: Flutter / React
    ↓
Backend: Node.js + Express
    ↓
Blockchain Library: Ethers.js v6
    ↓
Smart Contract: Solidity 0.8.19
    ↓
Blockchain: Polygon (Layer 2)
    ↓
Database: MongoDB
```

---

## Monitoring & Analytics

### PolygonScan
- View all transactions
- Check contract state
- Monitor gas usage

### Backend Logs
- Ticket issuance events
- Verification attempts
- Error tracking

### Database Queries
- Tickets by status
- Revenue tracking
- Usage patterns

---

**This architecture provides a robust, scalable, and cost-effective blockchain ticketing system!** 🚀
