const nodemailer = require('nodemailer');

// Create reusable transporter object using SMTP transport
const createTransporter = () => {
  // Optimized Gmail configuration for faster delivery
  const gmailConfig = {
    host: 'smtp.gmail.com',
    port: 587,
    secure: false,
    auth: {
      user: process.env.EMAIL_USER || 'your-email@gmail.com',
      pass: process.env.EMAIL_PASSWORD || 'your-password'
    },
    tls: {
      rejectUnauthorized: false,
      ciphers: 'SSLv3'
    },
    // Connection pooling for better performance
    pool: true,
    maxConnections: 5,
    maxMessages: 100,
    rateLimit: 14, // Gmail allows 100 emails per day for free accounts
    // Timeout settings for faster delivery
    connectionTimeout: 60000, // 60 seconds
    greetingTimeout: 30000,   // 30 seconds
    socketTimeout: 60000,     // 60 seconds
    // Enable debug for troubleshooting
    debug: process.env.NODE_ENV === 'development',
    logger: process.env.NODE_ENV === 'development'
  };

  return nodemailer.createTransport(gmailConfig);
};

// Email templates
const emailTemplates = {
  passwordReset: (resetLink, userName) => ({
    subject: 'YATRIK ERP - Password Reset Request',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="text-align: center; margin-bottom: 30px;">
          <h1 style="color: #E91E63; margin: 0;">YATRIK ERP</h1>
          <p style="color: #666; margin: 5px 0;">Transport Management System</p>
        </div>
        
        <div style="background: #f8f9fa; padding: 30px; border-radius: 10px; border-left: 4px solid #E91E63;">
          <h2 style="color: #333; margin-top: 0;">Hello ${userName},</h2>
          
          <p style="color: #555; line-height: 1.6;">
            We received a request to reset your password for your YATRIK ERP account.
          </p>
          
          <p style="color: #555; line-height: 1.6;">
            Click the button below to reset your password. This link will expire in 24 hours.
          </p>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${resetLink}" 
               style="background: #E91E63; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; display: inline-block; font-weight: bold;">
              Reset Password
            </a>
          </div>
          
          <p style="color: #555; line-height: 1.6;">
            If you didn't request this password reset, please ignore this email. Your password will remain unchanged.
          </p>
          
          <p style="color: #555; line-height: 1.6;">
            If the button above doesn't work, copy and paste this link into your browser:
          </p>
          
          <p style="background: #f1f1f1; padding: 10px; border-radius: 5px; word-break: break-all; color: #666;">
            ${resetLink}
          </p>
        </div>
        
        <div style="text-align: center; margin-top: 30px; color: #999; font-size: 12px;">
          <p>This is an automated email. Please do not reply to this message.</p>
          <p>&copy; 2024 YATRIK ERP. All rights reserved.</p>
        </div>
      </div>
    `
  }),

  registrationWelcome: (userName, userEmail) => ({
    subject: 'Welcome to YATRIK ERP - Account Created Successfully!',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="text-align: center; margin-bottom: 30px;">
          <h1 style="color: #E91E63; margin: 0;">YATRIK ERP</h1>
          <p style="color: #666; margin: 5px 0;">Transport Management System</p>
        </div>
        
        <div style="background: linear-gradient(135deg, #E91E63, #FF4081); padding: 30px; border-radius: 10px; color: white; text-align: center; margin-bottom: 20px;">
          <h2 style="margin: 0; font-size: 28px;">🎉 Welcome to YATRIK ERP!</h2>
          <p style="margin: 10px 0 0 0; font-size: 16px; opacity: 0.9;">Your account has been created successfully</p>
        </div>
        
        <div style="background: #f8f9fa; padding: 30px; border-radius: 10px; border-left: 4px solid #E91E63;">
          <h3 style="color: #333; margin-top: 0;">Hello ${userName},</h3>
          
          <p style="color: #555; line-height: 1.6;">
            Thank you for joining YATRIK ERP! We're excited to have you on board. Your account has been successfully created with the email: <strong>${userEmail}</strong>
          </p>
          
          <div style="background: #e8f5e8; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h4 style="color: #2e7d32; margin-top: 0;">What you can do now:</h4>
            <ul style="color: #555; margin: 0; padding-left: 20px;">
              <li>Search and book bus tickets</li>
              <li>Track your bookings in real-time</li>
              <li>Manage your travel history</li>
              <li>Receive booking confirmations via email</li>
              <li>Get updates about your trips</li>
            </ul>
          </div>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/login" 
               style="background: #E91E63; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; display: inline-block; font-weight: bold;">
              Start Booking Now
            </a>
          </div>
          
          <p style="color: #555; line-height: 1.6;">
            If you have any questions or need assistance, feel free to contact our support team.
          </p>
        </div>
        
        <div style="text-align: center; margin-top: 30px; color: #999; font-size: 12px;">
          <p>This is an automated email. Please do not reply to this message.</p>
          <p>&copy; 2024 YATRIK ERP. All rights reserved.</p>
        </div>
      </div>
    `
  }),

  loginNotification: (userName, loginTime, ipAddress, userRole, latestTrips = [], newServices = []) => ({
    subject: 'YATRIK ERP - Welcome Back! Latest Trips & Services',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="text-align: center; margin-bottom: 30px;">
          <h1 style="color: #E91E63; margin: 0;">YATRIK ERP</h1>
          <p style="color: #666; margin: 5px 0;">Transport Management System</p>
        </div>
        
        <div style="background: linear-gradient(135deg, #E91E63, #FF4081); padding: 30px; border-radius: 10px; color: white; text-align: center; margin-bottom: 20px;">
          <h2 style="margin: 0; font-size: 28px;">👋 Welcome Back, ${userName}!</h2>
          <p style="margin: 10px 0 0 0; font-size: 16px; opacity: 0.9;">You've successfully logged in to your account</p>
        </div>
        
        <div style="background: #f8f9fa; padding: 30px; border-radius: 10px; border-left: 4px solid #E91E63;">
          <h3 style="color: #333; margin-top: 0;">🔐 Login Information</h3>
          
          <div style="background: #ffffff; padding: 20px; border-radius: 8px; margin: 20px 0; border: 1px solid #e0e0e0;">
            <p style="margin: 5px 0; color: #333;"><strong>Login Time:</strong> ${loginTime}</p>
            <p style="margin: 5px 0; color: #333;"><strong>IP Address:</strong> ${ipAddress}</p>
            <p style="margin: 5px 0; color: #333;"><strong>Account Type:</strong> ${userRole || 'Passenger'}</p>
          </div>
          
          ${latestTrips.length > 0 ? `
          <div style="background: #e8f5e8; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h4 style="color: #2e7d32; margin-top: 0;">🚌 Latest Available Trips</h4>
            ${latestTrips.map(trip => `
              <div style="background: white; padding: 15px; border-radius: 8px; margin: 10px 0; border-left: 3px solid #00A86B;">
                <p style="margin: 5px 0; color: #333;"><strong>Route:</strong> ${trip.route || 'N/A'}</p>
                <p style="margin: 5px 0; color: #333;"><strong>Departure:</strong> ${trip.departureTime || 'N/A'}</p>
                <p style="margin: 5px 0; color: #333;"><strong>Fare:</strong> ₹${trip.fare || 'N/A'}</p>
                <p style="margin: 5px 0; color: #333;"><strong>Available Seats:</strong> ${trip.availableSeats || 'N/A'}</p>
              </div>
            `).join('')}
          </div>
          ` : ''}
          
          ${newServices.length > 0 ? `
          <div style="background: #fff3cd; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h4 style="color: #856404; margin-top: 0;">🆕 New Services & Features</h4>
            ${newServices.map(service => `
              <div style="background: white; padding: 15px; border-radius: 8px; margin: 10px 0; border-left: 3px solid #FFB300;">
                <p style="margin: 5px 0; color: #333;"><strong>${service.name || 'New Service'}</strong></p>
                <p style="margin: 5px 0; color: #666;">${service.description || 'Check out this new feature!'}</p>
              </div>
            `).join('')}
          </div>
          ` : ''}
          
          <div style="background: #e3f2fd; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h4 style="color: #1976D2; margin-top: 0;">🎯 Quick Actions</h4>
            <ul style="color: #555; margin: 0; padding-left: 20px;">
              <li>Book your next trip</li>
              <li>Check your booking history</li>
              <li>Update your profile information</li>
              <li>View available routes and schedules</li>
            </ul>
          </div>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${process.env.FRONTEND_URL || 'http://localhost:5173'}/search" 
               style="background: #E91E63; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; display: inline-block; font-weight: bold; margin: 5px;">
              Search Trips
            </a>
            <a href="${process.env.FRONTEND_URL || 'http://localhost:5173'}/bookings" 
               style="background: #00A86B; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; display: inline-block; font-weight: bold; margin: 5px;">
              My Bookings
            </a>
          </div>
          
          <div style="background: #fff3cd; padding: 15px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #ffc107;">
            <p style="color: #856404; margin: 0; font-size: 14px;">
              <strong>Security Tip:</strong> If you don't recognize this login, please change your password immediately and contact our support team.
            </p>
          </div>
        </div>
        
        <div style="text-align: center; margin-top: 30px; color: #999; font-size: 12px;">
          <p>This is an automated notification. Please do not reply to this message.</p>
          <p>&copy; 2024 YATRIK ERP. All rights reserved.</p>
        </div>
      </div>
    `
  }),

  ticketConfirmationWithQR: async (ticketData) => {
    const QRCode = require('qrcode');
    
    // Normalize and format data - use EXACT passenger booking details
    const t = ticketData || {};
    const bookingId = t.bookingId || t.bookingReference || 'N/A';
    const customerName = t.passengerName || t.customer?.name || 'Passenger';
    const customerEmail = t.customer?.email || 'N/A';
    const customerPhone = t.customer?.phone || 'N/A';
    
    // Use EXACT boarding and destination from passenger booking
    const fromCity = t.boardingStop || t.journey?.from || 'N/A';
    const toCity = t.destinationStop || t.journey?.to || 'N/A';
    
    // Use EXACT departure date and time from passenger booking
    const rawDate = t.journey?.departureDate;
    const dateStr = rawDate ? new Date(rawDate).toLocaleDateString('en-IN', { 
      weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' 
    }) : 'N/A';
    
    // Use booking departure time (exact time passenger selected)
    const timeStr = t.journey?.departureTime || 'N/A';
    
    // Arrival information from booking
    const arrivalDateStr = t.journey?.arrivalDate ? new Date(t.journey.arrivalDate).toLocaleDateString('en-IN', { 
      weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' 
    }) : 'As per schedule';
    const arrivalTimeStr = t.journey?.arrivalTime || 'As per schedule';
    
    // Journey duration
    const durationMinutes = t.journey?.duration || 0;
    const durationHours = Math.floor(durationMinutes / 60);
    const durationMins = durationMinutes % 60;
    const durationStr = durationMinutes > 0 
      ? `${durationHours}h ${durationMins}m` 
      : 'As scheduled';
    
    const busNumber = t.bus?.number || t.tripDetails?.busNumber || 'N/A';
    const busType = t.bus?.type || t.tripDetails?.busType || '';
    const routeName = t.route?.name || t.tripDetails?.routeName || `${fromCity} - ${toCity}`;
    const seatNumber = t.seatNumber || t.seat?.number || 'N/A';
    const seatType = t.seat?.type || 'Standard';
    const seatPosition = t.seat?.position || '';
    const pnr = t.pnr || bookingId;
    const ticketNumber = t.ticketNumber || 'N/A';
    
    // Pricing details
    const fareAmount = t.fareAmount || t.pricing?.totalAmount || 0;
    const baseFare = t.pricing?.baseFare || 0;
    const gst = t.pricing?.gst || 0;
    
    // Driver and Conductor information
    const driverName = t.driver?.name || 'To be assigned';
    const driverEmail = t.driver?.email || 'N/A';
    const driverPhone = t.driver?.phone || 'N/A';
    
    const conductorName = t.conductor?.name || 'To be assigned';
    const conductorEmail = t.conductor?.email || 'N/A';
    const conductorPhone = t.conductor?.phone || 'N/A';
    
    // Booking summary - total passengers in this booking
    const totalPassengers = t.bookingSummary?.totalPassengers || 1;
    const allPassengers = t.bookingSummary?.allPassengers || [customerName];
    const allSeatNumbers = t.bookingSummary?.seatNumbers || [seatNumber];
    
    // Generate QR Code
    let qrCodeDataURL = t.qrImage || '';
    if (!qrCodeDataURL && t.qrPayload) {
      try {
        qrCodeDataURL = await QRCode.toDataURL(t.qrPayload, {
          errorCorrectionLevel: 'H',
          type: 'image/png',
          width: 300,
          margin: 2
        });
      } catch (err) {
        console.error('QR generation error:', err);
        qrCodeDataURL = '';
      }
    }
    
    const currencyFormat = (amt) => {
      if (amt === undefined || amt === null || isNaN(Number(amt))) return '0.00';
      return Number(amt).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    };
    
    const subject = `🎫 Your YATRIK Bus Ticket - ${pnr} | ${fromCity} to ${toCity}`;
    const html = `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; max-width: 680px; margin: 0 auto; background: #f5f5f5; padding: 20px;">
        <!-- Header -->
        <div style="background: linear-gradient(135deg, #E91E63, #9C27B0); padding: 30px; text-align: center; border-radius: 12px 12px 0 0;">
          <div style="font-size: 48px; margin-bottom: 10px;">🎫</div>
          <h1 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: 700;">Ticket Confirmed!</h1>
          <p style="color: #f3e5f5; margin: 8px 0 0 0; font-size: 16px;">Your bus ticket is ready</p>
        </div>

        <!-- Main Content -->
        <div style="background: #ffffff; padding: 30px; border-radius: 0 0 12px 12px; box-shadow: 0 4px 12px rgba(0,0,0,0.08);">
          
          <!-- Ticket Card -->
          <div style="border: 2px dashed #E91E63; border-radius: 12px; padding: 24px; margin-bottom: 24px; background: #fef5f8;">
            <div style="text-align: center; margin-bottom: 20px;">
              <h2 style="color: #E91E63; margin: 0 0 8px 0; font-size: 22px;">PNR: ${pnr}</h2>
              <p style="color: #666; margin: 0; font-size: 13px;">Ticket #${ticketNumber}</p>
            </div>
            
            <div style="display: grid; grid-template-columns: 1fr auto 1fr; gap: 16px; align-items: center; margin: 20px 0;">
              <div style="text-align: center;">
                <p style="margin: 0; color: #999; font-size: 12px; text-transform: uppercase;">Boarding From</p>
                <p style="margin: 4px 0; color: #E91E63; font-size: 20px; font-weight: 700;">${fromCity}</p>
                <p style="margin: 0; color: #666; font-size: 13px;">${dateStr}</p>
                <p style="margin: 0; color: #666; font-size: 14px; font-weight: 600;">${timeStr}</p>
              </div>
              <div style="text-align: center;">
                <div style="color: #E91E63; font-size: 24px;">→</div>
                <p style="margin: 4px 0; color: #999; font-size: 11px;">${durationStr}</p>
              </div>
              <div style="text-align: center;">
                <p style="margin: 0; color: #999; font-size: 12px; text-transform: uppercase;">Arriving At</p>
                <p style="margin: 4px 0; color: #E91E63; font-size: 20px; font-weight: 700;">${toCity}</p>
                <p style="margin: 0; color: #666; font-size: 13px;">${arrivalDateStr}</p>
                <p style="margin: 0; color: #666; font-size: 13px;">${arrivalTimeStr}</p>
              </div>
            </div>
            
            <div style="background: #ffffff; border-radius: 8px; padding: 16px; margin-top: 16px;">
              <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px;">
                <div>
                  <p style="margin: 0; color: #999; font-size: 11px; text-transform: uppercase;">Passenger</p>
                  <p style="margin: 4px 0 0 0; color: #333; font-size: 15px; font-weight: 600;">${customerName}</p>
                </div>
                <div>
                  <p style="margin: 0; color: #999; font-size: 11px; text-transform: uppercase;">Seat Number</p>
                  <p style="margin: 4px 0 0 0; color: #E91E63; font-size: 18px; font-weight: 700;">${seatNumber}</p>
                  ${seatType !== 'Standard' ? `<p style="margin: 2px 0 0 0; color: #666; font-size: 11px;">${seatType}${seatPosition ? ' - ' + seatPosition : ''}</p>` : ''}
                </div>
                <div>
                  <p style="margin: 0; color: #999; font-size: 11px; text-transform: uppercase;">Bus Number</p>
                  <p style="margin: 4px 0 0 0; color: #333; font-size: 15px; font-weight: 600;">${busNumber}</p>
                  ${busType ? `<p style="margin: 2px 0 0 0; color: #666; font-size: 11px;">${busType}</p>` : ''}
                </div>
                <div>
                  <p style="margin: 0; color: #999; font-size: 11px; text-transform: uppercase;">Fare Paid</p>
                  <p style="margin: 4px 0 0 0; color: #00A86B; font-size: 18px; font-weight: 700;">₹${currencyFormat(fareAmount)}</p>
                  ${gst > 0 ? `<p style="margin: 2px 0 0 0; color: #666; font-size: 11px;">(incl. GST ₹${currencyFormat(gst)})</p>` : ''}
                </div>
              </div>
              ${routeName !== `${fromCity} - ${toCity}` ? `
              <div style="margin-top: 12px; padding-top: 12px; border-top: 1px dashed #e0e0e0;">
                <p style="margin: 0; color: #999; font-size: 11px; text-transform: uppercase;">Route</p>
                <p style="margin: 4px 0 0 0; color: #333; font-size: 13px; font-weight: 600;">${routeName}</p>
              </div>
              ` : ''}
            </div>
          </div>

          ${qrCodeDataURL ? `
          <!-- QR Code Section -->
          <div style="background: linear-gradient(135deg, #f8f9fa, #e9ecef); border-radius: 12px; padding: 24px; text-align: center; margin-bottom: 24px;">
            <h3 style="color: #333; margin: 0 0 8px 0; font-size: 18px; font-weight: 600;">🔍 Scan QR Code for Boarding</h3>
            <p style="color: #666; margin: 0 0 16px 0; font-size: 13px;">Show this QR code to the conductor for verification</p>
            <div style="background: #ffffff; display: inline-block; padding: 16px; border-radius: 12px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
              <img src="${qrCodeDataURL}" alt="Ticket QR Code" style="width: 240px; height: 240px; display: block;" />
            </div>
            <p style="color: #999; margin: 12px 0 0 0; font-size: 11px; font-style: italic;">This QR code is unique and secure</p>
          </div>
          ` : ''}

          <!-- Crew Information -->
          <div style="background: #f0f4ff; border-radius: 12px; padding: 20px; margin-bottom: 24px;">
            <h3 style="color: #1976D2; margin: 0 0 16px 0; font-size: 18px; font-weight: 600; display: flex; align-items: center;">
              <span style="margin-right: 8px;">👨‍✈️</span> Crew Information
            </h3>
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px;">
              <div style="background: #ffffff; border-radius: 8px; padding: 14px;">
                <p style="margin: 0 0 8px 0; color: #1976D2; font-size: 12px; font-weight: 600; text-transform: uppercase;">🚗 Driver</p>
                <p style="margin: 0 0 4px 0; color: #333; font-size: 15px; font-weight: 600;">${driverName}</p>
                ${driverEmail !== 'N/A' ? `<p style="margin: 0; color: #666; font-size: 12px;">📧 ${driverEmail}</p>` : ''}
                ${driverPhone !== 'N/A' ? `<p style="margin: 0; color: #666; font-size: 12px;">📱 ${driverPhone}</p>` : ''}
              </div>
              <div style="background: #ffffff; border-radius: 8px; padding: 14px;">
                <p style="margin: 0 0 8px 0; color: #1976D2; font-size: 12px; font-weight: 600; text-transform: uppercase;">🎫 Conductor</p>
                <p style="margin: 0 0 4px 0; color: #333; font-size: 15px; font-weight: 600;">${conductorName}</p>
                ${conductorEmail !== 'N/A' ? `<p style="margin: 0; color: #666; font-size: 12px;">📧 ${conductorEmail}</p>` : ''}
                ${conductorPhone !== 'N/A' ? `<p style="margin: 0; color: #666; font-size: 12px;">📱 ${conductorPhone}</p>` : ''}
              </div>
            </div>
          </div>

          <!-- Important Instructions -->
          <div style="background: #fff8e1; border-left: 4px solid #FFC107; border-radius: 8px; padding: 16px; margin-bottom: 24px;">
            <h4 style="color: #F57C00; margin: 0 0 12px 0; font-size: 16px; font-weight: 600;">⚠️ Important Instructions</h4>
            <ul style="color: #5D4037; margin: 0; padding-left: 20px; font-size: 13px; line-height: 1.8;">
              <li>Report at the boarding point <strong>15 minutes before departure</strong></li>
              <li>Carry a <strong>valid photo ID proof</strong> for verification</li>
              <li>Show this <strong>QR code to the conductor</strong> for seat allocation</li>
              <li>The conductor will scan and verify your ticket before boarding</li>
              <li>Keep your mobile phone <strong>charged</strong> to display the QR code</li>
              <li>Save this email or take a screenshot of the QR code</li>
            </ul>
          </div>

          <!-- Contact Information -->
          <div style="background: #e8f5e9; border-radius: 8px; padding: 16px; margin-bottom: 20px;">
            <h4 style="color: #2E7D32; margin: 0 0 8px 0; font-size: 14px; font-weight: 600;">📞 Need Help?</h4>
            <p style="color: #558B2F; margin: 0; font-size: 13px; line-height: 1.6;">
              For any queries or assistance, please contact our support team or reach out to the crew members listed above.
            </p>
          </div>

          <!-- CTA Buttons -->
          <div style="text-align: center; margin: 24px 0;">
            <a href="${process.env.FRONTEND_URL || 'http://localhost:5173'}/passenger/dashboard" 
               style="background: linear-gradient(135deg, #E91E63, #9C27B0); color: #ffffff; padding: 14px 28px; text-decoration: none; border-radius: 24px; display: inline-block; font-weight: 700; font-size: 14px; margin: 0 8px; box-shadow: 0 4px 12px rgba(233, 30, 99, 0.3);">
              📱 View My Bookings
            </a>
            <a href="${process.env.FRONTEND_URL || 'http://localhost:5173'}/support" 
               style="background: #ffffff; color: #E91E63; padding: 14px 28px; text-decoration: none; border-radius: 24px; display: inline-block; font-weight: 700; font-size: 14px; margin: 0 8px; border: 2px solid #E91E63;">
              💬 Get Support
            </a>
          </div>
        </div>

        <!-- Footer -->
        <div style="background: #263238; padding: 24px; text-align: center; border-radius: 12px; margin-top: 20px;">
          <p style="color: #B0BEC5; margin: 0 0 8px 0; font-size: 13px;">This is an automated confirmation email. Please do not reply.</p>
          <p style="color: #78909C; margin: 0 0 12px 0; font-size: 12px;">&copy; ${new Date().getFullYear()} YATRIK ERP. All rights reserved.</p>
          <div style="margin-top: 12px;">
            <a href="${process.env.FRONTEND_URL || 'http://localhost:5173'}" style="color: #E91E63; text-decoration: none; margin: 0 12px; font-size: 12px;">Website</a>
            <a href="${process.env.FRONTEND_URL || 'http://localhost:5173'}/terms" style="color: #E91E63; text-decoration: none; margin: 0 12px; font-size: 12px;">Terms</a>
            <a href="${process.env.FRONTEND_URL || 'http://localhost:5173'}/privacy" style="color: #E91E63; text-decoration: none; margin: 0 12px; font-size: 12px;">Privacy</a>
          </div>
        </div>
      </div>`;

    return { subject, html };
  },

  ticketConfirmation: (bookingData) => {
    // Normalize and format data defensively to ensure accurate content
    const d = bookingData || {};
    const bookingId = d.bookingId || d.bookingReference || (d._id ? String(d._id).slice(-8).toUpperCase() : 'N/A');
    const customerName = d.customer?.name || d.seats?.[0]?.passengerName || 'Passenger';
    const customerEmail = d.customer?.email || 'N/A';
    const customerPhone = d.customer?.phone || 'N/A';

    const routeObj = d.route || d.trip?.routeId || {};
    const fromCity = routeObj.startingPoint?.city || routeObj.startingPoint || d.journey?.from || 'N/A';
    const toCity = routeObj.endingPoint?.city || routeObj.endingPoint || d.journey?.to || 'N/A';

    const rawDate = d.journey?.departureDate || d.trip?.serviceDate;
    const dateStr = rawDate ? new Date(rawDate).toLocaleDateString() : 'N/A';

    const timeStr = d.journey?.departureTime || d.trip?.startTime || 'N/A';
    const busNumber = d.bus?.busNumber || d.trip?.busNumber || 'N/A';

    const currencyFormat = (amt) => {
      if (amt === undefined || amt === null || isNaN(Number(amt))) return '0';
      try {
        return Number(amt).toLocaleString('en-IN');
      } catch (_) {
        return String(amt);
      }
    };

    const seatsHtml = Array.isArray(d.seats) && d.seats.length > 0
      ? d.seats.map((seat) => {
          const seatNum = seat?.seatNumber || '—';
          const seatName = seat?.passengerName || customerName || 'Passenger';
          const seatPrice = currencyFormat(seat?.price || 0);
          return `
            <div style="background: #ffffff; padding: 14px; border-radius: 8px; margin: 10px 0; border: 1px solid #f1e7bd;">
              <div style="display: flex; justify-content: space-between; align-items: center;">
                <div>
                  <p style="margin: 0; color: #2f2f2f; font-weight: 600; font-size: 15px;">Seat ${seatNum}</p>
                  <p style="margin: 4px 0 0 0; color: #666; font-size: 13px;">${seatName}</p>
                </div>
                <div style="background: #8d6e00; color: white; padding: 6px 12px; border-radius: 16px; font-weight: 600; font-size: 13px;">
                  ₹${seatPrice}
                </div>
              </div>
            </div>`;
        }).join('')
      : '<p style="color: #666; text-align: center; padding: 20px;">No seat details available</p>';

    const subject = `🎫 YATRIK ERP - Ticket Confirmation - ${bookingId}`;
    const html = `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Helvetica Neue', Arial, 'Noto Sans', 'Apple Color Emoji', 'Segoe UI Emoji', 'Segoe UI Symbol'; max-width: 640px; margin: 0 auto; background: #ffffff; border-radius: 14px; overflow: hidden; box-shadow: 0 8px 24px rgba(16, 24, 40, 0.12);">
        <div style="background: linear-gradient(135deg, #E91E63, #9C27B0); padding: 28px 26px; text-align: center;">
          <div style="font-size: 40px; margin-bottom: 8px;">🎫</div>
          <h1 style="color: #ffffff; margin: 0; font-size: 24px; line-height: 32px;">Booking Confirmed</h1>
          <p style="color: #f3e5f5; margin: 6px 0 0 0; font-size: 14px;">Your bus ticket has been successfully booked</p>
        </div>

        <div style="padding: 26px;">
          <div style="background: #f8fafc; padding: 18px; border-radius: 12px; margin-bottom: 18px; border: 1px solid #eef2f7;">
            <h3 style="color: #0f172a; margin: 0 0 10px 0; font-size: 16px; display: flex; align-items: center;">
              <span style="margin-right: 8px;">📋</span> Booking Details
            </h3>
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-top: 8px;">
              <div>
                <p style="margin: 6px 0; color: #475569; font-size: 12px;"><strong>Booking ID</strong></p>
                <p style="margin: 0; color: #C2185B; font-weight: 700; font-size: 15px; letter-spacing: 0.3px;">${bookingId}</p>
              </div>
              <div>
                <p style="margin: 6px 0; color: #475569; font-size: 12px;"><strong>Passenger</strong></p>
                <p style="margin: 0; color: #0f172a; font-weight: 600;">${customerName}</p>
              </div>
              <div>
                <p style="margin: 6px 0; color: #475569; font-size: 12px;"><strong>Email</strong></p>
                <p style="margin: 0; color: #0f172a;">${customerEmail}</p>
              </div>
              <div>
                <p style="margin: 6px 0; color: #475569; font-size: 12px;"><strong>Phone</strong></p>
                <p style="margin: 0; color: #0f172a;">${customerPhone}</p>
              </div>
            </div>
          </div>

          <div style="background: #f0fdf4; padding: 18px; border-radius: 12px; margin-bottom: 18px; border: 1px solid #dcfce7;">
            <h3 style="color: #166534; margin: 0 0 10px 0; font-size: 16px; display: flex; align-items: center;">
              <span style="margin-right: 8px;">🚌</span> Trip Information
            </h3>
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-top: 8px;">
              <div>
                <p style="margin: 6px 0; color: #475569; font-size: 12px;"><strong>Route</strong></p>
                <p style="margin: 0; color: #166534; font-weight: 600; font-size: 15px;">${fromCity} → ${toCity}</p>
              </div>
              <div>
                <p style="margin: 6px 0; color: #475569; font-size: 12px;"><strong>Date</strong></p>
                <p style="margin: 0; color: #0f172a; font-weight: 600;">${dateStr}</p>
              </div>
              <div>
                <p style="margin: 6px 0; color: #475569; font-size: 12px;"><strong>Time</strong></p>
                <p style="margin: 0; color: #0f172a; font-weight: 600;">${timeStr}</p>
              </div>
              <div>
                <p style="margin: 6px 0; color: #475569; font-size: 12px;"><strong>Bus</strong></p>
                <p style="margin: 0; color: #0f172a; font-weight: 600;">${busNumber}</p>
              </div>
            </div>
          </div>

          <div style="background: #fff8e1; padding: 18px; border-radius: 12px; margin-bottom: 18px; border: 1px solid #ffecb3;">
            <h3 style="color: #7a5b00; margin: 0 0 10px 0; font-size: 16px; display: flex; align-items: center;">
              <span style="margin-right: 8px;">💺</span> Seat Details
            </h3>
            <div style="margin-top: 8px;">
              ${seatsHtml}
            </div>
          </div>

          <div style="background: #eff6ff; padding: 16px; border-radius: 10px; margin: 16px 0; border: 1px solid #dbeafe;">
            <h4 style="color: #1d4ed8; margin: 0 0 6px 0; font-size: 14px; display: flex; align-items: center;">
              <span style="margin-right: 8px;">📱</span> Important Instructions
            </h4>
            <ul style="color: #334155; margin: 8px 0 0 18px; padding: 0; line-height: 1.6; font-size: 13px;">
              <li style="margin-bottom: 6px;">Arrive at the boarding point <strong>15 minutes early</strong>.</li>
              <li style="margin-bottom: 6px;">Carry a <strong>valid ID proof</strong> for verification.</li>
              <li style="margin-bottom: 6px;">Show this email or booking ID to the conductor.</li>
              <li style="margin-bottom: 6px;">Keep your phone charged for updates.</li>
            </ul>
          </div>

          <div style="text-align: center; margin: 22px 0 4px;">
            <a href="${process.env.FRONTEND_URL || 'http://localhost:5173'}/passenger/dashboard" style="background: linear-gradient(135deg, #E91E63, #9C27B0); color: #ffffff; padding: 14px 24px; text-decoration: none; border-radius: 22px; display: inline-block; font-weight: 700; font-size: 14px; box-shadow: 0 4px 12px rgba(233, 30, 99, 0.25);">View My Bookings</a>
          </div>
        </div>

        <div style="background: #f8fafc; padding: 18px; text-align: center; color: #64748b; font-size: 12px; border-top: 1px solid #e2e8f0;">
          <p style="margin: 0 0 6px 0;">This is an automated email. Please do not reply.</p>
          <p style="margin: 0; font-weight: 600;">&copy; 2024 YATRIK ERP. All rights reserved.</p>
          <div style="margin-top: 10px;">
            <a href="${process.env.FRONTEND_URL || 'http://localhost:5173'}" style="color: #C2185B; text-decoration: none; margin: 0 10px;">Visit Website</a>
            <a href="${process.env.FRONTEND_URL || 'http://localhost:5173'}/support" style="color: #C2185B; text-decoration: none; margin: 0 10px;">Support</a>
          </div>
        </div>
      </div>`;

    return { subject, html };
  }
};

// Email template cache for faster rendering
const templateCache = new Map();

// Send email function with optimizations
const sendEmail = async (to, templateOrHTML, dataOrSubject = {}) => {
  try {
    const transporter = createTransporter();
    let emailContent;
    
    // Check if templateOrHTML is a string (custom HTML) or template name
    if (typeof templateOrHTML === 'string' && templateOrHTML.includes('<div')) {
      // Direct HTML content with subject
      emailContent = {
        subject: dataOrSubject || 'YATRIK Notification',
        html: templateOrHTML
      };
    } else {
      // Template-based email
      const template = templateOrHTML;
      const data = dataOrSubject;
      
      // Check cache first for faster template rendering
      const cacheKey = `${template}_${JSON.stringify(data)}`;
      if (templateCache.has(cacheKey)) {
        emailContent = templateCache.get(cacheKey);
      } else {
        // Handle different template types
        switch (template) {
          case 'passwordReset':
            emailContent = emailTemplates[template](data.resetLink, data.userName);
            break;
          case 'registrationWelcome':
            emailContent = emailTemplates[template](data.userName, data.userEmail);
            break;
          case 'loginNotification':
            emailContent = emailTemplates[template](
              data.userName, 
              data.loginTime, 
              data.ipAddress, 
              data.userRole,
              data.latestTrips || [],
              data.newServices || []
            );
            break;
          case 'ticketConfirmation':
            emailContent = emailTemplates[template](data);
            break;
          case 'ticketConfirmationWithQR':
            // This is an async function, so we need to await it
            emailContent = await emailTemplates[template](data);
            break;
          default:
            throw new Error(`Unknown email template: ${template}`);
        }
        
        // Cache the rendered template (limit cache size)
        if (templateCache.size < 100) {
          templateCache.set(cacheKey, emailContent);
        }
      }
    }
    
    const mailOptions = {
      from: `"YATRIK ERP" <${process.env.EMAIL_USER || 'your-email@gmail.com'}>`,
      to: to,
      subject: emailContent.subject,
      html: emailContent.html,
      // Add priority for faster delivery
      priority: 'high',
      // Add headers for better deliverability
      headers: {
        'X-Priority': '1',
        'X-MSMail-Priority': 'High',
        'Importance': 'high'
      }
    };
    
    const info = await transporter.sendMail(mailOptions);
    console.log(`✅ Email sent successfully:`, info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error(`❌ Email sending failed:`, error);
    return { success: false, error: error.message };
  }
};

module.exports = {
  sendEmail,
  emailTemplates
};
