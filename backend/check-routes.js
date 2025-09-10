const mongoose = require('mongoose');
require('dotenv').config();

const Route = require('./models/Route');

async function checkRoutes() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    const routes = await Route.find({}).lean();
    console.log('Routes found:', routes.length);
    
    routes.forEach((route, i) => {
      console.log(`${i+1}. ${route.routeName}`);
      console.log(`   From: ${route.startingPoint?.city}`);
      console.log(`   To: ${route.endingPoint?.city}`);
      console.log(`   Status: ${route.status}`);
      console.log('');
    });

    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

checkRoutes();
