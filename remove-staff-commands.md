# Remove Specific Staff Members from Database

## Method 1: Using API Endpoint (Recommended)

### Step 1: Start the Backend Server
```bash
cd backend
npm run dev
```

### Step 2: Get Admin Token
First, you need to get an admin authentication token. You can get this by logging into the admin panel.

### Step 3: Call the API
Replace `YOUR_ADMIN_TOKEN` with your actual admin token:

```bash
curl -X DELETE http://localhost:5000/api/admin/remove-specific-staff \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"removePriyaMenon": false}'
```

### Step 4: Verify Removal
Check the streamlined trips page at `http://localhost:5173/admin/streamlined-trips` to confirm the staff members are no longer listed.

## Method 2: Using the Script (When Database is Running)

### Step 1: Make sure MongoDB is running
```bash
# Start MongoDB service
# On Windows: net start MongoDB
# On Mac: brew services start mongodb-community
# On Linux: sudo systemctl start mongod
```

### Step 2: Run the removal script
```bash
node backend/remove-specific-staff.js
```

## What Will Be Removed

The following staff members will be completely removed from the database:

### Drivers:
- ✅ **Rajesh Kumar** - Will be removed from Driver collection and User collection

### Conductors:
- ✅ **Priya Sharma** - Will be removed from Conductor collection and User collection
- ⚠️ **Priya Menon** - Only removed if `removePriyaMenon: true` is set

## What Happens During Removal

1. **Trip Unassignment**: Any trips assigned to these staff members will be unassigned (driverId/conductorId set to null)
2. **Duty Cleanup**: All duty records for these staff members will be deleted
3. **User Account Removal**: Their user accounts will be deleted
4. **Staff Record Removal**: Their driver/conductor records will be deleted

## Verification

After removal, check:
- Streamlined trips page shows different staff members
- No trips are assigned to Rajesh Kumar or Priya Sharma
- Admin panel user management shows these names are gone

## Important Notes

- ⚠️ This action is **irreversible**
- 🔄 Make sure to reassign any important trips before removal
- 📋 Consider backing up your database before running this
- 🔐 Only admin users can perform this operation
