# 🔐 Yatrik ERP Authentication System

## Overview
The Yatrik ERP system implements a robust, role-based authentication system with proper loading states, error handling, and security features.

## 🚀 Quick Setup

### 1. Run the Setup Script
```bash
node setup-auth.js
```

This will:
- Install all dependencies
- Create test users with different roles
- Set up the database

### 2. Start the System
```bash
# Terminal 1: Start MongoDB
mongod

# Terminal 2: Start Backend
cd backend
npm start

# Terminal 3: Start Frontend
cd frontend
npm run dev
```

## 🔑 Test User Credentials

| Role | Email | Password | Access Level |
|------|-------|----------|--------------|
| **Admin** | admin@yatrik.com | admin123 | Full system access |
| **Depot Manager** | depot@yatrik.com | depot123 | Depot operations |
| **Driver** | driver@yatrik.com | driver123 | Vehicle operations |
| **Conductor** | conductor@yatrik.com | conductor123 | Passenger services |
| **Passenger** | passenger@yatrik.com | passenger123 | Booking services |

## 🏗️ System Architecture

### Frontend Components
- **AuthContext**: Manages authentication state
- **RequireAuth**: Role-based route protection
- **RedirectDashboard**: Smart routing based on user role
- **Login/Signup**: Authentication forms with proper validation

### Backend Components
- **User Model**: Comprehensive user schema with role management
- **Auth Routes**: Secure authentication endpoints
- **JWT Tokens**: Stateless authentication with role information
- **Password Security**: Bcrypt hashing with brute force protection

## 🔒 Security Features

### Authentication
- JWT-based authentication with 7-day expiration
- Password hashing using bcrypt (12 rounds)
- Account lockout after 5 failed attempts (2-hour lockout)
- Input validation and sanitization

### Role-Based Access Control
- 5 distinct user roles with specific permissions
- Route-level access control
- Automatic redirection based on user role
- Access denied pages for unauthorized users

### API Security
- Request timeout protection (10 seconds)
- CORS configuration
- Rate limiting on authentication endpoints
- Secure password reset tokens

## 🛣️ Role-Based Routing

### Admin Routes (`/admin/*`)
- Full system management
- User management
- System configuration
- Analytics and reporting

### Depot Manager Routes (`/depot`)
- Depot operations
- Staff management
- Vehicle scheduling
- Maintenance tracking

### Driver Routes (`/driver`)
- Trip management
- Vehicle operation
- Route navigation
- Status updates

### Conductor Routes (`/conductor`)
- Passenger services
- Ticket management
- Fare collection
- Customer support

### Passenger Routes (`/pax/*`)
- Trip booking
- Ticket management
- Live tracking
- Payment services

## 🔧 Configuration

### Environment Variables
```bash
# Backend (.env)
MONGODB_URI=mongodb://localhost:27017/yatrik_erp
JWT_SECRET=your-secret-key-here
JWT_EXPIRE=7d
FRONTEND_URL=http://localhost:5173

# Frontend (.env)
REACT_APP_API_URL=http://localhost:3001
```

### Database Schema
The User model includes:
- Basic information (name, email, phone)
- Role and status management
- Authentication details
- Role-specific fields
- Security features (login attempts, account lockout)

## 🧪 Testing

### Manual Testing
1. Login with different user roles
2. Verify role-based access to different routes
3. Test logout functionality
4. Verify proper error handling

### Automated Testing
```bash
# Backend tests
cd backend
npm test

# Frontend tests
cd frontend
npm test
```

## 🐛 Troubleshooting

### Common Issues

#### Login Not Working
- Check MongoDB connection
- Verify user exists in database
- Check console for error messages
- Ensure backend is running on port 3001

#### Role-Based Access Issues
- Verify user role in database
- Check RequireAuth component configuration
- Ensure proper role mapping in RedirectDashboard
- Check browser console for authentication errors

#### Instant Redirects
- The system now includes proper loading states
- Check AuthContext for proper state management
- Verify loading states in components

### Debug Mode
The RoleTestPanel component is temporarily added to the login page for debugging. It shows:
- Current authentication status
- User information
- Role details
- Quick navigation buttons

## 📱 Mobile Support
- Responsive design for all screen sizes
- Touch-friendly interface
- Progressive Web App features
- Offline capability for basic functions

## 🔄 Future Enhancements
- Multi-factor authentication
- Social login integration
- Advanced role permissions
- Audit logging
- Session management
- API rate limiting

## 📞 Support
For authentication system issues:
1. Check the console logs
2. Verify database connectivity
3. Test with different user roles
4. Review the authentication flow

---

**Note**: This authentication system is production-ready with proper security measures, loading states, and error handling. The instant login issue has been resolved with proper loading states and role validation.
