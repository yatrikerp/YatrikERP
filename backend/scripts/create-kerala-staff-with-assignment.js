#!/usr/bin/env node

/**
 * Kerala Staff Creation and Assignment Script
 * 
 * This script creates Kerala Malayali staff (drivers and conductors) for all depots
 * and automatically assigns them to buses. It also sends email credentials to staff.
 * 
 * Usage:
 *   node create-kerala-staff-with-assignment.js
 * 
 * Environment Variables Required:
 *   MONGODB_URI - MongoDB connection string
 *   EMAIL_USER - Gmail username for sending emails
 *   EMAIL_PASS - Gmail app password
 *   FRONTEND_URL - Frontend URL for login links
 */

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const nodemailer = require('nodemailer');
require('dotenv').config();

// Import models
const Driver = require('../models/Driver');
const Conductor = require('../models/Conductor');
const Bus = require('../models/Bus');
const Depot = require('../models/Depot');
const User = require('../models/User');

// Kerala Malayali Names Database
const KERALA_MALAYALI_NAMES = {
  male: [
    'Rajesh', 'Suresh', 'Manoj', 'Sunil', 'Ravi', 'Kumar', 'Prakash', 'Vinod', 'Ajay', 'Vijay',
    'Sreekumar', 'Ramesh', 'Gopalan', 'Krishnan', 'Narayanan', 'Raman', 'Balakrishnan', 'Sasidharan',
    'Mohan', 'Santhosh', 'Babu', 'Chandran', 'Gopinath', 'Jayakumar', 'Krishnakumar', 'Murali',
    'Nandakumar', 'Prasad', 'Radhakrishnan', 'Sankar', 'Thampi', 'Unnikrishnan', 'Vasudevan',
    'Anand', 'Bharath', 'Deepak', 'Eswaran', 'Faisal', 'Ganesh', 'Harish', 'Ishwar', 'Jagan',
    'Karthik', 'Lakshmanan', 'Madhavan', 'Naveen', 'Oman', 'Pradeep', 'Raghavan', 'Sathish',
    'Thirumalai', 'Udayan', 'Vignesh', 'Wilson', 'Xavier', 'Yogesh', 'Zakir'
  ],
  female: [
    'Lakshmi', 'Saraswathi', 'Parvathi', 'Devi', 'Meera', 'Radha', 'Kavitha', 'Priya', 'Anitha',
    'Sunitha', 'Rekha', 'Shanti', 'Geetha', 'Leela', 'Kamala', 'Sushila', 'Indira', 'Malathi',
    'Vasanthi', 'Rajani', 'Sujatha', 'Usha', 'Rani', 'Kumari', 'Shobha', 'Pushpa', 'Latha',
    'Sandhya', 'Deepa', 'Nisha', 'Anjali', 'Divya', 'Kavya', 'Maya', 'Neha', 'Pooja', 'Riya',
    'Sita', 'Tara', 'Uma', 'Vidya', 'Yamuna', 'Zara', 'Aishwarya', 'Bhavana', 'Chitra', 'Dipika',
    'Esha', 'Fathima', 'Gayathri', 'Hema', 'Ishita', 'Jyothi', 'Kiran', 'Lakshmi', 'Meera', 'Nandini'
  ],
  surnames: [
    'Nair', 'Menon', 'Pillai', 'Kurup', 'Warrier', 'Thampi', 'Namboothiri', 'Nambiar', 'Panicker',
    'Unni', 'Kumar', 'Krishnan', 'Raman', 'Gopalan', 'Balakrishnan', 'Sasidharan', 'Chandran',
    'Gopinath', 'Jayakumar', 'Krishnakumar', 'Murali', 'Nandakumar', 'Prasad', 'Radhakrishnan',
    'Sankar', 'Thampi', 'Unnikrishnan', 'Vasudevan', 'Anand', 'Bharath', 'Deepak', 'Eswaran',
    'Faisal', 'Ganesh', 'Harish', 'Ishwar', 'Jagan', 'Karthik', 'Lakshmanan', 'Madhavan', 'Naveen',
    'Oman', 'Pradeep', 'Raghavan', 'Sathish', 'Thirumalai', 'Udayan', 'Vignesh', 'Wilson', 'Xavier'
  ]
};

// Kerala Districts and Cities
const KERALA_LOCATIONS = {
  districts: [
    'Thiruvananthapuram', 'Kollam', 'Pathanamthitta', 'Alappuzha', 'Kottayam', 'Idukki',
    'Ernakulam', 'Thrissur', 'Palakkad', 'Malappuram', 'Kozhikode', 'Wayanad', 'Kannur', 'Kasaragod'
  ],
  cities: [
    'Thiruvananthapuram', 'Kochi', 'Kozhikode', 'Thrissur', 'Kollam', 'Palakkad', 'Alappuzha',
    'Malappuram', 'Kannur', 'Kasaragod', 'Pathanamthitta', 'Kottayam', 'Idukki', 'Wayanad',
    'Perinthalmanna', 'Manjeri', 'Kodungallur', 'Chalakudy', 'Kochi', 'Mattancherry', 'Fort Kochi',
    'Aluva', 'Angamaly', 'Perumbavoor', 'Muvattupuzha', 'Kothamangalam', 'Thodupuzha', 'Adimali',
    'Munnar', 'Devikulam', 'Marayur', 'Udumbanchola', 'Peermade', 'Idukki', 'Thodupuzha'
  ]
};

// Email configuration
const emailTransporter = nodemailer.createTransporter({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

// Generate Kerala Malayali name
function generateKeralaName(gender = 'male') {
  const names = KERALA_MALAYALI_NAMES[gender];
  const surnames = KERALA_MALAYALI_NAMES.surnames;
  
  const firstName = names[Math.floor(Math.random() * names.length)];
  const lastName = surnames[Math.floor(Math.random() * surnames.length)];
  
  return `${firstName} ${lastName}`;
}

// Generate Kerala phone number
function generateKeralaPhone() {
  const prefixes = ['9446', '9447', '9448', '9449', '9744', '9745', '9746', '9747', '9846', '9847', '9848', '9849'];
  const prefix = prefixes[Math.floor(Math.random() * prefixes.length)];
  const suffix = Math.floor(Math.random() * 100000).toString().padStart(5, '0');
  return `${prefix}${suffix}`;
}

// Generate Kerala email
function generateKeralaEmail(name) {
  const cleanName = name.toLowerCase().replace(/\s+/g, '.');
  const domains = ['gmail.com', 'yahoo.com', 'hotmail.com', 'outlook.com'];
  const domain = domains[Math.floor(Math.random() * domains.length)];
  return `${cleanName}@${domain}`;
}

// Generate employee code
function generateEmployeeCode(role, depotCode, index) {
  const rolePrefix = role === 'driver' ? 'DRV' : 'CND';
  return `${rolePrefix}${depotCode}${String(index).padStart(3, '0')}`;
}

// Generate staff ID
function generateStaffId(role, depotCode, index) {
  const rolePrefix = role === 'driver' ? 'DRV' : 'CND';
  const year = new Date().getFullYear().toString().slice(-2);
  return `${rolePrefix}${depotCode}${year}${String(index).padStart(3, '0')}`;
}

// Generate username
function generateUsername(name, employeeCode) {
  const cleanName = name.toLowerCase().replace(/\s+/g, '');
  return `${cleanName}${employeeCode.slice(-3)}`;
}

// Generate password
function generatePassword() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*';
  let password = '';
  for (let i = 0; i < 8; i++) {
    password += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return password;
}

// Send credentials email
async function sendCredentialsEmail(staff, credentials) {
  try {
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: staff.email,
      subject: `Welcome to YATRIK ERP - ${staff.role === 'driver' ? 'Driver' : 'Conductor'} Credentials`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center;">
            <h1 style="color: white; margin: 0; font-size: 28px;">YATRIK ERP</h1>
            <p style="color: white; margin: 10px 0 0 0; font-size: 16px;">Kerala State Road Transport Corporation</p>
          </div>
          
          <div style="padding: 30px; background: #f8f9fa;">
            <h2 style="color: #333; margin-bottom: 20px;">Welcome ${staff.name}!</h2>
            
            <p style="color: #666; line-height: 1.6; margin-bottom: 20px;">
              Your ${staff.role === 'driver' ? 'Driver' : 'Conductor'} account has been created successfully. 
              You have been assigned to <strong>${staff.depotName}</strong> depot.
            </p>
            
            <div style="background: white; padding: 20px; border-radius: 8px; border-left: 4px solid #667eea; margin-bottom: 20px;">
              <h3 style="color: #333; margin-top: 0;">Login Credentials</h3>
              <table style="width: 100%; border-collapse: collapse;">
                <tr>
                  <td style="padding: 8px 0; border-bottom: 1px solid #eee;"><strong>Username:</strong></td>
                  <td style="padding: 8px 0; border-bottom: 1px solid #eee; color: #667eea;">${credentials.username}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; border-bottom: 1px solid #eee;"><strong>Password:</strong></td>
                  <td style="padding: 8px 0; border-bottom: 1px solid #eee; color: #667eea;">${credentials.password}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0;"><strong>Employee Code:</strong></td>
                  <td style="padding: 8px 0; color: #667eea;">${staff.employeeCode}</td>
                </tr>
              </table>
            </div>
            
            <div style="background: #e8f4fd; padding: 15px; border-radius: 8px; margin-bottom: 20px;">
              <h4 style="color: #1976d2; margin-top: 0;">Important Information:</h4>
              <ul style="color: #666; margin: 0; padding-left: 20px;">
                <li>Please change your password after first login</li>
                <li>Keep your credentials secure and confidential</li>
                <li>Contact depot manager for any assistance</li>
                <li>Download the mobile app for easy access</li>
              </ul>
            </div>
            
            <div style="text-align: center; margin-top: 30px;">
              <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/login" 
                 style="background: #667eea; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; display: inline-block;">
                Login to System
              </a>
            </div>
          </div>
          
          <div style="background: #333; color: white; padding: 20px; text-align: center; font-size: 12px;">
            <p style="margin: 0;">© 2024 YATRIK ERP - Kerala State Road Transport Corporation</p>
            <p style="margin: 5px 0 0 0;">This is an automated message. Please do not reply.</p>
          </div>
        </div>
      `
    };

    await emailTransporter.sendMail(mailOptions);
    console.log(`✅ Credentials email sent to ${staff.email}`);
  } catch (error) {
    console.error(`❌ Failed to send email to ${staff.email}:`, error.message);
  }
}

// Create staff for a depot
async function createStaffForDepot(depot, staffCount = { drivers: 5, conductors: 5 }) {
  console.log(`\n🚌 Creating staff for ${depot.depotName} (${depot.depotCode})...`);
  
  const createdStaff = { drivers: [], conductors: [] };
  
  // Create drivers
  for (let i = 1; i <= staffCount.drivers; i++) {
    try {
      const name = generateKeralaName('male');
      const employeeCode = generateEmployeeCode('driver', depot.depotCode, i);
      const staffId = generateStaffId('driver', depot.depotCode, i);
      const username = generateUsername(name, employeeCode);
      const password = generatePassword();
      const hashedPassword = await bcrypt.hash(password, 12);
      
      const driver = new Driver({
        driverId: staffId,
        name: name,
        phone: generateKeralaPhone(),
        email: generateKeralaEmail(name),
        employeeCode: employeeCode,
        depotId: depot._id,
        username: username,
        password: hashedPassword,
        status: 'active',
        address: {
          street: `${Math.floor(Math.random() * 999) + 1} Street`,
          city: KERALA_LOCATIONS.cities[Math.floor(Math.random() * KERALA_LOCATIONS.cities.length)],
          state: 'Kerala',
          pincode: `${Math.floor(Math.random() * 900000) + 100000}`
        },
        drivingLicense: {
          licenseNumber: `KL${Math.floor(Math.random() * 900000) + 100000}`,
          licenseType: 'HMV',
          issueDate: new Date(Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000 * 5), // Random date within last 5 years
          expiryDate: new Date(Date.now() + Math.random() * 365 * 24 * 60 * 60 * 1000 * 5), // Random date within next 5 years
          issuingAuthority: 'Kerala Motor Vehicles Department',
          status: 'valid'
        },
        salary: {
          basic: 25000 + Math.floor(Math.random() * 10000),
          allowances: 5000 + Math.floor(Math.random() * 3000),
          deductions: 2000 + Math.floor(Math.random() * 1000),
          netSalary: 0 // Will be calculated by pre-save middleware
        },
        health: {
          lastMedicalCheckup: new Date(Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000),
          nextMedicalCheckup: new Date(Date.now() + Math.random() * 365 * 24 * 60 * 60 * 1000),
          bloodGroup: ['A+', 'B+', 'AB+', 'O+', 'A-', 'B-', 'AB-', 'O-'][Math.floor(Math.random() * 8)],
          fitnessStatus: 'fit'
        },
        createdBy: new mongoose.Types.ObjectId() // You might want to set this to an actual admin user ID
      });
      
      await driver.save();
      createdStaff.drivers.push(driver);
      
      // Send credentials email
      await sendCredentialsEmail({
        ...driver.toObject(),
        role: 'driver',
        depotName: depot.depotName
      }, { username, password });
      
      console.log(`✅ Created driver: ${name} (${employeeCode})`);
    } catch (error) {
      console.error(`❌ Failed to create driver ${i}:`, error.message);
    }
  }
  
  // Create conductors
  for (let i = 1; i <= staffCount.conductors; i++) {
    try {
      const name = generateKeralaName(Math.random() > 0.7 ? 'female' : 'male'); // 30% female conductors
      const employeeCode = generateEmployeeCode('conductor', depot.depotCode, i);
      const staffId = generateStaffId('conductor', depot.depotCode, i);
      const username = generateUsername(name, employeeCode);
      const password = generatePassword();
      const hashedPassword = await bcrypt.hash(password, 12);
      
      const conductor = new Conductor({
        conductorId: staffId,
        name: name,
        phone: generateKeralaPhone(),
        email: generateKeralaEmail(name),
        employeeCode: employeeCode,
        depotId: depot._id,
        username: username,
        password: hashedPassword,
        status: 'active',
        address: {
          street: `${Math.floor(Math.random() * 999) + 1} Street`,
          city: KERALA_LOCATIONS.cities[Math.floor(Math.random() * KERALA_LOCATIONS.cities.length)],
          state: 'Kerala',
          pincode: `${Math.floor(Math.random() * 900000) + 100000}`
        },
        salary: {
          basic: 20000 + Math.floor(Math.random() * 8000),
          allowances: 4000 + Math.floor(Math.random() * 2000),
          deductions: 1500 + Math.floor(Math.random() * 1000),
          netSalary: 0 // Will be calculated by pre-save middleware
        },
        createdBy: new mongoose.Types.ObjectId() // You might want to set this to an actual admin user ID
      });
      
      await conductor.save();
      createdStaff.conductors.push(conductor);
      
      // Send credentials email
      await sendCredentialsEmail({
        ...conductor.toObject(),
        role: 'conductor',
        depotName: depot.depotName
      }, { username, password });
      
      console.log(`✅ Created conductor: ${name} (${employeeCode})`);
    } catch (error) {
      console.error(`❌ Failed to create conductor ${i}:`, error.message);
    }
  }
  
  return createdStaff;
}

// Auto-assign staff to buses
async function autoAssignStaffToBuses(depot) {
  console.log(`\n🚌 Auto-assigning staff to buses in ${depot.depotName}...`);
  
  // Get all buses for this depot
  const buses = await Bus.find({ depotId: depot._id, status: { $in: ['active', 'idle'] } });
  
  // Get available drivers and conductors for this depot
  const drivers = await Driver.find({ 
    depotId: depot._id, 
    status: 'active',
    $or: [
      { 'currentDuty.status': { $ne: 'in-progress' } },
      { currentDuty: { $exists: false } }
    ]
  });
  
  const conductors = await Conductor.find({ 
    depotId: depot._id, 
    status: 'active',
    $or: [
      { 'currentDuty.status': { $ne: 'in-progress' } },
      { currentDuty: { $exists: false } }
    ]
  });
  
  console.log(`📊 Found ${buses.length} buses, ${drivers.length} drivers, ${conductors.length} conductors`);
  
  let assignedCount = 0;
  
  for (const bus of buses) {
    try {
      // Find available driver
      const availableDriver = drivers.find(driver => 
        !driver.currentDuty || driver.currentDuty.status !== 'in-progress'
      );
      
      // Find available conductor
      const availableConductor = conductors.find(conductor => 
        !conductor.currentDuty || conductor.currentDuty.status !== 'in-progress'
      );
      
      if (availableDriver && availableConductor) {
        // Assign driver and conductor to bus
        bus.assignedDriver = availableDriver._id;
        bus.assignedConductor = availableConductor._id;
        bus.status = 'assigned';
        
        await bus.save();
        
        // Update driver and conductor current duty
        availableDriver.currentDuty = {
          busId: bus._id,
          status: 'assigned',
          startTime: new Date()
        };
        
        availableConductor.currentDuty = {
          busId: bus._id,
          status: 'assigned',
          startTime: new Date()
        };
        
        await availableDriver.save();
        await availableConductor.save();
        
        assignedCount++;
        console.log(`✅ Assigned ${availableDriver.name} (Driver) and ${availableConductor.name} (Conductor) to Bus ${bus.busNumber}`);
        
        // Remove assigned staff from available list
        drivers.splice(drivers.indexOf(availableDriver), 1);
        conductors.splice(conductors.indexOf(availableConductor), 1);
      } else {
        console.log(`⚠️  No available staff for Bus ${bus.busNumber}`);
      }
    } catch (error) {
      console.error(`❌ Failed to assign staff to Bus ${bus.busNumber}:`, error.message);
    }
  }
  
  console.log(`✅ Successfully assigned staff to ${assignedCount} buses`);
}

// Main function
async function createKeralaStaffWithAssignment() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/yatrik-erp');
    console.log('✅ Connected to MongoDB');
    
    // Get all depots
    const depots = await Depot.find({ status: 'active' });
    console.log(`📊 Found ${depots.length} active depots`);
    
    if (depots.length === 0) {
      console.log('❌ No active depots found. Please create depots first.');
      return;
    }
    
    // Process each depot
    for (const depot of depots) {
      try {
        // Create staff for this depot
        const staffCount = {
          drivers: Math.floor(Math.random() * 10) + 5, // 5-15 drivers
          conductors: Math.floor(Math.random() * 10) + 5 // 5-15 conductors
        };
        
        const createdStaff = await createStaffForDepot(depot, staffCount);
        
        // Auto-assign staff to buses
        await autoAssignStaffToBuses(depot);
        
        console.log(`✅ Completed processing for ${depot.depotName}`);
      } catch (error) {
        console.error(`❌ Failed to process depot ${depot.depotName}:`, error.message);
      }
    }
    
    console.log('\n🎉 Kerala staff creation and assignment completed successfully!');
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('✅ Disconnected from MongoDB');
  }
}

// Run the script
if (require.main === module) {
  createKeralaStaffWithAssignment();
}

module.exports = {
  createKeralaStaffWithAssignment,
  generateKeralaName,
  generateKeralaPhone,
  generateKeralaEmail,
  sendCredentialsEmail
};