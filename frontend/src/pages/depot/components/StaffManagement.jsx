import React, { useState, useEffect } from 'react';
import { useAuth } from '../../../context/AuthContext';
import './StaffManagement.css';

const StaffManagement = () => {
  const { user } = useAuth();
  const [staff, setStaff] = useState([]);
  const [, setDrivers] = useState([]);
  const [, setConductors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedStaff, setSelectedStaff] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterRole, setFilterRole] = useState('all');
  const [activeTab, setActiveTab] = useState('drivers');
  const [stats, setStats] = useState({
    totalDrivers: 0,
    activeDrivers: 0,
    totalConductors: 0,
    activeConductors: 0
  });

  // Form states
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    role: 'driver',
    employeeId: '',
    licenseNumber: '',
    licenseExpiry: '',
    address: '',
    emergencyContact: '',
    joiningDate: '',
    salary: 0,
    status: 'active',
    notes: ''
  });

  const staffRoles = [
    { value: 'driver', label: 'Driver' },
    { value: 'conductor', label: 'Conductor' }
  ];

  const staffStatuses = [
    { value: 'active', label: 'Active' },
    { value: 'inactive', label: 'Inactive' },
    { value: 'suspended', label: 'Suspended' },
    { value: 'on_leave', label: 'On Leave' }
  ];

  useEffect(() => {
    fetchStaff();
  }, []);

  const fetchStaff = async () => {
    try {
      setLoading(true);
      // Use different endpoints based on user role
      const userRole = JSON.parse(localStorage.getItem('user') || '{}').role;
      console.log('User role:', userRole);
      
      // For now, use the original endpoints until the new ones are working
      const driverEndpoint = '/api/driver/all';
      const conductorEndpoint = '/api/conductor/all';
      console.log('Using endpoints:', { driverEndpoint, conductorEndpoint });
      
      const [driversRes, conductorsRes] = await Promise.all([
        fetch(driverEndpoint, {
          headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
        }),
        fetch(conductorEndpoint, {
          headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
        })
      ]);

      if (!driversRes.ok) {
        console.error('Driver fetch failed:', driversRes.status, await driversRes.text());
      }
      if (!conductorsRes.ok) {
        console.error('Conductor fetch failed:', conductorsRes.status, await conductorsRes.text());
      }
      
      const driversData = driversRes.ok ? await driversRes.json() : { data: [] };
      const conductorsData = conductorsRes.ok ? await conductorsRes.json() : { data: [] };

      const driversList = Array.isArray(driversData.data) ? driversData.data : (driversData.data?.drivers || []);
      const conductorsList = Array.isArray(conductorsData.data) ? conductorsData.data : (conductorsData.data?.conductors || []);

      // Normalize shape and add role to enable filtering
      const driversMapped = driversList.map(d => ({
        ...d,
        role: 'driver',
        employeeId: d.employeeCode || d.employeeId || d.driverId || '',
        licenseNumber: d.drivingLicense?.licenseNumber || d.licenseNumber || '',
        licenseExpiry: d.drivingLicense?.expiryDate || d.licenseExpiry || '',
        joiningDate: d.joiningDate || d.createdAt
      }));

      const conductorsMapped = conductorsList.map(c => ({
        ...c,
        role: 'conductor',
        employeeId: c.employeeCode || c.employeeId || c.conductorId || '',
        licenseNumber: c.licenseNumber || '',
        licenseExpiry: c.licenseExpiry || '',
        joiningDate: c.joiningDate || c.createdAt
      }));

      setDrivers(driversMapped);
      setConductors(conductorsMapped);

      // Calculate active drivers as those with a duty assigned/active today
      const today = new Date();
      const yyyy = today.getFullYear();
      const mm = String(today.getMonth() + 1).padStart(2, '0');
      const dd = String(today.getDate()).padStart(2, '0');
      const todayStr = `${yyyy}-${mm}-${dd}`;

      let activeAssignedDriverCount = 0;
      let activeAssignedConductorCount = 0;
      try {
        const tripsQueryParams = new URLSearchParams({ date: todayStr });
        // If depot is available, scope by depotId for safety (backend already scopes by auth)
        const depotId = JSON.parse(localStorage.getItem('user') || '{}').depotId || user?.depotId;
        if (depotId) tripsQueryParams.append('depotId', depotId);

        const dutiesRes = await fetch(`/api/depot/trips?${tripsQueryParams.toString()}`, {
          headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
        });
        if (dutiesRes.ok) {
          const dutiesJson = await dutiesRes.json();
          const duties = Array.isArray(dutiesJson.data?.trips) ? dutiesJson.data.trips : (Array.isArray(dutiesJson.data) ? dutiesJson.data : []);
          const activeStatuses = new Set(['scheduled', 'running', 'in-progress', 'on-break', 'assigned', 'started']);
          const driverIdsSet = new Set(
            duties
              .filter(d => activeStatuses.has(d.status))
              .map(d => {
                const drv = d.driverId; // could be id or populated object
                if (!drv) return null;
                if (typeof drv === 'string') return drv;
                if (typeof drv === 'object') return drv._id || drv.id || null;
                return null;
              })
              .filter(Boolean)
          );
          activeAssignedDriverCount = driverIdsSet.size;

          const conductorIdsSet = new Set(
            duties
              .filter(d => activeStatuses.has(d.status))
              .map(d => {
                const cnd = d.conductorId;
                if (!cnd) return null;
                if (typeof cnd === 'string') return cnd;
                if (typeof cnd === 'object') return cnd._id || cnd.id || null;
                return null;
              })
              .filter(Boolean)
          );
          activeAssignedConductorCount = conductorIdsSet.size;
        }
      } catch (e) {
        // Fallback silently; keep previous calculation if duty API fails
        console.warn('Failed to fetch duties for active drivers calc:', e);
      }

      setStats(prev => ({
        ...prev,
        totalDrivers: driversList.length,
        activeDrivers: activeAssignedDriverCount,
        totalConductors: conductorsList.length,
        activeConductors: activeAssignedConductorCount
      }));

      setStaff([...driversMapped, ...conductorsMapped]);
    } catch (error) {
      console.error('Error fetching staff:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddStaff = async (e) => {
    e.preventDefault();
    try {
      const endpoint = formData.role === 'driver' ? '/api/driver' : '/api/conductor';

      // Map UI form to backend validation shape
      const depotId = JSON.parse(localStorage.getItem('user') || '{}').depotId || user?.depotId;
      const usernameFallback = (formData.email || formData.phone || `${formData.name}`)
        .toLowerCase()
        .replace(/[^a-z0-9_]/g, '_')
        .slice(0, 20);
      const temporaryPassword = (formData.password && formData.password.length >= 8)
        ? formData.password
        : 'TempPass@123';

      // Parse emergency contact from a single-line input like "Name, 9123456789"
      const parseEmergency = (value) => {
        if (!value || typeof value !== 'string') return undefined;
        const digitsMatch = value.match(/([6-9]\d{9})/);
        const phone = digitsMatch ? digitsMatch[1] : '';
        const namePart = value.replace(/([6-9]\d{9})/g, '').replace(/[,-]/g, ' ').replace(/\s+/g, ' ').trim();
        const name = namePart || '';
        // Only include if both look valid
        if (name.length >= 2 && /^[6-9]\d{9}$/.test(phone)) {
          return { name, phone, relationship: '' };
        }
        return undefined; // omit to satisfy optional() validator
      };

      const payloadBase = {
        name: formData.name,
        phone: String(formData.phone || '').replace(/\D/g, ''),
        email: formData.email,
        employeeCode: formData.employeeId || formData.employeeCode || undefined,
        username: formData.username || usernameFallback,
        password: temporaryPassword,
        depotId,
        address: formData.address,
        // Only include emergencyContact if parsable/valid
        ...(typeof formData.emergencyContact === 'object' && formData.emergencyContact
          ? { emergencyContact: formData.emergencyContact }
          : (() => {
              const ec = parseEmergency(formData.emergencyContact);
              return ec ? { emergencyContact: ec } : {};
            })()
        ),
        salary: typeof formData.salary === 'object' ? formData.salary : { basic: Number(formData.salary) || 0, allowances: 0, bonus: 0 },
        status: formData.status || 'active',
        notes: formData.notes || ''
      };

      const payload = formData.role === 'driver'
        ? {
            ...payloadBase,
            drivingLicense: {
              licenseNumber: formData.licenseNumber || 'TEMP000000',
              type: formData.licenseType || 'LMV',
              issueDate: formData.licenseIssueDate || new Date().toISOString().slice(0, 10),
              expiryDate: formData.licenseExpiry || new Date(Date.now() + 365*24*60*60*1000).toISOString().slice(0,10),
              issuingAuthority: formData.issuingAuthority || 'RTO'
            }
          }
        : payloadBase;

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(payload)
      });

      if (response.ok) {
        setShowAddModal(false);
        resetForm();
        fetchStaff();
      } else {
        let error;
        try { error = await response.json(); } catch { error = {}; }
        const messages = Array.isArray(error.errors)
          ? error.errors.map(e => `${e.path || e.param || 'field'}: ${e.msg}`).join('\n')
          : '';
        alert(error.message + (messages ? `\n${messages}` : '') || 'Failed to add staff member');
      }
    } catch (error) {
      console.error('Error adding staff:', error);
      alert('Failed to add staff member');
    }
  };

  const handleEditStaff = async (e) => {
    e.preventDefault();
    try {
      const userRole = JSON.parse(localStorage.getItem('user') || '{}').role;
      
      // Only admins can edit staff
      if (userRole !== 'admin') {
        alert('Only administrators can edit staff members');
        return;
      }
      
      const endpoint = selectedStaff.role === 'driver' ? 
        `/api/driver/${selectedStaff._id}` : 
        `/api/conductor/${selectedStaff._id}`;
      
      const response = await fetch(endpoint, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(formData)
      });

      if (response.ok) {
        setShowEditModal(false);
        resetForm();
        fetchStaff();
      } else {
        const error = await response.json();
        alert(error.message || 'Failed to update staff member');
      }
    } catch (error) {
      console.error('Error updating staff:', error);
      alert('Failed to update staff member');
    }
  };

  const handleDeleteStaff = async () => {
    try {
      const userRole = JSON.parse(localStorage.getItem('user') || '{}').role;
      
      // Only admins can delete staff
      if (userRole !== 'admin') {
        alert('Only administrators can delete staff members');
        return;
      }
      
      const endpoint = selectedStaff.role === 'driver' ? 
        `/api/driver/${selectedStaff._id}` : 
        `/api/conductor/${selectedStaff._id}`;
      
      const response = await fetch(endpoint, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (response.ok) {
        setShowDeleteModal(false);
        setSelectedStaff(null);
        fetchStaff();
      } else {
        const error = await response.json();
        alert(error.message || 'Failed to delete staff member');
      }
    } catch (error) {
      console.error('Error deleting staff:', error);
      alert('Failed to delete staff member');
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      email: '',
      phone: '',
      role: 'driver',
      employeeId: '',
      licenseNumber: '',
      licenseExpiry: '',
      address: '',
      emergencyContact: '',
      joiningDate: '',
      salary: 0,
      status: 'active',
      notes: ''
    });
  };

  const openEditModal = (staffMember) => {
    setSelectedStaff(staffMember);
    setFormData({
      name: staffMember.name || '',
      email: staffMember.email || '',
      phone: staffMember.phone || '',
      role: staffMember.role || 'driver',
      employeeId: staffMember.employeeId || '',
      licenseNumber: staffMember.licenseNumber || '',
      licenseExpiry: staffMember.licenseExpiry ? new Date(staffMember.licenseExpiry).toISOString().slice(0, 10) : '',
      address: staffMember.address || '',
      emergencyContact: staffMember.emergencyContact || '',
      joiningDate: staffMember.joiningDate ? new Date(staffMember.joiningDate).toISOString().slice(0, 10) : '',
      salary: staffMember.salary || 0,
      status: staffMember.status || 'active',
      notes: staffMember.notes || ''
    });
    setShowEditModal(true);
  };

  const openDeleteModal = (staffMember) => {
    setSelectedStaff(staffMember);
    setShowDeleteModal(true);
  };

  const filteredStaff = staff.filter(staffMember => {
    const matchesSearch = 
      staffMember.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      staffMember.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      staffMember.employeeId?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      staffMember.licenseNumber?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = filterStatus === 'all' || staffMember.status === filterStatus;
    const matchesRole = filterRole === 'all' || staffMember.role === filterRole;
    
    return matchesSearch && matchesStatus && matchesRole;
  });

  const getStatusColor = (status) => {
    switch (status) {
      case 'active': return 'green';
      case 'inactive': return 'red';
      case 'suspended': return 'orange';
      case 'on_leave': return 'blue';
      default: return 'gray';
    }
  };

  const getStatusLabel = (status) => {
    return staffStatuses.find(s => s.value === status)?.label || status;
  };

  const getRoleLabel = (role) => {
    return staffRoles.find(r => r.value === role)?.label || role;
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-IN');
  };

  if (loading) {
    return (
      <div className="staff-loading">
        <div className="loading-spinner"></div>
        <h3>Loading Staff Management...</h3>
      </div>
    );
  }

  return (
    <div className="staff-management">
      <div className="staff-header">
        <div className="header-left">
          <h1>Staff Management</h1>
          <p>Manage drivers, conductors, and depot personnel</p>
        </div>
        <div className="header-right">
          <button 
            className="add-staff-btn"
            onClick={() => setShowAddModal(true)}
          >
            <svg fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
            </svg>
            Add Staff
          </button>
        </div>
      </div>

      {/* Banner removed per request */}

      {/* Stats Cards */}
      <div className="staff-stats">
        <div className="stat-card">
          <div className="stat-icon blue">
            <svg fill="currentColor" viewBox="0 0 20 20">
              <path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3z" />
            </svg>
          </div>
          <div className="stat-content">
            <h3>{stats.totalDrivers}</h3>
            <p>Total Drivers</p>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon green">
            <svg fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="stat-content">
            <h3>{stats.activeDrivers}</h3>
            <p>Active Drivers</p>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon orange">
            <svg fill="currentColor" viewBox="0 0 20 20">
              <path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3z" />
            </svg>
          </div>
          <div className="stat-content">
            <h3>{stats.totalConductors}</h3>
            <p>Total Conductors</p>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon purple">
            <svg fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="stat-content">
            <h3>{stats.activeConductors}</h3>
            <p>Active Conductors</p>
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="staff-tabs">
        <button 
          className={`tab-btn ${activeTab === 'all' ? 'active' : ''}`}
          onClick={() => setActiveTab('all')}
        >
          All Staff
        </button>
        <button 
          className={`tab-btn ${activeTab === 'drivers' ? 'active' : ''}`}
          onClick={() => setActiveTab('drivers')}
        >
          Drivers
        </button>
        <button 
          className={`tab-btn ${activeTab === 'conductors' ? 'active' : ''}`}
          onClick={() => setActiveTab('conductors')}
        >
          Conductors
        </button>
      </div>

      {/* Controls */}
      <div className="staff-controls">
        <div className="search-section">
          <div className="search-input-wrapper">
            <svg className="search-icon" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414L10.89 9.89A6 6 0 012 8z" clipRule="evenodd" />
            </svg>
            <input
              type="text"
              placeholder="Search staff by name, email, or ID..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="search-input"
            />
          </div>
        </div>

        <div className="filter-section">
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="filter-select"
          >
            <option value="all">All Status</option>
            {staffStatuses.map(status => (
              <option key={status.value} value={status.value}>{status.label}</option>
            ))}
          </select>

          <select
            value={filterRole}
            onChange={(e) => setFilterRole(e.target.value)}
            className="filter-select"
          >
            <option value="all">All Roles</option>
            {staffRoles.map(role => (
              <option key={role.value} value={role.value}>{role.label}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Staff Table */}
      <div className="staff-table-container">
        <table className="staff-table">
          <thead>
            <tr>
              <th>Staff Member</th>
              <th>Role</th>
              <th>Contact</th>
              <th>License/ID</th>
              <th>Joining Date</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredStaff.map((staffMember) => (
              <tr key={staffMember._id}>
                <td>
                  <div className="staff-info">
                    <div className="staff-avatar">
                      {staffMember.name?.charAt(0) || 'S'}
                    </div>
                    <div className="staff-details">
                      <div className="staff-name">{staffMember.name}</div>
                      <div className="staff-id">ID: {staffMember.employeeId}</div>
                    </div>
                  </div>
                </td>
                <td>
                  <span className={`role-badge ${staffMember.role}`}>
                    {getRoleLabel(staffMember.role)}
                  </span>
                </td>
                <td>
                  <div className="contact-info">
                    <div className="contact-email">{staffMember.email}</div>
                    <div className="contact-phone">{staffMember.phone}</div>
                  </div>
                </td>
                <td>
                  <div className="license-info">
                    <div className="license-number">
                      {staffMember.role === 'driver' ? 'License: ' : 'ID: '}
                      {staffMember.licenseNumber || staffMember.employeeId}
                    </div>
                    {staffMember.licenseExpiry && (
                      <div className="license-expiry">
                        Expires: {formatDate(staffMember.licenseExpiry)}
                      </div>
                    )}
                  </div>
                </td>
                <td>
                  <div className="joining-info">
                    {staffMember.joiningDate ? formatDate(staffMember.joiningDate) : 'N/A'}
                  </div>
                </td>
                <td>
                  <span className={`status-badge ${getStatusColor(staffMember.status)}`}>
                    {getStatusLabel(staffMember.status)}
                  </span>
                </td>
                <td>
                  <div className="action-buttons">
                    {JSON.parse(localStorage.getItem('user') || '{}').role === 'admin' && (
                      <>
                        <button
                          className="action-btn view"
                          onClick={() => openEditModal(staffMember)}
                          title="View/Edit"
                        >
                          <svg fill="currentColor" viewBox="0 0 20 20">
                            <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                            <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" />
                          </svg>
                        </button>
                        <button
                          className="action-btn delete"
                          onClick={() => openDeleteModal(staffMember)}
                          title="Delete"
                        >
                          <svg fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                          </svg>
                        </button>
                      </>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {filteredStaff.length === 0 && (
          <div className="no-staff">
            <svg fill="currentColor" viewBox="0 0 20 20">
              <path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3z" />
            </svg>
            <h3>No staff members found</h3>
            <p>Try adjusting your search or filters</p>
          </div>
        )}
      </div>

      {/* Add Staff Modal */}
      {showAddModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h2>Add New Staff Member</h2>
              <button 
                className="modal-close"
                onClick={() => {
                  setShowAddModal(false);
                  resetForm();
                }}
              >
                <svg fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </button>
            </div>
            <form onSubmit={handleAddStaff} className="staff-form">
              <div className="form-grid">
                <div className="form-group">
                  <label>Full Name *</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Email *</label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({...formData, email: e.target.value})}
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Phone *</label>
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({...formData, phone: e.target.value})}
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Role *</label>
                  <select
                    value={formData.role}
                    onChange={(e) => setFormData({...formData, role: e.target.value})}
                    required
                  >
                    {staffRoles.map(role => (
                      <option key={role.value} value={role.value}>{role.label}</option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label>Employee ID *</label>
                  <input
                    type="text"
                    value={formData.employeeId}
                    onChange={(e) => setFormData({...formData, employeeId: e.target.value})}
                    required
                  />
                </div>

                <div className="form-group">
                  <label>{formData.role === 'driver' ? 'License Number' : 'ID Number'} *</label>
                  <input
                    type="text"
                    value={formData.licenseNumber}
                    onChange={(e) => setFormData({...formData, licenseNumber: e.target.value})}
                    required
                  />
                </div>

                {formData.role === 'driver' && (
                  <div className="form-group">
                    <label>License Expiry Date</label>
                    <input
                      type="date"
                      value={formData.licenseExpiry}
                      onChange={(e) => setFormData({...formData, licenseExpiry: e.target.value})}
                    />
                  </div>
                )}

                <div className="form-group">
                  <label>Joining Date</label>
                  <input
                    type="date"
                    value={formData.joiningDate}
                    onChange={(e) => setFormData({...formData, joiningDate: e.target.value})}
                  />
                </div>

                <div className="form-group">
                  <label>Salary (₹)</label>
                  <input
                    type="number"
                    value={formData.salary}
                    onChange={(e) => setFormData({...formData, salary: parseFloat(e.target.value)})}
                    min="0"
                    step="0.01"
                  />
                </div>

                <div className="form-group">
                  <label>Status</label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({...formData, status: e.target.value})}
                  >
                    {staffStatuses.map(status => (
                      <option key={status.value} value={status.value}>{status.label}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label>Address</label>
                <textarea
                  value={formData.address}
                  onChange={(e) => setFormData({...formData, address: e.target.value})}
                  rows="3"
                />
              </div>

              <div className="form-group">
                <label>Emergency Contact</label>
                <input
                  type="tel"
                  value={formData.emergencyContact}
                  onChange={(e) => setFormData({...formData, emergencyContact: e.target.value})}
                />
              </div>

              <div className="form-group">
                <label>Notes</label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({...formData, notes: e.target.value})}
                  rows="3"
                />
              </div>

              <div className="modal-actions">
                <button type="button" className="btn-secondary" onClick={() => {
                  setShowAddModal(false);
                  resetForm();
                }}>
                  Cancel
                </button>
                <button type="submit" className="btn-primary">
                  Add Staff Member
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Staff Modal */}
      {showEditModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h2>Edit Staff Member - {selectedStaff?.name}</h2>
              <button 
                className="modal-close"
                onClick={() => {
                  setShowEditModal(false);
                  resetForm();
                }}
              >
                <svg fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </button>
            </div>
            <form onSubmit={handleEditStaff} className="staff-form">
              {/* Same form fields as Add Modal */}
              <div className="form-grid">
                <div className="form-group">
                  <label>Full Name *</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Email *</label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({...formData, email: e.target.value})}
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Phone *</label>
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({...formData, phone: e.target.value})}
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Role *</label>
                  <select
                    value={formData.role}
                    onChange={(e) => setFormData({...formData, role: e.target.value})}
                    required
                  >
                    {staffRoles.map(role => (
                      <option key={role.value} value={role.value}>{role.label}</option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label>Employee ID *</label>
                  <input
                    type="text"
                    value={formData.employeeId}
                    onChange={(e) => setFormData({...formData, employeeId: e.target.value})}
                    required
                  />
                </div>

                <div className="form-group">
                  <label>{formData.role === 'driver' ? 'License Number' : 'ID Number'} *</label>
                  <input
                    type="text"
                    value={formData.licenseNumber}
                    onChange={(e) => setFormData({...formData, licenseNumber: e.target.value})}
                    required
                  />
                </div>

                {formData.role === 'driver' && (
                  <div className="form-group">
                    <label>License Expiry Date</label>
                    <input
                      type="date"
                      value={formData.licenseExpiry}
                      onChange={(e) => setFormData({...formData, licenseExpiry: e.target.value})}
                    />
                  </div>
                )}

                <div className="form-group">
                  <label>Joining Date</label>
                  <input
                    type="date"
                    value={formData.joiningDate}
                    onChange={(e) => setFormData({...formData, joiningDate: e.target.value})}
                  />
                </div>

                <div className="form-group">
                  <label>Salary (₹)</label>
                  <input
                    type="number"
                    value={formData.salary}
                    onChange={(e) => setFormData({...formData, salary: parseFloat(e.target.value)})}
                    min="0"
                    step="0.01"
                  />
                </div>

                <div className="form-group">
                  <label>Status</label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({...formData, status: e.target.value})}
                  >
                    {staffStatuses.map(status => (
                      <option key={status.value} value={status.value}>{status.label}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label>Address</label>
                <textarea
                  value={formData.address}
                  onChange={(e) => setFormData({...formData, address: e.target.value})}
                  rows="3"
                />
              </div>

              <div className="form-group">
                <label>Emergency Contact</label>
                <input
                  type="tel"
                  value={formData.emergencyContact}
                  onChange={(e) => setFormData({...formData, emergencyContact: e.target.value})}
                />
              </div>

              <div className="form-group">
                <label>Notes</label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({...formData, notes: e.target.value})}
                  rows="3"
                />
              </div>

              <div className="modal-actions">
                <button type="button" className="btn-secondary" onClick={() => {
                  setShowEditModal(false);
                  resetForm();
                }}>
                  Cancel
                </button>
                <button type="submit" className="btn-primary">
                  Update Staff Member
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="modal-overlay">
          <div className="modal-content delete-modal">
            <div className="modal-header">
              <h2>Delete Staff Member</h2>
              <button 
                className="modal-close"
                onClick={() => setShowDeleteModal(false)}
              >
                <svg fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </button>
            </div>
            <div className="delete-content">
              <div className="delete-icon">
                <svg fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
              </div>
              <h3>Are you sure you want to delete this staff member?</h3>
              <p>This action cannot be undone. The staff member "{selectedStaff?.name}" will be permanently removed.</p>
              
              <div className="staff-details">
                <div className="detail-item">
                  <span className="label">Name:</span>
                  <span className="value">{selectedStaff?.name}</span>
                </div>
                <div className="detail-item">
                  <span className="label">Role:</span>
                  <span className="value">{getRoleLabel(selectedStaff?.role)}</span>
                </div>
                <div className="detail-item">
                  <span className="label">Employee ID:</span>
                  <span className="value">{selectedStaff?.employeeId}</span>
                </div>
                <div className="detail-item">
                  <span className="label">Status:</span>
                  <span className="value">{getStatusLabel(selectedStaff?.status)}</span>
                </div>
              </div>
            </div>
            <div className="modal-actions">
              <button 
                type="button" 
                className="btn-secondary" 
                onClick={() => setShowDeleteModal(false)}
              >
                Cancel
              </button>
              <button 
                type="button" 
                className="btn-danger" 
                onClick={handleDeleteStaff}
              >
                Delete Staff Member
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StaffManagement;

