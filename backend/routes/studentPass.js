const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const StudentPass = require('../models/StudentPass');
const { auth } = require('../middleware/auth');
const { logger } = require('../src/core/logger');
const bcrypt = require('bcryptjs');
const QRCode = require('qrcode');
const crypto = require('crypto');

// =================================================================
// STUDENT DASHBOARD
// =================================================================

// GET /api/student/dashboard - Student dashboard overview
router.get('/dashboard', auth, async (req, res) => {
  try {
    const studentId = req.user.studentId || req.user._id;
    
    const student = await StudentPass.findById(studentId);
    if (!student) {
      return res.status(404).json({
        success: false,
        message: 'Student pass not found'
      });
    }

    // Calculate statistics
    const remainingDays = student.getRemainingDays();
    const isExpired = student.isExpired();
    const isActive = student.validity?.isActive && !isExpired;

    // Get usage history count (mock for now)
    const usageCount = student.usageHistory?.length || 0;

    const dashboard = {
      studentPass: {
        name: student.personalDetails?.fullName || student.name || 'Student',
        email: student.personalDetails?.email || student.email,
        phone: student.personalDetails?.mobile || student.phone,
        passNumber: student.digitalPass?.passNumber || 'N/A',
        status: student.passStatus,
        passType: student.passType || 'student',
        eligibilityStatus: student.passStatus === 'approved' ? 'approved' : 'pending',
        qrCode: student.digitalPass?.qrCode || null,
        validityPeriod: {
          startDate: student.validity?.startDate || null,
          endDate: student.validity?.endDate || null
        }
      },
      stats: {
        totalTrips: usageCount,
        tripsThisMonth: usageCount, // Mock data
        totalDistance: usageCount * 10, // Mock: 10km per trip
        distanceThisMonth: usageCount * 10,
        passExpiryDays: remainingDays
      },
      subsidy: {
        totalSavings: student.payment?.amount ? (student.payment.amount * 0.5) : 0,
        savingsThisMonth: student.payment?.amount ? (student.payment.amount * 0.25) : 0
      },
      walletBalance: student.walletBalance || 0,
      pendingAmount: 0, // Calculate based on pending payments
      recentTrips: student.usageHistory?.slice(0, 5).map(trip => ({
        route: trip.route || 'N/A',
        travelDate: trip.travelDate,
        fare: trip.fare || 0,
        subsidyAmount: trip.subsidyAmount || 0
      })) || []
    };

    res.json({
      success: true,
      data: dashboard
    });
  } catch (error) {
    logger.error('Student dashboard error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch dashboard data',
      error: error.message
    });
  }
});

// GET /api/student/profile - Get student profile
router.get('/profile', auth, async (req, res) => {
  try {
    const studentId = req.user.studentId || req.user._id;
    
    const student = await StudentPass.findById(studentId);
    if (!student) {
      return res.status(404).json({
        success: false,
        message: 'Student pass not found'
      });
    }

    res.json({
      success: true,
      data: {
        studentPass: student
      }
    });
  } catch (error) {
    logger.error('Get student profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch profile',
      error: error.message
    });
  }
});

// GET /api/student/usage-history - Get usage history
router.get('/usage-history', auth, async (req, res) => {
  try {
    const studentId = req.user.studentId || req.user._id;
    const { limit = 50, page = 1 } = req.query;
    
    const student = await StudentPass.findById(studentId);
    if (!student) {
      return res.status(404).json({
        success: false,
        message: 'Student pass not found'
      });
    }

    const usageHistory = student.usageHistory || [];
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const paginatedHistory = usageHistory.slice(skip, skip + parseInt(limit));

    res.json({
      success: true,
      data: {
        usageHistory: paginatedHistory,
        total: usageHistory.length,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(usageHistory.length / parseInt(limit))
      }
    });
  } catch (error) {
    logger.error('Get usage history error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch usage history',
      error: error.message
    });
  }
});

// POST /api/student/renew - Renew student pass
router.post('/renew', auth, async (req, res) => {
  try {
    const studentId = req.user.studentId || req.user._id;
    
    const student = await StudentPass.findById(studentId);
    if (!student) {
      return res.status(404).json({
        success: false,
        message: 'Student pass not found'
      });
    }

    if (student.passStatus !== 'approved') {
      return res.status(400).json({
        success: false,
        message: 'Pass must be approved before renewal'
      });
    }

    // Extend validity by 1 year
    const currentEndDate = student.validity?.endDate || new Date();
    const newEndDate = new Date(currentEndDate);
    newEndDate.setFullYear(newEndDate.getFullYear() + 1);

    student.validity.endDate = newEndDate;
    student.validity.isActive = true;
    student.passStatus = 'approved';

    // Add to renewal history
    if (!student.renewalHistory) {
      student.renewalHistory = [];
    }
    student.renewalHistory.push({
      previousEndDate: currentEndDate,
      renewedAt: new Date(),
      renewedBy: req.user._id,
      amount: student.payment?.amount || 0
    });

    await student.save();

    res.json({
      success: true,
      message: 'Pass renewed successfully',
      data: {
        studentPass: student
      }
    });
  } catch (error) {
    logger.error('Renew pass error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to renew pass',
      error: error.message
    });
  }
});

// POST /api/student/register - Register new student (if needed)
router.post('/register', async (req, res) => {
  try {
    const {
      name,
      email,
      phone,
      password,
      aadhaarNumber,
      institution,
      course,
      studentId,
      dateOfBirth,
      gender
    } = req.body;

    // Check if student already exists
    const existingStudent = await StudentPass.findOne({
      $or: [
        { 'personalDetails.email': email?.toLowerCase() },
        { 'personalDetails.mobile': phone },
        { aadhaarNumber: aadhaarNumber }
      ]
    });

    if (existingStudent) {
      return res.status(400).json({
        success: false,
        message: 'Student already exists with this email, phone, or Aadhaar number'
      });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create new student pass
    const newStudent = new StudentPass({
      name: name,
      email: email?.toLowerCase(),
      phone: phone,
      password: hashedPassword,
      aadhaarNumber: aadhaarNumber,
      personalDetails: {
        fullName: name,
        email: email?.toLowerCase(),
        mobile: phone,
        dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : new Date('2000-01-01'),
        gender: gender || 'other'
      },
      educationalDetails: {
        institutionName: institution || 'Sample Institution',
        course: course || 'B.Tech',
        rollNumber: studentId || 'STU001'
      },
      passStatus: 'applied',
      status: 'pending'
    });

    await newStudent.save();

    res.status(201).json({
      success: true,
      message: 'Student registration successful. Awaiting approval.',
      data: {
        student: {
          _id: newStudent._id,
          name: newStudent.name,
          email: newStudent.email,
          phone: newStudent.phone
        }
      }
    });
  } catch (error) {
    logger.error('Student registration error:', error);
    res.status(500).json({
      success: false,
      message: 'Registration failed',
      error: error.message
    });
  }
});

// =================================================================
// CONCESSION MANAGEMENT
// =================================================================

// GET /api/student/concession/status - Get concession application status
router.get('/concession/status', auth, async (req, res) => {
  try {
    const studentId = req.user.studentId || req.user._id;
    const student = await StudentPass.findById(studentId);
    
    if (!student) {
      return res.status(404).json({
        success: false,
        message: 'Student not found'
      });
    }

    res.json({
      success: true,
      data: {
        status: student.passStatus || 'not_applied',
        appliedAt: student.createdAt,
        approvedAt: student.validity?.startDate,
        concessionRate: '50%',
        reason: student.rejectionReason || null
      }
    });
  } catch (error) {
    logger.error('Get concession status error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch concession status',
      error: error.message
    });
  }
});

// POST /api/student/concession/apply - Apply for concession
router.post('/concession/apply', auth, async (req, res) => {
  try {
    const studentId = req.user.studentId || req.user._id;
    const { institutionName, course, year, studentId: studentIdNumber } = req.body;
    
    const student = await StudentPass.findById(studentId);
    if (!student) {
      return res.status(404).json({
        success: false,
        message: 'Student not found'
      });
    }

    // Update educational details
    student.educationalDetails = {
      institutionName: institutionName || student.educationalDetails?.institutionName,
      course: course || student.educationalDetails?.course,
      rollNumber: studentIdNumber || student.educationalDetails?.rollNumber,
      year: year || student.educationalDetails?.year
    };

    student.passStatus = 'applied';
    student.status = 'pending';

    await student.save();

    res.json({
      success: true,
      message: 'Concession application submitted successfully',
      data: {
        status: 'pending',
        appliedAt: new Date()
      }
    });
  } catch (error) {
    logger.error('Apply concession error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to submit application',
      error: error.message
    });
  }
});

// =================================================================
// TRIP BOOKING
// =================================================================

// GET /api/student/routes - Get available routes
router.get('/routes', auth, async (req, res) => {
  try {
    // Mock routes data - in production, fetch from routes collection
    const routes = [
      {
        _id: '1',
        name: 'Route 1',
        from: 'City Center',
        to: 'University Campus',
        fare: 50,
        concessionFare: 25,
        departureTime: '08:00',
        arrivalTime: '08:45'
      },
      {
        _id: '2',
        name: 'Route 2',
        from: 'University Campus',
        to: 'City Center',
        fare: 50,
        concessionFare: 25,
        departureTime: '17:00',
        arrivalTime: '17:45'
      }
    ];

    res.json({
      success: true,
      data: { routes }
    });
  } catch (error) {
    logger.error('Get routes error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch routes',
      error: error.message
    });
  }
});

// POST /api/student/book - Book a trip
router.post('/book', auth, async (req, res) => {
  try {
    const studentId = req.user.studentId || req.user._id;
    const { route, date, time, boardingPoint, destinationPoint } = req.body;
    
    const student = await StudentPass.findById(studentId);
    if (!student) {
      return res.status(404).json({
        success: false,
        message: 'Student not found'
      });
    }

    // Add to usage history
    if (!student.usageHistory) {
      student.usageHistory = [];
    }

    const trip = {
      route: route,
      travelDate: new Date(date),
      boardingPoint: boardingPoint,
      destinationPoint: destinationPoint,
      fare: 25, // Concession fare
      subsidyAmount: 25,
      bookedAt: new Date()
    };

    student.usageHistory.push(trip);

    await student.save();

    res.json({
      success: true,
      message: 'Trip booked successfully',
      data: { trip }
    });
  } catch (error) {
    logger.error('Book trip error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to book trip',
      error: error.message
    });
  }
});

// =================================================================
// PAYMENTS
// =================================================================

// GET /api/student/payments - Get payment history
router.get('/payments', auth, async (req, res) => {
  try {
    const studentId = req.user.studentId || req.user._id;
    const student = await StudentPass.findById(studentId);
    
    if (!student) {
      return res.status(404).json({
        success: false,
        message: 'Student not found'
      });
    }

    // Mock payment history
    const payments = [
      {
        _id: '1',
        description: 'Pass Renewal',
        amount: 500,
        type: 'debit',
        status: 'success',
        date: new Date(),
        method: 'UPI'
      },
      {
        _id: '2',
        description: 'Wallet Top-up',
        amount: 1000,
        type: 'credit',
        status: 'success',
        date: new Date(Date.now() - 86400000),
        method: 'Card'
      }
    ];

    res.json({
      success: true,
      data: { payments }
    });
  } catch (error) {
    logger.error('Get payments error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch payments',
      error: error.message
    });
  }
});

// POST /api/student/payment/process - Process payment
router.post('/payment/process', auth, async (req, res) => {
  try {
    const { amount, method } = req.body;
    
    // Mock payment processing
    res.json({
      success: true,
      message: 'Payment processed successfully',
      data: {
        transactionId: 'TXN' + Date.now(),
        amount: amount,
        method: method,
        status: 'success'
      }
    });
  } catch (error) {
    logger.error('Process payment error:', error);
    res.status(500).json({
      success: false,
      message: 'Payment processing failed',
      error: error.message
    });
  }
});

// =================================================================
// NOTIFICATIONS
// =================================================================

// GET /api/student/notifications - Get notifications
router.get('/notifications', auth, async (req, res) => {
  try {
    const studentId = req.user.studentId || req.user._id;
    const student = await StudentPass.findById(studentId);
    
    if (!student) {
      return res.status(404).json({
        success: false,
        message: 'Student not found'
      });
    }

    // Get notifications from student or create mock
    let notifications = student.notifications || [];
    
    if (notifications.length === 0) {
      notifications = [
        {
          _id: '1',
          type: 'approval',
          title: 'Concession Approved',
          message: 'Your concession application has been approved.',
          read: false,
          createdAt: new Date()
        },
        {
          _id: '2',
          type: 'reminder',
          title: 'Pass Expiring Soon',
          message: 'Your pass will expire in 15 days. Please renew.',
          read: false,
          createdAt: new Date(Date.now() - 86400000)
        }
      ];
    }

    res.json({
      success: true,
      data: { notifications }
    });
  } catch (error) {
    logger.error('Get notifications error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch notifications',
      error: error.message
    });
  }
});

// POST /api/student/notifications/:id/read - Mark notification as read
router.post('/notifications/:id/read', auth, async (req, res) => {
  try {
    const studentId = req.user.studentId || req.user._id;
    const { id } = req.params;
    
    const student = await StudentPass.findById(studentId);
    if (student && student.notifications) {
      const notification = student.notifications.id(id);
      if (notification) {
        notification.read = true;
        await student.save();
      }
    }

    res.json({
      success: true,
      message: 'Notification marked as read'
    });
  } catch (error) {
    logger.error('Mark notification read error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update notification',
      error: error.message
    });
  }
});

// =================================================================
// SUPPORT & GRIEVANCES
// =================================================================

// GET /api/student/support/tickets - Get support tickets
router.get('/support/tickets', auth, async (req, res) => {
  try {
    // Mock support tickets
    const tickets = [
      {
        _id: '1',
        subject: 'Pass renewal issue',
        category: 'pass',
        message: 'I am unable to renew my pass.',
        status: 'open',
        createdAt: new Date()
      }
    ];

    res.json({
      success: true,
      data: { tickets }
    });
  } catch (error) {
    logger.error('Get support tickets error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch tickets',
      error: error.message
    });
  }
});

// POST /api/student/support/create - Create support ticket
router.post('/support/create', auth, async (req, res) => {
  try {
    const { subject, category, message } = req.body;
    
    const ticket = {
      _id: Date.now().toString(),
      subject: subject,
      category: category,
      message: message,
      status: 'open',
      createdAt: new Date()
    };

    res.json({
      success: true,
      message: 'Support ticket created successfully',
      data: { ticket }
    });
  } catch (error) {
    logger.error('Create support ticket error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create ticket',
      error: error.message
    });
  }
});

// =================================================================
// STUDENT PASS QR CODE & VALIDATION
// =================================================================

// GET /api/student/pass - Get digital pass with QR code (auto-generate if missing)
router.get('/pass', auth, async (req, res) => {
  try {
    const studentId = req.user.studentId || req.user._id;
    const student = await StudentPass.findById(studentId);
    
    if (!student) {
      return res.status(404).json({
        success: false,
        message: 'Student pass not found'
      });
    }
    
    // Check if pass is approved
    if (student.passStatus !== 'approved') {
      return res.status(400).json({
        success: false,
        message: 'Pass is not approved yet. Please wait for approval.',
        status: student.passStatus
      });
    }
    
    // Generate QR code if not exists
    if (!student.digitalPass?.qrCode) {
      // Generate pass number if not exists
      if (!student.digitalPass?.passNumber) {
        const count = await StudentPass.countDocuments();
        student.digitalPass = student.digitalPass || {};
        student.digitalPass.passNumber = `STU${String(count + 1).padStart(6, '0')}`;
      }
      
      // Create QR payload
      const qrPayload = {
        studentId: student._id.toString(),
        passNumber: student.digitalPass.passNumber,
        aadhaarNumber: student.aadhaarNumber,
        name: student.personalDetails?.fullName || student.name,
        institution: student.educationalDetails?.institutionName,
        validityStart: student.validity?.startDate?.toISOString(),
        validityEnd: student.validity?.endDate?.toISOString(),
        passType: 'student',
        concessionRate: '50%',
        issuedAt: new Date().toISOString(),
        version: '1.0'
      };
      
      // Add HMAC signature for security
      const secret = process.env.JWT_SECRET || 'secret';
      const signature = crypto.createHmac('sha256', secret)
        .update(JSON.stringify(qrPayload))
        .digest('hex');
      qrPayload.sig = signature;
      
      // Generate QR code image
      const qrCodeDataURL = await QRCode.toDataURL(JSON.stringify(qrPayload), {
        errorCorrectionLevel: 'H',
        type: 'image/png',
        width: 300,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#FFFFFF'
        }
      });
      
      // Update student pass
      student.digitalPass = {
        ...student.digitalPass,
        qrCode: qrCodeDataURL,
        generatedAt: new Date()
      };
      await student.save();
    }
    
    res.json({
      success: true,
      data: {
        pass: {
          passNumber: student.digitalPass.passNumber,
          qrCode: student.digitalPass.qrCode,
          validity: {
            startDate: student.validity?.startDate,
            endDate: student.validity?.endDate,
            isActive: student.validity?.isActive,
            remainingDays: student.getRemainingDays()
          },
          student: {
            name: student.personalDetails?.fullName || student.name,
            institution: student.educationalDetails?.institutionName,
            course: student.educationalDetails?.course,
            rollNumber: student.educationalDetails?.rollNumber
          },
          concessionRate: '50%',
          status: student.passStatus
        }
      }
    });
  } catch (error) {
    logger.error('Get student pass error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch pass',
      error: error.message
    });
  }
});

// POST /api/student/validate-pass - Validate student pass (for conductors)
router.post('/validate-pass', auth, async (req, res) => {
  try {
    const { qrPayload } = req.body;
    const conductorId = req.user._id;
    
    if (!qrPayload) {
      return res.status(400).json({
        success: false,
        message: 'QR code payload is required'
      });
    }
    
    // Parse QR payload
    let passData;
    try {
      passData = typeof qrPayload === 'string' ? JSON.parse(qrPayload) : qrPayload;
    } catch (parseError) {
      return res.status(400).json({
        success: false,
        message: 'Invalid QR code format'
      });
    }
    
    // Verify signature
    const secret = process.env.JWT_SECRET || 'secret';
    const receivedSig = passData.sig;
    delete passData.sig;
    const expectedSig = crypto.createHmac('sha256', secret)
      .update(JSON.stringify(passData))
      .digest('hex');
    
    if (receivedSig !== expectedSig) {
      return res.status(400).json({
        success: false,
        message: 'Invalid QR code signature - possible tampering detected'
      });
    }
    
    // Find student pass
    const student = await StudentPass.findById(passData.studentId);
    if (!student) {
      return res.status(404).json({
        success: false,
        message: 'Student pass not found'
      });
    }
    
    // Check pass status
    if (student.passStatus !== 'approved') {
      return res.status(400).json({
        success: false,
        message: 'Pass is not approved',
        status: student.passStatus
      });
    }
    
    // Check validity
    if (student.isExpired()) {
      return res.status(400).json({
        success: false,
        message: 'Pass has expired',
        expiryDate: student.validity?.endDate
      });
    }
    
    if (!student.validity?.isActive) {
      return res.status(400).json({
        success: false,
        message: 'Pass is not active'
      });
    }
    
    // Log usage
    if (!student.usageHistory) {
      student.usageHistory = [];
    }
    
    student.usageHistory.push({
      validatedAt: new Date(),
      validatedBy: conductorId,
      route: req.body.route || 'N/A',
      boardingPoint: req.body.boardingPoint || 'N/A',
      destinationPoint: req.body.destinationPoint || 'N/A',
      fare: req.body.fare || 0,
      subsidyAmount: req.body.fare ? req.body.fare * 0.5 : 0 // 50% concession
    });
    
    await student.save();
    
    res.json({
      success: true,
      message: 'Pass validated successfully',
      data: {
        valid: true,
        student: {
          name: student.personalDetails?.fullName || student.name,
          passNumber: student.digitalPass?.passNumber,
          institution: student.educationalDetails?.institutionName
        },
        validity: {
          isActive: true,
          remainingDays: student.getRemainingDays(),
          expiryDate: student.validity?.endDate
        },
        concessionRate: '50%',
        validatedAt: new Date()
      }
    });
  } catch (error) {
    logger.error('Validate student pass error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to validate pass',
      error: error.message
    });
  }
});

module.exports = router;
