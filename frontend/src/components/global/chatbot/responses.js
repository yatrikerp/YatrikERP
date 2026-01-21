/**
 * YATRIK Quick Help - Predefined Responses
 * All answers are instant, no API calls
 */

import cache from './cache';

/**
 * Generate response based on intent and user role
 */
export function getResponse(intent, userRole, input = '') {
  const role = userRole?.toLowerCase() || 'guest';
  
  // Filter responses based on role
  const roleResponses = RESPONSES[intent]?.[role] || RESPONSES[intent]?.default || null;
  
  if (roleResponses) {
    // If function, call it with context
    if (typeof roleResponses === 'function') {
      return roleResponses(input);
    }
    return roleResponses;
  }
  
  return DEFAULT_FALLBACK;
}

/**
 * All predefined responses organized by intent and role
 */
const RESPONSES = {
  // AUTH & LOGIN
  LOGIN: {
    default: "To login:\n1. Go to the login page\n2. Enter your email/phone and password\n3. Click 'Login'\n\nYour role (Passenger/Admin/Conductor) determines your dashboard access.\n\n💡 New user? Click 'Sign Up' to create an account first!",
    guest: "How to Login:\n\n1. Click 'Login' button (top right)\n2. Enter your email/phone and password\n3. Or use Google/Phone OTP login\n\n💡 New to Yatrik?\n• Click 'Sign Up' to create account\n• Book tickets instantly\n• Track your buses\n• Manage bookings\n\nLogin unlocks all features!",
  },
  
  FORGOT_PASSWORD: {
    default: "Forgot Password?\n1. Click 'Forgot Password' on login page\n2. Enter your registered email\n3. Check your email for reset link\n4. Follow instructions to set new password",
  },
  
  ROLE_ACCESS: {
    default: "Role-Based Access:\n\n👤 Passenger: Book seats, view tickets, track buses\n👨‍💼 Admin: System management, fleet control\n🎫 Conductor: Validate tickets, manage trips\n🚗 Driver: Update location, trip status\n\nYou're logged in as: ",
    passenger: "You're a Passenger. You can:\n• Book seats\n• View tickets\n• Track buses\n• Check routes\n• Manage wallet",
    admin: "You're an Admin. You can:\n• Manage system settings\n• Control fleet\n• View analytics\n• Manage users",
    conductor: "You're a Conductor. You can:\n• Validate QR tickets\n• Manage trips\n• View passenger list",
    driver: "You're a Driver. You can:\n• Update bus location\n• Manage trip status\n• View route details",
  },
  
  // SEAT BOOKING
  BOOK_SEAT: {
    default: () => {
      return "How to Book Seats:\n1. Search for your route\n2. Select departure date\n3. Choose a bus\n4. Select your seats (green = available)\n5. Enter passenger details\n6. Complete payment\n\nYour ticket QR will be sent via email and SMS.";
    },
    guest: "How to Book Seats:\n\n1. First, create an account (Sign Up)\n2. Or login if you already have one\n3. Search for your route on the homepage\n4. Select departure date\n5. Choose a bus\n6. Select your seats\n7. Enter passenger details\n8. Complete payment\n\n💡 After login, you can:\n• Save favorite routes\n• View booking history\n• Track buses in real-time\n• Manage your wallet\n\nStart by clicking 'Login' or 'Sign Up'!",
  },
  
  SEAT_AVAILABILITY: {
    default: () => {
      const buses = cache.getTodayBuses();
      return `Seat Availability:\n\n${buses.length > 0 
        ? `✅ ${buses.length} buses available today\n• Green seats = Available\n• Red seats = Booked\n• Yellow seats = Your selection\n\nClick on a bus to see real-time availability.`
        : 'No buses available today. Please check tomorrow or contact support.'}`;
    },
  },
  
  SEAT_CONFIRMATION: {
    default: "Seat Confirmation:\n\nAfter payment:\n✅ You'll receive a booking confirmation\n✅ QR ticket sent via email/SMS\n✅ Seat number reserved\n\nYour ticket is valid until departure. Show QR code to conductor.",
  },
  
  TICKET_QR: {
    default: "Ticket QR Usage:\n\n📱 Show your QR code to the conductor\n🚌 QR is scanned at boarding point\n✅ Confirmed seats cannot be changed\n\nNote: QR is valid for the booked trip only.",
  },
  
  // BUS & ROUTES
  TODAY_BUSES: {
    default: () => {
      const buses = cache.getTodayBuses();
      if (buses.length > 0) {
        return `Today's Buses:\n\n✅ ${buses.length} buses available\n\nTo see details:\n1. Search your route\n2. Select today's date\n3. View available buses and timings`;
      }
      return "No buses scheduled for today. Please check tomorrow or search for other dates.";
    },
  },
  
  BUS_TIMING: {
    default: "Bus Timings:\n\n1. Search your route\n2. Select departure date\n3. View available timings\n4. Each bus shows:\n   • Departure time\n   • Arrival time\n   • Duration\n   • Available seats",
  },
  
  ROUTES_STOPS: {
    default: () => {
      const routes = cache.getRoutes();
      return `Routes & Stops:\n\n${routes.length > 0 
        ? `✅ ${routes.length} routes available\n\nTo see stops:\n1. Search routes\n2. Select a route\n3. View boarding/dropping points\n\nEach route shows all intermediate stops.`
        : 'Routes are being updated. Please search for your destination.'}`;
    },
  },
  
  BOARDING_POINTS: {
    default: "Boarding Points:\n\nWhen booking:\n1. Select your boarding point from the list\n2. Choose a convenient location\n3. Arrive 10 minutes before departure\n4. Show QR code at boarding\n\nYour boarding point is shown on your ticket.",
  },
  
  // LIVE TRACKING
  LIVE_TRACK: {
    default: "Live Bus Tracking:\n\n1. Go to 'Track Bus' section\n2. Enter your booking ID\n3. See real-time location on map\n4. View estimated arrival time\n\nYour bus location updates every 30 seconds.",
  },
  
  BUS_LOCATION: {
    default: "Current Bus Location:\n\nTo track your bus:\n1. Open your ticket\n2. Click 'Track Bus'\n3. See live map with bus icon\n4. View ETA at your stop\n\nLocation updates automatically.",
  },
  
  ETA: {
    default: "Estimated Arrival Time:\n\nOn the tracking map:\n• Blue marker = Your boarding point\n• Red marker = Current bus location\n• Green line = Route path\n• ETA shown in minutes\n\nETA updates in real-time.",
  },
  
  ROUTE_MAP: {
    default: "Route Map Display:\n\nWhen tracking:\n• Interactive map shows full route\n• Your boarding point marked\n• Bus location updates live\n• Tap on map to zoom\n\nMap uses your location for better accuracy.",
  },
  
  // USER LOCATION
  USER_LOCATION: {
    default: () => {
      const location = cache.getUserLocation();
      if (location) {
        return `Your Location:\n\n📍 Detected: ${location.lat.toFixed(4)}, ${location.lng.toFixed(4)}\n\nTo update:\n• Allow location access\n• We'll find nearby buses\n• Show distance to boarding points\n\nLocation is used only for finding nearby services.`;
      }
      return "Location Detection:\n\nTo enable:\n1. Allow browser location access\n2. We'll detect your coordinates\n3. Show nearby buses\n4. Calculate distance to boarding points\n\nYour location is never shared or stored permanently.";
    },
  },
  
  NEARBY_BUSES: {
    default: () => {
      const buses = cache.getTodayBuses();
      const location = cache.getUserLocation();
      if (location && buses.length > 0) {
        return `Nearby Buses:\n\n📍 Using your location\n✅ ${buses.length} buses available today\n\nTo see nearby:\n1. Allow location access\n2. Search routes\n3. Buses sorted by distance\n4. Click to see boarding points`;
      }
      return "Nearby Buses:\n\n1. Allow location permission\n2. We'll find buses near you\n3. Show boarding points by distance\n4. Calculate walking time\n\nLocation access is optional but helpful.";
    },
  },
  
  DISTANCE_TO_BOARDING: {
    default: "Distance to Boarding Point:\n\nAfter allowing location:\n• See distance to each boarding point\n• Walking time estimate\n• Nearby bus stops highlighted\n• Route directions available\n\nHelps you choose the best boarding point.",
  },
  
  // PAYMENTS
  PAYMENT_SUCCESS: {
    default: "Payment Successful! ✅\n\nYour booking is confirmed:\n• Seat reserved\n• QR ticket sent\n• Email confirmation\n• SMS notification\n\nYour ticket is ready. Check 'My Bookings' section.",
  },
  
  PAYMENT_FAILED: {
    default: "Payment Failed:\n\nIf payment failed:\n1. Check your card/bank balance\n2. Verify card details\n3. Try again (seat still reserved)\n4. Contact support if issue persists\n\nYour selected seats are held for 10 minutes.",
  },
  
  REFUND_PROCESS: {
    default: "Refund Process:\n\nTo request refund:\n1. Go to 'My Bookings'\n2. Select the booking\n3. Click 'Cancel & Refund'\n4. Refund processed in 5-7 days\n\nRefund amount depends on cancellation time. Check cancellation policy.",
  },
  
  // DEFAULT FALLBACK
  DEFAULT: {
    default: "I'm Yatrik Quick Help! 😊\n\nI can help with:\n• Seat booking\n• Bus timings & routes\n• Live bus tracking\n• Payments & refunds\n• Ticket QR codes\n\nTry asking:\n• 'How to book seat'\n• 'Bus timing'\n• 'Where is my bus'\n• 'My location'",
    guest: "Hi! I'm Yatrik Quick Help! 😊\n\nI can help you with:\n• How to book tickets\n• Understanding bus routes\n• Getting started\n• Login & signup help\n\n💡 Login to unlock:\n• Live bus tracking\n• Seat availability\n• Payment options\n• Booking management\n\nTry asking:\n• 'How to book seat'\n• 'How to login'\n• 'Bus timing'\n\nOr click 'Login' to get started!",
  },
};

/**
 * Default fallback when intent not matched
 */
const DEFAULT_FALLBACK = "I'm not sure about that. 🤔\n\nI can help with:\n• Booking seats\n• Bus routes & timings\n• Live tracking\n• Payments\n• Ticket QR\n\nTry: 'book seat', 'bus timing', 'track bus', or 'my location'";

/**
 * Get help based on user role
 */
export function getRoleBasedHelp(userRole) {
  const role = userRole?.toLowerCase() || 'passenger';
  const helpMap = {
    passenger: "Passenger Help:\n• Book seats\n• Track buses\n• View tickets\n• Check routes\n• Manage wallet",
    admin: "Admin Help:\n• System management\n• Fleet control\n• Analytics\n• User management\n• Route management",
    conductor: "Conductor Help:\n• Validate QR tickets\n• Manage trips\n• Passenger list\n• Trip status",
    driver: "Driver Help:\n• Update location\n• Trip status\n• Route details\n• Duty management",
  };
  return helpMap[role] || helpMap.passenger;
}
