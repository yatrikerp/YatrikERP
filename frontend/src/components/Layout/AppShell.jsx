import React from 'react';
import { Link } from 'react-router-dom';
import BookingConsole from '../pax/BookingConsole';

const AppShell = ({ children }) => {
  const links = [];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navy/Orange header */}
      <header className="bg-[#0b1e46] text-white">
        <div className="max-w-7xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="font-bold tracking-wide">YATRIK ERP</div>
              <nav className="hidden sm:flex items-center gap-3 text-sm text-white/90">
                {links.map((l) => (
                  <Link key={l.to} to={l.to} className="px-2 py-1 rounded hover:bg-white/10 flex items-center gap-1">
                    <l.icon className="w-4 h-4" /> {l.label}
                  </Link>
                ))}
              </nav>
            </div>
            <div className="flex items-center gap-2">
              <Link to="/pax" className="px-3 py-1.5 rounded bg-[#ff7a1a] text-white text-sm">Passenger</Link>
              <Link to="/dashboard" className="px-3 py-1.5 rounded bg-white/10 text-white text-sm">Dashboard</Link>
            </div>
          </div>
          <div className="mt-3">
            <BookingConsole />
          </div>
        </div>
      </header>
      <main className="max-w-7xl mx-auto p-4">
        {children}
      </main>
    </div>
  );
};

export default AppShell;


