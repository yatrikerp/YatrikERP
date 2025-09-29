import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import axios from 'axios';
import toast from 'react-hot-toast';

const ComprehensiveDepotManagement = () => {
  const { user } = useAuth();
  const [depots, setDepots] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingDepot, setEditingDepot] = useState(null);
  const [newDepot, setNewDepot] = useState({
    depotCode: '',
    depotName: '',
    abbreviation: '',
    stdCode: '',
    officePhone: '',
    stationMasterPhone: '',
    category: 'main', // main, sub, operating
    location: {
      address: '',
      city: '',
      state: 'Kerala',
      pincode: ''
    },
    contact: {
      manager: {
        name: ''
      },
      phone: '',
      email: ''
    },
    capacity: {
      totalBuses: 50,
      availableBuses: 40,
      maintenanceBuses: 0
    },
    operatingHours: {
      openTime: '06:00',
      closeTime: '22:00',
      workingDays: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday']
    },
    facilities: ['Fuel_Station', 'Maintenance_Bay', 'Parking_Lot', 'Admin_Office'],
    status: 'active',
    isActive: true,
    autoCreateUser: true
  });

  const categories = {
    all: 'All Depots',
    main: 'Main Depots',
    sub: 'Sub Depots', 
    operating: 'Operating Centres'
  };

  useEffect(() => {
    fetchDepots();
  }, []);

  const fetchDepots = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/api/admin/depots', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (Array.isArray(response.data)) {
        setDepots(response.data);
      } else if (response.data.success && response.data.data) {
        setDepots(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching depots:', error);
      toast.error('Failed to fetch depots');
    } finally {
      setLoading(false);
    }
  };

  const generateDepotEmail = (depotCode) => {
    return `${depotCode.toLowerCase()}-depot@yatrik.com`;
  };

  const generateDepotCredentials = (depotCode, depotName) => {
    const username = `${depotCode.toLowerCase()}_manager`;
    const email = generateDepotEmail(depotCode);
    const password = `${depotCode.toLowerCase()}@123`;
    
    return { username, email, password };
  };

  const createDepot = async () => {
    try {
      const depotData = {
        ...newDepot,
        contact: {
          ...newDepot.contact,
          email: generateDepotEmail(newDepot.depotCode)
        }
      };

      const response = await axios.post('/api/admin/depots', depotData, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.data.success) {
        toast.success('Depot created successfully');
        setShowCreateModal(false);
        resetForm();
        fetchDepots();
        
        // Auto-create depot user if requested
        if (newDepot.autoCreateUser) {
          await createDepotUser(newDepot.depotCode, newDepot.depotName);
        }
      }
    } catch (error) {
      console.error('Error creating depot:', error);
      toast.error('Failed to create depot');
    }
  };

  const createDepotUser = async (depotCode, depotName) => {
    try {
      const credentials = generateDepotCredentials(depotCode, depotName);
      
      const userData = {
        username: credentials.username,
        email: credentials.email,
        password: credentials.password,
        depotId: null, // Will be set after depot creation
        depotCode: depotCode,
        depotName: depotName,
        role: 'depot_manager',
        permissions: [
          'manage_buses',
          'view_buses',
          'manage_routes',
          'view_routes',
          'manage_schedules',
          'view_schedules',
          'manage_staff',
          'view_staff',
          'view_reports',
          'view_depot_info'
        ]
      };

      const response = await axios.post('/api/admin/depot-users', userData, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.data.success) {
        toast.success(`Depot user created: ${credentials.email}`);
        console.log('Depot user credentials:', credentials);
      }
    } catch (error) {
      console.error('Error creating depot user:', error);
      toast.error('Failed to create depot user');
    }
  };

  const resetForm = () => {
    setNewDepot({
      depotCode: '',
      depotName: '',
      abbreviation: '',
      stdCode: '',
      officePhone: '',
      stationMasterPhone: '',
      category: 'main',
      location: {
        address: '',
        city: '',
        state: 'Kerala',
        pincode: ''
      },
      contact: {
        manager: {
          name: ''
        },
        phone: '',
        email: ''
      },
      capacity: {
        totalBuses: 50,
        availableBuses: 40,
        maintenanceBuses: 0
      },
      operatingHours: {
        openTime: '06:00',
        closeTime: '22:00',
        workingDays: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday']
      },
      facilities: ['Fuel_Station', 'Maintenance_Bay', 'Parking_Lot', 'Admin_Office'],
      status: 'active',
      isActive: true,
      autoCreateUser: true
    });
  };

  const filteredDepots = depots.filter(depot => {
    const depotCategory = depot.category || 'main'; // Default to 'main' if category is missing
    const matchesCategory = selectedCategory === 'all' || depotCategory === selectedCategory;
    const matchesSearch = 
      depot.depotCode?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      depot.depotName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      depot.abbreviation?.toLowerCase().includes(searchTerm.toLowerCase());
    
    return matchesCategory && matchesSearch;
  });

  const getCategoryCount = (category) => {
    if (category === 'all') return depots.length;
    return depots.filter(depot => (depot.category || 'main') === category).length;
  };

  // Force update statistics when depots change
  useEffect(() => {
    if (depots.length > 0) {
      console.log('Depot categories:', {
        main: depots.filter(d => d.category === 'main').length,
        sub: depots.filter(d => d.category === 'sub').length,
        operating: depots.filter(d => d.category === 'operating').length,
        total: depots.length
      });
    }
  }, [depots]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Depot Management</h1>
          <p className="text-gray-600">Comprehensive depot management with automatic credential generation</p>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 rounded-lg">
                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Depots</p>
                <p className="text-2xl font-semibold text-gray-900">{depots.length}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 rounded-lg">
                <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Main Depots</p>
                <p className="text-2xl font-semibold text-gray-900">{getCategoryCount('main')}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-2 bg-yellow-100 rounded-lg">
                <svg className="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Sub Depots</p>
                <p className="text-2xl font-semibold text-gray-900">{getCategoryCount('sub')}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-2 bg-purple-100 rounded-lg">
                <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Operating Centres</p>
                <p className="text-2xl font-semibold text-gray-900">{getCategoryCount('operating')}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Filters and Actions */}
        <div className="bg-white rounded-lg shadow mb-6 p-6">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div className="flex flex-col sm:flex-row gap-4">
              {/* Category Filter */}
              <div className="flex space-x-2">
                {Object.entries(categories).map(([key, label]) => (
                  <button
                    key={key}
                    onClick={() => setSelectedCategory(key)}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                      selectedCategory === key
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {label} ({getCategoryCount(key)})
                  </button>
                ))}
              </div>

              {/* Search */}
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search depots..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <svg className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
            </div>

            {/* Create Button */}
            <button
              onClick={() => setShowCreateModal(true)}
              className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              <span>Create Depot</span>
            </button>
          </div>
        </div>

        {/* Depot Table */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Code</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Abbr</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">STD Code</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Office No.</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Station Master No.</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Category</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredDepots.map((depot) => (
                  <tr key={depot._id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {depot.depotCode}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {depot.abbreviation || depot.depotCode}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {depot.depotName}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {depot.stdCode || 'N/A'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {depot.contact?.phone || depot.officePhone || 'N/A'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {depot.stationMasterPhone || 'N/A'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        depot.category === 'main' ? 'bg-green-100 text-green-800' :
                        depot.category === 'sub' ? 'bg-yellow-100 text-yellow-800' :
                        depot.category === 'operating' ? 'bg-purple-100 text-purple-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {depot.category || 'main'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        depot.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                      }`}>
                        {depot.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex space-x-2">
                        <button
                          onClick={() => setEditingDepot(depot)}
                          className="text-blue-600 hover:text-blue-900"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => {
                            const credentials = generateDepotCredentials(depot.depotCode, depot.depotName);
                            navigator.clipboard.writeText(`${credentials.email} / ${credentials.password}`);
                            toast.success('Credentials copied to clipboard');
                          }}
                          className="text-green-600 hover:text-green-900"
                        >
                          Copy Credentials
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Create Depot Modal */}
        {showCreateModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
              <h2 className="text-xl font-bold mb-4">Create New Depot</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Depot Code</label>
                  <input
                    type="text"
                    value={newDepot.depotCode}
                    onChange={(e) => setNewDepot({...newDepot, depotCode: e.target.value.toUpperCase()})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="e.g., TVM"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Abbreviation</label>
                  <input
                    type="text"
                    value={newDepot.abbreviation}
                    onChange={(e) => setNewDepot({...newDepot, abbreviation: e.target.value.toUpperCase()})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="e.g., TVM"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Depot Name</label>
                  <input
                    type="text"
                    value={newDepot.depotName}
                    onChange={(e) => setNewDepot({...newDepot, depotName: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="e.g., TVM CENTRAL"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">STD Code</label>
                  <input
                    type="text"
                    value={newDepot.stdCode}
                    onChange={(e) => setNewDepot({...newDepot, stdCode: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="e.g., 0471"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Office Phone</label>
                  <input
                    type="text"
                    value={newDepot.officePhone}
                    onChange={(e) => setNewDepot({...newDepot, officePhone: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="e.g., 2323979"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Station Master Phone</label>
                  <input
                    type="text"
                    value={newDepot.stationMasterPhone}
                    onChange={(e) => setNewDepot({...newDepot, stationMasterPhone: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="e.g., 2325332"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                  <select
                    value={newDepot.category}
                    onChange={(e) => setNewDepot({...newDepot, category: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="main">Main Depot</option>
                    <option value="sub">Sub Depot</option>
                    <option value="operating">Operating Centre</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">City</label>
                  <input
                    type="text"
                    value={newDepot.location.city}
                    onChange={(e) => setNewDepot({...newDepot, location: {...newDepot.location, city: e.target.value}})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="e.g., THIRUVANANTHAPURAM"
                  />
                </div>
              </div>
              
              <div className="mb-4">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={newDepot.autoCreateUser}
                    onChange={(e) => setNewDepot({...newDepot, autoCreateUser: e.target.checked})}
                    className="mr-2"
                  />
                  <span className="text-sm font-medium text-gray-700">Auto-create depot user credentials</span>
                </label>
                {newDepot.autoCreateUser && newDepot.depotCode && (
                  <p className="text-xs text-gray-500 mt-1">
                    Email: {generateDepotEmail(newDepot.depotCode)} | Password: {newDepot.depotCode.toLowerCase()}@123
                  </p>
                )}
              </div>
              
              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={createDepot}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Create Depot
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ComprehensiveDepotManagement;
