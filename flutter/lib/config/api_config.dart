class ApiConfig {
  // Backend API URL - PRODUCTION (Always works)
  static const String baseUrl = 'https://yatrikerp.onrender.com';
  
  // Development URLs (uncomment for local testing)
  // Find your IP: Windows (ipconfig), Mac/Linux (ifconfig)
  // static const String baseUrl = 'http://192.168.1.XXX:5000'; // Replace XXX with your IP
  // static const String baseUrl = 'http://10.0.2.2:5000'; // Android emulator
  // static const String baseUrl = 'http://localhost:5000'; // iOS simulator
  
  static const String wsUrl = 'wss://yatrikerp.onrender.com';
  
  // API Endpoints
  static const String login = '/api/auth/login';
  static const String register = '/api/auth/register';
  static const String logout = '/api/auth/logout';
  
  // Passenger endpoints
  static const String passengerDashboard = '/api/passenger/dashboard';
  static const String passengerBookings = '/api/passenger/bookings';
  static const String passengerTickets = '/api/passenger/tickets';
  static const String passengerStats = '/api/passenger/stats';
  
  // Trip endpoints
  static const String searchTrips = '/api/passenger/trips/search';
  static const String allTrips = '/api/passenger/trips/all';
  static const String tripDetails = '/api/booking/trip';
  
  // Booking endpoints
  static const String createBooking = '/api/booking';
  static const String confirmBooking = '/api/booking/confirm';
  static const String bookingByPnr = '/api/booking/pnr';
  static const String myBookings = '/api/booking/my-bookings';
  
  // Search endpoints
  static const String searchLocations = '/api/search/locations';
  static const String autocomplete = '/api/search/autocomplete';
  
  // Tracking
  static const String busTracking = '/api/tracking';
  
  // Request timeout (increased for better reliability)
  static const Duration timeout = Duration(seconds: 30);
}
