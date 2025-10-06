const express = require('express');
const router = express.Router();
const { sendEmail } = require('../config/email');
const crypto = require('crypto');

// In-memory OTP storage (in production, use Redis or database)
const otpStorage = new Map();

// OTP expiration time (5 minutes)
const OTP_EXPIRY_TIME = 5 * 60 * 1000;

// Generate 6-digit OTP
const generateOTP = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

// Clean expired OTPs
const cleanExpiredOTPs = () => {
  const now = Date.now();
  for (const [email, data] of otpStorage.entries()) {
    if (now - data.timestamp > OTP_EXPIRY_TIME) {
      otpStorage.delete(email);
    }
  }
};

// POST /api/otp/send - Send OTP to email
router.post('/send', async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        error: 'Email is required'
      });
    }

    // Validate email format
    const emailRegex = /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid email format'
      });
    }

    // Clean expired OTPs
    cleanExpiredOTPs();

    // Check if OTP was sent recently (prevent spam)
    const existingOTP = otpStorage.get(email.toLowerCase());
    if (existingOTP && (Date.now() - existingOTP.timestamp) < 30000) { // 30 seconds cooldown
      return res.status(429).json({
        success: false,
        error: 'Please wait 30 seconds before requesting another OTP'
      });
    }

    // Generate new OTP
    const otp = generateOTP();
    const timestamp = Date.now();

    // Store OTP
    otpStorage.set(email.toLowerCase(), {
      otp,
      timestamp,
      attempts: 0
    });

    // Create email content
    const emailSubject = 'YATRIK - Your OTP for Booking Verification';
    const emailHTML = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #E91E63, #F06292); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
          <h1 style="color: white; margin: 0; font-size: 28px;">🚌 YATRIK</h1>
          <p style="color: white; margin: 10px 0 0 0; font-size: 16px;">Your Trusted Travel Partner</p>
        </div>
        
        <div style="background: #f8f9fa; padding: 30px; border-radius: 0 0 10px 10px; border: 1px solid #e9ecef;">
          <h2 style="color: #333; text-align: center; margin-bottom: 20px;">🔐 Email Verification OTP</h2>
          
          <div style="background: white; padding: 25px; border-radius: 8px; text-align: center; margin: 20px 0; border: 2px solid #E91E63;">
            <p style="color: #666; margin: 0 0 15px 0; font-size: 16px;">Your verification code is:</p>
            <div style="background: #E91E63; color: white; font-size: 32px; font-weight: bold; padding: 15px; border-radius: 8px; letter-spacing: 5px; display: inline-block; min-width: 200px;">
              ${otp}
            </div>
          </div>
          
          <div style="background: #fff3cd; border: 1px solid #ffeaa7; padding: 15px; border-radius: 5px; margin: 20px 0;">
            <p style="color: #856404; margin: 0; font-size: 14px;">
              <strong>⏰ Important:</strong> This OTP will expire in 5 minutes. Please use it immediately for booking verification.
            </p>
          </div>
          
          <div style="background: #e8f5e8; border: 1px solid #c3e6c3; padding: 15px; border-radius: 5px; margin: 20px 0;">
            <p style="color: #2e7d32; margin: 0; font-size: 14px;">
              <strong>🔒 Security:</strong> Never share this OTP with anyone. YATRIK will never ask for your OTP via phone or email.
            </p>
          </div>
          
          <div style="text-align: center; margin: 30px 0;">
            <p style="color: #666; font-size: 14px; margin: 0;">
              If you didn't request this OTP, please ignore this email.
            </p>
          </div>
        </div>
        
        <div style="text-align: center; margin-top: 20px; color: #999; font-size: 12px;">
          <p>This is an automated email from YATRIK ERP System.</p>
          <p>&copy; 2024 YATRIK ERP. All rights reserved.</p>
        </div>
      </div>
    `;

    // Send email
    await sendEmail(email, emailHTML, emailSubject);

    console.log(`📧 OTP sent to ${email}: ${otp}`);

    res.json({
      success: true,
      message: 'OTP sent successfully to your email',
      expiresIn: '5 minutes'
    });

  } catch (error) {
    console.error('OTP sending error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to send OTP. Please try again.'
    });
  }
});

// POST /api/otp/verify - Verify OTP
router.post('/verify', async (req, res) => {
  try {
    const { email, otp } = req.body;

    if (!email || !otp) {
      return res.status(400).json({
        success: false,
        error: 'Email and OTP are required'
      });
    }

    // Clean expired OTPs
    cleanExpiredOTPs();

    // Get stored OTP data
    const storedData = otpStorage.get(email.toLowerCase());

    if (!storedData) {
      return res.status(400).json({
        success: false,
        error: 'No OTP found for this email. Please request a new OTP.'
      });
    }

    // Check if OTP is expired
    if (Date.now() - storedData.timestamp > OTP_EXPIRY_TIME) {
      otpStorage.delete(email.toLowerCase());
      return res.status(400).json({
        success: false,
        error: 'OTP has expired. Please request a new OTP.'
      });
    }

    // Check attempt limit (max 3 attempts)
    if (storedData.attempts >= 3) {
      otpStorage.delete(email.toLowerCase());
      return res.status(400).json({
        success: false,
        error: 'Too many failed attempts. Please request a new OTP.'
      });
    }

    // Verify OTP
    if (storedData.otp !== otp) {
      storedData.attempts += 1;
      otpStorage.set(email.toLowerCase(), storedData);
      
      return res.status(400).json({
        success: false,
        error: `Invalid OTP. ${3 - storedData.attempts} attempts remaining.`
      });
    }

    // OTP is valid - remove it from storage
    otpStorage.delete(email.toLowerCase());

    console.log(`✅ OTP verified for ${email}`);

    res.json({
      success: true,
      message: 'OTP verified successfully',
      verified: true
    });

  } catch (error) {
    console.error('OTP verification error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to verify OTP. Please try again.'
    });
  }
});

// POST /api/otp/check-status - Check OTP status (optional endpoint)
router.post('/check-status', async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        error: 'Email is required'
      });
    }

    const storedData = otpStorage.get(email.toLowerCase());

    if (!storedData) {
      return res.json({
        success: true,
        hasOTP: false,
        message: 'No active OTP found'
      });
    }

    const isExpired = Date.now() - storedData.timestamp > OTP_EXPIRY_TIME;
    const remainingTime = Math.max(0, OTP_EXPIRY_TIME - (Date.now() - storedData.timestamp));

    res.json({
      success: true,
      hasOTP: !isExpired,
      remainingTime: Math.floor(remainingTime / 1000), // in seconds
      attemptsRemaining: Math.max(0, 3 - storedData.attempts)
    });

  } catch (error) {
    console.error('OTP status check error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to check OTP status'
    });
  }
});

module.exports = router;

