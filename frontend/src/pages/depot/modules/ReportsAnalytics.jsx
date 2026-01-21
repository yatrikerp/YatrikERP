import React, { useState, useEffect } from 'react';
import { BarChart3, Download, FileText, Calendar, TrendingUp } from 'lucide-react';
import { apiFetch } from '../../../utils/api';
import toast from 'react-hot-toast';

const ReportsAnalytics = () => {
  const [reports, setReports] = useState({
    daily: null,
    weekly: null,
    monthly: null
  });
  const [loading, setLoading] = useState(true);
  const [reportType, setReportType] = useState('daily'); // daily, weekly, monthly
  const [dateRange, setDateRange] = useState({
    start: new Date().toISOString().split('T')[0],
    end: new Date().toISOString().split('T')[0]
  });

  useEffect(() => {
    fetchReport();
  }, [reportType, dateRange]);

  const fetchReport = async () => {
    try {
      setLoading(true);
      let endpoint = '';
      if (reportType === 'daily') {
        endpoint = `/api/depot/reports/daily?date=${dateRange.start}`;
      } else if (reportType === 'weekly') {
        endpoint = `/api/depot/reports/weekly?start=${dateRange.start}&end=${dateRange.end}`;
      } else {
        endpoint = `/api/depot/reports/monthly?month=${new Date().getMonth() + 1}&year=${new Date().getFullYear()}`;
      }

      const res = await apiFetch(endpoint);
      if (res.ok) {
        setReports(prev => ({
          ...prev,
          [reportType]: res.data
        }));
      } else {
        setReports(prev => ({
          ...prev,
          [reportType]: null
        }));
      }
    } catch (error) {
      // Handle missing endpoint gracefully
      setReports(prev => ({
        ...prev,
        [reportType]: null
      }));
    } finally {
      setLoading(false);
    }
  };

  const handleExport = async (format) => {
    try {
      let endpoint = '';
      if (reportType === 'daily') {
        endpoint = `/api/depot/reports/daily/export?date=${dateRange.start}&format=${format}`;
      } else if (reportType === 'weekly') {
        endpoint = `/api/depot/reports/weekly/export?start=${dateRange.start}&end=${dateRange.end}&format=${format}`;
      } else {
        endpoint = `/api/depot/reports/monthly/export?month=${new Date().getMonth() + 1}&year=${new Date().getFullYear()}&format=${format}`;
      }

      const res = await apiFetch(endpoint, { suppressError: true });
      if (res.ok) {
        // Handle file download
        const blob = new Blob([res.data], { type: format === 'pdf' ? 'application/pdf' : 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `depot-report-${reportType}-${new Date().toISOString().split('T')[0]}.${format}`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
        toast.success(`Report exported as ${format.toUpperCase()} successfully!`);
      } else {
        toast.error(res.message || 'Failed to export report');
      }
    } catch (error) {
      toast.error('Error exporting report. Please try again.');
      console.error('Error exporting report:', error);
    }
  };

  const currentReport = reports[reportType];

  return (
    <div>
      {/* Report Type Selector */}
      <div className="module-card">
        <div className="module-card-header">
          <h3 className="module-card-title">
            <BarChart3 className="icon-md" />
            Depot Reports & Analytics
          </h3>
          <div style={{ display: 'flex', gap: '12px' }}>
            <button
              className="btn btn-secondary"
              onClick={() => handleExport('pdf')}
              style={{ padding: '8px 16px' }}
            >
              <Download className="icon-sm" />
              Export PDF
            </button>
            <button
              className="btn btn-secondary"
              onClick={() => handleExport('csv')}
              style={{ padding: '8px 16px' }}
            >
              <Download className="icon-sm" />
              Export CSV
            </button>
          </div>
        </div>

        {/* Report Type Tabs */}
        <div style={{ display: 'flex', borderBottom: '1px solid #e2e8f0', marginBottom: '20px' }}>
          <button
            onClick={() => setReportType('daily')}
            style={{
              padding: '12px 24px',
              background: 'transparent',
              border: 'none',
              borderBottom: reportType === 'daily' ? '2px solid #3b82f6' : '2px solid transparent',
              color: reportType === 'daily' ? '#3b82f6' : '#64748b',
              fontWeight: reportType === 'daily' ? 600 : 500,
              cursor: 'pointer',
              fontSize: '14px'
            }}
          >
            Daily Summary
          </button>
          <button
            onClick={() => setReportType('weekly')}
            style={{
              padding: '12px 24px',
              background: 'transparent',
              border: 'none',
              borderBottom: reportType === 'weekly' ? '2px solid #3b82f6' : '2px solid transparent',
              color: reportType === 'weekly' ? '#3b82f6' : '#64748b',
              fontWeight: reportType === 'weekly' ? 600 : 500,
              cursor: 'pointer',
              fontSize: '14px'
            }}
          >
            Weekly Report
          </button>
          <button
            onClick={() => setReportType('monthly')}
            style={{
              padding: '12px 24px',
              background: 'transparent',
              border: 'none',
              borderBottom: reportType === 'monthly' ? '2px solid #3b82f6' : '2px solid transparent',
              color: reportType === 'monthly' ? '#3b82f6' : '#64748b',
              fontWeight: reportType === 'monthly' ? 600 : 500,
              cursor: 'pointer',
              fontSize: '14px'
            }}
          >
            Monthly Report
          </button>
        </div>

        {/* Date Range Selector */}
        <div style={{ display: 'flex', gap: '16px', marginBottom: '20px', flexWrap: 'wrap' }}>
          {reportType === 'daily' && (
            <div style={{ minWidth: '200px' }}>
              <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: 500 }}>
                Select Date
              </label>
              <input
                type="date"
                value={dateRange.start}
                onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })}
                style={{
                  width: '100%',
                  padding: '10px',
                  border: '1px solid #e2e8f0',
                  borderRadius: '8px'
                }}
              />
            </div>
          )}
          {(reportType === 'weekly' || reportType === 'monthly') && (
            <>
              <div style={{ minWidth: '200px' }}>
                <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: 500 }}>
                  Start Date
                </label>
                <input
                  type="date"
                  value={dateRange.start}
                  onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '10px',
                    border: '1px solid #e2e8f0',
                    borderRadius: '8px'
                  }}
                />
              </div>
              <div style={{ minWidth: '200px' }}>
                <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: 500 }}>
                  End Date
                </label>
                <input
                  type="date"
                  value={dateRange.end}
                  onChange={(e) => setDateRange({ ...dateRange, end: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '10px',
                    border: '1px solid #e2e8f0',
                    borderRadius: '8px'
                  }}
                />
              </div>
            </>
          )}
        </div>
      </div>

      {/* Report Content */}
      {loading ? (
        <div className="module-card">
          <div className="empty-state">
            <div className="loading-spinner" style={{ margin: '0 auto' }}></div>
            <p>Generating report...</p>
          </div>
        </div>
      ) : currentReport ? (
        <div>
          {/* Summary Cards */}
          <div className="kpi-grid">
            <div className="kpi-card">
              <div className="kpi-card-header">
                <div className="kpi-icon" style={{ background: '#dbeafe', color: '#3b82f6' }}>
                  <TrendingUp className="icon-lg" />
                </div>
              </div>
              <div className="kpi-value">{currentReport.totalTrips || 0}</div>
              <div className="kpi-label">Total Trips</div>
            </div>
            <div className="kpi-card">
              <div className="kpi-card-header">
                <div className="kpi-icon" style={{ background: '#d1fae5', color: '#10b981' }}>
                  <FileText className="icon-lg" />
                </div>
              </div>
              <div className="kpi-value">₹{currentReport.totalRevenue?.toLocaleString() || 0}</div>
              <div className="kpi-label">Total Revenue</div>
            </div>
            <div className="kpi-card">
              <div className="kpi-card-header">
                <div className="kpi-icon" style={{ background: '#fef3c7', color: '#f59e0b' }}>
                  <BarChart3 className="icon-lg" />
                </div>
              </div>
              <div className="kpi-value">{currentReport.totalBookings || 0}</div>
              <div className="kpi-label">Total Bookings</div>
            </div>
            <div className="kpi-card">
              <div className="kpi-card-header">
                <div className="kpi-icon" style={{ background: '#e9d5ff', color: '#8b5cf6' }}>
                  <Calendar className="icon-lg" />
                </div>
              </div>
              <div className="kpi-value">{currentReport.fuelConsumed || 0}L</div>
              <div className="kpi-label">Fuel Consumed</div>
            </div>
          </div>

          {/* Detailed Report Table */}
          <div className="module-card">
            <div className="module-card-header">
              <h3 className="module-card-title">
                <FileText className="icon-md" />
                Detailed Report
              </h3>
            </div>
            <div className="table-container">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Metric</th>
                    <th>Value</th>
                    <th>Change</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>Trips Completed</td>
                    <td>{currentReport.completedTrips || 0}</td>
                    <td>
                      <span style={{ color: '#10b981' }}>
                        +{currentReport.tripsChange || 0}%
                      </span>
                    </td>
                  </tr>
                  <tr>
                    <td>On-Time Departures</td>
                    <td>{currentReport.onTimeDepartures || 0}%</td>
                    <td>
                      <span style={{ color: '#10b981' }}>
                        +{currentReport.onTimeChange || 0}%
                      </span>
                    </td>
                  </tr>
                  <tr>
                    <td>Average Occupancy</td>
                    <td>{currentReport.averageOccupancy || 0}%</td>
                    <td>
                      <span style={{ color: '#10b981' }}>
                        +{currentReport.occupancyChange || 0}%
                      </span>
                    </td>
                  </tr>
                  <tr>
                    <td>Fuel Efficiency</td>
                    <td>{currentReport.fuelEfficiency?.toFixed(2) || 0} KM/L</td>
                    <td>
                      <span style={{ color: '#10b981' }}>
                        +{currentReport.efficiencyChange || 0}%
                      </span>
                    </td>
                  </tr>
                  <tr>
                    <td>Maintenance Count</td>
                    <td>{currentReport.maintenanceCount || 0}</td>
                    <td>-</td>
                  </tr>
                  <tr>
                    <td>Complaints</td>
                    <td>{currentReport.complaintsCount || 0}</td>
                    <td>
                      <span style={{ color: currentReport.complaintsChange > 0 ? '#ef4444' : '#10b981' }}>
                        {currentReport.complaintsChange > 0 ? '+' : ''}{currentReport.complaintsChange || 0}%
                      </span>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      ) : (
        <div className="module-card">
          <div className="empty-state">
            <FileText className="empty-state-icon" />
            <p className="empty-state-text">No report data available</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default ReportsAnalytics;
