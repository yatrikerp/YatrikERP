import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './context/AuthContext';
import QueryProvider from './providers/QueryProvider';
import RequireAuth from './guards/RequireAuth';
import AppShell from './components/Layout/AppShell';
import AdminLayout from './components/Admin/AdminLayout';
import LandingPage from './pages/LandingPage';
import TripResults from './pages/TripResults';
import TripSearch from './components/Common/TripSearch';
import Auth from './pages/Auth';
import OAuthCallback from './pages/OAuthCallback';
import ResetPassword from './pages/ResetPassword';
import Profile from './pages/Profile';
import Wallet from './pages/Wallet';
import TripPlanner from './pages/TripPlanner';
import Booking from './pages/Booking';
import Ticket from './pages/pax/Ticket';
import KeralaRoutes from './pages/KeralaRoutes';

import ConductorDashboard from './pages/conductor/ConductorDashboard.jsx';
import DriverDashboard from './pages/driver/DriverDashboard.jsx';
import DepotDashboard from './pages/depot/DepotDashboard';
// import DepotTripsPage from './pages/depot/Trips';


// Admin Pages
import AdminMasterDashboard from './pages/admin/AdminMasterDashboard';
import AdminConfig from './pages/admin/AdminConfig';
import AdminFarePolicy from './pages/admin/AdminFarePolicy';
import AdminUsers from './pages/admin/AdminUsers';
import AdminDepots from './pages/admin/AdminDepots';
import AdminRoutes from './pages/admin/AdminRoutes';
import RoutesManagement from './pages/admin/RoutesManagement';
import DepotManagement from './pages/admin/DepotManagement';
import AdminStops from './pages/admin/AdminStops';
import AdminTrips from './pages/admin/AdminTrips';
import AdminDuties from './pages/admin/AdminDuties';
import AdminDrivers from './pages/admin/AdminDrivers';
import AdminPassengers from './pages/admin/AdminPassengers';
import AdminSystemStatus from './pages/admin/AdminSystemStatus';
import AdminBuses from './pages/admin/AdminBuses';
import EnhancedBusManagement from './pages/admin/EnhancedBusManagement';
// import BusManagementFallback from './pages/admin/BusManagementFallback';
import BusManagementPage from './pages/admin/BusManagementPage';
import AdminConductors from './pages/admin/AdminConductors';
import AdminDepotManagers from './pages/admin/AdminDepotManagers';
import AdminRBAC from './pages/admin/AdminRBAC';
import AdminReports from './pages/admin/AdminReports';
import AdminSettings from './pages/admin/AdminSettings';
import AdminTimetable from './pages/admin/AdminTimetable';
import AdminReservations from './pages/admin/AdminReservations';
import AdminComplaints from './pages/admin/AdminComplaints';
import AdminDriverConflicts from './pages/admin/AdminDriverConflicts';
import AdminUpcomingPayments from './pages/admin/AdminUpcomingPayments';
import AdminPaymentHistory from './pages/admin/AdminPaymentHistory';
import AdminRevenue from './pages/admin/AdminRevenue';
import RedirectDashboard from './pages/RedirectDashboard';

// Passenger Pages
import PassengerDashboardSimple from './pages/pax/PassengerDashboardSimple';
import PassengerBooking from './pages/pax/Booking';
// import PassengerResults from './pages/pax/Results';
import EnhancedResults from './pages/pax/EnhancedResults';
import BoardDrop from './pages/pax/BoardDrop';
import TripSearchPanel from './components/pax/TripSearchPanel';

import './index.css';

function App() {
  return (
    <>
    <QueryProvider>
      <AuthProvider>
      <Router>
          <Routes>
            {/* Public Routes */}
            <Route path="/" element={<LandingPage />} />
            <Route path="/search-results" element={<TripResults />} />
            <Route path="/trip-search" element={<TripSearch />} />
          {/* Use unified Auth page for both login and signup */}
          <Route path="/login" element={<Auth initialMode="login" />} />
          <Route path="/signup" element={<Auth initialMode="signup" />} />
          <Route path="/oauth/callback" element={<OAuthCallback />} />
          <Route path="/reset-password" element={<ResetPassword />} />

            
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

          <Route path="/kerala-routes" element={
            <RequireAuth>
              <AppShell>
                <KeralaRoutes />
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
          <Route path="/pax/ticket/:pnr" element={
            <RequireAuth roles={['passenger']}>
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
                <DepotDashboard />
              </RequireAuth>
            } />
          <Route path="/depot/dashboard" element={
            <RequireAuth roles={['depot_manager']}>
                <DepotDashboard />
              </RequireAuth>
            } />
          <Route path="/depot/trips" element={
            <RequireAuth roles={['depot_manager']}>
                <DepotDashboard />
              </RequireAuth>
            } />
          <Route path="/depot/trip-management" element={
            <RequireAuth roles={['depot_manager']}>
                <DepotDashboard />
              </RequireAuth>
            } />
            
            {/* Passenger Routes */}
          <Route path="/pax" element={
            <RequireAuth roles={['passenger']}>
              <AppShell>
                <PassengerDashboardSimple />
              </AppShell>
            </RequireAuth>
          } />

          <Route path="/pax/dashboard" element={
            <RequireAuth roles={['passenger']}>
              <AppShell>
                <PassengerDashboardSimple />
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

          <Route path="/pax/search" element={
            <RequireAuth roles={['passenger']}>
              <AppShell>
                <TripSearchPanel />
              </AppShell>
            </RequireAuth>
          } />

          <Route path="/pax/results" element={
            <AppShell>
              <EnhancedResults />
            </AppShell>
          } />
          
          <Route path="/pax/booking/:tripId" element={
            <RequireAuth roles={['passenger']}>
              <AppShell>
                <PassengerBooking />
              </AppShell>
            </RequireAuth>
          } />

          <Route path="/pax/board-drop/:tripId" element={
            <RequireAuth roles={['passenger']}>
              <AppShell>
                <BoardDrop />
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

          <Route path="/admin/fare-policy" element={
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

          <Route path="/admin/routes-management" element={
            <RequireAuth roles={['admin']}>
              <AdminLayout>
                <RoutesManagement />
              </AdminLayout>
            </RequireAuth>
          } />

          <Route path="/admin/depot-management" element={
            <RequireAuth roles={['admin']}>
              <AdminLayout>
                <DepotManagement />
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

          <Route path="/admin/buses" element={
            <RequireAuth roles={['admin']}>
              <AdminLayout>
                <BusManagementPage />
              </AdminLayout>
            </RequireAuth>
          } />
          
          <Route path="/admin/buses/modern" element={
            <RequireAuth roles={['admin']}>
              <AdminLayout>
                <BusManagementPage />
              </AdminLayout>
            </RequireAuth>
          } />
          
          <Route path="/admin/buses/enhanced" element={
            <RequireAuth roles={['admin']}>
              <AdminLayout>
                <EnhancedBusManagement />
              </AdminLayout>
            </RequireAuth>
          } />
          
          <Route path="/admin/buses/legacy" element={
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

          <Route path="/admin/conflicts" element={
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

          <Route path="/admin/system-status" element={
            <RequireAuth roles={['admin']}>
              <AdminLayout>
                <AdminSystemStatus />
              </AdminLayout>
            </RequireAuth>
          } />

          <Route path="/admin/rbac" element={
            <RequireAuth roles={['admin']}>
              <AdminLayout>
                <AdminRBAC />
              </AdminLayout>
            </RequireAuth>
          } />

          <Route path="/admin/reports" element={
            <RequireAuth roles={['admin']}>
              <AdminLayout>
                <AdminReports />
              </AdminLayout>
            </RequireAuth>
          } />

          <Route path="/admin/settings" element={
            <RequireAuth roles={['admin']}>
              <AdminLayout>
                <AdminSettings />
              </AdminLayout>
            </RequireAuth>
          } />

        </Routes>
      </Router>
    </AuthProvider>
    </QueryProvider>
    <Toaster
      position="top-right"
      toastOptions={{
        duration: 4000,
        style: {
          background: '#363636',
          color: '#fff',
        },
        success: {
          duration: 3000,
          style: {
            background: '#059669',
            color: '#fff',
          },
        },
        error: {
          duration: 5000,
          style: {
            background: '#dc2626',
            color: '#fff',
          },
        },
      }}
    />
    </>
  );
}

export default App;
