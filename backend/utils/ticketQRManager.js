const crypto = require('crypto');
const QRCode = require('qrcode');

// Enhanced QR Code and Ticket Management System
// This module provides comprehensive ticket generation, QR code creation, and validation

class TicketQRManager {
  constructor() {
    this.secret = process.env.QR_SIGNING_SECRET || process.env.JWT_SECRET || 'yatrik_qr_secret_2024';
  }

  // Generate secure QR payload with signature
  generateQRPayload(ticketData) {
    const payload = {
      pnr: ticketData.pnr,
      ticketNumber: ticketData.ticketNumber,
      passengerName: ticketData.passengerName,
      seatNumber: ticketData.seatNumber,
      boardingStop: ticketData.boardingStop,
      destinationStop: ticketData.destinationStop,
      fareAmount: ticketData.fareAmount,
      tripId: ticketData.tripDetails?.tripId,
      busNumber: ticketData.tripDetails?.busNumber,
      departureTime: ticketData.tripDetails?.departureTime,
      routeName: ticketData.tripDetails?.routeName,
      bookingId: ticketData.bookingId,
      issuedAt: new Date().toISOString(),
      exp: Date.now() + (24 * 60 * 60 * 1000), // 24 hours expiry
      version: '1.0'
    };

    // Add signature
    const signature = this.createSignature(payload);
    payload.sig = signature;

    return JSON.stringify(payload);
  }

  // Create HMAC signature for payload
  createSignature(payload) {
    const payloadWithoutSig = { ...payload };
    delete payloadWithoutSig.sig;
    const serialized = JSON.stringify(payloadWithoutSig);
    return crypto.createHmac('sha256', this.secret).update(serialized).digest('hex');
  }

  // Verify QR payload signature
  verifySignature(payload) {
    if (!payload || typeof payload !== 'object' || !payload.sig) {
      return false;
    }
    
    const expected = this.createSignature(payload);
    const a = Buffer.from(expected);
    const b = Buffer.from(payload.sig);
    
    if (a.length !== b.length) return false;
    return crypto.timingSafeEqual(a, b);
  }

  // Generate QR code image
  async generateQRImage(qrPayload) {
    try {
      return await QRCode.toDataURL(qrPayload, {
        errorCorrectionLevel: 'H',
        type: 'image/png',
        width: 300,
        margin: 2,
        color: {
          dark: '#E91E63',
          light: '#FFFFFF'
        }
      });
    } catch (error) {
      console.error('QR code generation error:', error);
      throw new Error('Failed to generate QR code');
    }
  }

  // Validate QR code data
  validateQRCode(qrPayload) {
    try {
      const payload = JSON.parse(qrPayload);
      
      // Check signature
      if (!this.verifySignature(payload)) {
        return { valid: false, error: 'Invalid signature' };
      }
      
      // Check expiration
      if (payload.exp && Date.now() > payload.exp) {
        return { valid: false, error: 'QR code expired' };
      }
      
      // Check required fields
      const requiredFields = ['pnr', 'ticketNumber', 'passengerName', 'seatNumber'];
      for (const field of requiredFields) {
        if (!payload[field]) {
          return { valid: false, error: `Missing required field: ${field}` };
        }
      }
      
      return { valid: true, data: payload };
    } catch (error) {
      return { valid: false, error: 'Invalid QR code format' };
    }
  }

  // Generate complete ticket data for email
  generateTicketData(booking, ticket, trip, bus, route) {
    const ticketData = {
      // Basic ticket info
      ticketNumber: ticket.ticketNumber,
      pnr: ticket.pnr,
      passengerName: ticket.passengerName,
      seatNumber: ticket.seatNumber,
      boardingStop: ticket.boardingStop,
      destinationStop: ticket.destinationStop,
      fareAmount: ticket.fareAmount,
      
      // Customer info
      customer: {
        name: booking.customer?.name || ticket.passengerName,
        email: booking.customer?.email || '',
        phone: booking.customer?.phone || ''
      },
      
      // Journey details
      journey: {
        from: ticket.boardingStop,
        to: ticket.destinationStop,
        departureDate: trip.serviceDate,
        departureTime: trip.startTime,
        arrivalDate: trip.serviceDate, // Same day for most trips
        arrivalTime: trip.endTime,
        duration: this.calculateDuration(trip.startTime, trip.endTime)
      },
      
      // Seat details
      seat: {
        number: ticket.seatNumber,
        type: 'seater', // Default seat type
        position: 'window', // Default position
        floor: 'lower'
      },
      
      // Pricing breakdown
      pricing: {
        baseFare: ticket.fareAmount,
        seatFare: ticket.fareAmount,
        gst: 0, // No GST for now
        totalAmount: ticket.fareAmount
      },
      
      // Trip details
      tripDetails: {
        tripId: trip._id,
        busNumber: bus?.busNumber || 'N/A',
        departureTime: new Date(`${trip.serviceDate.toISOString().split('T')[0]}T${trip.startTime}:00Z`),
        routeName: route?.routeName || `${ticket.boardingStop} - ${ticket.destinationStop}`
      },
      
      // Bus info
      bus: {
        busNumber: bus?.busNumber || 'N/A',
        busType: bus?.busType || 'Standard'
      },
      
      // Route info
      route: {
        name: route?.routeName || `${ticket.boardingStop} - ${ticket.destinationStop}`,
        from: route?.from || ticket.boardingStop,
        to: route?.to || ticket.destinationStop
      },
      
      // Booking reference
      bookingId: booking.bookingId || booking._id,
      bookingReference: booking.bookingReference
    };

    // Generate QR payload and image
    const qrPayload = this.generateQRPayload(ticketData);
    ticketData.qrPayload = qrPayload;
    
    return ticketData;
  }

  // Calculate journey duration in minutes
  calculateDuration(startTime, endTime) {
    try {
      const start = new Date(`2000-01-01T${startTime}:00Z`);
      const end = new Date(`2000-01-01T${endTime}:00Z`);
      
      // Handle overnight trips
      if (end < start) {
        end.setDate(end.getDate() + 1);
      }
      
      return Math.round((end - start) / (1000 * 60)); // Convert to minutes
    } catch (error) {
      return 240; // Default 4 hours
    }
  }

  // Format currency for display
  formatCurrency(amount) {
    if (amount === undefined || amount === null || isNaN(Number(amount))) {
      return '0.00';
    }
    return Number(amount).toLocaleString('en-IN', { 
      minimumFractionDigits: 2, 
      maximumFractionDigits: 2 
    });
  }

  // Format date for display
  formatDate(date) {
    if (!date) return 'N/A';
    const d = new Date(date);
    return d.toLocaleDateString('en-IN', { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  }

  // Format time for display
  formatTime(time) {
    if (!time) return 'N/A';
    if (typeof time === 'string' && time.includes(':')) return time;
    const d = new Date(time);
    return d.toLocaleTimeString('en-IN', { 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: false 
    });
  }
}

module.exports = new TicketQRManager();



