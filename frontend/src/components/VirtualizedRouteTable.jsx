import React, { useMemo, useCallback } from 'react';
import { FixedSizeList as List } from 'react-window';
import { motion } from 'framer-motion';
import { 
  CheckSquare, 
  Square, 
  ArrowUpDown, 
  MoreVertical, 
  Eye, 
  Edit, 
  Trash2,
  MapPin,
  Clock,
  DollarSign,
  Bus
} from 'lucide-react';
import { useRouteStore } from '../stores/routeStore';

const VirtualizedRouteTable = ({ 
  routes, 
  selectedRoutes, 
  onSelectRoute, 
  onSelectAll, 
  onSort, 
  sortField, 
  sortDirection,
  onViewRoute,
  onEditRoute,
  onDeleteRoute,
  onToggleActionsMenu,
  showActionsMenu
}) => {
  const { toggleRouteSelection, selectAllRoutes, clearSelection } = useRouteStore();

  const handleSelectAll = useCallback(() => {
    if (selectedRoutes.length === routes.length) {
      clearSelection();
    } else {
      selectAllRoutes();
    }
  }, [selectedRoutes.length, routes.length, clearSelection, selectAllRoutes]);

  const handleSelectRoute = useCallback((routeId) => {
    toggleRouteSelection(routeId);
  }, [toggleRouteSelection]);

  const handleSort = useCallback((field) => {
    const newDirection = sortField === field && sortDirection === 'asc' ? 'desc' : 'asc';
    onSort(field, newDirection);
  }, [sortField, sortDirection, onSort]);

  const Row = useCallback(({ index, style }) => {
    const route = routes[index];
    const isSelected = selectedRoutes.includes(route._id);
    const isActionsOpen = showActionsMenu === route._id;

    return (
      <motion.div
        style={style}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: index * 0.02 }}
        className={`table-row ${isSelected ? 'selected' : ''}`}
      >
        <div className="table-cell select-cell">
          <button
            className="select-btn"
            onClick={() => handleSelectRoute(route._id)}
          >
            {isSelected ? <CheckSquare size={16} /> : <Square size={16} />}
          </button>
        </div>

        <div className="table-cell route-number-cell">
          <div className="route-number-badge">
            {route.routeNumber}
          </div>
          <div className="route-id">ID: {route._id?.slice(-8)}</div>
        </div>

        <div className="table-cell route-name-cell">
          <div className="route-name">{route.routeName}</div>
          <div className="route-features">
            {route.features?.map((feature, idx) => (
              <span key={idx} className="feature-tag">
                {feature}
              </span>
            ))}
          </div>
        </div>

        <div className="table-cell route-ends-cell">
          <div className="route-endpoint">
            <MapPin size={14} />
            <span>{route.startingPoint}</span>
          </div>
          <div className="route-endpoint">
            <MapPin size={14} />
            <span>{route.endingPoint}</span>
          </div>
        </div>

        <div className="table-cell distance-cell">
          <div className="distance-value">
            <Bus size={14} />
            <span>{route.distance}km</span>
          </div>
          <div className="stops-count">{route.stops?.length || 0} stops</div>
        </div>

        <div className="table-cell duration-cell">
          <div className="duration-value">
            <Clock size={14} />
            <span>{Math.floor(route.duration / 60)}h {route.duration % 60}m</span>
          </div>
        </div>

        <div className="table-cell fare-cell">
          <div className="fare-value">
            <DollarSign size={14} />
            <span>₹{route.baseFare}</span>
          </div>
        </div>

        <div className="table-cell status-cell">
          <span className={`status-badge ${route.status}`}>
            {route.status.toUpperCase()}
          </span>
        </div>

        <div className="table-cell actions-cell">
          <div className="action-buttons">
            <button
              className="action-btn view-btn"
              onClick={() => onViewRoute(route)}
              title="View"
            >
              <Eye size={16} />
            </button>
            <button
              className="action-btn edit-btn"
              onClick={() => onEditRoute(route)}
              title="Edit"
            >
              <Edit size={16} />
            </button>
            <div className="more-actions">
              <button
                className="action-btn more-btn"
                onClick={() => onToggleActionsMenu(route._id)}
                title="More"
              >
                <MoreVertical size={16} />
              </button>
              {isActionsOpen && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="actions-menu"
                >
                  <button
                    className="menu-item"
                    onClick={() => {
                      onEditRoute(route);
                      onToggleActionsMenu(null);
                    }}
                  >
                    <Edit size={14} />
                    Edit Route
                  </button>
                  <button
                    className="menu-item"
                    onClick={() => {
                      onViewRoute(route);
                      onToggleActionsMenu(null);
                    }}
                  >
                    <Eye size={14} />
                    View Details
                  </button>
                  <button
                    className="menu-item delete"
                    onClick={() => {
                      onDeleteRoute(route);
                      onToggleActionsMenu(null);
                    }}
                  >
                    <Trash2 size={14} />
                    Delete Route
                  </button>
                </motion.div>
              )}
            </div>
          </div>
        </div>
      </motion.div>
    );
  }, [routes, selectedRoutes, showActionsMenu, handleSelectRoute, onViewRoute, onEditRoute, onDeleteRoute, onToggleActionsMenu]);

  const Header = useCallback(() => (
    <div className="table-header">
      <div className="table-cell select-cell">
        <button
          className="select-all-btn"
          onClick={handleSelectAll}
        >
          {selectedRoutes.length === routes.length ? 
            <CheckSquare size={16} /> : 
            <Square size={16} />
          }
        </button>
      </div>

      <div 
        className="table-cell sortable route-number-cell"
        onClick={() => handleSort('routeNumber')}
      >
        <div className="th-content">
          Route Number
          <ArrowUpDown size={14} />
        </div>
      </div>

      <div 
        className="table-cell sortable route-name-cell"
        onClick={() => handleSort('routeName')}
      >
        <div className="th-content">
          Route Name
          <ArrowUpDown size={14} />
        </div>
      </div>

      <div 
        className="table-cell sortable route-ends-cell"
        onClick={() => handleSort('startingPoint')}
      >
        <div className="th-content">
          Start - End
          <ArrowUpDown size={14} />
        </div>
      </div>

      <div 
        className="table-cell sortable distance-cell"
        onClick={() => handleSort('distance')}
      >
        <div className="th-content">
          Distance
          <ArrowUpDown size={14} />
        </div>
      </div>

      <div 
        className="table-cell sortable duration-cell"
        onClick={() => handleSort('duration')}
      >
        <div className="th-content">
          Duration
          <ArrowUpDown size={14} />
        </div>
      </div>

      <div 
        className="table-cell sortable fare-cell"
        onClick={() => handleSort('baseFare')}
      >
        <div className="th-content">
          Base Fare
          <ArrowUpDown size={14} />
        </div>
      </div>

      <div 
        className="table-cell sortable status-cell"
        onClick={() => handleSort('status')}
      >
        <div className="th-content">
          Status
          <ArrowUpDown size={14} />
        </div>
      </div>

      <div className="table-cell actions-cell">
        Actions
      </div>
    </div>
  ), [routes.length, selectedRoutes.length, handleSelectAll, handleSort]);

  const itemSize = 80; // Height of each row

  return (
    <div className="virtualized-table-container">
      <Header />
      <div className="table-body">
        <List
          height={600} // Fixed height for the virtualized list
          itemCount={routes.length}
          itemSize={itemSize}
          itemData={routes}
        >
          {Row}
        </List>
      </div>
    </div>
  );
};

export default VirtualizedRouteTable;
