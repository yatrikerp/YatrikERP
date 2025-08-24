const oauthConfig = require('../config/oauth');

console.log('🔍 Google OAuth Configuration Check:');
console.log('=====================================');
console.log('Client ID:', oauthConfig.google.clientID);
console.log('Client Secret:', oauthConfig.google.clientSecret ? '✅ Set' : '❌ Missing');
console.log('Callback URL:', oauthConfig.google.callbackURL);
console.log('Frontend URL:', oauthConfig.frontendURL);
console.log('JWT Secret:', oauthConfig.jwtSecret ? '✅ Set' : '❌ Missing');
console.log('JWT Expire:', oauthConfig.jwtExpire);

console.log('\n📋 Environment Variables:');
console.log('GOOGLE_CLIENT_ID:', process.env.GOOGLE_CLIENT_ID || '❌ Not set');
console.log('GOOGLE_CLIENT_SECRET:', process.env.GOOGLE_CLIENT_SECRET ? '✅ Set' : '❌ Not set');
console.log('FRONTEND_URL:', process.env.FRONTEND_URL || '❌ Not set');
console.log('JWT_SECRET:', process.env.JWT_SECRET ? '✅ Set' : '❌ Not set');

console.log('\n💡 To fix Google OAuth:');
console.log('1. Set GOOGLE_CLIENT_SECRET environment variable');
console.log('2. Ensure GOOGLE_CLIENT_ID is correct');
console.log('3. Verify callback URL matches Google Console settings');
console.log('4. Check if frontend is running on correct port');

if (!oauthConfig.google.clientSecret || oauthConfig.google.clientSecret === 'GOCSPX-your-google-client-secret-here') {
  console.log('\n❌ ERROR: Google Client Secret is not properly configured!');
  console.log('   Please set the GOOGLE_CLIENT_SECRET environment variable.');
} else {
  console.log('\n✅ Google OAuth appears to be properly configured!');
}
