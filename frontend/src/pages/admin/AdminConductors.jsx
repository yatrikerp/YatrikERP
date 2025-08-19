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
  Filter
} from 'lucide-react';
import BrandLogo from '../../components/Common/BrandLogo';

const AdminConductors = () => {
  const [conductors, setConductors] = useState([]);
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

  const fetchData = async () => {
    try {
      setLoading(true);
      const [conductorsResponse, depotsResponse] = await Promise.all([
        fetch('/api/admin/users?role=conductor', {
          headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
        }),
        fetch('/api/admin/depots', {
          headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
        })
      ]);

      if (conductorsResponse.ok) {
        const conductorsData = await conductorsResponse.json();
        setConductors(conductorsData.users || []);
      }

      if (depotsResponse.ok) {
        const depotsData = await depotsResponse.json();
        setDepots(depotsData.depots || []);
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
        fetchData();
      } else {
        const errorData = await response.json();
        alert(errorData.error || 'Failed to create conductor');
      }
    } catch (error) {
      console.error('Error creating conductor:', error);
      alert('Error creating conductor');
    }
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
    const depot = depots.find(d => d._id === depotId);
    return depot ? depot.name : 'Unassigned';
  };

  const getDepotCode = (depotId) => {
    const depot = depots.find(d => d._id === depotId);
    return depot ? depot.code : 'N/A';
  };

  const exportConductors = () => {
    const csvContent = [
      ['Name', 'Email', 'Phone', 'Employee ID', 'Depot', 'Joining Date', 'Salary', 'Status'].join(','),
      ...conductors.map(conductor => [
        conductor.name,
        conductor.email,
        conductor.phone,
        conductor.staffDetails?.employeeId || 'N/A',
        getDepotName(conductor.depotId),
        conductor.staffDetails?.joiningDate ? new Date(conductor.staffDetails.joiningDate).toLocaleDateString() : 'N/A',
        conductor.staffDetails?.salary || 'N/A',
        conductor.status
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
      (conductor.staffDetails?.employeeId && conductor.staffDetails.employeeId.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesDepot = depotFilter === 'all' || conductor.depotId === depotFilter;
    const matchesStatus = statusFilter === 'all' || conductor.status === statusFilter;
    
    return matchesSearch && matchesDepot && matchesStatus;
  });

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
        <div className="flex items-center space-x-4">
          <div className="w-12 h-12 flex items-center justify-center rounded-xl bg-gray-50">
            <BrandLogo size={20} />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Yatrik Conductor Management</h1>
            <p className="text-gray-600">Manage conductors and their depot assignments</p>
          </div>
        </div>
        <div className="flex items-center space-x-3">
          <button
            onClick={exportConductors}
            className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors flex items-center space-x-2"
          >
            <Download className="w-4 h-4" />
            <span>Export</span>
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
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="all">All Depots</option>
            {depots.map(depot => (
              <option key={depot._id} value={depot._id}>{depot.name}</option>
            ))}
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

      {/* Conductors Table */}
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
                <tr key={conductor._id} className="hover:bg-gray-50 transition-colors">
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
                    <div className="text-sm text-gray-900">
                      {conductor.staffDetails?.employeeId || 'N/A'}
                    </div>
                    {conductor.staffDetails?.joiningDate && (
                      <div className="text-sm text-gray-500">
                        Joined: {new Date(conductor.staffDetails.joiningDate).toLocaleDateString()}
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
                        onClick={() => openViewConductor(conductor)}
                        className="text-blue-600 hover:text-blue-900 p-2 rounded-lg hover:bg-blue-50 transition-colors"
                        title="View Details"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => openEditConductor(conductor)}
                        className="text-green-600 hover:text-green-900 p-2 rounded-lg hover:bg-green-50 transition-colors"
                        title="Edit Conductor"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => openDeleteModal(conductor)}
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
                      <option key={depot._id} value={depot._id}>{depot.name} ({depot.code})</option>
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
                
                {!editingConductor && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Password *</label>
                    <input
                      type="password"
                      required
                      value={conductorForm.password}
                      onChange={(e) => setConductorForm(prev => ({ ...prev, password: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Enter password"
                    />
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
    </div>
  );
};

export default AdminConductors;
