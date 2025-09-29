# Kerala Staff Management System

## Overview

The Kerala Staff Management System is a comprehensive solution for managing drivers and conductors in the YATRIK ERP system. It features automatic staff creation with Kerala Malayali names, email credential generation, and intelligent bus assignment.

## Features

### 🚌 Automatic Staff Creation
- **Kerala Malayali Names**: Generates authentic Kerala names for drivers and conductors
- **Auto-generated Credentials**: Creates unique usernames and passwords
- **Email Notifications**: Sends login credentials via email
- **Employee Codes**: Generates structured employee codes (DRV001, CND001, etc.)

### 🎯 Intelligent Bus Assignment
- **Auto-assignment**: Automatically assigns available drivers and conductors to buses
- **Smart Matching**: Ensures optimal staff-to-bus ratio
- **Real-time Updates**: Updates bus cards with assigned staff information
- **Assignment Tracking**: Tracks staff duty status and availability

### 📊 Depot Dashboard Integration
- **Staff Overview**: Complete staff management dashboard
- **Assignment Statistics**: Real-time assignment rates and statistics
- **Staff Search & Filter**: Advanced filtering by role, status, and availability
- **Bulk Operations**: Mass staff creation and assignment

### 🔐 Security & Authentication
- **Role-based Access**: Different access levels for admin, depot managers, and staff
- **Secure Credentials**: Bcrypt password hashing
- **Email Verification**: Credential delivery via email
- **Session Management**: JWT-based authentication

## File Structure

```
backend/
├── models/
│   ├── Driver.js              # Driver model with comprehensive fields
│   ├── Conductor.js           # Conductor model with comprehensive fields
│   └── Bus.js                 # Updated Bus model with staff references
├── routes/
│   ├── driver.js              # Driver API routes
│   ├── conductor.js           # Conductor API routes
│   └── staff.js               # Staff management API routes
├── scripts/
│   └── create-kerala-staff-with-assignment.js  # Staff creation script
└── server.js                  # Updated with staff routes

frontend/
├── components/
│   └── Depot/
│       └── StaffManagement.jsx    # Staff management component
└── pages/
    └── admin/
        └── ModernBusManagement.jsx # Updated with staff assignment
```

## API Endpoints

### Staff Management
- `GET /api/staff/depot/:depotId` - Get all staff for a depot
- `GET /api/staff/available/:depotId` - Get available staff for assignment
- `POST /api/staff/auto-assign/:depotId` - Auto-assign staff to buses
- `POST /api/staff/unassign/:busId` - Unassign staff from bus
- `POST /api/staff/create-kerala-staff` - Create Kerala staff with Malayali names
- `GET /api/staff/dashboard/:depotId` - Get staff dashboard data
- `GET /api/staff/bus/:busId` - Get staff assigned to a bus

### Driver Management
- `POST /api/driver/login` - Driver login with attendance marking
- `GET /api/driver/profile` - Get driver profile
- `GET /api/driver/duties` - Get driver duties
- `POST /api/driver/duties/:dutyId/start` - Start duty
- `POST /api/driver/duties/:dutyId/end` - End duty

### Conductor Management
- `POST /api/conductor/login` - Conductor login with attendance marking
- `GET /api/conductor/profile` - Get conductor profile
- `GET /api/conductor/duties` - Get conductor duties
- `POST /api/conductor/validate-ticket` - Validate passenger tickets

## Usage

### 1. Create Kerala Staff

Run the staff creation script:

```bash
cd backend
node scripts/create-kerala-staff-with-assignment.js
```

This will:
- Create drivers and conductors with Kerala Malayali names
- Generate unique credentials
- Send email notifications
- Auto-assign staff to buses

### 2. Manual Staff Assignment

Use the API to assign staff to specific buses:

```javascript
// Auto-assign staff to buses
const response = await fetch('/api/staff/auto-assign/DEPOT_ID', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ 
    busIds: ['BUS_ID_1', 'BUS_ID_2'], 
    forceReassign: false 
  })
});

// Unassign staff from bus
const response = await fetch('/api/staff/unassign/BUS_ID', {
  method: 'POST'
});
```

### 3. Frontend Integration

The bus cards now display:
- Assigned driver name and employee code
- Assigned conductor name and employee code
- Assignment status indicators
- Quick assignment/unassignment buttons

## Kerala Malayali Names Database

The system includes a comprehensive database of Kerala Malayali names:

### Male Names
Rajesh, Suresh, Manoj, Sunil, Ravi, Kumar, Prakash, Vinod, Ajay, Vijay, Sreekumar, Ramesh, Gopalan, Krishnan, Narayanan, Raman, Balakrishnan, Sasidharan, Mohan, Santhosh, Babu, Chandran, Gopinath, Jayakumar, Krishnakumar, Murali, Nandakumar, Prasad, Radhakrishnan, Sankar, Thampi, Unnikrishnan, Vasudevan, Anand, Bharath, Deepak, Eswaran, Faisal, Ganesh, Harish, Ishwar, Jagan, Karthik, Lakshmanan, Madhavan, Naveen, Oman, Pradeep, Raghavan, Sathish, Thirumalai, Udayan, Vignesh, Wilson, Xavier, Yogesh, Zakir

### Female Names
Lakshmi, Saraswathi, Parvathi, Devi, Meera, Radha, Kavitha, Priya, Anitha, Sunitha, Rekha, Shanti, Geetha, Leela, Kamala, Sushila, Indira, Malathi, Vasanthi, Rajani, Sujatha, Usha, Rani, Kumari, Shobha, Pushpa, Latha, Sandhya, Deepa, Nisha, Anjali, Divya, Kavya, Maya, Neha, Pooja, Riya, Sita, Tara, Uma, Vidya, Yamuna, Zara, Aishwarya, Bhavana, Chitra, Dipika, Esha, Fathima, Gayathri, Hema, Ishita, Jyothi, Kiran, Lakshmi, Meera, Nandini

### Surnames
Nair, Menon, Pillai, Kurup, Warrier, Thampi, Namboothiri, Nambiar, Panicker, Unni, Kumar, Krishnan, Raman, Gopalan, Balakrishnan, Sasidharan, Chandran, Gopinath, Jayakumar, Krishnakumar, Murali, Nandakumar, Prasad, Radhakrishnan, Sankar, Thampi, Unnikrishnan, Vasudevan, Anand, Bharath, Deepak, Eswaran, Faisal, Ganesh, Harish, Ishwar, Jagan, Karthik, Lakshmanan, Madhavan, Naveen, Oman, Pradeep, Raghavan, Sathish, Thirumalai, Udayan, Vignesh, Wilson, Xavier

## Environment Variables

Required environment variables:

```env
MONGODB_URI=mongodb://localhost:27017/yatrik-erp
EMAIL_USER=your-gmail@gmail.com
EMAIL_PASS=your-app-password
FRONTEND_URL=http://localhost:3000
JWT_SECRET=your-jwt-secret
```

## Email Templates

The system sends professional email notifications with:
- YATRIK ERP branding
- Login credentials
- Important information
- Login link
- Security reminders

## Security Features

- **Password Hashing**: Bcrypt with 12 rounds
- **JWT Authentication**: Secure token-based authentication
- **Role-based Access**: Admin, depot manager, and staff roles
- **Email Verification**: Credential delivery via email
- **Session Management**: Secure session handling

## Performance Optimizations

- **Database Indexing**: Optimized queries with proper indexes
- **Caching**: API response caching for better performance
- **Batch Operations**: Efficient bulk staff creation
- **Real-time Updates**: WebSocket integration for live updates

## Monitoring & Analytics

- **Staff Performance Metrics**: Track driver and conductor performance
- **Assignment Analytics**: Monitor assignment rates and efficiency
- **Attendance Tracking**: Comprehensive attendance management
- **Activity Logging**: Detailed activity logs for audit trails

## Future Enhancements

- **Mobile App Integration**: Staff mobile app for duty management
- **GPS Tracking**: Real-time location tracking for staff
- **Performance Analytics**: Advanced analytics dashboard
- **AI-powered Assignment**: Machine learning for optimal assignments
- **Multi-language Support**: Malayalam language support

## Troubleshooting

### Common Issues

1. **Email Not Sending**
   - Check EMAIL_USER and EMAIL_PASS environment variables
   - Ensure Gmail app password is used, not regular password
   - Check SMTP settings

2. **Staff Not Assigning**
   - Verify depot has active buses
   - Check if staff are available (not on duty)
   - Ensure proper depot permissions

3. **Database Connection Issues**
   - Verify MONGODB_URI is correct
   - Check MongoDB service is running
   - Ensure proper database permissions

### Support

For technical support or questions about the Kerala Staff Management System, please contact the development team or refer to the API documentation.

## License

This system is part of the YATRIK ERP project and follows the project's licensing terms.
