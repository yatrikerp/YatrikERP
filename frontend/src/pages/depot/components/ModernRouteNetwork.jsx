import React, { useState, useEffect, useMemo, useCallback } from 'react';
// Align Route Network UI with Depot Dashboard styling
import './RouteNetwork.css';
import '../../../components/ModernRouteNetwork.css';
import '../depot.modern.css';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouteStore } from '../../../stores/routeStore';
import { useRoutes, useCreateRoute, useUpdateRoute, useDeleteRoute, useBulkUpdate, useBulkDelete, useExportRoutes, useImportRoutes } from '../../../hooks/useRoutes';
import RouteFilterBar from '../../../components/RouteFilterBar';
import RouteCategorization from '../../../components/RouteCategorization';
import RouteForm from '../../../components/RouteForm';
import VirtualizedRouteTable from '../../../components/VirtualizedRouteTable';
import { 
  Plus, 
  Filter, 
  Users, 
  Bus, 
  Route,
  MapPin,
  Clock,
  DollarSign,
  TrendingUp,
  AlertCircle,
  CheckCircle,
  XCircle,
  X,
  CheckSquare
} from 'lucide-react';

// Create a query client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      cacheTime: 10 * 60 * 1000, // 10 minutes
      retry: 3,
      retryDelay: attemptIndex => Math.min(1000 * 2 ** attemptIndex, 30000),
    },
  },
});

const ModernRouteNetwork = () => {
  // Zustand store
  const { 
    routes, 
    selectedRoutes, 
    filters, 
    pagination, 
    loading, 
    error,
    getFilteredRoutes,
    getPaginatedRoutes,
    setFilters,
    setSelectedRoutes,
    clearSelection,
    setLoading,
    toggleRouteSelection,
    selectAllRoutes
  } = useRouteStore();

  // Local state
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedRoute, setSelectedRoute] = useState(null);
  const [showActionsMenu, setShowActionsMenu] = useState(null);
  const [viewMode, setViewMode] = useState('table');
  const [showCategorization, setShowCategorization] = useState(false);
  const [notifications, setNotifications] = useState([]);

  // React Query hooks
  const { data: routesData, isLoading, error: queryError, refetch } = useRoutes(filters);
  const createRoute = useCreateRoute();
  const updateRoute = useUpdateRoute();
  const deleteRoute = useDeleteRoute();
  const bulkUpdate = useBulkUpdate();
  const bulkDelete = useBulkDelete();
  const exportRoutes = useExportRoutes();
  const importRoutes = useImportRoutes();

  // Computed stats from filtered routes
  const stats = useMemo(() => {
    const filteredRoutes = getFilteredRoutes();
    return {
      totalRoutes: filteredRoutes.length,
      activeRoutes: filteredRoutes.filter(route => route.status === 'active').length,
      inactiveRoutes: filteredRoutes.filter(route => route.status === 'inactive').length,
      maintenanceRoutes: filteredRoutes.filter(route => route.status === 'maintenance').length,
      totalDistance: filteredRoutes.reduce((sum, route) => sum + (route.distance || 0), 0),
      avgFare: filteredRoutes.length > 0 
        ? Math.round(filteredRoutes.reduce((sum, route) => sum + (route.baseFare || 0), 0) / filteredRoutes.length)
        : 0
    };
  }, [getFilteredRoutes]);

  // Handle refresh
  const handleRefresh = useCallback(() => {
    setLoading(true);
    refetch();
  }, [setLoading, refetch]);

  // Handle export
  const handleExport = useCallback(async () => {
    try {
      await exportRoutes.mutateAsync('excel');
    } catch (error) {
      console.error('Export failed:', error);
    }
  }, [exportRoutes]);

  // Handle import
  const handleImport = useCallback(async (event) => {
    const file = event.target.files[0];
    if (file) {
      try {
        await importRoutes.mutateAsync(file);
      } catch (error) {
        console.error('Import failed:', error);
      }
    }
  }, [importRoutes]);

  // Handle route selection
  const handleRouteSelect = useCallback((route) => {
    setSelectedRoute(route);
  }, []);

  // Handle route actions
  const handleViewRoute = useCallback((route) => {
    setSelectedRoute(route);
    // Add view logic here
  }, []);

  const handleEditRoute = useCallback((route) => {
    setSelectedRoute(route);
    setShowEditModal(true);
  }, []);

  const handleDeleteRoute = useCallback((route) => {
    setSelectedRoute(route);
    setShowDeleteModal(true);
  }, []);

  const handleToggleActionsMenu = useCallback((routeId) => {
    setShowActionsMenu(showActionsMenu === routeId ? null : routeId);
  }, [showActionsMenu]);

  // Handle sorting
  const handleSort = useCallback((field, direction) => {
    setFilters({ sortField: field, sortDirection: direction });
  }, [setFilters]);

  // Handle bulk operations
  const handleBulkAction = useCallback(async (action) => {
    if (selectedRoutes.length === 0) return;

    try {
      switch (action) {
        case 'activate':
          await bulkUpdate.mutateAsync({ action: 'activate', routes: selectedRoutes });
          break;
        case 'deactivate':
          await bulkUpdate.mutateAsync({ action: 'deactivate', routes: selectedRoutes });
          break;
        case 'maintenance':
          await bulkUpdate.mutateAsync({ action: 'maintenance', routes: selectedRoutes });
          break;
        case 'delete':
          await bulkDelete.mutateAsync(selectedRoutes);
          break;
      }
      clearSelection();
    } catch (error) {
      console.error('Bulk action failed:', error);
    }
  }, [selectedRoutes, bulkUpdate, bulkDelete, clearSelection]);

  // KPI Cards
  const KPICard = ({ title, value, icon: Icon, color, trend, subtitle }) => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="kpi-card"
    >
      <div className="kpi-header">
        <div className="kpi-icon" style={{ backgroundColor: color + '20', color: color }}>
          <Icon size={24} />
        </div>
        <div className="kpi-trend" style={{ color: trend > 0 ? '#10B981' : trend < 0 ? '#EF4444' : '#6B7280' }}>
          {trend > 0 ? '+' : ''}{trend}%
        </div>
      </div>
      <div className="kpi-content">
        <h3 className="kpi-value">{value}</h3>
        <p className="kpi-title">{title}</p>
        {subtitle && <p className="kpi-subtitle">{subtitle}</p>}
      </div>
    </motion.div>
  );

  // Notification component
  const Notification = ({ notification, onRemove }) => (
    <motion.div
      initial={{ opacity: 0, x: 300 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 300 }}
      className={`notification ${notification.type}`}
    >
      <div className="notification-content">
        <div className="notification-icon">
          {notification.type === 'success' && <CheckCircle size={20} />}
          {notification.type === 'error' && <XCircle size={20} />}
          {notification.type === 'warning' && <AlertCircle size={20} />}
        </div>
        <div className="notification-message">{notification.message}</div>
        <button onClick={() => onRemove(notification.id)} className="notification-close">
          <X size={16} />
        </button>
      </div>
    </motion.div>
  );

  return (
    <QueryClientProvider client={queryClient}>
      <div className="modern-route-network">
        <Toaster position="top-right" />
        
        {/* Notifications */}
        <div className="notifications-container">
          <AnimatePresence>
            {notifications.map(notification => (
              <Notification
                key={notification.id}
                notification={notification}
                onRemove={(id) => setNotifications(prev => prev.filter(n => n.id !== id))}
              />
            ))}
          </AnimatePresence>
        </div>

        {/* Header - use depot dashboard styles */}
        <div className="dashboard-header">
          <div className="header-left">
            <h1>Route Network</h1>
            <p className="welcome-text">Manage and monitor your bus routes with advanced filtering and analytics</p>
          </div>
          <div className="quick-actions-grid">
            <button
              onClick={() => setShowAddModal(true)}
              className="quick-action blue"
            >
              <span className="qa-title">Add Route</span>
            </button>
          </div>
        </div>

        {/* KPI Cards */}
        <div className="kpi-grid">
          <KPICard
            title="Total Routes"
            value={stats.totalRoutes}
            icon={Route}
            color="#3B82F6"
            trend={5.2}
            subtitle="Across all categories"
          />
          <KPICard
            title="Active Routes"
            value={stats.activeRoutes}
            icon={CheckCircle}
            color="#10B981"
            trend={2.1}
            subtitle={`${stats.totalRoutes > 0 ? Math.round((stats.activeRoutes / stats.totalRoutes) * 100) : 0}% of total`}
          />
          <KPICard
            title="Total Distance"
            value={`${stats.totalDistance}km`}
            icon={MapPin}
            color="#F59E0B"
            trend={-1.3}
            subtitle="Network coverage"
          />
          <KPICard
            title="Average Fare"
            value={`₹${stats.avgFare}`}
            icon={DollarSign}
            color="#8B5CF6"
            trend={3.7}
            subtitle="Per route"
          />
        </div>

        {/* Filter Bar */}
        <RouteFilterBar
          onExport={handleExport}
          onImport={handleImport}
          viewMode={viewMode}
          onViewModeChange={setViewMode}
          onRefresh={handleRefresh}
          showCategorization={showCategorization}
          onToggleCategorization={() => setShowCategorization(!showCategorization)}
        />

        {/* Main Content */}
        <div className="route-network-content">
          {showCategorization ? (
            <RouteCategorization
              routes={getFilteredRoutes()}
              onRouteSelect={handleRouteSelect}
              selectedRoute={selectedRoute}
            />
          ) : (
            <VirtualizedRouteTable
              routes={getPaginatedRoutes().routes}
              selectedRoutes={selectedRoutes}
              onSelectRoute={toggleRouteSelection}
              onSelectAll={selectAllRoutes}
              onSort={handleSort}
              sortField={filters.sortField}
              sortDirection={filters.sortDirection}
              onViewRoute={handleViewRoute}
              onEditRoute={handleEditRoute}
              onDeleteRoute={handleDeleteRoute}
              onToggleActionsMenu={handleToggleActionsMenu}
              showActionsMenu={showActionsMenu}
            />
          )}
        </div>

        {/* Bulk Actions */}
        {selectedRoutes.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bulk-actions-bar"
          >
            <div className="bulk-info">
              <CheckSquare size={16} />
              <span>{selectedRoutes.length} routes selected</span>
            </div>
            <div className="bulk-actions">
              <button
                onClick={() => handleBulkAction('activate')}
                className="bulk-btn activate"
              >
                Activate
              </button>
              <button
                onClick={() => handleBulkAction('deactivate')}
                className="bulk-btn deactivate"
              >
                Deactivate
              </button>
              <button
                onClick={() => handleBulkAction('maintenance')}
                className="bulk-btn maintenance"
              >
                Maintenance
              </button>
              <button
                onClick={() => handleBulkAction('delete')}
                className="bulk-btn delete"
              >
                Delete
              </button>
              <button
                onClick={clearSelection}
                className="bulk-btn clear"
              >
                Clear Selection
              </button>
            </div>
          </motion.div>
        )}

        {/* Modals */}
        <RouteForm
          isOpen={showAddModal}
          onClose={() => setShowAddModal(false)}
          mode="create"
        />

        <RouteForm
          isOpen={showEditModal}
          onClose={() => setShowEditModal(false)}
          route={selectedRoute}
          mode="edit"
        />

        {/* Delete Confirmation Modal */}
        <AnimatePresence>
          {showDeleteModal && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="modal-overlay"
              onClick={() => setShowDeleteModal(false)}
            >
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                className="modal-content delete-modal"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="modal-header">
                  <h2>Delete Route</h2>
                  <button onClick={() => setShowDeleteModal(false)} className="close-btn">
                    <X size={24} />
                  </button>
                </div>
                <div className="modal-body">
                  <p>Are you sure you want to delete route <strong>{selectedRoute?.routeNumber}</strong>?</p>
                  <p className="warning-text">This action cannot be undone.</p>
                </div>
                <div className="modal-actions">
                  <button
                    onClick={() => setShowDeleteModal(false)}
                    className="cancel-btn"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={async () => {
                      try {
                        await deleteRoute.mutateAsync(selectedRoute._id);
                        setShowDeleteModal(false);
                        setSelectedRoute(null);
                      } catch (error) {
                        console.error('Delete failed:', error);
                      }
                    }}
                    className="delete-btn"
                  >
                    Delete Route
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </QueryClientProvider>
  );
};

export default ModernRouteNetwork;
