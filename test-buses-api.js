const mongoose = require('mongoose');
require('dotenv').config();

async function testBusesAPI() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('🔌 Connected to MongoDB');

    const Bus = require('./models/Bus');
    const Depot = require('./models/Depot');

    // Test the exact API logic
    const queryParams = {
      limit: '500',
      page: '1',
      status: undefined,
      depotId: undefined,
      busType: undefined,
      search: undefined,
      sortBy: 'createdAt',
      sortOrder: 'desc'
    };

    const skip = (parseInt(queryParams.page) - 1) * parseInt(queryParams.limit);
    const filter = {};

    // Apply filters (same as API)
    if (queryParams.status) filter.status = queryParams.status;
    if (queryParams.depotId) filter.depotId = queryParams.depotId;
    if (queryParams.busType) filter.busType = queryParams.busType;
    if (queryParams.search) {
      filter.$or = [
        { busNumber: { $regex: queryParams.search, $options: 'i' } },
        { registrationNumber: { $regex: queryParams.search, $options: 'i' } }
      ];
    }

    // Build sort object
    const sort = {};
    sort[queryParams.sortBy] = queryParams.sortOrder === 'desc' ? -1 : 1;

    console.log('📊 Filter:', filter);
    console.log('📊 Sort:', sort);
    console.log('📊 Skip:', skip, 'Limit:', queryParams.limit);

    const [buses, total] = await Promise.all([
      Bus.find(filter)
        .populate('depotId', 'depotName location')
        .populate('assignedDriver', 'name phone')
        .populate('assignedConductor', 'name phone')
        .sort(sort)
        .skip(skip)
        .limit(parseInt(queryParams.limit))
        .lean(),
      Bus.countDocuments(filter)
    ]);

    console.log('📊 Found buses:', buses.length);
    console.log('📊 Total buses:', total);

    // Group by depot
    const depotCounts = {};
    buses.forEach(bus => {
      const depotName = bus.depotId ? bus.depotId.depotName : 'Unknown';
      depotCounts[depotName] = (depotCounts[depotName] || 0) + 1;
    });

    console.log('\n🏢 Depot Distribution:');
    Object.entries(depotCounts).forEach(([depot, count]) => {
      console.log(`  ${depot}: ${count} buses`);
    });

    console.log('\n🚌 Sample Buses:');
    buses.slice(0, 10).forEach((bus, index) => {
      console.log(`  ${index + 1}. ${bus.busNumber} - ${bus.depotId ? bus.depotId.depotName : 'Unknown'} - ${bus.status}`);
    });

    await mongoose.disconnect();
    console.log('\n✅ Test completed successfully');

  } catch (error) {
    console.error('❌ Error:', error.message);
    await mongoose.disconnect();
  }
}

testBusesAPI();
