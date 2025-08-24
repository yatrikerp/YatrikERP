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
  Car
} from 'lucide-react';


const AdminDrivers = () => {
  const [drivers, setDrivers] = useState([]);
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

  const fetchData = async () => {
    try {
      setLoading(true);
      const [driversResponse, depotsResponse] = await Promise.all([
        fetch('/api/admin/users?role=driver', {
          headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
        }),
        fetch('/api/admin/depots', {
          headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
        })
      ]);

      if (driversResponse.ok) {
        const driversData = await driversResponse.json();
        setDrivers(driversData.users || []);
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
        fetchData();
      } else {
        const errorData = await response.json();
        alert(errorData.error || 'Failed to create driver');
      }
    } catch (error) {
      console.error('Error creating driver:', error);
      alert('Error creating driver');
    }
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
    const depot = depots.find(d => d._id === depotId);
    return depot ? depot.name : 'Unassigned';
  };

  const getDepotCode = (depotId) => {
    const depot = depots.find(d => d._id === depotId);
    return depot ? (depot.depotCode || depot.code) : 'N/A';
  };

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
        driver.staffDetails?.employeeId || 'N/A',
        getDepotName(driver.depotId),
        driver.staffDetails?.licenseNumber || 'N/A',
        driver.staffDetails?.licenseExpiry ? new Date(driver.staffDetails.licenseExpiry).toLocaleDateString() : 'N/A',
        driver.staffDetails?.joiningDate ? new Date(driver.staffDetails.joiningDate).toLocaleDateString() : 'N/A',
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
      (driver.staffDetails?.employeeId && driver.staffDetails.employeeId.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (driver.staffDetails?.licenseNumber && driver.staffDetails.licenseNumber.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesDepot = depotFilter === 'all' || driver.depotId === depotFilter;
    const matchesStatus = statusFilter === 'all' || driver.status === statusFilter;
    
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
        <div className="text-center lg:text-left">
          <h1 className="text-3xl font-bold text-gray-900">Yatrik Driver Management</h1>
          <p className="text-gray-600">Manage drivers and their depot assignments</p>
        </div>
        <div className="flex items-center space-x-3">
          <button
            onClick={exportDrivers}
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

      {/* Drivers Table */}
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
                const licenseStatus = getLicenseStatus(driver.staffDetails?.licenseExpiry);
                const LicenseIcon = licenseStatus.icon;
                
                return (
                  <tr key={driver._id} className="hover:bg-gray-50 transition-colors">
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
                      <div className="text-sm text-gray-900">
                        {driver.staffDetails?.employeeId || 'N/A'}
                      </div>
                      {driver.staffDetails?.joiningDate && (
                        <div className="text-sm text-gray-500">
                          Joined: {new Date(driver.staffDetails.joiningDate).toLocaleDateString()}
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
                          {driver.staffDetails?.licenseNumber || 'N/A'}
                        </div>
                        {driver.staffDetails?.licenseExpiry && (
                          <div className="flex items-center space-x-1">
                            <LicenseIcon className={`w-4 h-4 ${licenseStatus.color}`} />
                            <span className={`text-sm ${licenseStatus.color}`}>
                              {new Date(driver.staffDetails.licenseExpiry).toLocaleDateString()}
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
                          onClick={() => openViewDriver(driver)}
                          className="text-blue-600 hover:text-blue-900 p-2 rounded-lg hover:bg-blue-50 transition-colors"
                          title="View Details"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => openEditDriver(driver)}
                          className="text-green-600 hover:text-green-900 p-2 rounded-lg hover:bg-green-50 transition-colors"
                          title="Edit Driver"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => openDeleteModal(driver)}
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
                
                {!editingDriver && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Password *</label>
                    <input
                      type="password"
                      required
                      value={driverForm.password}
                      onChange={(e) => setDriverForm(prev => ({ ...prev, password: e.target.value }))}
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
    </div>
  );
};

export default AdminDrivers;
