import React, { useState, useEffect } from 'react';
import { 
  Users, 
  Clock, 
  CheckCircle, 
  XCircle, 
  AlertCircle, 
  TrendingUp,
  Calendar,
  Search,
  Filter,
  Download,
  RefreshCw,
  Eye,
  Edit,
  Trash2,
  Plus,
  ChevronRight,
  ChevronDown,
  Star,
  StarOff,
  Activity,
  MapPin,
  Phone,
  Mail,
  UserCheck,
  UserX,
  Clock4,
  Clock8,
  Clock12,
  BarChart3,
  PieChart,
  LineChart,
  Settings
} from 'lucide-react';

const AttendanceDashboard = () => {
  const [attendanceData, setAttendanceData] = useState([]);
  const [viewMode, setViewMode] = useState('today');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterRole, setFilterRole] = useState('all');
  const [expandedRecords, setExpandedRecords] = useState(new Set());
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);

  // Mock attendance data
  useEffect(() => {
    const mockAttendance = [
      {
        id: 1,
        employeeId: 'EMP001',
        name: 'Amit Singh',
        role: 'driver',
        phone: '+91-98765-43210',
        email: 'amit.singh@yatrik.com',
        date: '2024-01-15',
        checkIn: '05:45',
        checkOut: '18:30',
        status: 'present',
        location: 'Mumbai Central',
        totalHours: '12h 45m',
        overtime: '2h 45m',
        lateArrival: false,
        earlyDeparture: false,
        notes: 'Completed Kochi-Thiruvananthapuram route successfully',
        performance: 'excellent',
        lastUpdated: '2024-01-15 18:30'
      },
      {
        id: 2,
        employeeId: 'EMP002',
        name: 'Priya Patel',
        role: 'conductor',
        phone: '+91-98765-43211',
        email: 'priya.patel@yatrik.com',
        date: '2024-01-15',
        checkIn: '05:50',
        checkOut: '18:25',
        status: 'present',
        location: 'Mumbai Central',
        totalHours: '12h 35m',
        overtime: '2h 35m',
        lateArrival: false,
        earlyDeparture: false,
        notes: 'Efficient passenger management',
        performance: 'excellent',
        lastUpdated: '2024-01-15 18:25'
      },
      {
        id: 3,
        employeeId: 'EMP003',
        name: 'Vikram Mehta',
        role: 'driver',
        phone: '+91-98765-43212',
        email: 'vikram.mehta@yatrik.com',
        date: '2024-01-15',
        checkIn: '07:15',
        checkOut: '19:45',
        status: 'present',
        location: 'Mumbai Central',
        totalHours: '12h 30m',
        overtime: '2h 30m',
        lateArrival: true,
        earlyDeparture: false,
        notes: 'Late arrival due to traffic',
        performance: 'good',
        lastUpdated: '2024-01-15 19:45'
      },
      {
        id: 4,
        employeeId: 'EMP004',
        name: 'Rahul Sharma',
        role: 'conductor',
        phone: '+91-98765-43213',
        email: 'rahul.sharma@yatrik.com',
        date: '2024-01-15',
        checkIn: '07:20',
        checkOut: '19:40',
        status: 'present',
        location: 'Mumbai Central',
        totalHours: '12h 20m',
        overtime: '2h 20m',
        lateArrival: true,
        earlyDeparture: false,
        notes: 'Late arrival with driver',
        performance: 'good',
        lastUpdated: '2024-01-15 19:40'
      },
      {
        id: 5,
        employeeId: 'EMP005',
        name: 'Sanjay Verma',
        role: 'driver',
        phone: '+91-98765-43214',
        email: 'sanjay.verma@yatrik.com',
        date: '2024-01-15',
        checkIn: '08:00',
        checkOut: '20:15',
        status: 'present',
        location: 'Mumbai Central',
        totalHours: '12h 15m',
        overtime: '2h 15m',
        lateArrival: true,
        earlyDeparture: false,
        notes: 'Long distance route completed',
        performance: 'excellent',
        lastUpdated: '2024-01-15 20:15'
      },
      {
        id: 6,
        employeeId: 'EMP006',
        name: 'Meera Iyer',
        role: 'conductor',
        phone: '+91-98765-43215',
        email: 'meera.iyer@yatrik.com',
        date: '2024-01-15',
        checkIn: '08:05',
        checkOut: '20:10',
        status: 'present',
        location: 'Mumbai Central',
        totalHours: '12h 5m',
        overtime: '2h 5m',
        lateArrival: true,
        earlyDeparture: false,
        notes: 'Good passenger handling',
        performance: 'excellent',
        lastUpdated: '2024-01-15 20:10'
      },
      {
        id: 7,
        employeeId: 'EMP007',
        name: 'Rajesh Kumar',
        role: 'driver',
        phone: '+91-98765-43216',
        email: 'rajesh.kumar@yatrik.com',
        date: '2024-01-15',
        checkIn: null,
        checkOut: null,
        status: 'absent',
        location: null,
        totalHours: '0h 0m',
        overtime: '0h 0m',
        lateArrival: false,
        earlyDeparture: false,
        notes: 'Called in sick',
        performance: 'n/a',
        lastUpdated: '2024-01-15 09:00'
      },
      {
        id: 8,
        employeeId: 'EMP008',
        name: 'Sunita Reddy',
        role: 'conductor',
        phone: '+91-98765-43217',
        email: 'sunita.reddy@yatrik.com',
        date: '2024-01-15',
        checkIn: null,
        checkOut: null,
        status: 'absent',
        location: null,
        totalHours: '0h 0m',
        overtime: '0h 0m',
        lateArrival: false,
        earlyDeparture: false,
        notes: 'Personal emergency',
        performance: 'n/a',
        lastUpdated: '2024-01-15 08:30'
      }
    ];

    setAttendanceData(mockAttendance);
  }, []);

  const getStatusIcon = (status) => {
    switch (status) {
      case 'present': return CheckCircle;
      case 'absent': return XCircle;
      case 'late': return AlertCircle;
      case 'half-day': return Clock;
      default: return AlertCircle;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'present': return 'var(--erp-green)';
      case 'absent': return 'var(--erp-red)';
      case 'late': return 'var(--erp-amber)';
      case 'half-day': return 'var(--erp-blue)';
      default: return 'var(--erp-gray-500)';
    }
  };

  const getPerformanceColor = (performance) => {
    switch (performance) {
      case 'excellent': return 'var(--erp-green)';
      case 'good': return 'var(--erp-blue)';
      case 'average': return 'var(--erp-amber)';
      case 'poor': return 'var(--erp-red)';
      default: return 'var(--erp-gray-500)';
    }
  };

  const getRoleIcon = (role) => {
    switch (role) {
      case 'driver': return '🚗';
      case 'conductor': return '🎫';
      default: return '👤';
    }
  };

  const formatTime = (time) => {
    if (!time) return 'N/A';
    return time;
  };

  const calculateAttendanceStats = () => {
    const total = attendanceData.length;
    const present = attendanceData.filter(record => record.status === 'present').length;
    const absent = attendanceData.filter(record => record.status === 'absent').length;
    const late = attendanceData.filter(record => record.lateArrival).length;
    const attendanceRate = total > 0 ? Math.round((present / total) * 100) : 0;

    return { total, present, absent, late, attendanceRate };
  };

  const toggleExpanded = (id) => {
    const newExpanded = new Set(expandedRecords);
    if (newExpanded.has(id)) {
      newExpanded.delete(id);
    } else {
      newExpanded.add(id);
    }
    setExpandedRecords(newExpanded);
  };

  const filteredData = attendanceData.filter(record => {
    const matchesSearch = record.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         record.employeeId.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === 'all' || record.status === filterStatus;
    const matchesRole = filterRole === 'all' || record.role === filterRole;
    return matchesSearch && matchesStatus && matchesRole;
  });

  const stats = calculateAttendanceStats();

  return (
    <div className="attendance-dashboard-container">
      {/* Header */}
      <div className="attendance-header">
        <div className="header-left">
          <h3>Attendance Management Dashboard</h3>
          <p>Monitor and manage employee attendance, performance, and schedules</p>
        </div>
        <div className="header-actions">
          <button className="erp-btn-primary">
            <Plus className="h-4 w-4" />
            Add Record
          </button>
          <button className="erp-btn-primary">
            <Download className="h-4 w-4" />
            Export Report
          </button>
          <button className="erp-btn-primary">
            <Settings className="h-4 w-4" />
            Settings
          </button>
        </div>
      </div>

      {/* Date Selector */}
      <div className="date-selector">
        <label htmlFor="date-select">Select Date:</label>
        <input
          type="date"
          id="date-select"
          value={selectedDate}
          onChange={(e) => setSelectedDate(e.target.value)}
          className="date-input"
        />
      </div>

      {/* Attendance Statistics */}
      <div className="attendance-stats">
        <div className="stat-card total">
          <div className="stat-icon">
            <Users className="h-6 w-6" />
          </div>
          <div className="stat-content">
            <h5>Total Employees</h5>
            <span className="stat-value">{stats.total}</span>
          </div>
        </div>
        <div className="stat-card present">
          <div className="stat-icon">
            <CheckCircle className="h-6 w-6" />
          </div>
          <div className="stat-content">
            <h5>Present Today</h5>
            <span className="stat-value">{stats.present}</span>
          </div>
        </div>
        <div className="stat-card absent">
          <div className="stat-icon">
            <XCircle className="h-6 w-6" />
          </div>
          <div className="stat-content">
            <h5>Absent Today</h5>
            <span className="stat-value">{stats.absent}</span>
          </div>
        </div>
        <div className="stat-card late">
          <div className="stat-icon">
            <AlertCircle className="h-6 w-6" />
          </div>
          <div className="stat-content">
            <h5>Late Arrivals</h5>
            <span className="stat-value">{stats.late}</span>
          </div>
        </div>
        <div className="stat-card rate">
          <div className="stat-icon">
            <TrendingUp className="h-6 w-6" />
          </div>
          <div className="stat-content">
            <h5>Attendance Rate</h5>
            <span className="stat-value">{stats.attendanceRate}%</span>
          </div>
        </div>
      </div>

      {/* View Mode Tabs */}
      <div className="view-mode-tabs">
        <button 
          className={`view-tab ${viewMode === 'today' ? 'active' : ''}`}
          onClick={() => setViewMode('today')}
        >
          Today
        </button>
        <button 
          className={`view-tab ${viewMode === 'week' ? 'active' : ''}`}
          onClick={() => setViewMode('week')}
        >
          This Week
        </button>
        <button 
          className={`view-tab ${viewMode === 'month' ? 'active' : ''}`}
          onClick={() => setViewMode('month')}
        >
          This Month
        </button>
        <button 
          className={`view-tab ${viewMode === 'custom' ? 'active' : ''}`}
          onClick={() => setViewMode('custom')}
        >
          Custom Range
        </button>
      </div>

      {/* Search and Filter */}
      <div className="search-filter-bar">
        <div className="search-box">
          <Search className="h-4 w-4" />
          <input
            type="text"
            placeholder="Search by name or employee ID..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <select 
          value={filterStatus} 
          onChange={(e) => setFilterStatus(e.target.value)}
          className="filter-select"
        >
          <option value="all">All Status</option>
          <option value="present">Present</option>
          <option value="absent">Absent</option>
          <option value="late">Late</option>
          <option value="half-day">Half Day</option>
        </select>
        <select 
          value={filterRole} 
          onChange={(e) => setFilterRole(e.target.value)}
          className="filter-select"
        >
          <option value="all">All Roles</option>
          <option value="driver">Drivers</option>
          <option value="conductor">Conductors</option>
        </select>
        <button className="erp-btn-primary" onClick={() => window.location.reload()}>
          <RefreshCw className="h-4 w-4" />
          Refresh
        </button>
      </div>

      {/* Attendance Records */}
      <div className="attendance-records">
        <div className="records-header">
          <h4>Attendance Records ({filteredData.length})</h4>
          <div className="records-summary">
            <span>Present: {stats.present}</span>
            <span>Absent: {stats.absent}</span>
            <span>Late: {stats.late}</span>
          </div>
        </div>

        {filteredData.length === 0 ? (
          <div className="empty-state">
            <Users className="h-12 w-12" />
            <h4>No attendance records found</h4>
            <p>No records match your current filters.</p>
          </div>
        ) : (
          <div className="records-grid">
            {filteredData.map(record => {
              const StatusIcon = getStatusIcon(record.status);
              const isExpanded = expandedRecords.has(record.id);
              
              return (
                <div key={record.id} className={`attendance-card ${record.status}`}>
                  <div className="card-header">
                    <div className="employee-info">
                      <div className="employee-avatar">
                        <span className="role-icon">{getRoleIcon(record.role)}</span>
                      </div>
                      <div className="employee-details">
                        <h5>{record.name}</h5>
                        <span className="employee-id">{record.employeeId}</span>
                        <span className="employee-role">{record.role}</span>
                      </div>
                    </div>
                    <div className="attendance-status">
                      <StatusIcon className="h-5 w-5" style={{ color: getStatusColor(record.status) }} />
                      <span className="status-text">{record.status}</span>
                    </div>
                  </div>

                  <div className="card-content">
                    <div className="time-info">
                      <div className="time-item">
                        <span className="time-label">Check In:</span>
                        <span className="time-value">{formatTime(record.checkIn)}</span>
                      </div>
                      <div className="time-item">
                        <span className="time-label">Check Out:</span>
                        <span className="time-value">{formatTime(record.checkOut)}</span>
                      </div>
                      <div className="time-item">
                        <span className="time-label">Total Hours:</span>
                        <span className="time-value">{record.totalHours}</span>
                      </div>
                      <div className="time-item">
                        <span className="time-label">Overtime:</span>
                        <span className="time-value">{record.overtime}</span>
                      </div>
                    </div>

                    <div className="location-info">
                      <MapPin className="h-4 w-4" />
                      <span>{record.location || 'N/A'}</span>
                    </div>

                    <div className="performance-indicator">
                      <span className="performance-label">Performance:</span>
                      <span 
                        className="performance-value"
                        style={{ color: getPerformanceColor(record.performance) }}
                      >
                        {record.performance}
                      </span>
                    </div>
                  </div>

                  <div className="card-actions">
                    <button 
                      className="expand-btn"
                      onClick={() => toggleExpanded(record.id)}
                    >
                      {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                      {isExpanded ? 'Less' : 'More'}
                    </button>
                  </div>

                  {isExpanded && (
                    <div className="card-expanded">
                      <div className="expanded-section">
                        <h6>Contact Information</h6>
                        <div className="contact-info">
                          <div className="contact-item">
                            <Phone className="h-4 w-4" />
                            <span>{record.phone}</span>
                          </div>
                          <div className="contact-item">
                            <Mail className="h-4 w-4" />
                            <span>{record.email}</span>
                          </div>
                        </div>
                      </div>

                      <div className="expanded-section">
                        <h6>Attendance Details</h6>
                        <div className="attendance-details">
                          <div className="detail-item">
                            <span className="detail-label">Late Arrival:</span>
                            <span className="detail-value">
                              {record.lateArrival ? 'Yes' : 'No'}
                            </span>
                          </div>
                          <div className="detail-item">
                            <span className="detail-label">Early Departure:</span>
                            <span className="detail-value">
                              {record.earlyDeparture ? 'Yes' : 'No'}
                            </span>
                          </div>
                          <div className="detail-item">
                            <span className="detail-label">Last Updated:</span>
                            <span className="detail-value">{record.lastUpdated}</span>
                          </div>
                        </div>
                      </div>

                      <div className="expanded-section">
                        <h6>Notes</h6>
                        <p>{record.notes}</p>
                      </div>

                      <div className="expanded-section">
                        <h6>Actions</h6>
                        <div className="expanded-actions">
                          <button className="erp-btn-primary">
                            <Eye className="h-4 w-4" />
                            View Details
                          </button>
                          <button className="erp-btn-primary">
                            <Edit className="h-4 w-4" />
                            Edit Record
                          </button>
                          <button className="erp-btn-primary">
                            <UserCheck className="h-4 w-4" />
                            Mark Present
                          </button>
                          <button className="erp-btn-primary">
                            <UserX className="h-4 w-4" />
                            Mark Absent
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Performance Analytics */}
      <div className="performance-analytics">
        <h4>Performance Analytics</h4>
        <div className="analytics-grid">
          <div className="analytics-card">
            <div className="analytics-header">
              <h5>Attendance Trends</h5>
              <BarChart3 className="h-5 w-5" />
            </div>
            <div className="analytics-content">
              <div className="trend-item">
                <span className="trend-label">This Week</span>
                <span className="trend-value positive">+5%</span>
              </div>
              <div className="trend-item">
                <span className="trend-label">This Month</span>
                <span className="trend-value positive">+12%</span>
              </div>
              <div className="trend-item">
                <span className="trend-label">This Quarter</span>
                <span className="trend-value positive">+8%</span>
              </div>
            </div>
          </div>

          <div className="analytics-card">
            <div className="analytics-header">
              <h5>Role Performance</h5>
              <PieChart className="h-5 w-5" />
            </div>
            <div className="analytics-content">
              <div className="role-performance">
                <div className="role-item">
                  <span className="role-name">Drivers</span>
                  <span className="role-rate">96%</span>
                </div>
                <div className="role-item">
                  <span className="role-name">Conductors</span>
                  <span className="role-rate">94%</span>
                </div>
              </div>
            </div>
          </div>

          <div className="analytics-card">
            <div className="analytics-header">
              <h5>Overtime Analysis</h5>
              <LineChart className="h-5 w-5" />
            </div>
            <div className="analytics-content">
              <div className="overtime-stats">
                <div className="overtime-item">
                  <span className="overtime-label">Average Daily</span>
                  <span className="overtime-value">2.3h</span>
                </div>
                <div className="overtime-item">
                  <span className="overtime-label">Weekly Total</span>
                  <span className="overtime-value">16.1h</span>
                </div>
                <div className="overtime-item">
                  <span className="overtime-label">Monthly Total</span>
                  <span className="overtime-value">69.2h</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AttendanceDashboard;
