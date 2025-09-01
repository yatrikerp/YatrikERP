const QRCode = require('qrcode');
const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');

class QRCodeGenerator {
  // Generate QR code as data URL
  static async generateQRCode(data) {
    try {
      const qrDataURL = await QRCode.toDataURL(JSON.stringify(data), {
        errorCorrectionLevel: 'H',
        type: 'image/png',
        quality: 0.92,
        margin: 1,
        color: {
          dark: '#000000',
          light: '#FFFFFF'
        }
      });
      return qrDataURL;
    } catch (error) {
      console.error('Error generating QR code:', error);
      throw error;
    }
  }

  // Generate ticket PDF with QR code
  static async generateTicketPDF(ticketData) {
    return new Promise((resolve, reject) => {
      try {
        const doc = new PDFDocument({
          size: 'A4',
          margin: 50
        });

        const chunks = [];
        doc.on('data', chunk => chunks.push(chunk));
        doc.on('end', () => resolve(Buffer.concat(chunks)));

        // Header
        doc.fontSize(24)
           .font('Helvetica-Bold')
           .fill('#E91E63')
           .text('YATRIK ERP', { align: 'center' });

        doc.fontSize(16)
           .font('Helvetica')
           .fill('#666')
           .text('Bus Ticket', { align: 'center' });

        doc.moveDown(0.5);

        // Ticket details
        doc.fontSize(12)
           .font('Helvetica-Bold')
           .fill('#333')
           .text('Ticket Details', { underline: true });

        doc.fontSize(10)
           .font('Helvetica')
           .fill('#333');

        const ticketInfo = [
          ['Ticket Number:', ticketData.ticketNumber],
          ['PNR:', ticketData.pnr],
          ['Passenger Name:', ticketData.passengerName],
          ['Seat Number:', ticketData.seatNumber],
          ['From:', ticketData.boardingStop],
          ['To:', ticketData.destinationStop],
          ['Date:', new Date(ticketData.tripDetails.departureTime).toLocaleDateString()],
          ['Time:', new Date(ticketData.tripDetails.departureTime).toLocaleTimeString()],
          ['Bus Number:', ticketData.tripDetails.busNumber],
          ['Route:', ticketData.tripDetails.routeName],
          ['Fare:', `₹${ticketData.fareAmount}`],
          ['Status:', ticketData.state.toUpperCase()]
        ];

        ticketInfo.forEach(([label, value]) => {
          doc.text(`${label} ${value}`);
        });

        doc.moveDown(1);

        // QR Code
        doc.fontSize(12)
           .font('Helvetica-Bold')
           .fill('#333')
           .text('Scan QR Code for Validation', { align: 'center' });

        // Generate QR code data
        const qrData = {
          ticketNumber: ticketData.ticketNumber,
          pnr: ticketData.pnr,
          passengerName: ticketData.passengerName,
          seatNumber: ticketData.seatNumber,
          tripId: ticketData.tripDetails.tripId,
          timestamp: new Date().toISOString()
        };

        // Generate QR code and add to PDF
        QRCode.toDataURL(JSON.stringify(qrData), {
          errorCorrectionLevel: 'H',
          type: 'image/png',
          quality: 0.92,
          margin: 1,
          color: {
            dark: '#000000',
            light: '#FFFFFF'
          }
        }).then(qrDataURL => {
          // Convert data URL to buffer
          const base64Data = qrDataURL.replace(/^data:image\/png;base64,/, '');
          const qrBuffer = Buffer.from(base64Data, 'base64');

          // Add QR code to PDF
          doc.image(qrBuffer, {
            fit: [150, 150],
            align: 'center'
          });

          doc.moveDown(1);

          // Footer
          doc.fontSize(8)
             .font('Helvetica')
             .fill('#666')
             .text('This is a valid ticket for YATRIK ERP bus service.', { align: 'center' })
             .text('Please keep this ticket safe and present it during boarding.', { align: 'center' })
             .text(`Generated on: ${new Date().toLocaleString()}`, { align: 'center' });

          doc.end();
        }).catch(error => {
          reject(error);
        });

      } catch (error) {
        reject(error);
      }
    });
  }

  // Save PDF to file
  static async saveTicketPDF(ticketData, filename) {
    try {
      const pdfBuffer = await this.generateTicketPDF(ticketData);
      const uploadsDir = path.join(__dirname, '../uploads/tickets');
      
      // Create directory if it doesn't exist
      if (!fs.existsSync(uploadsDir)) {
        fs.mkdirSync(uploadsDir, { recursive: true });
      }

      const filePath = path.join(uploadsDir, filename);
      fs.writeFileSync(filePath, pdfBuffer);
      
      return filePath;
    } catch (error) {
      console.error('Error saving PDF:', error);
      throw error;
    }
  }

  // Generate QR code for validation
  static async generateValidationQR(ticketData) {
    const validationData = {
      ticketNumber: ticketData.ticketNumber,
      pnr: ticketData.pnr,
      passengerName: ticketData.passengerName,
      seatNumber: ticketData.seatNumber,
      tripId: ticketData.tripDetails.tripId,
      validationTimestamp: new Date().toISOString(),
      type: 'validation'
    };

    return await this.generateQRCode(validationData);
  }

  // Verify QR code data
  static verifyQRCode(qrData) {
    try {
      const data = JSON.parse(qrData);
      return {
        isValid: true,
        data: data
      };
    } catch (error) {
      return {
        isValid: false,
        error: 'Invalid QR code data'
      };
    }
  }
}

module.exports = QRCodeGenerator;
