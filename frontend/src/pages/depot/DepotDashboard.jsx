import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../../context/AuthContext';
import { 
  Bus, 
  Route, 
  Users, 
  TrendingUp, 
  MapPin, 
  Clock, 
  FileText as FileTextIcon,
  BarChart3,
  Settings,
  Bell,
  Search,
  Filter,
  Download,
  RefreshCw,
  Eye,
  Edit,
  Trash2,
  Plus,
  ChevronRight,
  AlertCircle,
  CheckCircle,
  XCircle,
  Activity,
  DollarSign,
  UserCheck,
  Fuel,
  Ticket,
  Calendar,
  TrendingDown,
  Zap,
  Shield,
  Database,
  AlertTriangle,
  Info,
  Wrench,
  Truck,
  Gauge,
  Timer,
  Grid,
  List,
  LogOut
} from 'lucide-react';
import LiveGPSMap from '../../components/Common/LiveGPSMap';
import QuickActions from '../../components/Common/QuickActions';
import AdvancedCharts from './components/AdvancedCharts';
import SmartNotifications from '../../components/Common/SmartNotifications';
import TripManagement from '../../components/ConductorDriver/TripManagement';
import AttendanceDashboard from '../../components/DepotManager/AttendanceDashboard';
import BrandLogo from '../../components/Common/BrandLogo';
import './depot.theme.css';

const DepotDashboard = () => {
  const { logout, user } = useAuth();
  const [activeTab, setActiveTab] = useState('overview');
  const [depotData, setDepotData] = useState(null);
  const [routesData, setRoutesData] = useState([]);
  const [tripsData, setTripsData] = useState([]);
  const [bookingsData, setBookingsData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [viewMode, setViewMode] = useState('grid');
  const [alerts, setAlerts] = useState([]);
  const [kpiData, setKpiData] = useState({});
  const [fuelData, setFuelData] = useState({});
  const [maintenanceData, setMaintenanceData] = useState({});

  // Enhanced sparkline for KPI trends
  const Sparkline = ({ data = [], color = '#E91E63', width = 80, height = 24 }) => {
    if (!data.length) data = [4,6,5,7,8,6,9,10,8,11,12,15,18,20,22,25,28,30,32,35];
    const max = Math.max(...data);
    const min = Math.min(...data);
    const points = data.map((v, i) => {
      const x = (i / Math.max(1, data.length - 1)) * width;
      const y = height - ((v - min) / Math.max(1, (max - min))) * height;
      return `${x},${y}`;
    }).join(' ');
    return (
      <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} aria-hidden>
        <polyline points={points} fill="none" stroke={color} strokeWidth="1.5" />
      </svg>
    );
  };

  // Professional ERP KPI Card - Strategic Level
  const StrategicKpiCard = ({ icon: Icon, label, value, delta, trendColor = '#E91E63', onClick, priority = 'primary' }) => (
    <div 
      onClick={onClick}
      className="bg-white border border-gray-200 rounded-lg transition-all duration-200 cursor-pointer hover:border-gray-300 hover:shadow-sm"
    >
      <div className="p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-md text-white flex items-center justify-center ${
              priority === 'primary' 
                ? 'bg-[#E91E63]' 
                : 'bg-[#2196F3]'
            }`}>
              <Icon className="w-5 h-5" />
            </div>
            <div>
              <div className="text-gray-500 text-xs uppercase tracking-wider font-semibold">
                {label}
              </div>
              <div className="text-2xl font-bold text-gray-900 leading-tight">
                {value}
              </div>
            </div>
          </div>
          <div className="text-right">
            {delta && (
              <div className={`text-sm font-semibold flex items-center gap-1 ${
                delta.includes('↑') ? 'text-green-600' : 'text-red-600'
              }`}>
                <span className="text-lg">{delta.includes('↑') ? '↑' : '↓'}</span> 
                {delta.replace('↑', '').replace('↓', '')}
              </div>
            )}
            <div className="mt-2">
              <Sparkline color={trendColor} width={80} height={24} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  // Compact Operational KPI Card
  const OperationalKpiCard = ({ icon: Icon, label, value, status, onClick, trend = null, alert = false, drillDown = null }) => (
    <div 
      onClick={onClick}
      className="bg-white border border-gray-200 rounded-lg p-3 hover:border-gray-300 hover:shadow-sm transition-all duration-200 cursor-pointer"
    >
      <div className="flex items-center gap-3">
        <div className={`w-8 h-8 rounded-md flex items-center justify-center ${
          alert 
            ? 'bg-red-100 text-red-600' 
            : 'bg-blue-100 text-blue-600'
        }`}>
          <Icon className="w-4 h-4" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-gray-500 text-xs uppercase tracking-wider font-semibold">
            {label}
          </div>
          <div className="text-lg font-bold text-gray-900">{value}</div>
          {trend && <div className="text-xs text-gray-500 mt-1">{trend}</div>}
          {status && (
            <div className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium mt-1 ${
              status === 'success' ? 'bg-green-100 text-green-700' :
              status === 'warning' ? 'bg-amber-100 text-amber-700' :
              status === 'critical' ? 'bg-red-100 text-red-700' :
              'bg-blue-100 text-blue-700'
            }">
              {status === 'success' && <CheckCircle className="w-3 h-3" />}
              {status === 'warning' && <AlertTriangle className="w-3 h-3" />}
              {status === 'critical' && <XCircle className="w-3 h-3" />}
              {status === 'info' && <Info className="w-3 h-3" />}
              {status}
            </div>
          )}
        </div>
        {drillDown && (
          <div className="text-blue-600 hover:text-blue-800">
            <ChevronRight className="w-4 h-4" />
          </div>
        )}
      </div>
    </div>
  );

  // Critical Alerts Banner - Top Priority
  const CriticalAlertsBanner = ({ alerts = [] }) => {
    if (alerts.length === 0) return null;
    
    const criticalCount = alerts.filter(a => a.priority === 'critical').length;
    const warningCount = alerts.filter(a => a.priority === 'warning').length;
    
    return (
      <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <AlertTriangle className="w-5 h-5 text-red-600" />
            <div>
              <h3 className="text-sm font-bold text-red-800">
                Critical Alerts Requiring Immediate Attention
              </h3>
              <p className="text-xs text-red-700">
                {criticalCount} Critical • {warningCount} Warning • Last updated: {new Date().toLocaleTimeString()}
              </p>
            </div>
          </div>
          <button className="text-red-600 hover:text-red-800 text-sm font-medium">
            View All ({alerts.length})
          </button>
        </div>
        
        <div className="mt-3 space-y-2">
          {alerts.slice(0, 3).map((alert, index) => (
            <div key={index} className="flex items-center gap-2 text-sm">
              <div className={`w-2 h-2 rounded-full ${
                alert.priority === 'critical' ? 'bg-red-500' :
                alert.priority === 'warning' ? 'bg-amber-500' :
                'bg-blue-500'
              }`} />
              <span className="text-red-800 font-medium">{alert.message}</span>
              <span className="text-red-600 text-xs">({alert.time})</span>
            </div>
          ))}
        </div>
      </div>
    );
  };

  // Enterprise Header - Professional, Minimal
  const EnterpriseHeader = () => (
    <div className="bg-white border-b border-gray-200 shadow-sm">
      <div className="max-w-7xl mx-auto px-6 py-3">
        <div className="flex items-center justify-between">
          {/* Left Section - Brand */}
          <div className="flex items-center gap-3">
            <BrandLogo size={28} showSubtitle={true} />
            <div>
              <h1 className="text-lg font-bold text-gray-900">Depot Manager</h1>
              <p className="text-xs text-gray-600">Central Transport Hub</p>
            </div>
          </div>

          {/* Right Section - Actions & Status */}
          <div className="flex items-center gap-3">
            {/* Status Indicators */}
            <div className="hidden lg:flex items-center gap-3">
              <div className="flex items-center gap-2 px-2 py-1 bg-gray-50 rounded text-xs">
                <div className="w-1.5 h-1.5 rounded-full bg-green-500"></div>
                <span className="text-gray-600">System Online</span>
              </div>
              <div className="flex items-center gap-2 px-2 py-1 bg-gray-50 rounded text-xs">
                <Activity className="w-3 h-3 text-blue-500" />
                <span className="text-gray-600">45ms</span>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-2">
              <button className="px-3 py-1.5 bg-[#2196F3] text-white rounded text-xs font-medium hover:bg-blue-700 transition-colors">
                <Plus className="w-3 h-3 mr-1 inline" />
                New Route
              </button>
              <button className="px-3 py-1.5 bg-gray-100 text-gray-700 rounded text-xs font-medium hover:bg-gray-200 transition-colors">
                <Download className="w-3 h-3 mr-1 inline" />
                Export
              </button>
              <button className="p-1.5 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded transition-colors">
                <Bell className="w-3 h-3" />
              </button>
              <button className="p-1.5 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded transition-colors">
                <Settings className="w-3 h-3" />
              </button>
            </div>

            {/* Premium Logout Button */}
            <div className="border-l border-gray-200 pl-3 ml-3">
              <button 
                onClick={logout}
                className="px-4 py-2 bg-red-50 text-red-600 rounded-lg font-medium hover:bg-red-100 hover:text-red-700 transition-all duration-200 flex items-center gap-2 border border-red-200 hover:border-red-300"
              >
                <LogOut className="w-4 h-4" />
                Logout
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  // Professional Navigation Tabs - Compact, Enterprise
  const ProfessionalTabs = () => {
    const tabs = [
      { key: 'overview', label: 'Overview', icon: BarChart3 },
      { key: 'routes', label: 'Routes', icon: Route },
      { key: 'trips', label: 'Trips', icon: Clock },
      { key: 'crew', label: 'Crew', icon: Users },
      { key: 'bookings', label: 'Bookings', icon: FileTextIcon },
      { key: 'fleet', label: 'Fleet', icon: Bus },
      { key: 'fuel', label: 'Fuel', icon: Fuel },
      { key: 'live-map', label: 'Live Map', icon: MapPin },
      { key: 'analytics', label: 'Analytics', icon: BarChart3 },
      { key: 'alerts', label: 'Alerts', icon: AlertCircle }
    ];

    return (
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex gap-0 overflow-x-auto">
            {tabs.map(tab => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.key;
              return (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  className={`relative flex items-center gap-2 px-4 py-2.5 text-sm font-medium transition-all duration-200 whitespace-nowrap border-b-2 ${
                    isActive 
                      ? 'text-[#E91E63] border-[#E91E63] bg-[#E91E63]/5' 
                      : 'text-gray-600 border-transparent hover:text-gray-900 hover:bg-gray-50'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>
      </div>
    );
  };

  // Greeting Header - Professional, Informative
  const GreetingHeader = () => (
    <div className="bg-white border border-gray-200 rounded-lg p-4 mb-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-gray-900 mb-1">
            Welcome back, {user?.name || 'Rajesh Kumar'}
          </h2>
          <p className="text-sm text-gray-600">
            Managing operations at <span className="font-semibold text-[#E91E63]">{depotData?.name || 'Central Depot'}</span>
          </p>
          <p className="text-xs text-gray-500 mt-1">
            {new Date().toLocaleDateString('en-US', { 
              weekday: 'long', 
              year: 'numeric', 
              month: 'long', 
              day: 'numeric' 
            })}
          </p>
        </div>
        <div className="text-right">
          <div className="text-xs text-gray-500">Current Time</div>
          <div className="text-xl font-bold text-gray-900">
            {new Date().toLocaleTimeString('en-US', { 
              hour: '2-digit', 
              minute: '2-digit' 
            })}
          </div>
        </div>
      </div>
    </div>
  );

  // Enhanced Fuel Management Panel
  const FuelManagementPanel = () => (
    <div className="bg-white border border-gray-200 rounded-lg p-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-bold text-gray-900">Fuel Management</h3>
        <button className="text-[#E91E63] text-sm font-medium hover:text-pink-700">
          View Details →
        </button>
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div>
          <div className="text-xs text-gray-500 mb-1">Today's Usage</div>
          <div className="text-xl font-bold text-gray-900">{fuelData.todayUsage ? `${fuelData.todayUsage}L` : '0L'}</div>
          <div className="text-xs text-gray-500">{fuelData.todayCost ? `₹${fuelData.todayCost.toLocaleString()}` : '₹0'}</div>
        </div>
        <div>
          <div className="text-xs text-gray-500 mb-1">Stock Available</div>
          <div className="text-xl font-bold text-gray-900">{fuelData.stockAvailable ? `${fuelData.stockAvailable}L` : '0L'}</div>
          <div className="text-xs text-gray-500">{fuelData.nextRefuel ? `Next refuel: ${fuelData.nextRefuel}` : 'No data'}</div>
        </div>
        <div>
          <div className="text-xs text-gray-500 mb-1">Supplier</div>
          <div className="text-sm font-medium text-gray-900">{fuelData.supplier || 'Not specified'}</div>
          <div className="text-xs text-gray-500">{fuelData.contractDuration ? `Contract: ${fuelData.contractDuration}` : 'No contract'}</div>
        </div>
        <div>
          <div className="text-xs text-gray-500 mb-1">Cost Trend</div>
          <div className={`text-sm font-medium ${fuelData.costChange > 0 ? 'text-red-600' : 'text-green-600'}`}>
            {fuelData.costChange ? `${fuelData.costChange > 0 ? '↑' : '↓'} ${Math.abs(fuelData.costChange)}% this month` : 'No data'}
          </div>
          <div className="text-xs text-gray-500">{fuelData.averageCost ? `Avg: ₹${fuelData.averageCost}/L` : 'No data'}</div>
        </div>
      </div>
    </div>
  );

  // Enhanced Maintenance Status Panel
  const MaintenanceStatusPanel = () => (
    <div className="bg-white border border-gray-200 rounded-lg p-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-bold text-gray-900">Maintenance Status</h3>
        <button className="text-[#E91E63] text-sm font-medium hover:text-pink-700">
          View Details →
        </button>
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div>
          <div className="text-xs text-gray-500 mb-1">Buses in Service</div>
          <div className="text-xl font-bold text-green-600">{maintenanceData.busesInService || 0}</div>
          <div className="text-xs text-gray-500">
            {maintenanceData.availabilityRate ? `${maintenanceData.availabilityRate}% availability` : 'No data'}
          </div>
        </div>
        <div>
          <div className="text-xs text-gray-500 mb-1">Under Maintenance</div>
          <div className="text-xl font-bold text-amber-600">{maintenanceData.busesInMaintenance || 0}</div>
          <div className="text-xs text-gray-500">
            {maintenanceData.expectedReturn ? `Expected: ${maintenanceData.expectedReturn}` : 'No data'}
          </div>
        </div>
        <div>
          <div className="text-xs text-gray-500 mb-1">Downtime Cost</div>
          <div className="text-sm font-medium text-red-600">
            {maintenanceData.downtimeCost ? `₹${maintenanceData.downtimeCost.toLocaleString()}/day` : '₹0/day'}
          </div>
          <div className="text-xs text-gray-500">This month</div>
        </div>
        <div>
          <div className="text-xs text-gray-500 mb-1">Next Service</div>
          <div className="text-sm font-medium text-blue-600">
            {maintenanceData.nextServiceBus || 'None'}
          </div>
          <div className="text-xs text-gray-500">
            {maintenanceData.nextServiceDue ? `Due: ${maintenanceData.nextServiceDue}` : 'No data'}
          </div>
        </div>
      </div>
    </div>
    );

  // Quick Actions Toolbar - Professional, Compact
  const QuickActionsToolbar = () => (
    <div className="bg-white border border-gray-200 rounded-lg p-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-bold text-gray-900">Quick Actions</h3>
        <p className="text-sm text-gray-600">Common operations for {depotData?.name || 'Central Depot'}</p>
      </div>
      <div className="grid grid-cols-3 md:grid-cols-6 gap-3">
        <button onClick={() => setActiveTab('routes')} className="flex flex-col items-center gap-2 p-3 bg-gray-50 rounded border border-gray-200 hover:border-[#2196F3] hover:bg-blue-50 transition-all group">
          <div className="w-8 h-8 rounded bg-[#2196F3] text-white flex items-center justify-center">
            <Plus className="w-4 h-4" />
          </div>
          <span className="text-xs font-medium text-gray-700 text-center">Add Route</span>
        </button>
        <button onClick={() => setActiveTab('trips')} className="flex flex-col items-center gap-2 p-3 bg-gray-50 rounded border border-gray-200 hover:border-[#2196F3] hover:bg-blue-50 transition-all group">
          <div className="w-8 h-8 rounded bg-[#2196F3] text-white flex items-center justify-center">
            <Clock className="w-4 h-4" />
          </div>
          <span className="text-xs font-medium text-gray-700 text-center">Schedule Trip</span>
        </button>
        <button onClick={() => setActiveTab('bookings')} className="flex flex-col items-center gap-2 p-3 bg-gray-50 rounded border border-gray-200 hover:border-[#2196F3] hover:bg-blue-50 transition-all group">
          <div className="w-8 h-8 rounded bg-[#2196F3] text-white flex items-center justify-center">
            <FileTextIcon className="w-4 h-4" />
          </div>
          <span className="text-xs font-medium text-gray-700 text-center">New Booking</span>
        </button>
        <button onClick={() => setActiveTab('fuel')} className="flex flex-col items-center gap-2 p-3 bg-gray-50 rounded border border-gray-200 hover:border-[#2196F3] hover:bg-blue-50 transition-all group">
          <div className="w-8 h-8 rounded bg-[#2196F3] text-white flex items-center justify-center">
            <TrendingUp className="w-4 h-4" />
          </div>
          <span className="text-xs font-medium text-gray-700 text-center">Log Fuel</span>
        </button>
        <button onClick={handleExport} className="flex flex-col items-center gap-2 p-3 bg-gray-50 rounded border border-gray-200 hover:border-[#2196F3] hover:bg-blue-50 transition-all group">
          <div className="w-8 h-8 rounded bg-[#2196F3] text-white flex items-center justify-center">
            <Download className="w-4 h-4" />
          </div>
          <span className="text-xs font-medium text-gray-700 text-center">Export</span>
        </button>
        <button onClick={() => setActiveTab('analytics')} className="flex flex-col items-center gap-2 p-3 bg-gray-50 rounded border border-gray-200 hover:border-[#2196F3] hover:bg-blue-50 transition-all group">
          <div className="w-8 h-8 rounded bg-[#2196F3] text-white flex items-center justify-center">
            <BarChart3 className="w-4 h-4" />
          </div>
          <span className="text-xs font-medium text-gray-700 text-center">Analytics</span>
        </button>
      </div>
    </div>
  );

  // Sample data for demonstration
  const sampleAlerts = [
    {
      priority: 'critical',
      message: 'Fuel level critical - Bus #RK-001',
      details: 'Fuel below 10% threshold',
      time: '2 min ago'
    },
    {
      priority: 'warning',
      message: 'Maintenance due - Bus #RK-015',
      details: 'Scheduled maintenance overdue by 2 days',
      time: '15 min ago'
    },
    {
      priority: 'info',
      message: 'New route assignment',
      details: 'Route R-45 assigned to Driver Singh',
      time: '1 hour ago'
    }
  ];

  // Mock data for demonstration
  useEffect(() => {
    const mockDepotData = {
      id: 'DEP001',
      name: 'Central Transport Hub',
      code: 'CTH',
      location: 'Mumbai Central',
      address: '123 Transport Avenue, Mumbai, Maharashtra 400001',
      contact: '+91-22-1234-5678',
      email: 'cth@yatrik.com',
      manager: 'Rajesh Kumar',
      capacity: 150,
      operationalHours: '24/7',
      established: '2020',
      status: 'active'
    };

    const mockRoutes = [
      { id: 'R001', name: 'Mumbai-Pune Express', distance: '148 km', duration: '3h 30m', status: 'active', buses: 12 },
      { id: 'R002', name: 'Mumbai-Nashik Highway', distance: '180 km', duration: '4h 15m', status: 'active', buses: 8 },
      { id: 'R003', name: 'Mumbai-Aurangabad', distance: '330 km', duration: '7h 45m', status: 'maintenance', buses: 6 },
      { id: 'R004', name: 'Mumbai-Goa Coastal', distance: '590 km', duration: '12h 30m', status: 'active', buses: 15 }
    ];

    const mockTrips = [
      { id: 'T001', route: 'Mumbai-Pune Express', bus: 'MH-12-AB-1234', driver: 'Amit Singh', conductor: 'Priya Patel', departure: '06:00', status: 'in-progress' },
      { id: 'T002', route: 'Mumbai-Nashik Highway', bus: 'MH-12-CD-5678', driver: 'Vikram Mehta', conductor: 'Rahul Sharma', departure: '07:30', status: 'scheduled' },
      { id: 'T003', route: 'Mumbai-Aurangabad', bus: 'MH-12-EF-9012', driver: 'Sanjay Verma', conductor: 'Meera Iyer', departure: '08:00', status: 'completed' }
    ];

    const mockBookings = [
      { id: 'B001', passenger: 'Arun Desai', route: 'Mumbai-Pune Express', seat: 'A12', fare: '₹450', status: 'confirmed' },
      { id: 'B002', passenger: 'Sunita Reddy', route: 'Mumbai-Nashik Highway', seat: 'B08', fare: '₹380', status: 'confirmed' },
      { id: 'B003', passenger: 'Mohan Joshi', route: 'Mumbai-Goa Coastal', seat: 'C15', fare: '₹1200', status: 'pending' }
    ];

    setDepotData(mockDepotData);
    setRoutesData(mockRoutes);
    setTripsData(mockTrips);
    setBookingsData(mockBookings);
    setLoading(false);
  }, []);

  const getStatusBadge = (status) => {
    const statusConfig = {
      active: { class: 'success', icon: CheckCircle },
      completed: { class: 'success', icon: CheckCircle },
      confirmed: { class: 'success', icon: CheckCircle },
      'in-progress': { class: 'info', icon: Activity },
      scheduled: { class: 'warning', icon: Clock },
      maintenance: { class: 'warning', icon: AlertCircle },
      pending: { class: 'warning', icon: Clock },
      cancelled: { class: 'danger', icon: XCircle }
    };

    const config = statusConfig[status] || { class: 'info', icon: AlertCircle };
    const IconComponent = config.icon;

    return (
      <span className={`erp-status-badge ${config.class}`}>
        <IconComponent className="h-3 w-3" />
        {status.replace('-', ' ')}
      </span>
    );
  };

  const filteredData = useMemo(() => {
    let filtered = [];
    
    switch (activeTab) {
      case 'routes':
        filtered = routesData.filter(route => 
          route.name.toLowerCase().includes(searchTerm.toLowerCase()) &&
          (filterStatus === 'all' || route.status === filterStatus)
        );
        break;
      case 'trips':
        filtered = tripsData.filter(trip => 
          trip.route.toLowerCase().includes(searchTerm.toLowerCase()) &&
          (filterStatus === 'all' || trip.status === filterStatus)
        );
        break;
      case 'bookings':
        filtered = bookingsData.filter(booking => 
          booking.passenger.toLowerCase().includes(searchTerm.toLowerCase()) &&
          (filterStatus === 'all' || booking.status === filterStatus)
        );
        break;
      default:
        filtered = [];
    }
    
    return filtered;
  }, [activeTab, searchTerm, filterStatus, routesData, tripsData, bookingsData]);

  const handleExport = () => {
    // Export functionality
    console.log('Exporting data...');
  };

  const handleRefresh = () => {
    setLoading(true);
    setTimeout(() => setLoading(false), 1000);
  };

  if (loading) {
    return (
      <div className="erp-container">
        <div className="erp-loading">
          <div className="erp-loading-spinner"></div>
          <span style={{ marginLeft: '1rem' }}>Loading Enterprise Dashboard...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="erp-container">
      {/* Enterprise Header */}
      <EnterpriseHeader />

      {/* Professional Navigation Tabs */}
      <ProfessionalTabs />

      {/* Premium Main Content */}
      <main className="erp-main">
        {activeTab === 'overview' && (
          <>
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#E91E63] mx-auto mb-4"></div>
                  <p className="text-gray-600">Loading depot data...</p>
                </div>
              </div>
            ) : (
              <>
                {/* Greeting Header */}
                <GreetingHeader />
            {/* Strategic KPIs - Top Row */}
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 mb-6">
              <StrategicKpiCard 
                icon={DollarSign} 
                label="Revenue (Today)" 
                value={kpiData.todayRevenue ? `₹${(kpiData.todayRevenue / 100000).toFixed(1)}L` : '₹0'} 
                delta={kpiData.revenueChange ? `${kpiData.revenueChange > 0 ? '↑' : '↓'} ${Math.abs(kpiData.revenueChange)}% vs last month` : 'No data'} 
                trendColor="#E91E63" 
                onClick={() => setActiveTab('analytics')} 
                priority="primary"
              />
              <StrategicKpiCard 
                icon={Users} 
                label="Occupancy Rate" 
                value={kpiData.occupancyRate ? `${kpiData.occupancyRate}%` : '0%'} 
                delta={kpiData.occupancyChange ? `${kpiData.occupancyChange > 0 ? '↑' : '↓'} ${Math.abs(kpiData.occupancyChange)}% WoW` : 'No data'} 
                trendColor="#2196F3" 
                onClick={() => setActiveTab('analytics')} 
                priority="secondary"
              />
              <StrategicKpiCard 
                icon={Clock} 
                label="Active Trips" 
                value={tripsData.filter(t => t.status === 'in-progress' || t.status === 'scheduled').length || 0} 
                delta="Live tracking" 
                trendColor="#2ECC71" 
                onClick={() => setActiveTab('trips')} 
                priority="secondary"
              />
              <StrategicKpiCard 
                icon={Ticket} 
                label="Ticket Sales" 
                value={kpiData.todayTickets ? `₹${(kpiData.todayTickets / 1000).toFixed(1)}K` : '₹0'} 
                delta={kpiData.ticketChange ? `${kpiData.ticketChange > 0 ? '↑' : '↓'} ${Math.abs(kpiData.ticketChange)}% today` : 'No data'} 
                trendColor="#FF9800" 
                onClick={() => setActiveTab('bookings')} 
                priority="secondary"
              />
            </div>

            {/* Operational KPIs - Second Row */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              <OperationalKpiCard 
                icon={Bus} 
                label="Total Buses" 
                value={kpiData.totalBuses || 0} 
                status={maintenanceData.busesInMaintenance > 0 ? 'warning' : 'success'}
                onClick={() => setActiveTab('fleet')} 
                trend={maintenanceData.busesInMaintenance ? `${maintenanceData.busesInMaintenance} in maintenance` : 'All operational'}
                drillDown={true}
              />
              <OperationalKpiCard 
                icon={Route} 
                label="Active Routes" 
                value={routesData.filter(r => r.status === 'active').length || 0} 
                status="success"
                onClick={() => setActiveTab('routes')} 
                trend={`${routesData.length} total routes`}
                drillDown={true}
              />
              <OperationalKpiCard 
                icon={Users} 
                label="Staff on Duty" 
                value={kpiData.staffOnDuty || 0} 
                status="success"
                onClick={() => setActiveTab('crew')} 
                trend={`${kpiData.totalStaff || 0} total staff`}
                drillDown={true}
              />
              <OperationalKpiCard 
                icon={TrendingUp} 
                label="On-Time %" 
                value={kpiData.onTimeRate ? `${kpiData.onTimeRate}%` : '0%'} 
                status={kpiData.onTimeRate >= 90 ? 'success' : kpiData.onTimeRate >= 80 ? 'warning' : 'critical'}
                onClick={() => setActiveTab('analytics')} 
                trend={kpiData.onTimeChange ? `${kpiData.onTimeChange > 0 ? '+' : ''}${kpiData.onTimeChange}% vs yesterday` : 'No data'}
                drillDown={true}
              />
            </div>



            {/* Depot Overview Section */}
            <div className="bg-white border border-gray-200 rounded-lg p-4 mb-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-gray-900">Depot Overview</h3>
                <button className="text-[#E91E63] text-sm font-medium hover:text-pink-700">
                  View Details →
                </button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div>
                  <div className="text-xs text-gray-500 uppercase tracking-wider font-semibold mb-1">Location</div>
                  <div className="text-sm font-medium text-gray-900">{depotData?.location || 'Central Business District'}</div>
                </div>
                <div>
                  <div className="text-xs text-gray-500 uppercase tracking-wider font-semibold mb-1">Capacity</div>
                  <div className="text-sm font-medium text-gray-900">{depotData?.capacity || '50'} buses</div>
                </div>
                <div>
                  <div className="text-xs text-gray-500 uppercase tracking-wider font-semibold mb-1">Operational Hours</div>
                  <div className="text-sm font-medium text-gray-900">{depotData?.operationalHours || '24/7'}</div>
                </div>
                <div>
                  <div className="text-xs text-gray-500 uppercase tracking-wider font-semibold mb-1">Status</div>
                  <div className="inline-flex items-center gap-2 px-2 py-1 rounded-full bg-green-100 text-green-800 text-xs font-semibold">
                    <div className="w-1.5 h-1.5 rounded-full bg-green-500"></div>
                    {depotData?.status || 'Active'}
                  </div>
                </div>
              </div>
            </div>

            {/* Enhanced Fuel & Maintenance Panels */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
              <FuelManagementPanel />
              <MaintenanceStatusPanel />
            </div>
            
            {/* Quick Actions Toolbar - Bottom */}
            <QuickActionsToolbar />
              </>
            )}
          </>
        )}

        {activeTab === 'routes' && (
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            {/* Header Section */}
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-2xl font-bold text-gray-900 mb-1">Route Management</h2>
                <p className="text-gray-600">Manage and monitor all transport routes</p>
              </div>
              <div className="flex items-center gap-3">
                <button className="px-4 py-2 bg-[#2196F3] text-white rounded-lg font-medium hover:bg-blue-700 transition-colors flex items-center gap-2">
                  <Plus className="h-4 w-4" />
                  Add Route
                </button>
                <button className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg font-medium hover:bg-gray-200 transition-colors flex items-center gap-2" onClick={handleExport}>
                  <Download className="h-4 w-4" />
                  Export
                </button>
              </div>
            </div>
            
            {/* Search and Filter Bar */}
            <div className="bg-gray-50 rounded-lg p-4 mb-6">
              <div className="flex flex-col md:flex-row gap-4 items-center">
                <div className="relative flex-1">
                  <Search className="h-4 w-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search routes by name, ID, or destination..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#2196F3] focus:border-transparent transition-all"
                  />
                </div>
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#2196F3] focus:border-transparent transition-all"
                >
                  <option value="all">All Status</option>
                  <option value="active">Active</option>
                  <option value="maintenance">Maintenance</option>
                  <option value="inactive">Inactive</option>
                </select>
                <button className="px-4 py-2.5 bg-gray-100 text-gray-700 rounded-lg font-medium hover:bg-gray-200 transition-colors flex items-center gap-2" onClick={handleRefresh}>
                  <RefreshCw className="h-4 w-4" />
                  Refresh
                </button>
              </div>
            </div>

            {/* Routes Content */}
            <div className="bg-white border border-gray-200 rounded-lg">
              <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-gray-900">Routes ({filteredData.length})</h3>
                  <div className="flex items-center gap-2">
                    <button 
                      className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                        viewMode === 'grid' 
                          ? 'bg-[#2196F3] text-white' 
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }`}
                      onClick={() => setViewMode('grid')}
                    >
                      <Grid className="h-4 w-4 inline mr-1" />
                      Grid
                    </button>
                    <button 
                      className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                        viewMode === 'table' 
                          ? 'bg-[#2196F3] text-white' 
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }`}
                      onClick={() => setViewMode('table')}
                    >
                      <List className="h-4 w-4 inline mr-1" />
                      Table
                    </button>
                  </div>
                </div>
              </div>
              
              <div className="p-6">
                {viewMode === 'table' ? (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-gray-200">
                          <th className="text-left py-3 px-4 font-semibold text-gray-900">Route ID</th>
                          <th className="text-left py-3 px-4 font-semibold text-gray-900">Name</th>
                          <th className="text-left py-3 px-4 font-semibold text-gray-900">Distance</th>
                          <th className="text-left py-3 px-4 font-semibold text-gray-900">Duration</th>
                          <th className="text-left py-3 px-4 font-semibold text-gray-900">Buses</th>
                          <th className="text-left py-3 px-4 font-semibold text-gray-900">Status</th>
                          <th className="text-left py-3 px-4 font-semibold text-gray-900">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredData.map((route) => (
                          <tr key={route.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                            <td className="py-3 px-4 text-gray-900 font-medium">{route.id}</td>
                            <td className="py-3 px-4 text-gray-900">{route.name}</td>
                            <td className="py-3 px-4 text-gray-600">{route.distance}</td>
                            <td className="py-3 px-4 text-gray-600">{route.duration}</td>
                            <td className="py-3 px-4 text-gray-600">{route.buses}</td>
                            <td className="py-3 px-4">
                              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                route.status === 'active' ? 'bg-green-100 text-green-800' :
                                route.status === 'maintenance' ? 'bg-amber-100 text-amber-800' :
                                'bg-gray-100 text-gray-800'
                              }`}>
                                {route.status}
                              </span>
                            </td>
                            <td className="py-3 px-4">
                              <div className="flex items-center gap-2">
                                <button className="p-1.5 text-gray-400 hover:text-[#2196F3] hover:bg-blue-50 rounded transition-colors">
                                  <Eye className="h-4 w-4" />
                                </button>
                                <button className="p-1.5 text-gray-400 hover:text-amber-600 hover:bg-blue-50 rounded transition-colors">
                                  <Edit className="h-4 w-4" />
                                </button>
                                <button className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors">
                                  <Trash2 className="h-4 w-4" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {filteredData.map((route) => (
                      <div key={route.id} className="border border-gray-200 rounded-lg p-4 hover:border-gray-300 hover:shadow-sm transition-all">
                        <div className="flex items-center justify-between mb-3">
                          <h4 className="text-lg font-semibold text-gray-900">{route.name}</h4>
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            route.status === 'active' ? 'bg-green-100 text-green-800' :
                            route.status === 'maintenance' ? 'bg-amber-100 text-amber-800' :
                            'bg-gray-100 text-gray-800'
                          }`}>
                            {route.status}
                          </span>
                        </div>
                        <div className="space-y-2 mb-4">
                          <div className="flex justify-between">
                            <span className="text-gray-600">Route ID:</span>
                            <span className="text-gray-900 font-medium">{route.id}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">Distance:</span>
                            <span className="text-gray-900">{route.distance}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">Duration:</span>
                            <span className="text-gray-900">{route.duration}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">Buses:</span>
                            <span className="text-gray-900">{route.buses}</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 pt-3 border-t border-gray-100">
                          <button className="flex-1 py-2 px-3 text-[#2196F3] hover:bg-blue-50 rounded-md text-sm font-medium transition-colors flex items-center justify-center gap-1">
                            <Eye className="h-4 w-4" />
                            View
                          </button>
                          <button className="flex-1 py-2 px-3 text-amber-600 hover:bg-amber-50 rounded-md text-sm font-medium transition-colors flex items-center justify-center gap-1">
                            <Edit className="h-4 w-4" />
                            Edit
                          </button>
                          <button className="flex-1 py-2 px-3 text-red-600 hover:bg-red-50 rounded-md text-sm font-medium transition-colors flex items-center gap-1">
                            <Trash2 className="h-4 w-4" />
                            Delete
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'trips' && (
          <div className="erp-tab-content">
            <div className="erp-tab-header">
              <h2>Trip Management</h2>
              <div style={{ display: 'flex', gap: '1rem' }}>
                <button className="erp-btn-primary">
                  <Plus className="h-4 w-4" />
                  Schedule Trip
                </button>
                <button className="erp-btn-primary" onClick={handleExport}>
                  <Download className="h-4 w-4" />
                  Export
                </button>
              </div>
            </div>
            
            <div className="erp-card-body">
              {/* Search and Filter Bar */}
              <div style={{ display: 'flex', gap: '1rem', marginBottom: '2rem', alignItems: 'center' }}>
                <div style={{ position: 'relative', flex: 1 }}>
                  <Search className="h-4 w-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search trips..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '0.75rem 1rem 0.75rem 2.5rem',
                      border: '1px solid rgba(226, 232, 240, 0.8)',
                      borderRadius: '12px',
                      fontSize: '0.875rem'
                    }}
                  />
                </div>
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  style={{
                    padding: '0.75rem 1rem',
                    border: '1px solid rgba(226, 232, 240, 0.8)',
                    borderRadius: '12px',
                    fontSize: '0.875rem'
                  }}
                >
                  <option value="all">All Status</option>
                  <option value="scheduled">Scheduled</option>
                  <option value="in-progress">In Progress</option>
                  <option value="completed">Completed</option>
                  <option value="cancelled">Cancelled</option>
                </select>
                <button className="erp-btn-primary" onClick={handleRefresh}>
                  <RefreshCw className="h-4 w-4" />
                </button>
              </div>

              {/* Trips Table */}
              <div className="erp-card">
                <div className="erp-card-header">
                  <h3>Trips ({filteredData.length})</h3>
                </div>
                <div className="erp-card-body">
                  <table className="erp-data-table">
                    <thead>
                      <tr>
                        <th>Trip ID</th>
                        <th>Route</th>
                        <th>Bus</th>
                        <th>Driver</th>
                        <th>Conductor</th>
                        <th>Departure</th>
                        <th>Status</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredData.map((trip) => (
                        <tr key={trip.id}>
                          <td>{trip.id}</td>
                          <td>{trip.route}</td>
                          <td>{trip.bus}</td>
                          <td>{trip.driver}</td>
                          <td>{trip.conductor}</td>
                          <td>{trip.departure}</td>
                          <td>{getStatusBadge(trip.status)}</td>
                          <td>
                            <div style={{ display: 'flex', gap: '0.5rem' }}>
                              <button className="erp-btn-primary" style={{ padding: '0.5rem' }}>
                                <Eye className="h-4 w-4" />
                              </button>
                              <button className="erp-btn-primary" style={{ padding: '0.5rem' }}>
                                <Edit className="h-4 w-4" />
                              </button>
                              <button className="erp-btn-primary" style={{ padding: '0.5rem' }}>
                                <Trash2 className="h-4 w-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'bookings' && (
          <div className="erp-tab-content">
            <div className="erp-tab-header">
              <h2>Booking Management</h2>
              <div style={{ display: 'flex', gap: '1rem' }}>
                <button className="erp-btn-primary">
                  <Plus className="h-4 w-4" />
                  New Booking
                </button>
                <button className="erp-btn-primary" onClick={handleExport}>
                  <Download className="h-4 w-4" />
                  Export
                </button>
              </div>
            </div>
            
            <div className="erp-card-body">
              {/* Search and Filter Bar */}
              <div style={{ display: 'flex', gap: '1rem', marginBottom: '2rem', alignItems: 'center' }}>
                <div style={{ position: 'relative', flex: 1 }}>
                  <Search className="h-4 w-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search bookings..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '0.75rem 1rem 0.75rem 2.5rem',
                      border: '1px solid rgba(226, 232, 240, 0.8)',
                      borderRadius: '12px',
                      fontSize: '0.875rem'
                    }}
                  />
                </div>
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  style={{
                    padding: '0.75rem 1rem',
                    border: '1px solid rgba(226, 232, 240, 0.8)',
                    borderRadius: '12px',
                    fontSize: '0.875rem'
                  }}
                >
                  <option value="all">All Status</option>
                  <option value="confirmed">Confirmed</option>
                  <option value="pending">Pending</option>
                  <option value="cancelled">Cancelled</option>
                </select>
                <button className="erp-btn-primary" onClick={handleRefresh}>
                  <RefreshCw className="h-4 w-4" />
                </button>
              </div>

              {/* Bookings Table */}
              <div className="erp-card">
                <div className="erp-card-header">
                  <h3>Bookings ({filteredData.length})</h3>
                </div>
                <div className="erp-card-body">
                  <table className="erp-data-table">
                    <thead>
                      <tr>
                        <th>Booking ID</th>
                        <th>Passenger</th>
                        <th>Route</th>
                        <th>Seat</th>
                        <th>Fare</th>
                        <th>Status</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredData.map((booking) => (
                        <tr key={booking.id}>
                          <td>{booking.id}</td>
                          <td>{booking.passenger}</td>
                          <td>{booking.route}</td>
                          <td>{booking.seat}</td>
                          <td>{booking.fare}</td>
                          <td>{getStatusBadge(booking.status)}</td>
                          <td>
                            <div style={{ display: 'flex', gap: '0.5rem' }}>
                              <button className="erp-btn-primary" style={{ padding: '0.5rem' }}>
                                <Eye className="h-4 w-4" />
                              </button>
                              <button className="erp-btn-primary" style={{ padding: '0.5rem' }}>
                                <Edit className="h-4 w-4" />
                              </button>
                              <button className="erp-btn-primary" style={{ padding: '0.5rem' }}>
                                <Trash2 className="h-4 w-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'live-map' && (
          <div className="erp-tab-content">
            <div className="erp-tab-header">
              <h2>Live GPS Monitoring</h2>
              <div style={{ display: 'flex', gap: '1rem' }}>
                <button className="erp-btn-primary" onClick={handleRefresh}>
                  <RefreshCw className="h-4 w-4" />
                  Refresh
                </button>
                <button className="erp-btn-primary">
                  <Settings className="h-4 w-4" />
                  Settings
                </button>
              </div>
            </div>
            <div className="erp-card-body">
              <LiveGPSMap />
            </div>
          </div>
        )}

        {activeTab === 'analytics' && (
          <div className="erp-tab-content">
            <div className="erp-tab-header">
              <h2>Advanced Analytics</h2>
              <div style={{ display: 'flex', gap: '1rem' }}>
                <button className="erp-btn-primary" onClick={handleExport}>
                  <Download className="h-4 w-4" />
                  Export Data
                </button>
                <button className="erp-btn-primary">
                  <Settings className="h-4 w-4" />
                  Chart Settings
                </button>
              </div>
            </div>
            <div className="erp-card-body">
              <AdvancedCharts 
                routesData={routesData}
                tripsData={tripsData}
                bookingsData={bookingsData}
              />
            </div>
          </div>
        )}

        {activeTab === 'quick-actions' && (
          <div className="erp-tab-content">
            <div className="erp-tab-header">
              <h2>Quick Actions Panel</h2>
            </div>
            <div className="erp-card-body">
              <QuickActions />
            </div>
          </div>
        )}

        {activeTab === 'notifications' && (
          <div className="erp-tab-content">
            <div className="erp-tab-header">
              <h2>Smart Notifications</h2>
            </div>
            <div className="erp-card-body">
              <SmartNotifications />
            </div>
          </div>
        )}

        {activeTab === 'trip-management' && (
          <div className="erp-tab-content">
            <div className="erp-tab-header">
              <h2>Trip Management System</h2>
            </div>
            <div className="erp-card-body">
              <TripManagement />
            </div>
          </div>
        )}

        {activeTab === 'attendance' && (
          <div className="erp-tab-content">
            <div className="erp-tab-header">
              <h2>Attendance Dashboard</h2>
            </div>
            <div className="erp-card-body">
              <AttendanceDashboard />
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default DepotDashboard;
