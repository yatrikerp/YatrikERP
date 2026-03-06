const express = require("express");
const router = express.Router();
const blockchainService = require("../services/blockchainService");
const BlockchainTicket = require("../models/BlockchainTicket");
const Booking = require("../models/Booking");
const { authenticateToken } = require("../middleware/auth");

// Issue blockchain ticket for a booking
router.post("/issue-ticket", authenticateToken, async (req, res) => {
  try {
    const { bookingId } = req.body;

    // Check if ticket already issued
    const existingTicket = await BlockchainTicket.findOne({ bookingId });
    if (existingTicket) {
      return res.status(400).json({
        success: false,
        message: "Blockchain ticket already issued for this booking",
      });
    }

    // Get booking details
    const booking = await Booking.findById(bookingId)
      .populate("routeId")
      .populate("userId");

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: "Booking not found",
      });
    }

    // Prepare ticket data
    const ticketData = {
      bookingId: booking._id.toString(),
      routeId: booking.routeId._id.toString(),
      passengerName: booking.userId.name || "Passenger",
      passengerWallet: booking.userId.walletAddress || null,
      fare: booking.fare / 100, // Convert to decimal
      travelDate: booking.travelDate,
    };

    // Issue ticket on blockchain
    const result = await blockchainService.issueTicket(ticketData);

    // Save to database
    const blockchainTicket = new BlockchainTicket({
      bookingId: booking._id,
      tokenId: result.tokenId,
      transactionHash: result.transactionHash,
      blockNumber: result.blockNumber,
      contractAddress: process.env.TICKET_CONTRACT_ADDRESS,
      passengerWallet: ticketData.passengerWallet,
      gasUsed: result.gasUsed,
      metadata: {
        routeId: ticketData.routeId,
        passengerName: ticketData.passengerName,
        fare: booking.fare,
        travelDate: booking.travelDate,
      },
    });

    await blockchainTicket.save();

    // Update booking with blockchain reference
    booking.blockchainTicketId = blockchainTicket._id;
    await booking.save();

    res.json({
      success: true,
      message: "Blockchain ticket issued successfully",
      data: {
        tokenId: result.tokenId,
        transactionHash: result.transactionHash,
        blockNumber: result.blockNumber,
        explorerUrl: `https://mumbai.polygonscan.com/tx/${result.transactionHash}`,
      },
    });
  } catch (error) {
    console.error("Issue ticket error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to issue blockchain ticket",
      error: error.message,
    });
  }
});

// Verify ticket
router.get("/verify-ticket/:tokenId", async (req, res) => {
  try {
    const { tokenId } = req.params;

    const result = await blockchainService.verifyTicket(tokenId);

    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error("Verify ticket error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to verify ticket",
      error: error.message,
    });
  }
});

// Mark ticket as used
router.post("/use-ticket", authenticateToken, async (req, res) => {
  try {
    const { tokenId } = req.body;

    // Mark on blockchain
    const result = await blockchainService.markTicketUsed(tokenId);

    // Update database
    await BlockchainTicket.findOneAndUpdate(
      { tokenId },
      {
        status: "used",
        usedAt: new Date(),
      },
    );

    res.json({
      success: true,
      message: "Ticket marked as used",
      data: result,
    });
  } catch (error) {
    console.error("Use ticket error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to mark ticket as used",
      error: error.message,
    });
  }
});

// Refund ticket
router.post("/refund-ticket", authenticateToken, async (req, res) => {
  try {
    const { tokenId } = req.body;

    // Refund on blockchain
    const result = await blockchainService.refundTicket(tokenId);

    // Update database
    await BlockchainTicket.findOneAndUpdate(
      { tokenId },
      {
        status: "refunded",
        refundedAt: new Date(),
      },
    );

    res.json({
      success: true,
      message: "Ticket refunded successfully",
      data: result,
    });
  } catch (error) {
    console.error("Refund ticket error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to refund ticket",
      error: error.message,
    });
  }
});

// Get ticket by booking ID
router.get("/ticket/:bookingId", authenticateToken, async (req, res) => {
  try {
    const { bookingId } = req.params;

    const ticket = await BlockchainTicket.findOne({ bookingId }).populate(
      "bookingId",
    );

    if (!ticket) {
      return res.status(404).json({
        success: false,
        message: "Blockchain ticket not found",
      });
    }

    res.json({
      success: true,
      data: ticket,
    });
  } catch (error) {
    console.error("Get ticket error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to get ticket",
      error: error.message,
    });
  }
});

// Get wallet balance
router.get("/balance", authenticateToken, async (req, res) => {
  try {
    const balance = await blockchainService.getBalance();

    res.json({
      success: true,
      data: {
        balance: balance,
        currency: "MATIC",
      },
    });
  } catch (error) {
    console.error("Get balance error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to get balance",
      error: error.message,
    });
  }
});

// Get blockchain stats
router.get("/stats", authenticateToken, async (req, res) => {
  try {
    const stats = await BlockchainTicket.aggregate([
      {
        $group: {
          _id: "$status",
          count: { $sum: 1 },
        },
      },
    ]);

    const totalTickets = await BlockchainTicket.countDocuments();

    res.json({
      success: true,
      data: {
        totalTickets,
        byStatus: stats,
        contractAddress: process.env.TICKET_CONTRACT_ADDRESS,
      },
    });
  } catch (error) {
    console.error("Get stats error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to get stats",
      error: error.message,
    });
  }
});

module.exports = router;
