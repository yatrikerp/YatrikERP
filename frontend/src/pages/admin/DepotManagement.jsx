import React, { useState, useEffect } from 'react';
import { 
  Building, MapPin, Phone, Bus, Users, Plus, Search, 
  Filter, Grid, List, Edit, Trash2, Eye, Car, 
  Wrench, Shield, Coffee, Wifi, Fuel, Calendar,
  Download, Upload, Settings, EyeOff, RefreshCw,
  ChevronDown, ChevronUp, Star, Clock, CheckCircle,
  AlertCircle, XCircle, MoreVertical, Copy, Mail,
  Key, UserPlus, Building2, Store, Navigation
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';
import { 
  depotData, 
  generateDepotEmail, 
  generateDepotPassword, 
  getDepotTypeLabel, 
  getDepotTypeColor, 
  getDepotTypeIcon 
} from '../../data/depotData';

const DepotManagement = () => {
  const [depots, setDepots] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [formErrors, setFormErrors] = useState({});
  const navigate = useNavigate();

  // UI State
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedType, setSelectedType] = useState('all');
  const [showInactive, setShowInactive] = useState(false);
  const [expandedDepots, setExpandedDepots] = useState(new Set());
  const [viewMode, setViewMode] = useState('cards'); // cards or list

  // Form State
  const [useAutoEmail, setUseAutoEmail] = useState(true);
  const [createLogin, setCreateLogin] = useState(true);
  const [loginPassword, setLoginPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // Facilities options as per backend enum
  const facilitiesOptions = [
    'Fuel_Station',
    'Maintenance_Bay',
    'Washing_Bay',
    'Parking_Lot',
    'Driver_Rest_Room',
    'Canteen',
    'Security_Office',
    'Admin_Office',
    'Training_Room',
    'Spare_Parts_Store'
  ];

  // Clean depot form state
  const [depotForm, setDepotForm] = useState({
    depotCode: '',
    depotName: '',
    depotType: 'main',
    location: {
      address: '',
      city: '',
      state: 'Kerala',
      pincode: ''
    },
    contact: {
      phone: '',
      email: '',
      managerName: '',
      stdCode: ''
    },
    capacity: {
      totalBuses: ''
    },
    facilities: [],
    status: 'active'
  });

  // Now safe to derive email from depotForm
  const derivedEmail = depotForm.depotCode ? generateDepotEmail(depotForm.depotCode, depotForm.depotType) : '';
  const derivedUsername = depotForm.depotCode ? `${depotForm.depotCode.trim().toLowerCase()}-${depotForm.depotType}` : '';
  const derivedPassword = depotForm.depotCode ? generateDepotPassword(depotForm.depotCode) : '';

  // Fetch depots from database
  useEffect(() => {
    fetchDepots();
  }, []);

  const fetchDepots = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/admin/depots', {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      if (res.ok) {
        const data = await res.json();
        const depotsData = data.depots || data.data || [];
        
        // Transform depot data to include type and credentials
        const transformedDepots = depotsData.map(depot => {
          // Determine depot type based on depot code or name
          let depotType = 'main';
          if (depot.depotCode && depot.depotCode.length <= 3) {
            depotType = 'main';
          } else if (depot.depotName && depot.depotName.includes('SUB')) {
            depotType = 'sub';
          } else if (depot.depotName && depot.depotName.includes('OPERATING')) {
            depotType = 'operating';
          }

          return {
            ...depot,
            id: depot._id,
            type: depotType,
            abbr: depot.depotCode,
            name: depot.depotName,
            email: generateDepotEmail(depot.depotCode, depotType),
            password: generateDepotPassword(depot.depotCode),
            stdCode: depot.contact?.phone?.substring(0, 4) || '0000',
            phoneNo: depot.contact?.phone?.substring(4) || '0000000',
            staff: Math.floor(Math.random() * 20) + 5, // Random staff count for demo
            createdAt: depot.createdAt || new Date().toISOString()
          };
        });
        
        setDepots(transformedDepots);
      } else {
        console.error('Failed to fetch depots:', res.statusText);
        setDepots([]);
      }
    } catch (err) {
      console.error('Error fetching depots:', err);
      setDepots([]);
    } finally {
      setLoading(false);
    }
  };

  // Handle simple input changes
  const handleSimpleInputChange = (field, value) => {
    setDepotForm(prev => ({ ...prev, [field]: value }));
  };

  // Handle nested input changes
  const handleNestedInputChange = (section, field, value) => {
    setDepotForm(prev => ({
      ...prev,
      [section]: { ...prev[section], [field]: value }
    }));
  };

  // Enhanced validation with field-level error messages
  const validateDepotForm = () => {
    const errors = {};
    
    if (!depotForm.depotCode || !depotForm.depotCode.trim()) {
      errors.depotCode = 'Depot Code is required';
    } else if (!/^[A-Z0-9]{2,10}$/.test(depotForm.depotCode.trim().toUpperCase())) {
      errors.depotCode = 'Depot Code must be 2-10 letters/numbers (uppercase)';
    }
    if (!depotForm.depotName || !depotForm.depotName.trim()) {
      errors.depotName = 'Depot Name is required';
    }
    if (!depotForm.contact.stdCode || !depotForm.contact.stdCode.trim()) {
      errors['contact.stdCode'] = 'STD Code is required';
    }
    if (!depotForm.contact.phone || !/^[0-9]{7,10}$/.test(depotForm.contact.phone.trim())) {
      errors['contact.phone'] = 'Phone must be 7-10 digits';
    }
    if (!useAutoEmail && depotForm.contact.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(depotForm.contact.email.trim())) {
      errors['contact.email'] = 'Invalid email address';
    }
    if (createLogin && (!loginPassword || loginPassword.length < 8)) {
      errors['account.password'] = 'Password must be at least 8 characters';
    }
    if (!depotForm.capacity.totalBuses || Number(depotForm.capacity.totalBuses) <= 0) {
      errors['capacity.totalBuses'] = 'Total Buses must be greater than 0';
    }
    return errors;
  };

  // Simple password strength calculator (0..5)
  const getPasswordStrength = (pwd) => {
    let score = 0;
    if (!pwd) return 0;
    if (pwd.length >= 8) score++;       // min length
    if (pwd.length >= 12) score++;      // longer length bonus
    if (/[A-Z]/.test(pwd)) score++;
    if (/[a-z]/.test(pwd)) score++;
    if (/[0-9]/.test(pwd)) score++;
    if (/[^A-Za-z0-9]/.test(pwd)) score++;
    return Math.min(score, 5);
  };

  const strength = getPasswordStrength(loginPassword);
  const strengthLabel = strength <= 2 ? 'Weak' : strength <= 4 ? 'Medium' : 'Strong';
  const strengthColor = strength <= 2 ? 'bg-red-500' : strength <= 4 ? 'bg-amber-500' : 'bg-emerald-600';
  const strengthTextColor = strength <= 2 ? 'text-red-600' : strength <= 4 ? 'text-amber-600' : 'text-emerald-600';

  // Submit
  const handleCreateDepot = async (e) => {
    e.preventDefault();
    const errors = validateDepotForm();
    setFormErrors(errors);
    if (Object.keys(errors).length > 0) return;

    try {
      setSubmitLoading(true);

      const newDepot = {
        id: `${depotForm.depotType}-${depotForm.depotCode}`,
        code: depotForm.depotCode.trim().toUpperCase(),
        abbr: depotForm.depotCode.trim().toUpperCase(),
        name: depotForm.depotName.trim(),
        type: depotForm.depotType,
        stdCode: depotForm.contact.stdCode.trim(),
        phoneNo: depotForm.contact.phone.trim(),
        stationMasterNo: depotForm.contact.phone.trim(),
        email: useAutoEmail ? derivedEmail : (depotForm.contact.email?.trim().toLowerCase() || derivedEmail),
        password: loginPassword || derivedPassword,
        capacity: {
          totalBuses: parseInt(depotForm.capacity.totalBuses, 10),
          availableBuses: parseInt(depotForm.capacity.totalBuses, 10),
          maintenanceBuses: 0
        },
        facilities: depotForm.facilities,
        status: (depotForm.status || 'active').toLowerCase(),
        staff: 0,
        createdAt: new Date().toISOString()
      };

      // Add to local state (in real app, this would be an API call)
      setDepots(prev => [...prev, newDepot]);
      toast.success('Depot created successfully');
      setShowCreateModal(false);
      
      // Reset form
      setDepotForm({
        depotCode: '',
        depotName: '',
        depotType: 'main',
        location: { address: '', city: '', state: 'Kerala', pincode: '' },
        contact: { phone: '', email: '', managerName: '', stdCode: '' },
        capacity: { totalBuses: '' },
        facilities: [],
        status: 'active'
      });
      setLoginPassword('');
      setFormErrors({});

    } catch (err) {
      console.error('❌ Error:', err);
      toast.error(err.message || 'Failed to create depot');
    } finally {
      setSubmitLoading(false);
    }
  };

  // Filter depots based on search and filters
  const filteredDepots = depots.filter(depot => {
    const matchesSearch = depot.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         depot.abbr.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         depot.code.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = selectedType === 'all' || depot.type === selectedType;
    const matchesStatus = showInactive || depot.status === 'active';
    return matchesSearch && matchesType && matchesStatus;
  });

  // Toggle depot expansion
  const toggleDepotExpansion = (depotId) => {
    setExpandedDepots(prev => {
      const newSet = new Set(prev);
      if (newSet.has(depotId)) {
        newSet.delete(depotId);
      } else {
        newSet.add(depotId);
      }
      return newSet;
    });
  };

  // Copy credentials to clipboard
  const copyCredentials = (depot) => {
    const credentials = `Email: ${depot.email}\nPassword: ${depot.password}`;
    navigator.clipboard.writeText(credentials);
    toast.success('Credentials copied to clipboard');
  };

  // Utility to render errors
  const renderError = (field) =>
    formErrors[field] && <p className="text-xs text-red-600 mt-1">{formErrors[field]}</p>;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header Section */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Depot Management</h1>
            <p className="text-sm text-gray-600 mt-1">Manage bus depots and provision depot manager login</p>
          </div>
          <div className="flex items-center space-x-3">
            <button 
              onClick={() => fetchDepots()}
              className="px-4 py-2 text-gray-600 hover:text-gray-800 border border-gray-300 rounded-lg flex items-center gap-2 hover:bg-gray-50"
            >
              <RefreshCw className="w-4 h-4" />
              Refresh
            </button>
            <button className="px-4 py-2 text-gray-600 hover:text-gray-800 border border-gray-300 rounded-lg flex items-center gap-2 hover:bg-gray-50">
              <Download className="w-4 h-4" />
              Export
            </button>
            <button 
              onClick={() => setShowCreateModal(true)}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg flex items-center gap-2 hover:bg-blue-700"
            >
              <Plus className="w-4 h-4" />
              Add Depot
            </button>
          </div>
        </div>
      </div>

      {/* Search and Filter Section */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex flex-col lg:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Search depots by name, code, or address..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>
          <div className="flex gap-3">
            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">All Types</option>
              <option value="main">Main Depots</option>
              <option value="sub">Sub Depots</option>
              <option value="operating">Operating Centers</option>
            </select>
            <button
              onClick={() => setShowInactive(!showInactive)}
              className={`px-3 py-2 border rounded-lg flex items-center gap-2 ${
                showInactive 
                  ? 'bg-blue-100 text-blue-700 border-blue-300' 
                  : 'text-gray-600 border-gray-300 hover:bg-gray-50'
              }`}
            >
              <Eye className="w-4 h-4" />
              Show Inactive
            </button>
            <div className="flex border border-gray-300 rounded-lg overflow-hidden">
              <button
                onClick={() => setViewMode('cards')}
                className={`px-3 py-2 ${viewMode === 'cards' ? 'bg-blue-600 text-white' : 'text-gray-600 hover:bg-gray-50'}`}
              >
                <Grid className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`px-3 py-2 ${viewMode === 'list' ? 'bg-blue-600 text-white' : 'text-gray-600 hover:bg-gray-50'}`}
              >
                <List className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Depot Statistics */}
      <div className="px-6 py-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-lg p-4 border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Depots</p>
                <p className="text-2xl font-bold text-gray-900">{depots.length}</p>
              </div>
              <Building className="w-8 h-8 text-blue-600" />
            </div>
          </div>
          <div className="bg-white rounded-lg p-4 border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Main Depots</p>
                <p className="text-2xl font-bold text-pink-600">{depots.filter(d => d.type === 'main').length}</p>
              </div>
              <Building2 className="w-8 h-8 text-pink-600" />
            </div>
          </div>
          <div className="bg-white rounded-lg p-4 border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Sub Depots</p>
                <p className="text-2xl font-bold text-cyan-600">{depots.filter(d => d.type === 'sub').length}</p>
              </div>
              <Store className="w-8 h-8 text-cyan-600" />
            </div>
          </div>
          <div className="bg-white rounded-lg p-4 border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Operating Centers</p>
                <p className="text-2xl font-bold text-blue-600">{depots.filter(d => d.type === 'operating').length}</p>
              </div>
              <Navigation className="w-8 h-8 text-blue-600" />
            </div>
          </div>
        </div>

        {/* Depot Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredDepots.map((depot) => (
            <div key={depot.id} className="bg-white rounded-xl border border-gray-200 hover:shadow-lg transition-shadow duration-200">
              {/* Depot Header */}
              <div className="p-4 border-b border-gray-100">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div 
                      className="w-10 h-10 rounded-lg flex items-center justify-center text-white text-lg"
                      style={{ backgroundColor: getDepotTypeColor(depot.type) }}
                    >
                      {getDepotTypeIcon(depot.type)}
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900">{depot.name}</h3>
                      <p className="text-sm text-gray-600">Code: {depot.abbr}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`px-2 py-1 text-xs rounded-full ${
                      depot.status === 'active' 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {depot.status}
                    </span>
                    <button
                      onClick={() => toggleDepotExpansion(depot.id)}
                      className="p-1 hover:bg-gray-100 rounded"
                    >
                      {expandedDepots.has(depot.id) ? 
                        <ChevronUp className="w-4 h-4 text-gray-500" /> : 
                        <ChevronDown className="w-4 h-4 text-gray-500" />
                      }
                    </button>
                  </div>
                </div>
              </div>

              {/* Depot Details */}
              <div className="p-4 space-y-3">
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Phone className="w-4 h-4" />
                  <span>{depot.stdCode}-{depot.phoneNo}</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Building className="w-4 h-4" />
                  <span>Capacity: {depot.capacity.totalBuses} buses</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Users className="w-4 h-4" />
                  <span>Staff: {depot.staff}</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Mail className="w-4 h-4" />
                  <span className="truncate">{depot.email}</span>
                </div>
              </div>

              {/* Expanded Details */}
              {expandedDepots.has(depot.id) && (
                <div className="px-4 pb-4 border-t border-gray-100">
                  <div className="pt-3 space-y-3">
                    <div>
                      <h4 className="text-sm font-medium text-gray-900 mb-2">Facilities</h4>
                      <div className="flex flex-wrap gap-1">
                        {depot.facilities.map((facility, index) => (
                          <span key={index} className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded">
                            {facility.replace('_', ' ')}
                          </span>
                        ))}
                      </div>
                    </div>
                    <div>
                      <h4 className="text-sm font-medium text-gray-900 mb-2">Manager Credentials</h4>
                      <div className="bg-gray-50 rounded-lg p-3 space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-gray-600">Email:</span>
                          <span className="text-sm font-mono">{depot.email}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-gray-600">Password:</span>
                          <span className="text-sm font-mono">{depot.password}</span>
                        </div>
                        <button
                          onClick={() => copyCredentials(depot)}
                          className="w-full mt-2 px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 flex items-center justify-center gap-2"
                        >
                          <Copy className="w-3 h-3" />
                          Copy Credentials
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="px-4 pb-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <button className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded">
                      <Edit className="w-4 h-4" />
                    </button>
                    <button className="p-2 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded">
                      <Eye className="w-4 h-4" />
                    </button>
                    <button className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                  <button className="px-3 py-1 text-sm text-gray-600 hover:text-gray-800 border border-gray-300 rounded hover:bg-gray-50">
                    <MoreVertical className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {filteredDepots.length === 0 && (
          <div className="text-center py-12">
            <Building className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No depots found</h3>
            <p className="text-gray-600 mb-4">Try adjusting your search or filter criteria</p>
            <button
              onClick={() => setShowCreateModal(true)}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Create First Depot
            </button>
          </div>
        )}
      </div>

      {/* Create Depot Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold text-gray-900">Create New Depot</h2>
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="p-2 hover:bg-gray-100 rounded-lg"
                >
                  <XCircle className="w-5 h-5 text-gray-500" />
                </button>
              </div>
            </div>
            
            <form onSubmit={handleCreateDepot} className="p-6 space-y-6">
              {/* Depot Type */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Depot Type *</label>
                <select
                  value={depotForm.depotType}
                  onChange={(e) => handleSimpleInputChange('depotType', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="main">Main Depot</option>
                  <option value="sub">Sub Depot</option>
                  <option value="operating">Operating Center</option>
                </select>
              </div>

              {/* Depot Code + Name */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Depot Code *</label>
                  <input
                    type="text"
                    placeholder="e.g., TVM, ALP"
                    value={depotForm.depotCode}
                    onChange={(e) => handleSimpleInputChange('depotCode', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  {renderError('depotCode')}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Depot Name *</label>
                  <input
                    type="text"
                    placeholder="e.g., Trivandrum Depot"
                    value={depotForm.depotName}
                    onChange={(e) => handleSimpleInputChange('depotName', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  {renderError('depotName')}
                </div>
              </div>

              {/* Contact Information */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">STD Code *</label>
                  <input
                    type="text"
                    placeholder="e.g., 0471"
                    value={depotForm.contact.stdCode}
                    onChange={(e) => handleNestedInputChange('contact', 'stdCode', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  {renderError('contact.stdCode')}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Phone Number *</label>
                  <input
                    type="text"
                    placeholder="e.g., 2323979"
                    value={depotForm.contact.phone}
                    onChange={(e) => handleNestedInputChange('contact', 'phone', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  {renderError('contact.phone')}
                </div>
              </div>

              {/* Email Configuration */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-sm font-medium text-gray-700">Email Configuration</label>
                  <label className="flex items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      checked={useAutoEmail}
                      onChange={(e) => setUseAutoEmail(e.target.checked)}
                      className="rounded"
                    />
                    Use auto-generated email
                  </label>
                </div>
                <input
                  type="email"
                  placeholder="Enter email address"
                  value={useAutoEmail ? derivedEmail : depotForm.contact.email}
                  onChange={(e) => !useAutoEmail && handleNestedInputChange('contact', 'email', e.target.value)}
                  disabled={useAutoEmail}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100"
                />
                {useAutoEmail && derivedEmail && (
                  <p className="text-xs text-gray-500 mt-1">Auto-generated: {derivedEmail}</p>
                )}
                {renderError('contact.email')}
              </div>

              {/* Bus Capacity */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Bus Capacity *</label>
                <input
                  type="number"
                  placeholder="Enter total number of buses"
                  value={depotForm.capacity.totalBuses}
                  onChange={(e) => handleNestedInputChange('capacity', 'totalBuses', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                {renderError('capacity.totalBuses')}
              </div>

              {/* Facilities */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Facilities</label>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                  {facilitiesOptions.map(facility => (
                    <label key={facility} className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={depotForm.facilities.includes(facility)}
                        onChange={(e) => {
                          setDepotForm(prev => ({
                            ...prev,
                            facilities: e.target.checked
                              ? [...prev.facilities, facility]
                              : prev.facilities.filter(x => x !== facility)
                          }));
                        }}
                        className="rounded"
                      />
                      <span className="text-sm text-gray-700">{facility.replaceAll('_', ' ')}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Status */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
                <select
                  value={depotForm.status}
                  onChange={(e) => handleSimpleInputChange('status', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                  <option value="maintenance">Maintenance</option>
                  <option value="closed">Closed</option>
                </select>
              </div>

              {/* Create Login Account */}
              <div className="border-t pt-4">
                <label className="flex items-center gap-2 mb-3">
                  <input
                    type="checkbox"
                    checked={createLogin}
                    onChange={(e) => setCreateLogin(e.target.checked)}
                    className="rounded"
                  />
                  <span className="text-sm font-medium text-gray-700">Create Depot Manager login account</span>
                </label>
                
                {createLogin && (
                  <div className="space-y-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Password *</label>
                      <div className="relative">
                        <input
                          type={showPassword ? 'text' : 'password'}
                          placeholder="Enter password (min 8 chars)"
                          value={loginPassword}
                          onChange={(e) => setLoginPassword(e.target.value)}
                          className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(s => !s)}
                          className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
                        >
                          {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                      {renderError('account.password')}
                    </div>
                    
                    {/* Password Strength Meter */}
                    <div className="space-y-1">
                      <div className="flex gap-1">
                        {[0, 1, 2, 3, 4].map((i) => (
                          <div
                            key={i}
                            className={`h-2 flex-1 rounded ${
                              i < strength ? strengthColor : 'bg-gray-200'
                            }`}
                          />
                        ))}
                      </div>
                      <div className={`text-xs ${strengthTextColor}`}>
                        Strength: {strengthLabel}
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Form Actions */}
              <div className="flex justify-end space-x-3 pt-4 border-t">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitLoading}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  {submitLoading ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    <>
                      <Plus className="w-4 h-4" />
                      Create Depot
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default DepotManagement;
