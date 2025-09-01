const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const User = require('../models/User');
const oauthConfig = require('./oauth');

// Serialize user for session
passport.serializeUser((user, done) => {
  done(null, user.id);
});

// Deserialize user from session
passport.deserializeUser(async (id, done) => {
  try {
    const user = await User.findById(id);
    done(null, user);
  } catch (error) {
    done(error, null);
  }
});

// Google OAuth Strategy
passport.use(new GoogleStrategy({
  clientID: oauthConfig.google.clientID,
  clientSecret: oauthConfig.google.clientSecret,
  callbackURL: oauthConfig.google.callbackURL,
  scope: oauthConfig.google.scope
}, async (accessToken, refreshToken, profile, done) => {
  try {
    // Check if user already exists
    let user = await User.findOne({ 
      $or: [
        { email: profile.emails[0].value },
        { 'providerIds.google': profile.id }
      ]
    });

    if (user) {
      // Update existing user with Google ID if not already set
      if (!user.providerIds?.google) {
        user.providerIds = user.providerIds || {};
        user.providerIds.google = profile.id;
        await user.save();
      }
      return done(null, user);
    }

    // Create new user
    user = new User({
      name: profile.displayName,
      email: profile.emails[0].value,
      providerIds: { google: profile.id },
      authProvider: 'google',
      role: 'passenger', // Default role for OAuth users
      status: 'active',
      profilePicture: profile.photos[0]?.value || '',
      phoneVerified: false // OAuth users need to verify phone separately
    });

    await user.save();
    return done(null, user);

  } catch (error) {
    console.error('Google OAuth error:', error);
    return done(error, null);
  }
}));

module.exports = passport;
