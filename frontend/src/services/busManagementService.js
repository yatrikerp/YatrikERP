import axios from 'axios';
import toast from 'react-hot-toast';

// API Configuration
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

// Create axios instance with default config
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    
    const message = error.response?.data?.message || error.message || 'An error occurred';
    toast.error(message);
    
    return Promise.reject(error);
  }
);

// Bus Management API Service
export const busManagementService = {
  // Get all buses with optional filters
  async getBuses(filters = {}) {
    try {
      console.log('busManagementService: Getting buses with filters:', filters);
      const params = new URLSearchParams();
      
      Object.entries(filters).forEach(([key, value]) => {
        if (value && value !== 'all' && value !== '') {
          params.append(key, value);
        }
      });
      
      const url = `/admin/buses?${params.toString()}`;
      console.log('busManagementService: Making request to:', url);
      console.log('busManagementService: API base URL:', apiClient.defaults.baseURL);
      console.log('busManagementService: Auth token:', localStorage.getItem('token'));
      
      const response = await apiClient.get(url);
      console.log('busManagementService: Response received:', response.data);
      
      // Handle the response format from backend
      if (response.data.success && response.data.data) {
        return response.data.data.buses || [];
      } else if (response.data.buses) {
        return response.data.buses;
      } else {
        return response.data;
      }
    } catch (error) {
      console.error('busManagementService: Error details:', error);
      console.error('busManagementService: Error response:', error.response?.data);
      throw new Error(`Failed to fetch buses: ${error.message}`);
    }
  },

  // Get single bus by ID
  async getBus(busId) {
    try {
      const response = await apiClient.get(`/admin/buses/${busId}`);
      return response.data;
    } catch (error) {
      throw new Error(`Failed to fetch bus: ${error.message}`);
    }
  },

  // Create new bus
  async createBus(busData) {
    try {
      const response = await apiClient.post('/admin/buses', busData);
      toast.success('Bus created successfully');
      return response.data;
    } catch (error) {
      throw new Error(`Failed to create bus: ${error.message}`);
    }
  },

  // Update bus
  async updateBus(busId, busData) {
    try {
      const response = await apiClient.put(`/admin/buses/${busId}`, busData);
      toast.success('Bus updated successfully');
      return response.data;
    } catch (error) {
      throw new Error(`Failed to update bus: ${error.message}`);
    }
  },

  // Delete bus
  async deleteBus(busId) {
    try {
      await apiClient.delete(`/admin/buses/${busId}`);
      toast.success('Bus deleted successfully');
      return true;
    } catch (error) {
      throw new Error(`Failed to delete bus: ${error.message}`);
    }
  },

  // Bulk operations
  async bulkUpdateBuses(busIds, action, data) {
    try {
      const response = await apiClient.post('/admin/buses/bulk', {
        busIds,
        action,
        data
      });
      toast.success(`Bulk ${action} completed successfully`);
      return response.data;
    } catch (error) {
      throw new Error(`Failed to perform bulk operation: ${error.message}`);
    }
  },

  // Get bus insights
  async getBusInsights(busId) {
    try {
      const response = await apiClient.get(`/admin/buses/${busId}/insights`);
      return response.data;
    } catch (error) {
      throw new Error(`Failed to fetch bus insights: ${error.message}`);
    }
  },

  // Get fleet analytics
  async getFleetAnalytics(timeRange = 'month') {
    try {
      const response = await apiClient.get(`/admin/buses/analytics?timeRange=${timeRange}`);
      return response.data;
    } catch (error) {
      throw new Error(`Failed to fetch fleet analytics: ${error.message}`);
    }
  },

  // Get performance metrics
  async getPerformanceMetrics(busId, timeRange = 'month') {
    try {
      const response = await apiClient.get(`/admin/buses/${busId}/performance?timeRange=${timeRange}`);
      return response.data;
    } catch (error) {
      throw new Error(`Failed to fetch performance metrics: ${error.message}`);
    }
  },

  // Update bus location
  async updateBusLocation(busId, locationData) {
    try {
      const response = await apiClient.put(`/admin/buses/${busId}/location`, locationData);
      return response.data;
    } catch (error) {
      throw new Error(`Failed to update bus location: ${error.message}`);
    }
  },

  // Schedule maintenance
  async scheduleMaintenance(busId, maintenanceData) {
    try {
      const response = await apiClient.post(`/admin/buses/${busId}/maintenance`, maintenanceData);
      toast.success('Maintenance scheduled successfully');
      return response.data;
    } catch (error) {
      throw new Error(`Failed to schedule maintenance: ${error.message}`);
    }
  },

  // Assign staff
  async assignStaff(busId, staffData) {
    try {
      const response = await apiClient.put(`/admin/buses/${busId}/staff`, staffData);
      toast.success('Staff assigned successfully');
      return response.data;
    } catch (error) {
      throw new Error(`Failed to assign staff: ${error.message}`);
    }
  },

  // Get maintenance history
  async getMaintenanceHistory(busId) {
    try {
      const response = await apiClient.get(`/admin/buses/${busId}/maintenance/history`);
      return response.data;
    } catch (error) {
      throw new Error(`Failed to fetch maintenance history: ${error.message}`);
    }
  },

  // Get fuel logs
  async getFuelLogs(busId) {
    try {
      const response = await apiClient.get(`/admin/buses/${busId}/fuel/logs`);
      return response.data;
    } catch (error) {
      throw new Error(`Failed to fetch fuel logs: ${error.message}`);
    }
  },

  // Update fuel level
  async updateFuelLevel(busId, fuelData) {
    try {
      const response = await apiClient.put(`/admin/buses/${busId}/fuel`, fuelData);
      toast.success('Fuel level updated successfully');
      return response.data;
    } catch (error) {
      throw new Error(`Failed to update fuel level: ${error.message}`);
    }
  },

  // Get documents
  async getBusDocuments(busId) {
    try {
      const response = await apiClient.get(`/admin/buses/${busId}/documents`);
      return response.data;
    } catch (error) {
      throw new Error(`Failed to fetch bus documents: ${error.message}`);
    }
  },

  // Update documents
  async updateBusDocuments(busId, documentsData) {
    try {
      const response = await apiClient.put(`/admin/buses/${busId}/documents`, documentsData);
      toast.success('Documents updated successfully');
      return response.data;
    } catch (error) {
      throw new Error(`Failed to update documents: ${error.message}`);
    }
  },

  // Export data
  async exportBusesData(format = 'csv', filters = {}) {
    try {
      const params = new URLSearchParams();
      params.append('format', format);
      
      Object.entries(filters).forEach(([key, value]) => {
        if (value && value !== 'all' && value !== '') {
          params.append(key, value);
        }
      });
      
      const response = await apiClient.get(`/admin/buses/export?${params.toString()}`, {
        responseType: 'blob'
      });
      
      // Create download link
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `buses-export.${format}`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      
      toast.success('Data exported successfully');
      return true;
    } catch (error) {
      throw new Error(`Failed to export data: ${error.message}`);
    }
  },

  // Get AI recommendations
  async getAIRecommendations() {
    try {
      const response = await apiClient.get('/buses/ai/recommendations');
      return response.data;
    } catch (error) {
      throw new Error(`Failed to fetch AI recommendations: ${error.message}`);
    }
  },

  // Get depot coordination data
  async getDepotCoordination() {
    try {
      const response = await apiClient.get('/buses/depot/coordination');
      return response.data;
    } catch (error) {
      throw new Error(`Failed to fetch depot coordination data: ${error.message}`);
    }
  },

  // Get KSRTC optimization data
  async getKSRTCOptimization() {
    try {
      const response = await apiClient.get('/buses/ksrtc/optimization');
      return response.data;
    } catch (error) {
      throw new Error(`Failed to fetch KSRTC optimization data: ${error.message}`);
    }
  }
};

// WebSocket Service for Real-time Updates
export class BusWebSocketService {
  constructor() {
    this.socket = null;
    this.listeners = new Map();
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 5;
    this.reconnectInterval = 5000;
  }

  connect() {
    const wsUrl = process.env.REACT_APP_WS_URL || 'ws://localhost:5000';
    
    try {
      this.socket = new WebSocket(wsUrl);
      
      this.socket.onopen = () => {
        console.log('WebSocket connected');
        this.reconnectAttempts = 0;
        this.emit('connected');
      };
      
      this.socket.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          this.emit('message', data);
        } catch (error) {
          console.error('Error parsing WebSocket message:', error);
        }
      };
      
      this.socket.onclose = () => {
        console.log('WebSocket disconnected');
        this.emit('disconnected');
        this.handleReconnect();
      };
      
      this.socket.onerror = (error) => {
        console.error('WebSocket error:', error);
        this.emit('error', error);
      };
    } catch (error) {
      console.error('Failed to connect WebSocket:', error);
      this.handleReconnect();
    }
  }

  disconnect() {
    if (this.socket) {
      this.socket.close();
      this.socket = null;
    }
  }

  handleReconnect() {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      console.log(`Attempting to reconnect... (${this.reconnectAttempts}/${this.maxReconnectAttempts})`);
      
      setTimeout(() => {
        this.connect();
      }, this.reconnectInterval);
    } else {
      console.error('Max reconnection attempts reached');
      this.emit('maxReconnectAttemptsReached');
    }
  }

  subscribe(event, callback) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    this.listeners.get(event).push(callback);
  }

  unsubscribe(event, callback) {
    if (this.listeners.has(event)) {
      const callbacks = this.listeners.get(event);
      const index = callbacks.indexOf(callback);
      if (index > -1) {
        callbacks.splice(index, 1);
      }
    }
  }

  emit(event, data) {
    if (this.listeners.has(event)) {
      this.listeners.get(event).forEach(callback => {
        try {
          callback(data);
        } catch (error) {
          console.error('Error in WebSocket callback:', error);
        }
      });
    }
  }

  send(data) {
    if (this.socket && this.socket.readyState === WebSocket.OPEN) {
      this.socket.send(JSON.stringify(data));
    } else {
      console.warn('WebSocket is not connected');
    }
  }

  isConnected() {
    return this.socket && this.socket.readyState === WebSocket.OPEN;
  }
}

// Create singleton instance
export const busWebSocketService = new BusWebSocketService();

// Utility functions
export const busUtils = {
  // Calculate performance score
  calculatePerformanceScore(bus) {
    let score = 0;
    let factors = 0;

    // Status factor (0-30 points)
    if (bus.status === 'active') {
      score += 30;
      factors++;
    } else if (bus.status === 'maintenance') {
      score += 10;
      factors++;
    }

    // Fuel efficiency factor (0-20 points)
    if (bus.fuel?.averageConsumption) {
      const fuelScore = Math.min(20, (bus.fuel.averageConsumption / 10) * 20);
      score += fuelScore;
      factors++;
    }

    // Maintenance factor (0-20 points)
    if (bus.maintenance?.nextService) {
      const daysUntilService = Math.ceil((new Date(bus.maintenance.nextService) - new Date()) / (1000 * 60 * 60 * 24));
      if (daysUntilService > 30) {
        score += 20;
        factors++;
      } else if (daysUntilService > 7) {
        score += 10;
        factors++;
      }
    }

    // Document compliance factor (0-15 points)
    const documents = bus.documents || {};
    const validDocs = Object.values(documents).filter(doc => 
      doc && doc.status === 'valid' && new Date(doc.expiryDate) > new Date()
    ).length;
    score += (validDocs / Object.keys(documents).length) * 15;
    factors++;

    // Capacity utilization factor (0-15 points)
    if (bus.capacity?.total) {
      score += 15;
      factors++;
    }

    return factors > 0 ? Math.round(score / factors) : 0;
  },

  // Format bus number for display
  formatBusNumber(busNumber) {
    return busNumber?.replace(/([A-Z]{2})-(\d{2})-([A-Z]{2})-(\d{4})/, '$1-$2-$3-$4') || busNumber;
  },

  // Get status color
  getStatusColor(status) {
    const colors = {
      active: 'green',
      maintenance: 'yellow',
      suspended: 'red',
      retired: 'gray'
    };
    return colors[status] || 'gray';
  },

  // Get bus type display name
  getBusTypeDisplayName(busType) {
    const types = {
      ac_sleeper: 'AC Sleeper',
      ac_seater: 'AC Seater',
      non_ac_sleeper: 'Non-AC Sleeper',
      non_ac_seater: 'Non-AC Seater',
      volvo: 'Volvo',
      mini: 'Mini Bus'
    };
    return types[busType] || busType;
  },

  // Check if maintenance is due
  isMaintenanceDue(bus) {
    if (!bus.maintenance?.nextService) return false;
    return new Date(bus.maintenance.nextService) <= new Date();
  },

  // Check if maintenance is due soon (within 7 days)
  isMaintenanceDueSoon(bus) {
    if (!bus.maintenance?.nextService) return false;
    const serviceDate = new Date(bus.maintenance.nextService);
    const weekFromNow = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    return serviceDate <= weekFromNow && serviceDate > new Date();
  },

  // Check if fuel level is low
  isFuelLow(bus) {
    return (bus.fuel?.currentLevel || 0) < 20;
  },

  // Get fuel level color
  getFuelLevelColor(level) {
    if (level >= 60) return 'green';
    if (level >= 30) return 'yellow';
    return 'red';
  }
};

export default busManagementService;
