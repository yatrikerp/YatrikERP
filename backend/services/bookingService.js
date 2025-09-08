const Booking = require('../models/Booking');
const Trip = require('../models/Trip');
const Bus = require('../models/Bus');
const Route = require('../models/Route');
const User = require('../models/User');
const NotificationService = require('./notificationService');

class BookingService {
  // Create a new booking
  static async createBooking(bookingData, userId) {
    try {
      // Validate trip exists and is available
      const trip = await Trip.findById(bookingData.tripId)
        .populate('routeId', 'routeName routeNumber startingPoint endingPoint')
        .populate('busId', 'busNumber busType capacity seatLayout')
        .populate('depotId', 'depotName');

      if (!trip) {
        throw new Error('Trip not found');
      }

      if (trip.status !== 'scheduled') {
        throw new Error('Trip is not available for booking');
      }

      // Check seat availability
      const availableSeats = await this.getAvailableSeats(bookingData.tripId, bookingData.journey.departureDate);
      const requestedSeats = bookingData.seats.map(seat => seat.seatNumber);
      
      for (const seatNumber of requestedSeats) {
        if (!availableSeats.includes(seatNumber)) {
          throw new Error(`Seat ${seatNumber} is not available`);
        }
      }

      // Calculate pricing
      const pricing = await this.calculatePricing(bookingData, trip);

      // Create booking
      const booking = new Booking({
        ...bookingData,
        pricing,
        createdBy: userId,
        status: 'pending'
      });

      await booking.save();

      // Populate the booking for response
      const populatedBooking = await Booking.findById(booking._id)
        .populate('tripId', 'tripNumber startTime endTime')
        .populate('routeId', 'routeName routeNumber startingPoint endingPoint')
        .populate('busId', 'busNumber busType')
        .populate('depotId', 'depotName');

      return populatedBooking;

    } catch (error) {
      console.error('Error creating booking:', error);
      throw error;
    }
  }

  // Get available seats for a trip
  static async getAvailableSeats(tripId, departureDate) {
    try {
      const trip = await Trip.findById(tripId).populate('busId', 'seatLayout');
      if (!trip) {
        throw new Error('Trip not found');
      }

      // Get all seats from bus layout
      const allSeats = this.generateSeatLayout(trip.busId.seatLayout);
      
      // Get booked seats for this trip on this date
      const bookedSeats = await Booking.find({
        tripId: tripId,
        'journey.departureDate': {
          $gte: new Date(departureDate).setHours(0, 0, 0, 0),
          $lt: new Date(departureDate).setHours(23, 59, 59, 999)
        },
        status: { $in: ['confirmed', 'pending'] }
      }).select('seats.seatNumber');

      const bookedSeatNumbers = bookedSeats.flatMap(booking => 
        booking.seats.map(seat => seat.seatNumber)
      );

      // Return available seats
      return allSeats.filter(seat => !bookedSeatNumbers.includes(seat));
    } catch (error) {
      console.error('Error getting available seats:', error);
      throw error;
    }
  }

  // Generate seat layout based on bus configuration
  static generateSeatLayout(seatLayout) {
    const seats = [];
    const { rows, seatsPerRow, totalSeats, layout } = seatLayout;

    if (layout === '2+2') {
      // 2+2 seating (AC Seater)
      for (let row = 1; row <= rows; row++) {
        for (let seat = 1; seat <= seatsPerRow; seat++) {
          const seatNumber = `${row}${String.fromCharCode(64 + seat)}`;
          seats.push(seatNumber);
        }
      }
    } else if (layout === '2+1') {
      // 2+1 seating (Semi Sleeper)
      for (let row = 1; row <= rows; row++) {
        for (let seat = 1; seat <= seatsPerRow; seat++) {
          const seatNumber = `${row}${String.fromCharCode(64 + seat)}`;
          seats.push(seatNumber);
        }
      }
    } else if (layout === 'sleeper') {
      // Sleeper layout
      for (let row = 1; row <= rows; row++) {
        // Lower berth
        seats.push(`${row}L`);
        // Upper berth
        seats.push(`${row}U`);
        // Side lower
        if (row <= Math.floor(rows / 2)) {
          seats.push(`${row}SL`);
        }
        // Side upper
        if (row <= Math.floor(rows / 2)) {
          seats.push(`${row}SU`);
        }
      }
    }

    return seats;
  }

  // Calculate pricing for booking
  static async calculatePricing(bookingData, trip) {
    try {
      const baseFare = trip.baseFare || 100; // Default base fare
      const seatFare = bookingData.seats.reduce((total, seat) => total + (seat.price || 0), 0);
      
      // Calculate taxes (GST 18%)
      const gst = Math.round((baseFare + seatFare) * 0.18);
      
      // Calculate discounts
      const earlyBirdDiscount = this.calculateEarlyBirdDiscount(baseFare + seatFare, trip.startTime);
      const loyaltyDiscount = 0; // TODO: Implement loyalty program
      const promoDiscount = 0; // TODO: Implement promo codes
      
      const totalDiscount = earlyBirdDiscount + loyaltyDiscount + promoDiscount;
      const subtotal = baseFare + seatFare + gst - totalDiscount;
      
      return {
        baseFare,
        seatFare,
        taxes: {
          gst,
          serviceTax: 0,
          other: 0
        },
        discounts: {
          earlyBird: earlyBirdDiscount,
          loyalty: loyaltyDiscount,
          promo: promoDiscount,
          other: 0
        },
        totalAmount: Math.max(subtotal, 0), // Ensure non-negative
        paidAmount: 0,
        refundAmount: 0
      };
    } catch (error) {
      console.error('Error calculating pricing:', error);
      throw error;
    }
  }

  // Calculate early bird discount
  static calculateEarlyBirdDiscount(amount, departureTime) {
    const hoursUntilDeparture = Math.floor((new Date(departureTime) - new Date()) / (1000 * 60 * 60));
    
    if (hoursUntilDeparture > 168) { // More than 7 days
      return Math.round(amount * 0.15); // 15% discount
    } else if (hoursUntilDeparture > 72) { // More than 3 days
      return Math.round(amount * 0.10); // 10% discount
    } else if (hoursUntilDeparture > 24) { // More than 1 day
      return Math.round(amount * 0.05); // 5% discount
    }
    
    return 0;
  }

  // Confirm booking (after payment)
  static async confirmBooking(bookingId, paymentData) {
    try {
      const booking = await Booking.findById(bookingId);
      if (!booking) {
        throw new Error('Booking not found');
      }

      if (booking.status !== 'pending') {
        throw new Error('Booking cannot be confirmed');
      }

      // Update booking with payment information
      booking.payment = {
        ...booking.payment,
        ...paymentData,
        paymentStatus: 'completed',
        paidAt: new Date()
      };
      booking.pricing.paidAmount = booking.pricing.totalAmount;
      booking.status = 'confirmed';

      await booking.save();

      // Send confirmation notifications
      await this.sendBookingConfirmation(booking);

      return booking;
    } catch (error) {
      console.error('Error confirming booking:', error);
      throw error;
    }
  }

  // Cancel booking
  static async cancelBooking(bookingId, cancelledBy, reason) {
    try {
      const booking = await Booking.findById(bookingId);
      if (!booking) {
        throw new Error('Booking not found');
      }

      if (!booking.canBeCancelled()) {
        throw new Error('Booking cannot be cancelled');
      }

      // Calculate refund
      const refundInfo = booking.calculateRefund();

      // Update booking
      booking.status = 'cancelled';
      booking.cancellation = {
        cancelledBy,
        cancelledAt: new Date(),
        reason,
        refundEligible: refundInfo.refundAmount > 0,
        refundAmount: refundInfo.refundAmount,
        cancellationCharges: refundInfo.cancellationCharges
      };
      booking.pricing.refundAmount = refundInfo.refundAmount;

      await booking.save();

      // Send cancellation notification
      await this.sendBookingCancellation(booking);

      return booking;
    } catch (error) {
      console.error('Error cancelling booking:', error);
      throw error;
    }
  }

  // Get booking by ID
  static async getBookingById(bookingId) {
    try {
      return await Booking.findById(bookingId)
        .populate('tripId', 'tripNumber startTime endTime')
        .populate('routeId', 'routeName routeNumber startingPoint endingPoint')
        .populate('busId', 'busNumber busType')
        .populate('depotId', 'depotName')
        .populate('createdBy', 'name email');
    } catch (error) {
      console.error('Error getting booking:', error);
      throw error;
    }
  }

  // Get bookings by user
  static async getBookingsByUser(userId, options = {}) {
    try {
      const { status, limit = 20, page = 1 } = options;
      const query = { createdBy: userId };
      
      if (status) {
        query.status = status;
      }

      const bookings = await Booking.find(query)
        .populate('tripId', 'tripNumber startTime endTime')
        .populate('routeId', 'routeName routeNumber startingPoint endingPoint')
        .populate('busId', 'busNumber busType')
        .populate('depotId', 'depotName')
        .sort({ createdAt: -1 })
        .limit(limit * 1)
        .skip((page - 1) * limit);

      const total = await Booking.countDocuments(query);

      return {
        bookings,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(total / limit),
          totalItems: total,
          itemsPerPage: parseInt(limit)
        }
      };
    } catch (error) {
      console.error('Error getting user bookings:', error);
      throw error;
    }
  }

  // Get bookings by depot
  static async getBookingsByDepot(depotId, options = {}) {
    try {
      const { 
        status, 
        startDate, 
        endDate, 
        limit = 50, 
        page = 1 
      } = options;

      const query = { depotId };

      if (status) {
        query.status = status;
      }

      if (startDate && endDate) {
        query['journey.departureDate'] = {
          $gte: new Date(startDate),
          $lte: new Date(endDate)
        };
      }

      const bookings = await Booking.find(query)
        .populate('tripId', 'tripNumber startTime endTime')
        .populate('routeId', 'routeName routeNumber startingPoint endingPoint')
        .populate('busId', 'busNumber busType')
        .populate('createdBy', 'name email phone')
        .sort({ 'journey.departureDate': -1, createdAt: -1 })
        .limit(limit * 1)
        .skip((page - 1) * limit);

      const total = await Booking.countDocuments(query);

      return {
        bookings,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(total / limit),
          totalItems: total,
          itemsPerPage: parseInt(limit)
        }
      };
    } catch (error) {
      console.error('Error getting depot bookings:', error);
      throw error;
    }
  }

  // Search trips for booking
  static async searchTrips(searchData) {
    try {
      const { from, to, departureDate, passengers = 1 } = searchData;

      const query = {
        status: 'scheduled',
        'routeId.startingPoint.city': { $regex: from, $options: 'i' },
        'routeId.endingPoint.city': { $regex: to, $options: 'i' }
      };

      // Add date filter if provided
      if (departureDate) {
        const searchDate = new Date(departureDate);
        const startOfDay = new Date(searchDate.setHours(0, 0, 0, 0));
        const endOfDay = new Date(searchDate.setHours(23, 59, 59, 999));
        
        query.serviceDate = {
          $gte: startOfDay,
          $lte: endOfDay
        };
      }

      const trips = await Trip.find(query)
        .populate('routeId', 'routeName routeNumber startingPoint endingPoint distance duration')
        .populate('busId', 'busNumber busType capacity amenities')
        .populate('depotId', 'depotName location')
        .sort({ startTime: 1 });

      // Filter trips with available seats
      const availableTrips = [];
      for (const trip of trips) {
        const availableSeats = await this.getAvailableSeats(trip._id, departureDate);
        if (availableSeats.length >= passengers) {
          availableTrips.push({
            ...trip.toObject(),
            availableSeats: availableSeats.length,
            fare: trip.baseFare || 100
          });
        }
      }

      return availableTrips;
    } catch (error) {
      console.error('Error searching trips:', error);
      throw error;
    }
  }

  // Send booking confirmation
  static async sendBookingConfirmation(booking) {
    try {
      // Send email notification
      // TODO: Implement email service
      
      // Send SMS notification
      // TODO: Implement SMS service
      
      // Send notification to depot
      await NotificationService.createDepotNotification(booking.depotId, {
        title: 'New Booking Confirmed',
        message: `Booking ${booking.bookingId} confirmed for ${booking.customer.name}`,
        type: 'booking_created',
        priority: 'medium',
        relatedEntity: {
          type: 'booking',
          id: booking._id
        },
        actionData: {
          action: 'view',
          url: `/depot/bookings/${booking._id}`,
          buttonText: 'View Booking'
        }
      });
    } catch (error) {
      console.error('Error sending booking confirmation:', error);
    }
  }

  // Send booking cancellation
  static async sendBookingCancellation(booking) {
    try {
      // Send cancellation notification
      // TODO: Implement notification service
    } catch (error) {
      console.error('Error sending booking cancellation:', error);
    }
  }

  // Get booking statistics
  static async getBookingStats(depotId = null, startDate = null, endDate = null) {
    try {
      return await Booking.getBookingStats(depotId, startDate, endDate);
    } catch (error) {
      console.error('Error getting booking stats:', error);
      throw error;
    }
  }
}

module.exports = BookingService;
