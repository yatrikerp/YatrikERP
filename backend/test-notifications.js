const mongoose = require('mongoose');
require('dotenv').config();

// Import models
const Notification = require('./models/Notification');
const User = require('./models/User');
const Depot = require('./models/Depot');
const NotificationService = require('./services/notificationService');

async function testNotifications() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/yatrik-erp');
    console.log('Connected to MongoDB');

    // Find a depot
    const depot = await Depot.findOne();
    if (!depot) {
      console.log('No depot found. Please create a depot first.');
      return;
    }

    console.log('Testing with depot:', depot.depotName);

    // Find depot users
    const depotUsers = await User.find({
      depotId: depot._id,
      role: { $in: ['depot_manager', 'depot_supervisor', 'depot_operator', 'manager', 'supervisor', 'operator'] }
    });

    console.log('Found depot users:', depotUsers.length);

    if (depotUsers.length === 0) {
      console.log('No depot users found. Creating a test user...');
      
      // Create a test depot user
      const testUser = new User({
        name: 'Test Depot Manager',
        email: 'test@depot.com',
        role: 'manager',
        depotId: depot._id,
        status: 'active'
      });
      
      await testUser.save();
      console.log('Created test user:', testUser.name);
    }

    // Test 1: Create a simple notification
    console.log('\n=== Test 1: Creating simple notification ===');
    const notification = await NotificationService.createDepotNotification(depot._id, {
      title: 'Test Notification',
      message: 'This is a test notification for the depot',
      type: 'general',
      priority: 'medium',
      senderId: depotUsers[0]?._id || '507f1f77bcf86cd799439011',
      senderRole: 'admin'
    });

    console.log('Created notifications:', notification.length);

    // Test 2: Get notifications for depot users
    console.log('\n=== Test 2: Getting notifications ===');
    const depotUser = depotUsers[0] || await User.findOne({ depotId: depot._id, role: 'manager' });
    
    if (depotUser) {
      const userNotifications = await NotificationService.getUserNotifications(
        depotUser._id,
        depotUser.role,
        depot._id
      );
      
      console.log('User notifications:', userNotifications.length);
      userNotifications.forEach(notif => {
        console.log(`- ${notif.title}: ${notif.message}`);
      });
    }

    // Test 3: Get notification count
    console.log('\n=== Test 3: Getting notification count ===');
    const count = await NotificationService.getNotificationCount(
      depotUser._id,
      depotUser.role,
      depot._id
    );
    
    console.log('Unread notification count:', count);

    // Test 4: Mark notification as read
    if (notification.length > 0) {
      console.log('\n=== Test 4: Marking notification as read ===');
      await NotificationService.markAsRead(notification[0]._id, depotUser._id);
      console.log('Marked notification as read');
    }

    console.log('\n=== All tests completed successfully! ===');

  } catch (error) {
    console.error('Test failed:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
}

// Run the test
testNotifications();
