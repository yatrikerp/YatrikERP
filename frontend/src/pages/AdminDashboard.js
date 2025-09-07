import React from 'react';
import { useEffect, useState } from 'react';
import { apiFetch } from '../utils/api';
import { useAuth } from '../context/AuthContext';
import BusScheduling from '../components/Common/BusScheduling';

const AdminDashboard = () => {
  const { user } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeSection, setActiveSection] = useState('users');

  useEffect(() => {
    (async () => {
      const res = await apiFetch('/api/admin/users');
      if (res.ok) setUsers(res.data.data?.users || res.data.users || []);
      setLoading(false);
    })();
  }, []);

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
