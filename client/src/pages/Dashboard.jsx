import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  FaBus, 
  FaRoute, 
  FaClock, 
  FaChartBar, 
  FaUsers, 
  FaTicketAlt, 
  FaMapMarkedAlt, 
  FaCog, 
  FaSignOutAlt, 
  FaUser,
  FaTachometerAlt,
  FaExclamationTriangle,
  FaCheckCircle,
  FaCalendarAlt,
  FaMoneyBillWave,
  FaGasPump,
  FaTools,
  FaShieldAlt,
  FaBell,
  FaSearch
} from 'react-icons/fa';
import './Dashboard.css';

const Dashboard = () => {
  const [userEmail, setUserEmail] = useState('');
  const [userRole, setUserRole] = useState('');
  const [activeTab, setActiveTab] = useState('overview');
  const navigate = useNavigate();

  useEffect(() => {
    const email = localStorage.getItem('email');
    const role = localStorage.getItem('role');
    setUserEmail(email || 'User');
    setUserRole(role || 'passenger');
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('email');
    localStorage.removeItem('role');
    navigate('/login');
  };

  const dashboardCards = [
    {
      icon: <FaBus />,
      title: 'Fleet Management',
      description: 'Manage 156 active buses',
      color: '#ff6b35',
      count: '156',
      status: 'active'
    },
    {
      icon: <FaRoute />,
      title: 'Route Planning',
      description: 'Optimize 89 routes',
      color: '#f7931e',
      count: '89',
      status: 'optimized'
    },
    {
      icon: <FaClock />,
      title: 'Scheduling',
      description: 'Real-time scheduling',
      color: '#ff8c42',
      count: '24/7',
      status: 'live'
    },
    {
      icon: <FaUsers />,
      title: 'Passenger Analytics',
      description: 'Track 15,000+ daily riders',
      color: '#ff6b35',
      count: '15K+',
      status: 'growing'
    },
    {
      icon: <FaTicketAlt />,
      title: 'Revenue Management',
      description: 'Digital ticketing system',
      color: '#f7931e',
      count: '₹2.5M',
      status: 'monthly'
    },
    {
      icon: <FaMapMarkedAlt />,
      title: 'Live Tracking',
      description: 'GPS-enabled tracking',
      color: '#ff8c42',
      count: '100%',
      status: 'coverage'
    }
  ];

  const systemStats = [
    { label: 'Active Buses', value: '156', icon: <FaBus />, color: '#ff6b35' },
    { label: 'Daily Routes', value: '89', icon: <FaRoute />, color: '#f7931e' },
    { label: 'Daily Passengers', value: '15,247', icon: <FaUsers />, color: '#ff8c42' },
    { label: 'Revenue (Monthly)', value: '₹2.5M', icon: <FaMoneyBillWave />, color: '#ff6b35' },
    { label: 'Fuel Efficiency', value: '8.5 km/L', icon: <FaGasPump />, color: '#f7931e' },
    { label: 'Maintenance Due', value: '12', icon: <FaTools />, color: '#ff8c42' }
  ];

  const recentAlerts = [
    { type: 'warning', message: 'Bus KSRTC-045 needs maintenance', time: '2 hours ago' },
    { type: 'success', message: 'Route optimization completed', time: '4 hours ago' },
    { type: 'info', message: 'New passenger peak detected', time: '6 hours ago' },
    { type: 'warning', message: 'Fuel level low on 3 buses', time: '8 hours ago' }
  ];

  const upcomingSchedules = [
    { time: '06:00', route: 'Kochi → Trivandrum', buses: 8, status: 'On Time' },
    { time: '07:30', route: 'Kozhikode → Kochi', buses: 6, status: 'Delayed' },
    { time: '08:15', route: 'Thrissur → Kozhikode', buses: 4, status: 'On Time' },
    { time: '09:00', route: 'Kannur → Trivandrum', buses: 5, status: 'On Time' }
  ];

  return (
    <div className="dashboard-container">
      {/* Navigation */}
      <nav className="dashboard-nav">
        <div className="nav-content">
          <div className="logo-section">
            <div className="big-y-logo">Y</div>
            <div className="logo-text">
              <span className="logo-title">YATRIK ERP</span>
              <span className="logo-subtitle">Intelligent Transport Management</span>
            </div>
          </div>
          <div className="nav-user">
            <div className="user-info">
              <FaUser className="user-icon" />
              <span className="user-email">{userEmail}</span>
            </div>
            <button onClick={handleLogout} className="logout-btn">
              <FaSignOutAlt />
            </button>
          </div>
        </div>
      </nav>

      <div className="dashboard-main">
        {/* Sidebar */}
        <aside className="dashboard-sidebar">
          <div className="sidebar-tabs">
            <button 
              className={`sidebar-tab ${activeTab === 'overview' ? 'active' : ''}`}
              onClick={() => setActiveTab('overview')}
            >
              <FaTachometerAlt />
              <span>Overview</span>
            </button>
            <button 
              className={`sidebar-tab ${activeTab === 'fleet' ? 'active' : ''}`}
              onClick={() => setActiveTab('fleet')}
            >
              <FaBus />
              <span>Fleet Management</span>
            </button>
            <button 
              className={`sidebar-tab ${activeTab === 'routes' ? 'active' : ''}`}
              onClick={() => setActiveTab('routes')}
            >
              <FaRoute />
              <span>Route Planning</span>
            </button>
            <button 
              className={`sidebar-tab ${activeTab === 'scheduling' ? 'active' : ''}`}
              onClick={() => setActiveTab('scheduling')}
            >
              <FaClock />
              <span>Scheduling</span>
            </button>
            <button 
              className={`sidebar-tab ${activeTab === 'analytics' ? 'active' : ''}`}
              onClick={() => setActiveTab('analytics')}
            >
              <FaChartBar />
              <span>Analytics</span>
            </button>
            <button 
              className={`sidebar-tab ${activeTab === 'maintenance' ? 'active' : ''}`}
              onClick={() => setActiveTab('maintenance')}
            >
              <FaTools />
              <span>Maintenance</span>
            </button>
            <button 
              className={`sidebar-tab ${activeTab === 'settings' ? 'active' : ''}`}
              onClick={() => setActiveTab('settings')}
            >
              <FaCog />
              <span>Settings</span>
            </button>
          </div>
        </aside>

        {/* Main Content */}
        <main className="dashboard-content">
          {activeTab === 'overview' && (
            <>
              {/* Welcome Section */}
              <div className="welcome-section">
                <h1 className="welcome-title">Welcome to YATRIK ERP</h1>
                <p className="welcome-subtitle">Intelligent Public Transport Management System</p>
              </div>

              {/* System Stats */}
              <div className="system-stats">
                {systemStats.map((stat, index) => (
                  <div key={index} className="stat-card">
                    <div className="stat-icon" style={{ color: stat.color }}>
                      {stat.icon}
                    </div>
                    <div className="stat-info">
                      <span className="stat-value">{stat.value}</span>
                      <span className="stat-label">{stat.label}</span>
                    </div>
                  </div>
                ))}
              </div>

              {/* Dashboard Cards */}
              <div className="dashboard-grid">
                {dashboardCards.map((card, index) => (
                  <div key={index} className="dashboard-card">
                    <div className="card-icon" style={{ color: card.color }}>
                      {card.icon}
                    </div>
                    <div className="card-content">
                      <h3 className="card-title">{card.title}</h3>
                      <p className="card-desc">{card.description}</p>
                      <div className="card-stats">
                        <span className="card-count">{card.count}</span>
                        <span className={`card-status ${card.status}`}>{card.status}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Alerts and Schedule */}
              <div className="dashboard-bottom">
                <div className="alerts-section">
                  <h3 className="section-title">
                    <FaBell />
                    Recent Alerts
                  </h3>
                  <div className="alerts-list">
                    {recentAlerts.map((alert, index) => (
                      <div key={index} className={`alert-item ${alert.type}`}>
                        <div className="alert-icon">
                          {alert.type === 'warning' && <FaExclamationTriangle />}
                          {alert.type === 'success' && <FaCheckCircle />}
                          {alert.type === 'info' && <FaBell />}
                        </div>
                        <div className="alert-content">
                          <p className="alert-message">{alert.message}</p>
                          <span className="alert-time">{alert.time}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="schedule-section">
                  <h3 className="section-title">
                    <FaCalendarAlt />
                    Upcoming Schedules
                  </h3>
                  <div className="schedule-list">
                    {upcomingSchedules.map((schedule, index) => (
                      <div key={index} className="schedule-item">
                        <div className="schedule-time">{schedule.time}</div>
                        <div className="schedule-info">
                          <h4 className="schedule-route">{schedule.route}</h4>
                          <p className="schedule-details">
                            {schedule.buses} buses • {schedule.status}
                          </p>
                        </div>
                        <div className={`schedule-status ${schedule.status.toLowerCase().replace(' ', '-')}`}>
                          {schedule.status}
                        </div>
                      </div>
                    ))}
          </div>
          </div>
        </div>
            </>
          )}

          {activeTab === 'fleet' && (
            <div className="tab-content">
              <h2>Fleet Management</h2>
              <p>Manage your entire bus fleet, track maintenance, fuel consumption, and driver assignments.</p>
            </div>
          )}

          {activeTab === 'routes' && (
            <div className="tab-content">
              <h2>Route Planning</h2>
              <p>Optimize routes, analyze traffic patterns, and plan efficient passenger journeys.</p>
            </div>
          )}

          {activeTab === 'scheduling' && (
            <div className="tab-content">
              <h2>Scheduling</h2>
              <p>Create and manage bus schedules, assign drivers, and handle real-time adjustments.</p>
            </div>
          )}

          {activeTab === 'analytics' && (
            <div className="tab-content">
              <h2>Analytics</h2>
              <p>Comprehensive analytics for passenger flow, revenue tracking, and performance metrics.</p>
            </div>
          )}

          {activeTab === 'maintenance' && (
            <div className="tab-content">
              <h2>Maintenance</h2>
              <p>Track vehicle maintenance schedules, service history, and preventive maintenance alerts.</p>
            </div>
          )}

          {activeTab === 'settings' && (
            <div className="tab-content">
              <h2>Settings</h2>
              <p>Configure system parameters, user permissions, and system preferences.</p>
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

export default Dashboard;