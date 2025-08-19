import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

export default function RedirectDashboard() {
  const navigate = useNavigate();
  useEffect(() => {
    const token = localStorage.getItem('token');
    const userRaw = localStorage.getItem('user');
    if (!token || !userRaw) {
      navigate('/login', { replace: true });
      return;
    }
    let role = 'PASSENGER';
    try { role = (JSON.parse(userRaw)?.role || 'passenger').toUpperCase(); } catch {}
    const dest = role === 'ADMIN' ? '/admin' : role === 'CONDUCTOR' ? '/conductor' : role === 'DRIVER' ? '/driver' : role === 'DEPOT_MANAGER' ? '/occ' : '/pax';
    navigate(dest, { replace: true });
  }, [navigate]);
  return null;
}


