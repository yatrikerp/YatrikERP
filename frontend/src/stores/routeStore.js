import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';

export const useRouteStore = create(
  devtools(
    persist(
      immer((set, get) => ({
        // State
        routes: [],
        selectedRoutes: [],
        filters: {
          search: '',
          status: 'all',
          type: 'all',
          sortField: 'routeNumber',
          sortDirection: 'asc',
        },
        pagination: {
          currentPage: 1,
          itemsPerPage: 10,
          totalItems: 0,
        },
        loading: false,
        error: null,
        lastUpdated: null,

        // Actions
        setRoutes: (routes) =>
          set((state) => {
            state.routes = routes;
            state.lastUpdated = new Date().toISOString();
          }),

        addRoute: (route) =>
          set((state) => {
            state.routes.unshift(route);
            state.pagination.totalItems += 1;
          }),

        updateRoute: (id, updates) =>
          set((state) => {
            const index = state.routes.findIndex((route) => route._id === id);
            if (index !== -1) {
              Object.assign(state.routes[index], updates);
            }
          }),

        deleteRoute: (id) =>
          set((state) => {
            state.routes = state.routes.filter((route) => route._id !== id);
            state.pagination.totalItems -= 1;
            state.selectedRoutes = state.selectedRoutes.filter((routeId) => routeId !== id);
          }),

        deleteRoutes: (ids) =>
          set((state) => {
            state.routes = state.routes.filter((route) => !ids.includes(route._id));
            state.pagination.totalItems -= ids.length;
            state.selectedRoutes = [];
          }),

        setSelectedRoutes: (routes) =>
          set((state) => {
            state.selectedRoutes = routes;
          }),

        toggleRouteSelection: (routeId) =>
          set((state) => {
            const index = state.selectedRoutes.indexOf(routeId);
            if (index === -1) {
              state.selectedRoutes.push(routeId);
            } else {
              state.selectedRoutes.splice(index, 1);
            }
          }),

        selectAllRoutes: () =>
          set((state) => {
            state.selectedRoutes = state.routes.map((route) => route._id);
          }),

        clearSelection: () =>
          set((state) => {
            state.selectedRoutes = [];
          }),

        setFilters: (filters) =>
          set((state) => {
            state.filters = { ...state.filters, ...filters };
            state.pagination.currentPage = 1; // Reset to first page when filters change
          }),

        setPagination: (pagination) =>
          set((state) => {
            state.pagination = { ...state.pagination, ...pagination };
          }),

        setLoading: (loading) =>
          set((state) => {
            state.loading = loading;
          }),

        setError: (error) =>
          set((state) => {
            state.error = error;
          }),

        // Computed values
        getFilteredRoutes: () => {
          const { routes, filters } = get();
          let filtered = [...routes];

          // Search filter
          if (filters.search) {
            const searchLower = filters.search.toLowerCase();
            filtered = filtered.filter(
              (route) =>
                route.routeNumber.toLowerCase().includes(searchLower) ||
                route.routeName.toLowerCase().includes(searchLower) ||
                route.startingPoint?.toLowerCase().includes(searchLower) ||
                route.endingPoint?.toLowerCase().includes(searchLower)
            );
          }

          // Status filter
          if (filters.status !== 'all') {
            filtered = filtered.filter((route) => route.status === filters.status);
          }

          // Type filter
          if (filters.type !== 'all') {
            filtered = filtered.filter((route) => route.type === filters.type);
          }

          // Sorting
          filtered.sort((a, b) => {
            let aValue = a[filters.sortField];
            let bValue = b[filters.sortField];

            if (filters.sortField === 'routeNumber') {
              const aNum = parseInt(aValue?.replace(/\D/g, '') || '0');
              const bNum = parseInt(bValue?.replace(/\D/g, '') || '0');
              return filters.sortDirection === 'asc' ? aNum - bNum : bNum - aNum;
            }

            if (typeof aValue === 'string' && typeof bValue === 'string') {
              return filters.sortDirection === 'asc'
                ? aValue.localeCompare(bValue)
                : bValue.localeCompare(aValue);
            }

            if (aValue < bValue) return filters.sortDirection === 'asc' ? -1 : 1;
            if (aValue > bValue) return filters.sortDirection === 'asc' ? 1 : -1;
            return 0;
          });

          return filtered;
        },

        getPaginatedRoutes: () => {
          const filteredRoutes = get().getFilteredRoutes();
          const { currentPage, itemsPerPage } = get().pagination;
          const startIndex = (currentPage - 1) * itemsPerPage;
          const endIndex = startIndex + itemsPerPage;

          return {
            routes: filteredRoutes.slice(startIndex, endIndex),
            totalItems: filteredRoutes.length,
            totalPages: Math.ceil(filteredRoutes.length / itemsPerPage),
          };
        },

        // Bulk operations
        bulkUpdateStatus: (status) =>
          set((state) => {
            state.routes.forEach((route) => {
              if (state.selectedRoutes.includes(route._id)) {
                route.status = status;
              }
            });
            state.selectedRoutes = [];
          }),

        bulkDelete: () => {
          const { selectedRoutes } = get();
          get().deleteRoutes(selectedRoutes);
        },

        // Reset store
        reset: () =>
          set((state) => {
            state.routes = [];
            state.selectedRoutes = [];
            state.filters = {
              search: '',
              status: 'all',
              type: 'all',
              sortField: 'routeNumber',
              sortDirection: 'asc',
            };
            state.pagination = {
              currentPage: 1,
              itemsPerPage: 10,
              totalItems: 0,
            };
            state.loading = false;
            state.error = null;
            state.lastUpdated = null;
          }),
      })),
      {
        name: 'route-store',
        partialize: (state) => ({
          filters: state.filters,
          pagination: state.pagination,
        }),
      }
    ),
    {
      name: 'route-store',
    }
  )
);
