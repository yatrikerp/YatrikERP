# 🎯 **Role-Based User System - YATRIK ERP**

## 📧 **Email Pattern Rules**

| Role | Email Pattern | Example | Description |
|------|---------------|---------|-------------|
| **ADMIN** | `admin@yatrik.com` | `admin@yatrik.com` | Fixed admin email |
| **DEPOT MANAGER** | `{place}-depot@yatrik.com` | `mumbai-depot@yatrik.com` | Place name + depot |
| **CONDUCTOR** | `{Cname}-{depot}@yatrik.com` | `rajesh-mumbai@yatrik.com` | Conductor name + depot |
| **DRIVER** | `{Dname}-{depot}@yatrik.com` | `suresh-mumbai@yatrik.com` | Driver name + depot |
| **PASSENGER** | `{name}@gmail.com` | `john.doe@gmail.com` | Gmail addresses only |

---

## 👥 **Available Users & Login Credentials**

### 🔐 **ADMIN**
- **Email**: `admin@yatrik.com`
- **Password**: `Yatrik123`
- **Dashboard**: `/admin` (AdminMasterDashboard)

### 🏢 **DEPOT MANAGERS**
- **Email**: `mumbai-depot@yatrik.com`
- **Password**: `Depot123`
- **Dashboard**: `/depot` (DepotDashboard)

- **Email**: `delhi-depot@yatrik.com`
- **Password**: `Depot123`
- **Dashboard**: `/depot` (DepotDashboard)

### 🎫 **CONDUCTORS**
- **Email**: `rajesh-mumbai@yatrik.com`
- **Password**: `Conductor123`
- **Dashboard**: `/conductor` (ConductorDashboard)

- **Email**: `amit-delhi@yatrik.com`
- **Password**: `Conductor123`
- **Dashboard**: `/conductor` (ConductorDashboard)

### 🚌 **DRIVERS**
- **Email**: `suresh-mumbai@yatrik.com`
- **Password**: `Driver123`
- **Dashboard**: `/driver` (DriverDashboard)

- **Email**: `ramesh-delhi@yatrik.com`
- **Password**: `Driver123`
- **Dashboard**: `/driver` (DriverDashboard)

### 👤 **PASSENGERS**
- **Email**: `john.doe@gmail.com`
- **Password**: `Passenger123`
- **Dashboard**: `/pax` (PassengerDashboard)

- **Email**: `jane.smith@gmail.com`
- **Password**: `Passenger123`
- **Dashboard**: `/pax` (PassengerDashboard)

---

## 🚀 **How to Test**

1. **Go to**: `http://localhost:5173/login`
2. **Use any credentials above**
3. **System will automatically redirect to role-specific dashboard**

---

## 🔒 **Security Features**

- ✅ **Email Pattern Validation**: Enforced during registration
- ✅ **Role-Based Access Control**: Each route protected by RequireAuth
- ✅ **Automatic Redirection**: Based on user role after login
- ✅ **Password Hashing**: Bcrypt with 12 salt rounds
- ✅ **JWT Authentication**: 7-day token expiration

---

## 📱 **Phone Number Format**

All users use **10-digit Indian phone numbers** (e.g., `9876543210`)

---

## 🎨 **Dashboard Routes**

| Role | Route | Component |
|------|-------|-----------|
| **Admin** | `/admin` | AdminMasterDashboard |
| **Depot Manager** | `/depot` | DepotDashboard |
| **Conductor** | `/conductor` | ConductorDashboard |
| **Driver** | `/driver` | DriverDashboard |
| **Passenger** | `/pax` | PassengerDashboard |

---

## ⚠️ **Important Notes**

1. **Email patterns are enforced** - Users cannot register with incorrect email formats
2. **Role changes require admin approval** - Email validation will update accordingly
3. **Gmail addresses only** for passengers - Other email providers not allowed
4. **Yatrik.com domain** required for staff roles (admin, conductor, driver, depot manager)

---

## 🛠️ **Technical Implementation**

- **Backend**: Email validation middleware in `backend/middleware/emailValidation.js`
- **Frontend**: Role-based routing in `frontend/src/pages/RedirectDashboard.jsx`
- **Database**: User model with role enum validation
- **Authentication**: JWT-based with role information

---

## 🔧 **Adding New Users**

To add new users, use the script:
```bash
cd backend
node scripts/setupRoleBasedUsers.js
```

Or manually create users following the email pattern rules above.

---

**🎉 Your YATRIK ERP system now has complete role-based access control with enforced email patterns!**
