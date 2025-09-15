import React, { useState, useEffect } from 'react';
import { 
  Users, Calendar, TrendingUp, DollarSign, 
  CheckCircle, Clock, XCircle, AlertCircle,
  BarChart3, PieChart, Download, RefreshCw
} from 'lucide-react';
import './DepotBookingDashboard.css';

const DepotBookingDashboard = ({ depotId, user }) => {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    todayBookings: 0,
    todayRevenue: 0,
    totalBookings: 0,
    totalRevenue: 0,
    statusBreakdown: [],
    routeBreakdown: [],
    dailyTrends: []
  });
  const [selectedPeriod, setSelectedPeriod] = useState('today');
  const [recentBookings, setRecentBookings] = useState([]);

  useEffect(() => {
    fetchBookingStats();
    fetchRecentBookings();
  }, [depotId, selectedPeriod]);

  const fetchBookingStats = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/depot/bookings/stats?period=${selectedPeriod}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('depotToken') || localStorage.getItem('token')}`
        }
      });

      const result = await response.json();
      if (result.success) {
        setStats(result.data);
      }
    } catch (error) {
      console.error('Error fetching booking stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchRecentBookings = async () => {
    try {
      const response = await fetch(`/api/depot/bookings?limit=10&page=1`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('depotToken') || localStorage.getItem('token')}`
        }
      });

      const result = await response.json();
      if (result.success) {
        setRecentBookings(result.data.bookings || []);
      }
    } catch (error) {
      console.error('Error fetching recent bookings:', error);
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'confirmed': return <CheckCircle className="status-icon confirmed" />;
      case 'pending': return <Clock className="status-icon pending" />;
      case 'cancelled': return <XCircle className="status-icon cancelled" />;
      case 'completed': return <CheckCircle className="status-icon completed" />;
      case 'no_show': return <AlertCircle className="status-icon no-show" />;
      default: return <Clock className="status-icon" />;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'confirmed': return '#00A86B';
      case 'pending': return '#FFB300';
      case 'cancelled': return '#F44336';
      case 'completed': return '#1976D2';
      case 'no_show': return '#9E9E9E';
      default: return '#666';
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  };

  const formatTime = (timeString) => {
    return new Date(`2000-01-01T${timeString}`).toLocaleTimeString('en-IN', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  };

  if (loading) {
    return (
      <div className="depot-booking-dashboard loading">
        <div className="loading-spinner"></div>
        <p>Loading booking statistics...</p>
      </div>
    );
  }

  return (
    <div className="depot-booking-dashboard">
      {/* Header */}
      <div className="dashboard-header">
        <div className="header-left">
          <h2>Booking Management Dashboard</h2>
          <p>Monitor passenger bookings for your depot routes</p>
        </div>
        <div className="header-right">
          <div className="period-selector">
            <select 
              value={selectedPeriod} 
              onChange={(e) => setSelectedPeriod(e.target.value)}
            >
              <option value="today">Today</option>
              <option value="week">This Week</option>
              <option value="month">This Month</option>
            </select>
          </div>
          <button className="refresh-btn" onClick={fetchBookingStats}>
            <RefreshCw className="btn-icon" />
            Refresh
          </button>
          <button className="export-btn">
            <Download className="btn-icon" />
            Export
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="summary-cards">
        <div className="summary-card">
          <div className="card-icon">
            <Users className="icon" />
          </div>
          <div className="card-content">
            <h3>{stats.summary?.totalBookings || 0}</h3>
            <p>Total Bookings</p>
            <span className="card-period">{selectedPeriod}</span>
          </div>
        </div>

        <div className="summary-card">
          <div className="card-icon revenue">
            <DollarSign className="icon" />
          </div>
          <div className="card-content">
            <h3>₹{Number(stats.summary?.totalRevenue || 0).toLocaleString()}</h3>
            <p>Total Revenue</p>
            <span className="card-period">{selectedPeriod}</span>
          </div>
        </div>

        <div className="summary-card">
          <div className="card-icon average">
            <TrendingUp className="icon" />
          </div>
          <div className="card-content">
            <h3>₹{Number(stats.summary?.averageBookingValue || 0).toFixed(0)}</h3>
            <p>Avg Booking Value</p>
            <span className="card-period">{selectedPeriod}</span>
          </div>
        </div>

        <div className="summary-card">
          <div className="card-icon routes">
            <BarChart3 className="icon" />
          </div>
          <div className="card-content">
            <h3>{stats.routeBreakdown?.length || 0}</h3>
            <p>Active Routes</p>
            <span className="card-period">{selectedPeriod}</span>
          </div>
        </div>
      </div>

      {/* Charts Section */}
      <div className="charts-section">
        <div className="chart-container">
          <div className="chart-header">
            <h3>Booking Status Breakdown</h3>
            <PieChart className="chart-icon" />
          </div>
          <div className="status-breakdown">
            {stats.statusBreakdown?.map((item, index) => (
              <div key={index} className="status-item">
                <div className="status-info">
                  {getStatusIcon(item._id)}
                  <span className="status-name">{item._id}</span>
                </div>
                <div className="status-stats">
                  <span className="status-count">{item.count}</span>
                  <span className="status-revenue">₹{Number(item.totalRevenue).toLocaleString()}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="chart-container">
          <div className="chart-header">
            <h3>Top Routes by Bookings</h3>
            <BarChart3 className="chart-icon" />
          </div>
          <div className="route-breakdown">
            {stats.routeBreakdown?.slice(0, 5).map((route, index) => (
              <div key={index} className="route-item">
                <div className="route-info">
                  <span className="route-name">{route.routeName}</span>
                  <span className="route-number">{route.routeNumber}</span>
                </div>
                <div className="route-stats">
                  <span className="route-count">{route.count} bookings</span>
                  <span className="route-revenue">₹{Number(route.totalRevenue).toLocaleString()}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Recent Bookings */}
      <div className="recent-bookings">
        <div className="section-header">
          <h3>Recent Bookings</h3>
          <button className="view-all-btn">View All</button>
        </div>
        <div className="bookings-table">
          <div className="table-header">
            <div className="col booking-id">Booking ID</div>
            <div className="col customer">Customer</div>
            <div className="col route">Route</div>
            <div className="col date">Date & Time</div>
            <div className="col amount">Amount</div>
            <div className="col status">Status</div>
          </div>
          <div className="table-body">
            {recentBookings.map((booking, index) => (
              <div key={booking._id || index} className="table-row">
                <div className="col booking-id">
                  <div className="booking-ref">
                    <strong>{booking.bookingId}</strong>
                    <small>{booking.bookingReference}</small>
                  </div>
                </div>
                <div className="col customer">
                  <div className="customer-info">
                    <div className="customer-name">{booking.customer?.name}</div>
                    <div className="customer-contact">
                      {booking.customer?.phone} • {booking.customer?.email}
                    </div>
                  </div>
                </div>
                <div className="col route">
                  <div className="route-info">
                    <div className="route-name">{booking.routeId?.routeName}</div>
                    <div className="route-details">
                      {booking.journey?.from} → {booking.journey?.to}
                    </div>
                  </div>
                </div>
                <div className="col date">
                  <div className="date-info">
                    <div className="date">{formatDate(booking.journey?.departureDate)}</div>
                    <div className="time">{formatTime(booking.journey?.departureTime)}</div>
                  </div>
                </div>
                <div className="col amount">
                  <div className="amount-info">
                    <div className="total-amount">₹{booking.pricing?.totalAmount}</div>
                    <div className="payment-status">{booking.payment?.paymentStatus}</div>
                  </div>
                </div>
                <div className="col status">
                  <div 
                    className="status-badge"
                    style={{ color: getStatusColor(booking.status) }}
                  >
                    {getStatusIcon(booking.status)}
                    <span>{booking.status}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Daily Trends */}
      {stats.dailyTrends?.length > 0 && (
        <div className="daily-trends">
          <div className="section-header">
            <h3>Daily Booking Trends</h3>
          </div>
          <div className="trends-chart">
            <div className="trends-bars">
              {stats.dailyTrends.map((trend, index) => (
                <div key={index} className="trend-bar">
                  <div 
                    className="bar-fill"
                    style={{ 
                      height: `${Math.max((trend.count / Math.max(...stats.dailyTrends.map(t => t.count))) * 100, 5)}%` 
                    }}
                  ></div>
                  <div className="bar-label">
                    <span className="date">{trend._id.day}/{trend._id.month}</span>
                    <span className="count">{trend.count}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DepotBookingDashboard;

