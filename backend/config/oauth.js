// Backend OAuth Configuration
module.exports = {
  google: {
    clientID: process.env.GOOGLE_CLIENT_ID || '889305333159-938odo67058fepqktsd8ro7pvsp5c4lv.apps.googleusercontent.com',
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: process.env.GOOGLE_CALLBACK_URL || 'http://localhost:5000/api/auth/google/callback',
    scope: ['profile', 'email']
  },
  frontendURL: process.env.FRONTEND_URL || 'http://localhost:3000',
  jwtSecret: process.env.JWT_SECRET || 'your-super-secret-jwt-key-here',
  jwtExpire: process.env.JWT_EXPIRE || '7d'
};
