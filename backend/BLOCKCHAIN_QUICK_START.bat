@echo off
echo ========================================
echo   Blockchain Ticket System Setup
echo ========================================
echo.

echo Step 1: Installing dependencies...
call npm install ethers@^6.9.0 @openzeppelin/contracts@^5.0.0 hardhat@^2.19.0 @nomicfoundation/hardhat-toolbox@^4.0.0
echo.

echo Step 2: Compiling smart contract...
call npx hardhat compile
echo.

echo Step 3: Ready to deploy!
echo.
echo Next steps:
echo 1. Get test MATIC from: https://faucet.polygon.technology/
echo 2. Add your private key to .env file
echo 3. Run: npx hardhat run scripts/deploy.js --network mumbai
echo.
pause
