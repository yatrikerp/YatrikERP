import React, { useState, useEffect } from 'react';
import { 
  Building, MapPin, Phone, Bus, Users, Plus, Search, 
  Filter, Grid, List, Edit, Trash2, Eye, Car, 
  Wrench, Shield, Coffee, Wifi, Fuel, Calendar,
  Download, Upload, Settings, EyeOff
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';

const DepotManagement = () => {
  const [depots, setDepots] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [formErrors, setFormErrors] = useState({});
  const navigate = useNavigate();

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
    location: {
      address: '',
      city: '',
      state: '',
      pincode: ''
    },
    contact: {
      phone: '',
      email: '',
      managerName: ''
    },
    capacity: {
      totalBuses: ''
    },
    facilities: [],
    status: 'active'
  });

  // Now safe to derive email from depotForm
  const derivedEmail = depotForm.depotCode ? `${depotForm.depotCode.trim().toLowerCase()}-depot@yatrik.com` : '';
  const derivedUsername = depotForm.depotCode ? `${depotForm.depotCode.trim().toLowerCase()}-depot` : '';

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
    } else if (!/^[A-Z0-9]{3,10}$/.test(depotForm.depotCode.trim().toUpperCase())) {
      errors.depotCode = 'Depot Code must be 3-10 letters/numbers (uppercase)';
    }
    if (!depotForm.depotName || !depotForm.depotName.trim()) {
      errors.depotName = 'Depot Name is required';
    }
    if (!depotForm.location.address || !depotForm.location.address.trim()) {
      errors['location.address'] = 'Street Address is required';
    }
    if (!depotForm.location.city || !depotForm.location.city.trim()) {
      errors['location.city'] = 'City is required';
    }
    if (!depotForm.location.state || !depotForm.location.state.trim()) {
      errors['location.state'] = 'State is required';
    }
    if (!depotForm.location.pincode || !/^[0-9]{6}$/.test(depotForm.location.pincode.trim())) {
      errors['location.pincode'] = 'Pincode must be exactly 6 digits';
    }
    if (!depotForm.contact.phone || !/^[0-9]{10}$/.test(depotForm.contact.phone.trim())) {
      errors['contact.phone'] = 'Phone must be 10 digits';
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

      const depotData = {
        depotCode: depotForm.depotCode.trim().toUpperCase(),
        depotName: depotForm.depotName.trim(),
        location: {
          address: depotForm.location.address.trim(),
          city: depotForm.location.city.trim(),
          state: depotForm.location.state.trim(),
          pincode: depotForm.location.pincode.trim()
        },
        contact: {
          phone: depotForm.contact.phone.trim(),
          email: useAutoEmail
            ? derivedEmail
            : (depotForm.contact.email?.trim().toLowerCase() || derivedEmail),
          manager: depotForm.contact.managerName ? { name: depotForm.contact.managerName.trim() } : undefined
        },
        capacity: {
          totalBuses: parseInt(depotForm.capacity.totalBuses, 10),
          availableBuses: parseInt(depotForm.capacity.totalBuses, 10),
          maintenanceBuses: 0
        },
        operatingHours: {
          openTime: '06:00',
          closeTime: '22:00',
          workingDays: ['monday','tuesday','wednesday','thursday','friday','saturday']
        },
        facilities: depotForm.facilities,
        status: (depotForm.status || 'active').toLowerCase(),
        // Embed depot user creation in the same request (supported by backend)
        createUserAccount: !!createLogin,
        userAccount: createLogin ? {
          username: derivedUsername,
          email: useAutoEmail ? derivedEmail : (depotForm.contact.email?.trim().toLowerCase() || derivedEmail),
          password: loginPassword,
          role: 'depot_manager',
          permissions: ['view_depot_info','view_buses','manage_buses','view_routes','view_schedules','view_reports']
        } : undefined
      };

      const response = await fetch('/api/admin/depots', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json','Authorization': `Bearer ${localStorage.getItem('token')}` },
        body: JSON.stringify(depotData)
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'Server error');

      toast.success('Depot created successfully');
      navigate('/admin/depots');
      return;

    } catch (err) {
      console.error('❌ Error:', err);
      toast.error(err.message || 'Failed to create depot');
      setSubmitLoading(false);
    }
  };

  // Fetch depots
  const fetchDepots = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/admin/depots', {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      if (res.ok) {
        const data = await res.json();
        setDepots(data.depots || data.data || []);
      }
    } catch (err) {
      console.error(err);
      setDepots([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchDepots(); }, []);

  // Utility to render errors
  const renderError = (field) =>
    formErrors[field] && <p className="text-xs text-red-600 mt-1">{formErrors[field]}</p>;

  return (
    <div className="p-6 space-y-6">
      {/* header etc… */}

        <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">Depots</h2>
        <button type="button" onClick={()=>setShowCreateModal(true)} className="px-4 py-2 bg-green-600 text-white rounded flex items-center gap-2">
          <Plus className="w-4 h-4" /> Create New Depot
                          </button>
      </div>

      {/* Inline Create Depot form */}
      <div className="bg-white rounded-xl p-6 w-full border">
        <h3 className="text-lg font-semibold mb-4">Create New Depot</h3>
        <form onSubmit={handleCreateDepot} className="space-y-6">
          
          {/* Depot Code + Name */}
          <div>
            <label>Depot Code *</label>
            <input placeholder="e.g., TVM, BLR" value={depotForm.depotCode}
              onChange={(e)=>handleSimpleInputChange('depotCode',e.target.value)}
              className="border p-2 w-full" />
            {renderError('depotCode')}
          </div>
          <div>
            <label>Depot Name *</label>
            <input placeholder="e.g., Trivandrum Depot" value={depotForm.depotName}
              onChange={(e)=>handleSimpleInputChange('depotName',e.target.value)}
              className="border p-2 w-full" />
            {renderError('depotName')}
          </div>
          
          {/* Address */}
          <div>
            <label>Street Address *</label>
            <input placeholder="Enter street address" value={depotForm.location.address}
              onChange={(e)=>handleNestedInputChange('location','address',e.target.value)}
              className="border p-2 w-full" />
            {renderError('location.address')}
      </div>

          {/* City, State, Pincode */}
          <div>
            <label>City *</label>
            <input placeholder="Enter city name" value={depotForm.location.city}
              onChange={(e)=>handleNestedInputChange('location','city',e.target.value)}
              className="border p-2 w-full" />
            {renderError('location.city')}
            </div>
            <div>
            <label>State *</label>
            <input placeholder="Enter state name" value={depotForm.location.state}
              onChange={(e)=>handleNestedInputChange('location','state',e.target.value)}
              className="border p-2 w-full" />
            {renderError('location.state')}
            </div>
          <div>
            <label>Pincode *</label>
            <input placeholder="Enter 6-digit pincode" value={depotForm.location.pincode}
              onChange={(e)=>handleNestedInputChange('location','pincode',e.target.value)}
              className="border p-2 w-full" />
            {renderError('location.pincode')}
          </div>
          
          {/* Contact */}
          <div>
            <label>Phone *</label>
            <input placeholder="Enter phone number" value={depotForm.contact.phone}
              onChange={(e)=>handleNestedInputChange('contact','phone',e.target.value)}
              className="border p-2 w-full" />
            {renderError('contact.phone')}
            </div>
            <div>
            <div className="flex items-center justify-between">
              <label>Email (auto) </label>
              <label className="text-xs flex items-center gap-2">
                <input type="checkbox" checked={useAutoEmail} onChange={(e)=>setUseAutoEmail(e.target.checked)} />
                Use auto email
              </label>
            </div>
            <input placeholder="Enter email address" value={useAutoEmail ? derivedEmail : depotForm.contact.email}
              onChange={(e)=>!useAutoEmail && handleNestedInputChange('contact','email',e.target.value)}
              disabled={useAutoEmail}
              className="border p-2 w-full disabled:bg-gray-100" />
            {renderError('contact.email')}
            </div>
            <div>
            <label>Manager</label>
            <input placeholder="Enter manager name" value={depotForm.contact.managerName}
              onChange={(e)=>handleNestedInputChange('contact','managerName',e.target.value)}
              className="border p-2 w-full" />
          </div>
          
          {/* Capacity */}
            <div>
            <label>Bus Capacity *</label>
            <input placeholder="Enter total number of buses" type="number" value={depotForm.capacity.totalBuses}
              onChange={(e)=>handleNestedInputChange('capacity','totalBuses',e.target.value)}
              className="border p-2 w-full" />
            {renderError('capacity.totalBuses')}
      </div>

          {/* Facilities */}
          <div>
            <label>Facilities</label>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2 mt-2">
              {facilitiesOptions.map(f => (
                <label key={f} className="flex items-center space-x-2">
              <input
                    type="checkbox"
                    checked={depotForm.facilities.includes(f)}
                    onChange={(e) => {
                      setDepotForm(prev => ({
                        ...prev,
                        facilities: e.target.checked
                          ? [...prev.facilities, f]
                          : prev.facilities.filter(x => x !== f)
                      }));
                    }}
                  />
                  <span className="text-sm">{f.replaceAll('_',' ')}</span>
                </label>
              ))}
            </div>
          </div>
          
          {/* Status */}
          <div>
            <label>Status</label>
            <select className="border p-2 w-full" value={depotForm.status}
              onChange={(e)=>handleSimpleInputChange('status', e.target.value)}>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
              <option value="maintenance">Maintenance</option>
              <option value="closed">Closed</option>
            </select>
                  </div>
                  
          {/* Create Depot Manager login */}
          <div className="border-t pt-4">
            <label className="flex items-center gap-2 mb-2">
              <input type="checkbox" checked={createLogin} onChange={(e)=>setCreateLogin(e.target.checked)} />
              Create Depot Manager login now
            </label>
            {createLogin && (
              <div className="space-y-2">
                        <div>
                  <label>Password *</label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      placeholder="Enter password (min 6 chars)"
                      value={loginPassword}
                      onChange={(e)=>setLoginPassword(e.target.value)}
                      className="border p-2 w-full pr-10"
                    />
                    <button type="button" onClick={()=>setShowPassword(s=>!s)} className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700">
                      {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                  {formErrors['account.password'] && (
                    <p className="text-xs text-red-600 mt-1">{formErrors['account.password']}</p>
                  )}
                </div>
                {/* Strength meter */}
                <div className="space-y-1">
                  <div className="flex gap-1">
                    {[0,1,2,3,4].map((i) => (
                      <div key={i} className={`h-2 flex-1 rounded ${i < strength ? strengthColor : 'bg-gray-200'}`}></div>
                    ))}
                  </div>
                  <div className={`text-xs ${strengthTextColor}`}>Strength: {strengthLabel}</div>
                    </div>
                  </div>
                )}
              </div>

          {/* Actions */}
          <div className="flex justify-end space-x-4">
            <button type="submit" disabled={submitLoading}
              className="px-4 py-2 bg-blue-600 text-white rounded">
              {submitLoading ? 'Creating...' : 'Create Depot'}
                </button>
              </div>
            </form>
          </div>
    </div>
  );
};

export default DepotManagement;
