/**
 * Unified Authentication Routes
 * Enterprise ERP - YATRIK
 * 
 * Single login system that automatically detects user role
 * and redirects to appropriate dashboard
 */

const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Vendor = require('../models/Vendor');
const StudentPass = require('../models/StudentPass');
const Driver = require('../models/Driver');
const Conductor = require('../models/Conductor');
const DepotUser = require('../models/DepotUser');
const { logger } = require('../src/core/logger');

/**
 * POST /api/auth/unified-login
 * Unified login endpoint for all user types
 * Auto-detects role and roleType
 */
router.post('/unified-login', async (req, res) => {
  try {
    const { email, password, phone, aadhaarNumber } = req.body;

    // Validate input
    const identifier = (email || phone || aadhaarNumber || '').toString().trim();
    const rawPassword = (password || '').toString();

    if (!identifier || !rawPassword) {
      return res.status(400).json({
        success: false,
        message: 'Email/Phone/Aadhaar and password are required'
      });
    }

    const normalizedIdentifier = identifier.toLowerCase();
    const isEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedIdentifier);
    const isPhone = /^[0-9]{10}$/.test(identifier);
    const isAadhaar = /^[0-9]{12}$/.test(identifier);

    let user = null;
    let userData = null;
    let role = null;
    let roleType = 'internal';
    let redirectPath = '/dashboard';

    // ============================================
    // 1. Check User Model (Internal + Passenger)
    // ============================================
    if (isEmail) {
      user = await User.findOne({ email: normalizedIdentifier })
        .select('+password')
        .lean();
    } else if (isPhone) {
      user = await User.findOne({ phone: identifier })
        .select('+password')
        .lean();
    }

    if (user) {
      // Verify password
      const isMatch = await bcrypt.compare(rawPassword, user.password);
      if (isMatch) {
        role = user.role || 'passenger';
        roleType = user.roleType || (['admin', 'depot_manager', 'conductor', 'driver', 'support_agent', 'data_collector'].includes(role) ? 'internal' : 'external');
        userData = {
          _id: user._id,
          name: user.name,
          email: user.email,
          phone: user.phone,
          role: role,
          roleType: roleType,
          status: user.status,
          depotId: user.depotId,
          profileCompleted: user.profileCompleted || false
        };

        // Determine redirect path
        if (roleType === 'internal') {
          redirectPath = `/dashboard/${role}`;
        } else {
          redirectPath = role === 'passenger' ? '/passenger/dashboard' : `/dashboard/${role}`;
        }
      } else {
        return res.status(401).json({
          success: false,
          message: 'Invalid credentials'
        });
      }
    }

    // ============================================
    // 2. Check Vendor Model (External)
    // ============================================
    if (!user && isEmail) {
      const vendor = await Vendor.findOne({ email: normalizedIdentifier })
        .select('+password');

      if (vendor) {
        const isMatch = await vendor.comparePassword(rawPassword);
        if (isMatch) {
          role = 'vendor';
          roleType = 'external';
          userData = {
            _id: vendor._id,
            name: vendor.companyName,
            email: vendor.email,
            phone: vendor.phone,
            role: 'vendor',
            roleType: 'external',
            status: vendor.status,
            vendorId: vendor._id,
            companyName: vendor.companyName,
            profileCompleted: vendor.verificationStatus === 'verified'
          };
          redirectPath = '/vendor/home';
        } else {
          return res.status(401).json({
            success: false,
            message: 'Invalid credentials'
          });
        }
      }
    }

    // ============================================
    // 3. Check StudentPass Model (External)
    // ============================================
    if (!user && !userData) {
      let student = null;
      
      if (isEmail) {
        student = await StudentPass.findOne({ email: normalizedIdentifier })
          .select('+password');
      } else if (isPhone) {
        student = await StudentPass.findOne({ phone: identifier })
          .select('+password');
      } else if (isAadhaar) {
        student = await StudentPass.findOne({ aadhaarNumber: identifier })
          .select('+password');
      }

      if (student) {
        const isMatch = await student.comparePassword(rawPassword);
        if (isMatch) {
          role = 'student';
          roleType = 'external';
          userData = {
            _id: student._id,
            name: student.name,
            email: student.email,
            phone: student.phone,
            role: 'student',
            roleType: 'external',
            status: student.status,
            studentId: student._id,
            aadhaarNumber: student.aadhaarNumber,
            passNumber: student.passNumber,
            profileCompleted: student.eligibilityStatus === 'approved'
          };
          redirectPath = '/student/pass';
        } else {
          return res.status(401).json({
            success: false,
            message: 'Invalid credentials'
          });
        }
      }
    }

    // ============================================
    // 4. Check Driver Model (Internal)
    // ============================================
    if (!user && !userData && isEmail) {
      const driver = await Driver.findOne({ email: normalizedIdentifier })
        .select('+password')
        .populate('depotId', 'depotName depotCode')
        .lean();

      if (driver) {
        const isMatch = await bcrypt.compare(rawPassword, driver.password);
        if (isMatch) {
          role = 'driver';
          roleType = 'internal';
          userData = {
            _id: driver._id,
            name: driver.name,
            email: driver.email,
            phone: driver.phone,
            role: 'driver',
            roleType: 'internal',
            status: driver.status,
            depotId: driver.depotId?._id,
            driverId: driver.driverId
          };
          redirectPath = '/dashboard/driver';
        }
      }
    }

    // ============================================
    // 5. Check Conductor Model (Internal)
    // ============================================
    if (!user && !userData && isEmail) {
      const conductor = await Conductor.findOne({ email: normalizedIdentifier })
        .select('+password')
        .populate('depotId', 'depotName depotCode')
        .lean();

      if (conductor) {
        const isMatch = await bcrypt.compare(rawPassword, conductor.password);
        if (isMatch) {
          role = 'conductor';
          roleType = 'internal';
          userData = {
            _id: conductor._id,
            name: conductor.name,
            email: conductor.email,
            phone: conductor.phone,
            role: 'conductor',
            roleType: 'internal',
            status: conductor.status,
            depotId: conductor.depotId?._id,
            conductorId: conductor.conductorId
          };
          redirectPath = '/dashboard/conductor';
        }
      }
    }

    // ============================================
    // 6. Check DepotUser Model (Internal)
    // ============================================
    if (!user && !userData) {
      let depotUser = null;
      if (isEmail) {
        depotUser = await DepotUser.findOne({ email: normalizedIdentifier })
          .select('+password')
          .lean();
      } else {
        depotUser = await DepotUser.findOne({ username: identifier })
          .select('+password')
          .lean();
      }

      if (depotUser) {
        const isMatch = await bcrypt.compare(rawPassword, depotUser.password);
        if (isMatch) {
          role = 'depot_manager';
          roleType = 'internal';
          userData = {
            _id: depotUser._id,
            name: depotUser.username,
            email: depotUser.email,
            role: 'depot_manager',
            roleType: 'internal',
            status: depotUser.status,
            depotId: depotUser.depotId,
            depotCode: depotUser.depotCode,
            depotName: depotUser.depotName
          };
          redirectPath = '/dashboard/depot_manager';
        }
      }
    }

    // ============================================
    // No user found
    // ============================================
    if (!userData) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    // ============================================
    // Check account status
    // ============================================
    if (userData.status === 'suspended') {
      return res.status(403).json({
        success: false,
        message: 'Account is suspended. Please contact administrator.'
      });
    }

    if (userData.status === 'pending' && roleType === 'external') {
      // External users with pending status can still login but may have limited access
      userData.isPending = true;
    }

    // ============================================
    // Generate JWT Token
    // ============================================
    const tokenPayload = {
      userId: userData._id,
      role: role.toUpperCase(),
      roleType: roleType,
      name: userData.name,
      email: userData.email
    };

    // Add role-specific IDs
    if (userData.vendorId) tokenPayload.vendorId = userData.vendorId;
    if (userData.studentId) tokenPayload.studentId = userData.studentId;
    if (userData.driverId) tokenPayload.driverId = userData.driverId;
    if (userData.conductorId) tokenPayload.conductorId = userData.conductorId;
    if (userData.depotId) tokenPayload.depotId = userData.depotId;
    if (userData.depotCode) tokenPayload.depotCode = userData.depotCode;
    if (userData.depotName) tokenPayload.depotName = userData.depotName;

    const token = jwt.sign(
      tokenPayload,
      process.env.JWT_SECRET || 'secret',
      { expiresIn: '7d' }
    );

    // Update last login (non-blocking)
    if (user && user._id) {
      User.findByIdAndUpdate(user._id, { lastLogin: new Date() })
        .catch(err => logger.warn('Failed to update last login:', err));
    }

    // ============================================
    // Return success response
    // ============================================
    return res.json({
      success: true,
      message: 'Login successful',
      token,
      user: userData,
      redirectPath
    });

  } catch (error) {
    logger.error('Unified login error:', error);
    return res.status(500).json({
      success: false,
      message: 'Login failed',
      error: error.message
    });
  }
});

/**
 * POST /api/auth/register-vendor
 * Vendor self-registration with auto-approval
 */
router.post('/register-vendor', async (req, res) => {
  try {
    const { companyName, email, password, panNumber, phone, companyType } = req.body;

    // Validation
    if (!companyName || !email || !password || !panNumber) {
      return res.status(400).json({
        success: false,
        message: 'Company name, email, password, and PAN are required'
      });
    }

    // Validate PAN format
    const panRegex = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/;
    const isValidPAN = panRegex.test(panNumber.toUpperCase());

    // Check for existing vendor (check both flat and nested structures)
    const normalizedEmail = email.toLowerCase();
    const normalizedPAN = panNumber.toUpperCase();
    
    const existingVendor = await Vendor.findOne({
      $or: [
        { email: normalizedEmail },
        { panNumber: normalizedPAN },
        { 'contactDetails.email': normalizedEmail },
        { 'businessDetails.panNumber': normalizedPAN }
      ]
    }).select('+password');

    // If vendor exists, attempt automatic login
    if (existingVendor) {
      logger.info(`[REGISTER] Vendor already exists: ${normalizedEmail}, attempting auto-login`);
      
      // Verify password
      const isPasswordMatch = await existingVendor.comparePassword(password);
      
      if (isPasswordMatch) {
        // Password matches - auto-login
        logger.info(`[REGISTER] Password matches, auto-logging in vendor: ${normalizedEmail}`);
        
        // Check account status
        if (existingVendor.status === 'suspended' || existingVendor.status === 'rejected') {
          return res.status(403).json({
            success: false,
            message: `Account is ${existingVendor.status}. Please contact administrator.`
          });
        }
        
        // Reset login attempts
        existingVendor.loginAttempts = 0;
        existingVendor.lockUntil = null;
        existingVendor.lastLogin = new Date();
        await existingVendor.save();
        
        // Generate token
        const token = jwt.sign(
          {
            userId: existingVendor._id,
            vendorId: existingVendor._id,
            role: 'VENDOR',
            roleType: 'external',
            email: existingVendor.email
          },
          process.env.JWT_SECRET || 'secret',
          { expiresIn: '7d' }
        );
        
        return res.status(200).json({
          success: true,
          message: 'Welcome back! You have been automatically logged in.',
          autoLogin: true,
          data: {
            vendor: {
              _id: existingVendor._id,
              companyName: existingVendor.companyName,
              email: existingVendor.email,
              status: existingVendor.status,
              autoApproved: existingVendor.autoApproved
            },
            token
          },
          redirectPath: '/vendor/home'
        });
      } else {
        // Password doesn't match
        return res.status(401).json({
          success: false,
          message: 'Email already registered. Please use the correct password to login.',
          emailExists: true
        });
      }
    }

    // Auto-approval logic: If PAN is valid, auto-approve
    const status = isValidPAN ? 'approved' : 'pending';
    const verificationStatus = isValidPAN ? 'verified' : 'pending';
    const autoApproved = isValidPAN;

    // Normalize companyType to match enum
    const validCompanyTypes = ['manufacturer', 'supplier', 'service_provider', 'other'];
    let normalizedCompanyType = (companyType || 'other').toLowerCase();
    if (!validCompanyTypes.includes(normalizedCompanyType)) {
      normalizedCompanyType = 'other';
    }
    
    // Create vendor (don't set userId for quick registration - omit it completely)
    // This avoids the unique constraint issue on userId field
    const vendor = new Vendor({
      companyName: companyName.trim(),
      companyType: normalizedCompanyType,
      email: email.toLowerCase().trim(),
      phone: phone ? phone.trim() : undefined,
      password,
      panNumber: panNumber.toUpperCase().trim(),
      status,
      verificationStatus,
      autoApproved,
      trustScore: isValidPAN ? 50 : 30,
      complianceScore: isValidPAN ? 50 : 30,
      deliveryReliabilityScore: 50
      // userId is intentionally omitted - will be undefined, not null
    });

    await vendor.save();

    // Generate token if auto-approved
    let token = null;
    if (autoApproved) {
      token = jwt.sign(
        {
          userId: vendor._id,
          vendorId: vendor._id,
          role: 'VENDOR',
          roleType: 'external',
          email: vendor.email
        },
        process.env.JWT_SECRET || 'secret',
        { expiresIn: '7d' }
      );
    }

    return res.status(201).json({
      success: true,
      message: autoApproved
        ? 'Vendor registered and approved automatically'
        : 'Vendor registered. Pending admin approval.',
      data: {
        vendor: {
          _id: vendor._id,
          companyName: vendor.companyName,
          email: vendor.email,
          status: vendor.status,
          autoApproved: vendor.autoApproved
        },
        token
      },
      redirectPath: autoApproved ? '/vendor/home' : '/login'
    });

  } catch (error) {
    logger.error('Vendor registration error:', error);
    logger.error('Error stack:', error.stack);
    logger.error('Error details:', {
      message: error.message,
      name: error.name,
      code: error.code,
      errors: error.errors
    });
    
    // Handle validation errors
    if (error.name === 'ValidationError') {
      const validationErrors = {};
      Object.keys(error.errors).forEach(key => {
        validationErrors[key] = error.errors[key].message;
      });
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: validationErrors,
        error: error.message
      });
    }
    
    // Handle duplicate key errors
    if (error.code === 11000) {
      const field = Object.keys(error.keyPattern || {})[0] || 'field';
      const fieldName = field === 'userId' ? 'User account' : field;
      
      // Special handling for userId duplicate - existing unique index needs to be dropped
      if (field === 'userId') {
        logger.warn('[REGISTER] userId duplicate error - existing unique index needs to be dropped');
        logger.warn('[REGISTER] Run: node backend/scripts/dropVendorUserIdIndex.js');
        return res.status(400).json({
          success: false,
          message: 'Database index conflict. Please run the index fix script.',
          error: 'userId unique index conflict',
          fix: 'Run: node backend/scripts/dropVendorUserIdIndex.js',
          details: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
      }
      
      return res.status(400).json({
        success: false,
        message: `${fieldName} already exists`,
        error: error.message
      });
    }
    
    return res.status(500).json({
      success: false,
      message: 'Registration failed',
      error: error.message,
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

/**
 * POST /api/auth/register-student
 * Student self-registration
 */
router.post('/register-student', async (req, res) => {
  try {
    const { 
      name, 
      email, 
      phone, 
      password, 
      aadhaarNumber, 
      dateOfBirth, 
      gender,
      institution, // Frontend sends: { name: string, type: string }
      institutionName, // Alternative direct field
      course,
      rollNumber,
      homeAddress,
      nearestBusStop,
      destinationBusStop,
      passDuration,
      passType // Frontend sends: 'student_concession' or similar
    } = req.body;

    // Validation
    if (!name || !phone || !password || !aadhaarNumber || !dateOfBirth) {
      return res.status(400).json({
        success: false,
        message: 'Name, phone, password, Aadhaar number, and date of birth are required'
      });
    }

    // Validate Aadhaar format
    const aadhaarRegex = /^[0-9]{12}$/;
    if (!aadhaarRegex.test(aadhaarNumber)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid Aadhaar number format (must be 12 digits)'
      });
    }

    // Check for existing student
    const existingStudent = await StudentPass.findOne({
      $or: [
        { aadhaarNumber },
        { email: email?.toLowerCase() },
        { 'personalDetails.email': email?.toLowerCase() },
        { phone },
        { 'personalDetails.mobile': phone }
      ]
    });

    if (existingStudent) {
      return res.status(400).json({
        success: false,
        message: 'Student pass already exists for this Aadhaar, email, or phone'
      });
    }

    // Calculate age
    const birthDate = new Date(dateOfBirth);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }

    // Extract institution name from object or direct field
    const finalInstitutionName = institutionName || (institution?.name) || 'Not Specified';
    
    // Set validity period based on passDuration or passType (must be: monthly, quarterly, yearly)
    const startDate = new Date();
    const endDate = new Date();
    let duration = passDuration || 'yearly';
    
    // Map passType to passDuration if passType is provided
    if (passType && !passDuration) {
      if (passType === 'annual' || passType === 'student_concession') {
        duration = 'yearly';
      } else if (passType === 'monthly') {
        duration = 'monthly';
      } else if (passType === 'quarterly') {
        duration = 'quarterly';
      }
    }
    
    // Normalize passDuration to match enum values
    if (duration === 'annual' || duration === 'student_concession') {
      duration = 'yearly';
    }
    
    // Ensure duration is one of the valid enum values
    if (!['monthly', 'quarterly', 'yearly'].includes(duration)) {
      duration = 'yearly';
    }
    
    if (duration === 'yearly') {
      endDate.setFullYear(endDate.getFullYear() + 1);
    } else if (duration === 'quarterly') {
      endDate.setMonth(endDate.getMonth() + 3);
    } else if (duration === 'monthly') {
      endDate.setMonth(endDate.getMonth() + 1);
    }

    // Validate email format for personalDetails.email (required field)
    const emailRegex = /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/;
    const studentEmail = email?.toLowerCase() || `student${Date.now()}@temp.com`;
    
    if (!emailRegex.test(studentEmail)) {
      return res.status(400).json({
        success: false,
        message: 'Valid email is required'
      });
    }

    // Validate phone format for personalDetails.mobile (required field)
    const phoneRegex = /^[\+]?[0-9]{7,15}$/;
    if (!phoneRegex.test(phone)) {
      return res.status(400).json({
        success: false,
        message: 'Valid mobile number is required (7-15 digits)'
      });
    }

    // Don't hash password here - let the pre-save hook handle it
    // Create student pass with correct schema structure
    const studentPass = new StudentPass({
      name: name,
      email: studentEmail,
      phone: phone,
      password: password, // Will be hashed by pre-save hook
      aadhaarNumber: aadhaarNumber,
      status: 'pending',
      personalDetails: {
        fullName: name,
        email: studentEmail,
        mobile: phone,
        dateOfBirth: birthDate,
        gender: gender || 'other'
      },
      educationalDetails: {
        institutionName: finalInstitutionName,
        course: course || 'Not Specified',
        rollNumber: (rollNumber || 'STU' + Date.now().toString().slice(-6)).toUpperCase()
      },
      travelDetails: {
        homeAddress: homeAddress || 'Not Specified',
        nearestBusStop: nearestBusStop || 'Not Specified',
        destinationBusStop: destinationBusStop || 'Not Specified',
        passDuration: duration
      },
      passStatus: 'applied',
      validity: {
        startDate: startDate,
        endDate: endDate,
        isActive: false
      }
    });

    await studentPass.save();

    // Generate token
    const token = jwt.sign(
      {
        userId: studentPass._id,
        studentId: studentPass._id,
        role: 'student',
        roleType: 'external',
        aadhaarNumber: studentPass.aadhaarNumber,
        name: studentPass.name || studentPass.personalDetails?.fullName,
        email: studentPass.email || studentPass.personalDetails?.email
      },
      process.env.JWT_SECRET || 'secret',
      { expiresIn: '7d' }
    );

    return res.status(201).json({
      success: true,
      message: 'Student registration successful. Awaiting approval.',
      data: {
        studentPass: {
          _id: studentPass._id,
          name: studentPass.name || studentPass.personalDetails?.fullName,
          email: studentPass.email || studentPass.personalDetails?.email,
          phone: studentPass.phone || studentPass.personalDetails?.mobile,
          passStatus: studentPass.passStatus,
          status: studentPass.status
        },
        token
      },
      redirectPath: '/student/dashboard'
    });

  } catch (error) {
    logger.error('Student registration error:', error);
    logger.error('Error details:', {
      message: error.message,
      name: error.name,
      stack: error.stack,
      errors: error.errors
    });
    
    // Handle Mongoose validation errors
    if (error.name === 'ValidationError') {
      const validationErrors = {};
      Object.keys(error.errors).forEach(key => {
        validationErrors[key] = error.errors[key].message;
      });
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: validationErrors,
        error: error.message
      });
    }
    
    // Handle duplicate key errors
    if (error.code === 11000) {
      const field = Object.keys(error.keyPattern)[0];
      return res.status(400).json({
        success: false,
        message: `${field} already exists`,
        error: error.message
      });
    }
    
    return res.status(500).json({
      success: false,
      message: 'Registration failed',
      error: error.message,
      details: process.env.NODE_ENV === 'development' ? {
        name: error.name,
        stack: error.stack,
        errors: error.errors
      } : undefined
    });
  }
});

module.exports = router;

