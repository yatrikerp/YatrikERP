import React, { useState, useEffect } from 'react';
import { 
  Users, 
  Plus, 
  Search, 
  RefreshCw, 
  Edit, 
  Trash2, 
  Eye,
  Download,
  MapPin,
  Phone,
  Mail,
  Calendar,
  Clock,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Building2,
  Route,
  Bus,
  UserCheck,
  UserX,
  Filter,
  Car,
  UserPlus
} from 'lucide-react';
import BulkAssignmentModal from '../../components/Admin/BulkAssignmentModal';


const AdminDrivers = () => {
  const [drivers, setDrivers] = useState([]);
  const [viewMode, setViewMode] = useState('cards'); // 'cards' | 'table'
  const [depots, setDepots] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [depotFilter, setDepotFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingDriver, setEditingDriver] = useState(null);
  const [viewingDriver, setViewingDriver] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [driverToDelete, setDriverToDelete] = useState(null);
  const [showBulkAssignment, setShowBulkAssignment] = useState(false);

  const [driverForm, setDriverForm] = useState({
    name: '',
    email: '',
    phone: '',
    depotId: '',
    employeeId: '',
    joiningDate: '',
    salary: '',
    licenseNumber: '',
    licenseExpiry: '',
    status: 'active',
    password: ''
  });

  useEffect(() => {
    fetchData();
  }, []);

  // Force refresh depots on component mount
  useEffect(() => {
    const fetchDepots = async () => {
      try {
        console.log('=== FORCE FETCHING DEPOTS ON MOUNT ===');
        const response = await fetch('/api/admin/depots', {
          headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
        });
        
        if (response.ok) {
          const data = await response.json();
          console.log('Depots fetched on mount:', data);
          setDepots(data.depots || []);
        } else {
          console.error('Failed to fetch depots on mount:', response.status);
        }
      } catch (error) {
        console.error('Error fetching depots on mount:', error);
      }
    };
    
    fetchDepots();
  }, []);

  const fetchData = async (forceRefresh = false) => {
    try {
      setLoading(true);
      console.log('=== FRONTEND FETCHING DRIVERS ===', forceRefresh ? '(FORCE REFRESH)' : '');
      
      // Add cache-busting parameter
      const timestamp = Date.now();
      const driversUrl = forceRefresh ? `/api/admin/drivers?t=${timestamp}` : '/api/admin/drivers';
      const depotsUrl = forceRefresh ? `/api/admin/depots?t=${timestamp}` : '/api/admin/depots';
      
      const [driversResponse, depotsResponse] = await Promise.all([
        fetch(driversUrl, {
          headers: { 
            'Authorization': `Bearer ${localStorage.getItem('token')}`,
            'Cache-Control': 'no-cache',
            'Pragma': 'no-cache'
          }
        }),
        fetch(depotsUrl, {
          headers: { 
            'Authorization': `Bearer ${localStorage.getItem('token')}`,
            'Cache-Control': 'no-cache',
            'Pragma': 'no-cache'
          }
        })
      ]);

      console.log('Drivers response status:', driversResponse.status);
      console.log('Depots response status:', depotsResponse.status);

      if (driversResponse.ok) {
        const driversData = await driversResponse.json();
        console.log('Drivers data received:', driversData);
        console.log('Drivers count:', driversData.data?.drivers?.length || 0);
        console.log('Full response structure:', JSON.stringify(driversData, null, 2));
        setDrivers(driversData.data?.drivers || []);
        
        // Additional debugging
        if (driversData.data?.drivers?.length > 0) {
          console.log('First driver sample:', driversData.data.drivers[0]);
        }
      } else {
        console.error('Drivers response not ok:', driversResponse.status);
        if (driversResponse.status === 401) {
          console.warn('Unauthorized for drivers - clearing session and redirecting to login');
          try {
            localStorage.removeItem('token');
            localStorage.removeItem('user');
          } catch {}
          const next = encodeURIComponent(window.location.pathname + window.location.search);
          window.location.replace(`/login?next=${next}`);
          return;
        }
        const errorText = await driversResponse.text();
        console.error('Drivers error response:', errorText);
      }

      if (depotsResponse.ok) {
        const depotsData = await depotsResponse.json();
        console.log('Depots data received:', depotsData);
        console.log('Depots count:', depotsData.depots?.length || 0);
        console.log('Depots array:', depotsData.depots);
        setDepots(depotsData.depots || []);
        
        // Additional debugging
        if (depotsData.depots && depotsData.depots.length > 0) {
          console.log('First depot sample:', depotsData.depots[0]);
        }
      } else {
        console.error('Depots response not ok:', depotsResponse.status);
        if (depotsResponse.status === 401) {
          console.warn('Unauthorized for depots - clearing session and redirecting to login');
          try {
            localStorage.removeItem('token');
            localStorage.removeItem('user');
          } catch {}
          const next = encodeURIComponent(window.location.pathname + window.location.search);
          window.location.replace(`/login?next=${next}`);
          return;
        }
        const errorText = await depotsResponse.text();
        console.error('Depots error response:', errorText);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateDriver = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch('/api/admin/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          ...driverForm,
          role: 'driver'
        })
      });

      if (response.ok) {
        alert('Driver created successfully');
        setShowCreateModal(false);
        resetDriverForm();
        fetchData(true); // Force refresh
      } else {
        const errorData = await response.json();
        alert(errorData.error || 'Failed to create driver');
      }
    } catch (error) {
      console.error('Error creating driver:', error);
      alert('Error creating driver');
    }
  };

  const handleForceRefresh = () => {
    console.log('=== FORCE REFRESH TRIGGERED ===');
    fetchData(true);
  };



  const handleUpdateDriver = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch(`/api/admin/users/${editingDriver._id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          ...driverForm,
          role: 'driver'
        })
      });

      if (response.ok) {
        alert('Driver updated successfully');
        setEditingDriver(null);
        resetDriverForm();
        fetchData();
      } else {
        const errorData = await response.json();
        alert(errorData.error || 'Failed to update driver');
      }
    } catch (error) {
      console.error('Error updating driver:', error);
      alert('Error updating driver');
    }
  };

  const handleDeleteDriver = async () => {
    if (!driverToDelete) return;

    try {
      const response = await fetch(`/api/admin/users/${driverToDelete._id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (response.ok) {
        alert('Driver deleted successfully');
        setShowDeleteModal(false);
        setDriverToDelete(null);
        fetchData();
      } else {
        const errorData = await response.json();
        alert(errorData.error || 'Failed to delete driver');
      }
    } catch (error) {
      console.error('Error deleting driver:', error);
      alert('Error deleting driver');
    }
  };

  const resetDriverForm = () => {
    setDriverForm({
      name: '',
      email: '',
      phone: '',
      depotId: '',
      employeeId: '',
      joiningDate: '',
      salary: '',
      licenseNumber: '',
      licenseExpiry: '',
      status: 'active',
      password: ''
    });
  };

  const openEditDriver = (driver) => {
    setEditingDriver(driver);
    setDriverForm({
      name: driver.name || '',
      email: driver.email || '',
      phone: driver.phone || '',
      depotId: driver.depotId || '',
      employeeId: driver.staffDetails?.employeeId || '',
      joiningDate: driver.staffDetails?.joiningDate ? new Date(driver.staffDetails.joiningDate).toISOString().split('T')[0] : '',
      salary: driver.staffDetails?.salary || '',
      licenseNumber: driver.staffDetails?.licenseNumber || '',
      licenseExpiry: driver.staffDetails?.licenseExpiry ? new Date(driver.staffDetails.licenseExpiry).toISOString().split('T')[0] : '',
      status: driver.status || 'active',
      password: ''
    });
  };

  const openViewDriver = (driver) => {
    setViewingDriver(driver);
  };

  const openDeleteModal = (driver) => {
    setDriverToDelete(driver);
    setShowDeleteModal(true);
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      active: { color: 'bg-green-100 text-green-800 border-green-200', icon: CheckCircle },
      inactive: { color: 'bg-gray-100 text-gray-800 border-gray-200', icon: UserX },
      suspended: { color: 'bg-red-100 text-red-800 border-red-200', icon: XCircle }
    };

    const config = statusConfig[status] || { color: 'bg-gray-100 text-gray-800 border-gray-200', icon: AlertTriangle };
    const Icon = config.icon;
    
    return (
      <span className={`px-3 py-1 rounded-full text-xs font-medium border ${config.color} flex items-center gap-1`}>
        <Icon className="w-3 h-3" />
        {status}
      </span>
    );
  };

  const getDepotName = (depotId) => {
    // Handle both populated depot object and depot ID
    if (typeof depotId === 'object' && depotId !== null) {
      return depotId.depotName || 'Unassigned';
    }
    const depot = depots.find(d => d._id === depotId);
    return depot ? depot.name : 'Unassigned';
  };

  const getDepotCode = (depotId) => {
    // Handle both populated depot object and depot ID
    if (typeof depotId === 'object' && depotId !== null) {
      return depotId.depotCode || 'N/A';
    }
    const depot = depots.find(d => d._id === depotId);
    return depot ? (depot.depotCode || depot.code) : 'N/A';
  };

  // Auto-generate display credentials (not persisted)
  const generateAutoEmail = (fullName, depotId) => {
    const nameSlug = String(fullName || 'driver').toLowerCase().replace(/[^a-z0-9]+/g, '');
    const code = getDepotCode(depotId) || '';
    const digits = String(code).match(/\d+/g)?.join('') || '';
    const depotSuffix = digits || String(code || '').toLowerCase();
    const fallback = '000';
    const suffix = depotSuffix || fallback;
    return `${nameSlug}${suffix}@yatrik.com`;
  };
  const AUTO_PASSWORD = 'Yatrik123';

  const isLicenseExpired = (expiryDate) => {
    if (!expiryDate) return false;
    return new Date(expiryDate) < new Date();
  };

  const getLicenseStatus = (expiryDate) => {
    if (!expiryDate) return { status: 'unknown', color: 'text-gray-500', icon: AlertTriangle };
    
    const today = new Date();
    const expiry = new Date(expiryDate);
    const daysUntilExpiry = Math.ceil((expiry - today) / (1000 * 60 * 60 * 24));
    
    if (daysUntilExpiry < 0) {
      return { status: 'expired', color: 'text-red-500', icon: XCircle };
    } else if (daysUntilExpiry <= 30) {
      return { status: 'expiring_soon', color: 'text-yellow-500', icon: AlertTriangle };
    } else {
      return { status: 'valid', color: 'text-green-500', icon: CheckCircle };
    }
  };

  const exportDrivers = () => {
    const csvContent = [
      ['Name', 'Email', 'Phone', 'Employee ID', 'Depot', 'License Number', 'License Expiry', 'Joining Date', 'Salary', 'Status'].join(','),
      ...drivers.map(driver => [
        driver.name,
        driver.email,
        driver.phone,
        driver.employeeCode || 'N/A',
        getDepotName(driver.depotId),
        driver.drivingLicense?.licenseNumber || 'N/A',
        driver.staffDetails?.licenseExpiry ? new Date(driver.staffDetails.licenseExpiry).toLocaleDateString() : 'N/A',
        driver.joiningDate ? new Date(driver.joiningDate).toLocaleDateString() : 'N/A',
        driver.staffDetails?.salary || 'N/A',
        driver.status
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `drivers_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
    alert('Drivers exported successfully');
  };

  const filteredDrivers = drivers.filter(driver => {
    const matchesSearch = !searchTerm || 
      driver.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      driver.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      driver.phone.includes(searchTerm) ||
      (driver.employeeCode && driver.employeeCode.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (driver.drivingLicense?.licenseNumber && driver.drivingLicense.licenseNumber.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesDepot = depotFilter === 'all' || 
      (typeof driver.depotId === 'object' && driver.depotId?._id === depotFilter) ||
      (typeof driver.depotId === 'string' && driver.depotId === depotFilter);
    const matchesStatus = statusFilter === 'all' || driver.status === statusFilter;
    
    return matchesSearch && matchesDepot && matchesStatus;
  });

  // Debug logging
  console.log('=== FRONTEND DEBUG ===');
  console.log('drivers state:', drivers);
  console.log('drivers length:', drivers.length);
  console.log('filteredDrivers length:', filteredDrivers.length);
  console.log('searchTerm:', searchTerm);
  console.log('depotFilter:', depotFilter);
  console.log('statusFilter:', statusFilter);
  console.log('depots state:', depots);
  console.log('depots length:', depots.length);
  
  // Check if depots are loaded
  if (depots.length === 0) {
    console.warn('⚠️ No depots loaded! This might be why the dropdown is empty.');
  } else {
    console.log('✅ Depots loaded successfully:', depots.map(d => ({ id: d._id, name: d.name })));
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="text-center lg:text-left">
          <h1 className="text-3xl font-bold text-gray-900">Yatrik Driver Management</h1>
          <p className="text-gray-600">Manage drivers and their depot assignments</p>
        </div>
        <div className="flex items-center space-x-3">
          <div className="hidden md:flex items-center rounded-lg overflow-hidden border border-gray-300">
            <button
              onClick={() => setViewMode('cards')}
              className={`px-3 py-2 text-sm ${viewMode === 'cards' ? 'bg-gray-200 text-gray-900' : 'bg-white text-gray-700 hover:bg-gray-50'}`}
            >
              Cards
            </button>
            <button
              onClick={() => setViewMode('table')}
              className={`px-3 py-2 text-sm ${viewMode === 'table' ? 'bg-gray-200 text-gray-900' : 'bg-white text-gray-700 hover:bg-gray-50'}`}
            >
              Table
            </button>
          </div>
          <button
            onClick={exportDrivers}
            className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors flex items-center space-x-2"
          >
            <Download className="w-4 h-4" />
            <span>Export</span>
          </button>
          <button
            onClick={handleForceRefresh}
            className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors flex items-center space-x-2"
          >
            <RefreshCw className="w-4 h-4" />
            <span>Refresh All</span>
          </button>
          <button
            onClick={async () => {
              try {
                console.log('=== TESTING COMPREHENSIVE STAFF DEBUG ===');
                const response = await fetch('/api/admin/debug-all-staff', {
                  headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
                });
                
                if (response.ok) {
                  const data = await response.json();
                  console.log('Comprehensive staff debug:', data);
                  alert(`Debug complete! Found ${data.counts.allDrivers} drivers and ${data.counts.allConductors} conductors. Check console for details.`);
                } else {
                  console.error('Debug failed:', response.status);
                  alert(`Debug failed with status ${response.status}`);
                }
              } catch (error) {
                console.error('Debug error:', error);
                alert('Debug error. Check console for details.');
              }
            }}
            className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors flex items-center space-x-2"
          >
            <span>Debug All Staff</span>
          </button>
          <button
            onClick={() => setShowBulkAssignment(true)}
            className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors flex items-center space-x-2"
          >
            <UserPlus className="w-4 h-4" />
            <span>Bulk Assign</span>
          </button>
          <button
            onClick={() => setShowCreateModal(true)}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
          >
            <Plus className="w-4 h-4" />
            <span>Add Driver</span>
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
        <div className="flex flex-col lg:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search drivers by name, email, phone, employee ID, or license number..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>
          
          <select
            value={depotFilter}
            onChange={(e) => setDepotFilter(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
            style={{ minHeight: '40px' }}
          >
            <option value="all">All Depots ({depots.length})</option>
            {depots && depots.length > 0 ? depots.map(depot => {
              console.log('Rendering depot option:', depot);
              return (
                <option key={depot._id} value={depot._id} style={{ padding: '8px', backgroundColor: 'white' }}>
                  {depot.name || depot.depotName || 'Unknown Depot'}
                </option>
              );
            }) : (
              <option disabled>No depots available</option>
            )}
          </select>
          
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
            <option value="suspended">Suspended</option>
          </select>
          
          <button
            onClick={fetchData}
            className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors flex items-center space-x-2"
          >
            <RefreshCw className="w-4 h-4" />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* Drivers Cards */}
      {viewMode === 'cards' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredDrivers.map((driver) => (
            <div key={driver._id} className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 hover:shadow-md transition cursor-pointer" onClick={() => openViewDriver(driver)}>
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-blue-600 rounded-full flex items-center justify-center text-white font-semibold">
                    {driver.name?.charAt(0)?.toUpperCase() || 'D'}
                  </div>
                  <div>
                    <div className="font-semibold text-gray-900">{driver.name}</div>
                    <div className="text-xs text-gray-500">ID: {driver._id.slice(-8)}</div>
                  </div>
                </div>
                <div>
                  {getStatusBadge(driver.status)}
                </div>
              </div>
              <div className="mt-3 text-sm">
                <div className="flex items-center gap-2">
                  <span className="text-gray-500">Username:</span>
                  <span className="font-mono text-gray-900">{driver.username || '—'}</span>
                  {driver.username && (
                    <button onClick={(e) => { e.stopPropagation(); navigator.clipboard.writeText(driver.username); }} className="px-2 py-0.5 text-xs border border-gray-300 rounded hover:bg-gray-50">Copy</button>
                  )}
                </div>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-gray-500">Depot:</span>
                  <span className="text-gray-900">{getDepotName(driver.depotId)} ({getDepotCode(driver.depotId)})</span>
                </div>
                <div className="flex items-center gap-2 mt-1">
                  <Mail className="w-4 h-4 text-gray-400" />
                  <span>{driver.email || '—'}</span>
                </div>
                <div className="flex items-center gap-2 mt-1">
                  <Phone className="w-4 h-4 text-gray-400" />
                  <span>{driver.phone || '—'}</span>
                </div>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-gray-500">Auto email:</span>
                <span className="font-mono text-gray-900">{generateAutoEmail(driver.name, driver.depotId)}</span>
              </div>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-gray-500">Auto password:</span>
                <span className="font-mono text-gray-900">{AUTO_PASSWORD}</span>
              </div>
              </div>
              <div className="mt-3 flex items-center gap-2">
                <button onClick={(e) => { e.stopPropagation(); openViewDriver(driver); }} className="text-blue-600 hover:text-blue-800 px-3 py-1 border border-blue-200 rounded">View</button>
                <button onClick={(e) => { e.stopPropagation(); openEditDriver(driver); }} className="text-green-600 hover:text-green-800 px-3 py-1 border border-green-200 rounded">Edit</button>
                <button onClick={(e) => { e.stopPropagation(); openDeleteModal(driver); }} className="text-red-600 hover:text-red-800 px-3 py-1 border border-red-200 rounded">Delete</button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Drivers Table */}
      {viewMode === 'table' && (
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Driver
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Employee ID
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Username
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Depot Assignment
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  License
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Contact
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredDrivers.map((driver) => {
                const licenseStatus = getLicenseStatus(driver.drivingLicense?.licenseExpiry);
                const LicenseIcon = licenseStatus.icon;
                
                return (
                  <tr key={driver._id} className="hover:bg-gray-50 transition-colors cursor-pointer" onClick={() => openViewDriver(driver)}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-blue-600 rounded-full flex items-center justify-center">
                          <span className="text-white font-semibold text-lg">
                            {driver.name?.charAt(0)?.toUpperCase() || 'D'}
                          </span>
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-semibold text-gray-900">{driver.name}</div>
                          <div className="text-sm text-gray-500">ID: {driver._id.slice(-8)}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-mono text-gray-900 select-all">{driver.username || '—'}</span>
                        {driver.username && (
                          <button
                            onClick={() => navigator.clipboard.writeText(driver.username)}
                            title="Copy username"
                            className="px-2 py-1 text-xs border border-gray-300 rounded hover:bg-gray-50"
                          >
                            Copy
                          </button>
                        )}
                      </div>
                      <div className="text-[11px] text-gray-500 mt-1">Default pwd: driver123 (if seeded)</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {driver.employeeCode || 'N/A'}
                      </div>
                      {driver.joiningDate && (
                        <div className="text-sm text-gray-500">
                          Joined: {new Date(driver.joiningDate).toLocaleDateString()}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center space-x-2">
                        <Building2 className="w-4 h-4 text-gray-400" />
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {getDepotName(driver.depotId)}
                          </div>
                          <div className="text-sm text-gray-500">
                            Code: {getDepotCode(driver.depotId)}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="space-y-1">
                        <div className="text-sm font-medium text-gray-900">
                          {driver.drivingLicense?.licenseNumber || 'N/A'}
                        </div>
                        {driver.drivingLicense?.licenseExpiry && (
                          <div className="flex items-center space-x-1">
                            <LicenseIcon className={`w-4 h-4 ${licenseStatus.color}`} />
                            <span className={`text-sm ${licenseStatus.color}`}>
                              {new Date(driver.drivingLicense.licenseExpiry).toLocaleDateString()}
                            </span>
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="space-y-1">
                        <div className="flex items-center text-sm text-gray-900">
                          <Mail className="w-4 h-4 mr-2 text-gray-400" />
                          {driver.email}
                        </div>
                        <div className="flex items-center text-sm text-gray-600">
                          <Phone className="w-4 h-4 mr-2 text-gray-400" />
                          {driver.phone}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getStatusBadge(driver.status)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={(e) => { e.stopPropagation(); openViewDriver(driver); }}
                          className="text-blue-600 hover:text-blue-900 p-2 rounded-lg hover:bg-blue-50 transition-colors"
                          title="View Details"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={(e) => { e.stopPropagation(); openEditDriver(driver); }}
                          className="text-green-600 hover:text-green-900 p-2 rounded-lg hover:bg-green-50 transition-colors"
                          title="Edit Driver"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={(e) => { e.stopPropagation(); openDeleteModal(driver); }}
                          className="text-red-600 hover:text-red-900 p-2 rounded-lg hover:bg-red-50 transition-colors"
                          title="Delete Driver"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Empty State */}
        {filteredDrivers.length === 0 && (
          <div className="text-center py-12">
            <Car className="mx-auto h-16 w-16 text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {drivers.length === 0 ? 'No drivers found' : 'No drivers match your filters'}
            </h3>
            <p className="text-gray-500 mb-6">
              {drivers.length === 0 
                ? 'Get started by adding your first driver'
                : 'Try adjusting your search terms or filters'
              }
            </p>
            {drivers.length === 0 && (
              <button
                onClick={() => setShowCreateModal(true)}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Plus className="w-4 h-4 inline mr-2" />
                Add First Driver
              </button>
            )}
          </div>
        )}
      </div>
      )}

      {/* Create/Edit Driver Modal */}
      {(showCreateModal || editingDriver) && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-2xl font-bold text-gray-900">
                {editingDriver ? 'Edit Driver' : 'Create New Driver'}
              </h2>
              <p className="text-gray-600 mt-2">
                {editingDriver ? 'Update driver information' : 'Add a new driver to the system'}
              </p>
            </div>
            
            <form onSubmit={editingDriver ? handleUpdateDriver : handleCreateDriver} className="p-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Full Name *</label>
                  <input
                    type="text"
                    required
                    value={driverForm.name}
                    onChange={(e) => setDriverForm(prev => ({ ...prev, name: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Enter full name"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Email *</label>
                  <input
                    type="email"
                    required
                    value={driverForm.email}
                    onChange={(e) => setDriverForm(prev => ({ ...prev, email: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Enter email address"
                  />
                  <div className="mt-1 text-xs text-gray-600 flex items-center gap-2">
                    <span>Suggested:</span>
                    <span className="font-mono">{generateAutoEmail(driverForm.name || editingDriver?.name, driverForm.depotId || editingDriver?.depotId)}</span>
                    <button
                      type="button"
                      onClick={() => setDriverForm(prev => ({ ...prev, email: generateAutoEmail(prev.name || editingDriver?.name, prev.depotId || editingDriver?.depotId) }))}
                      className="px-2 py-0.5 border border-gray-300 rounded hover:bg-gray-50"
                    >
                      Use
                    </button>
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Phone *</label>
                  <input
                    type="tel"
                    required
                    value={driverForm.phone}
                    onChange={(e) => setDriverForm(prev => ({ ...prev, phone: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Enter phone number"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Employee ID</label>
                  <input
                    type="text"
                    value={driverForm.employeeId}
                    onChange={(e) => setDriverForm(prev => ({ ...prev, employeeId: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Enter employee ID"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Depot Assignment *</label>
                  <select
                    required
                    value={driverForm.depotId}
                    onChange={(e) => setDriverForm(prev => ({ ...prev, depotId: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">Select Depot</option>
                    {depots.map(depot => (
                                              <option key={depot._id} value={depot._id}>{depot.depotName || depot.name} ({depot.depotCode || depot.code})</option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
                  <select
                    value={driverForm.status}
                    onChange={(e) => setDriverForm(prev => ({ ...prev, status: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                    <option value="suspended">Suspended</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">License Number *</label>
                  <input
                    type="text"
                    required
                    value={driverForm.licenseNumber}
                    onChange={(e) => setDriverForm(prev => ({ ...prev, licenseNumber: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Enter license number"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">License Expiry *</label>
                  <input
                    type="date"
                    required
                    value={driverForm.licenseExpiry}
                    onChange={(e) => setDriverForm(prev => ({ ...prev, licenseExpiry: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Joining Date</label>
                  <input
                    type="date"
                    value={driverForm.joiningDate}
                    onChange={(e) => setDriverForm(prev => ({ ...prev, joiningDate: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Salary</label>
                  <input
                    type="number"
                    value={driverForm.salary}
                    onChange={(e) => setDriverForm(prev => ({ ...prev, salary: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Enter salary"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Password {editingDriver ? '(optional)' : '*'}</label>
                  <input
                    type="password"
                    value={driverForm.password}
                    onChange={(e) => setDriverForm(prev => ({ ...prev, password: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder={editingDriver ? 'Leave blank to keep current' : 'Enter password'}
                  />
                </div>

  {/* View Driver Modal (Credentials & Details) */}
  {viewingDriver && (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50" onClick={() => setViewingDriver(null)}>
      <div className="bg-white rounded-xl shadow-xl max-w-xl w-full" onClick={(e) => e.stopPropagation()}>
        <div className="p-6 border-b border-gray-200 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-blue-600 rounded-full flex items-center justify-center text-white font-semibold">
              {viewingDriver.name?.charAt(0)?.toUpperCase() || 'D'}
            </div>
            <div>
              <h3 className="text-xl font-bold text-gray-900">{viewingDriver.name}</h3>
              <p className="text-sm text-gray-500">ID: {String(viewingDriver._id).slice(-8)}</p>
            </div>
          </div>
          <button onClick={() => setViewingDriver(null)} className="px-3 py-1 rounded border border-gray-300 hover:bg-gray-50">Close</button>
        </div>
        <div className="p-6 space-y-4">
          <div>
            <h4 className="text-sm font-semibold text-gray-700 mb-2">Login Credentials</h4>
            <div className="flex items-center gap-2">
              <span className="text-gray-500">Username:</span>
              <span className="font-mono text-gray-900">{viewingDriver.username || '—'}</span>
              {viewingDriver.username && (
                <button onClick={() => navigator.clipboard.writeText(viewingDriver.username)} className="px-2 py-0.5 text-xs border border-gray-300 rounded hover:bg-gray-50">Copy</button>
              )}
            </div>
            <div className="flex items-center gap-2 mt-2">
              <span className="text-gray-500">Auto email:</span>
              <span className="font-mono text-gray-900">{generateAutoEmail(viewingDriver.name, viewingDriver.depotId)}</span>
              <button onClick={() => navigator.clipboard.writeText(generateAutoEmail(viewingDriver.name, viewingDriver.depotId))} className="px-2 py-0.5 text-xs border border-gray-300 rounded hover:bg-gray-50">Copy</button>
            </div>
            <p className="text-xs text-gray-500 mt-1">Auto password: <span className="font-mono">{AUTO_PASSWORD}</span></p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
            <div className="flex items-center gap-2"><Mail className="w-4 h-4 text-gray-400" /><span>{viewingDriver.email || '—'}</span></div>
            <div className="flex items-center gap-2"><Phone className="w-4 h-4 text-gray-400" /><span>{viewingDriver.phone || '—'}</span></div>
            <div className="flex items-center gap-2"><Building2 className="w-4 h-4 text-gray-400" /><span>{getDepotName(viewingDriver.depotId)} ({getDepotCode(viewingDriver.depotId)})</span></div>
            <div>{getStatusBadge(viewingDriver.status)}</div>
          </div>
        </div>
        <div className="p-6 border-t border-gray-200 flex items-center justify-end gap-2">
          <button onClick={() => setViewingDriver(null)} className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50">Close</button>
        </div>
      </div>
    </div>
  )}
              </div>
              
              <div className="flex items-center justify-end space-x-3 pt-6 border-t border-gray-200">
                <button
                  type="button"
                  onClick={() => {
                    setShowCreateModal(false);
                    setEditingDriver(null);
                    resetDriverForm();
                  }}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  {editingDriver ? 'Update Driver' : 'Create Driver'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full">
            <div className="p-6">
              <div className="flex items-center space-x-3 mb-4">
                <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                  <AlertTriangle className="w-6 h-6 text-red-600" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">Delete Driver</h3>
                  <p className="text-gray-600">This action cannot be undone.</p>
                </div>
              </div>
              
              <p className="text-gray-700 mb-6">
                Are you sure you want to delete <strong>{driverToDelete?.name}</strong>? 
                This will permanently remove their account and all associated data.
              </p>
              
              <div className="flex items-center justify-end space-x-3">
                <button
                  onClick={() => setShowDeleteModal(false)}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDeleteDriver}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                >
                  Delete Driver
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Bulk Assignment Modal */}
      <BulkAssignmentModal
        isOpen={showBulkAssignment}
        onClose={() => setShowBulkAssignment(false)}
        staffType="drivers"
        onAssign={(data) => {
          console.log('Bulk assignment completed:', data);
          fetchData(true); // Refresh data
        }}
      />
    </div>
  );
};

export default AdminDrivers;
