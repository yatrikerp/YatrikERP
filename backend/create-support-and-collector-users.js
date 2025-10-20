const mongoose = require('mongoose');
require('dotenv').config();

const User = require('./models/User');
const Depot = require('./models/Depot');

function genPass(prefix) {
  return `${prefix}${Math.random().toString(36).slice(-6)}`;
}

async function run() {
  await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/yatrik-erp');
  const depot = await Depot.findOne();
  const depotId = depot?._id;

  const usersToCreate = [
    {
      name: 'Support Agent 1',
      email: 'support1@yatrik.com',
      phone: '9000001001',
      role: 'support_agent',
      status: 'active',
      depotId,
      password: genPass('Supp!')
    },
    {
      name: 'Data Collector 1',
      email: 'collector1@yatrik.com',
      phone: '9000002001',
      role: 'data_collector',
      status: 'active',
      depotId,
      password: genPass('Data!')
    }
  ];

  const results = [];
  for (const u of usersToCreate) {
    let existing = await User.findOne({ $or: [{ email: u.email }, { phone: u.phone }] });
    if (existing) {
      results.push({ email: existing.email, role: existing.role, password: '(existing user, password unchanged)' });
      continue;
    }
    const created = new User(u);
    await created.save();
    results.push({ email: u.email, role: u.role, password: u.password });
  }

  console.log('=== Created/Existing Accounts ===');
  for (const r of results) {
    console.log(`${r.role}: ${r.email}  password: ${r.password}`);
  }

  await mongoose.disconnect();
}

run().catch(err => {
  console.error(err);
  process.exit(1);
});


