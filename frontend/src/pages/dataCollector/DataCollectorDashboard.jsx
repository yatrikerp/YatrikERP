import React, { useState, useEffect } from 'react';
import {
  Upload,
  FileText,
  CheckCircle,
  XCircle,
  Clock,
  TrendingUp,
  Calendar,
  Database,
  BarChart3,
  Filter,
  Download,
  Eye,
  AlertTriangle,
  RefreshCw
} from 'lucide-react';
import axios from 'axios';

const DataCollectorDashboard = () => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [dashboardData, setDashboardData] = useState(null);
  const [uploads, setUploads] = useState([]);
  const [statistics, setStatistics] = useState(null);
  const [loading, setLoading] = useState(false);
  
  // Upload form state
  const [uploadFile, setUploadFile] = useState(null);
  const [uploadFormData, setUploadFormData] = useState({
    depotId: '',
    busId: '',
    tripId: '',
    routeId: '',
    dataDate: '',
    machineId: '',
    machineModel: '',
    machineSerial: '',
    notes: ''
  });
  
  const [depots, setDepots] = useState([]);
  const [filterStatus, setFilterStatus] = useState('');

  useEffect(() => {
    if (activeTab === 'dashboard') {
      fetchDashboardData();
    } else if (activeTab === 'uploads') {
      fetchUploads();
    } else if (activeTab === 'statistics') {
      fetchStatistics();
    }
  }, [activeTab]);

  useEffect(() => {
    fetchDepots();
  }, []);

  const fetchDepots = async () => {
    try {
      const response = await axios.get('http://localhost:5000/api/depots', {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`
        }
      });
      setDepots(response.data.data || response.data);
    } catch (error) {
      console.error('Error fetching depots:', error);
    }
  };

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const response = await axios.get('http://localhost:5000/api/data-collector/dashboard', {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`
        }
      });
      setDashboardData(response.data.data);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchUploads = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (filterStatus) params.append('status', filterStatus);
      
      const response = await axios.get(
        `http://localhost:5000/api/data-collector/uploads?${params.toString()}`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`
          }
        }
      );
      setUploads(response.data.data.uploads);
    } catch (error) {
      console.error('Error fetching uploads:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchStatistics = async () => {
    try {
      setLoading(true);
      const response = await axios.get('http://localhost:5000/api/data-collector/statistics', {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`
        }
      });
      setStatistics(response.data.data);
    } catch (error) {
      console.error('Error fetching statistics:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const allowedTypes = ['text/csv', 'text/plain', 'application/json', 'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'];
      if (!allowedTypes.includes(file.type) && !file.name.match(/\.(csv|txt|json|xlsx|xls)$/i)) {
        alert('Only CSV, TXT, JSON, and Excel files are allowed');
        e.target.value = '';
        return;
      }
      setUploadFile(file);
    }
  };

  const handleUpload = async () => {
    if (!uploadFile) {
      alert('Please select a file to upload');
      return;
    }

    if (!uploadFormData.depotId || !uploadFormData.dataDate || !uploadFormData.machineId) {
      alert('Depot, data date, and machine ID are required');
      return;
    }

    try {
      setLoading(true);
      const formData = new FormData();
      formData.append('ticketFile', uploadFile);
      Object.keys(uploadFormData).forEach(key => {
        if (uploadFormData[key]) {
          formData.append(key, uploadFormData[key]);
        }
      });

      const response = await axios.post(
        'http://localhost:5000/api/data-collector/upload',
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
            Authorization: `Bearer ${localStorage.getItem('token')}`
          }
        }
      );

      alert('File uploaded successfully!');
      setUploadFile(null);
      setUploadFormData({
        depotId: '',
        busId: '',
        tripId: '',
        routeId: '',
        dataDate: '',
        machineId: '',
        machineModel: '',
        machineSerial: '',
        notes: ''
      });
      document.getElementById('fileInput').value = '';
      fetchDashboardData();
    } catch (error) {
      console.error('Error uploading file:', error);
      alert(error.response?.data?.message || 'Error uploading file');
    } finally {
      setLoading(false);
    }
  };

  const renderDashboard = () => (
    <div className="space-y-6">
      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
              <Upload className="w-6 h-6 text-blue-600" />
            </div>
            <span className="text-sm text-gray-500">Today</span>
          </div>
          <h3 className="text-2xl font-bold text-gray-900 mb-1">
            {dashboardData?.todayUploads || 0}
          </h3>
          <p className="text-sm text-gray-600">Uploads</p>
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
              <FileText className="w-6 h-6 text-green-600" />
            </div>
            <span className="text-sm text-gray-500">Total</span>
          </div>
          <h3 className="text-2xl font-bold text-gray-900 mb-1">
            {dashboardData?.totalUploads || 0}
          </h3>
          <p className="text-sm text-gray-600">Total Uploads</p>
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center">
              <Clock className="w-6 h-6 text-orange-600" />
            </div>
            <span className="text-sm text-gray-500">Pending</span>
          </div>
          <h3 className="text-2xl font-bold text-gray-900 mb-1">
            {dashboardData?.pendingProcessing || 0}
          </h3>
          <p className="text-sm text-gray-600">Processing</p>
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
              <Database className="w-6 h-6 text-purple-600" />
            </div>
            <span className="text-sm text-gray-500">Total</span>
          </div>
          <h3 className="text-2xl font-bold text-gray-900 mb-1">
            {dashboardData?.statistics?.totalTickets || 0}
          </h3>
          <p className="text-sm text-gray-600">Tickets Processed</p>
        </div>
      </div>

      {/* Recent Uploads */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm">
        <div className="p-6 border-b border-gray-100">
          <h3 className="text-lg font-semibold text-gray-900">Recent Uploads</h3>
          <p className="text-sm text-gray-600 mt-1">Your latest ticket data uploads</p>
        </div>
        <div className="p-6">
          {dashboardData?.recentUploads && dashboardData.recentUploads.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">File Name</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">Depot</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">Date</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">Tickets</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {dashboardData.recentUploads.map((upload, index) => (
                    <tr key={index} className="border-b border-gray-100">
                      <td className="py-3 px-4 text-sm text-gray-900">{upload.fileName}</td>
                      <td className="py-3 px-4 text-sm text-gray-900">
                        {upload.depotId?.name || 'N/A'}
                      </td>
                      <td className="py-3 px-4 text-sm text-gray-900">
                        {new Date(upload.dataDate).toLocaleDateString()}
                      </td>
                      <td className="py-3 px-4 text-sm text-gray-900">{upload.totalTickets || 0}</td>
                      <td className="py-3 px-4">
                        <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                          upload.processingStatus === 'completed' ? 'bg-green-100 text-green-800' :
                          upload.processingStatus === 'processing' ? 'bg-blue-100 text-blue-800' :
                          upload.processingStatus === 'failed' ? 'bg-red-100 text-red-800' :
                          'bg-yellow-100 text-yellow-800'
                        }`}>
                          {upload.processingStatus}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-gray-500 text-center py-8">No uploads yet</p>
          )}
        </div>
      </div>
    </div>
  );

  const renderUploadForm = () => (
    <div className="space-y-6">
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm">
        <div className="p-6 border-b border-gray-100">
          <h3 className="text-lg font-semibold text-gray-900">Upload Ticket Machine Data</h3>
          <p className="text-sm text-gray-600 mt-1">Upload daily ticket machine data for AI training</p>
        </div>
        <div className="p-6">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Ticket Data File <span className="text-red-600">*</span>
              </label>
              <input
                id="fileInput"
                type="file"
                onChange={handleFileChange}
                accept=".csv,.txt,.json,.xlsx,.xls"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <p className="text-xs text-gray-500 mt-1">Supported formats: CSV, TXT, JSON, Excel (Max 50MB)</p>
              {uploadFile && (
                <p className="text-sm text-green-600 mt-2">Selected: {uploadFile.name} ({(uploadFile.size / 1024 / 1024).toFixed(2)} MB)</p>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Depot <span className="text-red-600">*</span>
                </label>
                <select
                  value={uploadFormData.depotId}
                  onChange={(e) => setUploadFormData(prev => ({ ...prev, depotId: e.target.value }))}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">Select Depot</option>
                  {depots.map(depot => (
                    <option key={depot._id} value={depot._id}>{depot.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Data Date <span className="text-red-600">*</span>
                </label>
                <input
                  type="date"
                  value={uploadFormData.dataDate}
                  onChange={(e) => setUploadFormData(prev => ({ ...prev, dataDate: e.target.value }))}
                  max={new Date().toISOString().split('T')[0]}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Machine ID <span className="text-red-600">*</span>
                </label>
                <input
                  type="text"
                  value={uploadFormData.machineId}
                  onChange={(e) => setUploadFormData(prev => ({ ...prev, machineId: e.target.value }))}
                  placeholder="e.g., TM-001"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Machine Model
                </label>
                <input
                  type="text"
                  value={uploadFormData.machineModel}
                  onChange={(e) => setUploadFormData(prev => ({ ...prev, machineModel: e.target.value }))}
                  placeholder="e.g., Wayfarer S200"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Serial Number
                </label>
                <input
                  type="text"
                  value={uploadFormData.machineSerial}
                  onChange={(e) => setUploadFormData(prev => ({ ...prev, machineSerial: e.target.value }))}
                  placeholder="e.g., SN123456"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Additional Notes
              </label>
              <textarea
                value={uploadFormData.notes}
                onChange={(e) => setUploadFormData(prev => ({ ...prev, notes: e.target.value }))}
                rows={3}
                placeholder="Any additional information about this upload..."
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div className="flex justify-end gap-3 pt-4">
              <button
                onClick={() => {
                  setUploadFile(null);
                  setUploadFormData({
                    depotId: '',
                    busId: '',
                    tripId: '',
                    routeId: '',
                    dataDate: '',
                    machineId: '',
                    machineModel: '',
                    machineSerial: '',
                    notes: ''
                  });
                  document.getElementById('fileInput').value = '';
                }}
                className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Clear
              </button>
              <button
                onClick={handleUpload}
                disabled={loading || !uploadFile || !uploadFormData.depotId || !uploadFormData.dataDate || !uploadFormData.machineId}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                <Upload className="w-4 h-4" />
                Upload Data
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderUploads = () => (
    <div className="space-y-6">
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm">
        <div className="p-6 border-b border-gray-100 flex justify-between items-center">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">All Uploads</h3>
            <p className="text-sm text-gray-600 mt-1">View and manage your uploaded ticket data</p>
          </div>
          <select
            value={filterStatus}
            onChange={(e) => {
              setFilterStatus(e.target.value);
              fetchUploads();
            }}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="">All Status</option>
            <option value="pending">Pending</option>
            <option value="processing">Processing</option>
            <option value="completed">Completed</option>
            <option value="failed">Failed</option>
            <option value="verified">Verified</option>
          </select>
        </div>
        <div className="p-6">
          {uploads && uploads.length > 0 ? (
            <div className="space-y-4">
              {uploads.map((upload, index) => (
                <div key={index} className="border border-gray-200 rounded-lg p-4 hover:border-blue-300 transition-colors">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <h4 className="font-medium text-gray-900">{upload.fileName}</h4>
                      <p className="text-sm text-gray-600 mt-1">
                        Upload ID: {upload.uploadId}
                      </p>
                    </div>
                    <span className={`inline-flex px-3 py-1 text-xs font-medium rounded-full ${
                      upload.processingStatus === 'completed' ? 'bg-green-100 text-green-800' :
                      upload.processingStatus === 'processing' ? 'bg-blue-100 text-blue-800' :
                      upload.processingStatus === 'failed' ? 'bg-red-100 text-red-800' :
                      upload.processingStatus === 'verified' ? 'bg-purple-100 text-purple-800' :
                      'bg-yellow-100 text-yellow-800'
                    }`}>
                      {upload.processingStatus}
                    </span>
                  </div>
                  
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div>
                      <p className="text-gray-600">Depot</p>
                      <p className="font-medium text-gray-900">{upload.depotId?.name || 'N/A'}</p>
                    </div>
                    <div>
                      <p className="text-gray-600">Data Date</p>
                      <p className="font-medium text-gray-900">
                        {new Date(upload.dataDate).toLocaleDateString()}
                      </p>
                    </div>
                    <div>
                      <p className="text-gray-600">Tickets</p>
                      <p className="font-medium text-gray-900">{upload.totalTickets || 0}</p>
                    </div>
                    <div>
                      <p className="text-gray-600">Revenue</p>
                      <p className="font-medium text-gray-900">₹{(upload.totalRevenue || 0).toLocaleString()}</p>
                    </div>
                  </div>
                  
                  {upload.processingError && (
                    <div className="mt-3 p-3 bg-red-50 rounded-lg">
                      <p className="text-sm text-red-800 flex items-center gap-2">
                        <AlertTriangle className="w-4 h-4" />
                        {upload.processingError}
                      </p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 text-center py-8">No uploads found</p>
          )}
        </div>
      </div>
    </div>
  );

  const renderStatistics = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
              <FileText className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <h3 className="text-2xl font-bold text-gray-900">
                {statistics?.overall?.totalUploads || 0}
              </h3>
              <p className="text-sm text-gray-600">Total Uploads</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
              <Database className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <h3 className="text-2xl font-bold text-gray-900">
                {statistics?.overall?.totalTickets || 0}
              </h3>
              <p className="text-sm text-gray-600">Total Tickets</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
              <TrendingUp className="w-6 h-6 text-purple-600" />
            </div>
            <div>
              <h3 className="text-2xl font-bold text-gray-900">
                ₹{(statistics?.overall?.totalRevenue || 0).toLocaleString()}
              </h3>
              <p className="text-sm text-gray-600">Total Revenue</p>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm">
        <div className="p-6 border-b border-gray-100">
          <h3 className="text-lg font-semibold text-gray-900">Upload Statistics</h3>
          <p className="text-sm text-gray-600 mt-1">Detailed breakdown of your uploads</p>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <div className="text-center">
              <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <Clock className="w-8 h-8 text-yellow-600" />
              </div>
              <h4 className="text-2xl font-bold text-gray-900">
                {statistics?.statusBreakdown?.pending || 0}
              </h4>
              <p className="text-sm text-gray-600 mt-1">Pending</p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <RefreshCw className="w-8 h-8 text-blue-600" />
              </div>
              <h4 className="text-2xl font-bold text-gray-900">
                {statistics?.statusBreakdown?.processing || 0}
              </h4>
              <p className="text-sm text-gray-600 mt-1">Processing</p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <CheckCircle className="w-8 h-8 text-green-600" />
              </div>
              <h4 className="text-2xl font-bold text-gray-900">
                {statistics?.statusBreakdown?.completed || 0}
              </h4>
              <p className="text-sm text-gray-600 mt-1">Completed</p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <XCircle className="w-8 h-8 text-red-600" />
              </div>
              <h4 className="text-2xl font-bold text-gray-900">
                {statistics?.statusBreakdown?.failed || 0}
              </h4>
              <p className="text-sm text-gray-600 mt-1">Failed</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900">Data Collector Dashboard</h1>
          <p className="text-gray-600 mt-1">Upload and manage daily ticket machine data</p>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm mb-6">
          <div className="flex border-b border-gray-100">
            <button
              onClick={() => setActiveTab('dashboard')}
              className={`flex-1 px-6 py-4 text-sm font-medium transition-all ${
                activeTab === 'dashboard'
                  ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
              }`}
            >
              <div className="flex items-center justify-center gap-2">
                <TrendingUp className="w-4 h-4" />
                <span>Dashboard</span>
              </div>
            </button>
            
            <button
              onClick={() => setActiveTab('upload')}
              className={`flex-1 px-6 py-4 text-sm font-medium transition-all ${
                activeTab === 'upload'
                  ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
              }`}
            >
              <div className="flex items-center justify-center gap-2">
                <Upload className="w-4 h-4" />
                <span>Upload Data</span>
              </div>
            </button>
            
            <button
              onClick={() => setActiveTab('uploads')}
              className={`flex-1 px-6 py-4 text-sm font-medium transition-all ${
                activeTab === 'uploads'
                  ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
              }`}
            >
              <div className="flex items-center justify-center gap-2">
                <FileText className="w-4 h-4" />
                <span>All Uploads</span>
              </div>
            </button>
            
            <button
              onClick={() => setActiveTab('statistics')}
              className={`flex-1 px-6 py-4 text-sm font-medium transition-all ${
                activeTab === 'statistics'
                  ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
              }`}
            >
              <div className="flex items-center justify-center gap-2">
                <BarChart3 className="w-4 h-4" />
                <span>Statistics</span>
              </div>
            </button>
          </div>
        </div>

        {/* Content */}
        {activeTab === 'dashboard' && renderDashboard()}
        {activeTab === 'upload' && renderUploadForm()}
        {activeTab === 'uploads' && renderUploads()}
        {activeTab === 'statistics' && renderStatistics()}
      </div>
    </div>
  );
};

export default DataCollectorDashboard;

