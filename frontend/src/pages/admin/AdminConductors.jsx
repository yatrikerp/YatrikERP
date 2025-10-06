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
  UserPlus
} from 'lucide-react';
import BulkAssignmentModal from '../../components/Admin/BulkAssignmentModal';


const AdminConductors = () => {
  const [conductors, setConductors] = useState([]);
  const [viewMode, setViewMode] = useState('cards'); // 'cards' | 'table'
  const [depots, setDepots] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [depotFilter, setDepotFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingConductor, setEditingConductor] = useState(null);
  const [viewingConductor, setViewingConductor] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [conductorToDelete, setConductorToDelete] = useState(null);
  const [showBulkAssignment, setShowBulkAssignment] = useState(false);

  const [conductorForm, setConductorForm] = useState({
    name: '',
    email: '',
    phone: '',
    depotId: '',
    employeeId: '',
    joiningDate: '',
    salary: '',
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
      console.log('=== FRONTEND FETCHING CONDUCTORS ===', forceRefresh ? '(FORCE REFRESH)' : '');
      
      // Add cache-busting parameter
      const timestamp = Date.now();
      const conductorsUrl = forceRefresh ? `/api/admin/conductors?t=${timestamp}` : '/api/admin/conductors';
      const depotsUrl = forceRefresh ? `/api/admin/depots?t=${timestamp}` : '/api/admin/depots';
      
      const [conductorsResponse, depotsResponse] = await Promise.all([
        fetch(conductorsUrl, {
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

      console.log('Conductors response status:', conductorsResponse.status);
      console.log('Depots response status:', depotsResponse.status);

      if (conductorsResponse.ok) {
        const conductorsData = await conductorsResponse.json();
        console.log('Conductors data received:', conductorsData);
        console.log('Conductors count:', conductorsData.data?.conductors?.length || 0);
        setConductors(conductorsData.data?.conductors || []);
      } else {
        console.error('Conductors response not ok:', conductorsResponse.status);
        if (conductorsResponse.status === 401) {
          console.warn('Unauthorized for conductors - clearing session and redirecting to login');
          try {
            localStorage.removeItem('token');
            localStorage.removeItem('user');
          } catch {}
          const next = encodeURIComponent(window.location.pathname + window.location.search);
          window.location.replace(`/login?next=${next}`);
          return;
        }
        const errorText = await conductorsResponse.text();
        console.error('Conductors error response:', errorText);
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

  const handleCreateConductor = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch('/api/admin/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          ...conductorForm,
          role: 'conductor'
        })
      });

      if (response.ok) {
        alert('Conductor created successfully');
        setShowCreateModal(false);
        resetConductorForm();
        fetchData(true); // Force refresh
      } else {
        const errorData = await response.json();
        alert(errorData.error || 'Failed to create conductor');
      }
    } catch (error) {
      console.error('Error creating conductor:', error);
      alert('Error creating conductor');
    }
  };

  const handleForceRefresh = () => {
    console.log('=== FORCE REFRESH TRIGGERED ===');
    fetchData(true);
  };

  const handleUpdateConductor = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch(`/api/admin/users/${editingConductor._id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          ...conductorForm,
          role: 'conductor'
        })
      });

      if (response.ok) {
        alert('Conductor updated successfully');
        setEditingConductor(null);
        resetConductorForm();
        fetchData();
      } else {
        const errorData = await response.json();
        alert(errorData.error || 'Failed to update conductor');
      }
    } catch (error) {
      console.error('Error updating conductor:', error);
      alert('Error updating conductor');
    }
  };

  const handleDeleteConductor = async () => {
    if (!conductorToDelete) return;

    try {
      const response = await fetch(`/api/admin/users/${conductorToDelete._id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (response.ok) {
        alert('Conductor deleted successfully');
        setShowDeleteModal(false);
        setConductorToDelete(null);
        fetchData();
      } else {
        const errorData = await response.json();
        alert(errorData.error || 'Failed to delete conductor');
      }
    } catch (error) {
      console.error('Error deleting conductor:', error);
      alert('Error deleting conductor');
    }
  };

  const resetConductorForm = () => {
    setConductorForm({
      name: '',
      email: '',
      phone: '',
      depotId: '',
      employeeId: '',
      joiningDate: '',
      salary: '',
      status: 'active',
      password: ''
    });
  };

  const openEditConductor = (conductor) => {
    setEditingConductor(conductor);
    setConductorForm({
      name: conductor.name || '',
      email: conductor.email || '',
      phone: conductor.phone || '',
      depotId: conductor.depotId || '',
      employeeId: conductor.staffDetails?.employeeId || '',
      joiningDate: conductor.staffDetails?.joiningDate ? new Date(conductor.staffDetails.joiningDate).toISOString().split('T')[0] : '',
      salary: conductor.staffDetails?.salary || '',
      status: conductor.status || 'active',
      password: ''
    });
  };

  const openViewConductor = (conductor) => {
    setViewingConductor(conductor);
  };

  const openDeleteModal = (conductor) => {
    setConductorToDelete(conductor);
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
    const nameSlug = String(fullName || 'conductor').toLowerCase().replace(/[^a-z0-9]+/g, '');
    const code = getDepotCode(depotId) || '';
    const digits = String(code).match(/\d+/g)?.join('') || '';
    const depotSuffix = digits || String(code || '').toLowerCase();
    const fallback = '000';
    const suffix = depotSuffix || fallback;
    return `${nameSlug}${suffix}@yatrik.com`;
  };
  const AUTO_PASSWORD = 'Yatrik123';

  const exportConductors = () => {
    const csvContent = [
      ['Name', 'Email', 'Phone', 'Employee ID', 'Depot', 'Joining Date', 'Status', 'Source'].join(','),
      ...conductors.map(conductor => [
        conductor.name,
        conductor.email,
        conductor.phone,
        conductor.employeeCode || 'N/A',
        getDepotName(conductor.depotId),
        conductor.joiningDate ? new Date(conductor.joiningDate).toLocaleDateString() : 'N/A',
        conductor.status,
        conductor.source || 'unknown'
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `conductors_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
    alert('Conductors exported successfully');
  };

  const filteredConductors = conductors.filter(conductor => {
    const matchesSearch = !searchTerm || 
      conductor.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      conductor.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      conductor.phone.includes(searchTerm) ||
      (conductor.employeeCode && conductor.employeeCode.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesDepot = depotFilter === 'all' || 
      (typeof conductor.depotId === 'object' && conductor.depotId?._id === depotFilter) ||
      (typeof conductor.depotId === 'string' && conductor.depotId === depotFilter);
    const matchesStatus = statusFilter === 'all' || conductor.status === statusFilter;
    
    return matchesSearch && matchesDepot && matchesStatus;
  });

  // Debug logging
  console.log('=== CONDUCTORS FRONTEND DEBUG ===');
  console.log('conductors state:', conductors);
  console.log('conductors length:', conductors.length);
  console.log('filteredConductors length:', filteredConductors.length);
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
          <h1 className="text-3xl font-bold text-gray-900">Yatrik Conductor Management</h1>
          <p className="text-gray-600">Manage conductors and their depot assignments</p>
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
            onClick={exportConductors}
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
            <span>Add Conductor</span>
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
                placeholder="Search conductors by name, email, phone, or employee ID..."
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

      {/* Conductors Cards */}
      {viewMode === 'cards' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredConductors.map((conductor) => (
            <div key={conductor._id} className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 hover:shadow-md transition cursor-pointer" onClick={() => openViewConductor(conductor)}>
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-blue-600 rounded-full flex items-center justify-center text-white font-semibold">
                    {conductor.name?.charAt(0)?.toUpperCase() || 'C'}
                  </div>
                  <div>
                    <div className="font-semibold text-gray-900">{conductor.name}</div>
                    <div className="text-xs text-gray-500">ID: {conductor._id.slice(-8)}</div>
                  </div>
                </div>
                <div>
                  {getStatusBadge(conductor.status)}
                </div>
              </div>
              <div className="mt-3 text-sm">
                <div className="flex items-center gap-2">
                  <span className="text-gray-500">Username:</span>
                  <span className="font-mono text-gray-900">{conductor.username || '—'}</span>
                  {conductor.username && (
                    <button onClick={(e) => { e.stopPropagation(); navigator.clipboard.writeText(conductor.username); }} className="px-2 py-0.5 text-xs border border-gray-300 rounded hover:bg-gray-50">Copy</button>
                  )}
                </div>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-gray-500">Depot:</span>
                  <span className="text-gray-900">{getDepotName(conductor.depotId)} ({getDepotCode(conductor.depotId)})</span>
                </div>
                <div className="flex items-center gap-2 mt-1">
                  <Mail className="w-4 h-4 text-gray-400" />
                  <span>{conductor.email || '—'}</span>
                </div>
                <div className="flex items-center gap-2 mt-1">
                  <Phone className="w-4 h-4 text-gray-400" />
                  <span>{conductor.phone || '—'}</span>
                </div>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-gray-500">Auto email:</span>
                  <span className="font-mono text-gray-900">{generateAutoEmail(conductor.name, conductor.depotId)}</span>
                </div>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-gray-500">Auto password:</span>
                  <span className="font-mono text-gray-900">{AUTO_PASSWORD}</span>
                </div>
              </div>
              <div className="mt-3 flex items-center gap-2">
                <button onClick={(e) => { e.stopPropagation(); openViewConductor(conductor); }} className="text-blue-600 hover:text-blue-800 px-3 py-1 border border-blue-200 rounded">View</button>
                <button onClick={(e) => { e.stopPropagation(); openEditConductor(conductor); }} className="text-green-600 hover:text-green-800 px-3 py-1 border border-green-200 rounded">Edit</button>
                <button onClick={(e) => { e.stopPropagation(); openDeleteModal(conductor); }} className="text-red-600 hover:text-red-800 px-3 py-1 border border-red-200 rounded">Delete</button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Conductors Table */}
      {viewMode === 'table' && (
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Conductor
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
              {filteredConductors.map((conductor) => (
                <tr key={conductor._id} className="hover:bg-gray-50 transition-colors cursor-pointer" onClick={() => openViewConductor(conductor)}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-blue-600 rounded-full flex items-center justify-center">
                        <span className="text-white font-semibold text-lg">
                          {conductor.name?.charAt(0)?.toUpperCase() || 'C'}
                        </span>
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-semibold text-gray-900">{conductor.name}</div>
                        <div className="text-sm text-gray-500">ID: {conductor._id.slice(-8)}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-mono text-gray-900 select-all">{conductor.username || '—'}</span>
                      {conductor.username && (
                        <button
                          onClick={() => navigator.clipboard.writeText(conductor.username)}
                          title="Copy username"
                          className="px-2 py-1 text-xs border border-gray-300 rounded hover:bg-gray-50"
                        >
                          Copy
                        </button>
                      )}
                    </div>
                    <div className="text-[11px] text-gray-500 mt-1">Default pwd: conductor123 (if seeded)</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {conductor.employeeCode || 'N/A'}
                    </div>
                    {conductor.joiningDate && (
                      <div className="text-sm text-gray-500">
                        Joined: {new Date(conductor.joiningDate).toLocaleDateString()}
                      </div>
                    )}
                    {conductor.source && (
                      <div className="text-xs text-blue-600">
                        Source: {conductor.source}
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center space-x-2">
                      <Building2 className="w-4 h-4 text-gray-400" />
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {getDepotName(conductor.depotId)}
                        </div>
                        <div className="text-sm text-gray-500">
                          Code: {getDepotCode(conductor.depotId)}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="space-y-1">
                      <div className="flex items-center text-sm text-gray-900">
                        <Mail className="w-4 h-4 mr-2 text-gray-400" />
                        {conductor.email}
                      </div>
                      <div className="flex items-center text-sm text-gray-600">
                        <Phone className="w-4 h-4 mr-2 text-gray-400" />
                        {conductor.phone}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {getStatusBadge(conductor.status)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={(e) => { e.stopPropagation(); openViewConductor(conductor); }}
                        className="text-blue-600 hover:text-blue-900 p-2 rounded-lg hover:bg-blue-50 transition-colors"
                        title="View Details"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      <button
                        onClick={(e) => { e.stopPropagation(); openEditConductor(conductor); }}
                        className="text-green-600 hover:text-green-900 p-2 rounded-lg hover:bg-green-50 transition-colors"
                        title="Edit Conductor"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={(e) => { e.stopPropagation(); openDeleteModal(conductor); }}
                        className="text-red-600 hover:text-red-900 p-2 rounded-lg hover:bg-red-50 transition-colors"
                        title="Delete Conductor"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Empty State */}
        {filteredConductors.length === 0 && (
          <div className="text-center py-12">
            <Users className="mx-auto h-16 w-16 text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {conductors.length === 0 ? 'No conductors found' : 'No conductors match your filters'}
            </h3>
            <p className="text-gray-500 mb-6">
              {conductors.length === 0 
                ? 'Get started by adding your first conductor'
                : 'Try adjusting your search terms or filters'
              }
            </p>
            {conductors.length === 0 && (
              <button
                onClick={() => setShowCreateModal(true)}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Plus className="w-4 h-4 inline mr-2" />
                Add First Conductor
              </button>
            )}
          </div>
        )}
      </div>
      )}

      {/* Create/Edit Conductor Modal */}
      {(showCreateModal || editingConductor) && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-2xl font-bold text-gray-900">
                {editingConductor ? 'Edit Conductor' : 'Create New Conductor'}
              </h2>
              <p className="text-gray-600 mt-2">
                {editingConductor ? 'Update conductor information' : 'Add a new conductor to the system'}
              </p>
            </div>
            
            <form onSubmit={editingConductor ? handleUpdateConductor : handleCreateConductor} className="p-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Full Name *</label>
                  <input
                    type="text"
                    required
                    value={conductorForm.name}
                    onChange={(e) => setConductorForm(prev => ({ ...prev, name: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Enter full name"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Email *</label>
                  <input
                    type="email"
                    required
                    value={conductorForm.email}
                    onChange={(e) => setConductorForm(prev => ({ ...prev, email: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Enter email address"
                  />
                  <div className="mt-1 text-xs text-gray-600 flex items-center gap-2">
                    <span>Suggested:</span>
                    <span className="font-mono">{generateAutoEmail(conductorForm.name || editingConductor?.name, conductorForm.depotId || editingConductor?.depotId)}</span>
                    <button
                      type="button"
                      onClick={() => setConductorForm(prev => ({ ...prev, email: generateAutoEmail(prev.name || editingConductor?.name, prev.depotId || editingConductor?.depotId) }))}
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
                    value={conductorForm.phone}
                    onChange={(e) => setConductorForm(prev => ({ ...prev, phone: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Enter phone number"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Employee ID</label>
                  <input
                    type="text"
                    value={conductorForm.employeeId}
                    onChange={(e) => setConductorForm(prev => ({ ...prev, employeeId: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Enter employee ID"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Depot Assignment *</label>
                  <select
                    required
                    value={conductorForm.depotId}
                    onChange={(e) => setConductorForm(prev => ({ ...prev, depotId: e.target.value }))}
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
                    value={conductorForm.status}
                    onChange={(e) => setConductorForm(prev => ({ ...prev, status: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                    <option value="suspended">Suspended</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Joining Date</label>
                  <input
                    type="date"
                    value={conductorForm.joiningDate}
                    onChange={(e) => setConductorForm(prev => ({ ...prev, joiningDate: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Salary</label>
                  <input
                    type="number"
                    value={conductorForm.salary}
                    onChange={(e) => setConductorForm(prev => ({ ...prev, salary: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Enter salary"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Password {editingConductor ? '(optional)' : '*'}</label>
                  <input
                    type="password"
                    value={conductorForm.password}
                    onChange={(e) => setConductorForm(prev => ({ ...prev, password: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder={editingConductor ? 'Leave blank to keep current' : 'Enter password'}
                  />
                </div>

  {/* View Conductor Modal (Credentials & Details) */}
  {viewingConductor && (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50" onClick={() => setViewingConductor(null)}>
      <div className="bg-white rounded-xl shadow-xl max-w-xl w-full" onClick={(e) => e.stopPropagation()}>
        <div className="p-6 border-b border-gray-200 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-blue-600 rounded-full flex items-center justify-center text-white font-semibold">
              {viewingConductor.name?.charAt(0)?.toUpperCase() || 'C'}
            </div>
            <div>
              <h3 className="text-xl font-bold text-gray-900">{viewingConductor.name}</h3>
              <p className="text-sm text-gray-500">ID: {String(viewingConductor._id).slice(-8)}</p>
            </div>
          </div>
          <button onClick={() => setViewingConductor(null)} className="px-3 py-1 rounded border border-gray-300 hover:bg-gray-50">Close</button>
        </div>
        <div className="p-6 space-y-4">
          <div>
            <h4 className="text-sm font-semibold text-gray-700 mb-2">Login Credentials</h4>
            <div className="flex items-center gap-2">
              <span className="text-gray-500">Username:</span>
              <span className="font-mono text-gray-900">{viewingConductor.username || '—'}</span>
              {viewingConductor.username && (
                <button onClick={() => navigator.clipboard.writeText(viewingConductor.username)} className="px-2 py-0.5 text-xs border border-gray-300 rounded hover:bg-gray-50">Copy</button>
              )}
            </div>
            <div className="flex items-center gap-2 mt-2">
              <span className="text-gray-500">Auto email:</span>
              <span className="font-mono text-gray-900">{generateAutoEmail(viewingConductor.name, viewingConductor.depotId)}</span>
              <button onClick={() => navigator.clipboard.writeText(generateAutoEmail(viewingConductor.name, viewingConductor.depotId))} className="px-2 py-0.5 text-xs border border-gray-300 rounded hover:bg-gray-50">Copy</button>
            </div>
            <p className="text-xs text-gray-500 mt-1">Auto password: <span className="font-mono">{AUTO_PASSWORD}</span></p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
            <div className="flex items-center gap-2"><Mail className="w-4 h-4 text-gray-400" /><span>{viewingConductor.email || '—'}</span></div>
            <div className="flex items-center gap-2"><Phone className="w-4 h-4 text-gray-400" /><span>{viewingConductor.phone || '—'}</span></div>
            <div className="flex items-center gap-2"><Building2 className="w-4 h-4 text-gray-400" /><span>{getDepotName(viewingConductor.depotId)} ({getDepotCode(viewingConductor.depotId)})</span></div>
            <div>{getStatusBadge(viewingConductor.status)}</div>
          </div>
        </div>
        <div className="p-6 border-t border-gray-200 flex items-center justify-end gap-2">
          <button onClick={() => setViewingConductor(null)} className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50">Close</button>
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
                    setEditingConductor(null);
                    resetConductorForm();
                  }}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  {editingConductor ? 'Update Conductor' : 'Create Conductor'}
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
                  <h3 className="text-lg font-semibold text-gray-900">Delete Conductor</h3>
                  <p className="text-gray-600">This action cannot be undone.</p>
                </div>
              </div>
              
              <p className="text-gray-700 mb-6">
                Are you sure you want to delete <strong>{conductorToDelete?.name}</strong>? 
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
                  onClick={handleDeleteConductor}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                >
                  Delete Conductor
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
        staffType="conductors"
        onAssign={(data) => {
          console.log('Bulk assignment completed:', data);
          fetchData(true); // Refresh data
        }}
      />
    </div>
  );
};

export default AdminConductors;
