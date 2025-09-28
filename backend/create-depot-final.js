
const mongoose = require('mongoose');
const DepotUser = require('./models/DepotUser');
const bcrypt = require('bcryptjs');

async function createUser() {
    try {
        await mongoose.connect('mongodb://localhost:27017/yatrik_erp');
        console.log('Connected to MongoDB');
        
        // Check if user exists
        const existing = await DepotUser.findOne({ email: 'depot-plk@yatrik.com' });
        if (existing) {
            console.log('User already exists, updating password...');
            existing.password = await bcrypt.hash('Akhil@123', 10);
            await existing.save();
            console.log('✅ Password updated successfully!');
        } else {
            // Create new user
            const hashedPassword = await bcrypt.hash('Akhil@123', 10);
            const user = new DepotUser({
                username: 'depot-plk',
                email: 'depot-plk@yatrik.com',
                password: hashedPassword,
                role: 'depot_manager',
                status: 'active',
                permissions: ['manage_buses', 'manage_routes', 'manage_schedules', 'view_reports'],
                depotId: null,
                depotCode: 'PLK-001',
                depotName: 'Palakkad Depot'
            });
            
            await user.save();
            console.log('✅ Depot user created successfully!');
        }
        
        console.log('📋 Login credentials:');
        console.log('   Email: depot-plk@yatrik.com');
        console.log('   Password: Akhil@123');
        
        process.exit(0);
    } catch (error) {
        console.error('Error:', error.message);
        process.exit(1);
    }
}

createUser();
