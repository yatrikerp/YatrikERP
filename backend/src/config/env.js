// Environment variable validation
function validateEnv() {
  const required = ['MONGODB_URI'];
  const missing = [];

  required.forEach(key => {
    if (!process.env[key]) {
      missing.push(key);
    }
  });

  if (missing.length > 0) {
    console.warn(`⚠️ Missing environment variables: ${missing.join(', ')}`);
    console.warn('Some features may not work correctly.');
  } else {
    console.log('✅ All required environment variables are set');
  }
}

module.exports = { validateEnv };
