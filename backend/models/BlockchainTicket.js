const mongoose = require("mongoose");

const blockchainTicketSchema = new mongoose.Schema(
  {
    bookingId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Booking",
      required: true,
      unique: true,
    },
    tokenId: {
      type: String,
      required: true,
      unique: true,
    },
    transactionHash: {
      type: String,
      required: true,
    },
    blockNumber: {
      type: Number,
      required: true,
    },
    contractAddress: {
      type: String,
      required: true,
    },
    passengerWallet: {
      type: String,
      default: null,
    },
    status: {
      type: String,
      enum: ["issued", "used", "refunded"],
      default: "issued",
    },
    issuedAt: {
      type: Date,
      default: Date.now,
    },
    usedAt: {
      type: Date,
      default: null,
    },
    refundedAt: {
      type: Date,
      default: null,
    },
    gasUsed: {
      type: String,
      default: null,
    },
    metadata: {
      routeId: String,
      passengerName: String,
      fare: Number,
      travelDate: Date,
    },
  },
  {
    timestamps: true,
  },
);

blockchainTicketSchema.index({ bookingId: 1 });
blockchainTicketSchema.index({ tokenId: 1 });
blockchainTicketSchema.index({ transactionHash: 1 });
blockchainTicketSchema.index({ status: 1 });

module.exports = mongoose.model("BlockchainTicket", blockchainTicketSchema);
