const jwt = require('jsonwebtoken');

// Middleware to authenticate token
const auth = (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    
    if (!token) {
      return res.status(401).json({ message: 'Access denied. No token provided.' });
    }
    
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'yatrik-erp-secret-key');
    req.user = decoded;
    next();
  } catch (error) {
    console.error('Authentication error:', error.message);
    return res.status(403).json({ message: 'Invalid token' });
  }
};

module.exports = auth;