import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Logo from '../components/Logo';

const Dashboard = () => {
  const [user, setUser] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    // Get user data from localStorage
    const userData = localStorage.getItem('user');
    if (userData) {
      setUser(JSON.parse(userData));
    }
  }, []);

  const handleLogout = () => {
    // Clear localStorage
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    // Redirect to login page
    navigate('/login');
  };

  return (
    <div style={{ minHeight: '100vh', background: 'var(--color-bg)' }}>
      <nav style={{ background: 'var(--color-bg)', borderBottom: '1px solid var(--color-border)', boxShadow: '0 2px 8px 0 rgba(34,34,34,0.06)' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', height: '4rem' }}>
          <Logo size="default" />
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <span className="text-secondary" style={{ marginRight: '1.5rem', fontSize: '1rem' }}>{user?.email}</span>
            <button
              onClick={handleLogout}
              className="btn btn-danger"
              style={{ padding: '0.5em 1.5em', fontSize: '1em' }}
            >
              Logout
            </button>
          </div>
        </div>
      </nav>
      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '2rem 1rem' }}>
        <div className="title mb-6">Welcome to YATRIK ERP</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '2rem' }}>
          <div className="card" style={{ alignItems: 'flex-start' }}>
            <h3 className="title mb-2" style={{ fontSize: '1.1rem', color: 'var(--color-primary)' }}>Bus Management</h3>
            <p className="text-secondary">Manage your bus fleet, schedules, and routes.</p>
          </div>
          <div className="card" style={{ alignItems: 'flex-start' }}>
            <h3 className="title mb-2" style={{ fontSize: '1.1rem', color: 'var(--color-primary)' }}>Ticket Booking</h3>
            <p className="text-secondary">View and manage passenger bookings.</p>
          </div>
          <div className="card" style={{ alignItems: 'flex-start' }}>
            <h3 className="title mb-2" style={{ fontSize: '1.1rem', color: 'var(--color-primary)' }}>Reports</h3>
            <p className="text-secondary">Access analytics and generate reports.</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;