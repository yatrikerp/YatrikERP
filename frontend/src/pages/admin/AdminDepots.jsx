import React, { useState, useEffect } from 'react';
import { 
  Plus, 
  Search, 
  Edit, 
  Trash2, 
  Eye, 
  CheckCircle,
  Download,
  RefreshCw,
  Building2,
  MapPin,
  Phone,
  Users,
  XCircle,
  AlertTriangle
} from 'lucide-react';

const AdminDepots = () => {
  const [depots, setDepots] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingDepot, setEditingDepot] = useState(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [viewingDepot, setViewingDepot] = useState(null);
  const [deleteConfirmModal, setDeleteConfirmModal] = useState(false);
  const [depotToDelete, setDepotToDelete] = useState(null);
  const [showInactiveDepots, setShowInactiveDepots] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');

  const [depotForm, setDepotForm] = useState({
    code: '',
    name: '',
    address: {
      street: '',
      city: '',
      state: '',
      pincode: ''
    },
    contact: {
      phone: '',
      email: ''
    },
    manager: '',
    capacity: {
      buses: 0,
      staff: 0
    },
    status: 'active'
  });

  useEffect(() => {
    fetchData();
  }, [showInactiveDepots]);

  const fetchData = async () => {
    try {
      setLoading(true);
      
      // Check if token exists
      const token = localStorage.getItem('token');
      if (!token) {
        console.error('❌ No authentication token found');
        alert('Authentication token missing. Please login again.');
        return;
      }
      
      const [depotsResponse, usersResponse] = await Promise.all([
        fetch(`/api/admin/depots?showAll=${showInactiveDepots}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        }),
        fetch('/api/admin/users', {
          headers: { 'Authorization': `Bearer ${token}` }
        })
      ]);

      if (depotsResponse.ok) {
        const depotsData = await depotsResponse.json();
        setDepots(depotsData.depots || []);
      } else {
        console.error('❌ Depots fetch failed:', depotsResponse.status, depotsResponse.statusText);
        const errorData = await depotsResponse.json().catch(() => ({}));
        console.error('❌ Depots error details:', errorData);
        
        // Handle specific error cases
        if (depotsResponse.status === 401) {
          alert('Authentication failed. Please login again.');
        } else if (depotsResponse.status === 403) {
          alert('Access denied. Insufficient permissions.');
        } else {
          alert(`Failed to fetch depots: ${errorData.error || 'Unknown error'}`);
        }
      }

      if (usersResponse.ok) {
        const usersData = await usersResponse.json();
        setUsers(usersData.users || []);
      } else {
        console.error('❌ Users fetch failed:', usersResponse.status, usersResponse.statusText);
        const errorData = await usersResponse.json().catch(() => ({}));
        console.error('❌ Users error details:', errorData);
      }
    } catch (error) {
      console.error('❌ Error fetching data:', error);
      alert('Network error while fetching data. Please check your connection.');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateDepot = async (e) => {
    e.preventDefault();
    
    // Validate required fields
    if (!depotForm.code || !depotForm.name || !depotForm.contact.phone) {
      alert('Please fill in all required fields (Code, Name, and Phone)');
      return;
    }

    try {
      // Format the data according to the backend model
      const depotData = {
        code: depotForm.code,
        name: depotForm.name,
        address: {
          street: depotForm.address.street || 'Main Street',
          city: depotForm.address.city || 'City',
          state: depotForm.address.state || 'State',
          pincode: depotForm.address.pincode || '000000'
        },
        contact: {
          phone: depotForm.contact.phone,
          email: depotForm.contact.email || ''
        },
        manager: depotForm.manager || '',
        capacity: {
          buses: parseInt(depotForm.capacity.buses) || 0,
          staff: parseInt(depotForm.capacity.staff) || 0
        },
        status: depotForm.status
      };

      const response = await fetch('/api/admin/depots', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(depotData)
      });

      if (response.ok) {
        const result = await response.json();
        
        // Immediately add to UI for instant feedback
        setDepots(prevDepots => [result.depot, ...prevDepots]);
        
        alert('Depot created successfully');
        setShowCreateModal(false);
        resetDepotForm();
        // No need to call fetchData() - depot already added to UI
      } else {
        const errorData = await response.json();
        console.error('Error response:', errorData);
        alert(errorData.error || 'Failed to create depot');
      }
    } catch (error) {
      console.error('Error creating depot:', error);
      alert('Error creating depot');
    }
  };

  const openEditDepot = (depot) => {
    setEditingDepot(depot);
    setDepotForm({
      code: depot.code || '',
      name: depot.name || '',
      address: depot.address || { street: '', city: '', state: '', pincode: '' },
      contact: depot.contact || { phone: '', email: '' },
      manager: depot.manager || '',
      capacity: depot.capacity || { buses: 0, staff: 0 },
      status: depot.status || 'active'
    });
  };

  const openViewDepot = (depot) => {
    setViewingDepot(depot);
    setShowViewModal(true);
  };

  const openDeleteDepot = (depot) => {
    setDepotToDelete(depot);
    setDeleteConfirmModal(true);
  };

  const handleDeleteDepot = async () => {
    if (!depotToDelete) return;

    // Immediately remove from UI for instant feedback
    const depotId = depotToDelete._id;
    setDepots(prevDepots => prevDepots.filter(depot => depot._id !== depotId));
    setDeleteConfirmModal(false);
    setDepotToDelete(null);

    try {
      const response = await fetch(`/api/admin/depots/${depotId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (response.ok) {
        // Success - depot already removed from UI
        console.log('Depot deleted successfully from backend');
      } else {
        // If deletion failed, restore the depot to the list
        const errorData = await response.json();
        console.error('Failed to delete depot:', errorData.error);
        
        // Restore the depot to the list
        setDepots(prevDepots => [...prevDepots, depotToDelete]);
        alert(`Failed to delete depot: ${errorData.error || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Error deleting depot:', error);
      
      // If network error, restore the depot to the list
      setDepots(prevDepots => [...prevDepots, depotToDelete]);
      alert('Network error while deleting depot. Please try again.');
    }
  };

  const handleRestoreDepot = async (depot) => {
    try {
      const response = await fetch(`/api/admin/depots/${depot._id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ ...depot, status: 'active' })
      });

      if (response.ok) {
        // Immediately update in UI for instant feedback
        setDepots(prevDepots => 
          prevDepots.map(d => 
            d._id === depot._id ? { ...d, status: 'active' } : d
          )
        );
        alert('Depot restored successfully');
      } else {
        const errorData = await response.json();
        alert(errorData.error || 'Failed to restore depot');
      }
    } catch (error) {
      console.error('Error restoring depot:', error);
      alert('Error restoring depot');
    }
  };

  const handleUpdateDepot = async (e) => {
    e.preventDefault();
    
    // Validate required fields
    if (!depotForm.code || !depotForm.name || !depotForm.contact.phone) {
      alert('Please fill in all required fields (Code, Name, and Phone)');
      return;
    }

    try {
      // Format the data according to the backend model
      const depotData = {
        code: depotForm.code,
        name: depotForm.name,
        address: {
          street: depotForm.address.street || 'Main Street',
          city: depotForm.address.city || 'City',
          state: depotForm.address.state || 'State',
          pincode: depotForm.address.pincode || '000000'
        },
        contact: {
          phone: depotForm.contact.phone,
          email: depotForm.contact.email || ''
        },
        manager: depotForm.manager || '',
        capacity: {
          buses: parseInt(depotForm.capacity.buses) || 0,
          staff: parseInt(depotForm.capacity.staff) || 0
        },
        status: depotForm.status
      };

      const response = await fetch(`/api/admin/depots/${editingDepot._id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(depotData)
      });

      if (response.ok) {
        const result = await response.json();
        
        // Immediately update in UI for instant feedback
        setDepots(prevDepots => 
          prevDepots.map(depot => 
            depot._id === editingDepot._id ? result.depot : depot
          )
        );
        
        alert('Depot updated successfully');
        setEditingDepot(null);
        resetDepotForm();
        // No need to call fetchData() - depot already updated in UI
      } else {
        const errorData = await response.json();
        alert(errorData.error || 'Failed to update depot');
      }
    } catch (error) {
      console.error('Error updating depot:', error);
      alert('Error updating depot');
    }
  };

  const resetDepotForm = () => {
    setDepotForm({
      code: '',
      name: '',
      address: {
        street: '',
        city: '',
        state: '',
        pincode: ''
      },
      contact: {
        phone: '',
        email: ''
      },
      manager: '',
      capacity: {
        buses: 0,
        staff: 0
      },
      status: 'active'
    });
  };

  const getUsersByDepot = (depotId) => {
    return users.filter(user => 
      user.depotId === depotId && 
      ['conductor', 'driver', 'depot_manager'].includes(user.role)
    );
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      active: { color: 'bg-green-100 text-green-800 border-green-200', icon: CheckCircle },
      inactive: { color: 'bg-red-100 text-red-800 border-red-200', icon: XCircle }
    };
    
    const config = statusConfig[status] || { color: 'bg-gray-100 text-gray-800 border-gray-200', icon: AlertTriangle };
    const Icon = config.icon;
    
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium border ${config.color} flex items-center gap-1`}>
        <Icon className="w-3 h-3" />
        {status}
      </span>
    );
  };

  const getRoleBadge = (role) => {
    const roleConfig = {
      conductor: { color: 'bg-purple-100 text-purple-800 border-purple-200', label: 'Conductor' },
      driver: { color: 'bg-green-100 text-green-800 border-green-200', label: 'Driver' },
      depot_manager: { color: 'bg-orange-100 text-orange-800 border-orange-200', label: 'Depot Manager' }
    };

    const config = roleConfig[role] || { color: 'bg-gray-100 text-gray-800 border-gray-200', label: role };
    
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium border ${config.color}`}>
        {config.label}
      </span>
    );
  };

  const exportDepotData = () => {
    const csvContent = [
      ['Depot Code', 'Depot Name', 'Address', 'Phone', 'Email', 'Manager', 'Capacity', 'Status', 'Conductors', 'Drivers', 'Depot Managers'].join(','),
      ...depots.map(depot => {
        const depotUsers = getUsersByDepot(depot._id);
        const conductors = depotUsers.filter(u => u.role === 'conductor').length;
        const drivers = depotUsers.filter(u => u.role === 'driver').length;
        const managers = depotUsers.filter(u => u.role === 'depot_manager').length;
        
        const address = depot.address?.street ? 
          `${depot.address.street}, ${depot.address.city}, ${depot.address.state} - ${depot.address.pincode}` : 
          'Address not available';
        
        return [
          depot.code,
          depot.name,
          address,
          depot.contact?.phone || 'N/A',
          depot.contact?.email || 'N/A',
          depot.manager || 'N/A',
          depot.capacity?.buses ? `${depot.capacity.buses} buses` : 'N/A',
          depot.status,
          conductors,
          drivers,
          managers
        ].join(',');
      })
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `depots_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
    alert('Depot data exported successfully');
  };

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
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Depot Management</h1>
          <p className="text-gray-600">Manage bus depots and their staff</p>
        </div>
        <div className="flex items-center space-x-3">
          <button
            onClick={fetchData}
            className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors flex items-center space-x-2"
            title="Refresh data"
          >
            <RefreshCw className="w-4 h-4" />
            <span>Refresh</span>
          </button>
          <button
            onClick={exportDepotData}
            className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors flex items-center space-x-2"
            title="Export depot data"
          >
            <Download className="w-4 h-4" />
            <span>Export</span>
          </button>
          <button
            onClick={() => setShowCreateModal(true)}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
          >
            <Plus className="w-4 h-4" />
            <span>Add Depot</span>
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200">
        <div className="flex flex-col lg:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search depots by name, code, or address..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>
          
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="all">All Roles</option>
            <option value="conductor">Conductors</option>
            <option value="driver">Drivers</option>
            <option value="depot_manager">Depot Managers</option>
          </select>

          <select
            value={depotForm.status}
            onChange={(e) => setDepotForm(prev => ({ ...prev, status: e.target.value }))}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>

          <button
            onClick={() => setShowInactiveDepots(!showInactiveDepots)}
            className={`px-4 py-2 border rounded-lg transition-colors flex items-center space-x-2 ${
              showInactiveDepots 
                ? 'bg-gray-800 text-white border-gray-800 hover:bg-gray-700' 
                : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
            }`}
            title={showInactiveDepots ? 'Hide inactive depots' : 'Show inactive depots'}
          >
            <Eye className="w-4 h-4" />
            <span>{showInactiveDepots ? 'Hide Inactive' : 'Show Inactive'}</span>
          </button>
          
          <button
            onClick={fetchData}
            className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors flex items-center space-x-2"
          >
            <RefreshCw className="w-4 h-4" />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* Help Text */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
        <div className="flex items-start space-x-2">
          <div className="text-blue-600 mt-0.5">
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="text-sm text-blue-800">
            <p className="font-medium">How deletion works:</p>
            <p>• <strong>Delete</strong> = Depot becomes inactive (soft delete)</p>
            <p>• <strong>Refresh</strong> = Only active depots are shown by default</p>
            <p>• <strong>Show Inactive</strong> = Toggle to see deleted depots</p>
            <p>• <strong>Restore</strong> = Reactivate deleted depots</p>
          </div>
        </div>
      </div>

      {/* Depot List */}
      <div className="space-y-4">
        {depots
          .filter(depot => 
            !searchTerm || 
            depot.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            depot.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
            depot.address?.street?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            depot.address?.city?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            depot.address?.state?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            depot.address?.pincode?.toLowerCase().includes(searchTerm.toLowerCase())
          )
          .map((depot) => {
            const depotUsers = getUsersByDepot(depot._id);
            const filteredUsers = roleFilter === 'all' 
              ? depotUsers 
              : depotUsers.filter(user => user.role === roleFilter);
            
            return (
              <div key={depot._id} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                {/* Depot Header */}
                <div className="p-6 border-b border-gray-200">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center">
                        <Building2 className="w-6 h-6 text-white" />
                      </div>
                      <div>
                        <div className="flex items-center space-x-3 mb-2">
                          <h3 className="text-xl font-semibold text-gray-900">{depot.name}</h3>
                          {getStatusBadge(depot.status)}
                        </div>
                        <div className="flex items-center space-x-4 text-sm text-gray-600">
                          <span className="font-medium">Code: {depot.code}</span>
                          <span className="flex items-center">
                            <MapPin className="w-4 h-4 mr-1" />
                            {depot.address?.street ? 
                              `${depot.address.street}, ${depot.address.city}, ${depot.address.state} - ${depot.address.pincode}` : 
                              'Address not available'
                            }
                          </span>
                          {depot.contact?.phone && (
                            <span className="flex items-center">
                              <Phone className="w-4 h-4 mr-1" />
                              {depot.contact.phone}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-3">
                      <div className="text-right">
                        <div className="text-sm text-gray-500">Capacity</div>
                        <div className="text-lg font-semibold text-gray-900">
                          {depot.capacity?.buses ? `${depot.capacity.buses} buses` : 'N/A'}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm text-gray-500">Staff</div>
                        <div className="text-lg font-semibold text-gray-900">{depotUsers.length}</div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => openEditDepot(depot)}
                          className="text-green-600 hover:text-green-900 p-2 rounded-lg hover:bg-green-50 transition-colors"
                          title="Edit Depot"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => openViewDepot(depot)}
                          className="text-blue-600 hover:text-blue-900 p-2 rounded-lg hover:bg-blue-50 transition-colors"
                          title="View Depot"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        {depot.status === 'active' ? (
                          <button
                            onClick={() => openDeleteDepot(depot)}
                            className="text-red-600 hover:text-red-900 p-2 rounded-lg hover:bg-red-50 transition-colors"
                            title="Delete Depot"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        ) : (
                          <button
                            onClick={() => handleRestoreDepot(depot)}
                            className="text-green-600 hover:text-green-900 p-2 rounded-lg hover:bg-green-50 transition-colors"
                            title="Restore Depot"
                          >
                            <CheckCircle className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Depot Users */}
                {filteredUsers.length > 0 ? (
                  <div className="p-6">
                    <h4 className="text-lg font-medium text-gray-900 mb-4">Assigned Staff</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {filteredUsers.map((user) => (
                        <div key={user._id} className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                          <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center space-x-3">
                              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                                <span className="text-white font-semibold text-sm">
                                  {user.name?.charAt(0)?.toUpperCase() || 'U'}
                                </span>
                              </div>
                              <div>
                                <div className="flex items-center justify-between">
                                  <span className="text-sm font-medium text-gray-900">{user.name}</span>
                                  <span className="text-xs text-gray-500">({user.email})</span>
                                </div>
                              </div>
                            </div>
                          </div>
                          
                          <div className="flex items-center justify-between">
                            {getRoleBadge(user.role)}
                            {getStatusBadge(user.status)}
                          </div>
                          
                          <div className="mt-3 text-xs text-gray-500">
                            <div className="flex items-center">
                              <Phone className="w-3 h-3 mr-1" />
                              {user.phone}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="p-6 text-center">
                    <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-500">
                      {roleFilter === 'all' 
                        ? 'No staff assigned to this depot'
                        : `No ${roleFilter}s assigned to this depot`
                      }
                    </p>
                    <p className="text-sm text-gray-400 mt-1">Assign staff members to get started</p>
                  </div>
                )}
              </div>
            );
          })}
      </div>

      {/* Empty State */}
      {depots.length === 0 && (
        <div className="text-center py-12">
          <Building2 className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No depots found</h3>
          <p className="text-gray-500 mb-6">Get started by creating your first depot</p>
          <button
            onClick={() => setShowCreateModal(true)}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus className="w-4 h-4 inline mr-2" />
            Add First Depot
          </button>
        </div>
      )}

      {/* Create/Edit Depot Modal */}
      {(showCreateModal || editingDepot) && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-2xl font-bold text-gray-900">
                {editingDepot ? 'Edit Depot' : 'Create New Depot'}
              </h2>
              <p className="text-gray-600 mt-2">
                {editingDepot ? 'Update depot information' : 'Add a new depot to the system'}
              </p>
            </div>
            
            <form onSubmit={editingDepot ? handleUpdateDepot : handleCreateDepot} className="p-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Depot Code *</label>
                  <input
                    type="text"
                    required
                    value={depotForm.code}
                    onChange={(e) => setDepotForm(prev => ({ ...prev, code: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="e.g., TVM, BLR"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Depot Name *</label>
                  <input
                    type="text"
                    required
                    value={depotForm.name}
                    onChange={(e) => setDepotForm(prev => ({ ...prev, name: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="e.g., Trivandrum Depot"
                  />
                </div>
                
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Street Address *</label>
                  <textarea
                    required
                    value={depotForm.address.street}
                    onChange={(e) => setDepotForm(prev => ({ ...prev, address: { ...prev.address, street: e.target.value } }))}
                    rows={2}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Enter street address"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">City *</label>
                  <input
                    type="text"
                    required
                    value={depotForm.address.city}
                    onChange={(e) => setDepotForm(prev => ({ ...prev, address: { ...prev.address, city: e.target.value } }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Enter city name"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">State *</label>
                  <input
                    type="text"
                    required
                    value={depotForm.address.state}
                    onChange={(e) => setDepotForm(prev => ({ ...prev, address: { ...prev.address, state: e.target.value } }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Enter state name"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Pincode *</label>
                  <input
                    type="text"
                    required
                    value={depotForm.address.pincode}
                    onChange={(e) => setDepotForm(prev => ({ ...prev, address: { ...prev.address, pincode: e.target.value } }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Enter pincode"
                    pattern="[1-9][0-9]{5}"
                    title="Please enter a valid 6-digit pincode"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Phone *</label>
                  <input
                    type="tel"
                    required
                    value={depotForm.contact.phone}
                    onChange={(e) => setDepotForm(prev => ({ ...prev, contact: { ...prev.contact, phone: e.target.value } }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Enter phone number"
                    pattern="[6-9][0-9]{9}"
                    title="Please enter a valid 10-digit phone number starting with 6-9"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
                  <input
                    type="email"
                    value={depotForm.contact.email}
                    onChange={(e) => setDepotForm(prev => ({ ...prev, contact: { ...prev.contact, email: e.target.value } }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Enter email address"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Manager</label>
                  <input
                    type="text"
                    value={depotForm.manager}
                    onChange={(e) => setDepotForm(prev => ({ ...prev, manager: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Enter manager name"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Bus Capacity</label>
                  <input
                    type="number"
                    min="0"
                    value={depotForm.capacity.buses}
                    onChange={(e) => setDepotForm(prev => ({ ...prev, capacity: { ...prev.capacity, buses: parseInt(e.target.value) || 0 } }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Enter bus capacity"
                  />
                </div>
              </div>
              
              <div className="flex items-center justify-end space-x-3 pt-6 border-t border-gray-200">
                <button
                  type="button"
                  onClick={() => {
                    setShowCreateModal(false);
                    setEditingDepot(null);
                    resetDepotForm();
                  }}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  {editingDepot ? 'Update Depot' : 'Create Depot'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* View Depot Modal */}
      {showViewModal && viewingDepot && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">Depot Details</h2>
                  <p className="text-gray-600 mt-2">View complete depot information</p>
                </div>
                <button
                  onClick={() => setShowViewModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <XCircle className="w-6 h-6" />
                </button>
              </div>
            </div>
            
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Basic Information */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-900 border-b border-gray-200 pb-2">Basic Information</h3>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Depot Code</label>
                    <p className="text-lg text-gray-900 font-mono bg-gray-50 px-3 py-2 rounded-lg">{viewingDepot.code}</p>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Depot Name</label>
                    <p className="text-lg text-gray-900">{viewingDepot.name}</p>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Status</label>
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      viewingDepot.status === 'active' 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {viewingDepot.status}
                    </span>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Manager</label>
                    <p className="text-gray-900">{viewingDepot.manager || 'Not assigned'}</p>
                  </div>
                </div>
                
                {/* Address Information */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-900 border-b border-gray-200 pb-2">Address</h3>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Street</label>
                    <p className="text-gray-900">{viewingDepot.address?.street || 'Not specified'}</p>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700">City</label>
                    <p className="text-gray-900">{viewingDepot.address?.city || 'Not specified'}</p>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700">State</label>
                    <p className="text-gray-900">{viewingDepot.address?.state || 'Not specified'}</p>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Pincode</label>
                    <p className="text-gray-900">{viewingDepot.address?.pincode || 'Not specified'}</p>
                  </div>
                </div>
                
                {/* Contact Information */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-900 border-b border-gray-200 pb-2">Contact</h3>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Phone</label>
                    <p className="text-gray-900">{viewingDepot.contact?.phone || 'Not specified'}</p>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Email</label>
                    <p className="text-gray-900">{viewingDepot.contact?.email || 'Not specified'}</p>
                  </div>
                </div>
                
                {/* Capacity Information */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-900 border-b border-gray-200 pb-2">Capacity</h3>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Bus Capacity</label>
                    <p className="text-gray-900">{viewingDepot.capacity?.buses || 0} buses</p>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Staff Capacity</label>
                    <p className="text-gray-900">{viewingDepot.capacity?.staff || 0} staff</p>
                  </div>
                </div>
              </div>
              
              {/* Action Buttons */}
              <div className="flex items-center justify-end space-x-3 pt-6 border-t border-gray-200">
                <button
                  onClick={() => setShowViewModal(false)}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Close
                </button>
                <button
                  onClick={() => {
                    setShowViewModal(false);
                    openEditDepot(viewingDepot);
                  }}
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Edit Depot
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirmModal && depotToDelete && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full">
            <div className="p-6">
              <h3 className="text-xl font-bold text-red-900 mb-4">Confirm Deletion</h3>
              <p className="text-gray-700 mb-6">
                Are you sure you want to delete depot "{depotToDelete.name}"? This action cannot be undone.
              </p>
              <div className="flex items-center justify-end space-x-3">
                <button
                  onClick={() => setDeleteConfirmModal(false)}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDeleteDepot}
                  className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                >
                  Delete Depot
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDepots;
