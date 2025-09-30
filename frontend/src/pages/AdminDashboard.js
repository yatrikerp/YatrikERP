import React from 'react';
import { useEffect, useState } from 'react';
import { apiFetch } from '../utils/api';
import { useAuth } from '../context/AuthContext';
import BusScheduling from '../components/Common/BusScheduling';
import { 
  Users, Bus, MapPin, Clock, TrendingUp, 
  CheckCircle, AlertCircle, Play, Calendar,
  User, Phone, Mail, Award, Star
} from 'lucide-react';

const AdminDashboard = () => {
  const { user } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeSection, setActiveSection] = useState('overview');
  const [stats, setStats] = useState({
    totalTrips: 0,
    runningTrips: 0,
    completedTrips: 0,
    totalDrivers: 0,
    totalConductors: 0,
    totalRevenue: 0
  });
  const [recentTrips, setRecentTrips] = useState([]);
  const [driverProgress, setDriverProgress] = useState([]);
  const [conductorProgress, setConductorProgress] = useState([]);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      
      // Fetch users
      const usersRes = await apiFetch('/api/admin/users');
      if (usersRes.ok) {
        const usersData = usersRes.data.data?.users || usersRes.data.users || [];
        setUsers(usersData);
        
        // Calculate driver and conductor counts
        const drivers = usersData.filter(u => u.role === 'driver');
        const conductors = usersData.filter(u => u.role === 'conductor');
        
        setStats(prev => ({
          ...prev,
          totalDrivers: drivers.length,
          totalConductors: conductors.length
        }));
      }

      // Fetch trips data
      const tripsRes = await apiFetch('/api/admin/trips?limit=50');
      if (tripsRes.ok) {
        const tripsData = tripsRes.data.trips || [];
        setRecentTrips(tripsData.slice(0, 10));
        
        // Calculate trip stats
        const totalTrips = tripsData.length;
        const runningTrips = tripsData.filter(t => t.status === 'running').length;
        const completedTrips = tripsData.filter(t => t.status === 'completed').length;
        const totalRevenue = tripsData.reduce((sum, trip) => sum + (trip.fare * (trip.bookedSeats || 0)), 0);
        
        setStats(prev => ({
          ...prev,
          totalTrips,
          runningTrips,
          completedTrips,
          totalRevenue
        }));
      }

      // Fetch driver progress
      const drivers = users.filter(u => u.role === 'driver');
      const driverProgressData = await Promise.all(
        drivers.slice(0, 5).map(async (driver) => {
          try {
            const driverTripsRes = await apiFetch(`/api/trips/driver/${driver._id}?status=completed`);
            const completedTrips = driverTripsRes.ok ? driverTripsRes.data.trips?.length || 0 : 0;
            const totalEarnings = driverTripsRes.ok ? 
              driverTripsRes.data.trips?.reduce((sum, trip) => sum + (trip.fare || 0), 0) || 0 : 0;
            
            return {
              ...driver,
              completedTrips,
              totalEarnings,
              rating: 4.5 + Math.random() * 0.5 // Mock rating
            };
          } catch (error) {
            return {
              ...driver,
              completedTrips: 0,
              totalEarnings: 0,
              rating: 4.0
            };
          }
        })
      );
      setDriverProgress(driverProgressData);

      // Fetch conductor progress
      const conductors = users.filter(u => u.role === 'conductor');
      const conductorProgressData = await Promise.all(
        conductors.slice(0, 5).map(async (conductor) => {
          try {
            const conductorTripsRes = await apiFetch(`/api/trips/conductor/${conductor._id}?status=completed`);
            const completedTrips = conductorTripsRes.ok ? conductorTripsRes.data.trips?.length || 0 : 0;
            const totalRevenue = conductorTripsRes.ok ? 
              conductorTripsRes.data.trips?.reduce((sum, trip) => sum + (trip.fare * (trip.bookedSeats || 0)), 0) || 0 : 0;
            
            return {
              ...conductor,
              completedTrips,
              totalRevenue,
              rating: 4.3 + Math.random() * 0.7 // Mock rating
            };
          } catch (error) {
            return {
              ...conductor,
              completedTrips: 0,
              totalRevenue: 0,
              rating: 4.0
            };
          }
        })
      );
      setConductorProgress(conductorProgressData);

    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  async function updateRole(id, role){
    const res = await apiFetch(`/api/admin/users/${id}/role`, { method: 'PUT', body: JSON.stringify({ role }) });
    if (res.ok) setUsers(u => u.map(x => x._id === id ? { ...x, role } : x));
  }
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation */}
      <div className="bg-white shadow-sm border-b">
        <div className="px-6 py-4">
          <nav className="flex space-x-8">
            <button
              onClick={() => setActiveSection('overview')}
              className={`px-3 py-2 rounded-md text-sm font-medium ${
                activeSection === 'overview'
                  ? 'bg-blue-100 text-blue-700'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              Overview
            </button>
            <button
              onClick={() => setActiveSection('users')}
              className={`px-3 py-2 rounded-md text-sm font-medium ${
                activeSection === 'users'
                  ? 'bg-blue-100 text-blue-700'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              User Management
            </button>
            <button
              onClick={() => setActiveSection('scheduling')}
              className={`px-3 py-2 rounded-md text-sm font-medium ${
                activeSection === 'scheduling'
                  ? 'bg-blue-100 text-blue-700'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              Bus Scheduling
            </button>
          </nav>
        </div>
      </div>

      <div className="p-6">
        {activeSection === 'overview' && (
          <div className="space-y-6">
            {/* Stats Overview */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Total Trips</p>
                    <p className="text-2xl font-bold text-gray-900">{stats.totalTrips}</p>
                  </div>
                  <div className="p-3 bg-blue-100 rounded-lg">
                    <Bus className="w-6 h-6 text-blue-600" />
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Running Trips</p>
                    <p className="text-2xl font-bold text-green-600">{stats.runningTrips}</p>
                  </div>
                  <div className="p-3 bg-green-100 rounded-lg">
                    <Play className="w-6 h-6 text-green-600" />
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Completed Trips</p>
                    <p className="text-2xl font-bold text-gray-600">{stats.completedTrips}</p>
                  </div>
                  <div className="p-3 bg-gray-100 rounded-lg">
                    <CheckCircle className="w-6 h-6 text-gray-600" />
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Total Drivers</p>
                    <p className="text-2xl font-bold text-blue-600">{stats.totalDrivers}</p>
                  </div>
                  <div className="p-3 bg-blue-100 rounded-lg">
                    <User className="w-6 h-6 text-blue-600" />
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Total Conductors</p>
                    <p className="text-2xl font-bold text-purple-600">{stats.totalConductors}</p>
                  </div>
                  <div className="p-3 bg-purple-100 rounded-lg">
                    <Users className="w-6 h-6 text-purple-600" />
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Total Revenue</p>
                    <p className="text-2xl font-bold text-green-600">₹{stats.totalRevenue.toLocaleString()}</p>
                  </div>
                  <div className="p-3 bg-green-100 rounded-lg">
                    <TrendingUp className="w-6 h-6 text-green-600" />
                  </div>
                </div>
              </div>
            </div>

            {/* Driver Progress */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Driver Performance</h2>
              <div className="space-y-4">
                {driverProgress.map((driver, index) => (
                  <div key={driver._id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div className="flex items-center space-x-4">
                      <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                        <User className="w-5 h-5 text-blue-600" />
                      </div>
                      <div>
                        <h3 className="font-medium text-gray-900">{driver.name}</h3>
                        <p className="text-sm text-gray-600">{driver.email}</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-6">
                      <div className="text-center">
                        <p className="text-sm text-gray-600">Completed Trips</p>
                        <p className="font-semibold text-gray-900">{driver.completedTrips}</p>
                      </div>
                      <div className="text-center">
                        <p className="text-sm text-gray-600">Total Earnings</p>
                        <p className="font-semibold text-green-600">₹{driver.totalEarnings.toLocaleString()}</p>
                      </div>
                      <div className="text-center">
                        <p className="text-sm text-gray-600">Rating</p>
                        <div className="flex items-center space-x-1">
                          <Star className="w-4 h-4 text-yellow-400 fill-current" />
                          <span className="font-semibold text-gray-900">{driver.rating.toFixed(1)}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Conductor Progress */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Conductor Performance</h2>
              <div className="space-y-4">
                {conductorProgress.map((conductor, index) => (
                  <div key={conductor._id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div className="flex items-center space-x-4">
                      <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
                        <Users className="w-5 h-5 text-purple-600" />
                      </div>
                      <div>
                        <h3 className="font-medium text-gray-900">{conductor.name}</h3>
                        <p className="text-sm text-gray-600">{conductor.email}</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-6">
                      <div className="text-center">
                        <p className="text-sm text-gray-600">Completed Trips</p>
                        <p className="font-semibold text-gray-900">{conductor.completedTrips}</p>
                      </div>
                      <div className="text-center">
                        <p className="text-sm text-gray-600">Total Revenue</p>
                        <p className="font-semibold text-green-600">₹{conductor.totalRevenue.toLocaleString()}</p>
                      </div>
                      <div className="text-center">
                        <p className="text-sm text-gray-600">Rating</p>
                        <div className="flex items-center space-x-1">
                          <Star className="w-4 h-4 text-yellow-400 fill-current" />
                          <span className="font-semibold text-gray-900">{conductor.rating.toFixed(1)}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Recent Trips */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Recent Trips</h2>
              <div className="space-y-3">
                {recentTrips.map((trip) => (
                  <div key={trip._id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center space-x-4">
                      <div className={`w-3 h-3 rounded-full ${
                        trip.status === 'running' ? 'bg-green-500' :
                        trip.status === 'completed' ? 'bg-gray-500' :
                        trip.status === 'scheduled' ? 'bg-blue-500' : 'bg-red-500'
                      }`}></div>
                      <div>
                        <h3 className="font-medium text-gray-900">{trip.routeId?.routeName || 'Unknown Route'}</h3>
                        <p className="text-sm text-gray-600">
                          {trip.driverId?.name || 'Unassigned'} • {trip.conductorId?.name || 'Unassigned'}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-4">
                      <div className="text-right">
                        <p className="text-sm text-gray-600">{trip.startTime} - {trip.endTime}</p>
                        <p className="text-sm text-gray-600">{trip.serviceDate}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-gray-900">₹{trip.fare}</p>
                        <p className="text-sm text-gray-600">{trip.bookedSeats || 0}/{trip.capacity} seats</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeSection === 'users' && (
          <div className="bg-white rounded-2xl shadow p-6">
            <h1 className="text-2xl font-bold mb-4">Admin – User Management</h1>
            {loading ? <p className="text-gray-600">Loading...</p> : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="text-left border-b">
                  <th className="py-2 pr-4">Name</th>
                  <th className="py-2 pr-4">Email</th>
                  <th className="py-2 pr-4">Role</th>
                  <th className="py-2 pr-4">Action</th>
                </tr>
              </thead>
              <tbody>
                {users.map(u => (
                  <tr key={u._id} className="border-b">
                    <td className="py-2 pr-4">{u.name}</td>
                    <td className="py-2 pr-4">{u.email}</td>
                    <td className="py-2 pr-4 uppercase">{u.role}</td>
                    <td className="py-2 pr-4">
                      <select defaultValue={u.role} onChange={e=>updateRole(u._id, e.target.value)} className="border rounded px-2 py-1">
                        <option value="passenger">PASSENGER</option>
                        <option value="conductor">CONDUCTOR</option>
                        <option value="driver">DRIVER</option>
                        <option value="depot_manager">DEPOT_MANAGER</option>
                        <option value="admin">ADMIN</option>
                      </select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
          </div>
        )}

        {activeSection === 'scheduling' && (
          <BusScheduling user={user} depotId={user?.depotId} />
        )}
      </div>
    </div>
  );
};

export default AdminDashboard;
