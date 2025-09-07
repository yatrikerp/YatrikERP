import { useState, useCallback, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiFetch } from '../utils/api';
import toast from 'react-hot-toast';

export const useBusManagement = () => {
  const queryClient = useQueryClient();
  const [insightsCache, setInsightsCache] = useState({});

  // Fetch buses
  const {
    data: buses,
    isLoading,
    error,
    refetch
  } = useQuery({
    queryKey: ['buses'],
    queryFn: async () => {
      console.log('useBusManagement: Fetching buses...');
      try {
        const result = await apiFetch('/api/admin/buses');
        console.log('useBusManagement: Buses fetched successfully:', result);
        
        // Normalize the response to ensure we always get an array
        if (Array.isArray(result)) {
          return result;
        } else if (result && Array.isArray(result.data)) {
          return result.data;
        } else if (result && Array.isArray(result.buses)) {
          return result.buses;
        } else {
          console.warn('useBusManagement: Unexpected data format, returning empty array');
          return [];
        }
      } catch (error) {
        console.error('useBusManagement: Error fetching buses:', error);
        throw error;
      }
    },
    staleTime: 30000, // 30 seconds
    refetchInterval: 60000, // 1 minute
    retry: 3
  });

  // Create bus mutation
  const createBusMutation = useMutation({
    mutationFn: async (busData) => {
      const result = await apiFetch('/api/admin/buses', {
        method: 'POST',
        body: JSON.stringify(busData)
      });
      return result;
    },
    onSuccess: (newBus) => {
      queryClient.setQueryData(['buses'], (oldData) => {
        return oldData ? [...oldData, newBus] : [newBus];
      });
    },
    onError: (error) => {
      toast.error(`Failed to create bus: ${error.message}`);
    }
  });

  // Update bus mutation
  const updateBusMutation = useMutation({
    mutationFn: async ({ id, data }) => {
      const result = await apiFetch(`/api/admin/buses/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data)
      });
      return result;
    },
    onSuccess: (updatedBus) => {
      queryClient.setQueryData(['buses'], (oldData) => {
        if (!oldData) return [updatedBus];
        return oldData.map(bus => 
          bus._id === updatedBus._id ? updatedBus : bus
        );
      });
    },
    onError: (error) => {
      toast.error(`Failed to update bus: ${error.message}`);
    }
  });

  // Delete bus mutation
  const deleteBusMutation = useMutation({
    mutationFn: async (id) => {
      await apiFetch(`/api/admin/buses/${id}`, {
        method: 'DELETE'
      });
      return id;
    },
    onSuccess: (_, deletedId) => {
      queryClient.setQueryData(['buses'], (oldData) => {
        if (!oldData) return [];
        return oldData.filter(bus => bus._id !== deletedId);
      });
    },
    onError: (error) => {
      toast.error(`Failed to delete bus: ${error.message}`);
    }
  });

  // Bulk update mutation
  const bulkUpdateMutation = useMutation({
    mutationFn: async ({ busIds, action, data }) => {
      const result = await apiFetch('/api/admin/buses/bulk', {
        method: 'POST',
        body: JSON.stringify({ busIds, action, data })
      });
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['buses']);
    },
    onError: (error) => {
      toast.error(`Bulk operation failed: ${error.message}`);
    }
  });

  // Get bus insights with caching
  const getBusInsightsById = useCallback(async (busId) => {
    if (insightsCache[busId]) {
      return insightsCache[busId];
    }

    try {
      const insights = await apiFetch(`/api/admin/buses/${busId}/insights`);
      setInsightsCache(prev => ({
        ...prev,
        [busId]: insights
      }));
      return insights;
    } catch (error) {
      console.error('Failed to fetch bus insights:', error);
      return null;
    }
  }, [insightsCache]);

  // Calculate performance metrics
  const calculatePerformanceMetrics = useCallback((bus) => {
    // Simple performance score calculation
    let performanceScore = 80; // Base score
    
    // Adjust based on bus status
    if (bus.status === 'active') performanceScore += 10;
    if (bus.status === 'maintenance') performanceScore -= 20;
    if (bus.status === 'inactive') performanceScore -= 30;
    
    // Adjust based on odometer reading (if available)
    if (bus.odometerReading) {
      if (bus.odometerReading > 100000) performanceScore -= 10;
      if (bus.odometerReading < 50000) performanceScore += 5;
    }
    
    // Ensure score is between 0 and 100
    performanceScore = Math.max(0, Math.min(100, performanceScore));
    
    const metrics = {
      performanceScore,
      efficiencyTrend: Math.random() > 0.5 ? 1 : -1,
      recommendations: [],
      rating: Math.ceil(performanceScore / 20)
    };

    // Generate recommendations
    if (performanceScore < 60) {
      metrics.recommendations.push('Consider scheduling maintenance');
    }
    if (bus.fuelLevel && bus.fuelLevel < 20) {
      metrics.recommendations.push('Low fuel level - consider refueling');
    }
    if (bus.nextMaintenance && new Date(bus.nextMaintenance) < new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)) {
      metrics.recommendations.push('Service due soon');
    }

    return metrics;
  }, []);

  // Memoized insights for all buses
  const busInsights = useMemo(() => {
    if (!buses || !Array.isArray(buses)) return {};
    
    const insights = {};
    buses.forEach(bus => {
      insights[bus._id] = calculatePerformanceMetrics(bus);
    });
    return insights;
  }, [buses, calculatePerformanceMetrics]);

  // Action functions
  const createBus = useCallback(async (busData) => {
    return createBusMutation.mutateAsync(busData);
  }, [createBusMutation]);

  const updateBus = useCallback(async (busId, busData) => {
    return updateBusMutation.mutateAsync({ id: busId, data: busData });
  }, [updateBusMutation]);

  const deleteBus = useCallback(async (busId) => {
    return deleteBusMutation.mutateAsync(busId);
  }, [deleteBusMutation]);

  const bulkUpdateBuses = useCallback(async (busIds, action, data) => {
    return bulkUpdateMutation.mutateAsync({ busIds, action, data });
  }, [bulkUpdateMutation]);

  return {
    buses,
    isLoading,
    error,
    refetch,
    createBus,
    updateBus,
    deleteBus,
    bulkUpdateBuses,
    getBusInsights: getBusInsightsById,
    busInsights,
    isCreating: createBusMutation.isPending,
    isUpdating: updateBusMutation.isPending,
    isDeleting: deleteBusMutation.isPending,
    isBulkUpdating: bulkUpdateMutation.isPending
  };
};