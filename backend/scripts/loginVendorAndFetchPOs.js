require('dotenv').config();

// Use global fetch available in Node 18+; fallback to dynamic import if needed
const fetchFn = (...args) =>
  (typeof fetch !== 'undefined'
    ? fetch(...args)
    : import('node-fetch').then(({ default: f }) => f(...args)));

const BASE_URL = process.env.BASE_URL || 'http://localhost:5000';

async function loginVendor() {
  const res = await fetchFn(`${BASE_URL}/api/vendor/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: 'vendor@yatrik.com',
      password: 'Vendor123',
    }),
  });

  const data = await res.json().catch(() => ({}));
  console.log('🔐 Login status:', res.status, 'success:', data.success);

  if (!res.ok || !data.success || !data.token) {
    console.error('❌ Vendor login failed:', data);
    process.exit(1);
  }

  return data.token;
}

async function fetchPurchaseOrders(token) {
  const res = await fetchFn(
    `${BASE_URL}/api/vendor/purchase-orders?page=1&limit=20`,
    {
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
    }
  );

  const data = await res.json().catch(() => ({}));
  console.log('📦 /api/vendor/purchase-orders status:', res.status);
  console.log('Response body:', JSON.stringify(data, null, 2));
}

async function fetchDashboard(token) {
  const res = await fetchFn(`${BASE_URL}/api/vendor/dashboard`, {
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
  });

  const data = await res.json().catch(() => ({}));
  console.log('📊 /api/vendor/dashboard status:', res.status);
  console.log('Response body:', JSON.stringify(data, null, 2));
}

async function main() {
  try {
    const token = await loginVendor();
    await fetchDashboard(token);
    await fetchPurchaseOrders(token);
  } catch (err) {
    console.error('❌ Error in loginVendorAndFetchPOs:', err);
    process.exit(1);
  }
}

main();

