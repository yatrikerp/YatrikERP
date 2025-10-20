import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './context/AuthContext';
import QueryProvider from './providers/QueryProvider';
import { initializeCacheManager } from './utils/cacheManager';
import RequireAuth from './guards/RequireAuth';
import { checkAndRedirectMobile } from './utils/mobileRedirect';
import MobileRedirectHandler from './components/MobileRedirectHandler';
import AppShell from './components/Layout/AppShell';
import AdminLayout from './components/Admin/AdminLayout';
import LandingPage from './pages/LandingPage';
// Removed legacy TripResults, TripSearch, and SearchResults imports
import Auth from './pages/Auth';
import OAuthCallback from './pages/OAuthCallback';
import ResetPassword from './pages/ResetPassword';
import Profile from './pages/Profile';
import Wallet from './pages/Wallet';
import TripPlanner from './pages/TripPlanner';
import Booking from './pages/Booking';
import Ticket from './pages/pax/Ticket';
import PassengerDetails from './pages/pax/PassengerDetails';
import KeralaRoutes from './pages/KeralaRoutes';

// RedBus-style pages
import RedBusSearch from './components/RedBusSearch';
import RedBusResults from './pages/RedBusResults';
import RedBusBoardDrop from './pages/RedBusBoardDrop';
import RedBusSeatSelection from './pages/RedBusSeatSelection';
import RedBusPassengerDetails from './pages/RedBusPassengerDetails';
import RedBusPayment from './pages/RedBusPayment';
import RedBusTicket from './pages/RedBusTicket';

import ConductorDashboard from './pages/conductor/ConductorDashboard.jsx';
import DriverDashboard from './pages/driver/DriverDashboard.jsx';
import SupportAgentDashboard from './pages/support/SupportAgentDashboard.jsx';
import DataCollectorDashboard from './pages/dataCollector/DataCollectorDashboard.jsx';
import DepotDashboard from './pages/depot/DepotDashboard';
import DepotLogin from './pages/DepotLogin';
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
import AdminBookings from './pages/admin/AdminBookings';
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

// New Streamlined Components
import StreamlinedBusManagement from './pages/admin/StreamlinedBusManagement';
import StreamlinedRouteManagement from './pages/admin/StreamlinedRouteManagement';
import StreamlinedTripManagement from './pages/admin/StreamlinedTripManagement';

// Passenger Pages (Legacy - keeping for reference)
// import PassengerDashboardSimple from './pages/pax/PassengerDashboardSimple';
// import PassengerBooking from './pages/pax/Booking';
// import EnhancedResults from './pages/pax/EnhancedResults';
// import BoardDrop from './pages/pax/BoardDrop';
// import TripSearchPanel from './components/pax/TripSearchPanel';

// New Passenger Module Pages
import PassengerLayout from './components/pax/PassengerLayout';
import PassengerDashboard from './pages/passenger/PassengerDashboard';
import PassengerSearch from './pages/passenger/Search';
import PassengerBookingNew from './pages/passenger/Booking';
import PassengerResults from './pages/passenger/Results';
import PassengerEnhancedResults from './pages/passenger/EnhancedResults';
import PassengerBoardDrop from './pages/passenger/BoardDrop';
import PassengerSeatSelection from './pages/passenger/SeatSelection';
import PassengerTicket from './pages/passenger/Ticket';
import PassengerTicketsList from './pages/passenger/TicketsList';
import PassengerWallet from './pages/passenger/Wallet';
import PassengerRecommendations from './pages/passenger/Recommendations';
import PassengerProfile from './pages/passenger/Profile';
import AvailableTrips from './pages/passenger/AvailableTrips';
import MobilePassengerDashboard from './components/passenger/MobilePassengerDashboard';
import OptimizedMobileDashboard from './components/passenger/OptimizedMobileDashboard';
import BookingChoice from './pages/BookingChoice';
import MobileBookingChoice from './pages/MobileBookingChoice';
import MobilePassengerSearch from './pages/passenger/MobileSearch';
import MobilePassengerResults from './pages/passenger/MobileResults';
import MobilePassengerWallet from './pages/passenger/MobileWallet';
import MobilePassengerProfile from './pages/passenger/MobileProfile';
import MobilePassengerBooking from './pages/passenger/MobileBooking';
import MobilePassengerSeats from './pages/passenger/MobileSeats';
import MobilePassengerTicket from './pages/passenger/MobileTicket';
import CompleteBookingFlow from './pages/passenger/CompleteBookingFlow';
import MobileLanding from './components/MobileLanding';
import MobileLandingNew from './components/MobileLandingNew';
import MinimalMobileLanding from './components/MinimalMobileLanding';
import UltraMobileLanding from './components/UltraMobileLanding';
import EnhancedMobileLanding from './components/EnhancedMobileLanding';
import MobileWrapper from './components/MobileWrapper';

// Mobile Flow Components
import MobileLandingPage from './mobile/LandingPage';
import PassengerFlow from './mobile/PassengerFlow';
import ConductorFlow from './mobile/ConductorFlow';
import DriverFlow from './mobile/DriverFlow';
import BookingsPage from './mobile/BookingsPage';
import TrackPage from './mobile/TrackPage';
import OffersPage from './mobile/OffersPage';
import WalletPage from './mobile/WalletPage';

import './index.css';

// Redirect any accidental SPA navigations to /api/* to the backend server logically
const ApiRedirect = () => {
  const location = useLocation();
  useEffect(() => {
    const backendBase = ((typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_BACKEND_URL) || process.env.REACT_APP_API_URL || 'http://localhost:5000').replace(/\/$/, '');
    const target = `${backendBase}${location.pathname}${location.search}${location.hash}`;
    try { window.location.replace(target); } catch { window.location.href = target; }
  }, [location]);
  return null;
};

function App() {
  // Initialize cache manager on app startup
  useEffect(() => {
    initializeCacheManager();
    
    // Check for mobile redirect on app load
    const checkMobile = () => {
      checkAndRedirectMobile();
    };
    
    // Check immediately and on route changes
    checkMobile();
    
    // Listen for route changes
    const handleRouteChange = () => {
      setTimeout(checkMobile, 100); // Small delay to let route settle
    };
    
    window.addEventListener('popstate', handleRouteChange);
    
    return () => {
      window.removeEventListener('popstate', handleRouteChange);
    };
  }, []);

  return (
    <>
    <QueryProvider>
      <AuthProvider>
      <Router future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <MobileRedirectHandler>
          <Routes>
            {/* Public Routes */}
            {/* Logical guard: if the SPA ever lands on /api/*, forward to backend */}
            <Route path="/api/*" element={<ApiRedirect />} />
            <Route path="/" element={<LandingPage />} />
        <Route path="/mobile" element={<MobileLandingPage />} />
        <Route path="/mobile-test" element={<EnhancedMobileLanding />} />
        <Route path="/mobile-minimal" element={<MinimalMobileLanding />} />
        <Route path="/mobile-new" element={<MobileLandingNew />} />
        <Route path="/mobile-ultra" element={<UltraMobileLanding />} />
        
        {/* New Mobile Flow Routes */}
        <Route path="/mobile/passenger" element={
          <RequireAuth roles={['passenger']}>
            <PassengerFlow />
          </RequireAuth>
        } />
        <Route path="/mobile/conductor" element={
          <RequireAuth roles={['conductor']}>
            <ConductorFlow />
          </RequireAuth>
        } />
        <Route path="/mobile/driver" element={
          <RequireAuth roles={['driver']}>
            <DriverFlow />
          </RequireAuth>
        } />
        <Route path="/support" element={
          <RequireAuth roles={['support_agent']}>
            <SupportAgentDashboard />
          </RequireAuth>
        } />
        <Route path="/data-collector" element={
          <RequireAuth roles={['data_collector']}>
            <DataCollectorDashboard />
          </RequireAuth>
        } />
        <Route path="/mobile/bookings" element={
          <RequireAuth roles={['passenger']}>
            <BookingsPage />
          </RequireAuth>
        } />
        <Route path="/mobile/track" element={<TrackPage />} />
        <Route path="/mobile/offers" element={<OffersPage />} />
        <Route path="/mobile/wallet" element={
          <RequireAuth roles={['passenger']}>
            <WalletPage />
          </RequireAuth>
        } />
            {/* Legacy search routes removed in favor of unified RedBus flow */}
          {/* Use unified Auth page for both login and signup */}
          <Route path="/login" element={<Auth initialMode="login" />} />
          <Route path="/signup" element={<Auth initialMode="signup" />} />
          <Route path="/depot-login" element={<DepotLogin />} />
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

          {/* RedBus-style routes */}
          <Route path="/redbus" element={<RedBusSearch />} />
          <Route path="/redbus-results" element={<RedBusResults />} />
          <Route path="/redbus/board-drop/:tripId" element={<RedBusBoardDrop />} />
          <Route path="/redbus/seats/:tripId" element={<RedBusSeatSelection />} />
          <Route path="/redbus/passenger-details/:tripId" element={<RedBusPassengerDetails />} />
          <Route path="/redbus/payment" element={<RedBusPayment />} />
          <Route path="/redbus/ticket/:pnr" element={<RedBusTicket />} />

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
              <ConductorDashboard />
            </RequireAuth>
          } />

          <Route path="/driver" element={
            <RequireAuth roles={['driver']}>
              <DriverDashboard />
            </RequireAuth>
          } />

          <Route path="/depot" element={
            <RequireAuth roles={['depot_manager']}>
                <DepotDashboard />
              </RequireAuth>
            } />

          {/* Support Agent Routes */}
          <Route path="/support" element={
            <RequireAuth roles={['support_agent', 'admin']}>
              <SupportAgentDashboard />
            </RequireAuth>
          } />
          <Route path="/support/dashboard" element={
            <RequireAuth roles={['support_agent', 'admin']}>
              <SupportAgentDashboard />
            </RequireAuth>
          } />

          {/* Data Collector Routes */}
          <Route path="/data-collector" element={
            <RequireAuth roles={['data_collector', 'admin']}>
              <DataCollectorDashboard />
            </RequireAuth>
          } />
          <Route path="/data-collector/dashboard" element={
            <RequireAuth roles={['data_collector', 'admin']}>
              <DataCollectorDashboard />
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
          <Route path="/depot/fleet-management" element={
            <RequireAuth roles={['depot_manager']}>
                <DepotDashboard />
              </RequireAuth>
            } />
          <Route path="/depot/route-management" element={
            <RequireAuth roles={['depot_manager']}>
                <DepotDashboard />
              </RequireAuth>
            } />
          <Route path="/depot/booking-management" element={
            <RequireAuth roles={['depot_manager']}>
                <DepotDashboard />
              </RequireAuth>
            } />
          <Route path="/depot/staff-management" element={
            <RequireAuth roles={['depot_manager']}>
                <DepotDashboard />
              </RequireAuth>
            } />
          <Route path="/depot/bus-scheduling" element={
            <RequireAuth roles={['depot_manager']}>
                <DepotDashboard />
              </RequireAuth>
            } />
          <Route path="/depot/reports-analytics" element={
            <RequireAuth roles={['depot_manager']}>
                <DepotDashboard />
              </RequireAuth>
            } />
            
            {/* Passenger Routes */}
          <Route path="/pax" element={
            <RequireAuth roles={['passenger']}>
              <PassengerLayout>
                <PassengerDashboard />
              </PassengerLayout>
            </RequireAuth>
          } />

          <Route path="/pax/dashboard" element={
            <RequireAuth roles={['passenger']}>
              <PassengerLayout>
                <PassengerDashboard />
              </PassengerLayout>
            </RequireAuth>
          } />

          <Route path="/pax/booking" element={
            <RequireAuth roles={['passenger']}>
              <PassengerLayout>
                <PassengerBookingNew />
              </PassengerLayout>
            </RequireAuth>
          } />

          <Route path="/pax/search" element={
            <RequireAuth roles={['passenger']}>
              <PassengerLayout>
                <PassengerBookingNew />
              </PassengerLayout>
            </RequireAuth>
          } />

          <Route path="/pax/results" element={
            <RequireAuth roles={['passenger']}>
              <PassengerLayout>
                <PassengerResults />
              </PassengerLayout>
            </RequireAuth>
          } />
          
          <Route path="/pax/booking/:tripId" element={
            <RequireAuth roles={['passenger']}>
              <PassengerLayout>
                <PassengerBookingNew />
              </PassengerLayout>
            </RequireAuth>
          } />

          <Route path="/pax/board-drop/:tripId" element={
            <RequireAuth roles={['passenger']}>
              <PassengerLayout>
                <PassengerBoardDrop />
              </PassengerLayout>
            </RequireAuth>
          } />

          <Route path="/pax/passenger-details/:tripId" element={
            <RequireAuth roles={['passenger']}>
              <PassengerLayout>
                <PassengerDetails />
              </PassengerLayout>
            </RequireAuth>
          } />

          <Route path="/pax/seats/:tripId" element={
            <RequireAuth roles={['passenger']}>
              <PassengerLayout>
                <PassengerSeatSelection />
              </PassengerLayout>
            </RequireAuth>
          } />

          {/* New Passenger Module Routes */}
          <Route path="/passenger/dashboard" element={
            <RequireAuth roles={['passenger']}>
              <PassengerLayout>
                <PassengerDashboard />
              </PassengerLayout>
            </RequireAuth>
          } />

          {/* Mobile-optimized Passenger Dashboard */}
        <Route path="/passenger/mobile" element={
          <RequireAuth roles={['passenger']}>
            <OptimizedMobileDashboard />
          </RequireAuth>
        } />

          <Route path="/passenger/booking" element={
            <RequireAuth roles={['passenger']}>
              <PassengerLayout>
                <PassengerSearch />
              </PassengerLayout>
            </RequireAuth>
          } />

          <Route path="/passenger/search" element={
            <RequireAuth roles={['passenger']}>
              {window.innerWidth <= 768 || /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) 
                ? <MobilePassengerSearch /> 
                : <PassengerLayout><PassengerSearch /></PassengerLayout>
              }
            </RequireAuth>
          } />

          <Route path="/passenger/results" element={
            <RequireAuth roles={['passenger']}>
              {window.innerWidth <= 768 || /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) 
                ? <MobilePassengerResults /> 
                : <PassengerLayout><PassengerResults /></PassengerLayout>
              }
            </RequireAuth>
          } />

          <Route path="/passenger/available-trips" element={
            <RequireAuth roles={['passenger']}>
              <PassengerLayout>
                <AvailableTrips />
              </PassengerLayout>
            </RequireAuth>
          } />

          <Route path="/passenger/boarddrop/:tripId" element={
            <RequireAuth roles={['passenger']}>
              <PassengerLayout>
                <PassengerBoardDrop />
              </PassengerLayout>
            </RequireAuth>
          } />

          <Route path="/passenger/seats/:tripId" element={
            <RequireAuth roles={['passenger']}>
              {window.innerWidth <= 768 || /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) 
                ? <MobilePassengerSeats /> 
                : <PassengerLayout><PassengerSeatSelection /></PassengerLayout>
              }
            </RequireAuth>
          } />

          <Route path="/passenger/booking/:tripId" element={
            <RequireAuth roles={['passenger']}>
              {window.innerWidth <= 768 || /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) 
                ? <MobilePassengerBooking /> 
                : <PassengerLayout><PassengerBookingNew /></PassengerLayout>
              }
            </RequireAuth>
          } />

          <Route path="/passenger/ticket/:pnr" element={
            <RequireAuth roles={['passenger']}>
              {window.innerWidth <= 768 || /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) 
                ? <MobilePassengerTicket /> 
                : <PassengerLayout><PassengerTicket /></PassengerLayout>
              }
            </RequireAuth>
          } />

          <Route path="/passenger/enhanced-results" element={
            <RequireAuth roles={['passenger']}>
              <PassengerLayout>
                <PassengerEnhancedResults />
              </PassengerLayout>
            </RequireAuth>
          } />

          <Route path="/passenger/board-drop" element={
            <RequireAuth roles={['passenger']}>
              <PassengerLayout>
                <PassengerBoardDrop />
              </PassengerLayout>
            </RequireAuth>
          } />

          <Route path="/passenger/tickets" element={
            <RequireAuth roles={['passenger']}>
              <PassengerLayout>
                <PassengerTicketsList />
              </PassengerLayout>
            </RequireAuth>
          } />

          <Route path="/passenger/wallet" element={
            <RequireAuth roles={['passenger']}>
              {window.innerWidth <= 768 || /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) 
                ? <MobilePassengerWallet /> 
                : <PassengerLayout><PassengerWallet /></PassengerLayout>
              }
            </RequireAuth>
          } />

          <Route path="/passenger/recommendations" element={
            <RequireAuth roles={['passenger']}>
              <PassengerLayout>
                <PassengerRecommendations />
              </PassengerLayout>
            </RequireAuth>
          } />

          <Route path="/passenger/profile" element={
            <RequireAuth roles={['passenger']}>
              {window.innerWidth <= 768 || /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) 
                ? <MobilePassengerProfile /> 
                : <PassengerLayout><PassengerProfile /></PassengerLayout>
              }
            </RequireAuth>
          } />

          {/* Booking Choice Modal - After Login from Popular Routes */}
          <Route path="/booking-choice" element={
            <RequireAuth roles={['passenger']}>
              {window.innerWidth <= 768 || /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) 
                ? <MobileBookingChoice /> 
                : <BookingChoice />
              }
            </RequireAuth>
          } />

          {/* Complete Booking Flow - RedBus Style from Popular Routes */}
          <Route path="/complete-booking/:tripId" element={
            <RequireAuth roles={['passenger']}>
              <CompleteBookingFlow />
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

          {/* New Streamlined Management Routes */}

          <Route path="/admin/streamlined-buses" element={
            <RequireAuth roles={['admin']}>
              <AdminLayout>
                <StreamlinedBusManagement />
              </AdminLayout>
            </RequireAuth>
          } />

          <Route path="/admin/streamlined-routes" element={
            <RequireAuth roles={['admin']}>
              <AdminLayout>
                <StreamlinedRouteManagement />
              </AdminLayout>
            </RequireAuth>
          } />

          <Route path="/admin/streamlined-trips" element={
            <RequireAuth roles={['admin']}>
              <AdminLayout>
                <StreamlinedTripManagement />
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

          <Route path="/admin/bookings" element={
            <RequireAuth roles={['admin']}>
              <AdminLayout>
                <AdminBookings />
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

          {/* Admin Support Agent Management */}
          <Route path="/admin/support-agents" element={
            <RequireAuth roles={['admin', 'support_agent']}>
              <AdminLayout>
                <SupportAgentDashboard />
              </AdminLayout>
            </RequireAuth>
          } />

          {/* Admin Data Collector Management */}
          <Route path="/admin/data-collectors" element={
            <RequireAuth roles={['admin', 'data_collector']}>
              <AdminLayout>
                <DataCollectorDashboard />
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
        </MobileRedirectHandler>
      </Router>
    </AuthProvider>
    </QueryProvider>
    {/* CacheTestPanel removed for production and dashboards */}
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
