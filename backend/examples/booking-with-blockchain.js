/**
 * Example: How to integrate blockchain tickets with your booking system
 */

const Booking = require("../models/Booking");
const BlockchainTicket = require("../models/BlockchainTicket");
const blockchainService = require("../services/blockchainService");

/**
 * Create booking with blockchain ticket
 */
async function createBookingWithBlockchain(bookingData, userId) {
  try {
    // Step 1: Create normal booking (your existing code)
    const booking = new Booking({
      userId: userId,
      routeId: bookingData.routeId,
      tripId: bookingData.tripId,
      fare: bookingData.fare,
      travelDate: bookingData.travelDate,
      status: "confirmed",
    });

    await booking.save();
    console.log("✅ Booking created:", booking._id);

    // Step 2: Issue blockchain ticket (new)
    try {
      const ticketData = {
        bookingId: booking._id.toString(),
        routeId: booking.routeId.toString(),
        passengerName: bookingData.passengerName,
        passengerWallet: bookingData.walletAddress || null,
        fare: booking.fare / 100, // Convert to decimal
        travelDate: booking.travelDate,
      };

      const result = await blockchainService.issueTicket(ticketData);

      // Save blockchain ticket record
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

      // Link blockchain ticket to booking
      booking.blockchainTicketId = blockchainTicket._id;
      await booking.save();

      console.log("✅ Blockchain ticket issued:", result.tokenId);
      console.log(
        "🔍 View on PolygonScan:",
        `https://mumbai.polygonscan.com/tx/${result.transactionHash}`,
      );

      return {
        success: true,
        booking: booking,
        blockchainTicket: {
          tokenId: result.tokenId,
          transactionHash: result.transactionHash,
          explorerUrl: `https://mumbai.polygonscan.com/tx/${result.transactionHash}`,
        },
      };
    } catch (blockchainError) {
      console.error(
        "⚠️ Blockchain ticket issuance failed:",
        blockchainError.message,
      );
      // Booking is still valid, blockchain is optional
      return {
        success: true,
        booking: booking,
        blockchainTicket: null,
        warning: "Booking created but blockchain ticket failed",
      };
    }
  } catch (error) {
    console.error("❌ Booking creation failed:", error);
    throw error;
  }
}

/**
 * Verify and use ticket (conductor scans QR code)
 */
async function verifyAndUseTicket(tokenId) {
  try {
    // Step 1: Verify ticket on blockchain
    const verification = await blockchainService.verifyTicket(tokenId);

    if (!verification.isValid) {
      return {
        success: false,
        message: "Ticket is invalid or already used",
      };
    }

    // Step 2: Mark as used on blockchain
    await blockchainService.markTicketUsed(tokenId);

    // Step 3: Update database
    await BlockchainTicket.findOneAndUpdate(
      { tokenId },
      {
        status: "used",
        usedAt: new Date(),
      },
    );

    console.log("✅ Ticket verified and marked as used");

    return {
      success: true,
      message: "Ticket verified successfully",
      ticket: verification.ticket,
    };
  } catch (error) {
    console.error("❌ Ticket verification failed:", error);
    throw error;
  }
}

/**
 * Refund ticket
 */
async function refundTicket(bookingId) {
  try {
    // Find blockchain ticket
    const blockchainTicket = await BlockchainTicket.findOne({ bookingId });

    if (!blockchainTicket) {
      throw new Error("Blockchain ticket not found");
    }

    if (blockchainTicket.status === "used") {
      throw new Error("Cannot refund used ticket");
    }

    // Refund on blockchain
    await blockchainService.refundTicket(blockchainTicket.tokenId);

    // Update database
    blockchainTicket.status = "refunded";
    blockchainTicket.refundedAt = new Date();
    await blockchainTicket.save();

    // Update booking status
    await Booking.findByIdAndUpdate(bookingId, {
      status: "refunded",
    });

    console.log("✅ Ticket refunded successfully");

    return {
      success: true,
      message: "Ticket refunded successfully",
    };
  } catch (error) {
    console.error("❌ Refund failed:", error);
    throw error;
  }
}

/**
 * Get ticket details for QR code
 */
async function getTicketForQR(bookingId) {
  try {
    const blockchainTicket = await BlockchainTicket.findOne({
      bookingId,
    }).populate("bookingId");

    if (!blockchainTicket) {
      return null;
    }

    return {
      tokenId: blockchainTicket.tokenId,
      bookingId: bookingId,
      status: blockchainTicket.status,
      transactionHash: blockchainTicket.transactionHash,
      explorerUrl: `https://mumbai.polygonscan.com/tx/${blockchainTicket.transactionHash}`,
      metadata: blockchainTicket.metadata,
    };
  } catch (error) {
    console.error("❌ Get ticket failed:", error);
    throw error;
  }
}

module.exports = {
  createBookingWithBlockchain,
  verifyAndUseTicket,
  refundTicket,
  getTicketForQR,
};
