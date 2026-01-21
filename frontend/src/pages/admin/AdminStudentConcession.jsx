import React, { useState, useEffect } from 'react';
import {
  GraduationCap,
  CheckCircle,
  XCircle,
  Clock,
  Search,
  Filter,
  Download,
  Eye,
  Edit,
  Ban,
  TrendingUp,
  DollarSign,
  FileText,
  AlertTriangle,
  RefreshCw,
  Plus,
  FileCheck,
  BarChart3,
  Settings,
  UserCheck,
  Shield,
  Users,
  MapPin
} from 'lucide-react';
import { apiFetch } from '../../utils/api';

const AdminStudentConcession = () => {
  const [activeTab, setActiveTab] = useState('overview');
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [showStudentModal, setShowStudentModal] = useState(false);
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    approved: 0,
    rejected: 0,
    active: 0,
    totalTrips: 0,
    revenueLoss: 0,
    subsidyRequired: 0
  });
  const [policySettings, setPolicySettings] = useState({
    schoolDiscount: 50,
    collegeDiscount: 50,
    seniorCitizenDiscount: 50,
    distanceCap: 100,
    validityPeriod: 365
  });

  useEffect(() => {
    fetchStudents();
    fetchStats();
    fetchPolicySettings();
  }, [statusFilter, categoryFilter]);

  const fetchStudents = async () => {
    try {
      setLoading(true);
      const queryParams = new URLSearchParams();
      if (statusFilter && statusFilter !== 'all') queryParams.append('status', statusFilter);
      if (categoryFilter && categoryFilter !== 'all') queryParams.append('category', categoryFilter);
      
      const queryString = queryParams.toString();
      const url = `/api/admin/students${queryString ? '?' + queryString : ''}`;
      
      const res = await apiFetch(url);
      if (res.ok && res.data) {
        // Backend returns: { success: true, data: { students: [], pagination: {} } }
        // apiFetch returns: { ok: true, data: { success: true, data: { students: [] } } }
        let studentsData = [];
        if (res.data?.data?.students) {
          studentsData = res.data.data.students;
        } else if (res.data?.students) {
          studentsData = res.data.students;
        } else if (Array.isArray(res.data?.data)) {
          studentsData = res.data.data;
        } else if (Array.isArray(res.data)) {
          studentsData = res.data;
        }
        setStudents(Array.isArray(studentsData) ? studentsData : []);
      } else {
        console.error('Failed to fetch students:', res.message || 'Unknown error');
        setStudents([]);
      }
    } catch (error) {
      console.error('Error fetching students:', error);
      setStudents([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const res = await apiFetch('/api/admin/students/stats');
      if (res.ok && res.data) {
        // Backend returns: { success: true, data: { total, pending, ... } }
        // apiFetch returns: { ok: true, data: { success: true, data: { total, ... } } }
        const statsData = res.data?.data || res.data || {};
        setStats(prevStats => ({
          total: statsData.total ?? prevStats.total,
          pending: statsData.pending ?? prevStats.pending,
          approved: statsData.approved ?? prevStats.approved,
          rejected: statsData.rejected ?? prevStats.rejected,
          active: statsData.active ?? prevStats.active,
          totalTrips: statsData.totalTrips ?? prevStats.totalTrips,
          revenueLoss: statsData.revenueLoss ?? prevStats.revenueLoss,
          subsidyRequired: statsData.subsidyRequired ?? prevStats.subsidyRequired
        }));
      }
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const fetchPolicySettings = async () => {
    try {
      const res = await apiFetch('/api/admin/concession/policy');
      if (res.ok && res.data) {
        // Backend returns: { success: true, data: { schoolDiscount, ... } }
        const policyData = res.data?.data || res.data || {};
        setPolicySettings(prevSettings => ({
          ...prevSettings,
          ...policyData
        }));
      }
    } catch (error) {
      console.error('Error fetching policy settings:', error);
    }
  };

  const handleApprove = async (studentId) => {
    if (!window.confirm('Are you sure you want to approve this student concession?')) {
      return;
    }
    try {
      const res = await apiFetch(`/api/admin/students/${studentId}/approve`, {
        method: 'POST'
      });
      if (res.ok) {
        alert('Student concession approved successfully!');
        fetchStudents();
        fetchStats();
        setShowStudentModal(false);
      } else {
        alert(`Failed to approve student: ${res.message || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Error approving student:', error);
      alert('Error approving student. Please try again.');
    }
  };

  const handleReject = async (studentId, reason) => {
    if (!reason || !reason.trim()) {
      alert('Please provide a reason for rejection.');
      return;
    }
    try {
      const res = await apiFetch(`/api/admin/students/${studentId}/reject`, {
        method: 'POST',
        body: JSON.stringify({ reason: reason.trim() })
      });
      if (res.ok) {
        alert('Student concession rejected successfully!');
        fetchStudents();
        fetchStats();
        setShowStudentModal(false);
      } else {
        alert(`Failed to reject student: ${res.message || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Error rejecting student:', error);
      alert('Error rejecting student. Please try again.');
    }
  };

  const handleUpdatePolicy = async () => {
    if (!window.confirm('Are you sure you want to update the concession policy? This will affect all future applications.')) {
      return;
    }
    try {
      const res = await apiFetch('/api/admin/concession/policy', {
        method: 'PUT',
        body: JSON.stringify(policySettings)
      });
      if (res.ok) {
        alert('Policy updated successfully!');
        fetchPolicySettings();
      } else {
        alert(`Failed to update policy: ${res.message || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Error updating policy:', error);
      alert('Error updating policy. Please try again.');
    }
  };

  const filteredStudents = students.filter(student => {
    const searchLower = searchQuery.toLowerCase();
    const matchesSearch = 
      student.name?.toLowerCase().includes(searchLower) ||
      student.personalDetails?.fullName?.toLowerCase().includes(searchLower) ||
      student.aadhaarNumber?.includes(searchQuery) ||
      student.passNumber?.toLowerCase().includes(searchLower) ||
      student.institution?.name?.toLowerCase().includes(searchLower) ||
      student.educationalDetails?.institutionName?.toLowerCase().includes(searchLower) ||
      student.email?.toLowerCase().includes(searchLower) ||
      student.personalDetails?.email?.toLowerCase().includes(searchLower);
    return matchesSearch;
  });

  const StatCard = ({ title, value, icon: Icon, color, subtitle }) => (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <p className="text-2xl font-bold text-gray-900 mt-2">{value}</p>
          {subtitle && <p className="text-sm text-gray-500 mt-1">{subtitle}</p>}
        </div>
        <div className={`p-3 rounded-lg ${color}`}>
          <Icon className="w-6 h-6 text-white" />
        </div>
      </div>
    </div>
  );

  const tabs = [
    { id: 'overview', name: 'Overview', icon: BarChart3 },
    { id: 'policy', name: 'Policy Engine', icon: Settings },
    { id: 'registration', name: 'Registration & Approval', icon: FileCheck },
    { id: 'monitoring', name: 'Usage Monitoring', icon: Eye },
    { id: 'fraud', name: 'Fraud Detection', icon: Shield },
    { id: 'reports', name: 'Reports', icon: FileText }
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Student Concession System</h1>
          <p className="text-gray-600 mt-1">Manage concession policies, approvals, and monitor usage</p>
        </div>
        <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center space-x-2">
          <Plus className="w-4 h-4" />
          <span>Add Student</span>
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Total Students"
          value={stats.total}
          icon={GraduationCap}
          color="bg-blue-500"
          subtitle={`${stats.approved} approved, ${stats.pending} pending`}
        />
        <StatCard
          title="Pending Approval"
          value={stats.pending}
          icon={Clock}
          color="bg-yellow-500"
          subtitle="Awaiting verification"
        />
        <StatCard
          title="Active Passes"
          value={stats.active}
          icon={UserCheck}
          color="bg-green-500"
          subtitle={`${stats.totalTrips} trips this month`}
        />
        <StatCard
          title="Revenue Impact"
          value={`₹${stats.revenueLoss.toLocaleString()}`}
          icon={TrendingUp}
          color="bg-purple-500"
          subtitle={`₹${stats.subsidyRequired.toLocaleString()} subsidy needed`}
        />
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        <div className="border-b border-gray-200">
          <nav className="flex space-x-8 px-6" aria-label="Tabs">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`${
                    activeTab === tab.id
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  } flex items-center space-x-2 py-4 px-1 border-b-2 font-medium text-sm`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{tab.name}</span>
                </button>
              );
            })}
          </nav>
        </div>

        <div className="p-6">
          {/* Tab Content */}
          {activeTab === 'overview' && (
            <div className="space-y-6">
              {/* Filters */}
              <div className="flex items-center space-x-4">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search by name, Aadhaar, pass number, or institution..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="all">All Status</option>
                  <option value="pending">Pending</option>
                  <option value="approved">Approved</option>
                  <option value="rejected">Rejected</option>
                  <option value="active">Active</option>
                  <option value="expired">Expired</option>
                </select>
                <select
                  value={categoryFilter}
                  onChange={(e) => setCategoryFilter(e.target.value)}
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="all">All Categories</option>
                  <option value="school">School</option>
                  <option value="college">College</option>
                  <option value="senior_citizen">Senior Citizen</option>
                </select>
                <button
                  onClick={fetchStudents}
                  className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 flex items-center space-x-2"
                >
                  <RefreshCw className="w-4 h-4" />
                  <span>Refresh</span>
                </button>
              </div>

              {/* Students Table */}
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Student
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Aadhaar / Pass
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Institution
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Usage
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {loading ? (
                      <tr>
                        <td colSpan="6" className="px-6 py-4 text-center">
                          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                        </td>
                      </tr>
                    ) : filteredStudents.length === 0 ? (
                      <tr>
                        <td colSpan="6" className="px-6 py-4 text-center text-gray-500">
                          No students found
                        </td>
                      </tr>
                    ) : (
                      filteredStudents.map((student) => (
                        <tr key={student._id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div>
                              <div className="text-sm font-medium text-gray-900">
                                {student.name || student.personalDetails?.fullName || 'N/A'}
                              </div>
                              <div className="text-sm text-gray-500">
                                {student.email || student.personalDetails?.email || student.personalDetails?.mobile || 'N/A'}
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900">
                              {student.aadhaarNumber ? 
                                `${student.aadhaarNumber.toString().substring(0, 4)}****${student.aadhaarNumber.toString().substring(student.aadhaarNumber.toString().length - 4)}` : 
                                'N/A'}
                            </div>
                            <div className="text-sm text-gray-500">
                              {student.passNumber || student.digitalPass?.passNumber || 'N/A'}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900">
                              {student.institution?.name || student.educationalDetails?.institutionName || 'N/A'}
                            </div>
                            <div className="text-sm text-gray-500">
                              {student.passType || student.passStatus || 'student_concession'}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span
                              className={`px-2 py-1 text-xs font-medium rounded-full ${
                                student.status === 'active' || student.eligibilityStatus === 'approved' || student.passStatus === 'approved'
                                  ? 'bg-green-100 text-green-800'
                                  : student.status === 'pending' || student.eligibilityStatus === 'pending' || student.passStatus === 'applied'
                                  ? 'bg-yellow-100 text-yellow-800'
                                  : student.status === 'rejected' || student.eligibilityStatus === 'rejected' || student.passStatus === 'rejected'
                                  ? 'bg-red-100 text-red-800'
                                  : 'bg-gray-100 text-gray-800'
                              }`}
                            >
                              {student.status || student.eligibilityStatus || student.passStatus || 'pending'}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900">
                              {student.usageHistory?.length || 0} trips
                            </div>
                            <div className="text-sm text-gray-500">
                              {student.lastUsed ? new Date(student.lastUsed).toLocaleDateString() : 
                               student.validity?.endDate ? `Expires: ${new Date(student.validity.endDate).toLocaleDateString()}` : 'Never'}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                            <div className="flex items-center space-x-2">
                              <button
                                onClick={() => {
                                  setSelectedStudent(student);
                                  setShowStudentModal(true);
                                }}
                                className="text-blue-600 hover:text-blue-900"
                                title="View Details"
                              >
                                <Eye className="w-4 h-4" />
                              </button>
                              {(student.status === 'pending' || student.eligibilityStatus === 'pending' || student.passStatus === 'applied') && (
                                <>
                                  <button
                                    onClick={() => handleApprove(student._id)}
                                    className="text-green-600 hover:text-green-900"
                                    title="Approve"
                                  >
                                    <CheckCircle className="w-4 h-4" />
                                  </button>
                                  <button
                                    onClick={() => {
                                      const reason = prompt('Rejection reason:');
                                      if (reason) handleReject(student._id, reason);
                                    }}
                                    className="text-red-600 hover:text-red-900"
                                    title="Reject"
                                  >
                                    <XCircle className="w-4 h-4" />
                                  </button>
                                </>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === 'policy' && (
            <div className="space-y-6">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h3 className="text-lg font-semibold text-blue-900 mb-2">Concession Policy Engine</h3>
                <p className="text-blue-700">
                  Define eligible categories, discount percentages, distance caps, and validity periods.
                  These rules auto-apply system-wide.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-white border border-gray-200 rounded-lg p-6">
                  <h4 className="text-lg font-semibold text-gray-900 mb-4">Discount Percentages</h4>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        School Students (%)
                      </label>
                      <input
                        type="number"
                        value={policySettings.schoolDiscount}
                        onChange={(e) => setPolicySettings({...policySettings, schoolDiscount: parseInt(e.target.value)})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        min="0"
                        max="100"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        College Students (%)
                      </label>
                      <input
                        type="number"
                        value={policySettings.collegeDiscount}
                        onChange={(e) => setPolicySettings({...policySettings, collegeDiscount: parseInt(e.target.value)})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        min="0"
                        max="100"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Senior Citizens (%)
                      </label>
                      <input
                        type="number"
                        value={policySettings.seniorCitizenDiscount}
                        onChange={(e) => setPolicySettings({...policySettings, seniorCitizenDiscount: parseInt(e.target.value)})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        min="0"
                        max="100"
                      />
                    </div>
                  </div>
                </div>

                <div className="bg-white border border-gray-200 rounded-lg p-6">
                  <h4 className="text-lg font-semibold text-gray-900 mb-4">Limits & Validity</h4>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Distance Cap (km)
                      </label>
                      <input
                        type="number"
                        value={policySettings.distanceCap}
                        onChange={(e) => setPolicySettings({...policySettings, distanceCap: parseInt(e.target.value)})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        min="0"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Validity Period (days)
                      </label>
                      <input
                        type="number"
                        value={policySettings.validityPeriod}
                        onChange={(e) => setPolicySettings({...policySettings, validityPeriod: parseInt(e.target.value)})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        min="1"
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex justify-end">
                <button
                  onClick={handleUpdatePolicy}
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Save Policy Settings
                </button>
              </div>
            </div>
          )}

          {activeTab === 'registration' && (
            <div className="space-y-6">
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <h3 className="text-lg font-semibold text-green-900 mb-2">Student Registration & Aadhaar Logic</h3>
                <p className="text-green-700">
                  Students submit Aadhaar number, institution details, route & depot, photo & ID proof.
                  System performs Aadhaar pattern validation (logic-based), duplicate concession detection,
                  and age-based auto classification.
                </p>
              </div>
              {/* Registration content */}
            </div>
          )}

          {activeTab === 'monitoring' && (
            <div className="space-y-6">
              <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                <h3 className="text-lg font-semibold text-purple-900 mb-2">Concession Usage Monitoring</h3>
                <p className="text-purple-700">
                  Track number of concession trips per student, route-wise concession load, revenue loss vs social benefit,
                  and misuse patterns. AI flags overuse, unusual travel patterns, and possible fraud.
                </p>
              </div>
              {/* Monitoring content */}
            </div>
          )}

          {activeTab === 'fraud' && (
            <div className="space-y-6">
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <h3 className="text-lg font-semibold text-red-900 mb-2">AI Fraud Detection</h3>
                <p className="text-red-700">
                  System automatically flags: overuse patterns, unusual travel patterns, possible duplicate passes,
                  and suspicious activity. Cross-check with GPS + trip data for validation.
                </p>
              </div>
              {/* Fraud detection content */}
            </div>
          )}

          {activeTab === 'reports' && (
            <div className="space-y-6">
              <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-4">
                <h3 className="text-lg font-semibold text-indigo-900 mb-2">Subsidy Reports</h3>
                <p className="text-indigo-700">
                  Export concession data, generate subsidy reports showing student count, route usage, and financial impact.
                  Makes the system policy-ready for government subsidy programs.
                </p>
              </div>
              {/* Reports content */}
            </div>
          )}
        </div>
      </div>

      {/* Student Detail Modal */}
      {showStudentModal && selectedStudent && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold text-gray-900">Student Details</h2>
                <button
                  onClick={() => setShowStudentModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <XCircle className="w-6 h-6" />
                </button>
              </div>
            </div>
            <div className="p-6 space-y-6">
              {/* Student details will be shown here */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-700">Name</label>
                  <p className="text-gray-900">{selectedStudent.name || selectedStudent.personalDetails?.fullName || 'N/A'}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">Aadhaar</label>
                  <p className="text-gray-900">{selectedStudent.aadhaarNumber || 'N/A'}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">Institution</label>
                  <p className="text-gray-900">{selectedStudent.institution?.name || selectedStudent.educationalDetails?.institutionName || 'N/A'}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">Pass Number</label>
                  <p className="text-gray-900">{selectedStudent.passNumber || 'N/A'}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminStudentConcession;
