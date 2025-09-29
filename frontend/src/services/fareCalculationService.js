// Fare calculation service for automatic pricing
import { apiFetch } from '../utils/api';

class FareCalculationService {
  // Calculate fare based on distance and bus type
  static async calculateFare(distance, busType, routeType = 'intercity') {
    try {
      const response = await apiFetch('/api/admin/fare-policies/calculate', {
        method: 'POST',
        body: JSON.stringify({
          distance,
          busType,
          routeType
        })
      });

      if (response.success) {
        return {
          baseFare: response.data.baseFare,
          totalFare: response.data.totalFare,
          minimumFare: response.data.minimumFare,
          ratePerKm: response.data.ratePerKm,
          appliedPolicy: response.data.appliedPolicy
        };
      } else {
        throw new Error(response.message || 'Failed to calculate fare');
      }
    } catch (error) {
      console.error('Error calculating fare:', error);
      // Fallback calculation
      return this.getFallbackFare(distance, busType);
    }
  }

  // Fallback fare calculation if API fails
  static getFallbackFare(distance, busType) {
    const fareRates = {
      'ordinary': { ratePerKm: 1.5, minimumFare: 5 },
      'fast_passenger': { ratePerKm: 2.0, minimumFare: 8 },
      'super_fast': { ratePerKm: 2.5, minimumFare: 10 },
      'super_deluxe': { ratePerKm: 3.0, minimumFare: 15 },
      'low_floor_ac': { ratePerKm: 3.5, minimumFare: 20 },
      'garuda_volvo': { ratePerKm: 4.0, minimumFare: 25 },
      'venad': { ratePerKm: 2.2, minimumFare: 8 },
      'deluxe_express': { ratePerKm: 2.8, minimumFare: 12 },
      'garuda_king_long': { ratePerKm: 4.5, minimumFare: 30 },
      'rajadhani': { ratePerKm: 5.0, minimumFare: 35 }
    };

    const rate = fareRates[busType] || fareRates['ordinary'];
    const baseFare = distance * rate.ratePerKm;
    const totalFare = Math.max(baseFare, rate.minimumFare);

    return {
      baseFare,
      totalFare,
      minimumFare: rate.minimumFare,
      ratePerKm: rate.ratePerKm,
      appliedPolicy: 'Fallback calculation'
    };
  }

  // Get fare policies for bus type selection
  static async getFarePolicies() {
    try {
      const response = await apiFetch('/api/admin/fare-policies');
      if (response.success) {
        return response.data;
      } else {
        throw new Error(response.message || 'Failed to fetch fare policies');
      }
    } catch (error) {
      console.error('Error fetching fare policies:', error);
      return [];
    }
  }

  // Calculate fare for route with multiple stops
  static async calculateRouteFare(routeId, busType) {
    try {
      const response = await apiFetch('/api/admin/routes/calculate-fare', {
        method: 'POST',
        body: JSON.stringify({
          routeId,
          busType
        })
      });

      if (response.success) {
        return response.data;
      } else {
        throw new Error(response.message || 'Failed to calculate route fare');
      }
    } catch (error) {
      console.error('Error calculating route fare:', error);
      return null;
    }
  }

  // Get bus types with their fare information
  static getBusTypeOptions() {
    return [
      { value: 'ordinary', label: 'Ordinary', ratePerKm: 1.5, minimumFare: 5 },
      { value: 'fast_passenger', label: 'Fast Passenger', ratePerKm: 2.0, minimumFare: 8 },
      { value: 'super_fast', label: 'Super Fast', ratePerKm: 2.5, minimumFare: 10 },
      { value: 'super_deluxe', label: 'Super Deluxe', ratePerKm: 3.0, minimumFare: 15 },
      { value: 'low_floor_ac', label: 'AC Low Floor', ratePerKm: 3.5, minimumFare: 20 },
      { value: 'garuda_volvo', label: 'Luxury Volvo', ratePerKm: 4.0, minimumFare: 25 },
      { value: 'venad', label: 'City Fast', ratePerKm: 2.2, minimumFare: 8 },
      { value: 'deluxe_express', label: 'Express', ratePerKm: 2.8, minimumFare: 12 },
      { value: 'garuda_king_long', label: 'Garuda King', ratePerKm: 4.5, minimumFare: 30 },
      { value: 'rajadhani', label: 'Rajadhani', ratePerKm: 5.0, minimumFare: 35 }
    ];
  }
}

export default FareCalculationService;
