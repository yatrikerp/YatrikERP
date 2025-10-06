const mongoose = require('mongoose');
require('dotenv').config();

const Trip = require('../models/Trip');

async function run() {
  try {
    const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/yatrik_erp';
    await mongoose.connect(uri, { useNewUrlParser: true, useUnifiedTopology: true });

    const existing = await Trip.countDocuments({});
    console.log('Existing trips:', existing);

    const result = await Trip.deleteMany({});
    console.log('Deleted trips:', result.deletedCount || 0);

    const remaining = await Trip.countDocuments({});
    console.log('Remaining trips:', remaining);
  } catch (err) {
    console.error('Error deleting trips:', err.message);
  } finally {
    await mongoose.connection.close();
  }
}

run();


