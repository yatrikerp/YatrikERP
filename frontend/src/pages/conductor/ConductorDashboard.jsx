import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import SmartNotifications from '../../components/Common/SmartNotifications';
import './conductor.modern.css';

const ConductorDashboard = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [conductorInfo, setConductorInfo] = useState({
    name: '',
    id: '',
    badge: '',
    experience: '',
    currentBus: '',
    currentRoute: ''
  });
  const [ticketData, setTicketData] = useState({
    ticketsSold: 0,
    totalRevenue: 0,
    todayEarnings: 0,
    passengerCount: 0,
    rating: 0
  });
  const [systemHealth, setSystemHealth] = useState({
    ticketMachine: 'connected',
    cardReader: 'normal',
    printer: 'ready'
  });
  const [lastUpdated, setLastUpdated] = useState('');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [activeSection, setActiveSection] = useState('dashboard');

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (error) {
      console.error('Logout error:', error);
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      localStorage.removeItem('conductorToken');
      localStorage.removeItem('conductorUser');
      navigate('/login');
    }
  };

  const toggleSidebar = () => {
    setSidebarCollapsed(!sidebarCollapsed);
  };

  const fetchConductorInfo = async () => {
    try {
      const token = localStorage.getItem('conductorToken') || localStorage.getItem('token');
      if (!token) return;

      const response = await fetch('/api/conductor/info', {
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        console.log('Conductor info received:', data);
        
        const updatedConductorInfo = {
          name: data.name || data.conductorName || user?.name || 'Conductor',
          id: data.id || data.conductorId || 'CD001',
          badge: data.badge || data.badgeNumber || 'BD123456',
          experience: data.experience || '3 years',
          currentBus: data.currentBus || data.busNumber || 'BUS-001',
          currentRoute: data.currentRoute || data.routeName || 'Route 101'
        };
        
        setConductorInfo(updatedConductorInfo);
        localStorage.setItem('conductorInfo', JSON.stringify(updatedConductorInfo));
      }
    } catch (error) {
      console.error('Error fetching conductor info:', error);
    }
  };

  const fetchTicketData = async () => {
    try {
      const token = localStorage.getItem('conductorToken') || localStorage.getItem('token');
      if (!token) return;

      const response = await fetch('/api/conductor/tickets', {
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        console.log('Ticket data received:', data);
        
        setTicketData({
          ticketsSold: data.ticketsSold || 0,
          totalRevenue: data.totalRevenue || 0,
          todayEarnings: data.todayEarnings || 0,
          passengerCount: data.passengerCount || 0,
          rating: data.rating || 4.3
        });
      }
    } catch (error) {
      console.error('Error fetching ticket data:', error);
    }
  };

  const handleRefresh = async () => {
    try {
      setLoading(true);
      await fetchConductorInfo();
      await fetchTicketData();
      setLastUpdated(new Date().toLocaleTimeString());
      setLoading(false);
    } catch (error) {
      console.error('Refresh failed:', error);
      setLoading(false);
    }
  };

  const sellTicket = async () => {
    try {
      const token = localStorage.getItem('conductorToken') || localStorage.getItem('token');
      const response = await fetch('/api/conductor/sell-ticket', {
        method: 'POST',
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          amount: 50,
          passengerType: 'adult'
        })
      });

      if (response.ok) {
        await fetchTicketData();
        alert('Ticket sold successfully!');
      }
    } catch (error) {
      console.error('Error selling ticket:', error);
      alert('Failed to sell ticket');
    }
  };

  const printReceipt = async () => {
    try {
      const token = localStorage.getItem('conductorToken') || localStorage.getItem('token');
      const response = await fetch('/api/conductor/print-receipt', {
        method: 'POST',
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        alert('Receipt printed successfully!');
      }
    } catch (error) {
      console.error('Error printing receipt:', error);
      alert('Failed to print receipt');
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        if (!user) return;

        // Load stored conductor info
        const storedConductorInfo = localStorage.getItem('conductorInfo');
        if (storedConductorInfo) {
          try {
            const parsedConductorInfo = JSON.parse(storedConductorInfo);
            setConductorInfo(parsedConductorInfo);
          } catch (e) {
            console.log('Failed to parse stored conductor info');
          }
        }

        await fetchConductorInfo();
        await fetchTicketData();
        setLoading(false);
      } catch (error) {
        console.error('Error fetching data:', error);
        setLoading(false);
      }
    };

    fetchData();

    const interval = setInterval(async () => {
      setLastUpdated(new Date().toLocaleTimeString());
      await fetchTicketData();
    }, 30000);

    return () => clearInterval(interval);
  }, [user]);

  if (loading) {
    return (
      <div className="conductor-loading">
        <div className="loading-spinner"></div>
        <h3>Loading Conductor Dashboard...</h3>
      </div>
    );
  }

  return (
    <div className="conductor-dashboard">
      {/* Sidebar */}
      <div className={`conductor-sidebar ${sidebarCollapsed ? 'collapsed' : ''}`}>
        <div className="sidebar-header">
          <h2>Conductor Panel</h2>
          <div className="conductor-info">
            <div className="conductor-name">{conductorInfo.name}</div>
            <div className="conductor-id">ID: {conductorInfo.id}</div>
          </div>
        </div>
        
        <nav className="sidebar-nav">
          <ul className="nav-menu">
            <li 
              className={`nav-item ${activeSection === 'dashboard' ? 'active' : ''}`}
              onClick={() => setActiveSection('dashboard')}
            >
              <svg className="nav-icon" fill="currentColor" viewBox="0 0 20 20">
                <path d="M10.707 2.293a1 1 0 00-1.414 0l-7 7a1 1 0 001.414 1.414L4 10.414V17a1 1 0 001 1h2a1 1 0 001-1v-2a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 001 1h2a1 1 0 001-1v-6.586l.293.293a1 1 0 001.414-1.414l-7-7z" />
              </svg>
              <span>Dashboard</span>
            </li>
            <li 
              className={`nav-item ${activeSection === 'tickets' ? 'active' : ''}`}
              onClick={() => setActiveSection('tickets')}
            >
              <svg className="nav-icon" fill="currentColor" viewBox="0 0 20 20">
                <path d="M2 6a2 2 0 012-2h12a2 2 0 012 2v2a2 2 0 01-2 2H4a2 2 0 01-2-2V6zM14.553 7.106A1 1 0 0014 8v4a1 1 0 00.553.894l2 1A1 1 0 0018 13V7a1 1 0 00-1.447-.894l-2 1z" />
              </svg>
              <span>Ticket Sales</span>
            </li>
            <li 
              className={`nav-item ${activeSection === 'passengers' ? 'active' : ''}`}
              onClick={() => setActiveSection('passengers')}
            >
              <svg className="nav-icon" fill="currentColor" viewBox="0 0 20 20">
                <path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3z" />
              </svg>
              <span>Passengers</span>
            </li>
            <li 
              className={`nav-item ${activeSection === 'earnings' ? 'active' : ''}`}
              onClick={() => setActiveSection('earnings')}
            >
              <svg className="nav-icon" fill="currentColor" viewBox="0 0 20 20">
                <path d="M8.433 7.418c.155-.103.346-.196.567-.267v1.698a2.305 2.305 0 01-.567-.267C8.07 8.34 8 8.114 8 8c0-.114.07-.34.433-.582zM11 12.849v-1.698c.22.071.412.164.567.267.364.243.433.468.433.582 0 .114-.07.34-.433.582a2.305 2.305 0 01-.567.267z" />
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-13a1 1 0 10-2 0v.092a4.535 4.535 0 00-1.676.662C6.602 6.234 6 7.009 6 8c0 .99.602 1.765 1.324 2.246.48.32 1.054.545 1.676.662v1.941c-.391-.127-.68-.317-.843-.504a1 1 0 10-1.51 1.31c.562.649 1.413 1.076 2.353 1.253V15a1 1 0 102 0v-.092a4.535 4.535 0 001.676-.662C13.398 13.766 14 12.991 14 12c0-.99-.602-1.765-1.324-2.246A4.535 4.535 0 0011 9.092V7.151c.391.127.68.317.843.504a1 1 0 101.511-1.31c-.563-.649-1.413-1.076-2.354-1.253V5z" clipRule="evenodd" />
              </svg>
              <span>Earnings</span>
            </li>
            <li 
              className={`nav-item ${activeSection === 'reports' ? 'active' : ''}`}
              onClick={() => setActiveSection('reports')}
            >
              <svg className="nav-icon" fill="currentColor" viewBox="0 0 20 20">
                <path d="M2 11a1 1 0 011-1h2a1 1 0 011 1v5a1 1 0 01-1 1H3a1 1 0 01-1-1v-5zM8 7a1 1 0 011-1h2a1 1 0 011 1v9a1 1 0 01-1 1H9a1 1 0 01-1-1V7zM14 4a1 1 0 011-1h2a1 1 0 011 1v12a1 1 0 01-1 1h-2a1 1 0 01-1-1V4z" />
              </svg>
              <span>Reports</span>
            </li>
            <li 
              className={`nav-item ${activeSection === 'settings' ? 'active' : ''}`}
              onClick={() => setActiveSection('settings')}
            >
              <svg className="nav-icon" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M11.49 3.17c-.38-1.56-2.6-1.56-2.98 0a1.532 1.532 0 01-2.286.948c-1.372-.836-2.942.734-2.106 2.106.54.886.061 2.042-.947 2.287-1.561.379-1.561 2.6 0 2.978a1.532 1.532 0 01.947 2.287c-.836 1.372.734 2.942 2.106 2.106a1.532 1.532 0 012.287.947c.379 1.561 2.6 1.561 2.978 0a1.533 1.533 0 012.287-.947c1.372.836 2.942-.734 2.106-2.106a1.533 1.533 0 01.947-2.287c1.561-.379 1.561-2.6 0-2.978a1.532 1.532 0 01-.947-2.287c.836-1.372-.734-2.942-2.106-2.106a1.532 1.532 0 01-2.287-.947zM10 13a3 3 0 100-6 3 3 0 000 6z" clipRule="evenodd" />
              </svg>
              <span>Settings</span>
            </li>
          </ul>
        </nav>

        <div className="sidebar-footer">
          <div className="user-profile">
            <div className="user-avatar">
              {conductorInfo.name?.charAt(0) || 'C'}
            </div>
            <div className="user-info">
              <div className="user-name">{conductorInfo.name}</div>
              <div className="user-role">Conductor</div>
            </div>
          </div>
          <button className="logout-btn" onClick={handleLogout}>
            <svg className="logout-icon" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M3 3a1 1 0 00-1 1v12a1 1 0 102 0V4a1 1 0 00-1-1zm10.293 9.293a1 1 0 001.414 1.414l3-3a1 1 0 000-1.414l-3-3a1 1 0 10-1.414 1.414L14.586 9H7a1 1 0 100 2h7.586l-1.293 1.293z" clipRule="evenodd" />
            </svg>
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="main-content">
        {/* Top Bar */}
        <div className="top-bar">
          <div className="search-section">
            <svg className="search-icon" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
            </svg>
            <input type="text" className="search-input" placeholder="Search passengers, tickets..." />
          </div>

          <div className="status-section">
            <div className="status-indicators">
              <div className="status-item">
                <div className={`status-dot ${systemHealth.ticketMachine === 'connected' ? 'green' : 'red'}`}></div>
                <span>Ticket Machine</span>
              </div>
              <div className="status-item">
                <div className={`status-dot ${systemHealth.cardReader === 'normal' ? 'green' : 'red'}`}></div>
                <span>Card Reader</span>
              </div>
              <div className="status-item">
                <div className={`status-dot ${systemHealth.printer === 'ready' ? 'green' : 'red'}`}></div>
                <span>Printer</span>
              </div>
            </div>

            <div className="user-section">
              <SmartNotifications />
              <div className="user-profile-top">
                <div className="user-avatar-top">
                  {conductorInfo.name?.charAt(0) || 'C'}
                </div>
                <div className="user-info-top">
                  <div className="user-name-top">{conductorInfo.name}</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Dashboard Content */}
        <div className="dashboard-content">
          {activeSection === 'dashboard' && (
            <>
              {/* Dashboard Header */}
              <div className="dashboard-header">
                <div className="header-left">
                  <h1>Conductor Dashboard</h1>
                  <p>Welcome back, {conductorInfo.name}!</p>
                </div>
                <div className="header-actions">
                  <button className="action-btn blue" onClick={sellTicket}>
                    <svg className="action-icon" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M2 6a2 2 0 012-2h12a2 2 0 012 2v2a2 2 0 01-2 2H4a2 2 0 01-2-2V6zM14.553 7.106A1 1 0 0014 8v4a1 1 0 00.553.894l2 1A1 1 0 0018 13V7a1 1 0 00-1.447-.894l-2 1z" />
                    </svg>
                    Sell Ticket
                  </button>
                  <button className="action-btn green" onClick={printReceipt}>
                    <svg className="action-icon" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M5 4v3H4a2 2 0 00-2 2v3a2 2 0 002 2h1v2a2 2 0 002 2h6a2 2 0 002-2v-2h1a2 2 0 002-2V9a2 2 0 00-2-2h-1V4a2 2 0 00-2-2H7a2 2 0 00-2 2zm8 0H7v3h6V4zm0 8H7v4h6v-4z" clipRule="evenodd" />
                    </svg>
                    Print Receipt
                  </button>
                  <button className="action-btn purple" onClick={handleRefresh}>
                    <svg className="action-icon" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" clipRule="evenodd" />
                    </svg>
                    Refresh
              </button>
            </div>
          </div>

              {/* Welcome Section */}
              <div className="welcome-section">
                <div className="welcome-left">
                  <h2>Ticket Control Center</h2>
                  <p>Current Status: Active - Ready to serve passengers</p>
                </div>
                <div className="welcome-right">
                  <div className="last-updated">Last updated: {lastUpdated}</div>
        </div>
          </div>

              {/* Quick Stats */}
              <div className="stats-section">
                <div className="section-header">
                  <div className="section-left">
                    <svg className="section-icon" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M2 11a1 1 0 011-1h2a1 1 0 011 1v5a1 1 0 01-1 1H3a1 1 0 01-1-1v-5zM8 7a1 1 0 011-1h2a1 1 0 011 1v9a1 1 0 01-1 1H9a1 1 0 01-1-1V7zM14 4a1 1 0 011-1h2a1 1 0 011 1v12a1 1 0 01-1 1h-2a1 1 0 01-1-1V4z" />
                    </svg>
                    <h3>Today's Performance</h3>
                  </div>
                </div>
                <div className="stats-grid">
                  <div className="stat-card">
                    <div className="stat-content">
                      <div className="stat-header">
                        <h3>{ticketData.ticketsSold}</h3>
                        <div className="stat-trend">
                          <svg className="trend-icon up" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M12 7a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0V8.414l-4.293 4.293a1 1 0 01-1.414 0L8 10.414l-4.293 4.293a1 1 0 01-1.414-1.414l5-5a1 1 0 011.414 0L11 10.586 14.586 7H12z" clipRule="evenodd" />
                          </svg>
                          <span>+15%</span>
                        </div>
                      </div>
                      <p className="stat-label">Tickets Sold</p>
                    </div>
                    <div className="stat-icon blue">
                      <svg className="icon" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M2 6a2 2 0 012-2h12a2 2 0 012 2v2a2 2 0 01-2 2H4a2 2 0 01-2-2V6zM14.553 7.106A1 1 0 0014 8v4a1 1 0 00.553.894l2 1A1 1 0 0018 13V7a1 1 0 00-1.447-.894l-2 1z" />
                      </svg>
                    </div>
                  </div>

                  <div className="stat-card">
                    <div className="stat-content">
                      <div className="stat-header">
                        <h3>₹{ticketData.totalRevenue}</h3>
                        <div className="stat-trend">
                          <svg className="trend-icon up" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M12 7a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0V8.414l-4.293 4.293a1 1 0 01-1.414 0L8 10.414l-4.293 4.293a1 1 0 01-1.414-1.414l5-5a1 1 0 011.414 0L11 10.586 14.586 7H12z" clipRule="evenodd" />
                          </svg>
                          <span>+12%</span>
                        </div>
                            </div>
                      <p className="stat-label">Total Revenue</p>
                              </div>
                    <div className="stat-icon green">
                      <svg className="icon" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M8.433 7.418c.155-.103.346-.196.567-.267v1.698a2.305 2.305 0 01-.567-.267C8.07 8.34 8 8.114 8 8c0-.114.07-.34.433-.582zM11 12.849v-1.698c.22.071.412.164.567.267.364.243.433.468.433.582 0 .114-.07.34-.433.582a2.305 2.305 0 01-.567.267z" />
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-13a1 1 0 10-2 0v.092a4.535 4.535 0 00-1.676.662C6.602 6.234 6 7.009 6 8c0 .99.602 1.765 1.324 2.246.48.32 1.054.545 1.676.662v1.941c-.391-.127-.68-.317-.843-.504a1 1 0 10-1.51 1.31c.562.649 1.413 1.076 2.353 1.253V15a1 1 0 102 0v-.092a4.535 4.535 0 001.676-.662C13.398 13.766 14 12.991 14 12c0-.99-.602-1.765-1.324-2.246A4.535 4.535 0 0011 9.092V7.151c.391.127.68.317.843.504a1 1 0 101.511-1.31c-.563-.649-1.413-1.076-2.354-1.253V5z" clipRule="evenodd" />
                      </svg>
                              </div>
                              </div>

                  <div className="stat-card">
                    <div className="stat-content">
                      <div className="stat-header">
                        <h3>{ticketData.passengerCount}</h3>
                        <div className="stat-trend">
                          <svg className="trend-icon up" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M12 7a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0V8.414l-4.293 4.293a1 1 0 01-1.414 0L8 10.414l-4.293 4.293a1 1 0 01-1.414-1.414l5-5a1 1 0 011.414 0L11 10.586 14.586 7H12z" clipRule="evenodd" />
                          </svg>
                          <span>+8%</span>
                              </div>
                            </div>
                      <p className="stat-label">Passengers Served</p>
                    </div>
                    <div className="stat-icon yellow">
                      <svg className="icon" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3z" />
                      </svg>
                          </div>
                          </div>

                  <div className="stat-card">
                    <div className="stat-content">
                      <div className="stat-header">
                        <h3>{ticketData.rating}★</h3>
                        <div className="stat-trend">
                          <svg className="trend-icon up" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M12 7a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0V8.414l-4.293 4.293a1 1 0 01-1.414 0L8 10.414l-4.293 4.293a1 1 0 01-1.414-1.414l5-5a1 1 0 011.414 0L11 10.586 14.586 7H12z" clipRule="evenodd" />
                          </svg>
                          <span>+3%</span>
                        </div>
                      </div>
                      <p className="stat-label">Service Rating</p>
                    </div>
                    <div className="stat-icon purple">
                      <svg className="icon" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                      </svg>
                    </div>
                  </div>
                </div>
              </div>

              {/* Conductor Info */}
              <div className="conductor-info-section">
                <div className="section-header">
                  <div className="section-left">
                    <svg className="section-icon" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                    </svg>
                    <h3>Conductor Information</h3>
                  </div>
                            </div>
                <div className="conductor-details">
                  <div className="detail-grid">
                    <div className="detail-item">
                      <span className="label">Badge Number:</span>
                      <span className="value">{conductorInfo.badge}</span>
                              </div>
                    <div className="detail-item">
                      <span className="label">Experience:</span>
                      <span className="value">{conductorInfo.experience}</span>
                              </div>
                    <div className="detail-item">
                      <span className="label">Current Bus:</span>
                      <span className="value">{conductorInfo.currentBus}</span>
                              </div>
                    <div className="detail-item">
                      <span className="label">Current Route:</span>
                      <span className="value">{conductorInfo.currentRoute}</span>
                              </div>
                            </div>
                              </div>
                          </div>

              {/* Recent Activity */}
              <div className="activity-section">
                <div className="section-header">
                  <div className="section-left">
                    <svg className="section-icon" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                    </svg>
                    <h3>Recent Activity</h3>
                          </div>
                        </div>
                <div className="activity-list">
                  <div className="activity-item">
                    <div className="activity-icon">
                      <svg fill="currentColor" viewBox="0 0 20 20">
                        <path d="M2 6a2 2 0 012-2h12a2 2 0 012 2v2a2 2 0 01-2 2H4a2 2 0 01-2-2V6zM14.553 7.106A1 1 0 0014 8v4a1 1 0 00.553.894l2 1A1 1 0 0018 13V7a1 1 0 00-1.447-.894l-2 1z" />
                      </svg>
                    </div>
                    <div className="activity-content">
                      <div className="activity-title">Ticket sold to passenger</div>
                      <div className="activity-time">2 minutes ago</div>
                    </div>
                    <div className="activity-amount">₹50</div>
                  </div>
                  <div className="activity-item">
                    <div className="activity-icon">
                      <svg fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M5 4v3H4a2 2 0 00-2 2v3a2 2 0 002 2h1v2a2 2 0 002 2h6a2 2 0 002-2v-2h1a2 2 0 002-2V9a2 2 0 00-2-2h-1V4a2 2 0 00-2-2H7a2 2 0 00-2 2zm8 0H7v3h6V4zm0 8H7v4h6v-4z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <div className="activity-content">
                      <div className="activity-title">Receipt printed</div>
                      <div className="activity-time">5 minutes ago</div>
                    </div>
                    <div className="activity-amount">-</div>
                  </div>
                  <div className="activity-item">
                    <div className="activity-icon">
                      <svg fill="currentColor" viewBox="0 0 20 20">
                        <path d="M2 6a2 2 0 012-2h12a2 2 0 012 2v2a2 2 0 01-2 2H4a2 2 0 01-2-2V6zM14.553 7.106A1 1 0 0014 8v4a1 1 0 00.553.894l2 1A1 1 0 0018 13V7a1 1 0 00-1.447-.894l-2 1z" />
                      </svg>
                    </div>
                    <div className="activity-content">
                      <div className="activity-title">Ticket sold to passenger</div>
                      <div className="activity-time">8 minutes ago</div>
                      </div>
                    <div className="activity-amount">₹30</div>
                  </div>
                </div>
              </div>
            </>
          )}

          {activeSection === 'tickets' && (
            <div className="tickets-section">
              <h2>Ticket Sales Management</h2>
              <p>Ticket sales functionality will be implemented here.</p>
            </div>
          )}

          {activeSection === 'passengers' && (
            <div className="passengers-section">
              <h2>Passenger Management</h2>
              <p>Passenger information and management will be displayed here.</p>
            </div>
          )}

          {activeSection === 'earnings' && (
            <div className="earnings-section">
              <h2>Earnings Dashboard</h2>
              <p>Earnings and financial information will be shown here.</p>
            </div>
          )}

          {activeSection === 'reports' && (
            <div className="reports-section">
              <h2>Conductor Reports</h2>
              <p>Performance reports and analytics will be shown here.</p>
              </div>
            )}

          {activeSection === 'settings' && (
            <div className="settings-section">
              <h2>Settings</h2>
              <p>Conductor settings and preferences will be displayed here.</p>
          </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ConductorDashboard;

