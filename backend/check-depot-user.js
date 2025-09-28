const mongoose = require('mongoose');
require('dotenv').config();

// Import the DepotUser model
const DepotUser = require('./models/DepotUser');

async function checkDepotUser() {
    try {
        // Connect to MongoDB
        await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/yatrik_erp');
        console.log('✅ Connected to MongoDB');

        // Check if depot user exists
        const depotUser = await DepotUser.findOne({ email: 'depot-plk@yatrik.com' });
        
        if (depotUser) {
            console.log('✅ Depot user found:');
            console.log(`   Email: ${depotUser.email}`);
            console.log(`   Name: ${depotUser.name}`);
            console.log(`   Role: ${depotUser.role}`);
            console.log(`   Status: ${depotUser.status || 'active'}`);
            console.log(`   Created: ${depotUser.createdAt}`);
            
            // Check if password is hashed
            if (depotUser.password && depotUser.password.length > 20) {
                console.log('✅ Password appears to be hashed (secure)');
            } else {
                console.log('⚠️  Password might not be properly hashed');
            }
        } else {
            console.log('❌ Depot user NOT found in database');
            console.log('📝 Creating depot user...');
            
            // Create the depot user
            const newDepotUser = new DepotUser({
                name: 'Palakkad Depot Manager',
                email: 'depot-plk@yatrik.com',
                password: 'Akhil@123', // This will be hashed automatically
                role: 'depot_manager',
                depotId: null, // Will be set later
                status: 'active',
                permissions: ['manage_buses', 'manage_routes', 'manage_schedules', 'view_reports'],
                contactNumber: '+91-9876543210',
                address: 'Palakkad Bus Station, Kerala'
            });
            
            await newDepotUser.save();
            console.log('✅ Depot user created successfully!');
            console.log(`   Email: ${newDepotUser.email}`);
            console.log(`   Password: Akhil@123`);
        }
        
    } catch (error) {
        console.error('❌ Error:', error.message);
    } finally {
        await mongoose.disconnect();
        console.log('🔌 Disconnected from MongoDB');
    }
}

checkDepotUser();
