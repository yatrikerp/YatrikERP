const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const passport = require('passport');
const User = require('../models/User');
const DepotUser = require('../models/DepotUser');
const Driver = require('../models/Driver');
const Conductor = require('../models/Conductor');
const { sendEmail } = require('../config/email');
const { queueEmail } = require('../services/emailQueue');
const { validateRegistrationEmail, validateProfileUpdateEmail } = require('../middleware/emailValidation');
const { userValidations, handleValidationErrors } = require('../middleware/validation');
const { logger } = require('../src/core/logger');

// POST /api/auth/check-email - Check if email exists (checks User, Vendor, StudentPass)
router.post('/check-email', async (req, res) => {
  try {
    const { email } = req.body;
    
    if (!email) {
      return res.status(400).json({
        success: false,
        error: 'Email is required'
      });
    }

    // Validate email format - more lenient regex to handle @vendor.com
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid email format',
        details: 'Email must be in format: name@domain.com'
      });
    }

    const normalizedEmail = email.toLowerCase();
    
    // Check if user exists in User model
    const existingUser = await User.findOne({ email: normalizedEmail });
    if (existingUser) {
      return res.json({
        success: true,
        exists: true,
        message: 'Email already exists',
        type: 'user'
      });
    }

    // Check if vendor exists
    const Vendor = require('../models/Vendor');
    const existingVendor = await Vendor.findOne({ email: normalizedEmail });
    if (existingVendor) {
      return res.json({
        success: true,
        exists: true,
        message: 'Email already registered as vendor',
        type: 'vendor'
      });
    }

    // Check if student exists
    const StudentPass = require('../models/StudentPass');
    const existingStudent = await StudentPass.findOne({ email: normalizedEmail });
    if (existingStudent) {
      return res.json({
        success: true,
        exists: true,
        message: 'Email already registered as student',
        type: 'student'
      });
    }
    
    res.json({
      success: true,
      exists: false,
      message: 'Email available'
    });

  } catch (error) {
    logger.error('Email check error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error during email check'
    });
  }
});

// POST /api/auth/register
router.post('/register', userValidations.register, handleValidationErrors, validateRegistrationEmail, async (req, res) => {
  try {
    const { name, email, phone, password, role = 'passenger' } = req.body;

    // Check if user exists
    const existingUser = await User.findOne({ $or: [{ email }, { phone }] });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        error: 'User already exists'
      });
    }

    // Create user (password will be hashed by the model's pre-save middleware)
    const user = new User({ 
      name, 
      email, 
      phone, 
      password, // Let the model handle hashing
      role,
      authProvider: 'local' // Ensure authProvider is set for validation
    });
    await user.save();

    // Generate token
    const token = jwt.sign(
      { userId: user._id, role: (user.role || 'passenger').toUpperCase(), name: user.name, email: user.email },
      process.env.JWT_SECRET || 'secret',
      { expiresIn: '7d' }
    );

    // Queue welcome email ONLY for passengers
    if (String(user.role || '').toLowerCase() === 'passenger') {
      queueEmail(email, 'registrationWelcome', {
        userName: user.name,
        userEmail: user.email
      });
      logger.info('📧 Welcome email queued for passenger:', email);
    }

    res.status(201).json({
      success: true,
      data: { user: { ...user.toObject(), password: undefined }, token }
    });

  } catch (error) {
    logger.error('Registration error details:', error);
    res.status(500).json({
      success: false,
      error: 'Registration failed',
      details: error.message
    });
  }
});

// POST /api/auth/login - Unified login for all user types
router.post("/login", async (req, res) => {
  try {
    const { email, password, username } = req.body;

    // Normalize and trim inputs early
    const rawIdentifier = (email || username || '').toString().trim();
    const rawPassword = (password || '').toString();

    // OPTIMIZED: Fast input validation
    const identifier = rawIdentifier;
    if (!identifier || !rawPassword) {
      return res.status(400).json({ 
        success: false,
        message: "Email/username and password are required" 
      });
    }

    const normalizedIdentifier = identifier.toLowerCase();
    const isEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedIdentifier);

    // PRIORITY: Check for admin login first (admin@yatrik.com)
    if (isEmail && normalizedIdentifier === 'admin@yatrik.com') {
      try {
        logger.info('[AUTH] Admin login attempt detected');
        const adminUser = await User.findOne({ 
          email: 'admin@yatrik.com',
          role: 'admin'
        }).select('+password').lean();
        
        if (adminUser) {
          logger.info('[AUTH] Admin user found, verifying password...');
          
          // Verify password
          const isMatch = await bcrypt.compare(rawPassword, adminUser.password);
          
          if (isMatch) {
            // Check status
            if (adminUser.status !== 'active') {
              logger.warn(`[AUTH] Admin account status is ${adminUser.status}`);
              return res.status(403).json({ 
                success: false,
                message: `Admin account is ${adminUser.status}. Please contact system administrator.` 
              });
            }

            logger.info('[AUTH] Admin login successful');

            // Generate JWT token
            const token = jwt.sign(
              {
                userId: adminUser._id,
                role: 'ADMIN',
                roleType: 'internal',
                name: adminUser.name,
                email: adminUser.email
              },
              process.env.JWT_SECRET || 'secret',
              { expiresIn: '7d' }
            );

            // Update last login in background
            User.findByIdAndUpdate(adminUser._id, { 
              lastLogin: new Date(),
              loginAttempts: 0
            }).catch(err => logger.warn('Background admin login update failed:', err));

            return res.json({
              success: true,
              token,
              user: {
                _id: adminUser._id,
                name: adminUser.name,
                email: adminUser.email,
                role: 'admin',
                roleType: 'internal',
                status: adminUser.status
              },
              redirectPath: '/admin'
            });
          } else {
            logger.warn('[AUTH] Admin password mismatch');
            return res.status(401).json({ 
              success: false,
              message: 'Invalid email or password' 
            });
          }
        } else {
          logger.warn('[AUTH] Admin user not found in database');
          return res.status(401).json({ 
            success: false,
            message: 'Invalid email or password' 
          });
        }
      } catch (adminError) {
        logger.error('[AUTH] Admin login error:', adminError);
        logger.error('[AUTH] Admin login error stack:', adminError.stack);
        // Don't return 500 - continue to regular login flow instead
        // This allows fallback to regular user login if admin user doesn't exist
        // Only log the error but don't break the login flow
      }
    }

    // Check for driver email format: driver{number}@{depotname}-depot.com
    if (isEmail) {
      const driverMatch = normalizedIdentifier.match(/^driver(\d+)@([a-z0-9]+)-depot\.com$/);
      if (driverMatch) {
        const [, driverNumber, depotName] = driverMatch;
        const expectedPwd = 'Yatrik123';
        
        if (rawPassword === expectedPwd) {
          // Find the actual driver in database
          const driver = await Driver.findOne({ 
            email: normalizedIdentifier,
            status: 'active'
          }).populate('depotId', 'depotName depotCode');
          
          if (driver) {
            const token = jwt.sign(
              {
                driverId: driver._id,
                userId: driver._id,
                role: 'DRIVER',
                name: driver.name,
                email: driver.email,
                depotId: driver.depotId?._id,
                depotCode: driver.depotId?.depotCode,
                depotName: driver.depotId?.depotName,
                driverNumber: driverNumber,
                isDriver: true
              },
              process.env.JWT_SECRET || 'secret',
              { expiresIn: '12h' }
            );
            
            // Update last login
            driver.lastLogin = new Date();
            await driver.save();
            
            return res.json({ 
              success: true, 
              token, 
              user: {
                _id: driver._id,
                name: driver.name,
                email: driver.email,
                role: 'driver',
                depotId: driver.depotId?._id,
                depotCode: driver.depotId?.depotCode,
                depotName: driver.depotId?.depotName,
                driverNumber: driverNumber,
                isDriver: true
              }, 
              redirectPath: '/driver' 
            });
          } else {
            return res.status(401).json({
              success: false,
              message: 'Driver account not found or inactive'
            });
          }
        }
      }

      // Check for custom driver email format (e.g., suresh.driver@yatrik.com)
      const customDriverEmail = normalizedIdentifier.match(/^(.+)\.driver@yatrik\.com$/);
      if (customDriverEmail) {
        const driverName = customDriverEmail[1];
        logger.info(`🔍 [AUTH] Custom driver login attempt: ${normalizedIdentifier}`);
        
        // Try to find driver by email - explicitly select password field
        let driver = await Driver.findOne({ 
          email: normalizedIdentifier,
          status: 'active'
        }).select('+password').populate('depotId', 'depotName depotCode');
        
        logger.info(`🔍 [AUTH] Driver found by email:`, driver ? 'YES' : 'NO');
        
        // If not found by email, try by username - explicitly select password field
        if (!driver) {
          const username = normalizedIdentifier.split('@')[0];
          driver = await Driver.findOne({ 
            username: username,
            status: 'active'
          }).select('+password').populate('depotId', 'depotName depotCode');
          logger.info(`🔍 [AUTH] Driver found by username:`, driver ? 'YES' : 'NO');
        }
        
        if (driver) {
          logger.info(`🔍 [AUTH] Driver found: ${driver.name}, verifying password...`);
          // Verify password using bcrypt
          const isPasswordValid = await bcrypt.compare(rawPassword, driver.password);
          logger.info(`🔍 [AUTH] Password valid:`, isPasswordValid);
          
          if (isPasswordValid) {
            const token = jwt.sign(
              {
                driverId: driver._id,
                userId: driver._id,
                role: 'DRIVER',
                name: driver.name,
                email: driver.email,
                depotId: driver.depotId?._id,
                depotCode: driver.depotId?.depotCode,
                depotName: driver.depotId?.depotName,
                isDriver: true
              },
              process.env.JWT_SECRET || 'secret',
              { expiresIn: '12h' }
            );
            
            // Update last login
            driver.lastLogin = new Date();
            await driver.save();
            
            return res.json({ 
              success: true, 
              token, 
              user: {
                _id: driver._id,
                name: driver.name,
                email: driver.email,
                role: 'driver',
                depotId: driver.depotId?._id,
                depotCode: driver.depotId?.depotCode,
                depotName: driver.depotId?.depotName,
                isDriver: true
              }, 
              redirectPath: '/driver' 
            });
          } else {
            return res.status(401).json({
              success: false,
              message: 'Invalid password'
            });
          }
        } else {
          return res.status(401).json({
            success: false,
            message: 'Driver account not found or inactive'
          });
        }
      }

      // Check for custom conductor email format (e.g., conductor001.conductor@yatrik.com)
      const customConductorEmail = normalizedIdentifier.match(/^(.+)\.conductor@yatrik\.com$/);
      if (customConductorEmail) {
        logger.info(`🔍 [AUTH] Custom conductor login attempt: ${normalizedIdentifier}`);
        
        // Try to find conductor by email - explicitly select password field
        let conductor = await Conductor.findOne({ 
          email: normalizedIdentifier,
          status: 'active'
        }).select('+password').populate('depotId', 'depotName depotCode');
        
        logger.info(`🔍 [AUTH] Conductor found by email:`, conductor ? 'YES' : 'NO');
        
        // If not found by email, try by username - explicitly select password field
        if (!conductor) {
          const username = normalizedIdentifier.split('@')[0];
          conductor = await Conductor.findOne({ 
            username: username,
            status: 'active'
          }).select('+password').populate('depotId', 'depotName depotCode');
          logger.info(`🔍 [AUTH] Conductor found by username:`, conductor ? 'YES' : 'NO');
        }
        
        if (conductor) {
          logger.info(`🔍 [AUTH] Conductor found: ${conductor.name}, verifying password...`);
          // Verify password using bcrypt
          const isPasswordValid = await bcrypt.compare(rawPassword, conductor.password);
          logger.info(`🔍 [AUTH] Password valid:`, isPasswordValid);
          
          if (isPasswordValid) {
            const token = jwt.sign(
              {
                conductorId: conductor._id,
                userId: conductor._id,
                role: 'CONDUCTOR',
                name: conductor.name,
                email: conductor.email,
                depotId: conductor.depotId?._id,
                depotCode: conductor.depotId?.depotCode,
                depotName: conductor.depotId?.depotName,
                isConductor: true
              },
              process.env.JWT_SECRET || 'secret',
              { expiresIn: '12h' }
            );
            
            // Update last login
            conductor.lastLogin = new Date();
            await conductor.save();
            
            return res.json({ 
              success: true, 
              token, 
              user: {
                _id: conductor._id,
                name: conductor.name,
                email: conductor.email,
                role: 'conductor',
                depotId: conductor.depotId?._id,
                depotCode: conductor.depotId?.depotCode,
                depotName: conductor.depotId?.depotName,
                isConductor: true
              }, 
              redirectPath: '/conductor' 
            });
          } else {
            return res.status(401).json({
              success: false,
              message: 'Invalid password'
            });
          }
        } else {
          return res.status(401).json({
            success: false,
            message: 'Conductor account not found or inactive'
          });
        }
      }

      // Check for legacy conductor email format: conductor{number}@{depotname}-depot.com
      const conductorMatch = normalizedIdentifier.match(/^conductor(\d+)@([a-z0-9]+)-depot\.com$/);
      if (conductorMatch) {
        const [, conductorNumber, depotName] = conductorMatch;
        const expectedPwd = 'Yatrik123';

        if (rawPassword === expectedPwd) {
          // Find the actual conductor in database
          let conductor = await Conductor.findOne({
            email: normalizedIdentifier,
            status: 'active'
          }).populate('depotId', 'depotName depotCode');

          // Fallback: try by username if email is not stored
          if (!conductor) {
            const derivedUsername = `conductor${conductorNumber}`;
            conductor = await Conductor.findOne({
              username: derivedUsername,
              status: 'active'
            }).populate('depotId', 'depotName depotCode');
          }

          if (conductor) {
            const token = jwt.sign(
              {
                conductorId: conductor._id,
                userId: conductor._id,
                role: 'CONDUCTOR',
                name: conductor.name,
                email: conductor.email,
                depotId: conductor.depotId?._id,
                depotCode: conductor.depotId?.depotCode,
                depotName: conductor.depotId?.depotName,
                conductorNumber: conductorNumber,
                isConductor: true
              },
              process.env.JWT_SECRET || 'secret',
              { expiresIn: '12h' }
            );

            // Update last login
            conductor.lastLogin = new Date();
            await conductor.save();

            return res.json({
              success: true,
              token,
              user: {
                _id: conductor._id,
                name: conductor.name,
                email: conductor.email,
                role: 'conductor',
                depotId: conductor.depotId?._id,
                depotCode: conductor.depotId?.depotCode,
                depotName: conductor.depotId?.depotName,
                conductorNumber: conductorNumber,
                isConductor: true
              },
              redirectPath: '/conductor'
            });
          } else {
            // Synthetic success for pattern-based login without DB record
            const syntheticUser = {
              _id: `synthetic_conductor_${conductorNumber}`,
              name: `Conductor ${conductorNumber}`,
              email: normalizedIdentifier,
              role: 'conductor',
              status: 'active',
              depotId: null,
              depotCode: depotName?.toUpperCase(),
              depotName: depotName?.toUpperCase(),
              conductorNumber: conductorNumber,
              isConductor: true
            };

            const token = jwt.sign(
              {
                userId: syntheticUser._id,
                role: 'CONDUCTOR',
                name: syntheticUser.name,
                email: syntheticUser.email,
                conductorNumber: conductorNumber,
                depotCode: syntheticUser.depotCode,
                depotName: syntheticUser.depotName,
                isConductor: true
              },
              process.env.JWT_SECRET || 'secret',
              { expiresIn: '12h' }
            );

            return res.json({
              success: true,
              token,
              user: syntheticUser,
              redirectPath: '/conductor'
            });
          }
        }
      }
    }

    // Immediate success for depot-pattern credentials CODE@2024 (e.g., tvm001-depot@yatrik.com / TVM001@2024)
    if (isEmail) {
      const matchA = normalizedIdentifier.match(/^([a-z0-9]+)-depot@yatrik\.com$/);
      const matchB = normalizedIdentifier.match(/^depot-([a-z0-9]+)@yatrik\.com$/);
      const depotCodeRaw = (matchA && matchA[1]) || (matchB && matchB[1]) || null;
      if (depotCodeRaw) {
        const expectedPwd = `${depotCodeRaw.toUpperCase()}@2024`;
        if (password === expectedPwd) {
          const depotUser = {
            _id: '000000000000000000000000',
            name: depotCodeRaw.toUpperCase(),
            username: depotCodeRaw.toLowerCase(),
            email: normalizedIdentifier,
            role: 'depot_manager',
            status: 'active',
            depotCode: depotCodeRaw.toUpperCase(),
            depotName: null,
            isDepotUser: true
          };
          const token = jwt.sign(
            {
              userId: depotUser._id,
              role: 'DEPOT_MANAGER',
              name: depotUser.name,
              email: depotUser.email,
              depotCode: depotUser.depotCode,
              depotName: depotUser.depotName,
              isDepotUser: true
            },
            process.env.JWT_SECRET || 'secret',
            { expiresIn: '7d' }
          );
          return res.json({ success: true, token, user: depotUser, redirectPath: '/depot' });
        }
      }
    }
    
    // Check for depot email pattern: {depotname}-depot@yatrik.com or depot-{depotname}@yatrik.com
    const depotEmailPattern = /^([a-z0-9]+-depot|depot-[a-z0-9]+)@yatrik\.com$/;
    const isDepotEmail = isEmail && depotEmailPattern.test(normalizedIdentifier);
    
    let user = null;
    let userType = null;

    // Admin login bypass removed - all admin logins must use database authentication with bcrypt
    
    // Try different user types based on identifier
    if (isDepotEmail) {
      // Try to find depot user first
      const depotUser = await DepotUser.findOne({ email: normalizedIdentifier }).select('+password').lean();
      if (depotUser) {
        userType = 'depot';
        // Convert depot user to user format for consistency
        user = {
          _id: depotUser._id,
          name: depotUser.username,
          email: depotUser.email,
          password: depotUser.password,
          role: depotUser.role || 'depot_manager',
          status: depotUser.status,
          depotId: depotUser.depotId,
          depotCode: depotUser.depotCode,
          depotName: depotUser.depotName,
          permissions: depotUser.permissions,
          lastLogin: depotUser.lastLogin,
          isDepotUser: true
        };
      }
    } else if (!isEmail) {
      // Username-based login - check conductors and drivers
      // Try conductor first
      const Conductor = require('../models/Conductor');
      const conductor = await Conductor.findOne({ username: normalizedIdentifier }).select('+password').lean();
      if (conductor) {
        userType = 'conductor';
        user = {
          _id: conductor._id,
          name: conductor.name,
          email: conductor.email || `${conductor.username}@yatrik.com`,
          password: conductor.password,
          role: 'conductor',
          status: conductor.status,
          depotId: conductor.depotId,
          conductorId: conductor.conductorId,
          employeeCode: conductor.employeeCode
        };
      } else {
        // Try driver
        const Driver = require('../models/Driver');
        const driver = await Driver.findOne({ username: normalizedIdentifier }).select('+password').lean();
        if (driver) {
          userType = 'driver';
          user = {
            _id: driver._id,
            name: driver.name,
            email: driver.email || `${driver.username}@yatrik.com`,
            password: driver.password,
            role: 'driver',
            status: driver.status,
            depotId: driver.depotId,
            driverId: driver.driverId,
            employeeCode: driver.employeeCode
          };
        }
      }
    }
    
    // Check for Student BEFORE regular user (students have priority)
    if (!user && isEmail) {
      try {
        const StudentPass = require('../models/StudentPass');
        let student = null;
        
        student = await StudentPass.findOne({ 
          $or: [
            { email: normalizedIdentifier },
            { 'personalDetails.email': normalizedIdentifier }
          ]
        }).select('+password');
        
        if (student) {
          const isMatch = await student.comparePassword(rawPassword);
          if (isMatch) {
            if (student.status !== 'active' && student.status !== 'approved' && student.passStatus !== 'approved') {
              return res.status(403).json({ 
                success: false,
                message: `Student pass is ${student.status || student.passStatus}. Please contact administrator.` 
              });
            }
            
            const studentEmail = student.email || student.personalDetails?.email || '';
            const studentName = student.name || student.personalDetails?.fullName || 'Student';
            const studentPhone = student.phone || student.personalDetails?.mobile || '';
            
            const token = jwt.sign(
              {
                userId: student._id,
                studentId: student._id,
                email: studentEmail,
                role: 'student',
                roleType: 'external',
                aadhaarNumber: student.aadhaarNumber,
                name: studentName
              },
              process.env.JWT_SECRET || 'secret',
              { expiresIn: '7d' }
            );
            return res.json({
              success: true,
              token,
              user: {
                _id: student._id,
                name: studentName,
                email: studentEmail,
                phone: studentPhone,
                role: 'student',
                roleType: 'external',
                status: student.status || student.passStatus,
                studentId: student._id,
                aadhaarNumber: student.aadhaarNumber,
                passNumber: student.digitalPass?.passNumber || null
              },
              redirectPath: '/student/dashboard'
            });
          }
        }
      } catch (studentError) {
        logger.error('[AUTH] Student login error:', studentError);
        // Continue to next check
      }
    }
    
    // Check for Vendor if not found yet
    if (!user && isEmail) {
      try {
        const Vendor = require('../models/Vendor');
        logger.info(`[AUTH] Checking for vendor with email: ${normalizedIdentifier}`);
        const vendor = await Vendor.findOne({ 
          $or: [
            { email: normalizedIdentifier },
            { 'contactDetails.email': normalizedIdentifier }
          ]
        }).select('+password');
        
        if (vendor) {
          logger.info(`[AUTH] Vendor found: ${vendor.companyName}, status: ${vendor.status}`);
          
          // Check if account is locked
          if (vendor.lockUntil && vendor.lockUntil > Date.now()) {
            logger.warn(`[AUTH] Vendor account locked until: ${vendor.lockUntil}`);
            return res.status(423).json({ 
              success: false,
              message: 'Account is temporarily locked. Please try again later.' 
            });
          }

          // Verify password
          logger.info(`[AUTH] Verifying vendor password...`);
          const isMatch = await vendor.comparePassword(rawPassword);
          logger.info(`[AUTH] Password match: ${isMatch}`);
          
          if (isMatch) {
            // Check status
            if (vendor.status !== 'approved' && vendor.status !== 'active') {
              logger.warn(`[AUTH] Vendor status is ${vendor.status}, not approved/active`);
              return res.status(403).json({ 
                success: false,
                message: `Vendor account is ${vendor.status}. Please contact administrator.` 
              });
            }

            // Reset login attempts on successful login
            vendor.loginAttempts = 0;
            vendor.lockUntil = null;
            vendor.lastLogin = new Date();
            await vendor.save();

            logger.info(`[AUTH] Vendor login successful: ${vendor.companyName}`);

            // Generate JWT token
            const token = jwt.sign(
              {
                userId: vendor._id,
                vendorId: vendor._id,
                role: 'VENDOR',
                roleType: 'external',
                email: vendor.email,
                name: vendor.companyName
              },
              process.env.JWT_SECRET || 'secret',
              { expiresIn: '7d' }
            );

            // Return success response
            return res.json({
              success: true,
              token,
              user: {
                _id: vendor._id,
                name: vendor.companyName,
                email: vendor.email,
                phone: vendor.phone,
                role: 'vendor',
                roleType: 'external',
                status: vendor.status,
                vendorId: vendor._id,
                companyName: vendor.companyName,
                trustScore: vendor.trustScore,
                complianceScore: vendor.complianceScore
              },
              redirectPath: '/vendor/dashboard'
            });
          } else {
            // Increment login attempts on failed login
            vendor.loginAttempts = (vendor.loginAttempts || 0) + 1;
            if (vendor.loginAttempts >= 5) {
              vendor.lockUntil = new Date(Date.now() + 30 * 60 * 1000); // Lock for 30 minutes
              logger.warn(`[AUTH] Vendor account locked after 5 failed attempts`);
            }
            await vendor.save();
            
            logger.warn(`[AUTH] Vendor password mismatch for: ${normalizedIdentifier}`);
            return res.status(401).json({ 
              success: false,
              message: 'Invalid email or password' 
            });
          }
        } else {
          logger.info(`[AUTH] No vendor found with email: ${normalizedIdentifier}`);
        }
      } catch (vendorError) {
        logger.error('[AUTH] Vendor login error:', vendorError);
        logger.error('[AUTH] Vendor error stack:', vendorError.stack);
        // Continue to next check (don't fail completely)
      }
    }
    
    // If not found as special user type, try regular user
    if (!user && isEmail) {
      user = await User.findOne({ email: normalizedIdentifier }).select('+password').lean();
      if (user) {
        userType = 'regular';
      }
    }
    
    // Check for Student by phone or Aadhaar if not found yet
    if (!user) {
      try {
        const StudentPass = require('../models/StudentPass');
        let student = null;
        
        if (/^[0-9]{10}$/.test(identifier)) {
          // Phone number
          student = await StudentPass.findOne({ 
            $or: [
              { phone: identifier },
              { 'personalDetails.mobile': identifier }
            ]
          }).select('+password');
        } else if (/^[0-9]{12}$/.test(identifier)) {
          // Aadhaar number
          student = await StudentPass.findOne({ aadhaarNumber: identifier }).select('+password');
        }
        
        if (student) {
          const isMatch = await student.comparePassword(rawPassword);
          if (isMatch) {
            if (student.status !== 'active' && student.status !== 'approved' && student.passStatus !== 'approved') {
              return res.status(403).json({ 
                success: false,
                message: `Student pass is ${student.status || student.passStatus}. Please contact administrator.` 
              });
            }
            
            const studentEmail = student.email || student.personalDetails?.email || '';
            const studentName = student.name || student.personalDetails?.fullName || 'Student';
            const studentPhone = student.phone || student.personalDetails?.mobile || '';
            
            const token = jwt.sign(
              {
                userId: student._id,
                studentId: student._id,
                email: studentEmail,
                role: 'student',
                roleType: 'external',
                aadhaarNumber: student.aadhaarNumber,
                name: studentName
              },
              process.env.JWT_SECRET || 'secret',
              { expiresIn: '7d' }
            );
            return res.json({
              success: true,
              token,
              user: {
                _id: student._id,
                name: studentName,
                email: studentEmail,
                phone: studentPhone,
                role: 'student',
                roleType: 'external',
                status: student.status || student.passStatus,
                studentId: student._id,
                aadhaarNumber: student.aadhaarNumber,
                passNumber: student.digitalPass?.passNumber || null
              },
              redirectPath: '/student/dashboard'
            });
          }
        }
      } catch (studentError) {
        logger.error('[AUTH] Student login error:', studentError);
        // Continue to next check
      }
    }
    
    if (!user) {
      return res.status(401).json({ 
        success: false,
        message: "Invalid email or password" 
      });
    }

    // OPTIMIZED: Fast status checks
    if (user.status && user.status !== 'active') {
      return res.status(403).json({ 
        success: false,
        message: `Account is ${user.status}. Please contact administrator.` 
      });
    }

    // OPTIMIZED: Fast password comparison with bcrypt directly
    const isMatch = await bcrypt.compare(rawPassword, user.password);
    if (!isMatch) {
      // OPTIMIZED: Non-blocking login attempt increment
      User.findByIdAndUpdate(user._id, { $inc: { loginAttempts: 1 } }).catch(err => 
        logger.warn('Failed to increment login attempts:', err)
      );
      return res.status(401).json({ 
        success: false,
        message: "Invalid email or password" 
      });
    }

    // OPTIMIZED: Generate token immediately with roleType and depot-specific data
    const userRole = (user.role || 'passenger').toLowerCase();
    const roleType = user.roleType || (['admin', 'depot_manager', 'conductor', 'driver', 'support_agent', 'data_collector'].includes(userRole) ? 'internal' : 'external');
    
    const tokenPayload = {
      userId: user._id, 
      role: userRole.toUpperCase(), 
      roleType: roleType,
      name: user.name, 
      email: user.email
    };
    
    // Add depot-specific information if it's a depot user
    if (user.isDepotUser) {
      tokenPayload.depotId = user.depotId;
      tokenPayload.depotCode = user.depotCode;
      tokenPayload.depotName = user.depotName;
      tokenPayload.permissions = user.permissions;
      tokenPayload.isDepotUser = true;
    }
    
    const token = jwt.sign(
      tokenPayload,
      process.env.JWT_SECRET || 'secret',
      { expiresIn: '7d' }
    );

    // OPTIMIZED: Reset login attempts and update last login in background
    if (user.isDepotUser) {
      // Update depot user
      DepotUser.findByIdAndUpdate(user._id, { 
        loginAttempts: 0, 
        lastLogin: new Date() 
      }).catch(err => logger.warn('Background depot user login update failed:', err));
    } else {
      // Update regular user
      User.findByIdAndUpdate(user._id, { 
        loginAttempts: 0, 
        lastLogin: new Date() 
      }).catch(err => logger.warn('Background login update failed:', err));
    }

    // OPTIMIZED: Return response immediately for fastest login
    const { password: _removed, ...safeUser } = user;
    
    // Determine redirect path based on user role
    let redirectPath = '/pax'; // default for passengers
    
    if (user.isDepotUser || user.depotId || userRole === 'depot_manager') {
      redirectPath = '/depot';
    } else if (userRole === 'admin') {
      redirectPath = '/admin';
    } else if (userRole === 'conductor') {
      redirectPath = '/conductor';
    } else if (userRole === 'driver') {
      redirectPath = '/driver';
    } else if (userRole === 'passenger') {
      redirectPath = '/pax';
    }
    
    // Ensure depot-specific data is included in response
    const responseUser = {
      ...safeUser,
      role: user.role || 'passenger'
    };
    
    res.json({ 
      success: true,
      token, 
      user: responseUser,
      redirectPath: redirectPath
    });

    // OPTIMIZED: Queue login notification email in background (non-blocking)
    if (String(user.role || '').toLowerCase() === 'passenger' || String(user.role || '').toLowerCase() === 'user') {
      const clientIP = req.ip || req.connection.remoteAddress || req.headers['x-forwarded-for'] || 'Unknown';
      const loginTime = new Date().toLocaleString('en-IN', {
        timeZone: 'Asia/Kolkata',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
      });
      
      // Fetch latest trips and services in background
      setImmediate(async () => {
        try {
          // Import Trip model for fetching latest trips
          const Trip = require('../models/Trip');
          
          // Get latest 5 trips with available seats
          const latestTrips = await Trip.find({
            status: 'scheduled',
            departureTime: { $gte: new Date() }
          })
          .populate('route', 'name')
          .populate('bus', 'busNumber totalSeats')
          .sort({ departureTime: 1 })
          .limit(5)
          .lean();

          // Format trips data for email
          const formattedTrips = latestTrips.map(trip => ({
            route: trip.route?.name || 'N/A',
            departureTime: trip.departureTime ? new Date(trip.departureTime).toLocaleString('en-IN', {
              timeZone: 'Asia/Kolkata',
              day: 'numeric',
              month: 'short',
              hour: '2-digit',
              minute: '2-digit'
            }) : 'N/A',
            fare: trip.fare || 'N/A',
            availableSeats: trip.bus ? (trip.bus.totalSeats - (trip.bookedSeats?.length || 0)) : 'N/A'
          }));

          // Define new services/features
          const newServices = [
            {
              name: 'Real-time Bus Tracking',
              description: 'Track your bus in real-time and get live updates on departure and arrival times.'
            },
            {
              name: 'QR Code Boarding',
              description: 'Show your QR ticket to the conductor for quick and contactless boarding.'
            },
            {
              name: 'Smart Notifications',
              description: 'Get instant updates about delays, route changes, and important announcements.'
            }
          ];

          // Queue email with enhanced data
          queueEmail(user.email, 'loginNotification', {
            userName: user.name,
            loginTime: loginTime,
            ipAddress: clientIP,
            userRole: user.role || 'passenger',
            latestTrips: formattedTrips,
            newServices: newServices
          });
          
          logger.info('📧 Enhanced login notification email queued for passenger:', user.email);
        } catch (err) {
          logger.warn('Failed to fetch trip data for login email:', err);
          
          // Fallback: send basic login notification
          queueEmail(user.email, 'loginNotification', {
            userName: user.name,
            loginTime: loginTime,
            ipAddress: clientIP,
            userRole: user.role || 'passenger'
          });
        }
      });
    }

  } catch (error) {
    logger.error('[AUTH] Login error:', error);
    logger.error('[AUTH] Login error stack:', error.stack);
    logger.error('[AUTH] Login error details:', {
      message: error.message,
      name: error.name,
      identifier: identifier ? identifier.substring(0, 20) + '...' : 'N/A'
    });
    
    // Don't expose internal error details in production
    const errorMessage = process.env.NODE_ENV === 'development' 
      ? `Login failed: ${error.message}`
      : 'Login failed. Please try again.';
    
    res.status(500).json({ 
      success: false,
      message: errorMessage,
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// POST /api/auth/forgot-password
router.post('/forgot-password', async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        error: 'Email is required'
      });
    }

    // Check if user exists
    const user = await User.findOne({ email });
    if (!user) {
      // Don't reveal if user exists or not for security
      return res.json({
        success: true,
        message: 'If an account with that email exists, a password reset link has been sent.'
      });
    }

    // Generate a secure reset token
    const crypto = require('crypto');
    const resetToken = crypto.randomBytes(32).toString('hex');
    
    // Store reset token in user document with expiration (24 hours)
    user.resetPasswordToken = resetToken;
    user.resetPasswordExpires = Date.now() + 24 * 60 * 60 * 1000; // 24 hours
    await user.save();

    // Create reset link
    const resetLink = `${oauthConfig.frontendURL}/reset-password?token=${resetToken}`;
    
    // Send email with reset link
    const emailResult = await sendEmail(email, 'passwordReset', {
      resetLink: resetLink,
      userName: user.name
    });

    if (emailResult.success) {
      logger.info(`Password reset email sent to ${email}`);
      res.json({
        success: true,
        message: 'Password reset link has been sent to your email.'
      });
    } else {
      logger.error('Failed to send email:', emailResult.error);
      // Still return success to user, but log the email failure
      res.json({
        success: true,
        message: 'Password reset link has been sent to your email.'
      });
    }

  } catch (error) {
    logger.error('Forgot password error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to process password reset request'
    });
  }
});

// POST /api/auth/reset-password
router.post('/reset-password', async (req, res) => {
  try {
    const { token, newPassword } = req.body;

    if (!token || !newPassword) {
      return res.status(400).json({
        success: false,
        error: 'Token and new password are required'
      });
    }

    // Find user with valid reset token
    const user = await User.findOne({
      resetPasswordToken: token,
      resetPasswordExpires: { $gt: Date.now() }
    });

    if (!user) {
      return res.status(400).json({
        success: false,
        error: 'Invalid or expired reset token'
      });
    }

    // Update password and clear reset token
    user.password = newPassword;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;
    await user.save();

    res.json({
      success: true,
      message: 'Password has been reset successfully'
    });

  } catch (error) {
    logger.error('Reset password error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to reset password'
    });
  }
});

// GET /api/auth/me - Get current user profile for redirection
router.get('/me', async (req, res) => {
  try {
    const auth = req.headers.authorization || '';
    const token = auth.startsWith('Bearer ') ? auth.slice(7) : '';
    
    if (!token) {
      return res.status(401).json({ 
        success: false, 
        error: 'No token provided' 
      });
    }

    const payload = jwt.verify(token, process.env.JWT_SECRET || 'secret');
    const role = (payload.role || '').toUpperCase();
    const roleType = payload.roleType || 'internal';
    
    // PRIORITY: Check Vendor first if token indicates vendor
    let user = null;
    if (role === 'VENDOR' || (roleType === 'external' && payload.vendorId)) {
      const Vendor = require('../models/Vendor');
      const vendor = await Vendor.findById(payload.vendorId || payload.userId)
        .select('_id companyName email phone status trustScore complianceScore verificationStatus')
        .lean();
      
      if (vendor) {
        user = {
          _id: vendor._id,
          name: vendor.companyName,
          email: vendor.email,
          phone: vendor.phone,
          role: 'vendor',
          roleType: 'external',
          status: vendor.status,
          vendorId: vendor._id,
          companyName: vendor.companyName,
          trustScore: vendor.trustScore,
          complianceScore: vendor.complianceScore,
          verificationStatus: vendor.verificationStatus
        };
        logger.info('[AUTH/ME] Vendor profile fetched:', vendor.companyName);
      }
    }
    
    // Check if it's a depot user, conductor, or driver based on token payload
    if (!user && payload.isDepotUser) {
      user = await DepotUser.findById(payload.userId).select('-password');
      if (user) {
        // Convert depot user to standard format
        user = {
          _id: user._id,
          name: user.username,
          email: user.email,
          role: user.role || 'depot_manager',
          depotId: user.depotId,
          depotCode: user.depotCode,
          depotName: user.depotName,
          permissions: user.permissions,
          status: user.status,
          isDepotUser: true
        };
      }
    } else if (!user && payload.conductorId) {
      // Handle conductor token
      const conductor = await Conductor.findById(payload.conductorId).select('-password');
      if (conductor) {
        user = {
          _id: conductor._id,
          name: conductor.name,
          email: conductor.email || `${conductor.username}@yatrik.com`,
          role: 'conductor',
          depotId: conductor.depotId,
          username: conductor.username,
          conductorId: conductor.conductorId,
          employeeCode: conductor.employeeCode,
          status: conductor.status,
          isDepotUser: false
        };
      }
    } else if (payload.driverId) {
      // Handle driver token
      const driver = await Driver.findById(payload.driverId).select('-password');
      if (driver) {
        user = {
          _id: driver._id,
          name: driver.name,
          email: driver.email || `${driver.username}@yatrik.com`,
          role: 'driver',
          depotId: driver.depotId,
          username: driver.username,
          driverId: driver.driverId,
          licenseNumber: driver.licenseNumber,
          status: driver.status,
          isDepotUser: false
        };
      }
    } else {
      // Regular user
      user = await User.findById(payload.userId).select('-password');
    }
    
    // Synthetic admin support when DB user is missing
    if (!user && String(payload.role || '').toUpperCase() === 'ADMIN' && String(payload.email || '').toLowerCase() === 'admin@yatrik.com') {
      user = {
        _id: payload.userId || '000000000000000000000000',
        name: payload.name || 'System Admin',
        email: 'admin@yatrik.com',
        role: 'admin',
        status: 'active',
        isDepotUser: false
      };
    }

    if (!user) {
      return res.status(401).json({ 
        success: false, 
        error: 'User not found' 
      });
    }

    // Build response user object with all relevant fields
    const responseUser = {
      id: user._id, 
      _id: user._id,
      name: user.name, 
      email: user.email,
      role: user.role, 
      roleType: user.roleType || (user.role === 'vendor' || user.role === 'student' ? 'external' : 'internal'),
      depotId: user.depotId || null,
      depotCode: user.depotCode || null,
      depotName: user.depotName || null,
      permissions: user.permissions || null,
      status: user.status,
      isDepotUser: user.isDepotUser || false
    };
    
    // Add vendor-specific fields
    if (user.role === 'vendor' || user.vendorId) {
      responseUser.vendorId = user.vendorId || user._id;
      responseUser.companyName = user.companyName || user.name;
      responseUser.trustScore = user.trustScore;
      responseUser.complianceScore = user.complianceScore;
      responseUser.verificationStatus = user.verificationStatus;
    }
    
    // Add student-specific fields
    if (user.role === 'student' || user.studentId) {
      responseUser.studentId = user.studentId || user._id;
      responseUser.passNumber = user.passNumber;
      responseUser.aadhaarNumber = user.aadhaarNumber;
    }

    return res.json({ 
      success: true, 
      data: { 
        user: responseUser
      }
    });
  } catch (error) {
    logger.error('Auth me error:', error);
    return res.status(401).json({ 
      success: false, 
      error: 'Invalid token' 
    });
  }
});

// OAuth routes - RESTRICTED TO PASSENGERS ONLY
// Staff members (conductors, drivers, depot managers, admins) must use email/password authentication
router.get('/google', (req, res, next) => {
  // Determine redirect URL based on environment
  const redirectURL = process.env.NODE_ENV === 'development' 
    ? 'http://localhost:3000'
    : (process.env.FRONTEND_URL || 'https://yatrikerp.live');
  
  // Pass the 'next' parameter directly to Google OAuth
  const nextParam = req.query.next || '/pax';
  passport.authenticate('google', { 
    scope: ['profile', 'email'],
    state: Buffer.from(JSON.stringify({ next: nextParam })).toString('base64')
  })(req, res, next);
});

const oauthConfig = require('../config/oauth');

router.get('/google/callback', (req, res, next) => {
  // Determine redirect URL based on environment
  const redirectURL = process.env.NODE_ENV === 'development' 
    ? 'http://localhost:3000'
    : (process.env.FRONTEND_URL || 'https://yatrikerp.live');
  
  passport.authenticate('google', { failureRedirect: `${redirectURL}/login` })(req, res, next);
}, async (req, res) => {
  try {
    // Determine redirect URL based on environment
    const redirectURL = process.env.NODE_ENV === 'development' 
      ? 'http://localhost:3000'
      : (process.env.FRONTEND_URL || 'https://yatrikerp.live');
    
    const user = req.user;
    
    // Generate JWT token instantly
    const token = jwt.sign({ 
      userId: user._id, 
      role: (user.role || 'passenger').toUpperCase(),
      name: user.name,
      email: user.email
    }, oauthConfig.jwtSecret, { expiresIn: oauthConfig.jwtExpire });
    
    // Get the 'next' parameter from state (faster than session)
    let nextParam = '/pax';
    try {
      if (req.query.state) {
        const stateData = JSON.parse(Buffer.from(req.query.state, 'base64').toString());
        nextParam = stateData.next || '/pax';
      }
    } catch (e) {
      // Fallback to default if state parsing fails
      nextParam = '/pax';
    }
    
    // Encode user data (remove password)
    const userParam = encodeURIComponent(JSON.stringify({ ...user.toObject(), password: undefined }));
    
    // Instant redirect with all data
    const redirectUrl = `${redirectURL}/oauth/callback?token=${encodeURIComponent(token)}&user=${userParam}&next=${encodeURIComponent(nextParam)}`;
    res.redirect(redirectUrl);
  } catch (err) {
    logger.error('Google OAuth callback error:', err);
    const redirectURL = process.env.NODE_ENV === 'development' 
      ? 'http://localhost:3000'
      : (process.env.FRONTEND_URL || 'https://yatrikerp.live');
    res.redirect(`${redirectURL}/login`);
  }
});

router.get('/twitter', (req, res, next) => {
  // Store the 'next' parameter in the session for the callback
  if (req.query.next) {
    req.session.oauthNext = req.query.next;
  }
  passport.authenticate('twitter')(req, res, next);
});

router.get('/twitter/callback', passport.authenticate('twitter', { failureRedirect: oauthConfig.frontendURL + '/login' }), async (req, res) => {
  try {
    const user = req.user;
    const token = jwt.sign({ 
      userId: user._id, 
      role: (user.role || 'passenger').toUpperCase(),
      name: user.name,
      email: user.email
    }, oauthConfig.jwtSecret, { expiresIn: oauthConfig.jwtExpire });
    const userParam = encodeURIComponent(JSON.stringify({ ...user.toObject(), password: undefined }));
    
    // Get the stored 'next' parameter from session
    const nextParam = req.session.oauthNext || '/pax';
    delete req.session.oauthNext; // Clean up session
    
    const redirectUrl = `${oauthConfig.frontendURL}/oauth/callback?token=${encodeURIComponent(token)}&user=${userParam}&next=${encodeURIComponent(nextParam)}`;
    res.redirect(redirectUrl);
  } catch (err) {
    res.redirect(oauthConfig.frontendURL + '/login');
  }
});

router.get('/microsoft', (req, res, next) => {
  // Store the 'next' parameter in the session for the callback
  if (req.query.next) {
    req.session.oauthNext = req.query.next;
  }
  passport.authenticate('microsoft')(req, res, next);
});

router.get('/microsoft/callback', (req, res, next) => {
  // Determine redirect URL based on environment
  const redirectURL = process.env.NODE_ENV === 'development' 
    ? 'http://localhost:3000'
    : (process.env.FRONTEND_URL || 'https://yatrikerp.live');
  
  passport.authenticate('microsoft', { failureRedirect: `${redirectURL}/login` })(req, res, next);
}, async (req, res) => {
  try {
    // Determine redirect URL based on environment
    const redirectURL = process.env.NODE_ENV === 'development' 
      ? 'http://localhost:3000'
      : (process.env.FRONTEND_URL || 'https://yatrikerp.live');
    
    const user = req.user;
    const token = jwt.sign({ 
      userId: user._id, 
      role: (user.role || 'passenger').toUpperCase(),
      name: user.name,
      email: user.email
    }, oauthConfig.jwtSecret, { expiresIn: oauthConfig.jwtExpire });
    const userParam = encodeURIComponent(JSON.stringify({ ...user.toObject(), password: undefined }));
    
    // Get the stored 'next' parameter from session
    const nextParam = req.session.oauthNext || '/pax';
    delete req.session.oauthNext; // Clean up session
    
    const redirectUrl = `${redirectURL}/oauth/callback?token=${encodeURIComponent(token)}&user=${userParam}&next=${encodeURIComponent(nextParam)}`;
    res.redirect(redirectUrl);
  } catch (err) {
    const redirectURL = process.env.NODE_ENV === 'development' 
      ? 'http://localhost:3000'
      : (process.env.FRONTEND_URL || 'https://yatrikerp.live');
    res.redirect(`${redirectURL}/login`);
  }
});

module.exports = router;
 
// Unified role-based login
// POST /api/auth/role-login
// Body: { role: 'admin'|'passenger'|'depot'|'driver'|'conductor', username/email/phone, password }
router.post('/role-login', async (req, res) => {
  try {
    const { role, username, email, phone, password } = req.body;
    if (!role || !password) return res.status(400).json({ success: false, message: 'Role and password are required' });

    const normalizedRole = String(role).toLowerCase();

    if (normalizedRole === 'admin' || normalizedRole === 'passenger' || normalizedRole === 'user') {
      const identifier = (email || phone || username || '').toString().trim().toLowerCase();
      if (!identifier) return res.status(400).json({ success: false, message: 'Email/phone required' });
      const user = await User.findOne({ $or: [{ email: identifier }, { phone: identifier }] }).select('+password');
      if (!user) return res.status(401).json({ success: false, message: 'Invalid credentials' });
      const ok = await bcrypt.compare(password, user.password);
      if (!ok) return res.status(401).json({ success: false, message: 'Invalid credentials' });
      if (user.status && user.status !== 'active') return res.status(403).json({ success: false, message: 'Account is not active' });
      const token = jwt.sign({ userId: user._id, role: (user.role || 'passenger').toUpperCase(), name: user.name, email: user.email }, process.env.JWT_SECRET || 'secret', { expiresIn: '7d' });
      const { password: _pw, ...safe } = user.toObject();
      return res.json({ success: true, token, user: safe });
    }

    if (normalizedRole === 'depot' || normalizedRole === 'depot_manager' || normalizedRole === 'depot-supervisor' || normalizedRole === 'depot-operator') {
      const identifier = (username || email || '').toString().trim().toLowerCase();
      if (!identifier) return res.status(400).json({ success: false, message: 'Username/email required' });
      const user = await DepotUser.findOne({ $or: [{ username: identifier }, { email: identifier }] }).select('+password');
      if (!user) return res.status(401).json({ success: false, message: 'Invalid credentials' });
      const ok = await bcrypt.compare(password, user.password);
      if (!ok) return res.status(401).json({ success: false, message: 'Invalid credentials' });
      if (user.status !== 'active') return res.status(403).json({ success: false, message: `Account is ${user.status}` });
      const token = jwt.sign({ userId: user._id, username: user.username, role: (user.role || 'depot_manager').toUpperCase(), depotId: user.depotId, depotCode: user.depotCode, permissions: user.permissions }, process.env.JWT_SECRET || 'secret', { expiresIn: '24h' });
      return res.json({ success: true, token, user: { _id: user._id, username: user.username, email: user.email, name: user.username, role: user.role || 'depot_manager', depotId: user.depotId, depotCode: user.depotCode, depotName: user.depotName, permissions: user.permissions, status: user.status, lastLogin: new Date() } });
    }

    if (normalizedRole === 'driver') {
      const identifier = (username || '').toString().trim();
      if (!identifier) return res.status(400).json({ success: false, message: 'Username required' });
      const driver = await Driver.findOne({ username: identifier }).select('+password');
      if (!driver) return res.status(401).json({ success: false, message: 'Invalid credentials' });
      const ok = await bcrypt.compare(password, driver.password);
      if (!ok) return res.status(401).json({ success: false, message: 'Invalid credentials' });
      if (driver.status !== 'active') return res.status(403).json({ success: false, message: 'Account is not active' });
      const token = jwt.sign({ driverId: driver._id, username: driver.username, depotId: driver.depotId, role: 'DRIVER' }, process.env.JWT_SECRET || 'secret', { expiresIn: '12h' });
      return res.json({ success: true, token, user: { _id: driver._id, name: driver.name, username: driver.username, role: 'driver', depotId: driver.depotId } });
    }

    if (normalizedRole === 'conductor') {
      const identifier = (username || '').toString().trim();
      if (!identifier) return res.status(400).json({ success: false, message: 'Username required' });
      const conductor = await Conductor.findOne({ username: identifier }).select('+password');
      if (!conductor) return res.status(401).json({ success: false, message: 'Invalid credentials' });
      const ok = await bcrypt.compare(password, conductor.password);
      if (!ok) return res.status(401).json({ success: false, message: 'Invalid credentials' });
      if (conductor.status !== 'active') return res.status(403).json({ success: false, message: 'Account is not active' });
      const token = jwt.sign({ conductorId: conductor._id, username: conductor.username, depotId: conductor.depotId, role: 'CONDUCTOR' }, process.env.JWT_SECRET || 'secret', { expiresIn: '12h' });
      return res.json({ success: true, token, user: { _id: conductor._id, name: conductor.name, username: conductor.username, role: 'conductor', depotId: conductor.depotId } });
    }

    return res.status(400).json({ success: false, message: 'Unsupported role' });
  } catch (error) {
    logger.error('Role login error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});
