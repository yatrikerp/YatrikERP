const blockchainService = require("../services/blockchainService");
const mongoose = require("mongoose");
require("dotenv").config();

async function testBlockchain() {
  try {
    console.log("🧪 Testing Blockchain Service\n");

    // Initialize service
    await blockchainService.initialize();

    // Check balance
    console.log("💰 Checking wallet balance...");
    const balance = await blockchainService.getBalance();
    console.log(`Balance: ${balance} MATIC\n`);

    // Test ticket issuance
    console.log("🎫 Testing ticket issuance...");
    const testBooking = {
      bookingId: "TEST_" + Date.now(),
      routeId: "ROUTE_001",
      passengerName: "Test Passenger",
      passengerWallet: null,
      fare: 0.001, // Small amount for testing
      travelDate: new Date(),
    };

    const issueResult = await blockchainService.issueTicket(testBooking);
    console.log("✅ Ticket issued:", issueResult);
    console.log(`Token ID: ${issueResult.tokenId}`);
    console.log(
      `Transaction: https://mumbai.polygonscan.com/tx/${issueResult.transactionHash}\n`,
    );

    // Verify ticket
    console.log("🔍 Verifying ticket...");
    const verifyResult = await blockchainService.verifyTicket(
      issueResult.tokenId,
    );
    console.log("✅ Ticket verified:", verifyResult);

    console.log("\n✅ All tests passed!");
  } catch (error) {
    console.error("❌ Test failed:", error);
  }
}

testBlockchain();
