import React, { useState, useEffect } from 'react';
import { Search, Filter, Download, Eye, Edit, Trash2, CheckCircle, XCircle, Clock, Bus, User, Calendar } from 'lucide-react';
import './BookingManagement.css';

const BookingManagement = ({ depotId, user }) => {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [filters, setFilters] = useState({
    status: '',
    startDate: '',
    endDate: '',
    search: ''
  });
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalItems: 0,
    itemsPerPage: 20
  });
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [showDetails, setShowDetails] = useState(false);

  useEffect(() => {
    fetchBookings();
  }, [depotId, filters, pagination.currentPage]);

  const fetchBookings = async () => {
    setLoading(true);
    setError('');

    try {
      const queryParams = new URLSearchParams({
        page: pagination.currentPage,
        limit: pagination.itemsPerPage,
        ...filters
      });

      const response = await fetch(`/api/booking/depot/${depotId}?${queryParams}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('depotToken') || localStorage.getItem('token')}`
        }
      });

      const result = await response.json();

      if (result.success) {
        setBookings(result.data.bookings);
        setPagination(result.data.pagination);
      } else {
        setError(result.message || 'Failed to fetch bookings');
      }
    } catch (err) {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    setPagination(prev => ({ ...prev, currentPage: 1 }));
  };

  const handleSearch = (searchTerm) => {
    setFilters(prev => ({ ...prev, search: searchTerm }));
    setPagination(prev => ({ ...prev, currentPage: 1 }));
  };

  const handleStatusChange = async (bookingId, newStatus) => {
    try {
      const response = await fetch(`/api/booking/${bookingId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('depotToken') || localStorage.getItem('token')}`
        },
        body: JSON.stringify({ status: newStatus })
      });

      const result = await response.json();

      if (result.success) {
        setBookings(prev => prev.map(booking => 
          booking._id === bookingId 
            ? { ...booking, status: newStatus }
            : booking
        ));
      } else {
        setError(result.message || 'Failed to update booking status');
      }
    } catch (err) {
      setError('Network error. Please try again.');
    }
  };

  const handleCheckIn = async (bookingId) => {
    try {
      const response = await fetch(`/api/booking/check-in/${bookingId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('depotToken') || localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          boardingPoint: 'Main Terminal',
          seatAllocated: 'Confirmed'
        })
      });

      const result = await response.json();

      if (result.success) {
        setBookings(prev => prev.map(booking => 
          booking._id === bookingId 
            ? { ...booking, checkIn: { checkedIn: true, checkedInAt: new Date() } }
            : booking
        ));
      } else {
        setError(result.message || 'Failed to check in passenger');
      }
    } catch (err) {
      setError('Network error. Please try again.');
    }
  };

  const handleCancelBooking = async (bookingId) => {
    if (!window.confirm('Are you sure you want to cancel this booking?')) {
      return;
    }

    try {
      const response = await fetch(`/api/booking/${bookingId}/cancel`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('depotToken') || localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          reason: 'Cancelled by depot staff'
        })
      });

      const result = await response.json();

      if (result.success) {
        setBookings(prev => prev.map(booking => 
          booking._id === bookingId 
            ? { ...booking, status: 'cancelled' }
            : booking
        ));
      } else {
        setError(result.message || 'Failed to cancel booking');
      }
    } catch (err) {
      setError('Network error. Please try again.');
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'confirmed': return '#00A86B';
      case 'pending': return '#FFB300';
      case 'cancelled': return '#F44336';
      case 'completed': return '#1976D2';
      case 'no_show': return '#9E9E9E';
      default: return '#666';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'confirmed': return <CheckCircle className="status-icon" />;
      case 'pending': return <Clock className="status-icon" />;
      case 'cancelled': return <XCircle className="status-icon" />;
      case 'completed': return <CheckCircle className="status-icon" />;
      case 'no_show': return <XCircle className="status-icon" />;
      default: return <Clock className="status-icon" />;
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  };

  const formatTime = (timeString) => {
    return new Date(`2000-01-01T${timeString}`).toLocaleTimeString('en-IN', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  };

  return (
    <div className="booking-management">
      <div className="booking-header">
        <h2>Booking Management</h2>
        <div className="header-actions">
          <button className="export-btn">
            <Download className="btn-icon" />
            Export
          </button>
        </div>
      </div>

      {error && (
        <div className="error-message">
          <XCircle className="error-icon" />
          {error}
        </div>
      )}

      <div className="filters-section">
        <div className="search-box">
          <Search className="search-icon" />
          <input
            type="text"
            placeholder="Search by booking ID, customer name, or phone..."
            value={filters.search}
            onChange={(e) => handleSearch(e.target.value)}
          />
        </div>

        <div className="filter-controls">
          <div className="filter-group">
            <label>Status</label>
            <select
              value={filters.status}
              onChange={(e) => handleFilterChange('status', e.target.value)}
            >
              <option value="">All Status</option>
              <option value="pending">Pending</option>
              <option value="confirmed">Confirmed</option>
              <option value="cancelled">Cancelled</option>
              <option value="completed">Completed</option>
              <option value="no_show">No Show</option>
            </select>
          </div>

          <div className="filter-group">
            <label>From Date</label>
            <input
              type="date"
              value={filters.startDate}
              onChange={(e) => handleFilterChange('startDate', e.target.value)}
            />
          </div>

          <div className="filter-group">
            <label>To Date</label>
            <input
              type="date"
              value={filters.endDate}
              onChange={(e) => handleFilterChange('endDate', e.target.value)}
            />
          </div>

          <button 
            className="clear-filters-btn"
            onClick={() => setFilters({ status: '', startDate: '', endDate: '', search: '' })}
          >
            Clear Filters
          </button>
        </div>
      </div>

      <div className="bookings-table">
        <div className="table-header">
          <div className="table-row header">
            <div className="col booking-id">Booking ID</div>
            <div className="col customer">Customer</div>
            <div className="col route">Route</div>
            <div className="col date">Date & Time</div>
            <div className="col seats">Seats</div>
            <div className="col amount">Amount</div>
            <div className="col status">Status</div>
            <div className="col actions">Actions</div>
          </div>
        </div>

        <div className="table-body">
          {loading ? (
            <div className="loading-row">
              <div className="loading-spinner"></div>
              <span>Loading bookings...</span>
            </div>
          ) : bookings.length === 0 ? (
            <div className="empty-row">
              <p>No bookings found</p>
            </div>
          ) : (
            bookings.map((booking) => (
              <div key={booking._id} className="table-row">
                <div className="col booking-id">
                  <div className="booking-ref">
                    <strong>{booking.bookingId}</strong>
                    <small>{booking.bookingReference}</small>
                  </div>
                </div>

                <div className="col customer">
                  <div className="customer-info">
                    <div className="customer-name">{booking.customer.name}</div>
                    <div className="customer-contact">
                      {booking.customer.phone} • {booking.customer.email}
                    </div>
                  </div>
                </div>

                <div className="col route">
                  <div className="route-info">
                    <div className="route-name">{booking.routeId?.routeName}</div>
                    <div className="route-details">
                      {booking.journey.from} → {booking.journey.to}
                    </div>
                  </div>
                </div>

                <div className="col date">
                  <div className="date-info">
                    <div className="date">{formatDate(booking.journey.departureDate)}</div>
                    <div className="time">
                      {formatTime(booking.journey.departureTime)}
                    </div>
                  </div>
                </div>

                <div className="col seats">
                  <div className="seats-info">
                    <div className="seat-count">{booking.seats.length} seat(s)</div>
                    <div className="seat-numbers">
                      {booking.seats.map(seat => seat.seatNumber).join(', ')}
                    </div>
                  </div>
                </div>

                <div className="col amount">
                  <div className="amount-info">
                    <div className="total-amount">₹{booking.pricing?.totalAmount}</div>
                    <div className="payment-status">
                      {booking.payment?.paymentStatus}
                    </div>
                  </div>
                </div>

                <div className="col status">
                  <div 
                    className="status-badge"
                    style={{ color: getStatusColor(booking.status) }}
                  >
                    {getStatusIcon(booking.status)}
                    <span>{booking.status}</span>
                  </div>
                </div>

                <div className="col actions">
                  <div className="action-buttons">
                    <button
                      className="action-btn view"
                      onClick={() => {
                        setSelectedBooking(booking);
                        setShowDetails(true);
                      }}
                      title="View Details"
                    >
                      <Eye className="btn-icon" />
                    </button>

                    {booking.status === 'confirmed' && !booking.checkIn?.checkedIn && (
                      <button
                        className="action-btn checkin"
                        onClick={() => handleCheckIn(booking._id)}
                        title="Check In"
                      >
                        <CheckCircle className="btn-icon" />
                      </button>
                    )}

                    {booking.status === 'pending' && (
                      <button
                        className="action-btn confirm"
                        onClick={() => handleStatusChange(booking._id, 'confirmed')}
                        title="Confirm Booking"
                      >
                        <CheckCircle className="btn-icon" />
                      </button>
                    )}

                    {booking.status !== 'cancelled' && booking.status !== 'completed' && (
                      <button
                        className="action-btn cancel"
                        onClick={() => handleCancelBooking(booking._id)}
                        title="Cancel Booking"
                      >
                        <XCircle className="btn-icon" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {pagination.totalPages > 1 && (
        <div className="pagination">
          <button
            className="page-btn"
            onClick={() => setPagination(prev => ({ ...prev, currentPage: prev.currentPage - 1 }))}
            disabled={pagination.currentPage === 1}
          >
            Previous
          </button>

          <div className="page-numbers">
            {Array.from({ length: pagination.totalPages }, (_, i) => i + 1).map(page => (
              <button
                key={page}
                className={`page-number ${pagination.currentPage === page ? 'active' : ''}`}
                onClick={() => setPagination(prev => ({ ...prev, currentPage: page }))}
              >
                {page}
              </button>
            ))}
          </div>

          <button
            className="page-btn"
            onClick={() => setPagination(prev => ({ ...prev, currentPage: prev.currentPage + 1 }))}
            disabled={pagination.currentPage === pagination.totalPages}
          >
            Next
          </button>
        </div>
      )}

      {showDetails && selectedBooking && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3>Booking Details</h3>
              <button
                className="close-btn"
                onClick={() => setShowDetails(false)}
              >
                <XCircle className="btn-icon" />
              </button>
            </div>

            <div className="modal-body">
              <div className="booking-details">
                <div className="detail-section">
                  <h4>Booking Information</h4>
                  <div className="detail-grid">
                    <div className="detail-item">
                      <span>Booking ID:</span>
                      <span>{selectedBooking.bookingId}</span>
                    </div>
                    <div className="detail-item">
                      <span>Reference:</span>
                      <span>{selectedBooking.bookingReference}</span>
                    </div>
                    <div className="detail-item">
                      <span>Status:</span>
                      <span className="status-text" style={{ color: getStatusColor(selectedBooking.status) }}>
                        {selectedBooking.status}
                      </span>
                    </div>
                    <div className="detail-item">
                      <span>Created:</span>
                      <span>{formatDate(selectedBooking.createdAt)}</span>
                    </div>
                  </div>
                </div>

                <div className="detail-section">
                  <h4>Customer Information</h4>
                  <div className="detail-grid">
                    <div className="detail-item">
                      <span>Name:</span>
                      <span>{selectedBooking.customer.name}</span>
                    </div>
                    <div className="detail-item">
                      <span>Phone:</span>
                      <span>{selectedBooking.customer.phone}</span>
                    </div>
                    <div className="detail-item">
                      <span>Email:</span>
                      <span>{selectedBooking.customer.email}</span>
                    </div>
                  </div>
                </div>

                <div className="detail-section">
                  <h4>Journey Details</h4>
                  <div className="detail-grid">
                    <div className="detail-item">
                      <span>Route:</span>
                      <span>{selectedBooking.routeId?.routeName}</span>
                    </div>
                    <div className="detail-item">
                      <span>From:</span>
                      <span>{selectedBooking.journey.from}</span>
                    </div>
                    <div className="detail-item">
                      <span>To:</span>
                      <span>{selectedBooking.journey.to}</span>
                    </div>
                    <div className="detail-item">
                      <span>Date:</span>
                      <span>{formatDate(selectedBooking.journey.departureDate)}</span>
                    </div>
                    <div className="detail-item">
                      <span>Time:</span>
                      <span>{formatTime(selectedBooking.journey.departureTime)}</span>
                    </div>
                    <div className="detail-item">
                      <span>Bus:</span>
                      <span>{selectedBooking.busId?.busNumber}</span>
                    </div>
                  </div>
                </div>

                <div className="detail-section">
                  <h4>Seat Information</h4>
                  <div className="seats-list">
                    {selectedBooking.seats.map((seat, index) => (
                      <div key={index} className="seat-item">
                        <span>Seat {seat.seatNumber}</span>
                        <span>{seat.passengerName}</span>
                        <span>₹{seat.price}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="detail-section">
                  <h4>Payment Information</h4>
                  <div className="detail-grid">
                    <div className="detail-item">
                      <span>Total Amount:</span>
                      <span>₹{selectedBooking.pricing?.totalAmount}</span>
                    </div>
                    <div className="detail-item">
                      <span>Paid Amount:</span>
                      <span>₹{selectedBooking.pricing?.paidAmount}</span>
                    </div>
                    <div className="detail-item">
                      <span>Payment Method:</span>
                      <span>{selectedBooking.payment?.method}</span>
                    </div>
                    <div className="detail-item">
                      <span>Payment Status:</span>
                      <span>{selectedBooking.payment?.paymentStatus}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="modal-footer">
              <button
                className="btn secondary"
                onClick={() => setShowDetails(false)}
              >
                Close
              </button>
              <button
                className="btn primary"
                onClick={() => window.print()}
              >
                Print Ticket
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BookingManagement;
