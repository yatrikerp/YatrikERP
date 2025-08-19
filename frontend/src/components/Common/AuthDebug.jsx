import React from 'react';
import { useAuth } from '../../context/AuthContext';

const AuthDebug = () => {
  const { user, loading } = useAuth();
  
  const token = localStorage.getItem('token');
  const userRaw = localStorage.getItem('user');
  
  let parsedUser = null;
  try {
    parsedUser = userRaw ? JSON.parse(userRaw) : null;
  } catch (error) {
    console.error('Error parsing user data:', error);
  }

  return (
    <div className="fixed top-4 right-4 bg-white p-4 rounded-lg shadow-lg border max-w-sm z-50">
      <h3 className="font-bold text-sm mb-2">🔍 Auth Debug</h3>
      <div className="text-xs space-y-1">
        <div><strong>Loading:</strong> {loading ? 'Yes' : 'No'}</div>
        <div><strong>Context User:</strong> {user ? 'Yes' : 'No'}</div>
        <div><strong>Context User Role:</strong> {user?.role || 'None'}</div>
        <div><strong>LocalStorage Token:</strong> {token ? 'Yes' : 'No'}</div>
        <div><strong>LocalStorage User:</strong> {userRaw ? 'Yes' : 'No'}</div>
        <div><strong>Parsed User Role:</strong> {parsedUser?.role || 'None'}</div>
        <div><strong>Current Path:</strong> {window.location.pathname}</div>
      </div>
      <button 
        onClick={() => {
          localStorage.clear();
          window.location.reload();
        }}
        className="mt-2 w-full px-2 py-1 bg-red-500 text-white text-xs rounded hover:bg-red-600"
      >
        Clear & Reload
      </button>
    </div>
  );
};

export default AuthDebug;
