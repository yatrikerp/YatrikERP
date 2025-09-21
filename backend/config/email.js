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

  loginNotification: (userName, loginTime, ipAddress) => ({
    subject: 'YATRIK ERP - New Login Detected',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="text-align: center; margin-bottom: 30px;">
          <h1 style="color: #E91E63; margin: 0;">YATRIK ERP</h1>
          <p style="color: #666; margin: 5px 0;">Transport Management System</p>
        </div>
        
        <div style="background: #fff3cd; padding: 20px; border-radius: 10px; border-left: 4px solid #ffc107; margin-bottom: 20px;">
          <h3 style="color: #856404; margin-top: 0;">🔐 Security Notification</h3>
          <p style="color: #856404; margin: 0;">New login detected on your account</p>
        </div>
        
        <div style="background: #f8f9fa; padding: 30px; border-radius: 10px; border-left: 4px solid #E91E63;">
          <h3 style="color: #333; margin-top: 0;">Hello ${userName},</h3>
          
          <p style="color: #555; line-height: 1.6;">
            We detected a new login to your YATRIK ERP account. Here are the details:
          </p>
          
          <div style="background: #ffffff; padding: 20px; border-radius: 8px; margin: 20px 0; border: 1px solid #e0e0e0;">
            <p style="margin: 5px 0; color: #333;"><strong>Login Time:</strong> ${loginTime}</p>
            <p style="margin: 5px 0; color: #333;"><strong>IP Address:</strong> ${ipAddress}</p>
            <p style="margin: 5px 0; color: #333;"><strong>Device:</strong> Web Browser</p>
          </div>
          
          <p style="color: #555; line-height: 1.6;">
            If this was you, no action is needed. If you don't recognize this login, please:
          </p>
          
          <ul style="color: #555; margin: 10px 0; padding-left: 20px;">
            <li>Change your password immediately</li>
            <li>Contact our support team</li>
            <li>Check your account for any unauthorized activity</li>
          </ul>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/profile" 
               style="background: #E91E63; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; display: inline-block; font-weight: bold;">
              Manage Account
            </a>
          </div>
        </div>
        
        <div style="text-align: center; margin-top: 30px; color: #999; font-size: 12px;">
          <p>This is an automated security notification. Please do not reply to this message.</p>
          <p>&copy; 2024 YATRIK ERP. All rights reserved.</p>
        </div>
      </div>
    `
  }),

  ticketConfirmation: (bookingData) => ({
    subject: `YATRIK ERP - Ticket Confirmation - ${bookingData.bookingId}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="text-align: center; margin-bottom: 30px;">
          <h1 style="color: #E91E63; margin: 0;">YATRIK ERP</h1>
          <p style="color: #666; margin: 5px 0;">Transport Management System</p>
        </div>
        
        <div style="background: linear-gradient(135deg, #00A86B, #00BCD4); padding: 30px; border-radius: 10px; color: white; text-align: center; margin-bottom: 20px;">
          <h2 style="margin: 0; font-size: 28px;">🎫 Booking Confirmed!</h2>
          <p style="margin: 10px 0 0 0; font-size: 16px; opacity: 0.9;">Your ticket has been booked successfully</p>
        </div>
        
        <div style="background: #f8f9fa; padding: 30px; border-radius: 10px; border-left: 4px solid #E91E63;">
          <h3 style="color: #333; margin-top: 0;">Hello ${bookingData.customer.name},</h3>
          
          <p style="color: #555; line-height: 1.6;">
            Your bus ticket has been successfully booked! Here are your booking details:
          </p>
          
          <div style="background: #ffffff; padding: 20px; border-radius: 8px; margin: 20px 0; border: 1px solid #e0e0e0;">
            <h4 style="color: #E91E63; margin-top: 0;">📋 Booking Information</h4>
            <p style="margin: 5px 0; color: #333;"><strong>Booking ID:</strong> ${bookingData.bookingId}</p>
            <p style="margin: 5px 0; color: #333;"><strong>PNR:</strong> ${bookingData.bookingReference}</p>
            <p style="margin: 5px 0; color: #333;"><strong>Status:</strong> <span style="color: #00A86B; font-weight: bold;">Confirmed</span></p>
            <p style="margin: 5px 0; color: #333;"><strong>Total Amount:</strong> ₹${bookingData.pricing?.totalAmount || 0}</p>
          </div>
          
          <div style="background: #ffffff; padding: 20px; border-radius: 8px; margin: 20px 0; border: 1px solid #e0e0e0;">
            <h4 style="color: #E91E63; margin-top: 0;">🚌 Journey Details</h4>
            <p style="margin: 5px 0; color: #333;"><strong>Route:</strong> ${bookingData.journey?.from} to ${bookingData.journey?.to}</p>
            <p style="margin: 5px 0; color: #333;"><strong>Date:</strong> ${new Date(bookingData.journey?.departureDate).toLocaleDateString()}</p>
            <p style="margin: 5px 0; color: #333;"><strong>Departure Time:</strong> ${bookingData.journey?.departureTime}</p>
            <p style="margin: 5px 0; color: #333;"><strong>Arrival Time:</strong> ${bookingData.journey?.arrivalTime}</p>
            <p style="margin: 5px 0; color: #333;"><strong>Bus Number:</strong> ${bookingData.bus?.busNumber || 'N/A'}</p>
          </div>
          
          <div style="background: #ffffff; padding: 20px; border-radius: 8px; margin: 20px 0; border: 1px solid #e0e0e0;">
            <h4 style="color: #E91E63; margin-top: 0;">🎫 Seat Information</h4>
            ${bookingData.seats?.map(seat => `
              <p style="margin: 5px 0; color: #333;"><strong>Seat ${seat.seatNumber}:</strong> ${seat.passengerName} - ₹${seat.price}</p>
            `).join('') || '<p style="color: #666;">No seat details available</p>'}
          </div>
          
          <div style="background: #e8f5e8; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h4 style="color: #2e7d32; margin-top: 0;">📱 Important Instructions</h4>
            <ul style="color: #555; margin: 0; padding-left: 20px;">
              <li>Please arrive at the boarding point 15 minutes before departure</li>
              <li>Carry a valid ID proof for verification</li>
              <li>Show this email or booking ID to the conductor</li>
              <li>Keep your phone charged for any updates</li>
            </ul>
          </div>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/bookings" 
               style="background: #E91E63; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; display: inline-block; font-weight: bold;">
              View My Bookings
            </a>
          </div>
        </div>
        
        <div style="text-align: center; margin-top: 30px; color: #999; font-size: 12px;">
          <p>This is an automated email. Please do not reply to this message.</p>
          <p>&copy; 2024 YATRIK ERP. All rights reserved.</p>
        </div>
      </div>
    `
  })
};

// Email template cache for faster rendering
const templateCache = new Map();

// Send email function with optimizations
const sendEmail = async (to, template, data = {}) => {
  try {
    const transporter = createTransporter();
    let emailContent;
    
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
          emailContent = emailTemplates[template](data.userName, data.loginTime, data.ipAddress);
          break;
        case 'ticketConfirmation':
          emailContent = emailTemplates[template](data);
          break;
        default:
          throw new Error(`Unknown email template: ${template}`);
      }
      
      // Cache the rendered template (limit cache size)
      if (templateCache.size < 100) {
        templateCache.set(cacheKey, emailContent);
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
    console.log(`✅ Email sent successfully (${template}):`, info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error(`❌ Email sending failed (${template}):`, error);
    return { success: false, error: error.message };
  }
};

module.exports = {
  sendEmail,
  emailTemplates
};
