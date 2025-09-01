import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Plus, 
  Search, 
  Filter, 
  MapPin, 
  Clock, 
  Bus, 
  Edit, 
  Trash2, 
  Eye,
  Calendar,
  Route,
  Building,
  Users,
  TrendingUp,
  MoreVertical
} from 'lucide-react';
import AnimatedCard from '../../components/pax/AnimatedCard';
import GlassCard from '../../components/pax/GlassCard';
import ProgressRing from '../../components/pax/ProgressRing';

const RoutesManagement = () => {
  const [routes, setRoutes] = useState([]);
  const [depots, setDepots] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [selectedRoute, setSelectedRoute] = useState(null);
  const [filters, setFilters] = useState({
    fromCity: '',
    toCity: '',
    depotId: '',
    status: ''
  });
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState('grid'); // grid, list, map
  
  // New route form state
  const [newRoute, setNewRoute] = useState({
    routeNumber: '',
    routeName: '',
    startingCity: '',
    startingLocation: '',
    endingCity: '',
    endingLocation: '',
    totalDistance: '',
    estimatedDuration: '',
    baseFare: '',
    depotId: '',
    features: [],
    departureTime: '',
    arrivalTime: '',
    frequency: ''
  });

  // New schedule form state
  const [newSchedule, setNewSchedule] = useState({
    departureTime: '',
    arrivalTime: '',
    frequency: ''
  });

  // Enhanced schedule management state
  const [editingSchedule, setEditingSchedule] = useState(null);
  const [showScheduleForm, setShowScheduleForm] = useState(false);
  const [scheduleFormMode, setScheduleFormMode] = useState('add'); // 'add' or 'edit'
  
  // Advanced scheduling options
  const [scheduleType, setScheduleType] = useState('single'); // 'single', 'recurring', 'pattern'
  const [recurringOptions, setRecurringOptions] = useState({
    frequency: 'daily',
    interval: 1,
    daysOfWeek: [],
    endDate: '',
    maxOccurrences: 10
  });
  const [patternSchedule, setPatternSchedule] = useState({
    pattern: 'custom',
    customPattern: [],
    timeSlots: []
  });

  // Real data for demonstration
  useEffect(() => {
    // Simulate API call
    setTimeout(() => {
      setRoutes([
        {
          id: 1,
          routeNumber: 'RT001',
          routeName: 'Kochi - Trivandrum Express',
          startingPoint: { city: 'Kochi', location: 'Kochi Central Bus Stand, Ernakulam' },
          endingPoint: { city: 'Trivandrum', location: 'Thiruvananthapuram Central Bus Station' },
          totalDistance: 200,
          estimatedDuration: 240,
          depot: { depotId: 1, depotName: 'Kochi Central Depot', depotLocation: 'Kochi' },
          status: 'active',
          schedules: [
            { scheduleId: 'SCH1', departureTime: '06:00', arrivalTime: '10:00', frequency: 'daily' },
            { scheduleId: 'SCH2', departureTime: '14:00', arrivalTime: '18:00', frequency: 'daily' },
            { scheduleId: 'SCH3', departureTime: '22:00', arrivalTime: '02:00', frequency: 'daily' }
          ],
          baseFare: 450,
          features: ['AC', 'WiFi', 'USB_Charging', 'Entertainment']
        },
        {
          id: 2,
          routeNumber: 'RT002',
          routeName: 'Kochi - Bangalore Premium',
          startingPoint: { city: 'Kochi', location: 'Kochi Airport Bus Terminal' },
          endingPoint: { city: 'Bangalore', location: 'Bangalore Central Bus Station, Majestic' },
          totalDistance: 600,
          estimatedDuration: 480,
          depot: { depotId: 2, depotName: 'Kochi Airport Depot', depotLocation: 'Kochi' },
          status: 'active',
          schedules: [
            { scheduleId: 'SCH4', departureTime: '20:00', arrivalTime: '04:00', frequency: 'daily' }
          ],
          baseFare: 1200,
          features: ['AC', 'WiFi', 'Entertainment', 'Refreshments', 'Wheelchair_Accessible']
        },
        {
          id: 3,
          routeNumber: 'RT003',
          routeName: 'Kochi - Chennai Express',
          startingPoint: { city: 'Kochi', location: 'Kochi Central Bus Stand, Ernakulam' },
          endingPoint: { city: 'Chennai', location: 'Chennai Central Bus Terminal, Koyambedu' },
          totalDistance: 750,
          estimatedDuration: 600,
          depot: { depotId: 1, depotName: 'Kochi Central Depot', depotLocation: 'Kochi' },
          status: 'active',
          schedules: [
            { scheduleId: 'SCH5', departureTime: '18:00', arrivalTime: '06:00', frequency: 'daily' }
          ],
          baseFare: 1500,
          features: ['AC', 'WiFi', 'USB_Charging']
        },
        {
          id: 4,
          routeNumber: 'RT004',
          routeName: 'Kochi - Hyderabad Deluxe',
          startingPoint: { city: 'Kochi', location: 'Kochi Central Bus Stand, Ernakulam' },
          endingPoint: { city: 'Hyderabad', location: 'Hyderabad Central Bus Station, Dilsukhnagar' },
          totalDistance: 900,
          estimatedDuration: 720,
          depot: { depotId: 1, depotName: 'Kochi Central Depot', depotLocation: 'Kochi' },
          status: 'active',
          schedules: [
            { scheduleId: 'SCH6', departureTime: '16:00', arrivalTime: '08:00', frequency: 'daily' }
          ],
          baseFare: 1800,
          features: ['AC', 'WiFi', 'Entertainment', 'Refreshments']
        },
        {
          id: 5,
          routeNumber: 'RT005',
          routeName: 'Trivandrum - Bangalore Express',
          startingPoint: { city: 'Trivandrum', location: 'Thiruvananthapuram Central Bus Station' },
          endingPoint: { city: 'Bangalore', location: 'Bangalore Central Bus Station, Majestic' },
          totalDistance: 650,
          estimatedDuration: 540,
          depot: { depotId: 3, depotName: 'Trivandrum Central Depot', depotLocation: 'Trivandrum' },
          status: 'active',
          schedules: [
            { scheduleId: 'SCH7', departureTime: '19:00', arrivalTime: '04:00', frequency: 'daily' }
          ],
          baseFare: 1300,
          features: ['AC', 'WiFi', 'USB_Charging']
        },
        {
          id: 6,
          routeNumber: 'KL001',
          routeName: 'Kochi - Thiruvananthapuram Express',
          startingPoint: { city: 'Kochi', location: 'Kochi Central Bus Terminal, Ernakulam' },
          endingPoint: { city: 'Thiruvananthapuram', location: 'Thiruvananthapuram Central Bus Terminal' },
          totalDistance: 220,
          estimatedDuration: 240,
          depot: { depotId: 1, depotName: 'Kerala Central Depot', depotLocation: 'Kochi' },
          status: 'active',
          schedules: [
            { scheduleId: 'SCH8', departureTime: '08:00', arrivalTime: '12:00', frequency: 'daily' }
          ],
          baseFare: 350,
          features: ['AC', 'WiFi', 'USB_Charging', 'Refreshments']
        },
        {
          id: 7,
          routeNumber: 'KL002',
          routeName: 'Kozhikode - Kochi Coastal Route',
          startingPoint: { city: 'Kozhikode', location: 'Kozhikode Central Bus Terminal' },
          endingPoint: { city: 'Kochi', location: 'Kochi Central Bus Terminal, Ernakulam' },
          totalDistance: 180,
          estimatedDuration: 210,
          depot: { depotId: 1, depotName: 'Kerala Central Depot', depotLocation: 'Kochi' },
          status: 'active',
          schedules: [
            { scheduleId: 'SCH9', departureTime: '10:00', arrivalTime: '13:30', frequency: 'daily' }
          ],
          baseFare: 280,
          features: ['AC', 'WiFi', 'Entertainment']
        },
        {
          id: 8,
          routeNumber: 'KL003',
          routeName: 'Thiruvananthapuram - Kozhikode Mountain Express',
          startingPoint: { city: 'Thiruvananthapuram', location: 'Thiruvananthapuram Central Bus Terminal' },
          endingPoint: { city: 'Kozhikode', location: 'Kozhikode Central Bus Terminal' },
          totalDistance: 380,
          estimatedDuration: 420,
          depot: { depotId: 1, depotName: 'Kerala Central Depot', depotLocation: 'Kochi' },
          status: 'active',
          schedules: [
            { scheduleId: 'SCH10', departureTime: '06:00', arrivalTime: '13:00', frequency: 'daily' }
          ],
          baseFare: 550,
          features: ['AC', 'WiFi', 'USB_Charging', 'Entertainment', 'Refreshments']
        }
      ]);

      setDepots([
        {
          id: 1,
          depotCode: 'KCD001',
          depotName: 'Kochi Central Depot',
          location: { city: 'Kochi', state: 'Kerala' },
          capacity: { totalBuses: 85, availableBuses: 65, maintenanceBuses: 8 },
          status: 'active'
        },
        {
          id: 2,
          depotCode: 'KAD001',
          depotName: 'Kochi Airport Depot',
          location: { city: 'Kochi', state: 'Kerala' },
          capacity: { totalBuses: 45, availableBuses: 35, maintenanceBuses: 4 },
          status: 'active'
        },
        {
          id: 3,
          depotCode: 'TCD001',
          depotName: 'Trivandrum Central Depot',
          location: { city: 'Trivandrum', state: 'Kerala' },
          capacity: { totalBuses: 60, availableBuses: 48, maintenanceBuses: 6 },
          status: 'active'
        },
        {
          id: 4,
          depotCode: 'KLD001',
          depotName: 'Kozhikode Central Depot',
          location: { city: 'Kozhikode', state: 'Kerala' },
          capacity: { totalBuses: 40, availableBuses: 32, maintenanceBuses: 3 },
          status: 'active'
        },
        {
          id: 5,
          depotCode: 'TCD002',
          depotName: 'Thrissur Central Depot',
          location: { city: 'Thrissur', state: 'Kerala' },
          capacity: { totalBuses: 35, availableBuses: 28, maintenanceBuses: 3 },
          status: 'active'
        }
      ]);

      setLoading(false);
    }, 1000);
  }, []);

  // Handle route input changes
  const handleRouteInputChange = (e) => {
    const { name, value } = e.target;
    setNewRoute(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Handle feature checkbox changes
  const handleFeatureChange = (e) => {
    const { value, checked } = e.target;
    setNewRoute(prev => ({
      ...prev,
      features: checked 
        ? [...prev.features, value]
        : prev.features.filter(f => f !== value)
    }));
  };

  // Handle route creation
  const handleCreateRoute = (e) => {
    e.preventDefault();
    
    // Validate required fields
    if (!newRoute.routeNumber || !newRoute.routeName || !newRoute.depotId) {
      window.alert('Please fill in all required fields');
      return;
    }

    // Find the selected depot
    const selectedDepot = depots.find(d => d.id === parseInt(newRoute.depotId));
    if (!selectedDepot) {
      window.alert('Please select a valid depot');
      return;
    }

    // Create new route object
    const newRouteData = {
      id: routes.length + 1, // Generate new ID
      routeNumber: newRoute.routeNumber,
      routeName: newRoute.routeName,
      startingPoint: {
        city: newRoute.startingCity,
        location: newRoute.startingLocation
      },
      endingPoint: {
        city: newRoute.endingCity,
        location: newRoute.endingLocation
      },
      totalDistance: parseInt(newRoute.totalDistance),
      estimatedDuration: parseInt(newRoute.estimatedDuration),
      depot: {
        depotId: parseInt(newRoute.depotId),
        depotName: selectedDepot.depotName,
        depotLocation: selectedDepot.location.city
      },
      status: 'active',
      schedules: [{
        scheduleId: `SCH${routes.length + 1}`,
        departureTime: newRoute.departureTime,
        arrivalTime: newRoute.arrivalTime,
        frequency: newRoute.frequency
      }],
      baseFare: parseInt(newRoute.baseFare),
      features: newRoute.features
    };

    // Add to routes array
    setRoutes(prev => [...prev, newRouteData]);

    // Reset form
    setNewRoute({
      routeNumber: '',
      routeName: '',
      startingCity: '',
      startingLocation: '',
      endingCity: '',
      endingLocation: '',
      totalDistance: '',
      estimatedDuration: '',
      baseFare: '',
      depotId: '',
      features: [],
      departureTime: '',
      arrivalTime: '',
      frequency: ''
    });

    // Close modal
    setShowCreateModal(false);

    // Show success message
    window.alert('Route created successfully!');
  };

  // Handle schedule input changes
  const handleScheduleInputChange = (e) => {
    const { name, value } = e.target;
    const fieldName = name.replace('new', '').toLowerCase();
    setNewSchedule(prev => ({
      ...prev,
      [fieldName]: value
    }));
  };

  // Handle editing schedule input changes
  const handleEditScheduleInputChange = (e) => {
    const { name, value } = e.target;
    setEditingSchedule(prev => ({
      ...prev,
      [name]: value
    }));
  };

    // Handle adding new schedule
  const handleAddSchedule = (e) => {
    e.preventDefault();
    
    if (!newSchedule.departureTime || !newSchedule.arrivalTime || !newSchedule.frequency) {
      window.alert('Please fill in all schedule fields');
      return;
    }

    // Validate time logic
    if (newSchedule.departureTime >= newSchedule.arrivalTime) {
      window.alert('Arrival time must be after departure time');
      return;
    }

    const newScheduleData = {
      scheduleId: `SCH${Date.now()}`, // Generate unique ID
      departureTime: newSchedule.departureTime,
      arrivalTime: newSchedule.arrivalTime,
      frequency: newSchedule.frequency
    };

    // Add schedule to the selected route
    const updatedRoute = { ...selectedRoute, schedules: [...selectedRoute.schedules, newScheduleData] };
    
    setRoutes(prev => prev.map(route => 
      route.id === selectedRoute.id 
        ? updatedRoute
        : route
    ));

    // Update selectedRoute to reflect the new schedule
    setSelectedRoute(updatedRoute);

    // Reset schedule form
    setNewSchedule({
      departureTime: '',
      arrivalTime: '',
      frequency: ''
    });

    // Close the schedule form
    setShowScheduleForm(false);

    // Show success message
    window.alert('Schedule added successfully!');
  };

  // Handle editing schedule
  const handleEditSchedule = (schedule) => {
    setEditingSchedule({ ...schedule });
    setScheduleFormMode('edit');
    setShowScheduleForm(true);
  };

  // Handle updating schedule
  const handleUpdateSchedule = (e) => {
    e.preventDefault();
    
    if (!editingSchedule.departureTime || !editingSchedule.arrivalTime || !editingSchedule.frequency) {
      window.alert('Please fill in all schedule fields');
      return;
    }

    // Validate time logic
    if (editingSchedule.departureTime >= editingSchedule.arrivalTime) {
      window.alert('Arrival time must be after departure time');
      return;
    }

    // Update schedule in the route
    const updatedRoute = {
      ...selectedRoute,
      schedules: selectedRoute.schedules.map(schedule =>
        schedule.scheduleId === editingSchedule.scheduleId
          ? { ...editingSchedule }
          : schedule
      )
    };
    
    setRoutes(prev => prev.map(route => 
      route.id === selectedRoute.id 
        ? updatedRoute
        : route
    ));

    // Update selectedRoute to reflect the updated schedule
    setSelectedRoute(updatedRoute);

    // Reset editing state
    setEditingSchedule(null);
    setShowScheduleForm(false);
    setScheduleFormMode('add');

    // Show success message
    window.alert('Schedule updated successfully!');
  };

  // Handle canceling schedule edit
  const handleCancelScheduleEdit = () => {
    setEditingSchedule(null);
    setShowScheduleForm(false);
    setScheduleFormMode('add');
    setNewSchedule({
      departureTime: '',
      arrivalTime: '',
      frequency: ''
    });
    // Reset advanced scheduling options
    setScheduleType('single');
    setRecurringOptions({
      frequency: 'daily',
      interval: 1,
      daysOfWeek: [],
      endDate: '',
      maxOccurrences: 10
    });
    setPatternSchedule({
      pattern: 'custom',
      customPattern: [],
      timeSlots: []
    });
  };

  // Advanced scheduling helpers
  const generateTimeSlots = () => {
    const slots = [];
    for (let hour = 0; hour < 24; hour++) {
      for (let minute = 0; minute < 60; minute += 15) {
        const time = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
        slots.push(time);
      }
    }
    return slots;
  };

  const getTimeDisplay = (time) => {
    if (!time) return '';
    const [hours, minutes] = time.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
    return `${displayHour}:${minutes} ${ampm}`;
  };

  const validateScheduleTime = (departure, arrival) => {
    if (!departure || !arrival) return false;
    
    const [depHour, depMin] = departure.split(':').map(Number);
    const [arrHour, arrMin] = arrival.split(':').map(Number);
    
    const depMinutes = depHour * 60 + depMin;
    const arrMinutes = arrHour * 60 + arrMin;
    
    // Handle overnight journeys (arrival next day)
    if (arrMinutes <= depMinutes) {
      arrMinutes += 24 * 60; // Add 24 hours
    }
    
    return arrMinutes > depMinutes;
  };

  const generateRecurringSchedules = (baseSchedule, options) => {
    const schedules = [];
    const baseDate = new Date();
    
    for (let i = 0; i < options.maxOccurrences; i++) {
      const scheduleDate = new Date(baseDate);
      
      if (options.frequency === 'daily') {
        scheduleDate.setDate(baseDate.getDate() + (i * options.interval));
      } else if (options.frequency === 'weekly') {
        scheduleDate.setDate(baseDate.getDate() + (i * options.interval * 7));
      } else if (options.frequency === 'monthly') {
        scheduleDate.setMonth(baseDate.getMonth() + (i * options.interval));
      }
      
      schedules.push({
        ...baseSchedule,
        scheduleId: `SCH${Date.now()}_${i}`,
        date: scheduleDate.toISOString().split('T')[0],
        departureTime: baseSchedule.departureTime,
        arrivalTime: baseSchedule.arrivalTime,
        frequency: options.frequency
      });
    }
    
    return schedules;
  };

  const handleQuickTimeSelection = (time) => {
    if (scheduleFormMode === 'add') {
      setNewSchedule(prev => ({ ...prev, departureTime: time }));
    } else {
      setEditingSchedule(prev => ({ ...prev, departureTime: time }));
    }
  };

  const handleQuickTimeSelectionArrival = (time) => {
    if (scheduleFormMode === 'add') {
      setNewSchedule(prev => ({ ...prev, arrivalTime: time }));
    } else {
      setEditingSchedule(prev => ({ ...prev, arrivalTime: time }));
    }
  };

  // Handle deleting schedule
  const handleDeleteSchedule = (routeId, scheduleId) => {
    if (window.confirm('Are you sure you want to delete this schedule?')) {
      const updatedRoute = {
        ...selectedRoute,
        schedules: selectedRoute.schedules.filter(s => s.scheduleId !== scheduleId)
      };
      
      setRoutes(prev => prev.map(route => 
        route.id === routeId 
          ? updatedRoute
          : route
      ));

      // Update selectedRoute to reflect the deleted schedule
      setSelectedRoute(updatedRoute);

      window.alert('Schedule deleted successfully!');
    }
  };

  const filteredRoutes = routes.filter(route => {
    const matchesSearch = route.routeName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         route.routeNumber.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesFilters = (!filters.fromCity || route.startingPoint.city.toLowerCase().includes(filters.fromCity.toLowerCase())) &&
                          (!filters.toCity || route.endingPoint.city.toLowerCase().includes(filters.toCity.toLowerCase())) &&
                          (!filters.depotId || route.depot.depotId.toString() === filters.depotId) &&
                          (!filters.status || route.status === filters.status);

    return matchesSearch && matchesFilters;
  });

  const getStatusColor = (status) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'inactive': return 'bg-gray-100 text-gray-800';
      case 'maintenance': return 'bg-yellow-100 text-yellow-800';
      case 'suspended': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'active': return '🟢';
      case 'inactive': return '⚪';
      case 'maintenance': return '🟡';
      case 'suspended': return '🔴';
      default: return '⚪';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading routes...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Routes Management</h1>
            <p className="text-gray-600 mt-2">Manage bus routes and depot scheduling</p>
          </div>
          <div className="flex items-center space-x-4">
            <button
              onClick={() => setShowCreateModal(true)}
              className="bg-blue-600 text-white px-6 py-3 rounded-lg flex items-center hover:bg-blue-700 transition-colors"
            >
              <Plus className="w-5 h-5 mr-2" />
              Create Route
            </button>
            <button
              onClick={() => setViewMode(viewMode === 'grid' ? 'list' : 'grid')}
              className="bg-gray-100 text-gray-700 px-4 py-3 rounded-lg hover:bg-gray-200 transition-colors"
            >
              {viewMode === 'grid' ? 'List View' : 'Grid View'}
            </button>
          </div>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <AnimatedCard className="p-6" delay={0}>
          <div className="flex items-center">
            <div className="p-3 bg-blue-100 rounded-lg mr-4">
              <Route className="w-8 h-8 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Total Routes</p>
              <p className="text-2xl font-bold text-gray-900">{routes.length}</p>
            </div>
          </div>
        </AnimatedCard>

        <AnimatedCard className="p-6" delay={1}>
          <div className="flex items-center">
            <div className="p-3 bg-green-100 rounded-lg mr-4">
              <Building className="w-8 h-8 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Active Depots</p>
              <p className="text-2xl font-bold text-gray-900">{depots.filter(d => d.status === 'active').length}</p>
            </div>
          </div>
        </AnimatedCard>

        <AnimatedCard className="p-6" delay={2}>
          <div className="flex items-center">
            <div className="p-3 bg-purple-100 rounded-lg mr-4">
              <Clock className="w-8 h-8 text-purple-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Total Schedules</p>
              <p className="text-2xl font-bold text-gray-900">
                {routes.reduce((sum, route) => sum + route.schedules.length, 0)}
              </p>
            </div>
          </div>
        </AnimatedCard>

        <AnimatedCard className="p-6" delay={3}>
          <div className="flex items-center">
            <div className="p-3 bg-orange-100 rounded-lg mr-4">
              <Bus className="w-8 h-8 text-orange-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Available Buses</p>
              <p className="text-2xl font-bold text-gray-900">
                {depots.reduce((sum, depot) => sum + depot.capacity.availableBuses, 0)}
              </p>
            </div>
          </div>
        </AnimatedCard>
      </div>

      {/* Filters and Search */}
      <GlassCard className="p-6 mb-8">
        <div className="flex flex-col lg:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search routes by name or number..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
          
          <div className="flex gap-4">
            <select
              value={filters.fromCity}
              onChange={(e) => setFilters({ ...filters, fromCity: e.target.value })}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">From City</option>
              <option value="Kochi">Kochi</option>
              <option value="Thiruvananthapuram">Thiruvananthapuram</option>
              <option value="Kozhikode">Kozhikode</option>
              <option value="Alappuzha">Alappuzha</option>
              <option value="Kollam">Kollam</option>
              <option value="Thrissur">Thrissur</option>
              <option value="Kottayam">Kottayam</option>
              <option value="Palakkad">Palakkad</option>
            </select>
            
            <select
              value={filters.toCity}
              onChange={(e) => setFilters({ ...filters, toCity: e.target.value })}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">To City</option>
              <option value="Kochi">Kochi</option>
              <option value="Thiruvananthapuram">Thiruvananthapuram</option>
              <option value="Kozhikode">Kozhikode</option>
              <option value="Alappuzha">Alappuzha</option>
              <option value="Kollam">Kollam</option>
              <option value="Thrissur">Thrissur</option>
              <option value="Kottayam">Kottayam</option>
              <option value="Palakkad">Palakkad</option>
            </select>
            
            <select
              value={filters.depotId}
              onChange={(e) => setFilters({ ...filters, depotId: e.target.value })}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Depots</option>
              {depots.map(depot => (
                <option key={depot.id} value={depot.id}>{depot.depotName}</option>
              ))}
            </select>
            
            <select
              value={filters.status}
              onChange={(e) => setFilters({ ...filters, status: e.target.value })}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
              <option value="maintenance">Maintenance</option>
              <option value="suspended">Suspended</option>
            </select>
          </div>
        </div>
      </GlassCard>

      {/* Routes Grid/List */}
      <div className="space-y-6">
        {viewMode === 'grid' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredRoutes.map((route, index) => (
              <AnimatedCard key={route.id} delay={index} className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">{route.routeName}</h3>
                    <p className="text-sm text-gray-500">{route.routeNumber}</p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(route.status)}`}>
                      {getStatusIcon(route.status)} {route.status}
                    </span>
                    <button className="p-1 hover:bg-gray-100 rounded">
                      <MoreVertical className="w-4 h-4 text-gray-500" />
                    </button>
                  </div>
                </div>

                <div className="space-y-3 mb-4">
                  <div className="flex items-center text-sm text-gray-600">
                    <MapPin className="w-4 h-4 mr-2" />
                    <span>{route.startingPoint.city} → {route.endingPoint.city}</span>
                  </div>
                  
                  <div className="flex items-center text-sm text-gray-600">
                    <Route className="w-4 h-4 mr-2" />
                    <span>{route.totalDistance} km • {Math.floor(route.estimatedDuration / 60)}h {route.estimatedDuration % 60}m</span>
                  </div>
                  
                  <div className="flex items-center text-sm text-gray-600">
                    <Building className="w-4 h-4 mr-2" />
                    <span>{route.depot.depotName}</span>
                  </div>
                  
                  <div className="flex items-center text-sm text-gray-600">
                    <Clock className="w-4 h-4 mr-2" />
                    <span>{route.schedules.length} schedules</span>
                  </div>
                </div>

                <div className="flex items-center justify-between mb-4">
                  <div className="text-lg font-bold text-blue-600">₹{route.baseFare}</div>
                  <div className="flex space-x-1">
                    {route.features.slice(0, 3).map((feature, idx) => (
                      <span key={idx} className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded">
                        {feature}
                      </span>
                    ))}
                    {route.features.length > 3 && (
                      <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded">
                        +{route.features.length - 3}
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex space-x-2">
                  <button
                    onClick={() => {
                      setSelectedRoute(route);
                      setShowScheduleModal(true);
                    }}
                    className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors text-sm"
                  >
                    <Calendar className="w-4 h-4 mr-1 inline" />
                    Schedule
                  </button>
                  <button className="flex-1 bg-gray-100 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-200 transition-colors text-sm">
                    <Edit className="w-4 h-4 mr-1 inline" />
                    Edit
                  </button>
                </div>
              </AnimatedCard>
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Route</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">From → To</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Depot</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Schedules</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredRoutes.map((route) => (
                    <tr key={route.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900">{route.routeName}</div>
                          <div className="text-sm text-gray-500">{route.routeNumber}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {route.startingPoint.city} → {route.endingPoint.city}
                        </div>
                        <div className="text-sm text-gray-500">
                          {route.totalDistance} km • {Math.floor(route.estimatedDuration / 60)}h {route.estimatedDuration % 60}m
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{route.depot.depotName}</div>
                        <div className="text-sm text-gray-500">{route.depot.depotLocation}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{route.schedules.length} schedules</div>
                        <div className="text-sm text-gray-500">₹{route.baseFare}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(route.status)}`}>
                          {getStatusIcon(route.status)} {route.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex space-x-2">
                          <button
                            onClick={() => {
                              setSelectedRoute(route);
                              setShowScheduleModal(true);
                            }}
                            className="text-blue-600 hover:text-blue-900"
                          >
                            Schedule
                          </button>
                          <button className="text-gray-600 hover:text-gray-900">Edit</button>
                          <button className="text-red-600 hover:text-red-900">Delete</button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Create Route Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <h2 className="text-2xl font-bold mb-4">Create New Route</h2>
            
            <form onSubmit={handleCreateRoute} className="space-y-6">
              {/* Basic Route Information */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Route Number *</label>
                  <input
                    type="text"
                    name="routeNumber"
                    value={newRoute.routeNumber}
                    onChange={handleRouteInputChange}
                    placeholder="e.g., RT009"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Route Name *</label>
                  <input
                    type="text"
                    name="routeName"
                    value={newRoute.routeName}
                    onChange={handleRouteInputChange}
                    placeholder="e.g., Kochi - Goa Express"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
              </div>

              {/* Starting Point */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Starting City *</label>
                  <input
                    type="text"
                    name="startingCity"
                    value={newRoute.startingCity}
                    onChange={handleRouteInputChange}
                    placeholder="e.g., Kochi"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Starting Location *</label>
                  <input
                    type="text"
                    name="startingLocation"
                    value={newRoute.startingLocation}
                    onChange={handleRouteInputChange}
                    placeholder="e.g., Kochi Central Bus Stand"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
              </div>

              {/* Ending Point */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Ending City *</label>
                  <input
                    type="text"
                    name="endingCity"
                    value={newRoute.endingCity}
                    onChange={handleRouteInputChange}
                    placeholder="e.g., Goa"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Ending Location *</label>
                  <input
                    type="text"
                    name="endingLocation"
                    value={newRoute.endingLocation}
                    onChange={handleRouteInputChange}
                    placeholder="e.g., Goa Central Bus Station"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
              </div>

              {/* Route Details */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Total Distance (km) *</label>
                  <input
                    type="number"
                    name="totalDistance"
                    value={newRoute.totalDistance}
                    onChange={handleRouteInputChange}
                    placeholder="e.g., 800"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Estimated Duration (minutes) *</label>
                  <input
                    type="number"
                    name="estimatedDuration"
                    value={newRoute.estimatedDuration}
                    onChange={handleRouteInputChange}
                    placeholder="e.g., 600"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Base Fare (₹) *</label>
                  <input
                    type="number"
                    name="baseFare"
                    value={newRoute.baseFare}
                    onChange={handleRouteInputChange}
                    placeholder="e.g., 1800"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
              </div>

              {/* Depot Assignment */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Assign Depot *</label>
                <select
                  name="depotId"
                  value={newRoute.depotId}
                  onChange={handleRouteInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                >
                  <option value="">Select a depot</option>
                  {depots.map(depot => (
                    <option key={depot.id} value={depot.id}>
                      {depot.depotName} - {depot.location.city}
                    </option>
                  ))}
                </select>
              </div>

              {/* Route Features */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Route Features</label>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {['AC', 'WiFi', 'USB_Charging', 'Entertainment', 'Refreshments', 'Wheelchair_Accessible'].map(feature => (
                    <label key={feature} className="flex items-center">
                      <input
                        type="checkbox"
                        name="features"
                        value={feature}
                        checked={newRoute.features.includes(feature)}
                        onChange={handleFeatureChange}
                        className="mr-2 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <span className="text-sm text-gray-700">{feature.replace('_', ' ')}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Initial Schedule */}
              <div className="border-t pt-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Initial Schedule</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Departure Time *</label>
                    <input
                      type="time"
                      name="departureTime"
                      value={newRoute.departureTime}
                      onChange={handleRouteInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Arrival Time *</label>
                    <input
                      type="time"
                      name="arrivalTime"
                      value={newRoute.arrivalTime}
                      onChange={handleRouteInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Frequency *</label>
                    <select
                      name="frequency"
                      value={newRoute.frequency}
                      onChange={handleRouteInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    >
                      <option value="">Select frequency</option>
                      <option value="daily">Daily</option>
                      <option value="weekly">Weekly</option>
                      <option value="monthly">Monthly</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Form Actions */}
              <div className="flex justify-end space-x-4 pt-6 border-t">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-6 py-2 text-gray-600 hover:text-gray-800 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  Create Route
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Schedule Modal */}
      {showScheduleModal && selectedRoute && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-6xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-900">Manage Schedules - {selectedRoute.routeName}</h2>
              <button
                onClick={() => setShowScheduleModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Route Information Summary */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div>
                  <span className="font-medium text-blue-800">Route:</span>
                  <p className="text-blue-700">{selectedRoute.routeNumber} - {selectedRoute.routeName}</p>
                </div>
                <div>
                  <span className="font-medium text-blue-800">From:</span>
                  <p className="text-blue-700">{selectedRoute.startingPoint.city}</p>
                </div>
                <div>
                  <span className="font-medium text-blue-800">To:</span>
                  <p className="text-blue-700">{selectedRoute.endingPoint.city}</p>
                </div>
                <div>
                  <span className="font-medium text-blue-800">Total Schedules:</span>
                  <p className="text-blue-700">{selectedRoute.schedules.length}</p>
                </div>
              </div>
            </div>

            {/* Current Schedules */}
            <div className="mb-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-4">
                  <h3 className="text-lg font-medium text-gray-900">Current Schedules</h3>
                  <span className="px-2 py-1 bg-blue-100 text-blue-800 text-sm rounded-full">
                    {selectedRoute.schedules.length} schedule{selectedRoute.schedules.length !== 1 ? 's' : ''}
                  </span>
                </div>
                <div className="flex items-center space-x-3">
                  <button
                    onClick={() => {
                      // Force refresh of selectedRoute from routes state
                      const refreshedRoute = routes.find(r => r.id === selectedRoute.id);
                      if (refreshedRoute) {
                        setSelectedRoute(refreshedRoute);
                      }
                    }}
                    className="px-3 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors flex items-center"
                    title="Refresh schedules"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                  </button>
                  <button
                    onClick={() => {
                      setShowScheduleForm(true);
                      setScheduleFormMode('add');
                      setNewSchedule({ departureTime: '', arrivalTime: '', frequency: '' });
                    }}
                    className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 flex items-center"
                  >
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                    Add New Schedule
                  </button>
                </div>
              </div>
              
              {selectedRoute.schedules.length === 0 ? (
                <div className="text-center py-8 bg-gray-50 rounded-lg">
                  <svg className="w-16 h-16 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <p className="text-gray-500">No schedules found</p>
                  <p className="text-sm text-gray-400">Add your first schedule to get started</p>
                </div>
              ) : (
                <div className="grid gap-4">
                  {selectedRoute.schedules.map((schedule, index) => (
                    <div key={schedule.scheduleId} className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-6">
                          <div className="text-center">
                            <div className="text-2xl font-bold text-blue-600">{index + 1}</div>
                            <div className="text-xs text-gray-500">Schedule</div>
                          </div>
                          
                          <div className="flex items-center space-x-4">
                            <div className="text-center">
                              <div className="text-sm font-medium text-gray-700">Departure</div>
                              <div className="text-lg font-bold text-gray-900">{schedule.departureTime}</div>
                            </div>
                            
                            <div className="text-gray-400">
                              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                              </svg>
                            </div>
                            
                            <div className="text-center">
                              <div className="text-sm font-medium text-gray-700">Arrival</div>
                              <div className="text-lg font-bold text-gray-900">{schedule.arrivalTime}</div>
                            </div>
                          </div>
                          
                          <div className="text-center">
                            <div className="text-sm font-medium text-gray-700">Frequency</div>
                            <div className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-medium capitalize">
                              {schedule.frequency}
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => handleEditSchedule(schedule)}
                            className="p-2 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-lg transition-colors"
                            title="Edit Schedule"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                          </button>
                          
                          <button
                            onClick={() => handleDeleteSchedule(selectedRoute.id, schedule.scheduleId)}
                            className="p-2 text-red-600 hover:text-red-800 hover:bg-red-50 rounded-lg transition-colors"
                            title="Delete Schedule"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Advanced Schedule Form Modal */}
            {showScheduleForm && (
              <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[60]">
                <div className="bg-white rounded-lg p-6 w-full max-w-5xl max-h-[90vh] overflow-y-auto">
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-xl font-semibold text-gray-900">
                      {scheduleFormMode === 'add' ? 'Add New Schedule' : 'Edit Schedule'}
                    </h3>
                    <button
                      onClick={handleCancelScheduleEdit}
                      className="text-gray-400 hover:text-gray-600"
                    >
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>

                  <form onSubmit={scheduleFormMode === 'add' ? handleAddSchedule : handleUpdateSchedule} className="space-y-6">
                    {/* Schedule Type Selection */}
                    <div className="bg-gray-50 rounded-lg p-4">
                      <h4 className="text-sm font-medium text-gray-900 mb-3">Schedule Type</h4>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                        {[
                          { value: 'single', label: 'Single Schedule', description: 'One-time schedule' },
                          { value: 'recurring', label: 'Recurring Schedule', description: 'Repeats at intervals' },
                          { value: 'pattern', label: 'Pattern Schedule', description: 'Custom time patterns' }
                        ].map(type => (
                          <label key={type.value} className="flex items-start p-3 border border-gray-200 rounded-lg hover:bg-white cursor-pointer">
                            <input
                              type="radio"
                              value={type.value}
                              checked={scheduleType === type.value}
                              onChange={(e) => setScheduleType(e.target.value)}
                              className="mr-3 mt-1 text-blue-600 focus:ring-blue-500"
                            />
                            <div>
                              <div className="font-medium text-gray-900">{type.label}</div>
                              <div className="text-sm text-gray-500">{type.description}</div>
                            </div>
                          </label>
                        ))}
                      </div>
                    </div>

                    {/* Advanced Time Selection */}
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
                      <h4 className="text-lg font-medium text-blue-900 mb-4">Time Selection</h4>
                      
                      {/* Quick Time Selection */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                        <div>
                          <label className="block text-sm font-medium text-blue-700 mb-3">Departure Time *</label>
                          <div className="space-y-3">
                            <input
                              type="time"
                              name="departureTime"
                              value={scheduleFormMode === 'add' ? newSchedule.departureTime : editingSchedule?.departureTime || ''}
                              onChange={scheduleFormMode === 'add' ? handleScheduleInputChange : handleEditScheduleInputChange}
                              className="w-full px-3 py-2 border border-blue-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                              required
                            />
                            
                            {/* Quick Time Buttons */}
                            <div className="grid grid-cols-4 gap-2">
                              {['06:00', '08:00', '10:00', '12:00', '14:00', '16:00', '18:00', '20:00'].map(time => (
                                <button
                                  key={time}
                                  type="button"
                                  onClick={() => handleQuickTimeSelection(time)}
                                  className="px-2 py-1 text-xs bg-blue-100 text-blue-700 rounded hover:bg-blue-200 transition-colors"
                                >
                                  {getTimeDisplay(time)}
                                </button>
                              ))}
                            </div>
                          </div>
                        </div>
                        
                        <div>
                          <label className="block text-sm font-medium text-blue-700 mb-3">Arrival Time *</label>
                          <div className="space-y-3">
                            <input
                              type="time"
                              name="arrivalTime"
                              value={scheduleFormMode === 'add' ? newSchedule.arrivalTime : editingSchedule?.arrivalTime || ''}
                              onChange={scheduleFormMode === 'add' ? handleScheduleInputChange : handleEditScheduleInputChange}
                              className="w-full px-3 py-2 border border-blue-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                              required
                            />
                            
                            {/* Quick Time Buttons */}
                            <div className="grid grid-cols-4 gap-2">
                              {['10:00', '12:00', '14:00', '16:00', '18:00', '20:00', '22:00', '02:00'].map(time => (
                                <button
                                  key={time}
                                  type="button"
                                  onClick={() => handleQuickTimeSelectionArrival(time)}
                                  className="px-2 py-1 text-xs bg-green-100 text-green-700 rounded hover:bg-green-200 transition-colors"
                                >
                                  {getTimeDisplay(time)}
                                </button>
                              ))}
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Time Validation & Display */}
                      <div className="bg-white rounded-lg p-4 border border-blue-200">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-4">
                            <div className="text-center">
                              <div className="text-sm font-medium text-gray-700">Departure</div>
                              <div className="text-lg font-bold text-blue-600">
                                {getTimeDisplay(scheduleFormMode === 'add' ? newSchedule.departureTime : editingSchedule?.departureTime)}
                              </div>
                            </div>
                            
                            <div className="text-gray-400">
                              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                              </svg>
                            </div>
                            
                            <div className="text-center">
                              <div className="text-sm font-medium text-gray-700">Arrival</div>
                              <div className="text-lg font-bold text-green-600">
                                {getTimeDisplay(scheduleFormMode === 'add' ? newSchedule.arrivalTime : editingSchedule?.arrivalTime)}
                              </div>
                            </div>
                          </div>
                          
                          <div className="text-right">
                            <div className="text-sm font-medium text-gray-700">Duration</div>
                            <div className="text-lg font-bold text-purple-600">
                              {(() => {
                                const dep = scheduleFormMode === 'add' ? newSchedule.departureTime : editingSchedule?.departureTime;
                                const arr = scheduleFormMode === 'add' ? newSchedule.arrivalTime : editingSchedule?.arrivalTime;
                                if (!dep || !arr) return '--';
                                
                                const [depHour, depMin] = dep.split(':').map(Number);
                                const [arrHour, arrMin] = arr.split(':').map(Number);
                                
                                let depMinutes = depHour * 60 + depMin;
                                let arrMinutes = arrHour * 60 + arrMin;
                                
                                if (arrMinutes <= depMinutes) {
                                  arrMinutes += 24 * 60;
                                }
                                
                                const duration = arrMinutes - depMinutes;
                                const hours = Math.floor(duration / 60);
                                const minutes = duration % 60;
                                
                                return `${hours}h ${minutes}m`;
                              })()}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Recurring Schedule Options */}
                    {scheduleType === 'recurring' && (
                      <div className="bg-green-50 border border-green-200 rounded-lg p-6">
                        <h4 className="text-lg font-medium text-green-900 mb-4">Recurring Schedule Options</h4>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                          <div>
                            <label className="block text-sm font-medium text-green-700 mb-2">Frequency</label>
                            <select
                              value={recurringOptions.frequency}
                              onChange={(e) => setRecurringOptions(prev => ({ ...prev, frequency: e.target.value }))}
                              className="w-full px-3 py-2 border border-green-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                            >
                              <option value="daily">Daily</option>
                              <option value="weekly">Weekly</option>
                              <option value="monthly">Monthly</option>
                            </select>
                          </div>
                          
                          <div>
                            <label className="block text-sm font-medium text-green-700 mb-2">Interval</label>
                            <input
                              type="number"
                              min="1"
                              max="30"
                              value={recurringOptions.interval}
                              onChange={(e) => setRecurringOptions(prev => ({ ...prev, interval: parseInt(e.target.value) }))}
                              className="w-full px-3 py-2 border border-green-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                            />
                          </div>
                          
                          <div>
                            <label className="block text-sm font-medium text-green-700 mb-2">Max Occurrences</label>
                            <input
                              type="number"
                              min="1"
                              max="100"
                              value={recurringOptions.maxOccurrences}
                              onChange={(e) => setRecurringOptions(prev => ({ ...prev, maxOccurrences: parseInt(e.target.value) }))}
                              className="w-full px-3 py-2 border border-green-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                            />
                          </div>
                        </div>
                        
                        {recurringOptions.frequency === 'weekly' && (
                          <div className="mt-4">
                            <label className="block text-sm font-medium text-green-700 mb-2">Days of Week</label>
                            <div className="grid grid-cols-7 gap-2">
                              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day, index) => (
                                <label key={day} className="flex items-center justify-center p-2 border border-green-200 rounded hover:bg-green-100 cursor-pointer">
                                  <input
                                    type="checkbox"
                                    checked={recurringOptions.daysOfWeek.includes(index)}
                                    onChange={(e) => {
                                      if (e.target.checked) {
                                        setRecurringOptions(prev => ({ ...prev, daysOfWeek: [...prev.daysOfWeek, index] }));
                                      } else {
                                        setRecurringOptions(prev => ({ ...prev, daysOfWeek: prev.daysOfWeek.filter(d => d !== index) }));
                                      }
                                    }}
                                    className="mr-1 text-green-600 focus:ring-green-500"
                                  />
                                  <span className="text-sm font-medium text-green-800">{day}</span>
                                </label>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Pattern Schedule Options */}
                    {scheduleType === 'pattern' && (
                      <div className="bg-purple-50 border border-purple-200 rounded-lg p-6">
                        <h4 className="text-lg font-medium text-purple-900 mb-4">Pattern Schedule Options</h4>
                        <div className="space-y-4">
                          <div>
                            <label className="block text-sm font-medium text-purple-700 mb-2">Pattern Type</label>
                            <select
                              value={patternSchedule.pattern}
                              onChange={(e) => setPatternSchedule(prev => ({ ...prev, pattern: e.target.value }))}
                              className="w-full px-3 py-2 border border-purple-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                            >
                              <option value="custom">Custom Pattern</option>
                              <option value="peak_hours">Peak Hours (6 AM - 9 AM, 5 PM - 8 PM)</option>
                              <option value="off_peak">Off-Peak Hours (10 AM - 4 PM)</option>
                              <option value="night">Night Service (10 PM - 6 AM)</option>
                            </select>
                          </div>
                          
                          {patternSchedule.pattern === 'custom' && (
                            <div>
                              <label className="block text-sm font-medium text-purple-700 mb-2">Custom Time Slots</label>
                              <div className="grid grid-cols-4 gap-2">
                                {generateTimeSlots().slice(0, 48).map(time => (
                                  <button
                                    key={time}
                                    type="button"
                                    onClick={() => {
                                      if (patternSchedule.timeSlots.includes(time)) {
                                        setPatternSchedule(prev => ({
                                          ...prev,
                                          timeSlots: prev.timeSlots.filter(t => t !== time)
                                        }));
                                      } else {
                                        setPatternSchedule(prev => ({
                                          ...prev,
                                          timeSlots: [...prev.timeSlots, time]
                                        }));
                                      }
                                    }}
                                    className={`px-2 py-1 text-xs rounded transition-colors ${
                                      patternSchedule.timeSlots.includes(time)
                                        ? 'bg-purple-600 text-white'
                                        : 'bg-purple-100 text-purple-700 hover:bg-purple-200'
                                    }`}
                                  >
                                    {getTimeDisplay(time)}
                                  </button>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Basic Frequency Selection */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Basic Frequency *</label>
                      <select
                        name="frequency"
                        value={scheduleFormMode === 'add' ? newSchedule.frequency : editingSchedule?.frequency || ''}
                        onChange={scheduleFormMode === 'add' ? handleScheduleInputChange : handleEditScheduleInputChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        required
                      >
                        <option value="">Select frequency</option>
                        <option value="daily">Daily</option>
                        <option value="weekly">Weekly</option>
                        <option value="monthly">Monthly</option>
                        <option value="weekdays">Weekdays Only</option>
                        <option value="weekends">Weekends Only</option>
                        <option value="custom">Custom Pattern</option>
                      </select>
                    </div>

                    {/* Time Validation Warning */}
                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                      <div className="flex items-start">
                        <svg className="w-5 h-5 text-yellow-600 mr-2 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.34 16.5c-.77.833.192 2.5 1.732 2.5z" />
                        </svg>
                        <div className="text-sm text-yellow-800">
                          <strong>Time Validation:</strong> 
                          {(() => {
                            const dep = scheduleFormMode === 'add' ? newSchedule.departureTime : editingSchedule?.departureTime;
                            const arr = scheduleFormMode === 'add' ? newSchedule.arrivalTime : editingSchedule?.arrivalTime;
                            
                            if (!dep || !arr) return ' Please select both departure and arrival times.';
                            
                            if (validateScheduleTime(dep, arr)) {
                              return ' Time validation passed. Schedule is valid.';
                            } else {
                              return ' Invalid time combination. Arrival time must be after departure time.';
                            }
                          })()}
                        </div>
                      </div>
                    </div>

                    {/* Form Actions */}
                    <div className="flex justify-end space-x-3 pt-6 border-t">
                      <button
                        type="button"
                        onClick={handleCancelScheduleEdit}
                        className="px-4 py-2 text-gray-600 hover:text-gray-800 border border-gray-300 rounded-lg hover:bg-gray-50"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        className={`px-6 py-2 text-white rounded-lg focus:outline-none focus:ring-2 ${
                          scheduleFormMode === 'add' 
                            ? 'bg-green-600 hover:bg-green-700 focus:ring-green-500' 
                            : 'bg-blue-600 hover:bg-blue-700 focus:ring-blue-500'
                        }`}
                      >
                        {scheduleFormMode === 'add' ? 'Add Schedule' : 'Update Schedule'}
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}

            {/* Modal Actions */}
            <div className="flex justify-end space-x-4 mt-6 pt-6 border-t">
              <button
                onClick={() => setShowScheduleModal(false)}
                className="px-6 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500"
              >
                Close Schedule Manager
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RoutesManagement;
