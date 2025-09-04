import React, { useState, useEffect } from 'react';
import { 
  Shield, 
  Users, 
  Key, 
  Lock, 
  Unlock,
  Plus, 
  Search, 
  Edit3, 
  Trash2, 
  Eye, 
  CheckCircle, 
  XCircle, 
  AlertTriangle,
  RefreshCw,
  Settings,
  UserCheck,
  UserX,
  Crown,
  Star,
  Award,
  Zap,
  Database,
  Server,
  Globe,
  Smartphone,
  Calendar,
  DollarSign,
  BarChart3,
  Route,
  Bus,
  MapPin,
  Clock,
  FileText,
  Download,
  Upload,
  Save
} from 'lucide-react';

const AdminRBAC = () => {
  const [roles, setRoles] = useState([]);
  const [permissions, setPermissions] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showCreateRoleModal, setShowCreateRoleModal] = useState(false);
  const [showEditRoleModal, setShowEditRoleModal] = useState(false);
  const [editingRole, setEditingRole] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTab, setSelectedTab] = useState('roles');

  const [newRole, setNewRole] = useState({
    name: '',
    description: '',
    permissions: [],
    isActive: true,
    priority: 1
  });

  // Comprehensive permission categories with granular controls
  const permissionCategories = {
    dashboard: {
      name: 'Dashboard & Analytics',
      icon: BarChart3,
      color: 'bg-blue-100 text-blue-800',
      permissions: [
        { key: 'dashboard.view', name: 'View Dashboard', description: 'Access main dashboard' },
        { key: 'dashboard.analytics', name: 'View Analytics', description: 'Access detailed analytics' },
        { key: 'dashboard.export', name: 'Export Data', description: 'Export dashboard data' },
        { key: 'dashboard.realtime', name: 'Real-time Data', description: 'Access live data feeds' }
      ]
    },
    users: {
      name: 'User Management',
      icon: Users,
      color: 'bg-green-100 text-green-800',
      permissions: [
        { key: 'users.view', name: 'View Users', description: 'View user listings' },
        { key: 'users.create', name: 'Create Users', description: 'Add new users' },
        { key: 'users.edit', name: 'Edit Users', description: 'Modify user details' },
        { key: 'users.delete', name: 'Delete Users', description: 'Remove users' },
        { key: 'users.roles', name: 'Manage Roles', description: 'Assign/change user roles' },
        { key: 'users.permissions', name: 'Manage Permissions', description: 'Grant/revoke permissions' }
      ]
    },
    fleet: {
      name: 'Fleet Management',
      icon: Bus,
      color: 'bg-purple-100 text-purple-800',
      permissions: [
        { key: 'buses.view', name: 'View Buses', description: 'View bus listings' },
        { key: 'buses.create', name: 'Add Buses', description: 'Add new buses' },
        { key: 'buses.edit', name: 'Edit Buses', description: 'Modify bus details' },
        { key: 'buses.delete', name: 'Delete Buses', description: 'Remove buses' },
        { key: 'buses.assign', name: 'Assign Crew', description: 'Assign drivers/conductors' },
        { key: 'buses.maintenance', name: 'Maintenance', description: 'Schedule maintenance' }
      ]
    },
    routes: {
      name: 'Route Management',
      icon: Route,
      color: 'bg-orange-100 text-orange-800',
      permissions: [
        { key: 'routes.view', name: 'View Routes', description: 'View route listings' },
        { key: 'routes.create', name: 'Create Routes', description: 'Add new routes' },
        { key: 'routes.edit', name: 'Edit Routes', description: 'Modify route details' },
        { key: 'routes.delete', name: 'Delete Routes', description: 'Remove routes' },
        { key: 'routes.stops', name: 'Manage Stops', description: 'Add/edit route stops' },
        { key: 'routes.schedule', name: 'Manage Schedules', description: 'Set route schedules' }
      ]
    },
    trips: {
      name: 'Trip Management',
      icon: Calendar,
      color: 'bg-indigo-100 text-indigo-800',
      permissions: [
        { key: 'trips.view', name: 'View Trips', description: 'View trip listings' },
        { key: 'trips.create', name: 'Create Trips', description: 'Schedule new trips' },
        { key: 'trips.edit', name: 'Edit Trips', description: 'Modify trip details' },
        { key: 'trips.cancel', name: 'Cancel Trips', description: 'Cancel scheduled trips' },
        { key: 'trips.track', name: 'Track Trips', description: 'Real-time trip tracking' },
        { key: 'trips.reports', name: 'Trip Reports', description: 'Generate trip reports' }
      ]
    },
    depots: {
      name: 'Depot Management',
      icon: MapPin,
      color: 'bg-teal-100 text-teal-800',
      permissions: [
        { key: 'depots.view', name: 'View Depots', description: 'View depot listings' },
        { key: 'depots.create', name: 'Create Depots', description: 'Add new depots' },
        { key: 'depots.edit', name: 'Edit Depots', description: 'Modify depot details' },
        { key: 'depots.delete', name: 'Delete Depots', description: 'Remove depots' },
        { key: 'depots.staff', name: 'Manage Staff', description: 'Assign depot staff' },
        { key: 'depots.facilities', name: 'Manage Facilities', description: 'Manage depot facilities' }
      ]
    },
    finance: {
      name: 'Financial Management',
      icon: DollarSign,
      color: 'bg-green-100 text-green-800',
      permissions: [
        { key: 'finance.view', name: 'View Finances', description: 'View financial data' },
        { key: 'finance.fares', name: 'Manage Fares', description: 'Set fare policies' },
        { key: 'finance.payments', name: 'Process Payments', description: 'Handle payment processing' },
        { key: 'finance.refunds', name: 'Process Refunds', description: 'Handle refund requests' },
        { key: 'finance.reports', name: 'Financial Reports', description: 'Generate financial reports' },
        { key: 'finance.audit', name: 'Audit Trail', description: 'View financial audit logs' }
      ]
    },
    reports: {
      name: 'Reports & Analytics',
      icon: FileText,
      color: 'bg-yellow-100 text-yellow-800',
      permissions: [
        { key: 'reports.view', name: 'View Reports', description: 'Access reports section' },
        { key: 'reports.create', name: 'Create Reports', description: 'Generate custom reports' },
        { key: 'reports.export', name: 'Export Reports', description: 'Export report data' },
        { key: 'reports.schedule', name: 'Schedule Reports', description: 'Set automated reports' },
        { key: 'reports.analytics', name: 'Advanced Analytics', description: 'Access advanced analytics' }
      ]
    },
    system: {
      name: 'System Administration',
      icon: Settings,
      color: 'bg-red-100 text-red-800',
      permissions: [
        { key: 'system.view', name: 'View System Status', description: 'Monitor system health' },
        { key: 'system.config', name: 'System Config', description: 'Modify system settings' },
        { key: 'system.backup', name: 'Backup Management', description: 'Manage system backups' },
        { key: 'system.logs', name: 'View Logs', description: 'Access system logs' },
        { key: 'system.maintenance', name: 'Maintenance Mode', description: 'Enable maintenance mode' },
        { key: 'system.security', name: 'Security Settings', description: 'Manage security settings' }
      ]
    }
  };

  useEffect(() => {
    fetchRoles();
    fetchPermissions();
    fetchUsers();
  }, []);

  const fetchRoles = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/admin/rbac/roles', {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      
      if (response.ok) {
        const data = await response.json();
        setRoles(data.roles || []);
      }
    } catch (error) {
      console.error('Error fetching roles:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchPermissions = async () => {
    try {
      const response = await fetch('/api/admin/rbac/permissions', {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      
      if (response.ok) {
        const data = await response.json();
        setPermissions(data.permissions || []);
      }
    } catch (error) {
      console.error('Error fetching permissions:', error);
    }
  };

  const fetchUsers = async () => {
    try {
      const response = await fetch('/api/admin/users?limit=100', {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      
      if (response.ok) {
        const data = await response.json();
        setUsers(data.users || []);
      }
    } catch (error) {
      console.error('Error fetching users:', error);
    }
  };

  const handleCreateRole = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch('/api/admin/rbac/roles', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(newRole)
      });

      if (response.ok) {
        setShowCreateRoleModal(false);
        setNewRole({
          name: '',
          description: '',
          permissions: [],
          isActive: true,
          priority: 1
        });
        fetchRoles();
      }
    } catch (error) {
      console.error('Error creating role:', error);
    }
  };

  const handleUpdateRole = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch(`/api/admin/rbac/roles/${editingRole._id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(editingRole)
      });

      if (response.ok) {
        setShowEditRoleModal(false);
        setEditingRole(null);
        fetchRoles();
      }
    } catch (error) {
      console.error('Error updating role:', error);
    }
  };

  const handleDeleteRole = async (roleId) => {
    if (window.confirm('Are you sure you want to delete this role?')) {
      try {
        const response = await fetch(`/api/admin/rbac/roles/${roleId}`, {
          method: 'DELETE',
          headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
        });

        if (response.ok) {
          fetchRoles();
        }
      } catch (error) {
        console.error('Error deleting role:', error);
      }
    }
  };

  const togglePermission = (permissionKey, isRole = false) => {
    if (isRole) {
      const currentPermissions = editingRole.permissions || [];
      const hasPermission = currentPermissions.includes(permissionKey);
      
      setEditingRole({
        ...editingRole,
        permissions: hasPermission 
          ? currentPermissions.filter(p => p !== permissionKey)
          : [...currentPermissions, permissionKey]
      });
    } else {
      const currentPermissions = newRole.permissions || [];
      const hasPermission = currentPermissions.includes(permissionKey);
      
      setNewRole({
        ...newRole,
        permissions: hasPermission 
          ? currentPermissions.filter(p => p !== permissionKey)
          : [...currentPermissions, permissionKey]
      });
    }
  };

  const getRoleIcon = (roleName) => {
    const icons = {
      admin: Crown,
      depot_manager: Star,
      driver: UserCheck,
      conductor: UserCheck,
      passenger: Users,
      support: Award
    };
    return icons[roleName.toLowerCase()] || Shield;
  };

  const getRolePriority = (priority) => {
    const priorities = {
      1: { label: 'Highest', color: 'bg-red-100 text-red-800' },
      2: { label: 'High', color: 'bg-orange-100 text-orange-800' },
      3: { label: 'Medium', color: 'bg-yellow-100 text-yellow-800' },
      4: { label: 'Low', color: 'bg-green-100 text-green-800' },
      5: { label: 'Lowest', color: 'bg-gray-100 text-gray-800' }
    };
    return priorities[priority] || priorities[3];
  };

  const filteredRoles = roles.filter(role =>
    role.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    role.description?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">RBAC Management</h1>
              <p className="text-gray-600 mt-1">Role-Based Access Control with granular permissions</p>
            </div>
            <div className="flex items-center space-x-3">
              <button
                onClick={() => {
                  fetchRoles();
                  fetchPermissions();
                  fetchUsers();
                }}
                className="px-4 py-2 text-gray-600 hover:text-gray-900 transition-colors"
              >
                <RefreshCw className="w-5 h-5" />
              </button>
              <button
                onClick={() => setShowCreateRoleModal(true)}
                className="bg-gradient-to-r from-blue-600 to-blue-700 text-white px-6 py-2 rounded-lg hover:from-blue-700 hover:to-blue-800 transition-all duration-200 flex items-center space-x-2 shadow-lg"
              >
                <Plus className="w-5 h-5" />
                <span>Create Role</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="px-6 py-6">
        {/* Tab Navigation */}
        <div className="mb-6">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8">
              {[
                { key: 'roles', label: 'Roles & Permissions', icon: Shield },
                { key: 'users', label: 'User Assignments', icon: Users },
                { key: 'permissions', label: 'Permission Matrix', icon: Key },
                { key: 'audit', label: 'Audit Logs', icon: FileText }
              ].map((tab) => {
                const TabIcon = tab.icon;
                return (
                  <button
                    key={tab.key}
                    onClick={() => setSelectedTab(tab.key)}
                    className={`py-2 px-1 border-b-2 font-medium text-sm flex items-center space-x-2 ${
                      selectedTab === tab.key
                        ? 'border-blue-500 text-blue-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    <TabIcon className="w-4 h-4" />
                    <span>{tab.label}</span>
                  </button>
                );
              })}
            </nav>
          </div>
        </div>

        {/* Roles Tab */}
        {selectedTab === 'roles' && (
          <div className="space-y-6">
            {/* Search and Filters */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="flex items-center space-x-4">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    type="text"
                    placeholder="Search roles..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>
            </div>

            {/* Roles Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredRoles.map((role) => {
                const RoleIcon = getRoleIcon(role.name);
                const priorityConfig = getRolePriority(role.priority);
                
                return (
                  <div key={role._id} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-all">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center space-x-3">
                        <div className="p-2 bg-blue-100 rounded-lg">
                          <RoleIcon className="w-6 h-6 text-blue-600" />
                        </div>
                        <div>
                          <h3 className="text-lg font-semibold text-gray-900">{role.name}</h3>
                          <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${priorityConfig.color}`}>
                            {priorityConfig.label} Priority
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => {
                            setEditingRole(role);
                            setShowEditRoleModal(true);
                          }}
                          className="p-2 text-gray-400 hover:text-blue-600 transition-colors"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteRole(role._id)}
                          className="p-2 text-gray-400 hover:text-red-600 transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                    
                    <p className="text-sm text-gray-600 mb-4">{role.description}</p>
                    
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Permissions:</span>
                        <span className="font-medium">{role.permissions?.length || 0}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Users:</span>
                        <span className="font-medium">
                          {users.filter(u => u.role === role.name).length}
                        </span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Status:</span>
                        <span className={`font-medium ${role.isActive ? 'text-green-600' : 'text-red-600'}`}>
                          {role.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Permission Matrix Tab */}
        {selectedTab === 'permissions' && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">Permission Matrix</h3>
              <p className="text-sm text-gray-600 mt-1">Comprehensive view of all permissions across roles</p>
            </div>
            
            <div className="p-6 space-y-8">
              {Object.entries(permissionCategories).map(([categoryKey, category]) => {
                const CategoryIcon = category.icon;
                
                return (
                  <div key={categoryKey} className="border border-gray-200 rounded-lg overflow-hidden">
                    <div className={`px-4 py-3 ${category.color} flex items-center space-x-2`}>
                      <CategoryIcon className="w-5 h-5" />
                      <span className="font-semibold">{category.name}</span>
                    </div>
                    
                    <div className="p-4">
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                        {category.permissions.map((permission) => (
                          <div key={permission.key} className="bg-gray-50 p-4 rounded-lg">
                            <div className="flex items-center justify-between mb-2">
                              <h5 className="font-medium text-gray-900">{permission.name}</h5>
                              <div className="flex items-center space-x-2">
                                {roles.map((role) => (
                                  <div key={role._id} className="flex items-center space-x-1">
                                    <span className="text-xs text-gray-500">{role.name}</span>
                                    {role.permissions?.includes(permission.key) ? (
                                      <CheckCircle className="w-4 h-4 text-green-600" />
                                    ) : (
                                      <XCircle className="w-4 h-4 text-red-400" />
                                    )}
                                  </div>
                                ))}
                              </div>
                            </div>
                            <p className="text-sm text-gray-600">{permission.description}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* User Assignments Tab */}
        {selectedTab === 'users' && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">User Role Assignments</h3>
              <p className="text-sm text-gray-600 mt-1">Manage user roles and permissions</p>
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Current Role</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Permissions</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {users.slice(0, 20).map((user) => {
                    const userRole = roles.find(r => r.name === user.role);
                    const UserIcon = getRoleIcon(user.role || 'user');
                    
                    return (
                      <tr key={user._id} className="hover:bg-gray-50">
                        <td className="px-6 py-4">
                          <div className="flex items-center space-x-3">
                            <div className="p-2 bg-gray-100 rounded-lg">
                              <UserIcon className="w-5 h-5 text-gray-600" />
                            </div>
                            <div>
                              <div className="text-sm font-medium text-gray-900">{user.name}</div>
                              <div className="text-sm text-gray-500">{user.email}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                            {user.role || 'No Role'}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm text-gray-900">
                            {userRole?.permissions?.length || 0} permissions
                          </div>
                          <div className="text-xs text-gray-500">
                            {userRole?.permissions?.slice(0, 3).join(', ')}
                            {userRole?.permissions?.length > 3 && '...'}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                            user.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                          }`}>
                            {user.status === 'active' ? 'Active' : 'Inactive'}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center space-x-2">
                            <button className="p-2 text-gray-400 hover:text-blue-600 transition-colors">
                              <Edit3 className="w-4 h-4" />
                            </button>
                            <button className="p-2 text-gray-400 hover:text-green-600 transition-colors">
                              <Eye className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Create Role Modal */}
      {showCreateRoleModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl mx-4 max-h-[90vh] overflow-y-auto">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">Create New Role</h3>
              <p className="text-sm text-gray-600 mt-1">Define role permissions with granular control</p>
            </div>
            <form onSubmit={handleCreateRole} className="p-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Role Name</label>
                  <input
                    type="text"
                    value={newRole.name}
                    onChange={(e) => setNewRole({...newRole, name: e.target.value})}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Enter role name"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Priority Level</label>
                  <select
                    value={newRole.priority}
                    onChange={(e) => setNewRole({...newRole, priority: parseInt(e.target.value)})}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value={1}>Highest (1)</option>
                    <option value={2}>High (2)</option>
                    <option value={3}>Medium (3)</option>
                    <option value={4}>Low (4)</option>
                    <option value={5}>Lowest (5)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                <textarea
                  value={newRole.description}
                  onChange={(e) => setNewRole({...newRole, description: e.target.value})}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  rows="3"
                  placeholder="Describe the role and its responsibilities"
                />
              </div>

              {/* Permissions Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-4">Permissions</label>
                <div className="space-y-6">
                  {Object.entries(permissionCategories).map(([categoryKey, category]) => {
                    const CategoryIcon = category.icon;
                    
                    return (
                      <div key={categoryKey} className="border border-gray-200 rounded-lg overflow-hidden">
                        <div className={`px-4 py-3 ${category.color} flex items-center space-x-2`}>
                          <CategoryIcon className="w-5 h-5" />
                          <span className="font-semibold">{category.name}</span>
                        </div>
                        
                        <div className="p-4">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            {category.permissions.map((permission) => (
                              <label key={permission.key} className="flex items-start space-x-3 cursor-pointer">
                                <input
                                  type="checkbox"
                                  checked={newRole.permissions.includes(permission.key)}
                                  onChange={() => togglePermission(permission.key)}
                                  className="mt-1 rounded focus:ring-2 focus:ring-blue-500"
                                />
                                <div className="flex-1">
                                  <div className="text-sm font-medium text-gray-900">{permission.name}</div>
                                  <div className="text-xs text-gray-500">{permission.description}</div>
                                </div>
                              </label>
                            ))}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200">
                <button
                  type="button"
                  onClick={() => {
                    setShowCreateRoleModal(false);
                    setNewRole({
                      name: '',
                      description: '',
                      permissions: [],
                      isActive: true,
                      priority: 1
                    });
                  }}
                  className="px-6 py-3 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
                >
                  <Save className="w-5 h-5" />
                  <span>Create Role</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Role Modal */}
      {showEditRoleModal && editingRole && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl mx-4 max-h-[90vh] overflow-y-auto">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">Edit Role: {editingRole.name}</h3>
            </div>
            <form onSubmit={handleUpdateRole} className="p-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Role Name</label>
                  <input
                    type="text"
                    value={editingRole.name || ''}
                    onChange={(e) => setEditingRole({...editingRole, name: e.target.value})}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Priority Level</label>
                  <select
                    value={editingRole.priority || 3}
                    onChange={(e) => setEditingRole({...editingRole, priority: parseInt(e.target.value)})}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value={1}>Highest (1)</option>
                    <option value={2}>High (2)</option>
                    <option value={3}>Medium (3)</option>
                    <option value={4}>Low (4)</option>
                    <option value={5}>Lowest (5)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                <textarea
                  value={editingRole.description || ''}
                  onChange={(e) => setEditingRole({...editingRole, description: e.target.value})}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  rows="3"
                />
              </div>

              {/* Permissions Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-4">Permissions</label>
                <div className="space-y-6">
                  {Object.entries(permissionCategories).map(([categoryKey, category]) => {
                    const CategoryIcon = category.icon;
                    
                    return (
                      <div key={categoryKey} className="border border-gray-200 rounded-lg overflow-hidden">
                        <div className={`px-4 py-3 ${category.color} flex items-center space-x-2`}>
                          <CategoryIcon className="w-5 h-5" />
                          <span className="font-semibold">{category.name}</span>
                        </div>
                        
                        <div className="p-4">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            {category.permissions.map((permission) => (
                              <label key={permission.key} className="flex items-start space-x-3 cursor-pointer">
                                <input
                                  type="checkbox"
                                  checked={(editingRole.permissions || []).includes(permission.key)}
                                  onChange={() => togglePermission(permission.key, true)}
                                  className="mt-1 rounded focus:ring-2 focus:ring-blue-500"
                                />
                                <div className="flex-1">
                                  <div className="text-sm font-medium text-gray-900">{permission.name}</div>
                                  <div className="text-xs text-gray-500">{permission.description}</div>
                                </div>
                              </label>
                            ))}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200">
                <button
                  type="button"
                  onClick={() => {
                    setShowEditRoleModal(false);
                    setEditingRole(null);
                  }}
                  className="px-6 py-3 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
                >
                  <Save className="w-5 h-5" />
                  <span>Update Role</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminRBAC;
