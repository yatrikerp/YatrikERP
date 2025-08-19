import React from 'react';
import { useEffect, useState } from 'react';
import { apiFetch } from '../utils/api';

const AdminDashboard = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

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
    <div className="min-h-screen bg-gray-50 p-6">
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
    </div>
  );
};

export default AdminDashboard;
