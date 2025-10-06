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
  generateDepotUsername,
  getDepotTypeLabel, 
  getDepotTypeColor, 
  getDepotTypeIcon 
} from '../../data/depotData';

const DepotManagement = () => {
  const [depots, setDepots] = useState([]);
  const [depotStats, setDepotStats] = useState({
    totalDepots: 0,
    mainDepots: 0,
    subDepots: 0,
    operatingCenters: 0
  });
  const [loading, setLoading] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [formErrors, setFormErrors] = useState({});
  const navigate = useNavigate();

  // UI State
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedType, setSelectedType] = useState('main');
  const [showInactive, setShowInactive] = useState(false);
  const [expandedDepots, setExpandedDepots] = useState(new Set());
  const [viewMode, setViewMode] = useState('cards'); // cards or list
  
  // Edit/Delete/View State
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [editingDepot, setEditingDepot] = useState(null);
  const [deletingDepot, setDeletingDepot] = useState(null);
  const [viewingDepot, setViewingDepot] = useState(null);
  const [editLoading, setEditLoading] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);

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
    category: 'main',
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
    status: 'active',
    operatingHours: {
      openTime: '06:00',
      closeTime: '22:00',
      workingDays: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']
    }
  });

  // Now safe to derive email from depotForm
  const derivedEmail = depotForm.depotCode ? generateDepotEmail(depotForm.depotCode, depotForm.category) : '';
  const derivedUsername = depotForm.depotCode ? generateDepotUsername(depotForm.depotCode) : '';
  const derivedPassword = depotForm.depotCode ? generateDepotPassword(depotForm.depotCode) : '';

  // Fetch depots from database
  useEffect(() => {
    fetchDepots();
    fetchDepotStats();
  }, []);

  const fetchDepotStats = async () => {
    try {
      const res = await fetch('/api/depots/stats/overview', {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          setDepotStats({
            totalDepots: data.data.totalDepots || 0,
            mainDepots: data.data.mainDepots || 0,
            subDepots: data.data.subDepots || 0,
            operatingCenters: data.data.operatingCenters || 0
          });
        }
      }
    } catch (err) {
      console.error('Error fetching depot stats:', err);
    }
  };

  const fetchDepots = async (category = 'main') => {
    try {
      setLoading(true);
      const queryParams = new URLSearchParams();
      if (category !== 'all') {
        queryParams.append('category', category);
      }
      
      const res = await fetch(`/api/admin/depots?${queryParams.toString()}`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      if (res.ok) {
        const data = await res.json();
        const depotsData = data.depots || data.data || [];
        
        // Transform depot data to include type and credentials
        const transformedDepots = depotsData.map(depot => {
          // Use the actual category field from backend
          const depotType = depot.category || 'main';
          const depotCode = depot.depotCode || '';
          const depotName = depot.depotName || '';

          return {
            ...depot,
            id: depot._id || depot.id,
            type: depotType,
            category: depotType,
            abbr: depotCode,
            name: depotName,
            code: depotCode,
            username: generateDepotUsername(depotCode),
            email: generateDepotEmail(depotCode, depotType),
            password: generateDepotPassword(depotCode),
            stdCode: depot.contact?.phone?.substring(0, 4) || '0000',
            phoneNo: depot.contact?.phone?.substring(4) || '0000000',
            staff: Math.floor(Math.random() * 20) + 5, // Random staff count for demo
            createdAt: depot.createdAt || new Date().toISOString(),
            status: depot.status || 'active'
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

  // Handle simple input changes (alias for consistency)
  const handleInputChange = (field, value) => {
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
    } else if (!/^[A-Za-z0-9]{3,10}$/.test(depotForm.depotCode.trim())) {
      errors.depotCode = 'Depot Code must be 3-10 letters/numbers';
    }
    if (!depotForm.depotName || !depotForm.depotName.trim()) {
      errors.depotName = 'Depot Name is required';
    }
    if (!depotForm.location.address || !depotForm.location.address.trim()) {
      errors['location.address'] = 'Address is required';
    }
    if (!depotForm.location.city || !depotForm.location.city.trim()) {
      errors['location.city'] = 'City is required';
    }
    if (!depotForm.location.state || !depotForm.location.state.trim()) {
      errors['location.state'] = 'State is required';
    }
    if (!depotForm.location.pincode || !depotForm.location.pincode.trim()) {
      errors['location.pincode'] = 'Pincode is required';
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
    
    // Operating Hours validation
    if (!depotForm.operatingHours.openTime) {
      errors['operatingHours.openTime'] = 'Opening time is required';
    }
    if (!depotForm.operatingHours.closeTime) {
      errors['operatingHours.closeTime'] = 'Closing time is required';
    }
    if (!depotForm.operatingHours.workingDays || depotForm.operatingHours.workingDays.length === 0) {
      errors['operatingHours.workingDays'] = 'At least one working day must be selected';
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

      const newDepotData = {
        depotCode: depotForm.depotCode.trim().toUpperCase(),
        depotName: depotForm.depotName.trim(),
        category: depotForm.category,
        location: {
          address: depotForm.location.address.trim(),
          city: depotForm.location.city.trim(),
          state: depotForm.location.state.trim(),
          pincode: depotForm.location.pincode.trim()
        },
        contact: {
          phone: depotForm.contact.phone.trim(),
          email: useAutoEmail ? derivedEmail : (depotForm.contact.email?.trim().toLowerCase() || derivedEmail),
          manager: {
            name: depotForm.contact.managerName.trim()
          }
        },
        capacity: {
          totalBuses: parseInt(depotForm.capacity.totalBuses, 10),
          availableBuses: parseInt(depotForm.capacity.totalBuses, 10),
          maintenanceBuses: 0
        },
        facilities: depotForm.facilities,
        status: depotForm.status || 'active',
        operatingHours: {
          openTime: '06:00',
          closeTime: '22:00',
          workingDays: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']
        },
        // Include user account creation data
        createUserAccount: createLogin,
        userAccount: createLogin ? {
          username: derivedUsername,
          email: derivedEmail,
          password: loginPassword || derivedPassword,
          role: 'depot_manager',
          permissions: [
            'manage_buses',
            'view_buses',
            'manage_routes',
            'view_routes',
            'manage_schedules',
            'view_schedules',
            'view_reports',
            'view_depot_info'
          ]
        } : null
      };

      // Check if user is authenticated
      const token = localStorage.getItem('token');
      if (!token) {
        toast.error('Please log in to create depots');
        return;
      }

      // Make API call to create depot
      console.log('🚀 Sending create depot request:', newDepotData);
      console.log('🔑 Using token:', token ? `${token.substring(0, 20)}...` : 'No token');
      console.log('📊 Request payload:', JSON.stringify(newDepotData, null, 2));
      
      const res = await fetch('/api/admin/depots', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(newDepotData)
      });

      console.log('📡 Response status:', res.status);
      console.log('📡 Response ok:', res.ok);

      if (res.ok) {
        const responseData = await res.json();
        console.log('✅ Depot created successfully:', responseData);
        
        // Refresh the depot list to show the new depot
        await fetchDepots();
        await fetchDepotStats(); // Also refresh stats
        
        toast.success('Depot created successfully');
        setShowCreateModal(false);
      } else {
        const error = await res.json();
        console.error('❌ Failed to create depot:', error);
        console.error('❌ Error details:', {
          status: res.status,
          statusText: res.statusText,
          error: error
        });
        
        // Log validation details if available
        if (error.details && Array.isArray(error.details)) {
          console.error('❌ Validation errors:', error.details);
          error.details.forEach((detail, index) => {
            console.error(`❌ Validation error ${index + 1}:`, detail);
          });
        }
        
        // Handle specific error cases
        if (res.status === 401) {
          toast.error('Authentication failed. Please log in again.');
          // Optionally redirect to login
          // navigate('/login');
        } else if (res.status === 403) {
          toast.error('You do not have permission to create depots.');
        } else if (res.status === 400) {
          toast.error(error.message || error.error || 'Invalid depot data. Please check your inputs.');
        } else {
          toast.error(error.message || error.error || 'Failed to create depot');
        }
        return; // Don't close modal on error
      }
      
      // Reset form
      setDepotForm({
        depotCode: '',
        depotName: '',
        category: 'main',
        location: { address: '', city: '', state: 'Kerala', pincode: '' },
        contact: { phone: '', email: '', managerName: '', stdCode: '' },
        capacity: { totalBuses: '' },
        facilities: [],
        status: 'active',
        operatingHours: {
          openTime: '06:00',
          closeTime: '22:00',
          workingDays: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']
        }
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
  const filteredDepots = (depots || []).filter(depot => {
    const matchesSearch = (depot.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (depot.abbr || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (depot.code || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (depot.depotName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (depot.depotCode || '').toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = selectedType === 'all' || depot.type === selectedType || depot.category === selectedType;
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
    const credentials = `Username: ${depot.username}\nEmail: ${depot.email}\nPassword: ${depot.password}`;
    navigator.clipboard.writeText(credentials);
    toast.success('Credentials copied to clipboard');
  };

  // Handle Edit Depot
  const handleEditDepot = (depot) => {
    setEditingDepot(depot);
    setDepotForm({
      depotCode: depot.depotCode || depot.code,
      depotName: depot.depotName || depot.name,
      category: depot.category || depot.type,
      location: {
        address: depot.location?.address || '',
        city: depot.location?.city || '',
        state: depot.location?.state || 'Kerala',
        pincode: depot.location?.pincode || ''
      },
      contact: {
        phone: depot.contact?.phone || `${depot.stdCode || ''}${depot.phoneNo || ''}`,
        email: depot.contact?.email || depot.email,
        managerName: depot.contact?.managerName || '',
        stdCode: depot.stdCode || ''
      },
      capacity: {
        totalBuses: depot.capacity?.totalBuses || ''
      },
      facilities: depot.facilities || [],
      status: depot.status || 'active',
      operatingHours: depot.operatingHours || {
        openTime: '06:00',
        closeTime: '22:00',
        workingDays: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']
      }
    });
    setShowEditModal(true);
  };

  // Handle Update Depot
  const handleUpdateDepot = async () => {
    try {
      setEditLoading(true);
      setFormErrors({});

      // Validation
      const errors = {};
      if (!depotForm.depotCode.trim()) errors.depotCode = 'Depot code is required';
      if (!depotForm.depotName.trim()) errors.depotName = 'Depot name is required';
      if (!depotForm.location.address.trim()) errors['location.address'] = 'Address is required';
      if (!depotForm.location.city.trim()) errors['location.city'] = 'City is required';
      if (!depotForm.location.state.trim()) errors['location.state'] = 'State is required';
      if (!depotForm.location.pincode.trim()) errors['location.pincode'] = 'Pincode is required';
      if (!depotForm.contact.phone.trim()) errors['contact.phone'] = 'Phone is required';
      if (!depotForm.capacity.totalBuses || Number(depotForm.capacity.totalBuses) <= 0) {
        errors['capacity.totalBuses'] = 'Total Buses must be greater than 0';
      }

      if (Object.keys(errors).length > 0) {
        setFormErrors(errors);
        return;
      }

      const updateData = {
        depotCode: depotForm.depotCode.trim().toUpperCase(),
        depotName: depotForm.depotName.trim(),
        category: depotForm.category,
        location: {
          address: depotForm.location.address.trim(),
          city: depotForm.location.city.trim(),
          state: depotForm.location.state.trim(),
          pincode: depotForm.location.pincode.trim()
        },
        contact: {
          phone: depotForm.contact.phone.trim(),
          email: depotForm.contact.email?.trim().toLowerCase(),
          manager: {
            name: depotForm.contact.managerName.trim()
          }
        },
        capacity: {
          totalBuses: parseInt(depotForm.capacity.totalBuses, 10),
          availableBuses: parseInt(depotForm.capacity.totalBuses, 10),
          maintenanceBuses: 0
        },
        facilities: depotForm.facilities,
        status: depotForm.status,
        operatingHours: depotForm.operatingHours
      };

      const res = await fetch(`/api/admin/depots/${editingDepot.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(updateData)
      });

      if (res.ok) {
        toast.success('Depot updated successfully');
        setShowEditModal(false);
        setEditingDepot(null);
        fetchDepots(); // Refresh the list
      } else {
        const error = await res.json();
        toast.error(error.message || 'Failed to update depot');
      }
    } catch (err) {
      console.error('Error updating depot:', err);
      toast.error('Failed to update depot');
    } finally {
      setEditLoading(false);
    }
  };

  // Handle Delete Depot
  const handleDeleteDepot = async () => {
    try {
      setDeleteLoading(true);

      const res = await fetch(`/api/admin/depots/${deletingDepot.id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (res.ok) {
        toast.success('Depot deleted successfully');
        setShowDeleteModal(false);
        setDeletingDepot(null);
        fetchDepots(); // Refresh the list
      } else {
        const error = await res.json();
        toast.error(error.message || 'Failed to delete depot');
      }
    } catch (err) {
      console.error('Error deleting depot:', err);
      toast.error('Failed to delete depot');
    } finally {
      setDeleteLoading(false);
    }
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
              onClick={() => {
                fetchDepots(selectedType);
                fetchDepotStats();
              }}
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
              onChange={(e) => {
                setSelectedType(e.target.value);
                fetchDepots(e.target.value);
              }}
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
                  <p className="text-2xl font-bold text-gray-900">{depotStats.totalDepots || 0}</p>
                </div>
                <Building className="w-8 h-8 text-blue-600" />
              </div>
            </div>
            <div className="bg-white rounded-lg p-4 border border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Main Depots</p>
                  <p className="text-2xl font-bold text-pink-600">{depotStats.mainDepots || 0}</p>
                </div>
                <Building2 className="w-8 h-8 text-pink-600" />
              </div>
            </div>
            <div className="bg-white rounded-lg p-4 border border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Sub Depots</p>
                  <p className="text-2xl font-bold text-cyan-600">{depotStats.subDepots || 0}</p>
                </div>
                <Store className="w-8 h-8 text-cyan-600" />
              </div>
            </div>
            <div className="bg-white rounded-lg p-4 border border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Operating Centers</p>
                  <p className="text-2xl font-bold text-blue-600">{depotStats.operatingCenters || 0}</p>
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
                          <span className="text-sm text-gray-600">Username:</span>
                          <span className="text-sm font-mono">{depot.username}</span>
                        </div>
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
                    <button 
                      onClick={() => handleEditDepot(depot)}
                      className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded"
                      title="Edit Depot"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button 
                      onClick={() => {
                        setViewingDepot(depot);
                        setShowViewModal(true);
                      }}
                      className="p-2 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded"
                      title="View Details"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                    <button 
                      onClick={() => {
                        setDeletingDepot(depot);
                        setShowDeleteModal(true);
                      }}
                      className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded"
                      title="Delete Depot"
                    >
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
                  value={depotForm.category}
                  onChange={(e) => handleSimpleInputChange('category', e.target.value)}
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

              {/* Location Information */}
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">Location Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Address *</label>
                    <input
                      type="text"
                      placeholder="e.g., Main Road, Alappuzha"
                      value={depotForm.location.address}
                      onChange={(e) => handleNestedInputChange('location', 'address', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                    {renderError('location.address')}
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">City *</label>
                    <input
                      type="text"
                      placeholder="e.g., Alappuzha"
                      value={depotForm.location.city}
                      onChange={(e) => handleNestedInputChange('location', 'city', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                    {renderError('location.city')}
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">State *</label>
                    <input
                      type="text"
                      placeholder="e.g., Kerala"
                      value={depotForm.location.state}
                      onChange={(e) => handleNestedInputChange('location', 'state', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                    {renderError('location.state')}
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Pincode *</label>
                    <input
                      type="text"
                      placeholder="e.g., 688001"
                      value={depotForm.location.pincode}
                      onChange={(e) => handleNestedInputChange('location', 'pincode', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                    {renderError('location.pincode')}
                  </div>
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

              {/* Operating Hours */}
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">Operating Hours</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Opening Time *</label>
                    <input
                      type="time"
                      value={depotForm.operatingHours.openTime}
                      onChange={(e) => handleNestedInputChange('operatingHours', 'openTime', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                    {renderError('operatingHours.openTime')}
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Closing Time *</label>
                    <input
                      type="time"
                      value={depotForm.operatingHours.closeTime}
                      onChange={(e) => handleNestedInputChange('operatingHours', 'closeTime', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                    {renderError('operatingHours.closeTime')}
                  </div>
                </div>
                
                <div className="mt-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Working Days *</label>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                    {[
                      { value: 'monday', label: 'Monday' },
                      { value: 'tuesday', label: 'Tuesday' },
                      { value: 'wednesday', label: 'Wednesday' },
                      { value: 'thursday', label: 'Thursday' },
                      { value: 'friday', label: 'Friday' },
                      { value: 'saturday', label: 'Saturday' },
                      { value: 'sunday', label: 'Sunday' }
                    ].map(({ value, label }) => (
                      <label key={value} className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          checked={depotForm.operatingHours.workingDays.includes(value)}
                          onChange={(e) => {
                            const currentDays = depotForm.operatingHours.workingDays;
                            const newDays = e.target.checked 
                              ? [...currentDays, value]
                              : currentDays.filter(d => d !== value);
                            handleNestedInputChange('operatingHours', 'workingDays', newDays);
                          }}
                          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                        <span className="text-sm text-gray-700">{label}</span>
                      </label>
                    ))}
                  </div>
                  {renderError('operatingHours.workingDays')}
                </div>
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

                    {/* Auto-generated Credentials Preview */}
                    {depotForm.depotCode && (
                      <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                        <h4 className="text-sm font-medium text-blue-900 mb-2">Auto-generated Credentials</h4>
                        <div className="space-y-1 text-xs">
                          <div className="flex justify-between">
                            <span className="text-blue-700">Username:</span>
                            <span className="font-mono text-blue-900">{derivedUsername}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-blue-700">Email:</span>
                            <span className="font-mono text-blue-900">{derivedEmail}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-blue-700">Password:</span>
                            <span className="font-mono text-blue-900">{derivedPassword}</span>
                          </div>
                        </div>
                      </div>
                    )}
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

      {/* View Depot Modal */}
      {showViewModal && viewingDepot && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold text-gray-900">Depot Details - {viewingDepot.name}</h2>
                <button
                  onClick={() => setShowViewModal(false)}
                  className="p-2 hover:bg-gray-100 rounded-lg"
                >
                  <XCircle className="w-5 h-5 text-gray-500" />
                </button>
              </div>
            </div>
            
            <div className="p-6 space-y-6">
              {/* Basic Information */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Basic Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Depot Code</label>
                    <p className="mt-1 text-sm text-gray-900">{viewingDepot.code || viewingDepot.depotCode}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Depot Name</label>
                    <p className="mt-1 text-sm text-gray-900">{viewingDepot.name || viewingDepot.depotName}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Category</label>
                    <p className="mt-1 text-sm text-gray-900">{getDepotTypeLabel(viewingDepot.category || viewingDepot.type)}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Status</label>
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      viewingDepot.status === 'active' 
                        ? 'bg-green-100 text-green-800' 
                        : viewingDepot.status === 'inactive'
                        ? 'bg-red-100 text-red-800'
                        : 'bg-yellow-100 text-yellow-800'
                    }`}>
                      {viewingDepot.status || 'Active'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Location Information */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Location Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">City</label>
                    <p className="mt-1 text-sm text-gray-900">{viewingDepot.location?.city || 'N/A'}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">State</label>
                    <p className="mt-1 text-sm text-gray-900">{viewingDepot.location?.state || 'N/A'}</p>
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700">Address</label>
                    <p className="mt-1 text-sm text-gray-900">{viewingDepot.location?.address || 'N/A'}</p>
                  </div>
                </div>
              </div>

              {/* Contact Information */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Contact Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Phone</label>
                    <p className="mt-1 text-sm text-gray-900">{viewingDepot.contact?.phone || `${viewingDepot.stdCode || ''}${viewingDepot.phoneNo || ''}` || 'N/A'}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Email</label>
                    <p className="mt-1 text-sm text-gray-900">{viewingDepot.contact?.email || viewingDepot.email || 'N/A'}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Manager</label>
                    <p className="mt-1 text-sm text-gray-900">{viewingDepot.contact?.managerName || 'N/A'}</p>
                  </div>
                </div>
              </div>

              {/* Capacity Information */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Capacity Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Total Buses</label>
                    <p className="mt-1 text-sm text-gray-900">{viewingDepot.capacity?.totalBuses || 'N/A'}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Available Buses</label>
                    <p className="mt-1 text-sm text-gray-900">{viewingDepot.capacity?.availableBuses || 'N/A'}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Staff Count</label>
                    <p className="mt-1 text-sm text-gray-900">{viewingDepot.staff || 'N/A'}</p>
                  </div>
                </div>
              </div>

              {/* Operating Hours */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Operating Hours</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Opening Time</label>
                    <p className="mt-1 text-sm text-gray-900">{viewingDepot.operatingHours?.openTime || 'N/A'}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Closing Time</label>
                    <p className="mt-1 text-sm text-gray-900">{viewingDepot.operatingHours?.closeTime || 'N/A'}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Working Days</label>
                    <p className="mt-1 text-sm text-gray-900">
                      {viewingDepot.operatingHours?.workingDays?.length > 0 
                        ? viewingDepot.operatingHours.workingDays.join(', ')
                        : 'N/A'
                      }
                    </p>
                  </div>
                </div>
              </div>

              {/* Manager Credentials */}
              <div className="bg-blue-50 rounded-lg p-4">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Manager Credentials</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Username</label>
                    <p className="mt-1 text-sm font-mono text-gray-900">{viewingDepot.username || 'N/A'}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Email</label>
                    <p className="mt-1 text-sm font-mono text-gray-900">{viewingDepot.email || 'N/A'}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Password</label>
                    <p className="mt-1 text-sm font-mono text-gray-900">{viewingDepot.password || 'N/A'}</p>
                  </div>
                  <div className="flex items-end">
                    <button
                      onClick={() => copyCredentials(viewingDepot)}
                      className="px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 flex items-center gap-2"
                    >
                      <Copy className="w-3 h-3" />
                      Copy Credentials
                    </button>
                  </div>
                </div>
              </div>

              {/* Facilities */}
              {viewingDepot.facilities && viewingDepot.facilities.length > 0 && (
                <div className="bg-gray-50 rounded-lg p-4">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Facilities</h3>
                  <div className="flex flex-wrap gap-2">
                    {viewingDepot.facilities.map((facility, index) => (
                      <span key={index} className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        {facility}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="flex justify-end space-x-3 pt-4 border-t">
                <button
                  onClick={() => setShowViewModal(false)}
                  className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Close
                </button>
                <button
                  onClick={() => {
                    setShowViewModal(false);
                    handleEditDepot(viewingDepot);
                  }}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
                >
                  <Edit className="w-4 h-4" />
                  Edit Depot
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Depot Modal */}
      {showEditModal && editingDepot && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold text-gray-900">Edit Depot - {editingDepot.name}</h2>
                <button
                  onClick={() => setShowEditModal(false)}
                  className="p-2 hover:bg-gray-100 rounded-lg"
                >
                  <XCircle className="w-5 h-5 text-gray-500" />
                </button>
              </div>
            </div>
            
            <form onSubmit={(e) => { e.preventDefault(); handleUpdateDepot(); }} className="p-6 space-y-6">
              {/* Basic Information */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Depot Code *</label>
                  <input
                    type="text"
                    value={depotForm.depotCode}
                    onChange={(e) => handleInputChange('depotCode', e.target.value.toUpperCase())}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="e.g., ALP"
                  />
                  {renderError('depotCode')}
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Depot Name *</label>
                  <input
                    type="text"
                    value={depotForm.depotName}
                    onChange={(e) => handleInputChange('depotName', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="e.g., ALAPPUZHA"
                  />
                  {renderError('depotName')}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
                <select
                  value={depotForm.category}
                  onChange={(e) => handleInputChange('category', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="main">Main Depot</option>
                  <option value="sub">Sub Depot</option>
                  <option value="operating">Operating Center</option>
                </select>
              </div>

              {/* Location */}
              <div className="space-y-4">
                <h3 className="text-lg font-medium text-gray-900">Location Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">City *</label>
                    <input
                      type="text"
                      value={depotForm.location.city}
                      onChange={(e) => handleNestedInputChange('location', 'city', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="e.g., Alappuzha"
                    />
                    {renderError('location.city')}
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">State</label>
                    <input
                      type="text"
                      value={depotForm.location.state}
                      onChange={(e) => handleNestedInputChange('location', 'state', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="e.g., Kerala"
                    />
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Address</label>
                  <textarea
                    value={depotForm.location.address}
                    onChange={(e) => handleNestedInputChange('location', 'address', e.target.value)}
                    rows={2}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Full address"
                  />
                </div>
              </div>

              {/* Contact Information */}
              <div className="space-y-4">
                <h3 className="text-lg font-medium text-gray-900">Contact Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Phone Number *</label>
                    <input
                      type="tel"
                      value={depotForm.contact.phone}
                      onChange={(e) => handleNestedInputChange('contact', 'phone', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="e.g., 04772251518"
                    />
                    {renderError('contact.phone')}
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
                    <input
                      type="email"
                      value={depotForm.contact.email}
                      onChange={(e) => handleNestedInputChange('contact', 'email', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="e.g., manager@alappuzha.com"
                    />
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Manager Name</label>
                  <input
                    type="text"
                    value={depotForm.contact.managerName}
                    onChange={(e) => handleNestedInputChange('contact', 'managerName', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="e.g., John Doe"
                  />
                </div>
              </div>

              {/* Capacity */}
              <div className="space-y-4">
                <h3 className="text-lg font-medium text-gray-900">Capacity Information</h3>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Total Buses *</label>
                  <input
                    type="number"
                    min="1"
                    value={depotForm.capacity.totalBuses}
                    onChange={(e) => handleNestedInputChange('capacity', 'totalBuses', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="e.g., 25"
                  />
                  {renderError('capacity.totalBuses')}
                </div>
              </div>

              {/* Operating Hours */}
              <div className="space-y-4">
                <h3 className="text-lg font-medium text-gray-900">Operating Hours</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Opening Time *</label>
                    <input
                      type="time"
                      value={depotForm.operatingHours.openTime}
                      onChange={(e) => handleNestedInputChange('operatingHours', 'openTime', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                    {renderError('operatingHours.openTime')}
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Closing Time *</label>
                    <input
                      type="time"
                      value={depotForm.operatingHours.closeTime}
                      onChange={(e) => handleNestedInputChange('operatingHours', 'closeTime', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                    {renderError('operatingHours.closeTime')}
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Working Days *</label>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                    {[
                      { value: 'monday', label: 'Monday' },
                      { value: 'tuesday', label: 'Tuesday' },
                      { value: 'wednesday', label: 'Wednesday' },
                      { value: 'thursday', label: 'Thursday' },
                      { value: 'friday', label: 'Friday' },
                      { value: 'saturday', label: 'Saturday' },
                      { value: 'sunday', label: 'Sunday' }
                    ].map(({ value, label }) => (
                      <label key={value} className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          checked={depotForm.operatingHours.workingDays.includes(value)}
                          onChange={(e) => {
                            const currentDays = depotForm.operatingHours.workingDays;
                            const newDays = e.target.checked 
                              ? [...currentDays, value]
                              : currentDays.filter(d => d !== value);
                            handleNestedInputChange('operatingHours', 'workingDays', newDays);
                          }}
                          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                        <span className="text-sm text-gray-700">{label}</span>
                      </label>
                    ))}
                  </div>
                  {renderError('operatingHours.workingDays')}
                </div>
              </div>

              {/* Status */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
                <select
                  value={depotForm.status}
                  onChange={(e) => handleInputChange('status', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                  <option value="maintenance">Under Maintenance</option>
                </select>
              </div>

              {/* Form Actions */}
              <div className="flex justify-end space-x-3 pt-4 border-t">
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={editLoading}
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  {editLoading ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      Updating...
                    </>
                  ) : (
                    <>
                      <Edit className="w-4 h-4" />
                      Update Depot
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && deletingDepot && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-md w-full">
            <div className="p-6">
              <div className="flex items-center justify-center w-12 h-12 mx-auto bg-red-100 rounded-full mb-4">
                <Trash2 className="w-6 h-6 text-red-600" />
              </div>
              
              <h3 className="text-lg font-medium text-gray-900 text-center mb-2">
                Delete Depot
              </h3>
              
              <p className="text-sm text-gray-600 text-center mb-6">
                Are you sure you want to delete <strong>{deletingDepot.name}</strong>? 
                This action cannot be undone and will also delete the associated depot manager account.
              </p>
              
              <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-6">
                <p className="text-sm text-red-800">
                  <strong>Warning:</strong> This will permanently remove:
                </p>
                <ul className="text-sm text-red-700 mt-1 list-disc list-inside">
                  <li>Depot information and settings</li>
                  <li>Associated depot manager account</li>
                  <li>All depot-related data</li>
                </ul>
              </div>
              
              <div className="flex space-x-3">
                <button
                  onClick={() => setShowDeleteModal(false)}
                  className="flex-1 px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50"
                  disabled={deleteLoading}
                >
                  Cancel
                </button>
                <button
                  onClick={handleDeleteDepot}
                  disabled={deleteLoading}
                  className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {deleteLoading ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      Deleting...
                    </>
                  ) : (
                    <>
                      <Trash2 className="w-4 h-4" />
                      Delete Depot
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DepotManagement;
