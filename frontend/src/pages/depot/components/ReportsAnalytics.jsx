import React, { useState, useEffect } from 'react';
import { useAuth } from '../../../context/AuthContext';
import { reportsApiService } from '../../../services/depotApiService';
import './ManagementPages.css';
import { 
  Download, 
  Calendar,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Users,
  Bus,
  MapPin,
  BarChart3,
  PieChart,
  FileText
} from 'lucide-react';

const ReportsAnalytics = () => {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedReport, setSelectedReport] = useState('revenue');
  const [dateRange, setDateRange] = useState('7d');
  const [reportData, setReportData] = useState({
    revenue: {
      total: 125000,
      today: 8500,
      growth: 12.5,
      trend: 'up'
    },
    bookings: {
      total: 450,
      today: 25,
      growth: 8.3,
      trend: 'up'
    },
    trips: {
      total: 120,
      today: 8,
      growth: -2.1,
      trend: 'down'
    },
    passengers: {
      total: 1250,
      today: 85,
      growth: 15.2,
      trend: 'up'
    }
  });

  useEffect(() => {
    fetchReports();
  }, []);

  const fetchReports = async () => {
    try {
      setLoading(true);
      const response = await reportsApiService.getReports();
      console.log('Reports & Analytics - API response:', response);
      
      // Handle different response structures
      let reportsData = [];
      if (response.success && response.data) {
        reportsData = Array.isArray(response.data) ? response.data : response.data.reports || [];
      } else if (Array.isArray(response)) {
        reportsData = response;
      } else if (response.reports) {
        reportsData = response.reports;
      }
      
      console.log('Reports & Analytics - Parsed reports:', reportsData);
      
      // If no reports found, provide sample data
      if (reportsData.length === 0) {
        const sampleReports = [
          {
            _id: 'report1',
            reportName: 'Daily Revenue Report',
            reportType: 'revenue',
            generatedDate: '2024-01-15',
            period: '2024-01-15',
            status: 'completed',
            fileSize: '2.5 MB'
          },
          {
            _id: 'report2',
            reportName: 'Monthly Booking Analysis',
            reportType: 'bookings',
            generatedDate: '2024-01-14',
            period: '2024-01',
            status: 'completed',
            fileSize: '1.8 MB'
          },
          {
            _id: 'report3',
            reportName: 'Trip Performance Report',
            reportType: 'trips',
            generatedDate: '2024-01-13',
            period: '2024-01-01 to 2024-01-13',
            status: 'completed',
            fileSize: '3.2 MB'
          }
        ];
        setReports(sampleReports);
      } else {
        setReports(reportsData);
      }
    } catch (error) {
      console.error('Error fetching reports in ReportsAnalytics:', error);
      // Provide sample data even on error
      const sampleReports = [
        {
          _id: 'report1',
          reportName: 'Daily Revenue Report',
          reportType: 'revenue',
          generatedDate: '2024-01-15',
          period: '2024-01-15',
          status: 'completed',
          fileSize: '2.5 MB'
        }
      ];
      setReports(sampleReports);
    } finally {
      setLoading(false);
    }
  };

  const generateReport = async (reportType) => {
    try {
      // Generate report logic here
      const newReport = {
        _id: `report_${Date.now()}`,
        reportName: `${reportType.charAt(0).toUpperCase() + reportType.slice(1)} Report`,
        reportType: reportType,
        generatedDate: new Date().toISOString().split('T')[0],
        period: dateRange,
        status: 'completed',
        fileSize: '2.1 MB'
      };
      
      setReports([newReport, ...reports]);
    } catch (error) {
      console.error('Error generating report:', error);
    }
  };

  const downloadReport = (report) => {
    // Download report logic here
    console.log('Downloading report:', report.reportName);
  };

  if (loading) {
    return (
      <div className="reports-analytics">
        <div className="page-header">
          <h1>Reports & Analytics</h1>
          <p>Loading reports...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="reports-analytics">
      {/* Page Header */}
      <div className="page-header">
        <div className="header-content">
          <div className="header-text">
            <h1>Reports & Analytics</h1>
            <p>Generate and view comprehensive reports and analytics</p>
          </div>
          <div className="header-actions">
            <select
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value)}
              className="date-range-select"
            >
              <option value="1d">Last 24 Hours</option>
              <option value="7d">Last 7 Days</option>
              <option value="30d">Last 30 Days</option>
              <option value="90d">Last 90 Days</option>
            </select>
          </div>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="metrics-grid">
        <div className="metric-card">
          <div className="metric-icon blue">
            <DollarSign size={24} />
          </div>
          <div className="metric-content">
            <h3>Total Revenue</h3>
            <div className="metric-value">₹{reportData.revenue.total.toLocaleString()}</div>
            <div className={`metric-change ${reportData.revenue.trend}`}>
              {reportData.revenue.trend === 'up' ? <TrendingUp size={16} /> : <TrendingDown size={16} />}
              <span>{reportData.revenue.growth}%</span>
            </div>
          </div>
        </div>
        <div className="metric-card">
          <div className="metric-icon green">
            <Users size={24} />
          </div>
          <div className="metric-content">
            <h3>Total Bookings</h3>
            <div className="metric-value">{reportData.bookings.total}</div>
            <div className={`metric-change ${reportData.bookings.trend}`}>
              {reportData.bookings.trend === 'up' ? <TrendingUp size={16} /> : <TrendingDown size={16} />}
              <span>{reportData.bookings.growth}%</span>
            </div>
          </div>
        </div>
        <div className="metric-card">
          <div className="metric-icon yellow">
            <Bus size={24} />
          </div>
          <div className="metric-content">
            <h3>Total Trips</h3>
            <div className="metric-value">{reportData.trips.total}</div>
            <div className={`metric-change ${reportData.trips.trend}`}>
              {reportData.trips.trend === 'up' ? <TrendingUp size={16} /> : <TrendingDown size={16} />}
              <span>{reportData.trips.growth}%</span>
            </div>
          </div>
        </div>
        <div className="metric-card">
          <div className="metric-icon purple">
            <MapPin size={24} />
          </div>
          <div className="metric-content">
            <h3>Total Passengers</h3>
            <div className="metric-value">{reportData.passengers.total}</div>
            <div className={`metric-change ${reportData.passengers.trend}`}>
              {reportData.passengers.trend === 'up' ? <TrendingUp size={16} /> : <TrendingDown size={16} />}
              <span>{reportData.passengers.growth}%</span>
            </div>
          </div>
        </div>
      </div>

      {/* Report Generation */}
      <div className="report-generation">
        <h3>Generate Reports</h3>
        <div className="report-types">
          <button 
            className={`report-type-btn ${selectedReport === 'revenue' ? 'active' : ''}`}
            onClick={() => setSelectedReport('revenue')}
          >
            <DollarSign size={20} />
            Revenue Report
          </button>
          <button 
            className={`report-type-btn ${selectedReport === 'bookings' ? 'active' : ''}`}
            onClick={() => setSelectedReport('bookings')}
          >
            <Users size={20} />
            Booking Report
          </button>
          <button 
            className={`report-type-btn ${selectedReport === 'trips' ? 'active' : ''}`}
            onClick={() => setSelectedReport('trips')}
          >
            <Bus size={20} />
            Trip Report
          </button>
          <button 
            className={`report-type-btn ${selectedReport === 'performance' ? 'active' : ''}`}
            onClick={() => setSelectedReport('performance')}
          >
            <BarChart3 size={20} />
            Performance Report
          </button>
        </div>
        <button 
          className="generate-report-btn"
          onClick={() => generateReport(selectedReport)}
        >
          <FileText size={20} />
          Generate {selectedReport.charAt(0).toUpperCase() + selectedReport.slice(1)} Report
        </button>
      </div>

      {/* Reports List */}
      <div className="reports-list">
        <div className="table-header">
          <h3>Generated Reports ({reports.length})</h3>
        </div>
        <div className="table-wrapper">
          <table className="reports-table">
            <thead>
              <tr>
                <th>Report Name</th>
                <th>Type</th>
                <th>Period</th>
                <th>Generated Date</th>
                <th>Status</th>
                <th>File Size</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {reports.length > 0 ? reports.map((report, index) => (
                <tr key={report._id || index}>
                  <td>
                    <div className="report-name">
                      <FileText size={16} />
                      <span>{report.reportName}</span>
                    </div>
                  </td>
                  <td>
                    <span className="report-type-badge">
                      {report.reportType?.charAt(0).toUpperCase() + report.reportType?.slice(1)}
                    </span>
                  </td>
                  <td>
                    <div className="report-period">
                      <Calendar size={16} />
                      <span>{report.period}</span>
                    </div>
                  </td>
                  <td>
                    <span>{new Date(report.generatedDate).toLocaleDateString()}</span>
                  </td>
                  <td>
                    <span className={`status-badge ${report.status || 'unknown'}`}>
                      {report.status?.charAt(0).toUpperCase() + report.status?.slice(1)}
                    </span>
                  </td>
                  <td>
                    <span>{report.fileSize}</span>
                  </td>
                  <td>
                    <div className="action-buttons">
                      <button 
                        className="action-btn download"
                        onClick={() => downloadReport(report)}
                      >
                        <Download size={16} />
                        Download
                      </button>
                    </div>
                  </td>
                </tr>
              )) : (
                <tr>
                  <td colSpan="7" className="no-data">
                    <div className="empty-state">
                      <FileText size={48} />
                      <h3>No reports found</h3>
                      <p>Generate your first report to get started</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Analytics Charts Placeholder */}
      <div className="analytics-charts">
        <h3>Analytics Dashboard</h3>
        <div className="charts-grid">
          <div className="chart-placeholder">
            <BarChart3 size={48} />
            <h4>Revenue Trend</h4>
            <p>Revenue analysis over time</p>
          </div>
          <div className="chart-placeholder">
            <PieChart size={48} />
            <h4>Route Performance</h4>
            <p>Performance by route</p>
          </div>
          <div className="chart-placeholder">
            <TrendingUp size={48} />
            <h4>Booking Trends</h4>
            <p>Booking patterns analysis</p>
          </div>
          <div className="chart-placeholder">
            <Bus size={48} />
            <h4>Fleet Utilization</h4>
            <p>Bus utilization rates</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReportsAnalytics;