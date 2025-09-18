// Depot API Service - Centralized API calls for depot dashboard
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

// Helper function to get auth headers
const getAuthHeaders = () => {
  // Try multiple token sources
  const token = localStorage.getItem('depotToken') || 
                localStorage.getItem('token') || 
                localStorage.getItem('adminToken') ||
                localStorage.getItem('authToken');
  
  console.log('Using token for API calls:', token ? 'Token found' : 'No token found');
  
  return {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  };
};

// Helper function to handle API responses
const handleApiResponse = async (response) => {
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
  }
  return response.json();
};

// =================================================================
// 1. FLEET MANAGEMENT APIs
// =================================================================

export const fleetApiService = {
  // Get all buses for depot
  getBuses: async (params = {}) => {
    const queryParams = new URLSearchParams(params).toString();
    const response = await fetch(`${API_BASE_URL}/depot/buses${queryParams ? `?${queryParams}` : ''}`, {
      headers: getAuthHeaders()
    });
    return handleApiResponse(response);
  },

  // Get bus details
  getBusDetails: async (busId) => {
    const response = await fetch(`${API_BASE_URL}/depot/buses/${busId}`, {
      headers: getAuthHeaders()
    });
    return handleApiResponse(response);
  },

  // Add new bus
  addBus: async (busData) => {
    const response = await fetch(`${API_BASE_URL}/depot/buses`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(busData)
    });
    return handleApiResponse(response);
  },

  // Update bus
  updateBus: async (busId, busData) => {
    const response = await fetch(`${API_BASE_URL}/depot/buses/${busId}`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(busData)
    });
    return handleApiResponse(response);
  },

  // Delete bus
  deleteBus: async (busId) => {
    const response = await fetch(`${API_BASE_URL}/depot/buses/${busId}`, {
      method: 'DELETE',
      headers: getAuthHeaders()
    });
    return handleApiResponse(response);
  },

  // Get bus maintenance logs
  getMaintenanceLogs: async (busId, params = {}) => {
    const queryParams = new URLSearchParams(params).toString();
    const response = await fetch(`${API_BASE_URL}/depot/buses/${busId}/maintenance${queryParams ? `?${queryParams}` : ''}`, {
      headers: getAuthHeaders()
    });
    return handleApiResponse(response);
  },

  // Add maintenance log
  addMaintenanceLog: async (busId, maintenanceData) => {
    const response = await fetch(`${API_BASE_URL}/depot/buses/${busId}/maintenance`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(maintenanceData)
    });
    return handleApiResponse(response);
  }
};

// =================================================================
// 2. ROUTE MANAGEMENT APIs
// =================================================================

export const routeApiService = {
  // Get all routes for depot - try depot API first, fallback to admin API
  getRoutes: async (params = {}) => {
    try {
      // First try depot-specific routes
      const queryParams = new URLSearchParams(params).toString();
      const response = await fetch(`${API_BASE_URL}/depot/routes${queryParams ? `?${queryParams}` : ''}`, {
        headers: getAuthHeaders()
      });
      
      if (response.ok) {
        const data = await response.json();
        return data;
      } else {
        // Fallback to admin routes if depot routes fail
        console.log('Depot routes failed, trying admin routes...');
        return await routeApiService.getAdminRoutes(params);
      }
    } catch (error) {
      console.log('Depot routes error, trying admin routes...', error);
      return await routeApiService.getAdminRoutes(params);
    }
  },

  // Get routes from admin API as fallback
  getAdminRoutes: async (params = {}) => {
    const queryParams = new URLSearchParams(params).toString();
    const response = await fetch(`${API_BASE_URL}/admin/routes${queryParams ? `?${queryParams}` : ''}`, {
      headers: getAuthHeaders()
    });
    return handleApiResponse(response);
  },

  // Get route details
  getRouteDetails: async (routeId) => {
    const response = await fetch(`${API_BASE_URL}/depot/routes/${routeId}`, {
      headers: getAuthHeaders()
    });
    return handleApiResponse(response);
  },

  // Add new route
  addRoute: async (routeData) => {
    const response = await fetch(`${API_BASE_URL}/depot/routes`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(routeData)
    });
    return handleApiResponse(response);
  },

  // Update route
  updateRoute: async (routeId, routeData) => {
    const response = await fetch(`${API_BASE_URL}/depot/routes/${routeId}`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(routeData)
    });
    return handleApiResponse(response);
  },

  // Delete route
  deleteRoute: async (routeId) => {
    const response = await fetch(`${API_BASE_URL}/depot/routes/${routeId}`, {
      method: 'DELETE',
      headers: getAuthHeaders()
    });
    return handleApiResponse(response);
  },

  // Get route stops
  getRouteStops: async (routeId) => {
    const response = await fetch(`${API_BASE_URL}/depot/routes/${routeId}/stops`, {
      headers: getAuthHeaders()
    });
    return handleApiResponse(response);
  }
};

// =================================================================
// 3. TRIP MANAGEMENT APIs
// =================================================================

export const tripApiService = {
  // Get all trips for depot
  getTrips: async (params = {}) => {
    const queryParams = new URLSearchParams(params).toString();
    const response = await fetch(`${API_BASE_URL}/depot/trips${queryParams ? `?${queryParams}` : ''}`, {
      headers: getAuthHeaders()
    });
    return handleApiResponse(response);
  },

  // Get trip details
  getTripDetails: async (tripId) => {
    const response = await fetch(`${API_BASE_URL}/depot/trips/${tripId}`, {
      headers: getAuthHeaders()
    });
    return handleApiResponse(response);
  },

  // Create new trip
  createTrip: async (tripData) => {
    const response = await fetch(`${API_BASE_URL}/depot/trips`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(tripData)
    });
    return handleApiResponse(response);
  },

  // Update trip
  updateTrip: async (tripId, tripData) => {
    const response = await fetch(`${API_BASE_URL}/depot/trips/${tripId}`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(tripData)
    });
    return handleApiResponse(response);
  },

  // Cancel trip
  cancelTrip: async (tripId, reason) => {
    const response = await fetch(`${API_BASE_URL}/depot/trips/${tripId}/cancel`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ reason })
    });
    return handleApiResponse(response);
  },

  // Start trip
  startTrip: async (tripId) => {
    const response = await fetch(`${API_BASE_URL}/depot/trips/${tripId}/start`, {
      method: 'POST',
      headers: getAuthHeaders()
    });
    return handleApiResponse(response);
  },

  // Complete trip
  completeTrip: async (tripId) => {
    const response = await fetch(`${API_BASE_URL}/depot/trips/${tripId}/complete`, {
      method: 'POST',
      headers: getAuthHeaders()
    });
    return handleApiResponse(response);
  }
};

// =================================================================
// 4. BOOKING MANAGEMENT APIs
// =================================================================

export const bookingApiService = {
  // Get all bookings for depot
  getBookings: async (params = {}) => {
    const queryParams = new URLSearchParams(params).toString();
    const response = await fetch(`${API_BASE_URL}/depot/bookings${queryParams ? `?${queryParams}` : ''}`, {
      headers: getAuthHeaders()
    });
    return handleApiResponse(response);
  },

  // Get booking details
  getBookingDetails: async (bookingId) => {
    const response = await fetch(`${API_BASE_URL}/depot/bookings/${bookingId}`, {
      headers: getAuthHeaders()
    });
    return handleApiResponse(response);
  },

  // Get tickets for depot
  getTickets: async (params = {}) => {
    const queryParams = new URLSearchParams(params).toString();
    const response = await fetch(`${API_BASE_URL}/depot/tickets${queryParams ? `?${queryParams}` : ''}`, {
      headers: getAuthHeaders()
    });
    return handleApiResponse(response);
  },

  // Validate ticket
  validateTicket: async (ticketId, location, deviceInfo) => {
    const response = await fetch(`${API_BASE_URL}/depot/tickets/${ticketId}/validate`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify({ location, deviceInfo })
    });
    return handleApiResponse(response);
  },

  // Cancel ticket
  cancelTicket: async (ticketId, reason) => {
    const response = await fetch(`${API_BASE_URL}/depot/tickets/${ticketId}/cancel`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ reason })
    });
    return handleApiResponse(response);
  },

  // Get booking statistics
  getBookingStats: async (params = {}) => {
    const queryParams = new URLSearchParams(params).toString();
    const response = await fetch(`${API_BASE_URL}/depot/bookings/stats${queryParams ? `?${queryParams}` : ''}`, {
      headers: getAuthHeaders()
    });
    return handleApiResponse(response);
  }
};

// =================================================================
// 5. STAFF MANAGEMENT APIs
// =================================================================

export const staffApiService = {
  // Get all drivers
  getDrivers: async (params = {}) => {
    const queryParams = new URLSearchParams(params).toString();
    const response = await fetch(`${API_BASE_URL}/depot/drivers${queryParams ? `?${queryParams}` : ''}`, {
      headers: getAuthHeaders()
    });
    return handleApiResponse(response);
  },

  // Get all conductors
  getConductors: async (params = {}) => {
    const queryParams = new URLSearchParams(params).toString();
    const response = await fetch(`${API_BASE_URL}/depot/conductors${queryParams ? `?${queryParams}` : ''}`, {
      headers: getAuthHeaders()
    });
    return handleApiResponse(response);
  },

  // Get crew assignments
  getCrewAssignments: async (params = {}) => {
    const queryParams = new URLSearchParams(params).toString();
    const response = await fetch(`${API_BASE_URL}/depot/crew${queryParams ? `?${queryParams}` : ''}`, {
      headers: getAuthHeaders()
    });
    return handleApiResponse(response);
  },

  // Add driver
  addDriver: async (driverData) => {
    const response = await fetch(`${API_BASE_URL}/depot/drivers`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(driverData)
    });
    return handleApiResponse(response);
  },

  // Add conductor
  addConductor: async (conductorData) => {
    const response = await fetch(`${API_BASE_URL}/depot/conductors`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(conductorData)
    });
    return handleApiResponse(response);
  },

  // Update driver
  updateDriver: async (driverId, driverData) => {
    const response = await fetch(`${API_BASE_URL}/depot/drivers/${driverId}`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(driverData)
    });
    return handleApiResponse(response);
  },

  // Update conductor
  updateConductor: async (conductorId, conductorData) => {
    const response = await fetch(`${API_BASE_URL}/depot/conductors/${conductorId}`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(conductorData)
    });
    return handleApiResponse(response);
  },

  // Get staff attendance
  getStaffAttendance: async (params = {}) => {
    const queryParams = new URLSearchParams(params).toString();
    const response = await fetch(`${API_BASE_URL}/depot/attendance${queryParams ? `?${queryParams}` : ''}`, {
      headers: getAuthHeaders()
    });
    return handleApiResponse(response);
  },

  // Mark attendance
  markAttendance: async (attendanceData) => {
    const response = await fetch(`${API_BASE_URL}/depot/attendance`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(attendanceData)
    });
    return handleApiResponse(response);
  }
};

// =================================================================
// 6. BUS SCHEDULING APIs
// =================================================================

export const schedulingApiService = {
  // Get bus schedules
  getBusSchedules: async (params = {}) => {
    const queryParams = new URLSearchParams(params).toString();
    const response = await fetch(`${API_BASE_URL}/depot/schedules${queryParams ? `?${queryParams}` : ''}`, {
      headers: getAuthHeaders()
    });
    return handleApiResponse(response);
  },

  // Create bus schedule
  createSchedule: async (scheduleData) => {
    const response = await fetch(`${API_BASE_URL}/depot/schedules`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(scheduleData)
    });
    return handleApiResponse(response);
  },

  // Update schedule
  updateSchedule: async (scheduleId, scheduleData) => {
    const response = await fetch(`${API_BASE_URL}/depot/schedules/${scheduleId}`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(scheduleData)
    });
    return handleApiResponse(response);
  },

  // Delete schedule
  deleteSchedule: async (scheduleId) => {
    const response = await fetch(`${API_BASE_URL}/depot/schedules/${scheduleId}`, {
      method: 'DELETE',
      headers: getAuthHeaders()
    });
    return handleApiResponse(response);
  },

  // Get duty assignments
  getDutyAssignments: async (params = {}) => {
    const queryParams = new URLSearchParams(params).toString();
    const response = await fetch(`${API_BASE_URL}/depot/duty${queryParams ? `?${queryParams}` : ''}`, {
      headers: getAuthHeaders()
    });
    return handleApiResponse(response);
  },

  // Assign duty
  assignDuty: async (dutyData) => {
    const response = await fetch(`${API_BASE_URL}/depot/duty`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(dutyData)
    });
    return handleApiResponse(response);
  }
};

// =================================================================
// 7. REPORTS & ANALYTICS APIs
// =================================================================

export const reportsApiService = {
  // Get depot dashboard data
  getDashboardData: async () => {
    const response = await fetch(`${API_BASE_URL}/depot/dashboard`, {
      headers: getAuthHeaders()
    });
    return handleApiResponse(response);
  },

  // Get revenue reports
  getRevenueReports: async (params = {}) => {
    const queryParams = new URLSearchParams(params).toString();
    const response = await fetch(`${API_BASE_URL}/depot/reports/revenue${queryParams ? `?${queryParams}` : ''}`, {
      headers: getAuthHeaders()
    });
    return handleApiResponse(response);
  },

  // Get trip reports
  getTripReports: async (params = {}) => {
    const queryParams = new URLSearchParams(params).toString();
    const response = await fetch(`${API_BASE_URL}/depot/reports/trips${queryParams ? `?${queryParams}` : ''}`, {
      headers: getAuthHeaders()
    });
    return handleApiResponse(response);
  },

  // Get booking reports
  getBookingReports: async (params = {}) => {
    const queryParams = new URLSearchParams(params).toString();
    const response = await fetch(`${API_BASE_URL}/depot/reports/bookings${queryParams ? `?${queryParams}` : ''}`, {
      headers: getAuthHeaders()
    });
    return handleApiResponse(response);
  },

  // Get fuel reports
  getFuelReports: async (params = {}) => {
    const queryParams = new URLSearchParams(params).toString();
    const response = await fetch(`${API_BASE_URL}/depot/reports/fuel${queryParams ? `?${queryParams}` : ''}`, {
      headers: getAuthHeaders()
    });
    return handleApiResponse(response);
  },

  // Get maintenance reports
  getMaintenanceReports: async (params = {}) => {
    const queryParams = new URLSearchParams(params).toString();
    const response = await fetch(`${API_BASE_URL}/depot/reports/maintenance${queryParams ? `?${queryParams}` : ''}`, {
      headers: getAuthHeaders()
    });
    return handleApiResponse(response);
  },

  // Get staff performance reports
  getStaffPerformanceReports: async (params = {}) => {
    const queryParams = new URLSearchParams(params).toString();
    const response = await fetch(`${API_BASE_URL}/depot/reports/staff-performance${queryParams ? `?${queryParams}` : ''}`, {
      headers: getAuthHeaders()
    });
    return handleApiResponse(response);
  },

  // Export reports
  exportReport: async (reportType, format, params = {}) => {
    const queryParams = new URLSearchParams({ ...params, format }).toString();
    const response = await fetch(`${API_BASE_URL}/depot/reports/export/${reportType}?${queryParams}`, {
      headers: getAuthHeaders()
    });
    return handleApiResponse(response);
  }
};

// =================================================================
// 8. GENERAL DEPOT APIs
// =================================================================

export const depotApiService = {
  // Get depot information
  getDepotInfo: async () => {
    const response = await fetch(`${API_BASE_URL}/depot/info`, {
      headers: getAuthHeaders()
    });
    return handleApiResponse(response);
  },

  // Get depot statistics
  getDepotStats: async (params = {}) => {
    const queryParams = new URLSearchParams(params).toString();
    const response = await fetch(`${API_BASE_URL}/depot/stats${queryParams ? `?${queryParams}` : ''}`, {
      headers: getAuthHeaders()
    });
    return handleApiResponse(response);
  },

  // Get fuel logs
  getFuelLogs: async (params = {}) => {
    const queryParams = new URLSearchParams(params).toString();
    const response = await fetch(`${API_BASE_URL}/depot/fuel${queryParams ? `?${queryParams}` : ''}`, {
      headers: getAuthHeaders()
    });
    return handleApiResponse(response);
  },

  // Record fuel fill-up
  recordFuelFillUp: async (fuelData) => {
    const response = await fetch(`${API_BASE_URL}/depot/fuel`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(fuelData)
    });
    return handleApiResponse(response);
  },

  // Get notifications
  getNotifications: async (params = {}) => {
    const queryParams = new URLSearchParams(params).toString();
    const response = await fetch(`${API_BASE_URL}/depot/notifications${queryParams ? `?${queryParams}` : ''}`, {
      headers: getAuthHeaders()
    });
    return handleApiResponse(response);
  },

  // Mark notification as read
  markNotificationAsRead: async (notificationId) => {
    const response = await fetch(`${API_BASE_URL}/depot/notifications/${notificationId}/read`, {
      method: 'PUT',
      headers: getAuthHeaders()
    });
    return handleApiResponse(response);
  }
};

// =================================================================
// 9. EXPORT ALL SERVICES
// =================================================================

export default {
  fleetApiService,
  routeApiService,
  tripApiService,
  bookingApiService,
  staffApiService,
  schedulingApiService,
  reportsApiService,
  depotApiService
};
