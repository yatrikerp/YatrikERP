import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import RequireAuth from './guards/RequireAuth';
import AppShell from './components/Layout/AppShell';
import AdminLayout from './components/Admin/AdminLayout';
import LandingPage from './pages/LandingPage';
import Auth from './pages/Auth';
import OAuthCallback from './pages/OAuthCallback';
import Profile from './pages/Profile';
import Wallet from './pages/Wallet';
import TripPlanner from './pages/TripPlanner';
import Booking from './pages/Booking';
import Ticket from './pages/Ticket';

import ConductorDashboard from './pages/ConductorDashboard';
import DriverDashboard from './pages/DriverDashboard';
import DepotDashboard from './pages/DepotDashboard';

// Admin Pages
import AdminMasterDashboard from './pages/admin/AdminMasterDashboard';
import AdminConfig from './pages/admin/AdminConfig';
import AdminFarePolicy from './pages/admin/AdminFarePolicy';
import AdminUsers from './pages/admin/AdminUsers';
import AdminDepots from './pages/admin/AdminDepots';
import AdminRoutes from './pages/admin/AdminRoutes';
import AdminStops from './pages/admin/AdminStops';
import AdminTrips from './pages/admin/AdminTrips';
import AdminDuties from './pages/admin/AdminDuties';
import AdminDrivers from './pages/admin/AdminDrivers';
import AdminPassengers from './pages/admin/AdminPassengers';
import AdminAudits from './pages/admin/AdminAudits';
import AdminSystemStatus from './pages/admin/AdminSystemStatus';
import AdminBuses from './pages/admin/AdminBuses';
import AdminConductors from './pages/admin/AdminConductors';
import AdminDepotManagers from './pages/admin/AdminDepotManagers';
import AdminTimetable from './pages/admin/AdminTimetable';
import AdminReservations from './pages/admin/AdminReservations';
import AdminComplaints from './pages/admin/AdminComplaints';
import AdminDriverConflicts from './pages/admin/AdminDriverConflicts';
import AdminUpcomingPayments from './pages/admin/AdminUpcomingPayments';
import AdminPaymentHistory from './pages/admin/AdminPaymentHistory';
import AdminRevenue from './pages/admin/AdminRevenue';
import AdminWallets from './pages/admin/AdminWallets';
import RedirectDashboard from './pages/RedirectDashboard';

// Passenger Pages
import PassengerDashboard from './pages/pax/Dashboard';
import PassengerBooking from './pages/pax/Booking';
import PassengerResults from './pages/pax/Results';

import './index.css';

function App() {
  return (
    <AuthProvider>
      <Router>
          <Routes>
            {/* Public Routes */}
            <Route path="/" element={<LandingPage />} />
          {/* Use unified Auth page for both login and signup */}
          <Route path="/login" element={<Auth initialMode="login" />} />
          <Route path="/signup" element={<Auth initialMode="signup" />} />
          <Route path="/oauth/callback" element={<OAuthCallback />} />
            
            {/* Protected Routes */}
          <Route path="/profile" element={
            <RequireAuth>
              <AppShell>
                <Profile />
              </AppShell>
            </RequireAuth>
          } />

          <Route path="/wallet" element={
            <RequireAuth>
              <AppShell>
                <Wallet />
              </AppShell>
            </RequireAuth>
          } />

          <Route path="/trip-planner" element={
            <RequireAuth>
              <AppShell>
                <TripPlanner />
              </AppShell>
            </RequireAuth>
          } />

          <Route path="/booking" element={
            <RequireAuth>
              <AppShell>
                <Booking />
              </AppShell>
            </RequireAuth>
          } />

          <Route path="/ticket" element={
            <RequireAuth>
              <AppShell>
                <Ticket />
              </AppShell>
            </RequireAuth>
          } />

          {/* Role-based Routes */}
            <Route path="/dashboard" element={
              <RequireAuth>
              <RedirectDashboard />
            </RequireAuth>
          } />

          <Route path="/conductor" element={
            <RequireAuth roles={['conductor']}>
              <AppShell>
                <ConductorDashboard />
              </AppShell>
            </RequireAuth>
          } />

          <Route path="/driver" element={
            <RequireAuth roles={['driver']}>
              <AppShell>
                <DriverDashboard />
              </AppShell>
            </RequireAuth>
          } />

          <Route path="/depot" element={
            <RequireAuth roles={['depot_manager']}>
                <AppShell>
                <DepotDashboard />
                </AppShell>
              </RequireAuth>
            } />
            
            {/* Admin Routes */}
          <Route path="/admin" element={
            <RequireAuth roles={['admin']}>
              <AdminLayout>
                <AdminMasterDashboard />
              </AdminLayout>
            </RequireAuth>
          } />

          <Route path="/admin/config" element={
            <RequireAuth roles={['admin']}>
              <AdminLayout>
                <AdminConfig />
              </AdminLayout>
            </RequireAuth>
          } />

          <Route path="/admin/fare" element={
            <RequireAuth roles={['admin']}>
              <AdminLayout>
                <AdminFarePolicy />
              </AdminLayout>
            </RequireAuth>
          } />

          <Route path="/admin/users" element={
            <RequireAuth roles={['admin']}>
              <AdminLayout>
                <AdminUsers />
              </AdminLayout>
            </RequireAuth>
          } />

          <Route path="/admin/depots" element={
            <RequireAuth roles={['admin']}>
              <AdminLayout>
                <AdminDepots />
              </AdminLayout>
            </RequireAuth>
          } />

          <Route path="/admin/routes" element={
            <RequireAuth roles={['admin']}>
              <AdminLayout>
                <AdminRoutes />
              </AdminLayout>
            </RequireAuth>
          } />

          <Route path="/admin/stops" element={
            <RequireAuth roles={['admin']}>
              <AdminLayout>
                <AdminStops />
              </AdminLayout>
            </RequireAuth>
          } />

          <Route path="/admin/trips" element={
            <RequireAuth roles={['admin']}>
              <AdminLayout>
                <AdminTrips />
              </AdminLayout>
            </RequireAuth>
          } />

          <Route path="/admin/duties" element={
            <RequireAuth roles={['admin']}>
              <AdminLayout>
                <AdminDuties />
              </AdminLayout>
            </RequireAuth>
          } />

          <Route path="/admin/drivers" element={
            <RequireAuth roles={['admin']}>
              <AdminLayout>
                <AdminDrivers />
              </AdminLayout>
            </RequireAuth>
          } />

          <Route path="/admin/passengers" element={
            <RequireAuth roles={['admin']}>
              <AdminLayout>
                <AdminPassengers />
              </AdminLayout>
            </RequireAuth>
          } />

          <Route path="/admin/audits" element={
            <RequireAuth roles={['admin']}>
              <AdminLayout>
                <AdminAudits />
              </AdminLayout>
            </RequireAuth>
          } />

          <Route path="/admin/status" element={
            <RequireAuth roles={['admin']}>
              <AdminLayout>
                <AdminSystemStatus />
              </AdminLayout>
            </RequireAuth>
          } />

          {/* Additional Admin Routes */}
          <Route path="/admin/buses" element={
            <RequireAuth roles={['admin']}>
              <AdminLayout>
                <AdminBuses />
              </AdminLayout>
            </RequireAuth>
          } />

          <Route path="/admin/conductors" element={
            <RequireAuth roles={['admin']}>
              <AdminLayout>
                <AdminConductors />
              </AdminLayout>
            </RequireAuth>
          } />

          <Route path="/admin/depot-managers" element={
            <RequireAuth roles={['admin']}>
              <AdminLayout>
                <AdminDepotManagers />
              </AdminLayout>
            </RequireAuth>
          } />

          <Route path="/admin/timetable" element={
            <RequireAuth roles={['admin']}>
              <AdminLayout>
                <AdminTimetable />
              </AdminLayout>
            </RequireAuth>
          } />

          <Route path="/admin/reservations" element={
            <RequireAuth roles={['admin']}>
              <AdminLayout>
                <AdminReservations />
              </AdminLayout>
            </RequireAuth>
          } />

          <Route path="/admin/complaints" element={
            <RequireAuth roles={['admin']}>
              <AdminLayout>
                <AdminComplaints />
              </AdminLayout>
            </RequireAuth>
          } />

          <Route path="/admin/driver-conflicts" element={
            <RequireAuth roles={['admin']}>
              <AdminLayout>
                <AdminDriverConflicts />
              </AdminLayout>
            </RequireAuth>
          } />

          <Route path="/admin/upcoming-payments" element={
            <RequireAuth roles={['admin']}>
              <AdminLayout>
                <AdminUpcomingPayments />
              </AdminLayout>
            </RequireAuth>
          } />

          <Route path="/admin/payment-history" element={
            <RequireAuth roles={['admin']}>
              <AdminLayout>
                <AdminPaymentHistory />
              </AdminLayout>
            </RequireAuth>
          } />

          <Route path="/admin/revenue" element={
            <RequireAuth roles={['admin']}>
              <AdminLayout>
                <AdminRevenue />
              </AdminLayout>
              </RequireAuth>
            } />
            
          <Route path="/admin/wallets" element={
            <RequireAuth roles={['admin']}>
              <AdminLayout>
                <AdminWallets />
              </AdminLayout>
            </RequireAuth>
          } />

          {/* Passenger Routes */}
          <Route path="/pax" element={
            <RequireAuth roles={['passenger']}>
              <AppShell>
                <PassengerDashboard />
              </AppShell>
            </RequireAuth>
          } />

          <Route path="/pax/booking" element={
            <RequireAuth roles={['passenger']}>
              <AppShell>
                <PassengerBooking />
              </AppShell>
            </RequireAuth>
          } />

          <Route path="/pax/results" element={
            <RequireAuth roles={['passenger']}>
              <AppShell>
                <PassengerResults />
              </AppShell>
            </RequireAuth>
          } />
          </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
