/**
 * YATRIK Quick Help - Intent Matcher
 * Ultra-fast keyword-based intent matching
 * NO NLP libraries - instant response
 */

/**
 * Normalize input text
 */
function normalizeInput(text) {
  if (!text) return '';
  return text.toLowerCase().trim().replace(/[^\w\s]/g, ' ');
}

/**
 * Check if keywords match in input
 */
function hasKeywords(input, keywords) {
  const normalized = normalizeInput(input);
  return keywords.some(keyword => normalized.includes(keyword));
}

/**
 * Intent keywords map
 * Each intent has multiple keyword variations
 */
const INTENT_KEYWORDS = {
  // AUTH & LOGIN
  LOGIN: ['login', 'sign in', 'how to login', 'access', 'log in'],
  FORGOT_PASSWORD: ['forgot password', 'reset password', 'password reset', 'lost password', 'can\'t login'],
  ROLE_ACCESS: ['role', 'access', 'what can i do', 'permissions', 'my role'],
  
  // SEAT BOOKING
  BOOK_SEAT: ['book seat', 'book ticket', 'reserve seat', 'how to book', 'booking', 'buy ticket'],
  SEAT_AVAILABILITY: ['seat available', 'available seats', 'seat status', 'seats left', 'how many seats'],
  SEAT_CONFIRMATION: ['seat confirm', 'booking confirm', 'reservation confirm', 'confirmed seat'],
  TICKET_QR: ['qr code', 'qr ticket', 'ticket qr', 'how to use qr', 'scan qr'],
  
  // BUS & ROUTES
  TODAY_BUSES: ['today bus', 'buses today', 'today schedule', 'buses available today'],
  BUS_TIMING: ['bus timing', 'bus time', 'departure time', 'arrival time', 'when bus', 'bus schedule'],
  ROUTES_STOPS: ['routes', 'stops', 'route stops', 'intermediate stops', 'all stops'],
  BOARDING_POINTS: ['boarding point', 'boarding', 'where to board', 'pickup point', 'boarding location'],
  
  // LIVE TRACKING
  LIVE_TRACK: ['track bus', 'where is bus', 'bus location', 'live tracking', 'track my bus', 'where bus'],
  BUS_LOCATION: ['bus location', 'current location', 'where is my bus', 'bus position'],
  ETA: ['eta', 'arrival time', 'estimated time', 'when will bus arrive', 'reach time'],
  ROUTE_MAP: ['route map', 'map', 'show map', 'bus map', 'tracking map'],
  
  // USER LOCATION
  USER_LOCATION: ['my location', 'current location', 'detect location', 'where am i', 'my position'],
  NEARBY_BUSES: ['nearby bus', 'bus near me', 'close bus', 'buses nearby'],
  DISTANCE_TO_BOARDING: ['distance', 'how far', 'walking distance', 'distance to stop'],
  
  // PAYMENTS
  PAYMENT_SUCCESS: ['payment success', 'payment done', 'paid successfully', 'payment confirm'],
  PAYMENT_FAILED: ['payment failed', 'payment error', 'payment not working', 'can\'t pay'],
  REFUND_PROCESS: ['refund', 'cancel booking', 'get refund', 'how to refund', 'cancel ticket'],
  
  // GREETINGS & GENERAL
  GREETING: ['hi', 'hello', 'hey', 'good morning', 'good evening', 'help'],
  DEFAULT: [], // Catch-all
};

/**
 * Match user input to intent
 * Returns intent key or null
 */
export function matchIntent(input) {
  if (!input || typeof input !== 'string') {
    return 'DEFAULT';
  }

  const normalized = normalizeInput(input);
  
  // Check for greetings first
  if (hasKeywords(normalized, INTENT_KEYWORDS.GREETING)) {
    // If just greeting, return default help
    if (normalized.length < 10) {
      return 'DEFAULT';
    }
    // If greeting + question, continue matching
  }
  
  // Match intents in priority order
  // Check most specific intents first
  
  // Seat booking (high priority)
  if (hasKeywords(normalized, INTENT_KEYWORDS.BOOK_SEAT)) return 'BOOK_SEAT';
  if (hasKeywords(normalized, INTENT_KEYWORDS.SEAT_AVAILABILITY)) return 'SEAT_AVAILABILITY';
  if (hasKeywords(normalized, INTENT_KEYWORDS.SEAT_CONFIRMATION)) return 'SEAT_CONFIRMATION';
  if (hasKeywords(normalized, INTENT_KEYWORDS.TICKET_QR)) return 'TICKET_QR';
  
  // Live tracking (high priority)
  if (hasKeywords(normalized, INTENT_KEYWORDS.LIVE_TRACK)) return 'LIVE_TRACK';
  if (hasKeywords(normalized, INTENT_KEYWORDS.BUS_LOCATION)) return 'BUS_LOCATION';
  if (hasKeywords(normalized, INTENT_KEYWORDS.ETA)) return 'ETA';
  if (hasKeywords(normalized, INTENT_KEYWORDS.ROUTE_MAP)) return 'ROUTE_MAP';
  
  // Location
  if (hasKeywords(normalized, INTENT_KEYWORDS.USER_LOCATION)) return 'USER_LOCATION';
  if (hasKeywords(normalized, INTENT_KEYWORDS.NEARBY_BUSES)) return 'NEARBY_BUSES';
  if (hasKeywords(normalized, INTENT_KEYWORDS.DISTANCE_TO_BOARDING)) return 'DISTANCE_TO_BOARDING';
  
  // Bus & routes
  if (hasKeywords(normalized, INTENT_KEYWORDS.TODAY_BUSES)) return 'TODAY_BUSES';
  if (hasKeywords(normalized, INTENT_KEYWORDS.BUS_TIMING)) return 'BUS_TIMING';
  if (hasKeywords(normalized, INTENT_KEYWORDS.ROUTES_STOPS)) return 'ROUTES_STOPS';
  if (hasKeywords(normalized, INTENT_KEYWORDS.BOARDING_POINTS)) return 'BOARDING_POINTS';
  
  // Payments
  if (hasKeywords(normalized, INTENT_KEYWORDS.PAYMENT_SUCCESS)) return 'PAYMENT_SUCCESS';
  if (hasKeywords(normalized, INTENT_KEYWORDS.PAYMENT_FAILED)) return 'PAYMENT_FAILED';
  if (hasKeywords(normalized, INTENT_KEYWORDS.REFUND_PROCESS)) return 'REFUND_PROCESS';
  
  // Auth
  if (hasKeywords(normalized, INTENT_KEYWORDS.LOGIN)) return 'LOGIN';
  if (hasKeywords(normalized, INTENT_KEYWORDS.FORGOT_PASSWORD)) return 'FORGOT_PASSWORD';
  if (hasKeywords(normalized, INTENT_KEYWORDS.ROLE_ACCESS)) return 'ROLE_ACCESS';
  
  // Default fallback
  return 'DEFAULT';
}

/**
 * Quick intent check (for suggestions)
 */
export function getQuickSuggestions() {
  return [
    { text: 'How to book seat?', intent: 'BOOK_SEAT' },
    { text: 'Bus timing', intent: 'BUS_TIMING' },
    { text: 'Track my bus', intent: 'LIVE_TRACK' },
    { text: 'My location', intent: 'USER_LOCATION' },
  ];
}
