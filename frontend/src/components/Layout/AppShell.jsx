import React from 'react';
import { Link } from 'react-router-dom';
import { Bus, Activity } from 'lucide-react';

const AppShell = ({ children }) => {
  const links = [
    { to: '/admin/trips', label: 'Trips', icon: Bus },
    { to: '/admin/status', label: 'System Status', icon: Activity },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b">
        <div className="max-w-7xl mx-auto p-4 flex items-center gap-4">
          <div className="font-bold">YATRIK ERP</div>
          <nav className="flex items-center gap-3 text-sm text-gray-600">
            {links.map((l) => (
              <Link key={l.to} to={l.to} className="px-2 py-1 rounded hover:bg-gray-100 flex items-center gap-1">
                <l.icon className="w-4 h-4" /> {l.label}
              </Link>
            ))}
          </nav>
        </div>
      </header>
      <main className="max-w-7xl mx-auto p-4">
        {children}
      </main>
    </div>
  );
};

export default AppShell;


