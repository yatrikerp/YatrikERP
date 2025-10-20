// Create Sample Users Only - Support Agents and Data Collectors
const mongoose = require('mongoose');
require('dotenv').config();

// Import models
const User = require('./models/User');

async function createSampleUsers() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/yatrik-erp');
    console.log('Connected to MongoDB');

    // Clear existing sample data
    console.log('Clearing existing sample data...');
    await User.deleteMany({ role: { $in: ['support_agent', 'data_collector'] } });

    // Create Support Agents
    console.log('Creating Support Agents...');
    const supportAgents = await User.insertMany([
      {
        name: 'Sarah Johnson',
        email: 'sarah.support@yatrik.com',
        username: 'sarah_support',
        password: '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', // password
        role: 'support_agent',
        phone: '9876543210',
        employeeId: 'SUP-001',
        department: 'Customer Support',
        status: 'active',
        permissions: ['booking_lookup', 'refund_process', 'ticket_validation'],
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        name: 'Michael Chen',
        email: 'michael.support@yatrik.com',
        username: 'michael_support',
        password: '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', // password
        role: 'support_agent',
        phone: '9876543211',
        employeeId: 'SUP-002',
        department: 'Customer Support',
        status: 'active',
        permissions: ['booking_lookup', 'refund_process', 'ticket_validation'],
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        name: 'Priya Sharma',
        email: 'priya.support@yatrik.com',
        username: 'priya_support',
        password: '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', // password
        role: 'support_agent',
        phone: '9876543212',
        employeeId: 'SUP-003',
        department: 'Customer Support',
        status: 'active',
        permissions: ['booking_lookup', 'refund_process', 'ticket_validation'],
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ]);
    console.log(`✅ Created ${supportAgents.length} Support Agents`);

    // Create Data Collectors
    console.log('Creating Data Collectors...');
    const dataCollectors = await User.insertMany([
      {
        name: 'David Kumar',
        email: 'david.data@yatrik.com',
        username: 'david_data',
        password: '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', // password
        role: 'data_collector',
        phone: '9876543213',
        employeeId: 'DC-001',
        department: 'Data Management',
        status: 'active',
        permissions: ['data_upload', 'data_validation', 'report_generation'],
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        name: 'Lisa Thomas',
        email: 'lisa.data@yatrik.com',
        username: 'lisa_data',
        password: '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', // password
        role: 'data_collector',
        phone: '9876543214',
        employeeId: 'DC-002',
        department: 'Data Management',
        status: 'active',
        permissions: ['data_upload', 'data_validation', 'report_generation'],
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ]);
    console.log(`✅ Created ${dataCollectors.length} Data Collectors`);

    // Create sample CSV file
    const fs = require('fs');
    const path = require('path');
    const uploadDir = path.join(__dirname, 'uploads/ticket-data');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    
    const sampleCSVContent = `Date,Time,Route,Stop,Passenger_Name,Seat,Fare,Payment_Method
2024-10-11,09:15,KOCHI-ALAPPUZHA,Kochi Central,John Doe,A1,250,Cash
2024-10-11,09:18,KOCHI-ALAPPUZHA,Edappally,Jane Smith,A2,250,UPI
2024-10-11,09:22,KOCHI-ALAPPUZHA,Cherthala,Bob Wilson,B1,250,Card
2024-10-11,09:25,KOCHI-ALAPPUZHA,Kochi Central,Alice Johnson,B2,250,UPI
2024-10-11,09:28,KOCHI-ALAPPUZHA,Edappally,Charlie Brown,C1,250,Cash
2024-10-11,09:30,KOCHI-ALAPPUZHA,Cherthala,Diana Prince,C2,250,Card
2024-10-11,09:32,KOCHI-ALAPPUZHA,Kochi Central,Eve Adams,C3,250,UPI
2024-10-11,09:35,KOCHI-ALAPPUZHA,Edappally,Frank Miller,C4,250,Cash
2024-10-11,09:38,KOCHI-ALAPPUZHA,Cherthala,Grace Lee,D1,250,UPI
2024-10-11,09:40,KOCHI-ALAPPUZHA,Kochi Central,Henry Davis,D2,250,Card`;

    const csvFilePath = path.join(uploadDir, 'sample_ticket_data.csv');
    fs.writeFileSync(csvFilePath, sampleCSVContent);
    console.log('✅ Created sample CSV file:', csvFilePath);

    console.log('\n🎉 SAMPLE USERS CREATED SUCCESSFULLY!');
    console.log('\n📊 Summary:');
    console.log(`- Support Agents: ${supportAgents.length}`);
    console.log(`- Data Collectors: ${dataCollectors.length}`);
    
    console.log('\n🔑 Test Credentials:');
    console.log('\n🎧 Support Agents:');
    supportAgents.forEach((agent, index) => {
      console.log(`  ${index + 1}. ${agent.name}`);
      console.log(`     Email: ${agent.email}`);
      console.log(`     Username: ${agent.username}`);
      console.log(`     Password: password`);
      console.log('');
    });
    
    console.log('📊 Data Collectors:');
    dataCollectors.forEach((collector, index) => {
      console.log(`  ${index + 1}. ${collector.name}`);
      console.log(`     Email: ${collector.email}`);
      console.log(`     Username: ${collector.username}`);
      console.log(`     Password: password`);
      console.log('');
    });

    console.log('🎯 Access URLs:');
    console.log('• Support Agent Dashboard: http://localhost:5173/support');
    console.log('• Data Collector Dashboard: http://localhost:5173/data-collector');
    console.log('• Admin Panel Support: http://localhost:5173/admin/support-agents');
    console.log('• Admin Panel Data: http://localhost:5173/admin/data-collectors');

    console.log('\n📋 Sample Data for Testing:');
    console.log('• Sample CSV file created with 10 passenger records');
    console.log('• File location: backend/uploads/ticket-data/sample_ticket_data.csv');
    console.log('• Sample PNRs for testing: PNR123456789, PNR123456790, PNR123456791');

    console.log('\n🎯 What Support Agents Can Do:');
    console.log('• Search bookings by PNR, phone, or email');
    console.log('• Process refunds and cancellations');
    console.log('• Handle customer service issues');
    console.log('• View booking details and trip information');

    console.log('\n📊 What Data Collectors Can Do:');
    console.log('• Upload ticket machine CSV files');
    console.log('• View data processing results');
    console.log('• Generate analytics reports');
    console.log('• Monitor data quality and errors');

  } catch (error) {
    console.error('Error creating sample users:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\nDisconnected from MongoDB');
  }
}

// Run the script
if (require.main === module) {
  createSampleUsers();
}

module.exports = { createSampleUsers };
