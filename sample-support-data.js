// Sample Data for Support Agents and Data Collectors
// Run this script to populate the system with sample data

const mongoose = require('mongoose');
require('dotenv').config();

// Import models
const User = require('./backend/models/User');
const Booking = require('./backend/models/Booking');
const Ticket = require('./backend/models/Ticket');
const TicketMachineData = require('./backend/models/TicketMachineData');
const Transaction = require('./backend/models/Transaction');
const AuditLog = require('./backend/models/AuditLog');
const Depot = require('./backend/models/Depot');
const Bus = require('./backend/models/Bus');
const Route = require('./backend/models/Route');
const Trip = require('./backend/models/Trip');

// Sample Support Agent Data
const sampleSupportAgents = [
  {
    name: 'Sarah Johnson',
    email: 'sarah.support@yatrik.com',
    username: 'sarah_support',
    password: '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', // password
    role: 'support_agent',
    phone: '+91 9876543210',
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
    phone: '+91 9876543211',
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
    phone: '+91 9876543212',
    employeeId: 'SUP-003',
    department: 'Customer Support',
    status: 'active',
    permissions: ['booking_lookup', 'refund_process', 'ticket_validation'],
    createdAt: new Date(),
    updatedAt: new Date()
  }
];

// Sample Data Collectors
const sampleDataCollectors = [
  {
    name: 'David Kumar',
    email: 'david.data@yatrik.com',
    username: 'david_data',
    password: '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', // password
    role: 'data_collector',
    phone: '+91 9876543213',
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
    phone: '+91 9876543214',
    employeeId: 'DC-002',
    department: 'Data Management',
    status: 'active',
    permissions: ['data_upload', 'data_validation', 'report_generation'],
    createdAt: new Date(),
    updatedAt: new Date()
  }
];

// Sample Bookings for Support Testing
const sampleBookings = [
  {
    bookingId: 'BK-2024-001',
    passengerName: 'John Doe',
    passengerEmail: 'john.doe@email.com',
    passengerPhone: '+91 9876543210',
    pnr: 'PNR123456789',
    tripId: null, // Will be set after trip creation
    routeId: null, // Will be set after route creation
    busId: null, // Will be set after bus creation
    seatNumber: 'A1',
    fareAmount: 250,
    status: 'confirmed',
    paymentStatus: 'paid',
    paymentMethod: 'upi',
    bookingDate: new Date('2024-10-11T08:00:00Z'),
    travelDate: new Date('2024-10-11T09:00:00Z'),
    boardingStop: 'Kochi Central',
    destinationStop: 'Alappuzha Central',
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    bookingId: 'BK-2024-002',
    passengerName: 'Jane Smith',
    passengerEmail: 'jane.smith@email.com',
    passengerPhone: '+91 9876543211',
    pnr: 'PNR123456790',
    tripId: null,
    routeId: null,
    busId: null,
    seatNumber: 'A2',
    fareAmount: 250,
    status: 'confirmed',
    paymentStatus: 'paid',
    paymentMethod: 'cash',
    bookingDate: new Date('2024-10-11T08:15:00Z'),
    travelDate: new Date('2024-10-11T09:00:00Z'),
    boardingStop: 'Edappally',
    destinationStop: 'Alappuzha Central',
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    bookingId: 'BK-2024-003',
    passengerName: 'Bob Wilson',
    passengerEmail: 'bob.wilson@email.com',
    passengerPhone: '+91 9876543212',
    pnr: 'PNR123456791',
    tripId: null,
    routeId: null,
    busId: null,
    seatNumber: 'B1',
    fareAmount: 250,
    status: 'cancelled',
    paymentStatus: 'refunded',
    paymentMethod: 'card',
    bookingDate: new Date('2024-10-10T10:00:00Z'),
    travelDate: new Date('2024-10-11T09:00:00Z'),
    boardingStop: 'Cherthala',
    destinationStop: 'Alappuzha Central',
    cancellationReason: 'Bus breakdown',
    refundAmount: 250,
    refundDate: new Date('2024-10-11T08:30:00Z'),
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    bookingId: 'BK-2024-004',
    passengerName: 'Alice Johnson',
    passengerEmail: 'alice.johnson@email.com',
    passengerPhone: '+91 9876543213',
    pnr: 'PNR123456792',
    tripId: null,
    routeId: null,
    busId: null,
    seatNumber: 'B2',
    fareAmount: 250,
    status: 'confirmed',
    paymentStatus: 'paid',
    paymentMethod: 'upi',
    bookingDate: new Date('2024-10-11T08:30:00Z'),
    travelDate: new Date('2024-10-11T09:00:00Z'),
    boardingStop: 'Kochi Central',
    destinationStop: 'Alappuzha Central',
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    bookingId: 'BK-2024-005',
    passengerName: 'Charlie Brown',
    passengerEmail: 'charlie.brown@email.com',
    passengerPhone: '+91 9876543214',
    pnr: 'PNR123456793',
    tripId: null,
    routeId: null,
    busId: null,
    seatNumber: 'C1',
    fareAmount: 250,
    status: 'pending',
    paymentStatus: 'pending',
    paymentMethod: 'upi',
    bookingDate: new Date('2024-10-11T08:45:00Z'),
    travelDate: new Date('2024-10-11T09:00:00Z'),
    boardingStop: 'Edappally',
    destinationStop: 'Alappuzha Central',
    createdAt: new Date(),
    updatedAt: new Date()
  }
];

// Sample Ticket Machine Data
const sampleTicketMachineData = [
  {
    uploadId: 'UPL-2024-001',
    depotId: null, // Will be set after depot creation
    busId: null, // Will be set after bus creation
    tripId: null, // Will be set after trip creation
    routeId: null, // Will be set after route creation
    dataDate: new Date('2024-10-11'),
    machineId: 'TM-001',
    machineModel: 'ConductorPro v2.0',
    machineSerial: 'TM2024001',
    fileName: 'daily_transactions_2024_10_11.csv',
    filePath: '/uploads/ticket-data/daily_transactions_2024_10_11.csv',
    totalRecords: 45,
    validRecords: 43,
    invalidRecords: 2,
    processingStatus: 'completed',
    errors: [
      {
        row: 15,
        error: 'Invalid seat number format',
        data: 'Z99',
        field: 'seatNumber'
      },
      {
        row: 28,
        error: 'Missing passenger name',
        data: '',
        field: 'passengerName'
      }
    ],
    revenue: 10750,
    uploadedBy: null, // Will be set to data collector ID
    processedAt: new Date('2024-10-11T10:30:00Z'),
    createdAt: new Date('2024-10-11T09:00:00Z'),
    updatedAt: new Date('2024-10-11T10:30:00Z')
  },
  {
    uploadId: 'UPL-2024-002',
    depotId: null,
    busId: null,
    tripId: null,
    routeId: null,
    dataDate: new Date('2024-10-10'),
    machineId: 'TM-001',
    machineModel: 'ConductorPro v2.0',
    machineSerial: 'TM2024001',
    fileName: 'daily_transactions_2024_10_10.csv',
    filePath: '/uploads/ticket-data/daily_transactions_2024_10_10.csv',
    totalRecords: 38,
    validRecords: 38,
    invalidRecords: 0,
    processingStatus: 'completed',
    errors: [],
    revenue: 9500,
    uploadedBy: null,
    processedAt: new Date('2024-10-10T10:30:00Z'),
    createdAt: new Date('2024-10-10T09:00:00Z'),
    updatedAt: new Date('2024-10-10T10:30:00Z')
  },
  {
    uploadId: 'UPL-2024-003',
    depotId: null,
    busId: null,
    tripId: null,
    routeId: null,
    dataDate: new Date('2024-10-09'),
    machineId: 'TM-002',
    machineModel: 'ConductorPro v2.0',
    machineSerial: 'TM2024002',
    fileName: 'daily_transactions_2024_10_09.csv',
    filePath: '/uploads/ticket-data/daily_transactions_2024_10_09.csv',
    totalRecords: 42,
    validRecords: 42,
    invalidRecords: 0,
    processingStatus: 'completed',
    errors: [],
    revenue: 10500,
    uploadedBy: null,
    processedAt: new Date('2024-10-09T10:30:00Z'),
    createdAt: new Date('2024-10-09T09:00:00Z'),
    updatedAt: new Date('2024-10-09T10:30:00Z')
  }
];

// Sample Transactions
const sampleTransactions = [
  {
    transactionId: 'TXN-2024-001',
    bookingId: 'BK-2024-001',
    amount: 250,
    currency: 'INR',
    paymentMethod: 'upi',
    paymentStatus: 'completed',
    gatewayTransactionId: 'UPI_TXN_123456789',
    gatewayResponse: 'Success',
    processedAt: new Date('2024-10-11T08:00:00Z'),
    createdAt: new Date('2024-10-11T08:00:00Z')
  },
  {
    transactionId: 'TXN-2024-002',
    bookingId: 'BK-2024-002',
    amount: 250,
    currency: 'INR',
    paymentMethod: 'cash',
    paymentStatus: 'completed',
    gatewayTransactionId: null,
    gatewayResponse: 'Cash payment',
    processedAt: new Date('2024-10-11T08:15:00Z'),
    createdAt: new Date('2024-10-11T08:15:00Z')
  },
  {
    transactionId: 'TXN-2024-003',
    bookingId: 'BK-2024-003',
    amount: -250, // Refund
    currency: 'INR',
    paymentMethod: 'card',
    paymentStatus: 'refunded',
    gatewayTransactionId: 'REF_TXN_123456789',
    gatewayResponse: 'Refund processed',
    processedAt: new Date('2024-10-11T08:30:00Z'),
    createdAt: new Date('2024-10-11T08:30:00Z')
  }
];

// Sample Audit Logs
const sampleAuditLogs = [
  {
    action: 'booking_lookup',
    entityType: 'booking',
    entityId: 'BK-2024-001',
    userId: null, // Will be set to support agent ID
    userRole: 'support_agent',
    details: {
      pnr: 'PNR123456789',
      searchMethod: 'pnr',
      result: 'found'
    },
    timestamp: new Date('2024-10-11T09:15:00Z')
  },
  {
    action: 'refund_processed',
    entityType: 'booking',
    entityId: 'BK-2024-003',
    userId: null, // Will be set to support agent ID
    userRole: 'support_agent',
    details: {
      refundAmount: 250,
      reason: 'Bus breakdown',
      originalPaymentMethod: 'card'
    },
    timestamp: new Date('2024-10-11T08:30:00Z')
  },
  {
    action: 'data_uploaded',
    entityType: 'ticket_machine_data',
    entityId: 'UPL-2024-001',
    userId: null, // Will be set to data collector ID
    userRole: 'data_collector',
    details: {
      fileName: 'daily_transactions_2024_10_11.csv',
      totalRecords: 45,
      validRecords: 43,
      invalidRecords: 2
    },
    timestamp: new Date('2024-10-11T09:00:00Z')
  }
];

// Sample CSV Data Content
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
2024-10-11,09:40,KOCHI-ALAPPUZHA,Kochi Central,Henry Davis,D2,250,Card
2024-10-11,09:42,KOCHI-ALAPPUZHA,Edappally,Ivy Wilson,D3,250,Cash
2024-10-11,09:45,KOCHI-ALAPPUZHA,Cherthala,Jack Brown,D4,250,UPI
2024-10-11,09:47,KOCHI-ALAPPUZHA,Kochi Central,Karen Smith,E1,250,Card
2024-10-11,09:50,KOCHI-ALAPPUZHA,Edappally,Larry Johnson,E2,250,Cash
2024-10-11,09:52,KOCHI-ALAPPUZHA,Cherthala,Mary Williams,E3,250,UPI
2024-10-11,09:55,KOCHI-ALAPPUZHA,Kochi Central,Nick Jones,E4,250,Card
2024-10-11,09:57,KOCHI-ALAPPUZHA,Edappally,Olive Garcia,F1,250,Cash
2024-10-11,10:00,KOCHI-ALAPPUZHA,Cherthala,Paul Martinez,F2,250,UPI
2024-10-11,10:02,KOCHI-ALAPPUZHA,Kochi Central,Quinn Anderson,F3,250,Card
2024-10-11,10:05,KOCHI-ALAPPUZHA,Edappally,Rachel Taylor,F4,250,Cash
2024-10-11,10:07,KOCHI-ALAPPUZHA,Cherthala,Sam Thomas,G1,250,UPI
2024-10-11,10:10,KOCHI-ALAPPUZHA,Kochi Central,Tina Moore,G2,250,Card
2024-10-11,10:12,KOCHI-ALAPPUZHA,Edappally,Victor Jackson,G3,250,Cash
2024-10-11,10:15,KOCHI-ALAPPUZHA,Cherthala,Wendy White,G4,250,UPI
2024-10-11,10:17,KOCHI-ALAPPUZHA,Kochi Central,Xavier Harris,H1,250,Card
2024-10-11,10:20,KOCHI-ALAPPUZHA,Edappally,Yara Martin,H2,250,Cash
2024-10-11,10:22,KOCHI-ALAPPUZHA,Cherthala,Zoe Thompson,H3,250,UPI
2024-10-11,10:25,KOCHI-ALAPPUZHA,Kochi Central,Adam Clark,H4,250,Card
2024-10-11,10:27,KOCHI-ALAPPUZHA,Edappally,Bella Rodriguez,I1,250,Cash
2024-10-11,10:30,KOCHI-ALAPPUZHA,Cherthala,Chris Lewis,I2,250,UPI
2024-10-11,10:32,KOCHI-ALAPPUZHA,Kochi Central,Diana Lee,I3,250,Card
2024-10-11,10:35,KOCHI-ALAPPUZHA,Edappally,Ethan Walker,I4,250,Cash
2024-10-11,10:37,KOCHI-ALAPPUZHA,Cherthala,Fiona Hall,J1,250,UPI
2024-10-11,10:40,KOCHI-ALAPPUZHA,Kochi Central,George Allen,J2,250,Card
2024-10-11,10:42,KOCHI-ALAPPUZHA,Edappally,Hannah Young,J3,250,Cash
2024-10-11,10:45,KOCHI-ALAPPUZHA,Cherthala,Ian King,J4,250,UPI
2024-10-11,10:47,KOCHI-ALAPPUZHA,Kochi Central,Julia Wright,K1,250,Card
2024-10-11,10:50,KOCHI-ALAPPUZHA,Edappally,Kyle Lopez,K2,250,Cash
2024-10-11,10:52,KOCHI-ALAPPUZHA,Cherthala,Luna Hill,K3,250,UPI
2024-10-11,10:55,KOCHI-ALAPPUZHA,Kochi Central,Marcus Scott,K4,250,Card
2024-10-11,10:57,KOCHI-ALAPPUZHA,Edappally,Nora Green,L1,250,Cash
2024-10-11,11:00,KOCHI-ALAPPUZHA,Cherthala,Oscar Adams,L2,250,UPI
2024-10-11,11:02,KOCHI-ALAPPUZHA,Kochi Central,Penny Baker,L3,250,Card
2024-10-11,11:05,KOCHI-ALAPPUZHA,Edappally,Quentin Nelson,L4,250,Cash
2024-10-11,11:07,KOCHI-ALAPPUZHA,Cherthala,Ruby Carter,M1,250,UPI
2024-10-11,11:10,KOCHI-ALAPPUZHA,Kochi Central,Steve Mitchell,M2,250,Card`;

// Function to populate sample data
async function populateSampleData() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/yatrik-erp');
    console.log('Connected to MongoDB');

    // Clear existing data (optional - remove if you want to keep existing data)
    console.log('Clearing existing sample data...');
    await User.deleteMany({ role: { $in: ['support_agent', 'data_collector'] } });
    await Booking.deleteMany({ bookingId: { $regex: /^BK-2024-/ } });
    await TicketMachineData.deleteMany({ uploadId: { $regex: /^UPL-2024-/ } });
    await Transaction.deleteMany({ transactionId: { $regex: /^TXN-2024-/ } });
    await AuditLog.deleteMany({ entityId: { $regex: /^(BK-2024-|UPL-2024-)/ } });

    // Create or find required entities
    console.log('Creating required entities...');
    
    // Find or create depot
    let depot = await Depot.findOne({ depotName: 'Kochi Depot' });
    if (!depot) {
      depot = new Depot({
        depotName: 'Kochi Depot',
        depotCode: 'KCH',
        location: 'Kochi, Kerala',
        address: 'Kochi Central Bus Station',
        managerName: 'Rajesh Kumar',
        contactNumber: '+91 9876543210',
        status: 'active'
      });
      await depot.save();
    }

    // Find or create route
    let route = await Route.findOne({ name: 'Kochi → Alappuzha' });
    if (!route) {
      route = new Route({
        name: 'Kochi → Alappuzha',
        routeCode: 'KCH-ALP',
        origin: 'Kochi',
        destination: 'Alappuzha',
        distance: 85,
        duration: 90,
        stops: [
          { name: 'Kochi Central', sequence: 1, arrivalTime: '09:00' },
          { name: 'Edappally', sequence: 2, arrivalTime: '09:15' },
          { name: 'Cherthala', sequence: 3, arrivalTime: '09:45' },
          { name: 'Alappuzha Central', sequence: 4, arrivalTime: '10:30' }
        ],
        status: 'active'
      });
      await route.save();
    }

    // Find or create bus
    let bus = await Bus.findOne({ registrationNumber: 'KL-07-CD-5678' });
    if (!bus) {
      bus = new Bus({
        busNumber: 'BUS-001',
        registrationNumber: 'KL-07-CD-5678',
        model: 'Tata Starbus',
        capacity: 45,
        depotId: depot._id,
        status: 'active',
        driverId: null,
        conductorId: null
      });
      await bus.save();
    }

    // Find or create trip
    let trip = await Trip.findOne({ tripCode: 'TR-2024-001' });
    if (!trip) {
      trip = new Trip({
        tripCode: 'TR-2024-001',
        routeId: route._id,
        busId: bus._id,
        driverId: null,
        conductorId: null,
        departureTime: new Date('2024-10-11T09:00:00Z'),
        arrivalTime: new Date('2024-10-11T10:30:00Z'),
        status: 'scheduled',
        fare: 250
      });
      await trip.save();
    }

    // Create Support Agents
    console.log('Creating Support Agents...');
    const supportAgents = await User.insertMany(sampleSupportAgents);
    console.log(`Created ${supportAgents.length} Support Agents`);

    // Create Data Collectors
    console.log('Creating Data Collectors...');
    const dataCollectors = await User.insertMany(sampleDataCollectors);
    console.log(`Created ${dataCollectors.length} Data Collectors`);

    // Update bookings with IDs
    console.log('Creating Sample Bookings...');
    const bookingsWithIds = sampleBookings.map(booking => ({
      ...booking,
      tripId: trip._id,
      routeId: route._id,
      busId: bus._id
    }));
    const bookings = await Booking.insertMany(bookingsWithIds);
    console.log(`Created ${bookings.length} Sample Bookings`);

    // Update ticket machine data with IDs
    console.log('Creating Sample Ticket Machine Data...');
    const ticketDataWithIds = sampleTicketMachineData.map(data => ({
      ...data,
      depotId: depot._id,
      busId: bus._id,
      tripId: trip._id,
      routeId: route._id,
      uploadedBy: dataCollectors[0]._id
    }));
    const ticketData = await TicketMachineData.insertMany(ticketDataWithIds);
    console.log(`Created ${ticketData.length} Sample Ticket Machine Data entries`);

    // Update transactions with booking IDs
    console.log('Creating Sample Transactions...');
    const transactionsWithIds = sampleTransactions.map((transaction, index) => ({
      ...transaction,
      bookingId: bookings[index]._id
    }));
    const transactions = await Transaction.insertMany(transactionsWithIds);
    console.log(`Created ${transactions.length} Sample Transactions`);

    // Update audit logs with user IDs
    console.log('Creating Sample Audit Logs...');
    const auditLogsWithIds = sampleAuditLogs.map((log, index) => ({
      ...log,
      userId: index < 2 ? supportAgents[0]._id : dataCollectors[0]._id,
      entityId: index < 2 ? bookings[index]._id : ticketData[0]._id
    }));
    const auditLogs = await AuditLog.insertMany(auditLogsWithIds);
    console.log(`Created ${auditLogs.length} Sample Audit Logs`);

    // Create sample CSV file
    const fs = require('fs');
    const path = require('path');
    const uploadDir = path.join(__dirname, 'backend/uploads/ticket-data');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    
    const csvFilePath = path.join(uploadDir, 'daily_transactions_2024_10_11.csv');
    fs.writeFileSync(csvFilePath, sampleCSVContent);
    console.log('Created sample CSV file:', csvFilePath);

    console.log('\n✅ Sample data populated successfully!');
    console.log('\n📊 Summary:');
    console.log(`- Support Agents: ${supportAgents.length}`);
    console.log(`- Data Collectors: ${dataCollectors.length}`);
    console.log(`- Sample Bookings: ${bookings.length}`);
    console.log(`- Ticket Machine Data: ${ticketData.length}`);
    console.log(`- Transactions: ${transactions.length}`);
    console.log(`- Audit Logs: ${auditLogs.length}`);
    
    console.log('\n🔑 Test Credentials:');
    console.log('Support Agents:');
    supportAgents.forEach(agent => {
      console.log(`- ${agent.name}: ${agent.email} / ${agent.username} / password`);
    });
    
    console.log('\nData Collectors:');
    dataCollectors.forEach(collector => {
      console.log(`- ${collector.name}: ${collector.email} / ${collector.username} / password`);
    });

    console.log('\n📋 Sample PNRs for testing:');
    bookings.forEach(booking => {
      console.log(`- ${booking.pnr}: ${booking.passengerName} (${booking.status})`);
    });

  } catch (error) {
    console.error('Error populating sample data:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
}

// Run the script
if (require.main === module) {
  populateSampleData();
}

module.exports = {
  populateSampleData,
  sampleSupportAgents,
  sampleDataCollectors,
  sampleBookings,
  sampleTicketMachineData,
  sampleTransactions,
  sampleAuditLogs,
  sampleCSVContent
};
