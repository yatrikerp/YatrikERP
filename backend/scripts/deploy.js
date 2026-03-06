const hre = require("hardhat");

async function main() {
  console.log("🚀 Deploying BusTicket contract...");

  const [deployer] = await hre.ethers.getSigners();
  console.log("📍 Deploying with account:", deployer.address);

  const balance = await hre.ethers.provider.getBalance(deployer.address);
  console.log("💰 Account balance:", hre.ethers.formatEther(balance), "MATIC");

  const BusTicket = await hre.ethers.getContractFactory("BusTicket");
  const busTicket = await BusTicket.deploy();

  await busTicket.waitForDeployment();

  const address = await busTicket.getAddress();
  console.log("✅ BusTicket deployed to:", address);

  // Save contract address and ABI
  const fs = require("fs");
  const contractData = {
    address: address,
    abi: JSON.parse(busTicket.interface.formatJson()),
  };

  fs.writeFileSync(
    "./contracts/BusTicket.json",
    JSON.stringify(contractData, null, 2),
  );

  console.log("📄 Contract ABI saved to contracts/BusTicket.json");
  console.log("\n⚠️  Add this to your .env file:");
  console.log(`TICKET_CONTRACT_ADDRESS=${address}`);
  console.log("\n🔍 Verify on PolygonScan:");
  console.log(`https://mumbai.polygonscan.com/address/${address}`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
