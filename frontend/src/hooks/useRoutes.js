import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouteStore } from '../stores/routeStore';
import { apiFetch } from '../utils/api';
import { toast } from 'react-hot-toast';

// Query keys
export const routeKeys = {
  all: ['routes'],
  lists: () => [...routeKeys.all, 'list'],
  list: (filters) => [...routeKeys.lists(), { filters }],
  details: () => [...routeKeys.all, 'detail'],
  detail: (id) => [...routeKeys.details(), id],
};

// API functions
const routeApi = {
  fetchRoutes: async (params = {}) => {
    const response = await apiFetch('/api/routes', {
      method: 'GET',
      params,
    });
    return response.data;
  },

  fetchRoute: async (id) => {
    const response = await apiFetch(`/api/routes/${id}`);
    return response.data;
  },

  createRoute: async (data) => {
    const response = await apiFetch('/api/routes', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    return response.data;
  },

  updateRoute: async ({ id, data }) => {
    const response = await apiFetch(`/api/routes/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
    return response.data;
  },

  deleteRoute: async (id) => {
    const response = await apiFetch(`/api/routes/${id}`, {
      method: 'DELETE',
    });
    return response.data;
  },

  bulkUpdate: async (data) => {
    const response = await apiFetch('/api/routes/bulk', {
      method: 'PUT',
      body: JSON.stringify(data),
    });
    return response.data;
  },

  bulkDelete: async (ids) => {
    const response = await apiFetch('/api/routes/bulk', {
      method: 'DELETE',
      body: JSON.stringify({ ids }),
    });
    return response.data;
  },

  exportRoutes: async (format = 'excel') => {
    const response = await apiFetch(`/api/routes/export?format=${format}`, {
      method: 'GET',
    });
    return response.data;
  },

  importRoutes: async (file) => {
    const formData = new FormData();
    formData.append('file', file);
    
    const response = await apiFetch('/api/routes/import', {
      method: 'POST',
      body: formData,
    });
    return response.data;
  },
};

// Custom hooks
export const useRoutes = (filters = {}) => {
  const queryClient = useQueryClient();
  const { setRoutes, setLoading, setError } = useRouteStore();

  return useQuery({
    queryKey: routeKeys.list(filters),
    queryFn: () => routeApi.fetchRoutes(filters),
    onSuccess: (data) => {
      setRoutes(data.routes);
      setLoading(false);
      setError(null);
    },
    onError: (error) => {
      setError(error.message);
      setLoading(false);
      toast.error('Failed to fetch routes');
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    cacheTime: 10 * 60 * 1000, // 10 minutes
  });
};

export const useRoute = (id) => {
  return useQuery({
    queryKey: routeKeys.detail(id),
    queryFn: () => routeApi.fetchRoute(id),
    enabled: !!id,
    staleTime: 5 * 60 * 1000,
  });
};

export const useCreateRoute = () => {
  const queryClient = useQueryClient();
  const { addRoute } = useRouteStore();

  return useMutation({
    mutationFn: routeApi.createRoute,
    onSuccess: (data) => {
      addRoute(data.route);
      queryClient.invalidateQueries({ queryKey: routeKeys.lists() });
      toast.success('Route created successfully');
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to create route');
    },
  });
};

export const useUpdateRoute = () => {
  const queryClient = useQueryClient();
  const { updateRoute } = useRouteStore();

  return useMutation({
    mutationFn: routeApi.updateRoute,
    onSuccess: (data) => {
      updateRoute(data.route._id, data.route);
      queryClient.invalidateQueries({ queryKey: routeKeys.lists() });
      queryClient.invalidateQueries({ queryKey: routeKeys.detail(data.route._id) });
      toast.success('Route updated successfully');
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to update route');
    },
  });
};

export const useDeleteRoute = () => {
  const queryClient = useQueryClient();
  const { deleteRoute } = useRouteStore();

  return useMutation({
    mutationFn: routeApi.deleteRoute,
    onSuccess: (data, id) => {
      deleteRoute(id);
      queryClient.invalidateQueries({ queryKey: routeKeys.lists() });
      toast.success('Route deleted successfully');
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to delete route');
    },
  });
};

export const useBulkUpdate = () => {
  const queryClient = useQueryClient();
  const { bulkUpdateStatus, clearSelection } = useRouteStore();

  return useMutation({
    mutationFn: routeApi.bulkUpdate,
    onSuccess: (data) => {
      bulkUpdateStatus(data.status);
      clearSelection();
      queryClient.invalidateQueries({ queryKey: routeKeys.lists() });
      toast.success(`${data.count} routes updated successfully`);
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to update routes');
    },
  });
};

export const useBulkDelete = () => {
  const queryClient = useQueryClient();
  const { bulkDelete } = useRouteStore();

  return useMutation({
    mutationFn: routeApi.bulkDelete,
    onSuccess: (data) => {
      bulkDelete(data.ids);
      queryClient.invalidateQueries({ queryKey: routeKeys.lists() });
      toast.success(`${data.count} routes deleted successfully`);
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to delete routes');
    },
  });
};

export const useExportRoutes = () => {
  return useMutation({
    mutationFn: routeApi.exportRoutes,
    onSuccess: (data) => {
      // Create download link
      const blob = new Blob([data], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `routes-${new Date().toISOString().split('T')[0]}.xlsx`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      toast.success('Routes exported successfully');
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to export routes');
    },
  });
};

export const useImportRoutes = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: routeApi.importRoutes,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: routeKeys.lists() });
      toast.success(`${data.count} routes imported successfully`);
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to import routes');
    },
  });
};

// Optimistic updates
export const useOptimisticRouteUpdate = () => {
  const queryClient = useQueryClient();
  const { updateRoute } = useRouteStore();

  return useMutation({
    mutationFn: routeApi.updateRoute,
    onMutate: async ({ id, data }) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: routeKeys.detail(id) });

      // Snapshot previous value
      const previousRoute = queryClient.getQueryData(routeKeys.detail(id));

      // Optimistically update
      queryClient.setQueryData(routeKeys.detail(id), (old) => ({
        ...old,
        ...data,
      }));

      // Update store
      updateRoute(id, data);

      return { previousRoute };
    },
    onError: (err, variables, context) => {
      // Rollback on error
      if (context?.previousRoute) {
        queryClient.setQueryData(routeKeys.detail(variables.id), context.previousRoute);
      }
      toast.error('Failed to update route');
    },
    onSettled: (data, error, variables) => {
      // Always refetch after error or success
      queryClient.invalidateQueries({ queryKey: routeKeys.detail(variables.id) });
    },
  });
};
