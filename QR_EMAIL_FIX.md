# QR Code Email Fix - Passenger Ticket System

## Issue Identified ❌
The QR code was not being sent to passengers via email because the email template `ticketConfirmationWithQR` was missing from the sendEmail function's switch statement.

## Root Cause
In `backend/config/email.js`, the `sendEmail` function had a switch statement to handle different email templates, but it did not include a case for `'ticketConfirmationWithQR'`. When the payment verification tried to send the ticket email with QR code, it would throw an "Unknown email template" error.

## Fix Applied ✅

### File Modified: `backend/config/email.js`

**Before:**
```javascript
switch (template) {
  case 'passwordReset':
    emailContent = emailTemplates[template](data.resetLink, data.userName);
    break;
  case 'registrationWelcome':
    emailContent = emailTemplates[template](data.userName, data.userEmail);
    break;
  case 'loginNotification':
    emailContent = emailTemplates[template](/* ... */);
    break;
  case 'ticketConfirmation':
    emailContent = emailTemplates[template](data);
    break;
  default:
    throw new Error(`Unknown email template: ${template}`);
}
```

**After:**
```javascript
switch (template) {
  case 'passwordReset':
    emailContent = emailTemplates[template](data.resetLink, data.userName);
    break;
  case 'registrationWelcome':
    emailContent = emailTemplates[template](data.userName, data.userEmail);
    break;
  case 'loginNotification':
    emailContent = emailTemplates[template](/* ... */);
    break;
  case 'ticketConfirmation':
    emailContent = emailTemplates[template](data);
    break;
  case 'ticketConfirmationWithQR':  // ⭐ NEW
    // This is an async function, so we need to await it
    emailContent = await emailTemplates[template](data);
    break;
  default:
    throw new Error(`Unknown email template: ${template}`);
}
```

## Important Note ⚠️

The `ticketConfirmationWithQR` template function is **async** because it generates a QR code image using the QRCode library. This is why we use `await` when calling it.

## Email Flow Now Working ✅

### 1. Payment Verification
```javascript
// backend/routes/payment.js (line 309-326)
if (ticketsCreated.length > 0 && booking.customer?.email) {
  try {
    const emailResult = await sendEmail(
      booking.customer.email, 
      'ticketConfirmationWithQR',  // ← Template name
      ticketsCreated[0]             // ← Ticket data with QR
    );
    
    console.log(`✅ Ticket email sent to ${booking.customer.email}:`, emailResult.success);
    
    booking.notifications = booking.notifications || {};
    booking.notifications.emailSent = true;
    await booking.save();
  } catch (emailError) {
    console.error('❌ Email sending error:', emailError);
  }
}
```

### 2. Email Template Processing
```javascript
// backend/config/email.js (line 627-651)
case 'ticketConfirmationWithQR':
  // Generates QR code and returns email content
  emailContent = await emailTemplates.ticketConfirmationWithQR(data);
  break;
```

### 3. Email Sent
The email now contains:
- ✅ Passenger name
- ✅ Route details (From → To)
- ✅ Correct amount/pricing
- ✅ Bus details
- ✅ **QR Code image** (embedded)
- ✅ Conductor details
- ✅ Driver details
- ✅ Seat information
- ✅ Journey times
- ✅ Important instructions

## Testing the Fix

### Step 1: Complete a Booking
1. Book a ticket as a passenger
2. Complete payment (use Razorpay test mode)
3. Payment verification will trigger email

### Step 2: Check Email
Look for email from "YATRIK ERP" with:
- Subject: `🎫 Your YATRIK Bus Ticket - {PNR} | {From} to {To}`
- Contains QR code image
- Contains all booking details
- Contains conductor and driver information

### Step 3: Verify Console Logs
Check backend console for:
```
✅ Ticket email sent to passenger@email.com: true
```

### Step 4: Check Database
Verify in MongoDB:
```javascript
booking.notifications.emailSent = true
```

## Email Template Features

The `ticketConfirmationWithQR` template includes:

### 1. Header Section
- YATRIK ERP branding
- "Ticket Confirmed!" heading
- Ticket emoji 🎫

### 2. Ticket Information Card
- PNR number
- Ticket number
- Journey route (From → To)
- Departure and arrival times
- Passenger name
- Seat number
- Bus details
- Fare amount

### 3. QR Code Section
```javascript
// QR Code is generated using QRCode library
const qrCodeDataURL = await QRCode.toDataURL(qrPayload, {
  errorCorrectionLevel: 'H',
  type: 'image/png',
  width: 300,
  margin: 2
});
```

Embedded as:
```html
<img src="${qrCodeDataURL}" alt="Ticket QR Code" 
     style="width: 240px; height: 240px; display: block;" />
```

### 4. Crew Information Section ⭐
```html
<div>
  <h3>👨‍✈️ Crew Information</h3>
  
  <!-- Driver Card -->
  <div>
    <p>🚗 Driver</p>
    <p>${driverName}</p>
    <p>📧 ${driverEmail}</p>
    <p>📱 ${driverPhone}</p>
  </div>
  
  <!-- Conductor Card -->
  <div>
    <p>🎫 Conductor</p>
    <p>${conductorName}</p>
    <p>📧 ${conductorEmail}</p>
    <p>📱 ${conductorPhone}</p>
  </div>
</div>
```

### 5. Important Instructions
- Report 15 minutes before departure
- Carry valid ID
- Show QR code to conductor
- Keep phone charged

### 6. CTA Buttons
- "View My Bookings" → `/passenger/dashboard`
- "Get Support" → `/support`

## Troubleshooting

### Email Not Received?

1. **Check email service configuration**
   ```bash
   # In .env file
   EMAIL_USER=your-email@gmail.com
   EMAIL_PASSWORD=your-app-password
   ```

2. **Check console for errors**
   ```
   ❌ Email sending failed: <error message>
   ```

3. **Verify customer email exists**
   ```javascript
   booking.customer?.email // Should not be null
   ```

4. **Check spam folder**
   - YATRIK emails might be marked as spam
   - Add to safe senders list

### QR Code Not Showing?

1. **Check QR payload exists**
   ```javascript
   ticketData.qrPayload // Should contain ticket data
   ```

2. **Check QRCode library installed**
   ```bash
   npm list qrcode
   ```

3. **Check QR generation logs**
   ```
   QR generation error: <error>
   ```

## Environment Variables Required

```env
# Email Configuration
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=your-gmail-app-password

# Frontend URL (for email links)
FRONTEND_URL=http://localhost:5173

# Razorpay (for payment)
RAZORPAY_KEY_ID=rzp_test_xxxxx
RAZORPAY_KEY_SECRET=xxxxx
```

## Dependencies

```json
{
  "qrcode": "^1.5.x",
  "nodemailer": "^6.x.x"
}
```

## Next Steps After Fix

1. **Restart backend server**
   ```bash
   npm run server
   ```

2. **Test with real booking**
   - Complete a test booking
   - Verify email received
   - Check QR code displays

3. **Verify email in different clients**
   - Gmail
   - Outlook
   - Mobile email apps

4. **Monitor logs**
   - Check for email sending success
   - Monitor for errors

## Files Changed

### Primary Fix
- ✅ `backend/config/email.js` - Added `ticketConfirmationWithQR` case

### Related Files (Already Correct)
- ✅ `backend/routes/payment.js` - Email sending code exists
- ✅ `backend/config/email.js` - Template function exists
- ✅ `backend/routes/ticketPNR.js` - PNR endpoint with crew details

## Summary

The QR code email was not being sent because the email template handler was missing the case for `'ticketConfirmationWithQR'`. This has been fixed by adding the template case with proper async/await handling for QR code generation.

**Status**: ✅ Fixed and Ready for Testing

---

**Date**: October 20, 2025  
**Issue**: QR code email not sent to passengers  
**Fix**: Added ticketConfirmationWithQR template case  
**Impact**: Passengers now receive complete ticket email with QR code
