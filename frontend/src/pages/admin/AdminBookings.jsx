import React, { useState, useEffect } from 'react';
import { 
  Search, 
  Filter, 
  Eye, 
  Download, 
  RefreshCw, 
  Calendar,
  User,
  MapPin,
  Clock,
  DollarSign,
  CheckCircle,
  XCircle,
  AlertCircle,
  MoreVertical,
  ChevronDown,
  ChevronUp,
  X,
  Check,
  Grid3X3,
  List,
  Plus,
  Edit,
  Trash2,
  Save,
  Phone,
  Mail,
  CreditCard,
  UserCheck,
  Bus,
  Route
} from 'lucide-react';
import { apiFetch } from '../../utils/api';
import { toast } from 'react-hot-toast';

const AdminBookings = () => {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterDate, setFilterDate] = useState('');
  const [sortField, setSortField] = useState('createdAt');
  const [sortDirection, setSortDirection] = useState('desc');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(20);
  const [selectedBookings, setSelectedBookings] = useState([]);
  const [viewMode, setViewMode] = useState('table');
  const [showFilters, setShowFilters] = useState(false);
  const [stats, setStats] = useState({
    totalBookings: 0,
    confirmedBookings: 0,
    pendingBookings: 0,
    cancelledBookings: 0,
    totalRevenue: 0
  });

  // CRUD operation states
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [editingBooking, setEditingBooking] = useState(null);
  const [viewingBooking, setViewingBooking] = useState(null);
  const [deleteBookingId, setDeleteBookingId] = useState(null);
  
  // Form states
  const [bookingForm, setBookingForm] = useState({
    tripId: '',
    routeId: '',
    busId: '',
    depotId: '',
    customer: {
      name: '',
      email: '',
      phone: '',
      age: '',
      gender: '',
      idProof: { type: '', number: '' }
    },
    journey: {
      from: '',
      to: '',
      departureDate: '',
      departureTime: '',
      arrivalDate: '',
      arrivalTime: '',
      duration: 0
    },
    seats: [{ seatNumber: '', seatType: 'seater', price: 0 }],
    pricing: {
      baseFare: 0,
      seatFare: 0,
      taxes: { gst: 0, serviceTax: 0, other: 0 },
      discounts: { earlyBird: 0, loyalty: 0, promo: 0, other: 0 },
      totalAmount: 0,
      paidAmount: 0
    },
    payment: {
      method: 'cash',
      paymentStatus: 'pending'
    },
    specialRequests: {
      wheelchair: false,
      meal: false,
      blanket: false,
      pillow: false,
      other: ''
    }
  });

  // Reference data for forms
  const [trips, setTrips] = useState([]);
  const [routes, setRoutes] = useState([]);
  const [buses, setBuses] = useState([]);
  const [depots, setDepots] = useState([]);

  const statusOptions = [
    { value: 'all', label: 'All Status' },
    { value: 'pending', label: 'Pending' },
    { value: 'confirmed', label: 'Confirmed' },
    { value: 'cancelled', label: 'Cancelled' },
    { value: 'completed', label: 'Completed' },
    { value: 'no_show', label: 'No Show' },
    { value: 'refunded', label: 'Refunded' }
  ];

  const fetchBookings = async () => {
    try {
      setLoading(true);
      const queryParams = new URLSearchParams({
        page: currentPage,
        limit: itemsPerPage,
        ...(searchTerm && { search: searchTerm }),
        ...(filterStatus !== 'all' && { status: filterStatus }),
        ...(filterDate && { date: filterDate }),
        sortBy: sortField,
        sortOrder: sortDirection
      });

      const response = await apiFetch(`/api/admin/bookings?${queryParams}`);
      
      if (response.ok) {
        let bookingsData = response.data?.data?.bookings || response.data?.bookings || response.data || [];
        const statsData = response.data?.data?.stats || response.data?.stats || {};
        
        // Ensure bookingsData is an array
        if (!Array.isArray(bookingsData)) {
          console.error('Bookings data is not an array:', bookingsData);
          bookingsData = [];
        }
        
        setBookings(bookingsData);
        setStats(statsData);
      } else {
        console.error('Failed to fetch bookings:', response.message);
        setBookings([]);
      }
    } catch (error) {
      console.error('Error fetching bookings:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBookings();
    fetchReferenceData();
  }, [currentPage, itemsPerPage, searchTerm, filterStatus, filterDate, sortField, sortDirection]);

  // Fetch reference data for forms
  const fetchReferenceData = async () => {
    try {
      const [tripsRes, routesRes, busesRes, depotsRes] = await Promise.all([
        apiFetch('/api/admin/trips?limit=100'),
        apiFetch('/api/admin/routes?limit=100'),
        apiFetch('/api/admin/buses?limit=100'),
        apiFetch('/api/admin/depots?limit=100')
      ]);

      if (tripsRes?.ok) setTrips(tripsRes.data?.trips || tripsRes.data || []);
      if (routesRes?.ok) setRoutes(routesRes.data?.routes || routesRes.data || []);
      if (busesRes?.ok) setBuses(busesRes.data?.buses || busesRes.data || []);
      if (depotsRes?.ok) setDepots(depotsRes.data?.depots || depotsRes.data || []);
    } catch (error) {
      console.error('Error fetching reference data:', error);
    }
  };

  const handleStatusChange = async (bookingId, newStatus) => {
    try {
      const response = await apiFetch(`/api/admin/bookings/${bookingId}/status`, {
        method: 'PUT',
        body: JSON.stringify({ status: newStatus })
      });

      if (response.ok) {
        setBookings(prev => 
          prev.map(booking => 
            booking._id === bookingId 
              ? { ...booking, status: newStatus }
              : booking
          )
        );
        toast.success('Booking status updated successfully');
      } else {
        toast.error('Failed to update booking status');
      }
    } catch (error) {
      console.error('Error updating booking status:', error);
      toast.error('Failed to update booking status');
    }
  };

  // CREATE booking
  const handleCreateBooking = async () => {
    try {
      const response = await apiFetch('/api/admin/bookings', {
        method: 'POST',
        body: JSON.stringify(bookingForm)
      });

      if (response.ok) {
        toast.success('Booking created successfully');
        setShowCreateModal(false);
        resetForm();
        fetchBookings();
      } else {
        toast.error(response.message || 'Failed to create booking');
      }
    } catch (error) {
      console.error('Error creating booking:', error);
      toast.error('Failed to create booking');
    }
  };

  // READ booking details
  const handleViewBooking = async (bookingId) => {
    try {
      const response = await apiFetch(`/api/admin/bookings/${bookingId}`);
      if (response.ok) {
        setViewingBooking(response.data);
        setShowViewModal(true);
      } else {
        toast.error('Failed to fetch booking details');
      }
    } catch (error) {
      console.error('Error fetching booking:', error);
      toast.error('Failed to fetch booking details');
    }
  };

  // UPDATE booking
  const handleEditBooking = async () => {
    try {
      const response = await apiFetch(`/api/admin/bookings/${editingBooking._id}`, {
        method: 'PUT',
        body: JSON.stringify(bookingForm)
      });

      if (response.ok) {
        toast.success('Booking updated successfully');
        setShowEditModal(false);
        setEditingBooking(null);
        resetForm();
        fetchBookings();
      } else {
        toast.error(response.message || 'Failed to update booking');
      }
    } catch (error) {
      console.error('Error updating booking:', error);
      toast.error('Failed to update booking');
    }
  };

  // DELETE booking
  const handleDeleteBooking = async (force = false) => {
    try {
      const url = force 
        ? `/api/admin/bookings/${deleteBookingId}?force=true`
        : `/api/admin/bookings/${deleteBookingId}`;
      
      const response = await apiFetch(url, {
        method: 'DELETE'
      });

      if (response.ok) {
        toast.success('Booking deleted successfully');
        setShowDeleteModal(false);
        setDeleteBookingId(null);
        fetchBookings();
      } else {
        toast.error(response.message || 'Failed to delete booking');
      }
    } catch (error) {
      console.error('Error deleting booking:', error);
      toast.error('Failed to delete booking');
    }
  };

  // Form handlers
  const resetForm = () => {
    setBookingForm({
      tripId: '',
      routeId: '',
      busId: '',
      depotId: '',
      customer: {
        name: '',
        email: '',
        phone: '',
        age: '',
        gender: '',
        idProof: { type: '', number: '' }
      },
      journey: {
        from: '',
        to: '',
        departureDate: '',
        departureTime: '',
        arrivalDate: '',
        arrivalTime: '',
        duration: 0
      },
      seats: [{ seatNumber: '', seatType: 'seater', price: 0 }],
      pricing: {
        baseFare: 0,
        seatFare: 0,
        taxes: { gst: 0, serviceTax: 0, other: 0 },
        discounts: { earlyBird: 0, loyalty: 0, promo: 0, other: 0 },
        totalAmount: 0,
        paidAmount: 0
      },
      payment: {
        method: 'cash',
        paymentStatus: 'pending'
      },
      specialRequests: {
        wheelchair: false,
        meal: false,
        blanket: false,
        pillow: false,
        other: ''
      }
    });
  };

  const openCreateModal = () => {
    resetForm();
    setShowCreateModal(true);
  };

  const openEditModal = (booking) => {
    setEditingBooking(booking);
    setBookingForm({
      tripId: booking.tripId?._id || booking.tripId || '',
      routeId: booking.routeId?._id || booking.routeId || '',
      busId: booking.busId?._id || booking.busId || '',
      depotId: booking.depotId?._id || booking.depotId || '',
      customer: {
        name: booking.customer?.name || '',
        email: booking.customer?.email || '',
        phone: booking.customer?.phone || '',
        age: booking.customer?.age || '',
        gender: booking.customer?.gender || '',
        idProof: booking.customer?.idProof || { type: '', number: '' }
      },
      journey: booking.journey || {},
      seats: booking.seats || [{ seatNumber: '', seatType: 'seater', price: 0 }],
      pricing: booking.pricing || {},
      payment: booking.payment || { method: 'cash', paymentStatus: 'pending' },
      specialRequests: booking.specialRequests || {}
    });
    setShowEditModal(true);
  };

  const openDeleteModal = (bookingId) => {
    setDeleteBookingId(bookingId);
    setShowDeleteModal(true);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'confirmed': return 'green';
      case 'pending': return 'yellow';
      case 'cancelled': return 'red';
      case 'completed': return 'blue';
      default: return 'gray';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'confirmed': return <CheckCircle className="w-4 h-4" />;
      case 'pending': return <Clock className="w-4 h-4" />;
      case 'cancelled': return <XCircle className="w-4 h-4" />;
      case 'completed': return <CheckCircle className="w-4 h-4" />;
      default: return <AlertCircle className="w-4 h-4" />;
    }
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  const formatTime = (date) => {
    return new Date(date).toLocaleTimeString('en-IN', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR'
    }).format(amount);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-2">Loading bookings...</span>
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-6 flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Booking Management</h1>
          <p className="text-gray-600">Manage all passenger bookings and reservations</p>
        </div>
        <button
          onClick={openCreateModal}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Create Booking
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Calendar className="w-6 h-6 text-blue-600" />
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-600">Total Bookings</p>
              <p className="text-2xl font-bold text-gray-900">{stats.totalBookings}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg shadow">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 rounded-lg">
              <CheckCircle className="w-6 h-6 text-green-600" />
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-600">Confirmed</p>
              <p className="text-2xl font-bold text-gray-900">{stats.confirmedBookings}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg shadow">
          <div className="flex items-center">
            <div className="p-2 bg-yellow-100 rounded-lg">
              <Clock className="w-6 h-6 text-yellow-600" />
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-600">Pending</p>
              <p className="text-2xl font-bold text-gray-900">{stats.pendingBookings}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg shadow">
          <div className="flex items-center">
            <div className="p-2 bg-red-100 rounded-lg">
              <XCircle className="w-6 h-6 text-red-600" />
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-600">Cancelled</p>
              <p className="text-2xl font-bold text-gray-900">{stats.cancelledBookings}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg shadow">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 rounded-lg">
              <DollarSign className="w-6 h-6 text-green-600" />
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-600">Total Revenue</p>
              <p className="text-2xl font-bold text-gray-900">{formatCurrency(stats.totalRevenue)}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="bg-white p-4 rounded-lg shadow mb-6">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Search by Booking ID, Reference, passenger name, phone, email..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>

          <div className="flex gap-2">
            <select
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
            >
              {statusOptions.map(option => (
                <option key={option.value} value={option.value}>{option.label}</option>
              ))}
            </select>

            <input
              type="date"
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              value={filterDate}
              onChange={(e) => setFilterDate(e.target.value)}
            />

            <button
              onClick={fetchBookings}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
            >
              <RefreshCw className="w-4 h-4" />
              Refresh
            </button>
          </div>
        </div>
      </div>

      {/* Bookings Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Booking ID
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Passenger
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Trip Details
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Booking Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Amount
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {Array.isArray(bookings) && bookings.map((booking) => (
                <tr key={booking._id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{booking.bookingId}</div>
                    <div className="text-sm text-gray-500">{booking.bookingReference}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{booking.customer?.name}</div>
                    <div className="text-sm text-gray-500">{booking.customer?.phone}</div>
                    <div className="text-sm text-gray-500">{booking.customer?.email}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {booking.tripId?.routeId?.routeName || 'N/A'}
                    </div>
                    <div className="text-sm text-gray-500">
                      {booking.tripId?.busId?.busNumber || 'N/A'} • {booking.seats?.map(s => s.seatNumber).join(', ') || 'N/A'}
                    </div>
                    <div className="text-sm text-gray-500">
                      {formatDate(booking.tripId?.serviceDate)} • {booking.tripId?.startTime}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{formatDate(booking.createdAt)}</div>
                    <div className="text-sm text-gray-500">{formatTime(booking.createdAt)}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">
                      {formatCurrency(booking.pricing?.totalAmount || 0)}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-${getStatusColor(booking.status)}-100 text-${getStatusColor(booking.status)}-800`}>
                      {getStatusIcon(booking.status)}
                      <span className="ml-1 capitalize">{booking.status}</span>
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex space-x-2">
                      <button
                        onClick={() => handleViewBooking(booking._id)}
                        className="text-blue-600 hover:text-blue-900"
                        title="View Details"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => openEditModal(booking)}
                        className="text-green-600 hover:text-green-900"
                        title="Edit Booking"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => openDeleteModal(booking._id)}
                        className="text-red-600 hover:text-red-900"
                        title="Delete Booking"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                      {booking.status === 'pending' && (
                        <button
                          onClick={() => handleStatusChange(booking._id, 'confirmed')}
                          className="text-green-600 hover:text-green-900"
                          title="Confirm Booking"
                        >
                          <Check className="w-4 h-4" />
                        </button>
                      )}
                      {booking.status === 'confirmed' && (
                        <button
                          onClick={() => handleStatusChange(booking._id, 'cancelled')}
                          className="text-red-600 hover:text-red-900"
                          title="Cancel Booking"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {bookings.length === 0 && (
          <div className="text-center py-12">
            <Calendar className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No bookings found</h3>
            <p className="mt-1 text-sm text-gray-500">
              {searchTerm || filterStatus !== 'all' || filterDate
                ? 'Try adjusting your search or filters'
                : 'No bookings have been made yet'}
            </p>
          </div>
        )}
      </div>

      {/* Pagination */}
      {bookings.length > 0 && (
        <div className="mt-6 flex items-center justify-between">
          <div className="text-sm text-gray-700">
            Showing {((currentPage - 1) * itemsPerPage) + 1} to {Math.min(currentPage * itemsPerPage, stats.totalBookings)} of {stats.totalBookings} bookings
          </div>
          <div className="flex space-x-2">
            <button
              onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
              disabled={currentPage === 1}
              className="px-3 py-1 border border-gray-300 rounded-md text-sm disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Previous
            </button>
            <button
              onClick={() => setCurrentPage(prev => prev + 1)}
              disabled={currentPage * itemsPerPage >= stats.totalBookings}
              className="px-3 py-1 border border-gray-300 rounded-md text-sm disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Next
            </button>
          </div>
        </div>
      )}

      {/* Create Booking Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">Create New Booking</h2>
              <button
                onClick={() => setShowCreateModal(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            
            <div className="space-y-6">
              {/* Customer Information */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Customer Name</label>
                  <input
                    type="text"
                    value={bookingForm.customer.name}
                    onChange={(e) => setBookingForm(prev => ({
                      ...prev,
                      customer: { ...prev.customer, name: e.target.value }
                    }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Enter customer name"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                  <input
                    type="email"
                    value={bookingForm.customer.email}
                    onChange={(e) => setBookingForm(prev => ({
                      ...prev,
                      customer: { ...prev.customer, email: e.target.value }
                    }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Enter email"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                  <input
                    type="tel"
                    value={bookingForm.customer.phone}
                    onChange={(e) => setBookingForm(prev => ({
                      ...prev,
                      customer: { ...prev.customer, phone: e.target.value }
                    }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Enter phone number"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Age</label>
                  <input
                    type="number"
                    value={bookingForm.customer.age}
                    onChange={(e) => setBookingForm(prev => ({
                      ...prev,
                      customer: { ...prev.customer, age: e.target.value }
                    }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Enter age"
                  />
                </div>
              </div>

              {/* Journey Information */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">From</label>
                  <input
                    type="text"
                    value={bookingForm.journey.from}
                    onChange={(e) => setBookingForm(prev => ({
                      ...prev,
                      journey: { ...prev.journey, from: e.target.value }
                    }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Departure location"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">To</label>
                  <input
                    type="text"
                    value={bookingForm.journey.to}
                    onChange={(e) => setBookingForm(prev => ({
                      ...prev,
                      journey: { ...prev.journey, to: e.target.value }
                    }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Destination"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Departure Date</label>
                  <input
                    type="date"
                    value={bookingForm.journey.departureDate}
                    onChange={(e) => setBookingForm(prev => ({
                      ...prev,
                      journey: { ...prev.journey, departureDate: e.target.value }
                    }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Departure Time</label>
                  <input
                    type="time"
                    value={bookingForm.journey.departureTime}
                    onChange={(e) => setBookingForm(prev => ({
                      ...prev,
                      journey: { ...prev.journey, departureTime: e.target.value }
                    }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>

              {/* Trip Selection */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Trip</label>
                  <select
                    value={bookingForm.tripId}
                    onChange={(e) => setBookingForm(prev => ({ ...prev, tripId: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">Select Trip</option>
                    {trips.map(trip => (
                      <option key={trip._id} value={trip._id}>
                        {trip.tripNumber || trip._id} - {trip.routeId?.routeName || 'Unknown Route'}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Depot</label>
                  <select
                    value={bookingForm.depotId}
                    onChange={(e) => setBookingForm(prev => ({ ...prev, depotId: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">Select Depot</option>
                    {depots.map(depot => (
                      <option key={depot._id} value={depot._id}>
                        {depot.depotName || depot.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Pricing */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Total Amount</label>
                  <input
                    type="number"
                    value={bookingForm.pricing.totalAmount}
                    onChange={(e) => setBookingForm(prev => ({
                      ...prev,
                      pricing: { ...prev.pricing, totalAmount: parseFloat(e.target.value) || 0 }
                    }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Enter total amount"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Payment Method</label>
                  <select
                    value={bookingForm.payment.method}
                    onChange={(e) => setBookingForm(prev => ({
                      ...prev,
                      payment: { ...prev.payment, method: e.target.value }
                    }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="cash">Cash</option>
                    <option value="card">Card</option>
                    <option value="upi">UPI</option>
                    <option value="netbanking">Net Banking</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => setShowCreateModal(false)}
                className="px-4 py-2 text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateBooking}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
              >
                <Save className="w-4 h-4" />
                Create Booking
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <div className="flex items-center mb-4">
              <AlertCircle className="w-8 h-8 text-red-600 mr-3" />
              <h2 className="text-xl font-bold">Confirm Deletion</h2>
            </div>
            
            <p className="text-gray-600 mb-6">
              Are you sure you want to delete this booking? This action cannot be undone.
            </p>

            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowDeleteModal(false)}
                className="px-4 py-2 text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDeleteBooking(true)}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
              >
                Force Delete
              </button>
              <button
                onClick={() => handleDeleteBooking(false)}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminBookings;
