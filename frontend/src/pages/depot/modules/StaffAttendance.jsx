import React, { useState, useEffect } from 'react';
import { Users, CheckCircle, XCircle, Calendar, Clock, RefreshCw, UserCheck, UserX, FileText, X, DollarSign, List, Filter } from 'lucide-react';
import { apiFetch } from '../../../utils/api';
import toast from 'react-hot-toast';

const StaffAttendance = () => {
  const [staff, setStaff] = useState([]);
  const [attendance, setAttendance] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [marking, setMarking] = useState({});
  const [showAuditModal, setShowAuditModal] = useState(false);
  const [auditLogs, setAuditLogs] = useState([]);
  const [loadingAudit, setLoadingAudit] = useState(false);
  const [showPayrollModal, setShowPayrollModal] = useState(false);
  const [payrolls, setPayrolls] = useState([]);
  const [loadingPayroll, setLoadingPayroll] = useState(false);
  const [payrollFilters, setPayrollFilters] = useState({
    month: new Date().getMonth() + 1,
    year: new Date().getFullYear()
  });
  const [showAllAttendanceModal, setShowAllAttendanceModal] = useState(false);
  const [allAttendance, setAllAttendance] = useState([]);
  const [loadingAllAttendance, setLoadingAllAttendance] = useState(false);
  const [allAttendanceFilters, setAllAttendanceFilters] = useState({
    startDate: new Date(new Date().setDate(new Date().getDate() - 30)).toISOString().split('T')[0], // Last 30 days
    endDate: new Date().toISOString().split('T')[0],
    status: '',
    staffType: ''
  });
  const [allAttendanceSummary, setAllAttendanceSummary] = useState(null);

  useEffect(() => {
    fetchAttendance();
  }, [selectedDate]);

  // Fetch staff directly from drivers/conductors endpoints as fallback
  useEffect(() => {
    if (staff.length === 0 && !loading) {
      fetchStaffDirectly();
    }
  }, [staff.length, loading]);

  const fetchStaffDirectly = async () => {
    try {
      console.log('🔍 Fetching staff directly from drivers/conductors endpoints...');
      // Fetch drivers and conductors directly from depot endpoints
      const [driversRes, conductorsRes] = await Promise.all([
        apiFetch('/api/depot/drivers', { suppressError: true }),
        apiFetch('/api/depot/conductors', { suppressError: true })
      ]);

      console.log('📥 Drivers API Response:', driversRes);
      console.log('📥 Conductors API Response:', conductorsRes);

      let driversData = [];
      let conductorsData = [];

      if (driversRes.ok && driversRes.data) {
        if (driversRes.data.success && driversRes.data.data) {
          driversData = driversRes.data.data.drivers || [];
        } else if (driversRes.data.data && driversRes.data.data.drivers) {
          driversData = driversRes.data.data.drivers;
        } else if (driversRes.data.drivers) {
          driversData = driversRes.data.drivers;
        } else if (Array.isArray(driversRes.data)) {
          driversData = driversRes.data;
        }
      }

      if (conductorsRes.ok && conductorsRes.data) {
        if (conductorsRes.data.success && conductorsRes.data.data) {
          conductorsData = conductorsRes.data.data.conductors || [];
        } else if (conductorsRes.data.data && conductorsRes.data.data.conductors) {
          conductorsData = conductorsRes.data.data.conductors;
        } else if (conductorsRes.data.conductors) {
          conductorsData = conductorsRes.data.conductors;
        } else if (Array.isArray(conductorsRes.data)) {
          conductorsData = conductorsRes.data;
        }
      }

      console.log('✅ Parsed drivers:', driversData.length);
      console.log('✅ Parsed conductors:', conductorsData.length);

      // Combine drivers and conductors into staff list
      const allStaff = [
        ...(Array.isArray(driversData) ? driversData.map(d => ({ 
          ...d, 
          type: 'driver', 
          employeeId: d._id,
          employeeCode: d.employeeCode || d.driverId || 'N/A',
          name: d.name || 'Unknown Driver'
        })) : []),
        ...(Array.isArray(conductorsData) ? conductorsData.map(c => ({ 
          ...c, 
          type: 'conductor', 
          employeeId: c._id,
          employeeCode: c.employeeCode || c.conductorId || 'N/A',
          name: c.name || 'Unknown Conductor'
        })) : [])
      ];

      console.log('✅ Total staff from direct fetch:', allStaff.length);

      // Update staff list if we got data
      if (allStaff.length > 0) {
        setStaff(allStaff);
        // Also create attendance records for all staff
        const attendanceRecords = allStaff.map(s => ({
          _id: s._id,
          employeeId: s.employeeId || s._id,
          employeeCode: s.employeeCode,
          name: s.name,
          type: s.type,
          phone: s.phone || 'N/A',
          email: s.email || 'N/A',
          date: selectedDate,
          status: 'not_marked',
          checkInTime: null,
          checkOutTime: null
        }));
        setAttendance(attendanceRecords);
      } else {
        console.warn('⚠️ No staff found in depot');
      }
    } catch (error) {
      console.error('❌ Error fetching staff directly:', error);
    }
  };

  const fetchAttendance = async () => {
    try {
      setLoading(true);
      console.log('🔍 Fetching attendance for date:', selectedDate);
      const res = await apiFetch(`/api/depot/attendance?date=${selectedDate}`, { suppressError: true });
      
      console.log('📥 Attendance API Response:', res);
      
      if (res.ok && res.data) {
        // Handle res.guard.success() structure
        let attendanceData = null;
        let staffData = null;
        
        if (res.data.success && res.data.data) {
          attendanceData = res.data.data.attendance || res.data.data;
          staffData = res.data.data.staff || [];
        } else if (res.data.data) {
          attendanceData = res.data.data.attendance || res.data.data;
          staffData = res.data.data.staff || [];
        } else if (res.data.attendance) {
          attendanceData = res.data.attendance;
          staffData = res.data.staff || [];
        } else if (Array.isArray(res.data)) {
          attendanceData = res.data;
        }

        const finalAttendance = Array.isArray(attendanceData) ? attendanceData : [];
        const finalStaff = Array.isArray(staffData) ? staffData : [];
        
        console.log('✅ Parsed attendance:', finalAttendance.length, 'records');
        console.log('✅ Parsed staff:', finalStaff.length, 'staff members');
        
        setAttendance(finalAttendance);
        setStaff(finalStaff);
        
        // If no attendance but we have staff, trigger direct fetch
        if (finalAttendance.length === 0 && finalStaff.length === 0) {
          console.log('⚠️ No data from attendance API, fetching staff directly...');
          await fetchStaffDirectly();
        }
      } else {
        console.warn('⚠️ Attendance API response not OK:', res);
        setAttendance([]);
        setStaff([]);
        // Try fetching staff directly as fallback
        await fetchStaffDirectly();
      }
    } catch (error) {
      console.error('❌ Error fetching attendance:', error);
      setAttendance([]);
      setStaff([]);
      // Try fetching staff directly as fallback
      await fetchStaffDirectly();
    } finally {
      setLoading(false);
    }
  };

  const handleMarkAttendance = async (employeeId, employeeType, status) => {
    // Prevent multiple simultaneous clicks - only one action at a time
    if (marking[employeeId] || Object.keys(marking).length > 0) {
      toast.error('Please wait for the current action to complete');
      return;
    }

    // Leave cannot be marked directly
    if (status === 'leave') {
      toast.error('Leave cannot be marked directly. Please mark Present or Absent first, then convert to Leave if needed.');
      return;
    }

    try {
      // Set marking state for this employee
      setMarking(prev => ({ ...prev, [employeeId]: true }));
      
      const res = await apiFetch('/api/depot/attendance/mark', {
        method: 'POST',
        body: JSON.stringify({
          employeeId: employeeId,
          employeeType: employeeType,
          date: selectedDate,
          status: status
        }),
        suppressError: true
      });

      if (res.ok) {
        const success = res.data?.success || (res.data?.data && res.data.data.success);
        if (success || res.ok) {
          toast.success(`Attendance marked as ${status} successfully! Attendance is now LOCKED.`);
          
          // Refresh attendance data immediately
          await fetchAttendance();
          
          // Trigger dashboard refresh via custom event
          window.dispatchEvent(new CustomEvent('refreshDashboard'));
          
          // Also refresh after a short delay to ensure backend has updated
          setTimeout(() => {
            window.dispatchEvent(new CustomEvent('refreshDashboard'));
            fetchAttendance();
          }, 500);
        } else {
          const errorMsg = res.data?.message || res.data?.data?.message || res.data?.error || 'Failed to mark attendance';
          toast.error(errorMsg);
        }
      } else {
        const errorMsg = res.data?.message || res.data?.error || res.message || 'Failed to mark attendance';
        toast.error(errorMsg);
      }
    } catch (error) {
      console.error('Error marking attendance:', error);
      toast.error('Error marking attendance. Please try again.');
    } finally {
      // Clear marking state after completion
      setMarking(prev => {
        const newState = { ...prev };
        delete newState[employeeId];
        return newState;
      });
    }
  };

  const handleConvertToLeave = async (employeeId, employeeType, date, leaveReason) => {
    if (!leaveReason || !leaveReason.trim()) {
      toast.error('Leave reason is required');
      return;
    }

    if (marking[employeeId] || Object.keys(marking).length > 0) {
      toast.error('Please wait for the current action to complete');
      return;
    }

    try {
      setMarking(prev => ({ ...prev, [employeeId]: true }));
      
      const res = await apiFetch('/api/depot/attendance/convert-to-leave', {
        method: 'PUT',
        body: JSON.stringify({
          employeeId: employeeId,
          employeeType: employeeType,
          date: date,
          leaveReason: leaveReason.trim()
        }),
        suppressError: true
      });

      if (res.ok) {
        const success = res.data?.success || (res.data?.data && res.data.data.success);
        if (success || res.ok) {
          toast.success('Attendance converted to Leave successfully!');
          await fetchAttendance();
          window.dispatchEvent(new CustomEvent('refreshDashboard'));
          setTimeout(() => {
            window.dispatchEvent(new CustomEvent('refreshDashboard'));
            fetchAttendance();
          }, 500);
        } else {
          const errorMsg = res.data?.message || res.data?.error || 'Failed to convert to Leave';
          toast.error(errorMsg);
        }
      } else {
        const errorMsg = res.data?.message || res.data?.error || res.message || 'Failed to convert to Leave';
        toast.error(errorMsg);
      }
    } catch (error) {
      console.error('Error converting to Leave:', error);
      toast.error('Error converting attendance to Leave. Please try again.');
    } finally {
      setMarking(prev => {
        const newState = { ...prev };
        delete newState[employeeId];
        return newState;
      });
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'present': return '#10b981';
      case 'absent': return '#ef4444';
      case 'leave': return '#f59e0b';
      case 'half_day': return '#3b82f6';
      default: return '#64748b';
    }
  };

  const getStatusLabel = (status) => {
    switch (status) {
      case 'present': return 'Present';
      case 'absent': return 'Absent';
      case 'leave': return 'Leave';
      case 'half_day': return 'Half Day';
      case 'not_marked': return 'Not Marked';
      default: return status;
    }
  };

  const fetchAuditLogs = async () => {
    setLoadingAudit(true);
    try {
      const res = await apiFetch(`/api/depot/attendance/audit?date=${selectedDate}&limit=100`);
      if (res.ok && res.data?.success) {
        const logs = res.data.data?.auditLogs || res.data.auditLogs || [];
        setAuditLogs(logs);
      } else {
        toast.error('Failed to fetch audit logs');
      }
    } catch (error) {
      console.error('Error fetching audit logs:', error);
      toast.error('Error fetching audit logs');
    } finally {
      setLoadingAudit(false);
    }
  };

  const fetchPayrolls = async () => {
    setLoadingPayroll(true);
    try {
      const params = new URLSearchParams();
      if (payrollFilters.month) params.append('month', payrollFilters.month);
      if (payrollFilters.year) params.append('year', payrollFilters.year);
      
      const res = await apiFetch(`/api/depot/payroll?${params.toString()}`);
      if (res.ok && res.data?.success) {
        const payrollList = res.data.data?.payrolls || res.data.payrolls || [];
        setPayrolls(payrollList);
      } else {
        toast.error('Failed to fetch payroll records');
      }
    } catch (error) {
      console.error('Error fetching payroll:', error);
      toast.error('Error fetching payroll records');
    } finally {
      setLoadingPayroll(false);
    }
  };

  const fetchAllMarkedAttendance = async () => {
    setLoadingAllAttendance(true);
    try {
      const params = new URLSearchParams();
      if (allAttendanceFilters.startDate) params.append('startDate', allAttendanceFilters.startDate);
      if (allAttendanceFilters.endDate) params.append('endDate', allAttendanceFilters.endDate);
      if (allAttendanceFilters.status) params.append('status', allAttendanceFilters.status);
      if (allAttendanceFilters.staffType) params.append('staffType', allAttendanceFilters.staffType);
      params.append('limit', '1000');
      
      const res = await apiFetch(`/api/depot/attendance/all?${params.toString()}`);
      if (res.ok && res.data?.success) {
        const attendanceList = res.data.data?.attendance || res.data.attendance || [];
        const summary = res.data.data?.summary || res.data.summary || null;
        setAllAttendance(attendanceList);
        setAllAttendanceSummary(summary);
      } else {
        toast.error('Failed to fetch marked attendance records');
      }
    } catch (error) {
      console.error('Error fetching all marked attendance:', error);
      toast.error('Error fetching marked attendance records');
    } finally {
      setLoadingAllAttendance(false);
    }
  };

  // Combine staff and attendance data
  // Backend now returns attendance records for ALL staff (even if not marked)
  // So attendance records are the primary source of truth
  let staffWithAttendance = [];
  
  if (attendance.length > 0) {
    // Use attendance records as primary source (they contain all staff info)
    staffWithAttendance = attendance.map(att => ({
      _id: att._id,
      employeeId: att.employeeId || att._id,
      employeeCode: att.employeeCode || 'N/A',
      name: att.name || 'Unknown',
      type: att.type || 'driver',
      phone: att.phone || 'N/A',
      email: att.email || 'N/A',
      attendance: {
        status: att.status || 'not_marked',
        locked: att.locked || false,
        checkInTime: att.checkInTime || null,
        checkOutTime: att.checkOutTime || null,
        markedAt: att.markedAt || null,
        leaveReason: att.leaveReason || null
      }
    }));
  } else if (staff.length > 0) {
    // Fallback: If no attendance records but staff list exists, create attendance records for all
    staffWithAttendance = staff.map(s => ({
      ...s,
      attendance: {
        status: 'not_marked',
        locked: false,
        checkInTime: null,
        checkOutTime: null,
        markedAt: null,
        leaveReason: null
      }
    }));
  } else {
    // Both empty - will be handled by fetchStaffDirectly useEffect
    staffWithAttendance = [];
  }
  
  // Split into Pending and Marked sections
  const pendingAttendance = staffWithAttendance.filter(s => {
    const status = s.attendance?.status || 'not_marked';
    return status === 'not_marked';
  });
  
  const markedAttendance = staffWithAttendance.filter(s => {
    const status = s.attendance?.status || 'not_marked';
    return status !== 'not_marked';
  });

  const stats = {
    total: staffWithAttendance.length,
    present: staffWithAttendance.filter(s => s.attendance?.status === 'present').length,
    absent: staffWithAttendance.filter(s => s.attendance?.status === 'absent').length,
    leave: staffWithAttendance.filter(s => s.attendance?.status === 'leave').length,
    notMarked: pendingAttendance.length,
    marked: markedAttendance.length
  };

  // Debug logging
  console.log('📊 StaffAttendance Render:', {
    loading,
    staffCount: staff.length,
    attendanceCount: attendance.length,
    staffWithAttendanceCount: staffWithAttendance.length,
    selectedDate,
    stats
  });

  return (
    <div style={{ minHeight: '400px' }}>
      {/* Header with Date Selector */}
      <div className="module-card">
        <div className="module-card-header">
          <h3 className="module-card-title">
            <Users className="icon-md" />
            Staff Attendance
          </h3>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Calendar className="icon-sm" />
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                style={{
                  padding: '8px',
                  border: '1px solid #e2e8f0',
                  borderRadius: '6px',
                  fontSize: '14px'
                }}
              />
            </div>
            <button className="btn btn-secondary" onClick={fetchAttendance} disabled={loading}>
              <RefreshCw className="icon-sm" style={{ animation: loading ? 'spin 1s linear infinite' : 'none' }} />
              Refresh
            </button>
            <button 
              className="btn btn-secondary" 
              onClick={() => {
                setShowAuditModal(true);
                fetchAuditLogs();
              }}
              style={{ marginLeft: '8px' }}
            >
              <FileText className="icon-sm" />
              View Audit
            </button>
            <button 
              className="btn btn-secondary" 
              onClick={() => {
                setShowPayrollModal(true);
                fetchPayrolls();
              }}
              style={{ marginLeft: '8px' }}
            >
              <DollarSign className="icon-sm" />
              View Payroll
            </button>
            <button 
              className="btn btn-secondary" 
              onClick={() => {
                setShowAllAttendanceModal(true);
                fetchAllMarkedAttendance();
              }}
              style={{ marginLeft: '8px' }}
            >
              <List className="icon-sm" />
              All Marked Attendance
            </button>
          </div>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="kpi-grid" style={{ marginBottom: '24px' }}>
        <div className="kpi-card">
          <div className="kpi-card-header">
            <div className="kpi-icon" style={{ background: '#dbeafe', color: '#3b82f6' }}>
              <Users className="icon-lg" />
            </div>
          </div>
          <div className="kpi-value">{stats.total}</div>
          <div className="kpi-label">Total Staff</div>
        </div>
        <div className="kpi-card">
          <div className="kpi-card-header">
            <div className="kpi-icon" style={{ background: '#d1fae5', color: '#10b981' }}>
              <CheckCircle className="icon-lg" />
            </div>
          </div>
          <div className="kpi-value">{stats.present}</div>
          <div className="kpi-label">Present</div>
        </div>
        <div className="kpi-card">
          <div className="kpi-card-header">
            <div className="kpi-icon" style={{ background: '#fee2e2', color: '#ef4444' }}>
              <XCircle className="icon-lg" />
            </div>
          </div>
          <div className="kpi-value">{stats.absent}</div>
          <div className="kpi-label">Absent</div>
        </div>
        <div className="kpi-card">
          <div className="kpi-card-header">
            <div className="kpi-icon" style={{ background: '#fef3c7', color: '#f59e0b' }}>
              <Clock className="icon-lg" />
            </div>
          </div>
          <div className="kpi-value">{stats.notMarked}</div>
          <div className="kpi-label">Not Marked</div>
        </div>
      </div>

      {/* Attendance Table */}
      <div className="module-card">
        <div className="module-card-header">
          <h3 className="module-card-title">
            <Calendar className="icon-md" />
            Attendance Records - {new Date(selectedDate).toLocaleDateString('en-IN', { 
              weekday: 'long', 
              year: 'numeric', 
              month: 'long', 
              day: 'numeric' 
            })}
          </h3>
        </div>

        {loading ? (
          <div className="empty-state">
            <div className="loading-spinner" style={{ margin: '0 auto' }}></div>
            <p>Loading attendance data...</p>
          </div>
        ) : staffWithAttendance.length === 0 ? (
          <div className="empty-state">
            <Users className="icon-lg" style={{ margin: '0 auto 16px', color: '#94a3b8', width: '48px', height: '48px' }} />
            <h4 style={{ marginBottom: '8px', color: '#1e293b' }}>No Staff Found</h4>
            <p style={{ color: '#64748b', marginBottom: '16px' }}>
              No staff members are assigned to this depot. Please contact the admin to assign drivers and conductors.
            </p>
            <button 
              className="btn btn-primary" 
              onClick={async () => {
                await fetchAttendance();
                await fetchStaffDirectly();
              }}
              style={{ marginTop: '16px' }}
            >
              <RefreshCw className="icon-sm" />
              Retry
            </button>
          </div>
        ) : (
          <>
            {/* SECTION 1: PENDING ATTENDANCE */}
            {pendingAttendance.length > 0 && (
              <div style={{ marginBottom: '32px' }}>
                <h4 style={{ 
                  marginBottom: '16px', 
                  color: '#1e293b', 
                  fontSize: '18px',
                  fontWeight: 600,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}>
                  <Clock className="icon-sm" style={{ color: '#f59e0b' }} />
                  Pending Attendance ({pendingAttendance.length})
                </h4>
                <div className="table-container">
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>Employee Code</th>
                        <th>Name</th>
                        <th>Type</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {pendingAttendance.map((staffMember, index) => {
                        const isMarking = marking[staffMember.employeeId || staffMember._id];
                        const isAnyMarking = Object.keys(marking).length > 0;

                        return (
                          <tr key={staffMember._id || index}>
                            <td style={{ fontWeight: 600 }}>
                              {staffMember.employeeCode || staffMember.driverId || staffMember.conductorId || 'N/A'}
                            </td>
                            <td>{staffMember.name || 'N/A'}</td>
                            <td>
                              <span className="status-badge" style={{
                                background: staffMember.type === 'driver' ? '#dbeafe' : '#e9d5ff',
                                color: staffMember.type === 'driver' ? '#3b82f6' : '#8b5cf6'
                              }}>
                                {staffMember.type || 'N/A'}
                              </span>
                            </td>
                            <td>
                              <div style={{ display: 'flex', gap: '6px' }}>
                                <button
                                  className="btn btn-success"
                                  onClick={() => handleMarkAttendance(
                                    staffMember.employeeId || staffMember._id,
                                    staffMember.type,
                                    'present'
                                  )}
                                  disabled={isMarking || isAnyMarking}
                                  style={{ 
                                    padding: '6px 12px', 
                                    fontSize: '12px',
                                    opacity: (isMarking || isAnyMarking) ? 0.6 : 1,
                                    cursor: (isMarking || isAnyMarking) ? 'not-allowed' : 'pointer'
                                  }}
                                >
                                  {isMarking ? (
                                    <RefreshCw className="icon-xs" style={{ animation: 'spin 1s linear infinite' }} />
                                  ) : (
                                    <UserCheck className="icon-xs" />
                                  )}
                                  {isMarking ? 'Marking...' : 'Present'}
                                </button>
                                <button
                                  className="btn btn-danger"
                                  onClick={() => handleMarkAttendance(
                                    staffMember.employeeId || staffMember._id,
                                    staffMember.type,
                                    'absent'
                                  )}
                                  disabled={isMarking || isAnyMarking}
                                  style={{ 
                                    padding: '6px 12px', 
                                    fontSize: '12px',
                                    opacity: (isMarking || isAnyMarking) ? 0.6 : 1,
                                    cursor: (isMarking || isAnyMarking) ? 'not-allowed' : 'pointer'
                                  }}
                                >
                                  {isMarking ? (
                                    <RefreshCw className="icon-xs" style={{ animation: 'spin 1s linear infinite' }} />
                                  ) : (
                                    <UserX className="icon-xs" />
                                  )}
                                  {isMarking ? 'Marking...' : 'Absent'}
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

            {/* SECTION 2: MARKED ATTENDANCE (LOCKED) */}
            {markedAttendance.length > 0 && (
              <div>
                <h4 style={{ 
                  marginBottom: '16px', 
                  color: '#1e293b', 
                  fontSize: '18px',
                  fontWeight: 600,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}>
                  <CheckCircle className="icon-sm" style={{ color: '#10b981' }} />
                  Marked Attendance - Locked ({markedAttendance.length})
                </h4>
                <div className="table-container">
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>Employee Code</th>
                        <th>Name</th>
                        <th>Type</th>
                        <th>Status</th>
                        <th>Check In</th>
                        <th>Check Out</th>
                        <th>Marked At</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {markedAttendance.map((staffMember, index) => {
                        const attStatus = staffMember.attendance?.status || 'not_marked';
                        const isLocked = staffMember.attendance?.locked || false;
                        const canConvertToLeave = isLocked && (attStatus === 'present' || attStatus === 'absent');

                        return (
                          <tr key={staffMember._id || index}>
                            <td style={{ fontWeight: 600 }}>
                              {staffMember.employeeCode || staffMember.driverId || staffMember.conductorId || 'N/A'}
                            </td>
                            <td>{staffMember.name || 'N/A'}</td>
                            <td>
                              <span className="status-badge" style={{
                                background: staffMember.type === 'driver' ? '#dbeafe' : '#e9d5ff',
                                color: staffMember.type === 'driver' ? '#3b82f6' : '#8b5cf6'
                              }}>
                                {staffMember.type || 'N/A'}
                              </span>
                            </td>
                            <td>
                              <span className="status-badge" style={{
                                background: getStatusColor(attStatus) + '20',
                                color: getStatusColor(attStatus),
                                display: 'flex',
                                alignItems: 'center',
                                gap: '4px'
                              }}>
                                {isLocked && <span style={{ fontSize: '10px' }}>🔒</span>}
                                {getStatusLabel(attStatus)}
                              </span>
                            </td>
                            <td>
                              {staffMember.attendance?.checkInTime
                                ? new Date(staffMember.attendance.checkInTime).toLocaleTimeString('en-IN', { 
                                    hour: '2-digit', 
                                    minute: '2-digit' 
                                  })
                                : 'N/A'}
                            </td>
                            <td>
                              {staffMember.attendance?.checkOutTime
                                ? new Date(staffMember.attendance.checkOutTime).toLocaleTimeString('en-IN', { 
                                    hour: '2-digit', 
                                    minute: '2-digit' 
                                  })
                                : 'N/A'}
                            </td>
                            <td>
                              {staffMember.attendance?.markedAt
                                ? new Date(staffMember.attendance.markedAt).toLocaleString('en-IN', {
                                    hour: '2-digit',
                                    minute: '2-digit',
                                    day: '2-digit',
                                    month: '2-digit'
                                  })
                                : 'N/A'}
                            </td>
                            <td>
                              {canConvertToLeave ? (
                                <button
                                  className="btn btn-warning"
                                  onClick={() => {
                                    const reason = prompt('Enter reason for Leave (required):');
                                    if (reason && reason.trim()) {
                                      handleConvertToLeave(
                                        staffMember.employeeId || staffMember._id,
                                        staffMember.type,
                                        selectedDate,
                                        reason.trim()
                                      );
                                    } else if (reason !== null) {
                                      toast.error('Leave reason is required');
                                    }
                                  }}
                                  style={{ padding: '6px 12px', fontSize: '12px' }}
                                >
                                  Convert to Leave
                                </button>
                              ) : (
                                <span style={{ fontSize: '12px', color: '#64748b' }}>
                                  {attStatus === 'leave' ? 'Leave' : 'Locked'}
                                </span>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Empty state if both sections are empty */}
            {pendingAttendance.length === 0 && markedAttendance.length === 0 && (
              <div className="empty-state">
                <Users className="icon-lg" style={{ margin: '0 auto 16px', color: '#94a3b8', width: '48px', height: '48px' }} />
                <h4 style={{ marginBottom: '8px', color: '#1e293b' }}>No Staff Found</h4>
                <p style={{ color: '#64748b', marginBottom: '16px' }}>
                  No staff members are assigned to this depot. Please contact the admin to assign drivers and conductors.
                </p>
              </div>
            )}
          </>
        )}
      </div>

      {/* Audit Log Modal */}
      {showAuditModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div style={{
            backgroundColor: 'white',
            borderRadius: '12px',
            padding: '24px',
            maxWidth: '900px',
            width: '90%',
            maxHeight: '90vh',
            overflow: 'auto',
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 600 }}>
                <FileText className="icon-md" style={{ marginRight: '8px', display: 'inline' }} />
                Attendance Audit Log
              </h3>
              <button 
                onClick={() => setShowAuditModal(false)} 
                style={{ border: 'none', background: 'none', cursor: 'pointer', padding: '4px' }}
              >
                <X size={20} />
              </button>
            </div>

            {loadingAudit ? (
              <div style={{ textAlign: 'center', padding: '40px' }}>
                <div className="loading-spinner" style={{ margin: '0 auto' }}></div>
                <p style={{ marginTop: '16px', color: '#64748b' }}>Loading audit logs...</p>
              </div>
            ) : auditLogs.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px' }}>
                <FileText className="icon-lg" style={{ margin: '0 auto 16px', color: '#94a3b8', width: '48px', height: '48px' }} />
                <p style={{ color: '#64748b' }}>No audit logs found for this date</p>
              </div>
            ) : (
              <div className="table-container">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Staff</th>
                      <th>Action</th>
                      <th>Old Status</th>
                      <th>New Status</th>
                      <th>Reason</th>
                      <th>Performed By</th>
                      <th>Time</th>
                    </tr>
                  </thead>
                  <tbody>
                    {auditLogs.map((log, index) => (
                      <tr key={log._id || index}>
                        <td>
                          <div>
                            <div style={{ fontWeight: 600 }}>
                              {log.staffId?.name || 'Unknown'}
                            </div>
                            <div style={{ fontSize: '12px', color: '#64748b' }}>
                              {log.staffType || 'N/A'}
                            </div>
                          </div>
                        </td>
                        <td>
                          <span className="status-badge" style={{
                            background: log.actionType === 'MARK_PRESENT' ? '#d1fae5' : 
                                       log.actionType === 'MARK_ABSENT' ? '#fee2e2' : 
                                       '#fef3c7',
                            color: log.actionType === 'MARK_PRESENT' ? '#10b981' : 
                                   log.actionType === 'MARK_ABSENT' ? '#ef4444' : 
                                   '#f59e0b'
                          }}>
                            {log.actionType?.replace(/_/g, ' ') || 'N/A'}
                          </span>
                        </td>
                        <td>{log.oldStatus ? getStatusLabel(log.oldStatus) : 'N/A'}</td>
                        <td>{getStatusLabel(log.newStatus)}</td>
                        <td>{log.reason || '-'}</td>
                        <td>
                          <div>
                            <div style={{ fontWeight: 500 }}>
                              {log.performedBy?.name || 'System'}
                            </div>
                            <div style={{ fontSize: '12px', color: '#64748b' }}>
                              {log.performedRole || 'N/A'}
                            </div>
                          </div>
                        </td>
                        <td>
                          {log.performedAt 
                            ? new Date(log.performedAt).toLocaleString('en-IN', {
                                day: '2-digit',
                                month: '2-digit',
                                year: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit'
                              })
                            : 'N/A'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Payroll Modal (Read-Only) */}
      {showPayrollModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div style={{
            backgroundColor: 'white',
            borderRadius: '12px',
            padding: '24px',
            maxWidth: '900px',
            width: '90%',
            maxHeight: '90vh',
            overflow: 'auto',
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 600 }}>
                <DollarSign className="icon-md" style={{ marginRight: '8px', display: 'inline' }} />
                Payroll Records (Read-Only)
              </h3>
              <button 
                onClick={() => setShowPayrollModal(false)} 
                style={{ border: 'none', background: 'none', cursor: 'pointer', padding: '4px' }}
              >
                <X size={20} />
              </button>
            </div>

            {/* Payroll Filters */}
            <div style={{ marginBottom: '20px', display: 'flex', gap: '12px', alignItems: 'end' }}>
              <div style={{ flex: 1 }}>
                <label style={{ display: 'block', marginBottom: '6px', fontSize: '14px', fontWeight: 500 }}>Month</label>
                <select
                  value={payrollFilters.month}
                  onChange={(e) => {
                    setPayrollFilters({ ...payrollFilters, month: parseInt(e.target.value) });
                    setTimeout(fetchPayrolls, 100);
                  }}
                  style={{ width: '100%', padding: '8px', border: '1px solid #e2e8f0', borderRadius: '6px' }}
                >
                  {['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'].map((month, index) => (
                    <option key={index + 1} value={index + 1}>{month}</option>
                  ))}
                </select>
              </div>
              <div style={{ flex: 1 }}>
                <label style={{ display: 'block', marginBottom: '6px', fontSize: '14px', fontWeight: 500 }}>Year</label>
                <input
                  type="number"
                  value={payrollFilters.year}
                  onChange={(e) => {
                    setPayrollFilters({ ...payrollFilters, year: parseInt(e.target.value) });
                    setTimeout(fetchPayrolls, 100);
                  }}
                  style={{ width: '100%', padding: '8px', border: '1px solid #e2e8f0', borderRadius: '6px' }}
                  min="2020"
                  max={new Date().getFullYear() + 1}
                />
              </div>
            </div>

            {loadingPayroll ? (
              <div style={{ textAlign: 'center', padding: '40px' }}>
                <div className="loading-spinner" style={{ margin: '0 auto' }}></div>
                <p style={{ marginTop: '16px', color: '#64748b' }}>Loading payroll records...</p>
              </div>
            ) : payrolls.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px' }}>
                <DollarSign className="icon-lg" style={{ margin: '0 auto 16px', color: '#94a3b8', width: '48px', height: '48px' }} />
                <p style={{ color: '#64748b' }}>No payroll records found for this period</p>
              </div>
            ) : (
              <div className="table-container">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Staff</th>
                      <th>Period</th>
                      <th>Present Days</th>
                      <th>Absent Days</th>
                      <th>Leave Days</th>
                      <th>Payable Days</th>
                      <th>Net Salary</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {payrolls.map((payroll, index) => (
                      <tr key={payroll._id || index}>
                        <td>
                          <div>
                            <div style={{ fontWeight: 600 }}>
                              {payroll.staffId?.name || 'Unknown'}
                            </div>
                            <div style={{ fontSize: '12px', color: '#64748b' }}>
                              {payroll.staffType || 'N/A'}
                            </div>
                          </div>
                        </td>
                        <td>
                          {['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'][payroll.month - 1]} {payroll.year}
                        </td>
                        <td>{payroll.presentDays || 0}</td>
                        <td>{payroll.absentDays || 0}</td>
                        <td>{payroll.leaveDays || 0}</td>
                        <td style={{ fontWeight: 600 }}>{payroll.payableDays || 0}</td>
                        <td style={{ fontWeight: 600 }}>
                          ₹{payroll.netSalary?.toLocaleString('en-IN') || '0'}
                        </td>
                        <td>
                          <span className="status-badge" style={{
                            background: payroll.status === 'PAID' ? '#d1fae5' : 
                                       payroll.status === 'FINALIZED' ? '#dbeafe' : 
                                       '#fef3c7',
                            color: payroll.status === 'PAID' ? '#10b981' : 
                                   payroll.status === 'FINALIZED' ? '#3b82f6' : 
                                   '#f59e0b'
                          }}>
                            {payroll.status || 'DRAFT'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* All Marked Attendance Modal */}
      {showAllAttendanceModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div style={{
            backgroundColor: 'white',
            borderRadius: '12px',
            padding: '24px',
            maxWidth: '1200px',
            width: '95%',
            maxHeight: '90vh',
            overflow: 'auto',
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 600 }}>
                <List className="icon-md" style={{ marginRight: '8px', display: 'inline' }} />
                All Marked Attendance Records
              </h3>
              <button 
                onClick={() => setShowAllAttendanceModal(false)} 
                style={{ border: 'none', background: 'none', cursor: 'pointer', padding: '4px' }}
              >
                <X size={20} />
              </button>
            </div>

            {/* Filters */}
            <div style={{ marginBottom: '20px', display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'end' }}>
              <div style={{ flex: 1, minWidth: '150px' }}>
                <label style={{ display: 'block', marginBottom: '6px', fontSize: '14px', fontWeight: 500 }}>Start Date</label>
                <input
                  type="date"
                  value={allAttendanceFilters.startDate}
                  onChange={(e) => {
                    setAllAttendanceFilters({ ...allAttendanceFilters, startDate: e.target.value });
                    setTimeout(fetchAllMarkedAttendance, 300);
                  }}
                  style={{ width: '100%', padding: '8px', border: '1px solid #e2e8f0', borderRadius: '6px' }}
                />
              </div>
              <div style={{ flex: 1, minWidth: '150px' }}>
                <label style={{ display: 'block', marginBottom: '6px', fontSize: '14px', fontWeight: 500 }}>End Date</label>
                <input
                  type="date"
                  value={allAttendanceFilters.endDate}
                  onChange={(e) => {
                    setAllAttendanceFilters({ ...allAttendanceFilters, endDate: e.target.value });
                    setTimeout(fetchAllMarkedAttendance, 300);
                  }}
                  style={{ width: '100%', padding: '8px', border: '1px solid #e2e8f0', borderRadius: '6px' }}
                />
              </div>
              <div style={{ flex: 1, minWidth: '120px' }}>
                <label style={{ display: 'block', marginBottom: '6px', fontSize: '14px', fontWeight: 500 }}>Status</label>
                <select
                  value={allAttendanceFilters.status}
                  onChange={(e) => {
                    setAllAttendanceFilters({ ...allAttendanceFilters, status: e.target.value });
                    setTimeout(fetchAllMarkedAttendance, 300);
                  }}
                  style={{ width: '100%', padding: '8px', border: '1px solid #e2e8f0', borderRadius: '6px' }}
                >
                  <option value="">All Status</option>
                  <option value="present">Present</option>
                  <option value="absent">Absent</option>
                  <option value="leave">Leave</option>
                </select>
              </div>
              <div style={{ flex: 1, minWidth: '120px' }}>
                <label style={{ display: 'block', marginBottom: '6px', fontSize: '14px', fontWeight: 500 }}>Staff Type</label>
                <select
                  value={allAttendanceFilters.staffType}
                  onChange={(e) => {
                    setAllAttendanceFilters({ ...allAttendanceFilters, staffType: e.target.value });
                    setTimeout(fetchAllMarkedAttendance, 300);
                  }}
                  style={{ width: '100%', padding: '8px', border: '1px solid #e2e8f0', borderRadius: '6px' }}
                >
                  <option value="">All Types</option>
                  <option value="driver">Driver</option>
                  <option value="conductor">Conductor</option>
                </select>
              </div>
              <button
                onClick={fetchAllMarkedAttendance}
                className="btn btn-secondary"
                style={{ padding: '8px 16px' }}
              >
                <RefreshCw className="icon-sm" />
                Refresh
              </button>
            </div>

            {/* Summary Cards */}
            {allAttendanceSummary && (
              <div className="kpi-grid" style={{ marginBottom: '20px' }}>
                <div className="kpi-card">
                  <div className="kpi-value">{allAttendanceSummary.total || 0}</div>
                  <div className="kpi-label">Total Records</div>
                </div>
                <div className="kpi-card">
                  <div className="kpi-value" style={{ color: '#10b981' }}>{allAttendanceSummary.present || 0}</div>
                  <div className="kpi-label">Present</div>
                </div>
                <div className="kpi-card">
                  <div className="kpi-value" style={{ color: '#ef4444' }}>{allAttendanceSummary.absent || 0}</div>
                  <div className="kpi-label">Absent</div>
                </div>
                <div className="kpi-card">
                  <div className="kpi-value" style={{ color: '#f59e0b' }}>{allAttendanceSummary.leave || 0}</div>
                  <div className="kpi-label">Leave</div>
                </div>
              </div>
            )}

            {loadingAllAttendance ? (
              <div style={{ textAlign: 'center', padding: '40px' }}>
                <div className="loading-spinner" style={{ margin: '0 auto' }}></div>
                <p style={{ marginTop: '16px', color: '#64748b' }}>Loading marked attendance records...</p>
              </div>
            ) : allAttendance.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px' }}>
                <List className="icon-lg" style={{ margin: '0 auto 16px', color: '#94a3b8', width: '48px', height: '48px' }} />
                <p style={{ color: '#64748b' }}>No marked attendance records found for the selected period</p>
              </div>
            ) : (
              <div className="table-container">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Date</th>
                      <th>Employee Code</th>
                      <th>Name</th>
                      <th>Type</th>
                      <th>Status</th>
                      <th>Check In</th>
                      <th>Check Out</th>
                      <th>Marked At</th>
                      <th>Notes</th>
                    </tr>
                  </thead>
                  <tbody>
                    {allAttendance.map((record, index) => (
                      <tr key={record._id || index}>
                        <td style={{ fontWeight: 600 }}>
                          {record.date 
                            ? new Date(record.date).toLocaleDateString('en-IN', {
                                day: '2-digit',
                                month: '2-digit',
                                year: 'numeric'
                              })
                            : 'N/A'}
                        </td>
                        <td style={{ fontWeight: 600 }}>{record.employeeCode || 'N/A'}</td>
                        <td>{record.name || 'Unknown'}</td>
                        <td>
                          <span className="status-badge" style={{
                            background: record.type === 'driver' ? '#dbeafe' : '#e9d5ff',
                            color: record.type === 'driver' ? '#3b82f6' : '#8b5cf6'
                          }}>
                            {record.type || 'N/A'}
                          </span>
                        </td>
                        <td>
                          <span className="status-badge" style={{
                            background: getStatusColor(record.status) + '20',
                            color: getStatusColor(record.status),
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px'
                          }}>
                            {record.locked && <span style={{ fontSize: '10px' }}>🔒</span>}
                            {getStatusLabel(record.status)}
                          </span>
                        </td>
                        <td>
                          {record.checkInTime
                            ? new Date(record.checkInTime).toLocaleTimeString('en-IN', { 
                                hour: '2-digit', 
                                minute: '2-digit' 
                              })
                            : '-'}
                        </td>
                        <td>
                          {record.checkOutTime
                            ? new Date(record.checkOutTime).toLocaleTimeString('en-IN', { 
                                hour: '2-digit', 
                                minute: '2-digit' 
                              })
                            : '-'}
                        </td>
                        <td>
                          {record.markedAt
                            ? new Date(record.markedAt).toLocaleString('en-IN', {
                                day: '2-digit',
                                month: '2-digit',
                                hour: '2-digit',
                                minute: '2-digit'
                              })
                            : '-'}
                        </td>
                        <td style={{ fontSize: '12px', color: '#64748b', maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {record.notes || record.leaveReason || '-'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default StaffAttendance;
