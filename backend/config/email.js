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

  ticketConfirmation: (bookingData) => ({
    subject: `🎫 YATRIK ERP - Ticket Confirmation - ${bookingData.bookingId}`,
    html: `
      <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 15px; overflow: hidden; box-shadow: 0 8px 25px rgba(0, 0, 0, 0.15);">
        <!-- Header with Gradient -->
        <div style="background: linear-gradient(135deg, #E91E63, #9C27B0, #673AB7); padding: 40px 30px; text-align: center; position: relative;">
          <div style="position: absolute; top: 0; left: 0; right: 0; bottom: 0; background: url('data:image/svg+xml,<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 100 100\"><circle cx=\"20\" cy=\"20\" r=\"2\" fill=\"white\" opacity=\"0.1\"/><circle cx=\"80\" cy=\"40\" r=\"3\" fill=\"white\" opacity=\"0.1\"/><circle cx=\"40\" cy=\"80\" r=\"2\" fill=\"white\" opacity=\"0.1\"/></svg>'); opacity: 0.3;"></div>
          <div style="position: relative; z-index: 1;">
            <div style="background: rgba(255,255,255,0.2); width: 80px; height: 80px; border-radius: 50%; margin: 0 auto 20px; display: flex; align-items: center; justify-content: center; backdrop-filter: blur(10px);">
              <span style="font-size: 40px;">🎫</span>
            </div>
            <h1 style="color: white; margin: 0; font-size: 32px; font-weight: bold; text-shadow: 0 2px 4px rgba(0,0,0,0.3);">Booking Confirmed!</h1>
            <p style="color: #f8f9fa; margin: 15px 0 0 0; font-size: 18px; opacity: 0.9;">Your bus ticket has been successfully booked</p>
          </div>
        </div>
        
        <!-- Main Content -->
        <div style="padding: 40px 30px;">
          <!-- Booking Details Card -->
          <div style="background: linear-gradient(135deg, #f8f9fa, #e9ecef); padding: 25px; border-radius: 12px; margin-bottom: 25px; border-left: 5px solid #E91E63;">
            <h3 style="color: #333; margin-top: 0; font-size: 20px; display: flex; align-items: center;">
              <span style="margin-right: 10px;">📋</span> Booking Details
            </h3>
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin-top: 15px;">
              <div>
                <p style="margin: 8px 0; color: #555; font-size: 14px;"><strong>Booking ID:</strong></p>
                <p style="margin: 0; color: #E91E63; font-weight: bold; font-size: 16px;">${bookingData.bookingId || 'N/A'}</p>
              </div>
              <div>
                <p style="margin: 8px 0; color: #555; font-size: 14px;"><strong>Passenger:</strong></p>
                <p style="margin: 0; color: #333; font-weight: 600;">${bookingData.customer?.name || 'N/A'}</p>
              </div>
              <div>
                <p style="margin: 8px 0; color: #555; font-size: 14px;"><strong>Email:</strong></p>
                <p style="margin: 0; color: #333;">${bookingData.customer?.email || 'N/A'}</p>
              </div>
              <div>
                <p style="margin: 8px 0; color: #555; font-size: 14px;"><strong>Phone:</strong></p>
                <p style="margin: 0; color: #333;">${bookingData.customer?.phone || 'N/A'}</p>
              </div>
            </div>
          </div>
          
          <!-- Trip Information Card -->
          <div style="background: linear-gradient(135deg, #e8f5e8, #d4edda); padding: 25px; border-radius: 12px; margin-bottom: 25px; border-left: 5px solid #28a745;">
            <h3 style="color: #2e7d32; margin-top: 0; font-size: 20px; display: flex; align-items: center;">
              <span style="margin-right: 10px;">🚌</span> Trip Information
            </h3>
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin-top: 15px;">
              <div>
                <p style="margin: 8px 0; color: #555; font-size: 14px;"><strong>Route:</strong></p>
                <p style="margin: 0; color: #2e7d32; font-weight: 600; font-size: 16px;">${bookingData.journey?.from || 'N/A'} → ${bookingData.journey?.to || 'N/A'}</p>
              </div>
              <div>
                <p style="margin: 8px 0; color: #555; font-size: 14px;"><strong>Date:</strong></p>
                <p style="margin: 0; color: #333; font-weight: 600;">${bookingData.journey?.departureDate || 'N/A'}</p>
              </div>
              <div>
                <p style="margin: 8px 0; color: #555; font-size: 14px;"><strong>Time:</strong></p>
                <p style="margin: 0; color: #333; font-weight: 600;">${bookingData.journey?.departureTime || 'N/A'}</p>
              </div>
              <div>
                <p style="margin: 8px 0; color: #555; font-size: 14px;"><strong>Bus:</strong></p>
                <p style="margin: 0; color: #333; font-weight: 600;">${bookingData.bus?.busNumber || 'N/A'}</p>
              </div>
            </div>
          </div>
          
          <!-- Seat Details Card -->
          <div style="background: linear-gradient(135deg, #fff3cd, #ffeaa7); padding: 25px; border-radius: 12px; margin-bottom: 25px; border-left: 5px solid #ffc107;">
            <h3 style="color: #856404; margin-top: 0; font-size: 20px; display: flex; align-items: center;">
              <span style="margin-right: 10px;">💺</span> Seat Details
            </h3>
            <div style="margin-top: 15px;">
              ${bookingData.seats?.map(seat => `
                  <div style="background: white; padding: 15px; border-radius: 8px; margin: 10px 0; border: 1px solid #ffeaa7;">
                    <div style="display: flex; justify-content: space-between; align-items: center;">
                      <div>
                        <p style="margin: 0; color: #333; font-weight: 600; font-size: 16px;">Seat ${seat.seatNumber}</p>
                        <p style="margin: 5px 0 0 0; color: #666; font-size: 14px;">${seat.passengerName}</p>
                      </div>
                      <div style="background: #856404; color: white; padding: 8px 15px; border-radius: 20px; font-weight: bold;">
                        ₹${seat.price}
                      </div>
                    </div>
                  </div>
                `).join('') || '<p style="color: #666; text-align: center; padding: 20px;">No seat details available</p>'}
            </div>
          </div>
          
          <!-- Important Instructions -->
          <div style="background: linear-gradient(135deg, #e3f2fd, #bbdefb); padding: 25px; border-radius: 12px; margin: 25px 0; border-left: 5px solid #2196f3;">
            <h4 style="color: #1976d2; margin-top: 0; font-size: 18px; display: flex; align-items: center;">
              <span style="margin-right: 10px;">📱</span> Important Instructions
            </h4>
            <ul style="color: #555; margin: 15px 0 0 0; padding-left: 20px; line-height: 1.6;">
              <li style="margin-bottom: 8px;">Please arrive at the boarding point <strong>15 minutes before departure</strong></li>
              <li style="margin-bottom: 8px;">Carry a <strong>valid ID proof</strong> for verification</li>
              <li style="margin-bottom: 8px;">Show this email or booking ID to the conductor</li>
              <li style="margin-bottom: 8px;">Keep your phone charged for any updates</li>
              <li style="margin-bottom: 8px;">Download the QR code for easy boarding</li>
            </ul>
          </div>
          
          <!-- Action Button -->
          <div style="text-align: center; margin: 40px 0;">
            <a href="${process.env.FRONTEND_URL || 'http://localhost:5173'}/passenger/dashboard" 
               style="background: linear-gradient(135deg, #E91E63, #9C27B0); color: white; padding: 18px 35px; text-decoration: none; border-radius: 25px; display: inline-block; font-weight: bold; font-size: 16px; box-shadow: 0 4px 15px rgba(233, 30, 99, 0.3); transition: all 0.3s ease;">
              View My Bookings
            </a>
          </div>
        </div>
        
        <!-- Footer -->
        <div style="background: #f8f9fa; padding: 30px; text-align: center; color: #6c757d; font-size: 14px; border-top: 1px solid #e9ecef;">
          <p style="margin: 0 0 10px 0;">This is an automated email. Please do not reply to this message.</p>
          <p style="margin: 0; font-weight: 600;">&copy; 2024 YATRIK ERP. All rights reserved.</p>
          <div style="margin-top: 15px;">
            <a href="${process.env.FRONTEND_URL || 'http://localhost:5173'}" style="color: #E91E63; text-decoration: none; margin: 0 15px;">Visit Website</a>
            <a href="${process.env.FRONTEND_URL || 'http://localhost:5173'}/support" style="color: #E91E63; text-decoration: none; margin: 0 15px;">Support</a>
          </div>
        </div>
      </div>
    `
  })
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
