import React, { useState, useEffect } from 'react';
import { 
  Users, 
  Clock, 
  MapPin, 
  CheckCircle, 
  XCircle, 
  AlertTriangle, 
  TrendingUp,
  TrendingDown,
  Eye,
  Edit,
  Filter,
  Search,
  Download,
  RefreshCw,
  Calendar,
  UserCheck,
  UserX,
  UserMinus
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { apiFetch } from '../../utils/api';

const AttendanceDashboard = () => {
  const { user } = useAuth();
  const [attendanceData, setAttendanceData] = useState(null);
  const [attendanceReport, setAttendanceReport] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState({
    startDate: new Date().toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0],
    status: '',
    employeeType: '',
    search: ''
  });
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [showEmployeeDetails, setShowEmployeeDetails] = useState(false);

  useEffect(() => {
    fetchAttendanceOverview();
    fetchAttendanceReport();
  }, [filters]);

  const fetchAttendanceOverview = async () => {
    try {
      setLoading(true);
      const response = await apiFetch('/api/attendance/overview', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (response.success) {
        setAttendanceData(response.data);
      }
    } catch (error) {
      setError('Failed to fetch attendance overview');
      console.error('Error fetching overview:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchAttendanceReport = async () => {
    try {
      const queryParams = new URLSearchParams({
        startDate: filters.startDate,
        endDate: filters.endDate,
        ...(filters.status && { status: filters.status }),
        ...(filters.employeeType && { employeeType: filters.employeeType }),
        ...(filters.search && { search: filters.search })
      });

      const response = await apiFetch(`/api/attendance/report?${queryParams}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (response.success) {
        setAttendanceReport(response.data);
      }
    } catch (error) {
      setError('Failed to fetch attendance report');
      console.error('Error fetching report:', error);
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'present': return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'absent': return <XCircle className="w-5 h-5 text-red-500" />;
      case 'late': return <AlertTriangle className="w-5 h-5 text-yellow-500" />;
      case 'half-day': return <Clock className="w-5 h-5 text-orange-500" />;
      case 'leave': return <UserMinus className="w-5 h-5 text-blue-500" />;
      default: return <Clock className="w-5 h-5 text-gray-500" />;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'present': return 'bg-green-100 text-green-800 border-green-200';
      case 'absent': return 'bg-red-100 text-red-800 border-red-200';
      case 'late': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'half-day': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'leave': return 'bg-blue-100 text-blue-800 border-blue-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const calculateAttendanceRate = (present, total) => {
    if (total === 0) return 0;
    return Math.round((present / total) * 100);
  };

  const exportAttendanceData = () => {
    const csvContent = [
      ['Employee Name', 'Employee Code', 'Type', 'Date', 'Status', 'Check In', 'Check Out', 'Location', 'Notes'],
      ...attendanceReport.map(att => [
        att.employeeName,
        att.employeeCode,
        att.employeeType,
        new Date(att.date).toLocaleDateString(),
        att.status,
        att.checkInTime ? new Date(att.checkInTime).toLocaleTimeString() : 'N/A',
        att.checkOutTime ? new Date(att.checkOutTime).toLocaleTimeString() : 'N/A',
        att.location || 'N/A',
        att.notes || 'N/A'
      ])
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `attendance_report_${filters.startDate}_${filters.endDate}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  if (loading && !attendanceData) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-primary to-primary-dark text-white rounded-xl p-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold">Attendance Dashboard</h2>
            <p className="text-primary-light mt-1">
              Monitor and manage conductor and driver attendance in real-time
            </p>
          </div>
          <div className="flex items-center space-x-3">
            <button
              onClick={fetchAttendanceOverview}
              className="bg-white/20 hover:bg-white/30 px-4 py-2 rounded-lg transition-colors flex items-center space-x-2"
            >
              <RefreshCw className="w-4 h-4" />
              <span>Refresh</span>
            </button>
            <button
              onClick={exportAttendanceData}
              className="bg-green-500 hover:bg-green-600 px-4 py-2 rounded-lg transition-colors flex items-center space-x-2"
            >
              <Download className="w-4 h-4" />
              <span>Export</span>
            </button>
          </div>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4">
          <div className="flex items-center space-x-2 text-red-800">
            <AlertTriangle className="w-5 h-5" />
            <span className="font-medium">{error}</span>
          </div>
        </div>
      )}

      {/* Today's Overview */}
      {attendanceData?.today && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Drivers Overview */}
          <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-800">Drivers</h3>
              <Users className="w-6 h-6 text-blue-500" />
            </div>
            
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-gray-600">Total Drivers</span>
                <span className="font-semibold text-gray-800">{attendanceData.today.drivers.total}</span>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-gray-600">Present</span>
                <span className="font-semibold text-green-600">{attendanceData.today.drivers.present}</span>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-gray-600">Absent</span>
                <span className="font-semibold text-red-600">{attendanceData.today.drivers.absent}</span>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-gray-600">Late</span>
                <span className="font-semibold text-yellow-600">{attendanceData.today.drivers.late}</span>
              </div>
              
              <div className="pt-2 border-t border-gray-200">
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Attendance Rate</span>
                  <span className="font-bold text-lg text-primary">
                    {calculateAttendanceRate(
                      attendanceData.today.drivers.present,
                      attendanceData.today.drivers.total
                    )}%
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Conductors Overview */}
          <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-800">Conductors</h3>
              <Users className="w-6 h-6 text-green-500" />
            </div>
            
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-gray-600">Total Conductors</span>
                <span className="font-semibold text-gray-800">{attendanceData.today.conductors.total}</span>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-gray-600">Present</span>
                <span className="font-semibold text-green-600">{attendanceData.today.conductors.present}</span>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-gray-600">Absent</span>
                <span className="font-semibold text-red-600">{attendanceData.today.conductors.absent}</span>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-gray-600">Late</span>
                <span className="font-semibold text-yellow-600">{attendanceData.today.conductors.late}</span>
              </div>
              
              <div className="pt-2 border-t border-gray-200">
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Attendance Rate</span>
                  <span className="font-bold text-lg text-primary">
                    {calculateAttendanceRate(
                      attendanceData.today.conductors.present,
                      attendanceData.today.conductors.total
                    )}%
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-800">Attendance Report</h3>
          <Filter className="w-5 h-5 text-gray-500" />
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Start Date</label>
            <input
              type="date"
              value={filters.startDate}
              onChange={(e) => setFilters(prev => ({ ...prev, startDate: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">End Date</label>
            <input
              type="date"
              value={filters.endDate}
              onChange={(e) => setFilters(prev => ({ ...prev, endDate: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
            <select
              value={filters.status}
              onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
            >
              <option value="">All Status</option>
              <option value="present">Present</option>
              <option value="absent">Absent</option>
              <option value="late">Late</option>
              <option value="half-day">Half Day</option>
              <option value="leave">Leave</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Employee Type</label>
            <select
              value={filters.employeeType}
              onChange={(e) => setFilters(prev => ({ ...prev, employeeType: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
            >
              <option value="">All Types</option>
              <option value="driver">Driver</option>
              <option value="conductor">Conductor</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Search</label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search employees..."
                value={filters.search}
                onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Attendance Report Table */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-800">Attendance Records</h3>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Employee
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Type
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Check In
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Check Out
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Location
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {attendanceReport.map((record, index) => (
                <tr key={index} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-medium text-gray-900">{record.employeeName}</div>
                      <div className="text-sm text-gray-500">{record.employeeCode}</div>
                    </div>
                  </td>
                  
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      record.employeeType === 'driver' 
                        ? 'bg-blue-100 text-blue-800' 
                        : 'bg-green-100 text-green-800'
                    }`}>
                      {record.employeeType}
                    </span>
                  </td>
                  
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {new Date(record.date).toLocaleDateString()}
                  </td>
                  
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center space-x-2">
                      {getStatusIcon(record.status)}
                      <span className={`px-2 py-1 text-xs font-medium rounded-full border ${getStatusColor(record.status)}`}>
                        {record.status}
                      </span>
                    </div>
                  </td>
                  
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {record.checkInTime ? new Date(record.checkInTime).toLocaleTimeString() : 'N/A'}
                  </td>
                  
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {record.checkOutTime ? new Date(record.checkOutTime).toLocaleTimeString() : 'N/A'}
                  </td>
                  
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {record.location ? (
                      <div className="flex items-center space-x-1">
                        <MapPin className="w-4 h-4 text-gray-400" />
                        <span>{record.location}</span>
                      </div>
                    ) : (
                      'N/A'
                    )}
                  </td>
                  
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => {
                          setSelectedEmployee(record);
                          setShowEmployeeDetails(true);
                        }}
                        className="text-primary hover:text-primary-dark transition-colors"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      <button className="text-gray-600 hover:text-gray-800 transition-colors">
                        <Edit className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          
          {attendanceReport.length === 0 && (
            <div className="text-center py-12">
              <Users className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h4 className="text-lg font-medium text-gray-600 mb-2">No Attendance Records</h4>
              <p className="text-gray-500">No attendance records found for the selected filters.</p>
            </div>
          )}
        </div>
      </div>

      {/* Employee Details Modal */}
      {showEmployeeDetails && selectedEmployee && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-800">Employee Details</h3>
              <button
                onClick={() => setShowEmployeeDetails(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <XCircle className="w-6 h-6" />
              </button>
            </div>
            
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Name</label>
                  <p className="text-sm text-gray-900">{selectedEmployee.employeeName}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Employee Code</label>
                  <p className="text-sm text-gray-900">{selectedEmployee.employeeCode}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Type</label>
                  <p className="text-sm text-gray-900 capitalize">{selectedEmployee.employeeType}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Depot</label>
                  <p className="text-sm text-gray-900">{selectedEmployee.depotName}</p>
                </div>
              </div>
              
              <div className="border-t border-gray-200 pt-4">
                <h4 className="font-medium text-gray-800 mb-2">Attendance Information</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Date</label>
                    <p className="text-sm text-gray-900">
                      {new Date(selectedEmployee.date).toLocaleDateString()}
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Status</label>
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(selectedEmployee.status)}`}>
                      {selectedEmployee.status}
                    </span>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Check In</label>
                    <p className="text-sm text-gray-900">
                      {selectedEmployee.checkInTime ? new Date(selectedEmployee.checkInTime).toLocaleTimeString() : 'N/A'}
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Check Out</label>
                    <p className="text-sm text-gray-900">
                      {selectedEmployee.checkOutTime ? new Date(selectedEmployee.checkOutTime).toLocaleTimeString() : 'N/A'}
                    </p>
                  </div>
                </div>
                
                {selectedEmployee.location && (
                  <div className="mt-4">
                    <label className="block text-sm font-medium text-gray-700">Location</label>
                    <p className="text-sm text-gray-900">{selectedEmployee.location}</p>
                  </div>
                )}
                
                {selectedEmployee.notes && (
                  <div className="mt-4">
                    <label className="block text-sm font-medium text-gray-700">Notes</label>
                    <p className="text-sm text-gray-900">{selectedEmployee.notes}</p>
                  </div>
                )}
              </div>
            </div>
            
            <div className="flex justify-end space-x-3 mt-6 pt-4 border-t border-gray-200">
              <button
                onClick={() => setShowEmployeeDetails(false)}
                className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
              >
                Close
              </button>
              <button className="px-4 py-2 bg-primary text-white hover:bg-primary-dark rounded-lg transition-colors">
                Edit Attendance
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AttendanceDashboard;
