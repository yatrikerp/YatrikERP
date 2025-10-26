const TicketQRManager = require('../utils/ticketQRManager');

// Enhanced Email Templates for YATRIK ERP
const emailTemplates = {
  // Enhanced ticket confirmation with QR code
  ticketConfirmationWithQR: async (ticketData) => {
    const QRCode = require('qrcode');
    
    // Use the ticket QR manager for consistent data handling
    const t = ticketData || {};
    
    // Basic ticket information
    const ticketNumber = t.ticketNumber || 'N/A';
    const pnr = t.pnr || 'N/A';
    const passengerName = t.passengerName || t.customer?.name || 'Passenger';
    const customerEmail = t.customer?.email || '';
    const customerPhone = t.customer?.phone || '';
    
    // Journey details - use exact passenger booking data
    const fromCity = t.journey?.from || t.boardingStop || 'Origin';
    const toCity = t.journey?.to || t.destinationStop || 'Destination';
    const departureDate = t.journey?.departureDate || new Date();
    const departureTime = t.journey?.departureTime || '00:00';
    const arrivalDate = t.journey?.arrivalDate || departureDate;
    const arrivalTime = t.journey?.arrivalTime || '00:00';
    const duration = t.journey?.duration || 240;
    
    // Seat information
    const seatNumber = t.seatNumber || t.seat?.number || 'N/A';
    const seatType = t.seat?.type || 'Standard';
    const seatPosition = t.seat?.position || '';
    
    // Pricing details - use actual pricing from booking
    const fareAmount = t.fareAmount || t.pricing?.totalAmount || 0;
    const baseFare = t.pricing?.baseFare || t.pricing?.seatFare || fareAmount;
    const gst = t.pricing?.gst || 0;
    const totalAmount = t.pricing?.totalAmount || fareAmount;
    
    // Bus and route information
    const busNumber = t.bus?.busNumber || t.tripDetails?.busNumber || 'N/A';
    const busType = t.bus?.busType || 'Standard';
    const routeName = t.route?.name || t.tripDetails?.routeName || `${fromCity} - ${toCity}`;
    
    // Driver and Conductor information
    const driverName = t.driver?.name || 'To be assigned';
    const driverPhone = t.driver?.phone || 'N/A';
    const conductorName = t.conductor?.name || 'To be assigned';
    const conductorPhone = t.conductor?.phone || 'N/A';
    
    // Booking information
    const bookingId = t.bookingId || t.bookingReference || 'N/A';
    const bookingReference = t.bookingReference || bookingId;
    
    // Generate QR Code
    let qrCodeDataURL = t.qrImage || '';
    if (!qrCodeDataURL && t.qrPayload) {
      try {
        qrCodeDataURL = await QRCode.toDataURL(t.qrPayload, {
          errorCorrectionLevel: 'H',
          type: 'image/png',
          width: 300,
          margin: 2,
          color: {
            dark: '#E91E63',
            light: '#FFFFFF'
          }
        });
      } catch (err) {
        console.error('QR generation error:', err);
        qrCodeDataURL = '';
      }
    }
    
    // Format functions
    const formatCurrency = (amt) => {
      if (amt === undefined || amt === null || isNaN(Number(amt))) return '0.00';
      return Number(amt).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    };
    
    const formatDate = (date) => {
      if (!date) return 'N/A';
      const d = new Date(date);
      return d.toLocaleDateString('en-IN', { 
        weekday: 'long', 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      });
    };
    
    const formatTime = (time) => {
      if (!time) return 'N/A';
      if (typeof time === 'string' && time.includes(':')) return time;
      const d = new Date(time);
      return d.toLocaleTimeString('en-IN', { 
        hour: '2-digit', 
        minute: '2-digit',
        hour12: false 
      });
    };
    
    const formatDuration = (minutes) => {
      if (!minutes || minutes <= 0) return 'As scheduled';
      const hours = Math.floor(minutes / 60);
      const mins = minutes % 60;
      return `${hours}h ${mins}m`;
    };
    
    const subject = `🎫 Your YATRIK Bus Ticket - ${pnr} | ${fromCity} to ${toCity}`;
    
    const html = `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; max-width: 680px; margin: 0 auto; background: #f5f5f5; padding: 20px;">
        <!-- Header -->
        <div style="background: linear-gradient(135deg, #E91E63, #9C27B0); padding: 30px; text-align: center; border-radius: 12px 12px 0 0;">
          <div style="font-size: 48px; margin-bottom: 10px;">🎫</div>
          <h1 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: 700;">Ticket Confirmed!</h1>
          <p style="color: #f3e5f5; margin: 8px 0 0 0; font-size: 16px;">Your bus ticket is ready</p>
        </div>

        <!-- Main Content -->
        <div style="background: #ffffff; padding: 30px; border-radius: 0 0 12px 12px; box-shadow: 0 4px 12px rgba(0,0,0,0.08);">
          
          <!-- Ticket Card -->
          <div style="border: 2px dashed #E91E63; border-radius: 12px; padding: 24px; margin-bottom: 24px; background: #fef5f8;">
            <div style="text-align: center; margin-bottom: 20px;">
              <h2 style="color: #E91E63; margin: 0 0 8px 0; font-size: 22px;">PNR: ${pnr}</h2>
              <p style="color: #666; margin: 0; font-size: 14px;">Ticket #${ticketNumber}</p>
            </div>
            
            <!-- QR Code -->
            ${qrCodeDataURL ? `
            <div style="text-align: center; margin-bottom: 20px;">
              <img src="${qrCodeDataURL}" alt="QR Code" style="width: 200px; height: 200px; border: 2px solid #E91E63; border-radius: 8px;">
              <p style="color: #666; font-size: 12px; margin-top: 8px;">Show this QR code to the conductor</p>
            </div>
            ` : ''}
            
            <!-- Journey Details -->
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 20px;">
              <div>
                <h3 style="color: #333; margin: 0 0 8px 0; font-size: 16px;">Journey Details</h3>
                <p style="margin: 4px 0; color: #666;"><strong>From:</strong> ${fromCity}</p>
                <p style="margin: 4px 0; color: #666;"><strong>To:</strong> ${toCity}</p>
                <p style="margin: 4px 0; color: #666;"><strong>Date:</strong> ${formatDate(departureDate)}</p>
                <p style="margin: 4px 0; color: #666;"><strong>Departure:</strong> ${formatTime(departureTime)}</p>
                <p style="margin: 4px 0; color: #666;"><strong>Arrival:</strong> ${formatTime(arrivalTime)}</p>
                <p style="margin: 4px 0; color: #666;"><strong>Duration:</strong> ${formatDuration(duration)}</p>
              </div>
              
              <div>
                <h3 style="color: #333; margin: 0 0 8px 0; font-size: 16px;">Seat Details</h3>
                <p style="margin: 4px 0; color: #666;"><strong>Passenger:</strong> ${passengerName}</p>
                <p style="margin: 4px 0; color: #666;"><strong>Seat:</strong> ${seatNumber}</p>
                <p style="margin: 4px 0; color: #666;"><strong>Type:</strong> ${seatType}</p>
                <p style="margin: 4px 0; color: #666;"><strong>Position:</strong> ${seatPosition}</p>
                <p style="margin: 4px 0; color: #666;"><strong>Bus:</strong> ${busNumber}</p>
                <p style="margin: 4px 0; color: #666;"><strong>Route:</strong> ${routeName}</p>
              </div>
            </div>
            
            <!-- Pricing -->
            <div style="border-top: 1px solid #E91E63; padding-top: 16px;">
              <h3 style="color: #333; margin: 0 0 12px 0; font-size: 16px;">Fare Breakdown</h3>
              <div style="display: flex; justify-content: space-between; margin: 4px 0;">
                <span style="color: #666;">Base Fare:</span>
                <span style="color: #333; font-weight: 500;">₹${formatCurrency(baseFare)}</span>
              </div>
              ${gst > 0 ? `
              <div style="display: flex; justify-content: space-between; margin: 4px 0;">
                <span style="color: #666;">GST (18%):</span>
                <span style="color: #333; font-weight: 500;">₹${formatCurrency(gst)}</span>
              </div>
              ` : ''}
              <div style="display: flex; justify-content: space-between; margin: 8px 0; padding-top: 8px; border-top: 1px solid #ddd;">
                <span style="color: #333; font-weight: 600;">Total Amount:</span>
                <span style="color: #E91E63; font-weight: 700; font-size: 18px;">₹${formatCurrency(totalAmount)}</span>
              </div>
            </div>
          </div>
          
          <!-- Important Information -->
          <div style="background: #f8f9fa; border-radius: 8px; padding: 20px; margin-bottom: 20px;">
            <h3 style="color: #333; margin: 0 0 12px 0; font-size: 16px;">📋 Important Instructions</h3>
            <ul style="margin: 0; padding-left: 20px; color: #666; line-height: 1.6;">
              <li>Please arrive at the boarding point 15 minutes before departure</li>
              <li>Show this QR code to the conductor for boarding</li>
              <li>Keep your ticket safe until the end of your journey</li>
              <li>Contact conductor: ${conductorName} (${conductorPhone})</li>
              <li>For queries, contact driver: ${driverName} (${driverPhone})</li>
            </ul>
          </div>
          
          <!-- Contact Information -->
          <div style="text-align: center; color: #666; font-size: 14px;">
            <p style="margin: 8px 0;">Need help? Contact us at support@yatrik.com</p>
            <p style="margin: 8px 0;">Booking Reference: ${bookingReference}</p>
            <p style="margin: 8px 0;">Thank you for choosing YATRIK!</p>
          </div>
        </div>
      </div>
    `;
    
    return { subject, html };
  },

  // Simple ticket confirmation (fallback)
  ticketConfirmation: (ticketData) => {
    const t = ticketData || {};
    const subject = `🎫 YATRIK Ticket Confirmed - ${t.pnr || 'N/A'}`;
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h2 style="color: #E91E63;">Ticket Confirmed!</h2>
        <p>Dear ${t.passengerName || 'Passenger'},</p>
        <p>Your bus ticket has been confirmed.</p>
        <p><strong>PNR:</strong> ${t.pnr || 'N/A'}</p>
        <p><strong>From:</strong> ${t.boardingStop || 'N/A'}</p>
        <p><strong>To:</strong> ${t.destinationStop || 'N/A'}</p>
        <p><strong>Seat:</strong> ${t.seatNumber || 'N/A'}</p>
        <p><strong>Fare:</strong> ₹${t.fareAmount || '0'}</p>
        <p>Thank you for choosing YATRIK!</p>
      </div>
    `;
    return { subject, html };
  }
};

module.exports = emailTemplates;





