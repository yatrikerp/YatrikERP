import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Plus, 
  Search, 
  MapPin, 
  Phone, 
  Mail, 
  Building, 
  Bus, 
  Edit, 
  Trash2, 
  Eye,
  Calendar,
  Users,
  TrendingUp,
  MoreVertical,
  Fuel,
  Wrench,
  Car,
  Shield,
  Coffee,
  Wifi
} from 'lucide-react';
import AnimatedCard from '../../components/pax/AnimatedCard';
import GlassCard from '../../components/pax/GlassCard';
import ProgressRing from '../../components/pax/ProgressRing';

const DepotManagement = () => {
  const [depots, setDepots] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedDepot, setSelectedDepot] = useState(null);
  const [filters, setFilters] = useState({
    city: '',
    state: '',
    status: '',
    hasCapacity: ''
  });
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState('grid');

  // Enhanced depot creation state
  const [depotForm, setDepotForm] = useState({
    depotCode: '',
    depotName: '',
    location: {
      address: '',
      city: '',
      state: '',
      pincode: ''
    },
    contact: {
      phone: '',
      email: '',
      manager: {
        name: '',
        phone: '',
        email: ''
      }
    },
    capacity: {
      totalBuses: '',
      availableBuses: '',
      maintenanceBuses: ''
    },
    operatingHours: {
      openTime: '06:00',
      closeTime: '22:00',
      workingDays: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']
    },
    facilities: [],
    status: 'active',
    // User account creation
    createUserAccount: true,
    userAccount: {
      username: '',
      password: '',
      confirmPassword: '',
      role: 'depot_manager',
      permissions: ['manage_buses', 'view_routes', 'manage_schedules', 'view_reports']
    }
  });

  // Available roles for depot users
  const availableRoles = [
    { value: 'depot_manager', label: 'Depot Manager', description: 'Full depot management with bus and schedule control' },
    { value: 'depot_supervisor', label: 'Depot Supervisor', description: 'Supervise daily operations and staff management' },
    { value: 'depot_operator', label: 'Depot Operator', description: 'Basic depot operations and bus management' },
    { value: 'maintenance_manager', label: 'Maintenance Manager', description: 'Focus on bus maintenance and repairs' }
  ];

  // Available permissions
  const availablePermissions = [
    { value: 'manage_buses', label: 'Manage Buses', description: 'Add, edit, and remove buses from depot' },
    { value: 'view_routes', label: 'View Routes', description: 'Access to route information and schedules' },
    { value: 'manage_schedules', label: 'Manage Schedules', description: 'Create and modify bus schedules' },
    { value: 'view_reports', label: 'View Reports', description: 'Access to depot performance reports' },
    { value: 'manage_staff', label: 'Manage Staff', description: 'Add and manage depot staff members' },
    { value: 'manage_maintenance', label: 'Manage Maintenance', description: 'Schedule and track bus maintenance' },
    { value: 'financial_access', label: 'Financial Access', description: 'View financial reports and transactions' },
    { value: 'admin_access', label: 'Admin Access', description: 'Full administrative control over depot' }
  ];

  // Handle depot form input changes
  const handleDepotInputChange = (e) => {
    const { name, value } = e.target;
    
    if (name.includes('.')) {
      const parts = name.split('.');
      if (parts.length === 2) {
        const [section, field] = parts;
        if (section === 'userAccount' && field === 'permissions') {
          // Handle permissions as checkboxes
          return;
        }
        setDepotForm(prev => ({
          ...prev,
          [section]: {
            ...prev[section],
            [field]: value
          }
        }));
      } else if (parts.length === 3) {
        const [section, subsection, field] = parts;
        setDepotForm(prev => ({
          ...prev,
          [section]: {
            ...prev[section],
            [subsection]: {
              ...prev[section]?.[subsection],
              [field]: value
            }
          }
        }));
      }
    } else {
      setDepotForm(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  // Handle nested input changes (for location, contact, capacity)
  const handleNestedInputChange = (section, field, value) => {
    setDepotForm(prev => ({
      ...prev,
      [section]: {
        ...prev[section],
        [field]: value
      }
    }));
  };

  // Handle permission changes
  const handlePermissionChange = (permission, checked) => {
    setDepotForm(prev => ({
      ...prev,
      userAccount: {
        ...prev.userAccount,
        permissions: checked
          ? [...prev.userAccount.permissions, permission]
          : prev.userAccount.permissions.filter(p => p !== permission)
      }
    }));
  };

  // Handle facility changes
  const handleFacilityChange = (facility, checked) => {
    setDepotForm(prev => ({
      ...prev,
      facilities: checked
        ? [...prev.facilities, facility]
        : prev.facilities.filter(f => f !== facility)
    }));
  };

  // Auto-generate username and email
  const generateUserCredentials = () => {
    const depotCode = depotForm.depotCode.toLowerCase().replace(/[^a-z0-9]/g, '');
    const username = `${depotCode}_user`;
    const email = `${depotCode}@yatrik.com`;
    
    setDepotForm(prev => ({
      ...prev,
      userAccount: {
        ...prev.userAccount,
        username,
        email
      }
    }));
  };

  // Validate depot form
  const validateDepotForm = () => {
    const errors = [];
    
    // Debug logging
    console.log('Validating depot form:', depotForm);
    console.log('Depot Code:', depotForm.depotCode);
    console.log('Depot Name:', depotForm.depotName);
    console.log('City:', depotForm.location.city);
    console.log('State:', depotForm.location.state);
    console.log('Phone:', depotForm.contact.phone);
    console.log('Create User Account:', depotForm.createUserAccount);
    if (depotForm.createUserAccount) {
      console.log('Username:', depotForm.userAccount.username);
      console.log('Password:', depotForm.userAccount.password);
      console.log('Confirm Password:', depotForm.userAccount.confirmPassword);
    }
    
    if (!depotForm.depotCode) errors.push('Depot Code is required');
    if (!depotForm.depotName) errors.push('Depot Name is required');
    if (!depotForm.location.city) errors.push('City is required');
    if (!depotForm.location.state) errors.push('State is required');
    if (!depotForm.contact.phone) errors.push('Phone number is required');
    
    if (depotForm.createUserAccount) {
      if (!depotForm.userAccount.username) errors.push('Username is required');
      if (!depotForm.userAccount.password) errors.push('Password is required');
      if (depotForm.userAccount.password !== depotForm.userAccount.confirmPassword) {
        errors.push('Passwords do not match');
      }
      if (depotForm.userAccount.password.length < 6) {
        errors.push('Password must be at least 6 characters');
      }
    }
    
    console.log('Validation errors:', errors);
    return errors;
  };

  // Handle depot creation
  const handleCreateDepot = async (e) => {
    e.preventDefault();
    
    console.log('Form submitted, current form state:', depotForm);
    
    const errors = validateDepotForm();
    if (errors.length > 0) {
      console.log('Validation failed with errors:', errors);
      window.alert(`Please fix the following errors:\n${errors.join('\n')}`);
      return;
    }

    try {
      // Prepare depot data for backend
      const depotData = {
        depotCode: depotForm.depotCode,
        depotName: depotForm.depotName,
        location: {
          address: depotForm.location.address || 'Address not provided',
          city: depotForm.location.city,
          state: depotForm.location.state,
          pincode: depotForm.location.pincode || '000000'
        },
        contact: {
          phone: depotForm.contact.phone,
          email: depotForm.contact.email || `${depotForm.depotCode.toLowerCase()}@yatrik.com`,
          manager: depotForm.contact.manager
        },
        capacity: {
          totalBuses: parseInt(depotForm.capacity.totalBuses) || 0,
          availableBuses: parseInt(depotForm.capacity.availableBuses) || 0,
          maintenanceBuses: parseInt(depotForm.capacity.maintenanceBuses) || 0
        },
        operatingHours: depotForm.operatingHours,
        facilities: depotForm.facilities,
        status: depotForm.status,
        createUserAccount: depotForm.createUserAccount,
        userAccount: depotForm.createUserAccount ? {
          username: depotForm.userAccount.username,
          email: depotForm.userAccount.email || `${depotForm.depotCode.toLowerCase()}@yatrik.com`,
          password: depotForm.userAccount.password,
          role: depotForm.userAccount.role,
          permissions: depotForm.userAccount.permissions
        } : null
      };

      console.log('Sending depot data to backend:', depotData);

      // Make API call to backend
      const response = await fetch('/api/depot', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(depotData)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to create depot');
      }

      const result = await response.json();
      console.log('Backend response:', result);

      // Add the new depot to the local state
      if (result.success && result.data) {
        setDepots(prev => [...prev, result.data]);
      }

      // Reset form
      setDepotForm({
        depotCode: '',
        depotName: '',
        location: { address: '', city: '', state: '', pincode: '' },
        contact: { phone: '', email: '', manager: { name: '', phone: '', email: '' } },
        capacity: { totalBuses: '', availableBuses: '', maintenanceBuses: '' },
        operatingHours: { openTime: '06:00', closeTime: '22:00', workingDays: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'] },
        facilities: [],
        status: 'active',
        createUserAccount: true,
        userAccount: {
          username: '',
          password: '',
          confirmPassword: '',
          role: 'depot_manager',
          permissions: ['manage_buses', 'view_routes', 'manage_schedules', 'view_reports']
        }
      });

      // Close modal
      setShowCreateModal(false);

      // Show success message
      let successMessage = `Depot "${depotForm.depotName}" created successfully!`;
      
      if (depotForm.createUserAccount && result.depotUser) {
        successMessage += `\n\nUser account has been created with the following credentials:\n` +
          `Username: ${result.depotUser.username}\n` +
          `Password: [Password was set during creation]\n` +
          `Role: ${availableRoles.find(r => r.value === result.depotUser.role)?.label}\n\n` +
          'Please save these credentials securely!';
      }
      
      window.alert(successMessage);

    } catch (error) {
      console.error('Error creating depot:', error);
      let errorMessage = 'Error creating depot. ';
      
      if (error.message.includes('Missing required fields')) {
        errorMessage += 'Please fill in all required fields.';
      } else if (error.message.includes('validation failed')) {
        errorMessage += 'Please check your input data.';
      } else if (error.message.includes('duplicate key')) {
        errorMessage += 'A depot with this code already exists.';
      } else {
        errorMessage += error.message || 'Please try again.';
      }
      
      window.alert(errorMessage);
    }
  };

  // Real data for demonstration
  useEffect(() => {
    fetchDepots();
  }, []);

  const fetchDepots = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/depot', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      if (response.ok) {
        const result = await response.json();
        if (result.success && result.data) {
          setDepots(result.data);
        } else {
          setDepots([]);
        }
      } else {
        setDepots([]);
      }
    } catch (error) {
      console.error('Error fetching depots:', error);
      setDepots([]);
    } finally {
      setLoading(false);
    }
  };

  const filteredDepots = depots.filter(depot => {
    const matchesSearch = depot.depotName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         depot.depotCode.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesFilters = (!filters.city || depot.location.city.toLowerCase().includes(filters.city.toLowerCase())) &&
                          (!filters.state || depot.location.state.toLowerCase().includes(filters.state.toLowerCase())) &&
                          (!filters.status || depot.status === filters.status) &&
                          (!filters.hasCapacity || (filters.hasCapacity === 'true' ? depot.capacity.availableBuses > 0 : true));

    return matchesSearch && matchesFilters;
  });

  const getStatusColor = (status) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'inactive': return 'bg-gray-100 text-gray-800';
      case 'maintenance': return 'bg-yellow-100 text-yellow-800';
      case 'closed': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getFacilityIcon = (facility) => {
    switch (facility) {
      case 'Fuel_Station': return <Fuel className="w-4 h-4" />;
      case 'Maintenance_Bay': return <Wrench className="w-4 h-4" />;
      case 'Washing_Bay': return <Car className="w-4 h-4" />;
      case 'Parking_Lot': return <Building className="w-4 h-4" />;
      case 'Security_Office': return <Shield className="w-4 h-4" />;
      case 'Canteen': return <Coffee className="w-4 h-4" />;
      case 'Wifi': return <Wifi className="w-4 h-4" />;
      default: return <Building className="w-4 h-4" />;
    }
  };

  const getCapacityPercentage = (depot) => {
    if (depot.capacity.totalBuses === 0) return 0;
    return Math.round((depot.capacity.availableBuses / depot.capacity.totalBuses) * 100);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading depots...</p>
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
            <h1 className="text-3xl font-bold text-gray-900">Depot Management</h1>
            <p className="text-gray-600 mt-2">Manage bus depots, capacity, and facilities</p>
          </div>
          <div className="flex items-center space-x-4">
            <button
              onClick={() => setShowCreateModal(true)}
              className="bg-blue-600 text-white px-6 py-3 rounded-lg flex items-center hover:bg-blue-700 transition-colors"
            >
              <Plus className="w-5 h-5 mr-2" />
              Create Depot
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
              <Building className="w-8 h-8 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Total Depots</p>
              <p className="text-2xl font-bold text-gray-900">{depots.length}</p>
            </div>
          </div>
        </AnimatedCard>

        <AnimatedCard className="p-6" delay={1}>
          <div className="flex items-center">
            <div className="p-3 bg-green-100 rounded-lg mr-4">
              <Bus className="w-8 h-8 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Total Buses</p>
              <p className="text-2xl font-bold text-gray-900">
                {depots.reduce((sum, depot) => sum + depot.capacity.totalBuses, 0)}
              </p>
            </div>
          </div>
        </AnimatedCard>

        <AnimatedCard className="p-6" delay={2}>
          <div className="flex items-center">
            <div className="p-3 bg-purple-100 rounded-lg mr-4">
              <Users className="w-8 h-8 text-purple-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Available Buses</p>
              <p className="text-2xl font-bold text-gray-900">
                {depots.reduce((sum, depot) => sum + depot.capacity.availableBuses, 0)}
              </p>
            </div>
          </div>
        </AnimatedCard>

        <AnimatedCard className="p-6" delay={3}>
          <div className="flex items-center">
            <div className="p-3 bg-orange-100 rounded-lg mr-4">
              <Wrench className="w-8 h-8 text-orange-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Maintenance</p>
              <p className="text-2xl font-bold text-gray-900">
                {depots.reduce((sum, depot) => sum + depot.capacity.maintenanceBuses, 0)}
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
                placeholder="Search depots by name or code..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
          
          <div className="flex gap-4">
            <select
              value={filters.city}
              onChange={(e) => setFilters({ ...filters, city: e.target.value })}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Cities</option>
              <option value="Kochi">Kochi</option>
              <option value="Trivandrum">Trivandrum</option>
              <option value="Kozhikode">Kozhikode</option>
              <option value="Thrissur">Thrissur</option>
              <option value="Kannur">Kannur</option>
              <option value="Kottayam">Kottayam</option>
              <option value="Palakkad">Palakkad</option>
            </select>
            
            <select
              value={filters.state}
              onChange={(e) => setFilters({ ...filters, state: e.target.value })}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All States</option>
              <option value="Kerala">Kerala</option>
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
              <option value="closed">Closed</option>
            </select>
            
            <select
              value={filters.hasCapacity}
              onChange={(e) => setFilters({ ...filters, hasCapacity: e.target.value })}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Capacity</option>
              <option value="true">Has Available Buses</option>
              <option value="false">No Available Buses</option>
            </select>
          </div>
        </div>
      </GlassCard>

      {/* Depots Grid/List */}
      <div className="space-y-6">
        {viewMode === 'grid' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredDepots.map((depot, index) => (
              <AnimatedCard key={depot.id} delay={index} className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">{depot.depotName}</h3>
                    <p className="text-sm text-gray-500">{depot.depotCode}</p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(depot.status)}`}>
                      {depot.status}
                    </span>
                    <button className="p-1 hover:bg-gray-100 rounded">
                      <MoreVertical className="w-4 h-4 text-gray-500" />
                    </button>
                  </div>
                </div>

                <div className="space-y-3 mb-4">
                  <div className="flex items-center text-sm text-gray-600">
                    <MapPin className="w-4 h-4 mr-2" />
                    <span>{depot.location.city}, {depot.location.state}</span>
                  </div>
                  
                  <div className="flex items-center text-sm text-gray-600">
                    <Phone className="w-4 h-4 mr-2" />
                    <span>{depot.contact.phone}</span>
                  </div>
                  
                  <div className="flex items-center text-sm text-gray-600">
                    <Mail className="w-4 h-4 mr-2" />
                    <span>{depot.contact.email}</span>
                  </div>
                  
                  <div className="flex items-center text-sm text-gray-600">
                    <Users className="w-4 h-4 mr-2" />
                    <span>Manager: {depot.contact.manager.name}</span>
                  </div>
                </div>

                {/* Capacity Progress */}
                <div className="mb-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-gray-700">Bus Capacity</span>
                    <span className="text-sm text-gray-500">
                      {depot.capacity.availableBuses}/{depot.capacity.totalBuses}
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${getCapacityPercentage(depot)}%` }}
                    ></div>
                  </div>
                  <div className="flex justify-between text-xs text-gray-500 mt-1">
                    <span>Available: {depot.capacity.availableBuses}</span>
                    <span>Maintenance: {depot.capacity.maintenanceBuses}</span>
                  </div>
                </div>

                {/* Operating Hours */}
                <div className="mb-4 p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center text-sm text-gray-600 mb-2">
                    <Calendar className="w-4 h-4 mr-2" />
                    <span className="font-medium">Operating Hours</span>
                  </div>
                  <div className="text-xs text-gray-600">
                    {depot.operatingHours.openTime} - {depot.operatingHours.closeTime}
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    {depot.operatingHours.workingDays.length === 7 ? 'Daily' : `${depot.operatingHours.workingDays.length} days/week`}
                  </div>
                </div>

                {/* Facilities */}
                <div className="mb-4">
                  <div className="text-sm font-medium text-gray-700 mb-2">Facilities</div>
                  <div className="flex flex-wrap gap-1">
                    {depot.facilities.slice(0, 4).map((facility, idx) => (
                      <span key={idx} className="flex items-center px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded">
                        {getFacilityIcon(facility)}
                        <span className="ml-1">{facility.replace('_', ' ')}</span>
                      </span>
                    ))}
                    {depot.facilities.length > 4 && (
                      <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded">
                        +{depot.facilities.length - 4} more
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex space-x-2">
                  <button
                    onClick={() => {
                      setSelectedDepot(depot);
                      setShowEditModal(true);
                    }}
                    className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors text-sm"
                  >
                    <Edit className="w-4 h-4 mr-1 inline" />
                    Edit
                  </button>
                  <button className="flex-1 bg-gray-100 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-200 transition-colors text-sm">
                    <Eye className="w-4 h-4 mr-1 inline" />
                    View
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
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Depot</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Location</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Contact</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Capacity</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredDepots.map((depot) => (
                    <tr key={depot.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900">{depot.depotName}</div>
                          <div className="text-sm text-gray-500">{depot.depotCode}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {depot.location.city}, {depot.location.state}
                        </div>
                        <div className="text-sm text-gray-500">
                          {depot.location.address}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{depot.contact.phone}</div>
                        <div className="text-sm text-gray-500">{depot.contact.email}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {depot.capacity.availableBuses}/{depot.capacity.totalBuses} buses
                        </div>
                        <div className="text-sm text-gray-500">
                          {getCapacityPercentage(depot)}% available
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(depot.status)}`}>
                          {depot.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex space-x-2">
                          <button
                            onClick={() => {
                              setSelectedDepot(depot);
                              setShowEditModal(true);
                            }}
                            className="text-blue-600 hover:text-blue-900"
                          >
                            Edit
                          </button>
                          <button className="text-gray-600 hover:text-gray-900">View</button>
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

      {/* Create Depot Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-6xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-900">Create New Depot</h2>
              <button
                onClick={() => setShowCreateModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <form onSubmit={handleCreateDepot} className="space-y-8" noValidate>
              {/* Basic Depot Information */}
              <div className="bg-gray-50 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Basic Depot Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Depot Code *</label>
                    <input
                      type="text"
                      name="depotCode"
                      value={depotForm.depotCode}
                      onChange={handleDepotInputChange}
                      placeholder="e.g., KCD001"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Depot Name *</label>
                    <input
                      type="text"
                      name="depotName"
                      value={depotForm.depotName}
                      onChange={handleDepotInputChange}
                      placeholder="e.g., Kochi Central Depot"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    />
                  </div>
                </div>
              </div>

              {/* Location Information */}
              <div className="bg-gray-50 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Location Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Address</label>
                    <input
                      type="text"
                      name="location.address"
                      value={depotForm.location.address}
                      onChange={handleDepotInputChange}
                      placeholder="e.g., MG Road, Ernakulam"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">City *</label>
                    <input
                      type="text"
                      name="location.city"
                      value={depotForm.location.city}
                      onChange={handleDepotInputChange}
                      placeholder="e.g., Kochi"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">State *</label>
                    <input
                      type="text"
                      name="location.state"
                      value={depotForm.location.state}
                      onChange={handleDepotInputChange}
                      placeholder="e.g., Kerala"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Pincode</label>
                    <input
                      type="text"
                      name="location.pincode"
                      value={depotForm.location.pincode}
                      onChange={handleDepotInputChange}
                      placeholder="e.g., 682001"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
              </div>

              {/* Contact Information */}
              <div className="bg-gray-50 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Contact Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Phone Number *</label>
                    <input
                      type="tel"
                      name="contact.phone"
                      value={depotForm.contact.phone}
                      onChange={handleDepotInputChange}
                      placeholder="e.g., +91-484-1234567"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
                    <input
                      type="email"
                      name="contact.email"
                      value={depotForm.contact.email}
                      onChange={handleDepotInputChange}
                      placeholder="e.g., depot@yatrik.com"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Manager Name</label>
                    <input
                      type="text"
                      name="contact.manager.name"
                      value={depotForm.contact.manager.name}
                      onChange={handleDepotInputChange}
                      placeholder="e.g., Rajesh Kumar"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Manager Phone</label>
                    <input
                      type="tel"
                      name="contact.manager.phone"
                      value={depotForm.contact.manager.phone}
                      onChange={handleDepotInputChange}
                      placeholder="e.g., +91-9876543210"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
              </div>

              {/* Capacity Information */}
              <div className="bg-gray-50 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Bus Capacity</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Total Buses</label>
                    <input
                      type="number"
                      name="capacity.totalBuses"
                      value={depotForm.capacity.totalBuses}
                      onChange={handleDepotInputChange}
                      placeholder="e.g., 50"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Available Buses</label>
                    <input
                      type="number"
                      name="capacity.availableBuses"
                      value={depotForm.capacity.availableBuses}
                      onChange={handleDepotInputChange}
                      placeholder="e.g., 40"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Maintenance Buses</label>
                    <input
                      type="number"
                      name="capacity.maintenanceBuses"
                      value={depotForm.capacity.maintenanceBuses}
                      onChange={handleDepotInputChange}
                      placeholder="e.g., 5"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
              </div>

              {/* Operating Hours */}
              <div className="bg-gray-50 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Operating Hours</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Opening Time</label>
                    <input
                      type="time"
                      name="operatingHours.openTime"
                      value={depotForm.operatingHours.openTime}
                      onChange={handleDepotInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Closing Time</label>
                    <input
                      type="time"
                      name="operatingHours.closeTime"
                      value={depotForm.operatingHours.closeTime}
                      onChange={handleDepotInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
              </div>

              {/* Facilities */}
              <div className="bg-gray-50 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Available Facilities</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {['Fuel_Station', 'Maintenance_Bay', 'Washing_Bay', 'Parking_Lot', 'Driver_Rest_Room', 'Canteen', 'Security_Office', 'Admin_Office', 'Training_Room', 'WiFi'].map(facility => (
                    <label key={facility} className="flex items-center">
                      <input
                        type="checkbox"
                        checked={depotForm.facilities.includes(facility)}
                        onChange={(e) => handleFacilityChange(facility, e.target.checked)}
                        className="mr-2 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <span className="text-sm text-gray-700">{facility.replace('_', ' ')}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* User Account Creation */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-blue-900">Create User Account for Depot</h3>
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={depotForm.createUserAccount}
                      onChange={(e) => setDepotForm(prev => ({ ...prev, createUserAccount: e.target.checked }))}
                      className="mr-2 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-sm font-medium text-blue-800">Enable User Account Creation</span>
                  </label>
                </div>

                {depotForm.createUserAccount && (
                  <div className="space-y-6">
                    {/* Role Selection */}
                    <div>
                      <label className="block text-sm font-medium text-blue-700 mb-3">User Role *</label>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {availableRoles.map(role => (
                          <label key={role.value} className="flex items-start p-3 border border-blue-200 rounded-lg hover:bg-blue-50 cursor-pointer">
                            <input
                              type="radio"
                              name="userAccount.role"
                              value={role.value}
                              checked={depotForm.userAccount.role === role.value}
                              onChange={handleDepotInputChange}
                              className="mr-3 mt-1 text-blue-600 focus:ring-blue-500"
                            />
                            <div>
                              <div className="font-medium text-blue-900">{role.label}</div>
                              <div className="text-sm text-blue-700">{role.description}</div>
                            </div>
                          </label>
                        ))}
                      </div>
                    </div>

                    {/* Permissions */}
                    <div>
                      <label className="block text-sm font-medium text-blue-700 mb-3">User Permissions</label>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {availablePermissions.map(permission => (
                          <label key={permission.value} className="flex items-start p-3 border border-blue-200 rounded-lg hover:bg-blue-50 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={depotForm.userAccount.permissions.includes(permission.value)}
                              onChange={(e) => handlePermissionChange(permission.value, e.target.checked)}
                              className="mr-3 mt-1 text-blue-600 focus:ring-blue-500"
                            />
                            <div>
                              <div className="font-medium text-blue-900">{permission.label}</div>
                              <div className="text-sm text-blue-700">{permission.description}</div>
                            </div>
                          </label>
                        ))}
                      </div>
                    </div>

                    {/* User Credentials */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-sm font-medium text-blue-700 mb-2">Username *</label>
                        <div className="flex space-x-2">
                          <input
                            type="text"
                            name="userAccount.username"
                            value={depotForm.userAccount.username}
                            onChange={handleDepotInputChange}
                            placeholder="e.g., kcd001_user"
                            className="flex-1 px-3 py-2 border border-blue-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            required
                          />
                          <button
                            type="button"
                            onClick={generateUserCredentials}
                            className="px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm"
                          >
                            Auto
                          </button>
                        </div>
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-blue-700 mb-2">Email</label>
                        <input
                          type="email"
                          name="userAccount.email"
                          value={depotForm.userAccount.email}
                          onChange={handleDepotInputChange}
                          placeholder="e.g., kcd001@yatrik.com"
                          className="w-full px-3 py-2 border border-blue-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-blue-700 mb-2">Password *</label>
                        <input
                          type="password"
                          name="userAccount.password"
                          value={depotForm.userAccount.password}
                          onChange={handleDepotInputChange}
                          placeholder="Minimum 6 characters"
                          className="w-full px-3 py-2 border border-blue-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                          required
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-blue-700 mb-2">Confirm Password *</label>
                        <input
                          type="password"
                          name="userAccount.confirmPassword"
                          value={depotForm.userAccount.confirmPassword}
                          onChange={handleDepotInputChange}
                          placeholder="Confirm your password"
                          className="w-full px-3 py-2 border border-blue-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                          required
                        />
                      </div>
                    </div>

                    {/* Security Notice */}
                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                      <div className="flex items-start">
                        <svg className="w-5 h-5 text-yellow-600 mr-2 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.34 16.5c-.77.833.192 2.5 1.732 2.5z" />
                        </svg>
                        <div className="text-sm text-yellow-800">
                          <strong>Security Notice:</strong> User credentials will be displayed only once after creation. 
                          Please ensure the depot manager saves these credentials securely. The password cannot be recovered later.
                        </div>
                      </div>
                    </div>
                  </div>
                )}
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
                  className="px-8 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
                >
                  Create Depot & User Account
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Depot Modal */}
      {showEditModal && selectedDepot && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <h2 className="text-2xl font-bold mb-4">Edit Depot - {selectedDepot.depotName}</h2>
            {/* Depot editing form would go here */}
            <div className="flex justify-end space-x-4 mt-6">
              <button
                onClick={() => setShowEditModal(false)}
                className="px-4 py-2 text-gray-600 hover:text-gray-800"
              >
                Cancel
              </button>
              <button className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DepotManagement;
