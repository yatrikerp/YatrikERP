# Suresh Driver Credentials Setup

## Login Credentials

**Email:** `suresh.driver@yatrik.com`  
**Password:** `Yatrik@123`

## Dashboard URL

**Driver Dashboard:** http://localhost:3000/admin/drivers

## Setup Instructions

### 1. Database Setup

The driver account has been configured in the system with the following details:

- **Name:** Suresh Driver
- **Email:** suresh.driver@yatrik.com
- **Password:** Yatrik@123
- **Driver ID:** DRVSURE
- **Employee Code:** EMPSURE
- **Username:** suresh.driver
- **Status:** Active

### 2. Depot Assignment

The driver is assigned to the first active depot in the system. You can view and manage depot assignments through the admin panel.

### 3. Authentication

The authentication system has been updated to support custom driver email formats like `suresh.driver@yatrik.com`. The login flow:

1. User enters email: `suresh.driver@yatrik.com`
2. User enters password: `Yatrik@123`
3. System validates credentials using bcrypt
4. System creates JWT token for the driver
5. User is redirected to the driver dashboard

### 4. Using the Credentials

To login as Suresh:

1. Navigate to: http://localhost:3000/login
2. Enter email: `suresh.driver@yatrik.com`
3. Enter password: `Yatrik@123`
4. Click "Login"
5. You will be redirected to the driver dashboard

### 5. Driver Dashboard Features

Once logged in, Suresh will be able to:
- View assigned trips
- Track GPS location
- Mark attendance
- View duty assignments
- Access trip management features

## Technical Details

### Database Model

The driver is stored in the `drivers` collection with the following key fields:

- `driverId`: Unique identifier (DRVSURE)
- `email`: suresh.driver@yatrik.com
- `username`: suresh.driver
- `password`: Hashed using bcrypt with salt rounds of 12
- `depotId`: Reference to the assigned depot
- `status`: active
- `drivingLicense`: Valid driver's license information

### Authentication Flow

The authentication logic in `backend/routes/auth.js` has been updated to:

1. Detect custom driver email format: `*.driver@yatrik.com`
2. Lookup driver by email or username
3. Verify password using bcrypt
4. Generate JWT token with driver information
5. Return success response with driver data

### Password Security

The password is hashed using `bcrypt` with 12 salt rounds, ensuring secure storage in the database.

## Troubleshooting

### Issue: Cannot login with credentials

**Solution:** 
1. Ensure the driver account exists in the database
2. Verify the password is hashed correctly
3. Check that the depot is active

### Issue: Driver not found

**Solution:**
1. Run the setup script: `node backend/setup-driver-credentials.js`
2. Check database connection
3. Verify depot assignments

## Related Files

- `backend/setup-driver-credentials.js` - Driver setup script
- `backend/routes/auth.js` - Authentication logic
- `backend/models/Driver.js` - Driver model
- `backend/models/Depot.js` - Depot model

## Notes

- The driver is automatically assigned to the first active depot in the system
- The password is case-sensitive
- The JWT token expires after 12 hours
- The driver must be active to login
