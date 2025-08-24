const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Performance testing script for authentication
async function testLoginPerformance() {
  try {
    // Connect to database
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/yatrik_erp');
    console.log('✅ Connected to database');

    // Create test user if not exists
    let testUser = await User.findOne({ email: 'perf-test@yatrik.com' });
    if (!testUser) {
      const hashedPassword = await bcrypt.hash('testpass123', 10);
      testUser = new User({
        name: 'Performance Test User',
        email: 'perf-test@yatrik.com',
        phone: '+1234567890', // Add required phone field
        password: hashedPassword,
        role: 'passenger',
        authProvider: 'local'
      });
      await testUser.save();
      console.log('✅ Test user created');
    }

    // Test login performance
    console.log('\n🚀 Testing Login Performance...');
    
    const iterations = 10;
    const times = [];

    for (let i = 0; i < iterations; i++) {
      const startTime = Date.now();
      
      // Simulate login process
      const user = await User.findOne({ email: 'perf-test@yatrik.com' })
        .select('+password name role status depotId lastLogin loginAttempts lockUntil')
        .lean();
      
      if (user) {
        const isPasswordValid = await bcrypt.compare('testpass123', user.password);
        if (isPasswordValid) {
          const token = jwt.sign(
            { 
              userId: user._id, 
              role: user.role.toUpperCase(), 
              name: user.name, 
              email: user.email 
            },
            process.env.JWT_SECRET || 'secret',
            { expiresIn: '7d' }
          );
        }
      }
      
      const endTime = Date.now();
      const duration = endTime - startTime;
      times.push(duration);
      
      console.log(`  Test ${i + 1}: ${duration}ms`);
    }

    // Calculate statistics
    const avgTime = times.reduce((a, b) => a + b, 0) / times.length;
    const minTime = Math.min(...times);
    const maxTime = Math.max(...times);
    
    console.log('\n📊 Performance Results:');
    console.log(`  Average: ${avgTime.toFixed(2)}ms`);
    console.log(`  Minimum: ${minTime}ms`);
    console.log(`  Maximum: ${maxTime}ms`);
    console.log(`  Total iterations: ${iterations}`);
    
    // Performance recommendations
    console.log('\n💡 Performance Recommendations:');
    if (avgTime > 100) {
      console.log('  ⚠️  Login is taking longer than expected');
      console.log('  🔍 Check database indexes and query optimization');
    } else if (avgTime > 50) {
      console.log('  ⚠️  Login performance could be improved');
      console.log('  🔍 Consider reducing database queries');
    } else {
      console.log('  ✅ Login performance is excellent!');
    }

    // Test database indexes
    console.log('\n🔍 Testing Database Indexes...');
    const indexStats = await User.collection.getIndexes();
    console.log('  Current indexes:', Object.keys(indexStats));

    // Test query performance with explain
    console.log('\n📈 Query Performance Analysis...');
    const explainResult = await User.findOne({ email: 'perf-test@yatrik.com' })
      .select('+password name role status depotId lastLogin loginAttempts lockUntil')
      .lean()
      .explain('executionStats');
    
    console.log(`  Query execution time: ${explainResult.executionStats.executionTimeMillis}ms`);
    console.log(`  Documents examined: ${explainResult.executionStats.totalDocsExamined}`);
    console.log(`  Documents returned: ${explainResult.executionStats.nReturned}`);

  } catch (error) {
    console.error('❌ Performance test failed:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\n✅ Disconnected from database');
  }
}

// Run performance test
if (require.main === module) {
  testLoginPerformance();
}

module.exports = { testLoginPerformance };
