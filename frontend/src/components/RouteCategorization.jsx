import React, { useState, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Grid3X3, 
  List, 
  MapPin, 
  Clock, 
  DollarSign, 
  Star, 
  TrendingUp,
  Users,
  Bus,
  Route,
  ChevronRight,
  ChevronDown
} from 'lucide-react';
import { useRouteStore } from '../stores/routeStore';

const RouteCategorization = ({ routes, onRouteSelect, selectedRoute }) => {
  const [groupBy, setGroupBy] = useState('type');
  const [expandedGroups, setExpandedGroups] = useState(new Set());
  const [viewMode, setViewMode] = useState('grid');

  const groupOptions = [
    { value: 'type', label: 'Route Type', icon: Bus },
    { value: 'status', label: 'Status', icon: TrendingUp },
    { value: 'region', label: 'Region', icon: MapPin },
    { value: 'category', label: 'Category', icon: Route },
    { value: 'fareRange', label: 'Fare Range', icon: DollarSign },
    { value: 'distanceRange', label: 'Distance Range', icon: Clock },
    { value: 'features', label: 'Features', icon: Star },
  ];

  const categorizedRoutes = useMemo(() => {
    const groups = {};

    routes.forEach(route => {
      let groupKey = 'Uncategorized';
      let groupLabel = 'Uncategorized';

      switch (groupBy) {
        case 'type':
          groupKey = route.type || 'ordinary';
          groupLabel = route.type ? route.type.charAt(0).toUpperCase() + route.type.slice(1).replace('-', ' ') : 'Ordinary';
          break;

        case 'status':
          groupKey = route.status || 'inactive';
          groupLabel = route.status ? route.status.charAt(0).toUpperCase() + route.status.slice(1) : 'Inactive';
          break;

        case 'region':
          groupKey = getRegion(route.startingPoint, route.endingPoint);
          groupLabel = groupKey;
          break;

        case 'category':
          groupKey = route.category || 'intercity';
          groupLabel = route.category ? route.category.charAt(0).toUpperCase() + route.category.slice(1) : 'Intercity';
          break;

        case 'fareRange':
          const fare = route.baseFare || 0;
          if (fare < 100) {
            groupKey = 'budget';
            groupLabel = 'Budget (₹0-100)';
          } else if (fare < 300) {
            groupKey = 'standard';
            groupLabel = 'Standard (₹100-300)';
          } else if (fare < 500) {
            groupKey = 'premium';
            groupLabel = 'Premium (₹300-500)';
          } else {
            groupKey = 'luxury';
            groupLabel = 'Luxury (₹500+)';
          }
          break;

        case 'distanceRange':
          const distance = route.distance || 0;
          if (distance < 50) {
            groupKey = 'short';
            groupLabel = 'Short Distance (<50km)';
          } else if (distance < 150) {
            groupKey = 'medium';
            groupLabel = 'Medium Distance (50-150km)';
          } else if (distance < 300) {
            groupKey = 'long';
            groupLabel = 'Long Distance (150-300km)';
          } else {
            groupKey = 'very-long';
            groupLabel = 'Very Long Distance (300km+)';
          }
          break;

        case 'features':
          const features = route.features || [];
          if (features.length === 0) {
            groupKey = 'basic';
            groupLabel = 'Basic Features';
          } else if (features.includes('ac') && features.includes('entertainment')) {
            groupKey = 'premium';
            groupLabel = 'Premium Features';
          } else if (features.includes('ac')) {
            groupKey = 'ac';
            groupLabel = 'Air Conditioned';
          } else {
            groupKey = 'standard';
            groupLabel = 'Standard Features';
          }
          break;

        default:
          groupKey = 'all';
          groupLabel = 'All Routes';
      }

      if (!groups[groupKey]) {
        groups[groupKey] = {
          label: groupLabel,
          routes: [],
          stats: {
            total: 0,
            active: 0,
            totalDistance: 0,
            avgFare: 0,
            totalRevenue: 0
          }
        };
      }

      groups[groupKey].routes.push(route);
      groups[groupKey].stats.total++;
      if (route.status === 'active') groups[groupKey].stats.active++;
      groups[groupKey].stats.totalDistance += route.distance || 0;
      groups[groupKey].stats.totalRevenue += (route.baseFare || 0) * 10; // Assuming 10 bookings per day
    });

    // Calculate averages
    Object.values(groups).forEach(group => {
      if (group.stats.total > 0) {
        group.stats.avgFare = Math.round(group.stats.totalRevenue / group.stats.total);
        group.stats.avgDistance = Math.round(group.stats.totalDistance / group.stats.total);
      }
    });

    return groups;
  }, [routes, groupBy]);

  const getRegion = (start, end) => {
    const northCities = ['Kannur', 'Kozhikode', 'Kasaragod', 'Wayanad'];
    const centralCities = ['Kochi', 'Thrissur', 'Palakkad', 'Malappuram'];
    const southCities = ['Thiruvananthapuram', 'Kollam', 'Pathanamthitta', 'Alappuzha', 'Kottayam', 'Idukki'];

    const isNorth = northCities.some(city => 
      start?.toLowerCase().includes(city.toLowerCase()) || 
      end?.toLowerCase().includes(city.toLowerCase())
    );
    const isCentral = centralCities.some(city => 
      start?.toLowerCase().includes(city.toLowerCase()) || 
      end?.toLowerCase().includes(city.toLowerCase())
    );
    const isSouth = southCities.some(city => 
      start?.toLowerCase().includes(city.toLowerCase()) || 
      end?.toLowerCase().includes(city.toLowerCase())
    );

    if (isNorth) return 'North Kerala';
    if (isCentral) return 'Central Kerala';
    if (isSouth) return 'South Kerala';
    return 'Interstate';
  };

  const toggleGroup = useCallback((groupKey) => {
    setExpandedGroups(prev => {
      const newSet = new Set(prev);
      if (newSet.has(groupKey)) {
        newSet.delete(groupKey);
      } else {
        newSet.add(groupKey);
      }
      return newSet;
    });
  }, []);

  const RouteCard = ({ route, isSelected }) => (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className={`route-card ${isSelected ? 'selected' : ''}`}
      onClick={() => onRouteSelect(route)}
    >
      <div className="route-card-header">
        <div className="route-number">{route.routeNumber}</div>
        <div className="route-status">
          <span className={`status-badge ${route.status}`}>
            {route.status?.toUpperCase()}
          </span>
        </div>
      </div>

      <div className="route-card-body">
        <h4 className="route-name">{route.routeName}</h4>
        <div className="route-ends">
          <div className="route-endpoint">
            <MapPin size={14} />
            <span>{route.startingPoint}</span>
          </div>
          <div className="route-arrow">→</div>
          <div className="route-endpoint">
            <MapPin size={14} />
            <span>{route.endingPoint}</span>
          </div>
        </div>

        <div className="route-stats">
          <div className="stat">
            <Clock size={14} />
            <span>{Math.floor((route.duration || 0) / 60)}h {(route.duration || 0) % 60}m</span>
          </div>
          <div className="stat">
            <Bus size={14} />
            <span>{route.distance || 0}km</span>
          </div>
          <div className="stat">
            <DollarSign size={14} />
            <span>₹{route.baseFare || 0}</span>
          </div>
        </div>

        {route.features && route.features.length > 0 && (
          <div className="route-features">
            {route.features.slice(0, 3).map((feature, index) => (
              <span key={index} className="feature-tag">
                {feature}
              </span>
            ))}
            {route.features.length > 3 && (
              <span className="feature-more">+{route.features.length - 3}</span>
            )}
          </div>
        )}
      </div>
    </motion.div>
  );

  const GroupStats = ({ stats }) => (
    <div className="group-stats">
      <div className="stat-item">
        <Users size={14} />
        <span>{stats.active}/{stats.total} Active</span>
      </div>
      <div className="stat-item">
        <Clock size={14} />
        <span>{stats.avgDistance}km avg</span>
      </div>
      <div className="stat-item">
        <DollarSign size={14} />
        <span>₹{stats.avgFare} avg</span>
      </div>
    </div>
  );

  return (
    <div className="route-categorization">
      <div className="categorization-header">
        <div className="group-controls">
          <div className="group-selector">
            <label>Group by:</label>
            <select
              value={groupBy}
              onChange={(e) => setGroupBy(e.target.value)}
            >
              {groupOptions.map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          <div className="view-controls">
            <button
              className={`view-btn ${viewMode === 'grid' ? 'active' : ''}`}
              onClick={() => setViewMode('grid')}
            >
              <Grid3X3 size={16} />
            </button>
            <button
              className={`view-btn ${viewMode === 'list' ? 'active' : ''}`}
              onClick={() => setViewMode('list')}
            >
              <List size={16} />
            </button>
          </div>
        </div>

        <div className="categorization-stats">
          <span>{Object.keys(categorizedRoutes).length} groups</span>
          <span>•</span>
          <span>{routes.length} total routes</span>
        </div>
      </div>

      <div className="categorized-routes">
        {Object.entries(categorizedRoutes).map(([groupKey, group]) => (
          <div key={groupKey} className="route-group">
            <div
              className="group-header"
              onClick={() => toggleGroup(groupKey)}
            >
              <div className="group-title">
                {expandedGroups.has(groupKey) ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                <h3>{group.label}</h3>
                <span className="route-count">({group.routes.length})</span>
              </div>
              <GroupStats stats={group.stats} />
            </div>

            <AnimatePresence>
              {expandedGroups.has(groupKey) && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="group-content"
                >
                  <div className={`routes-container ${viewMode}`}>
                    {group.routes.map(route => (
                      <RouteCard
                        key={route._id}
                        route={route}
                        isSelected={selectedRoute?._id === route._id}
                      />
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        ))}
      </div>
    </div>
  );
};

export default RouteCategorization;
