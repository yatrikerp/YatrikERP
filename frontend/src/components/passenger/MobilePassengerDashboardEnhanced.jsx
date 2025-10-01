import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { 
  Calendar, TrendingUp, Clock, MapPin, Users, 
  ArrowRight, Star, Zap, Bus, Wallet, Ticket, 
  Menu, X, Bell, Settings, LogOut, Home
} from 'lucide-react';

const MobilePassengerDashboardEnhanced = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [dashboardData, setDashboardData] = useState({
    summary: null,
    scheduledTrips: [],
    popularRoutes: [],
    trendingRoutes: [],
    quickSearchSuggestions: []
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const token = localStorage.getItem('token');
      const config = {
        headers: { Authorization: `Bearer ${token}` }
      };

      // Fetch all dashboard data in parallel
      const [summary, scheduled, popular, trending, suggestions] = await Promise.all([
        axios.get(`${process.env.REACT_APP_API_URL}/api/passenger-dashboard/dashboard-summary`, config),
        axios.get(`${process.env.REACT_APP_API_URL}/api/passenger-dashboard/scheduled-trips?limit=6`, config),
        axios.get(`${process.env.REACT_APP_API_URL}/api/passenger-dashboard/popular-routes?limit=4`, config),
        axios.get(`${process.env.REACT_APP_API_URL}/api/passenger-dashboard/trending-routes?limit=3`, config),
        axios.get(`${process.env.REACT_APP_API_URL}/api/passenger-dashboard/quick-search-suggestions?limit=4`, config)
      ]);

      setDashboardData({
        summary: summary.data.data,
        scheduledTrips: scheduled.data.data,
        popularRoutes: popular.data.data,
        trendingRoutes: trending.data.data,
        quickSearchSuggestions: suggestions.data.data
      });
      setLoading(false);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    navigate('/login');
  };

  const SummaryCard = ({ icon: Icon, title, value, subtitle, color }) => (
    <div style={{
      background: 'white',
      borderRadius: '12px',
      padding: '16px',
      boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
      display: 'flex',
      alignItems: 'center',
      gap: '12px'
    }}>
      <div style={{
        width: '40px',
        height: '40px',
        borderRadius: '10px',
        background: color + '20',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0
      }}>
        <Icon size={20} color={color} />
      </div>
      <div style={{ flex: 1 }}>
        <div style={{
          fontSize: '14px',
          color: '#6b7280',
          marginBottom: '2px'
        }}>
          {title}
        </div>
        <div style={{
          fontSize: '18px',
          fontWeight: '600',
          color: '#111827'
        }}>
          {value}
        </div>
        {subtitle && (
          <div style={{
            fontSize: '12px',
            color: '#9ca3af'
          }}>
            {subtitle}
          </div>
        )}
      </div>
    </div>
  );

  const renderDashboard = () => (
    <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Summary Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
        <SummaryCard
          icon={Ticket}
          title="Upcoming"
          value={dashboardData.summary?.upcomingBookings || 0}
          color="#3b82f6"
        />
        <SummaryCard
          icon={TrendingUp}
          title="Completed"
          value={dashboardData.summary?.completedTrips || 0}
          color="#10b981"
        />
      </div>

      {/* Quick Actions */}
      <div style={{
        background: 'white',
        borderRadius: '12px',
        padding: '20px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
      }}>
        <h2 style={{
          fontSize: '18px',
          fontWeight: '600',
          color: '#111827',
          marginBottom: '16px'
        }}>
          Quick Actions
        </h2>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
          <button
            onClick={() => navigate('/passenger/search')}
            style={{
              padding: '16px',
              borderRadius: '10px',
              border: '2px solid #3b82f6',
              background: 'white',
              color: '#3b82f6',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '8px',
              cursor: 'pointer'
            }}
          >
            <Bus size={24} />
            <span style={{ fontSize: '14px', fontWeight: '500' }}>Book Bus</span>
          </button>
          <button
            onClick={() => navigate('/passenger/tickets')}
            style={{
              padding: '16px',
              borderRadius: '10px',
              border: '2px solid #10b981',
              background: 'white',
              color: '#10b981',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '8px',
              cursor: 'pointer'
            }}
          >
            <Ticket size={24} />
            <span style={{ fontSize: '14px', fontWeight: '500' }}>My Tickets</span>
          </button>
        </div>
      </div>

      {/* Popular Routes */}
      {dashboardData.popularRoutes.length > 0 && (
        <div style={{
          background: 'white',
          borderRadius: '12px',
          padding: '20px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
        }}>
          <h2 style={{
            fontSize: '18px',
            fontWeight: '600',
            color: '#111827',
            marginBottom: '16px'
          }}>
            Popular Routes
          </h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {dashboardData.popularRoutes.map((route, index) => (
              <div
                key={index}
                style={{
                  padding: '12px',
                  borderRadius: '8px',
                  border: '1px solid #e5e7eb',
                  cursor: 'pointer'
                }}
                onClick={() => navigate(`/passenger/search?from=${route.route.from}&to=${route.route.to}`)}
              >
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}>
                  <div>
                    <div style={{
                      fontSize: '14px',
                      fontWeight: '500',
                      color: '#111827'
                    }}>
                      {route.route.from} → {route.route.to}
                    </div>
                    <div style={{
                      fontSize: '12px',
                      color: '#6b7280'
                    }}>
                      {route.popularity.totalBookings} bookings
                    </div>
                  </div>
                  <ArrowRight size={16} color="#6b7280" />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );

  const renderMyTrips = () => (
    <div style={{ padding: '16px' }}>
      <div style={{
        background: 'white',
        borderRadius: '12px',
        padding: '20px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
        textAlign: 'center'
      }}>
        <Ticket size={48} color="#6b7280" style={{ margin: '0 auto 16px' }} />
        <h2 style={{
          fontSize: '18px',
          fontWeight: '600',
          color: '#111827',
          marginBottom: '8px'
        }}>
          My Trips
        </h2>
        <p style={{
          fontSize: '14px',
          color: '#6b7280',
          marginBottom: '16px'
        }}>
          {dashboardData.scheduledTrips.length > 0 
            ? `You have ${dashboardData.scheduledTrips.length} upcoming trips`
            : 'No upcoming trips found'
          }
        </p>
        <button
          onClick={() => navigate('/passenger/search')}
          style={{
            padding: '12px 24px',
            borderRadius: '8px',
            background: '#3b82f6',
            color: 'white',
            border: 'none',
            cursor: 'pointer',
            fontSize: '14px',
            fontWeight: '500'
          }}
        >
          Book New Trip
        </button>
      </div>
    </div>
  );

  const renderSearch = () => (
    <div style={{ padding: '16px' }}>
      <div style={{
        background: 'white',
        borderRadius: '12px',
        padding: '20px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
      }}>
        <h2 style={{
          fontSize: '18px',
          fontWeight: '600',
          color: '#111827',
          marginBottom: '16px'
        }}>
          Search Buses
        </h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <input
            type="text"
            placeholder="From"
            style={{
              padding: '12px',
              borderRadius: '8px',
              border: '1px solid #d1d5db',
              fontSize: '16px'
            }}
          />
          <input
            type="text"
            placeholder="To"
            style={{
              padding: '12px',
              borderRadius: '8px',
              border: '1px solid #d1d5db',
              fontSize: '16px'
            }}
          />
          <input
            type="date"
            style={{
              padding: '12px',
              borderRadius: '8px',
              border: '1px solid #d1d5db',
              fontSize: '16px'
            }}
          />
          <button
            onClick={() => navigate('/passenger/search')}
            style={{
              padding: '12px',
              borderRadius: '8px',
              background: '#3b82f6',
              color: 'white',
              border: 'none',
              cursor: 'pointer',
              fontSize: '16px',
              fontWeight: '500'
            }}
          >
            Search Buses
          </button>
        </div>
      </div>
    </div>
  );

  const renderProfile = () => (
    <div style={{ padding: '16px' }}>
      <div style={{
        background: 'white',
        borderRadius: '12px',
        padding: '20px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
      }}>
        <h2 style={{
          fontSize: '18px',
          fontWeight: '600',
          color: '#111827',
          marginBottom: '16px'
        }}>
          Profile
        </h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <div style={{
            padding: '12px',
            borderRadius: '8px',
            background: '#f9fafb',
            display: 'flex',
            alignItems: 'center',
            gap: '12px'
          }}>
            <div style={{
              width: '40px',
              height: '40px',
              borderRadius: '50%',
              background: '#3b82f6',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'white',
              fontWeight: '600'
            }}>
              U
            </div>
            <div>
              <div style={{
                fontSize: '16px',
                fontWeight: '500',
                color: '#111827'
              }}>
                User Name
              </div>
              <div style={{
                fontSize: '14px',
                color: '#6b7280'
              }}>
                user@example.com
              </div>
            </div>
          </div>
          <button
            onClick={handleLogout}
            style={{
              padding: '12px',
              borderRadius: '8px',
              background: '#ef4444',
              color: 'white',
              border: 'none',
              cursor: 'pointer',
              fontSize: '16px',
              fontWeight: '500'
            }}
          >
            Logout
          </button>
        </div>
      </div>
    </div>
  );

  const renderContent = () => {
    if (loading) {
      return (
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          height: '200px'
        }}>
          <div>Loading...</div>
        </div>
      );
    }

    switch (activeTab) {
      case 'dashboard':
        return renderDashboard();
      case 'my_trips':
        return renderMyTrips();
      case 'search':
        return renderSearch();
      case 'profile':
        return renderProfile();
      default:
        return renderDashboard();
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: '#f8fafc',
      width: '100vw',
      margin: 0,
      padding: 0
    }}>
      {/* Header */}
      <div style={{
        background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
        color: 'white',
        padding: '16px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        position: 'sticky',
        top: 0,
        zIndex: 100
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <button
            onClick={() => setIsMenuOpen(true)}
            style={{
              background: 'rgba(255,255,255,0.2)',
              border: 'none',
              borderRadius: '8px',
              padding: '8px',
              color: 'white',
              cursor: 'pointer'
            }}
          >
            <Menu size={20} />
          </button>
          <span style={{ fontSize: '18px', fontWeight: 'bold' }}>YATRIK ERP</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <Bell size={20} />
          <Settings size={20} />
        </div>
      </div>

      {/* Side Menu */}
      {isMenuOpen && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0,0,0,0.5)',
            zIndex: 1000
          }}
          onClick={() => setIsMenuOpen(false)}
        >
          <div
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '280px',
              height: '100%',
              background: 'white',
              padding: '20px',
              display: 'flex',
              flexDirection: 'column'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '20px'
            }}>
              <h2 style={{ fontSize: '18px', fontWeight: '600', color: '#111827' }}>Menu</h2>
              <button
                onClick={() => setIsMenuOpen(false)}
                style={{
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer'
                }}
              >
                <X size={20} />
              </button>
            </div>
            <nav style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {[
                { id: 'dashboard', label: 'Dashboard', icon: Home },
                { id: 'my_trips', label: 'My Trips', icon: Ticket },
                { id: 'search', label: 'Search', icon: Bus },
                { id: 'profile', label: 'Profile', icon: Users }
              ].map((item) => (
                <button
                  key={item.id}
                  onClick={() => {
                    setActiveTab(item.id);
                    setIsMenuOpen(false);
                  }}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    padding: '12px',
                    borderRadius: '8px',
                    border: 'none',
                    background: activeTab === item.id ? '#eff6ff' : 'transparent',
                    color: activeTab === item.id ? '#3b82f6' : '#374151',
                    cursor: 'pointer',
                    textAlign: 'left'
                  }}
                >
                  <item.icon size={20} />
                  {item.label}
                </button>
              ))}
            </nav>
          </div>
        </div>
      )}

      {/* Main Content */}
      <main style={{ paddingBottom: '80px' }}>
        {renderContent()}
      </main>

      {/* Bottom Navigation */}
      <nav style={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        background: 'white',
        borderTop: '1px solid #e5e7eb',
        padding: '8px 0',
        display: 'flex',
        justifyContent: 'space-around',
        zIndex: 100
      }}>
        {[
          { id: 'dashboard', label: 'Home', icon: Home },
          { id: 'my_trips', label: 'Trips', icon: Ticket },
          { id: 'search', label: 'Search', icon: Bus },
          { id: 'profile', label: 'Profile', icon: Users }
        ].map((item) => (
          <button
            key={item.id}
            onClick={() => setActiveTab(item.id)}
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '4px',
              padding: '8px',
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              color: activeTab === item.id ? '#3b82f6' : '#6b7280'
            }}
          >
            <item.icon size={20} />
            <span style={{ fontSize: '12px', fontWeight: '500' }}>{item.label}</span>
          </button>
        ))}
      </nav>
    </div>
  );
};

export default MobilePassengerDashboardEnhanced;
