import React, { useState, useEffect } from 'react';
import { apiFetch } from '../../utils/api';
import { 
  Users, 
  Route, 
  Building2, 
  CheckCircle, 
  XCircle, 
  AlertTriangle,
  Search,
  Filter,
  UserCheck,
  UserCog,
  ArrowRight,
  Plus,
  Minus,
  RefreshCw
} from 'lucide-react';

const BulkAssignmentModal = ({ 
  isOpen, 
  onClose, 
  staffType, // 'drivers' or 'conductors'
  onAssign 
}) => {
  const [depots, setDepots] = useState([]);
  const [routes, setRoutes] = useState([]);
  const [staff, setStaff] = useState([]);
  const [selectedDepot, setSelectedDepot] = useState('');
  const [selectedRoute, setSelectedRoute] = useState('');
  const [selectedStaff, setSelectedStaff] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('active');
  const [loading, setLoading] = useState(false);
  const [assigning, setAssigning] = useState(false);

  useEffect(() => {
    if (isOpen) {
      fetchData();
    }
  }, [isOpen, staffType]);

  useEffect(() => {
    if (selectedDepot) {
      fetchRoutesForDepot(selectedDepot);
    }
  }, [selectedDepot]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const roleParam = staffType === 'drivers' ? 'driver' : 'conductor';
      const [depotsRes, staffRes] = await Promise.all([
        apiFetch('/api/admin/depots'),
        apiFetch(`/api/admin/users?role=${roleParam}`)
      ]);

      if (depotsRes?.ok) {
        const depotsData = depotsRes.data || {};
        setDepots(depotsData.depots || depotsData.data?.depots || []);
      }

      if (staffRes?.ok) {
        const staffData = staffRes.data || {};
        const usersArr = staffData.users || staffData.data?.users || staffData.data || [];
        setStaff(Array.isArray(usersArr) ? usersArr : []);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchRoutesForDepot = async (depotId) => {
    try {
      // Backend expects depotId as 'depotId' (public routes handler)
      const response = await apiFetch(`/api/routes?depotId=${depotId}`);
      
      if (response?.ok) {
        const data = response.data;
        // Support multiple response shapes: { routes: [...] } or { success, data: [...] }
        const list = Array.isArray(data?.routes)
          ? data.routes
          : (Array.isArray(data?.data) ? data.data : []);
        console.log('Loaded routes for depot', depotId, list);
        setRoutes(list);
      }
    } catch (error) {
      console.error('Error fetching routes:', error);
    }
  };

  const filteredStaff = staff.filter(member => {
    const matchesSearch = !searchTerm || 
      member.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      member.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      member.phone.includes(searchTerm) ||
      (member.employeeCode && member.employeeCode.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const memberStatus = member.status || member.state || 'active';
    const matchesStatus = statusFilter === 'all' || memberStatus === statusFilter;
    const matchesDepot = !selectedDepot || 
      (typeof member.depotId === 'object' && member.depotId?._id === selectedDepot) ||
      (typeof member.depotId === 'string' && member.depotId === selectedDepot) ||
      (typeof member.depot === 'object' && (member.depot?._id === selectedDepot || member.depot?.depotId === selectedDepot));
    const matchesRole = (staffType === 'drivers' ? ['driver', 'DRIVER'] : ['conductor', 'CONDUCTOR']).includes((member.role || '').toLowerCase());
    
    return matchesSearch && matchesStatus && matchesDepot && matchesRole;
  });

  const handleStaffToggle = (staffId) => {
    setSelectedStaff(prev => 
      prev.includes(staffId) 
        ? prev.filter(id => id !== staffId)
        : [...prev, staffId]
    );
  };

  const handleSelectAll = () => {
    const allIds = filteredStaff.map(member => member._id);
    setSelectedStaff(allIds);
  };

  const handleDeselectAll = () => {
    setSelectedStaff([]);
  };

  const handleAssign = async () => {
    if (!selectedDepot || !selectedRoute || selectedStaff.length === 0) {
      alert('Please select depot, route, and at least one staff member');
      return;
    }

    setAssigning(true);
    try {
      const response = await apiFetch('/api/admin/bulk-assign-staff', {
        method: 'POST',
        body: JSON.stringify({
          staffType,
          staffIds: selectedStaff,
          depotId: selectedDepot,
          routeId: selectedRoute
        })
      });

      if (response?.ok) {
        const data = response.data;
        alert(`Successfully assigned ${selectedStaff.length} ${staffType} to the selected route`);
        onAssign && onAssign(data);
        onClose();
      } else {
        alert(response?.message || 'Failed to assign staff');
      }
    } catch (error) {
      console.error('Error assigning staff:', error);
      alert('Error assigning staff');
    } finally {
      setAssigning(false);
    }
  };

  const getDepotName = (depotId) => {
    const depot = depots.find(d => d._id === depotId);
    return depot ? (depot.name || depot.depotName) : 'Unknown Depot';
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      active: { color: 'bg-green-100 text-green-800', icon: CheckCircle },
      inactive: { color: 'bg-gray-100 text-gray-800', icon: XCircle },
      suspended: { color: 'bg-red-100 text-red-800', icon: AlertTriangle }
    };

    const config = statusConfig[status] || { color: 'bg-gray-100 text-gray-800', icon: AlertTriangle };
    const Icon = config.icon;
    
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium flex items-center gap-1 ${config.color}`}>
        <Icon className="w-3 h-3" />
        {status}
      </span>
    );
  };

  // Route label formatter to handle various backend shapes
  const formatRouteLabel = (route) => {
    if (!route) return 'Unknown route';
    const name = route.routeName || route.name || route.routeNumber || '';
    const fromCity = route.startingPoint?.city || route.startPoint?.city || route.startPoint?.name || route.startPoint || route.origin?.city || route.fromCity || route.from;
    const toCity = route.endingPoint?.city || route.endPoint?.city || route.endPoint?.name || route.endPoint || route.destination?.city || route.toCity || route.to;
    if (fromCity || toCity) {
      return `${name ? name + ' — ' : ''}${fromCity || '?'} to ${toCity || '?'}`;
    }
    return name || 'Unnamed route';
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-40">
      <div className="bg-white rounded-xl shadow-xl max-w-6xl w-full max-h-[90vh] overflow-hidden lg:ml-64">
        {/* Header */}
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              {staffType === 'drivers' ? (
                <UserCheck className="w-8 h-8 text-blue-600" />
              ) : (
                <UserCog className="w-8 h-8 text-purple-600" />
              )}
              <div>
                <h2 className="text-2xl font-bold text-gray-900">
                  Bulk Assign {staffType === 'drivers' ? 'Drivers' : 'Conductors'}
                </h2>
                <p className="text-gray-600">
                  Assign multiple {staffType} to a specific route under a depot
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 p-2 rounded-lg hover:bg-gray-100"
            >
              <XCircle className="w-6 h-6" />
            </button>
          </div>
        </div>

        <div className="flex h-[calc(90vh-120px)]">
          {/* Left Panel - Selection */}
          <div className="w-1/2 border-r border-gray-200 p-6">
            <div className="space-y-6">
              {/* Depot and Route Selection */}
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Select Depot *
                  </label>
                  <select
                    value={selectedDepot}
                    onChange={(e) => setSelectedDepot(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">Choose a depot</option>
                    {depots.map(depot => (
                      <option key={depot._id} value={depot._id}>
                        {depot.name || depot.depotName} ({depot.depotCode || depot.code})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Select Route *
                  </label>
                  <select
                    value={selectedRoute}
                    onChange={(e) => setSelectedRoute(e.target.value)}
                    disabled={!selectedDepot}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100"
                  >
                    <option value="">Choose a route</option>
                    {routes.map(route => (
                      <option key={route._id} value={route._id}>
                        {formatRouteLabel(route)}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Staff Selection */}
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900">
                    Select {staffType === 'drivers' ? 'Drivers' : 'Conductors'}
                  </h3>
                  <div className="flex space-x-2">
                    <button
                      onClick={handleSelectAll}
                      className="text-sm text-blue-600 hover:text-blue-700 flex items-center"
                    >
                      <Plus className="w-4 h-4 mr-1" />
                      Select All
                    </button>
                    <button
                      onClick={handleDeselectAll}
                      className="text-sm text-gray-600 hover:text-gray-700 flex items-center"
                    >
                      <Minus className="w-4 h-4 mr-1" />
                      Deselect All
                    </button>
                  </div>
                </div>

                {/* Filters */}
                <div className="flex space-x-4 mb-4">
                  <div className="flex-1">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                      <input
                        type="text"
                        placeholder={`Search ${staffType}...`}
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                  </div>
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="all">All Status</option>
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                    <option value="suspended">Suspended</option>
                  </select>
                </div>

                {/* Staff List */}
                <div className="border border-gray-200 rounded-lg max-h-96 overflow-y-auto">
                  {loading ? (
                    <div className="flex items-center justify-center py-8">
                      <RefreshCw className="w-6 h-6 animate-spin text-blue-600" />
                    </div>
                  ) : filteredStaff.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                      No {staffType} found matching your criteria
                    </div>
                  ) : (
                    <div className="divide-y divide-gray-200">
                      {filteredStaff.map(member => (
                        <div
                          key={member._id}
                          className={`p-4 hover:bg-gray-50 cursor-pointer transition-colors ${
                            selectedStaff.includes(member._id) ? 'bg-blue-50 border-l-4 border-blue-500' : ''
                          }`}
                          onClick={() => handleStaffToggle(member._id)}
                        >
                          <div className="flex items-center space-x-3" onClick={(e) => e.stopPropagation()}>
                            <input
                              type="checkbox"
                              checked={selectedStaff.includes(member._id)}
                              onChange={(e) => { e.stopPropagation(); handleStaffToggle(member._id); }}
                              className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500 cursor-pointer"
                            />
                            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                              <span className="text-white font-semibold text-sm">
                                {member.name?.charAt(0)?.toUpperCase() || 'S'}
                              </span>
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center space-x-2">
                                <p className="text-sm font-medium text-gray-900 truncate">
                                  {member.name}
                                </p>
                                {getStatusBadge(member.status)}
                              </div>
                              <p className="text-sm text-gray-500 truncate">
                                {member.email}
                              </p>
                              <p className="text-xs text-gray-400">
                                {member.employeeCode || 'No ID'} • {getDepotName(member.depotId)}
                              </p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Right Panel - Summary */}
          <div className="w-1/2 p-6">
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Assignment Summary</h3>
                
                <div className="space-y-4">
                  <div className="bg-gray-50 rounded-lg p-4">
                    <div className="flex items-center space-x-2 mb-2">
                      <Building2 className="w-5 h-5 text-gray-600" />
                      <span className="font-medium text-gray-900">Depot</span>
                    </div>
                    <p className="text-sm text-gray-600">
                      {selectedDepot ? getDepotName(selectedDepot) : 'No depot selected'}
                    </p>
                  </div>

                  <div className="bg-gray-50 rounded-lg p-4">
                    <div className="flex items-center space-x-2 mb-2">
                      <Route className="w-5 h-5 text-gray-600" />
                      <span className="font-medium text-gray-900">Route</span>
                    </div>
                    <p className="text-sm text-gray-600">
                      {selectedRoute ? (
                        formatRouteLabel(routes.find(r => r._id === selectedRoute))
                      ) : (
                        'No route selected'
                      )}
                    </p>
                  </div>

                  <div className="bg-gray-50 rounded-lg p-4">
                    <div className="flex items-center space-x-2 mb-2">
                      {staffType === 'drivers' ? (
                        <UserCheck className="w-5 h-5 text-gray-600" />
                      ) : (
                        <UserCog className="w-5 h-5 text-gray-600" />
                      )}
                      <span className="font-medium text-gray-900">
                        Selected {staffType === 'drivers' ? 'Drivers' : 'Conductors'}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600">
                      {selectedStaff.length} {staffType} selected
                    </p>
                    {selectedStaff.length > 0 && (
                      <div className="mt-2 max-h-32 overflow-y-auto">
                        <div className="space-y-1">
                          {selectedStaff.map(staffId => {
                            const member = staff.find(s => s._id === staffId);
                            return member ? (
                              <div key={staffId} className="text-xs text-gray-500 flex items-center space-x-2">
                                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                                <span>{member.name}</span>
                              </div>
                            ) : null;
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-6 border-t border-gray-200">
                <div className="flex space-x-3">
                  <button
                    onClick={onClose}
                    className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleAssign}
                    disabled={!selectedDepot || !selectedRoute || selectedStaff.length === 0 || assigning}
                    className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors flex items-center justify-center"
                  >
                    {assigning ? (
                      <>
                        <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                        Assigning...
                      </>
                    ) : (
                      <>
                        <ArrowRight className="w-4 h-4 mr-2" />
                        Assign {selectedStaff.length} {staffType}
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BulkAssignmentModal;
