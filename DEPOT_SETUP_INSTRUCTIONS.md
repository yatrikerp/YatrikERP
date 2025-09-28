# 🚀 Comprehensive Depot Setup Instructions

## Overview
This setup will replace all existing depot data with the comprehensive Kerala State Transport depot system (91 depots total).

## What This Setup Does

### ✅ **Clears Existing Data**
- Removes all old test depot data from database
- Deletes existing depot users and manager accounts
- Ensures clean slate for new data

### ✅ **Creates Comprehensive Depot System**
- **27 Main Depots** (ALP, ALY, ATL, CHR, CGR, CTL, EKM, KNR, KGD, KYM, KLM, KTR, KTM, KKD, MVP, NDD, NTA, PLA, PLK, PPD, PTA, PBR, SBY, TVL, TSR, TVM, CTY, VZM)
- **45 Sub Depots** (ADR, ANK, CDM, CLD, CHT, CTR, ETP, GVR, HPD, KPT, KHD, KPM, KNP, KTD, KTP, KMR, KDR, KMG, KMY, MLA, MLP, MND, MVK, NBR, NPR, PSL, PPM, PNR, PMN, PRK, PVM, PNK, PNI, PVR, PLR, TLY, TSY, TDP, TPM, VKM, VND, VRD, VJD, VKB, VTR)
- **19 Operating Centers** (ARD, ARK, EDT, EMY, IJK, KNI, KKM, KLP, MPY, MKD, MLT, MNR, PLD, PDM, PDK, RNY, TDY, VKA, VDK)

### ✅ **Auto-Generated Credentials**
Each depot gets automatically generated login credentials:
- **Main Depots**: `{code}-depot@yatrik.com` (e.g., `tvm-depot@yatrik.com`)
- **Sub Depots**: `{code}-subdepot@yatrik.com` (e.g., `ktp-subdepot@yatrik.com`)
- **Operating Centers**: `{code}-opcenter@yatrik.com` (e.g., `ard-opcenter@yatrik.com`)
- **Password**: `{CODE}@Yatrik2024` (e.g., `TVM@Yatrik2024`)

## 🚀 How to Run Setup

### Step 1: Ensure Backend is Running
```bash
cd backend
npm start
```

### Step 2: Run the Setup Script
```bash
node setup-comprehensive-depots.js
```

### Step 3: Verify Setup
1. Check the console output for success/failure counts
2. Visit: `http://localhost:5173/admin/depot-management`
3. You should see all 91 depots with proper categorization

## 🔐 Test Depot Login

### Sample Credentials:
- **Main Depot**: `tvm-depot@yatrik.com` / `TVM@Yatrik2024`
- **Sub Depot**: `ktp-subdepot@yatrik.com` / `KTP@Yatrik2024`
- **Operating Center**: `ard-opcenter@yatrik.com` / `ARD@Yatrik2024`

### Login URL:
`http://localhost:5173/depot-login`

## 📊 Expected Results

After successful setup, you should see:
- **91 Total Depots** in the depot management interface
- **Color-coded depot types**:
  - 🏢 Main Depots (Pink)
  - 🏪 Sub Depots (Turquoise)
  - 📍 Operating Centers (Blue)
- **Complete depot information** including contact details, capacity, facilities
- **Working depot manager login** for each depot

## 🛠️ Troubleshooting

### If Setup Fails:
1. Check MongoDB connection
2. Ensure backend server is running
3. Verify environment variables are set
4. Check console output for specific error messages

### If Depots Don't Appear:
1. Refresh the depot management page
2. Check browser console for API errors
3. Verify admin authentication token

## 📝 Notes

- This setup completely replaces existing depot data
- All depot manager accounts are created with consistent permissions
- Depot capacities are set based on depot type (Main: 50, Sub: 30, Operating: 15)
- All depots are set to 'active' status by default

## 🎯 Next Steps

After successful setup:
1. Test depot manager login with sample credentials
2. Verify depot dashboard functionality
3. Configure additional depot-specific settings as needed
4. Set up depot-specific routes and schedules

