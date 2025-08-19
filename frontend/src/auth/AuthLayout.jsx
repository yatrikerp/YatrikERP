import React from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import AnimatedMapPanel from '../components/Common/AnimatedMapPanel';

const AuthLayout = () => {
  const location = useLocation();
  const isLogin = location.pathname === '/login';

  return (
    <div className="min-h-screen flex">
      {/* Left Panel - Animated Map */}
      <div className="w-full lg:w-1/2 bg-white">
        <AnimatedMapPanel />
      </div>
      
      {/* Right Panel - Removed all content */}
      <div className="hidden lg:block w-1/2 bg-gray-50">
        {/* Content removed as requested */}
      </div>
    </div>
  );
};

export default AuthLayout;
