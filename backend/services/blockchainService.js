const { ethers } = require("ethers");
const fs = require("fs");
const path = require("path");

class BlockchainService {
  constructor() {
    this.provider = null;
    this.wallet = null;
    this.contract = null;
    this.initialized = false;
  }

  async initialize() {
    try {
      // Polygon Mumbai Testnet (for testing) or Polygon Mainnet
      const rpcUrl =
        process.env.POLYGON_RPC_URL || "https://rpc-mumbai.maticvigil.com";
      this.provider = new ethers.JsonRpcProvider(rpcUrl);

      // Load wallet from private key
      const privateKey = process.env.BLOCKCHAIN_PRIVATE_KEY;
      if (!privateKey) {
        throw new Error("BLOCKCHAIN_PRIVATE_KEY not set in environment");
      }
      this.wallet = new ethers.Wallet(privateKey, this.provider);

      // Load contract
      const contractAddress = process.env.TICKET_CONTRACT_ADDRESS;
      if (!contractAddress) {
        console.warn("TICKET_CONTRACT_ADDRESS not set. Deploy contract first.");
        return;
      }

      const abiPath = path.join(__dirname, "../contracts/BusTicket.json");
      if (!fs.existsSync(abiPath)) {
        console.warn("Contract ABI not found. Compile contract first.");
        return;
      }

      const contractABI = JSON.parse(fs.readFileSync(abiPath, "utf8")).abi;
      this.contract = new ethers.Contract(
        contractAddress,
        contractABI,
        this.wallet,
      );

      this.initialized = true;
      console.log("✅ Blockchain service initialized");
      console.log("📍 Network:", await this.provider.getNetwork());
      console.log("💼 Wallet:", this.wallet.address);
    } catch (error) {
      console.error("❌ Blockchain initialization failed:", error.message);
      this.initialized = false;
    }
  }

  async issueTicket(bookingData) {
    if (!this.initialized) {
      throw new Error("Blockchain service not initialized");
    }

    try {
      const {
        bookingId,
        routeId,
        passengerName,
        passengerWallet,
        fare,
        travelDate,
      } = bookingData;

      // Use passenger wallet or default to system wallet
      const recipientAddress = passengerWallet || this.wallet.address;

      console.log(`🎫 Issuing ticket for booking: ${bookingId}`);

      const tx = await this.contract.issueTicket(
        recipientAddress,
        bookingId,
        routeId,
        passengerName,
        ethers.parseEther(fare.toString()),
        Math.floor(new Date(travelDate).getTime() / 1000),
      );

      console.log("⏳ Transaction sent:", tx.hash);
      const receipt = await tx.wait();
      console.log("✅ Transaction confirmed:", receipt.hash);

      // Extract token ID from event
      const event = receipt.logs.find((log) => {
        try {
          return this.contract.interface.parseLog(log).name === "TicketIssued";
        } catch {
          return false;
        }
      });

      const tokenId = event
        ? this.contract.interface.parseLog(event).args.tokenId
        : null;

      return {
        success: true,
        transactionHash: receipt.hash,
        tokenId: tokenId ? tokenId.toString() : null,
        blockNumber: receipt.blockNumber,
        gasUsed: receipt.gasUsed.toString(),
      };
    } catch (error) {
      console.error("❌ Ticket issuance failed:", error);
      throw error;
    }
  }

  async markTicketUsed(tokenId) {
    if (!this.initialized) {
      throw new Error("Blockchain service not initialized");
    }

    try {
      console.log(`✓ Marking ticket ${tokenId} as used`);
      const tx = await this.contract.markTicketUsed(tokenId);
      const receipt = await tx.wait();

      return {
        success: true,
        transactionHash: receipt.hash,
        blockNumber: receipt.blockNumber,
      };
    } catch (error) {
      console.error("❌ Mark ticket used failed:", error);
      throw error;
    }
  }

  async refundTicket(tokenId) {
    if (!this.initialized) {
      throw new Error("Blockchain service not initialized");
    }

    try {
      console.log(`💰 Refunding ticket ${tokenId}`);
      const tx = await this.contract.refundTicket(tokenId);
      const receipt = await tx.wait();

      return {
        success: true,
        transactionHash: receipt.hash,
        blockNumber: receipt.blockNumber,
      };
    } catch (error) {
      console.error("❌ Refund ticket failed:", error);
      throw error;
    }
  }

  async verifyTicket(tokenId) {
    if (!this.initialized) {
      throw new Error("Blockchain service not initialized");
    }

    try {
      const isValid = await this.contract.verifyTicket(tokenId);
      const ticket = await this.contract.getTicket(tokenId);

      return {
        isValid,
        ticket: {
          bookingId: ticket.bookingId,
          routeId: ticket.routeId,
          passengerName: ticket.passengerName,
          fare: ethers.formatEther(ticket.fare),
          issueDate: new Date(Number(ticket.issueDate) * 1000),
          travelDate: new Date(Number(ticket.travelDate) * 1000),
          isUsed: ticket.isUsed,
          isRefunded: ticket.isRefunded,
        },
      };
    } catch (error) {
      console.error("❌ Verify ticket failed:", error);
      throw error;
    }
  }

  async getTicketByBooking(bookingId) {
    if (!this.initialized) {
      throw new Error("Blockchain service not initialized");
    }

    try {
      const ticket = await this.contract.getTicketByBooking(bookingId);

      return {
        bookingId: ticket.bookingId,
        routeId: ticket.routeId,
        passengerName: ticket.passengerName,
        fare: ethers.formatEther(ticket.fare),
        issueDate: new Date(Number(ticket.issueDate) * 1000),
        travelDate: new Date(Number(ticket.travelDate) * 1000),
        isUsed: ticket.isUsed,
        isRefunded: ticket.isRefunded,
      };
    } catch (error) {
      console.error("❌ Get ticket by booking failed:", error);
      throw error;
    }
  }

  async getBalance() {
    if (!this.initialized) {
      throw new Error("Blockchain service not initialized");
    }

    const balance = await this.provider.getBalance(this.wallet.address);
    return ethers.formatEther(balance);
  }
}

module.exports = new BlockchainService();
