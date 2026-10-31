const PDFDocument = require('pdfkit');

/**
 * Generates a professional, print-ready PDF Movie Ticket in-memory as a Buffer.
 * Does not write temporary files to disk.
 *
 * @param {Object} booking - Populated booking object
 * @returns {Promise<Buffer>} Resolves to the generated PDF Buffer
 */
const generateTicketPdf = (booking) => {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({
        size: 'A4',
        margin: 40,
        info: {
          Title: `iMovies Ticket - ${booking.bookingRef || 'Booking'}`,
          Author: 'iMovies Application',
          Subject: 'Movie E-Ticket',
          Keywords: 'iMovies, Movie Ticket, E-Ticket, Cinema',
        },
      });

      const buffers = [];
      doc.on('data', buffers.push.bind(buffers));
      doc.on('end', () => {
        const pdfData = Buffer.concat(buffers);
        resolve(pdfData);
      });
      doc.on('error', (err) => {
        reject(err);
      });

      // Color Palette
      const primaryColor = '#f84464'; // iMovies brand crimson
      const darkNavy = '#0b1120';
      const cardBg = '#131c31';
      const textLight = '#f8fafc';
      const textMuted = '#94a3b8';
      const textDark = '#1e293b';
      const borderColor = '#e2e8f0';
      const successColor = '#10b981';

      // Movie Details
      const movieTitle = booking.movie?.title || 'Movie Experience';
      const movieCert = booking.movie?.certification || 'UA';
      const movieFormat = booking.format || '2D';
      const theatreName = booking.theatre?.name || 'Cinema Hall';
      const theatreLocation = booking.theatre?.location || 'Cinema Complex';
      const showDate = booking.showDate || '';
      const showTime = booking.showTime || '';
      const seatsList = Array.isArray(booking.seats) ? booking.seats.join(', ') : booking.seats || 'General';
      const seatCount = booking.seatCount || (Array.isArray(booking.seats) ? booking.seats.length : 1);
      const bookingRef = booking.bookingRef || 'IMOV-CONFIRMED';
      const customerName = booking.user?.name || 'Valued Customer';
      const customerEmail = booking.user?.email || '';
      const paymentMethod = booking.paymentMethod || 'Demo Payment (Simulated)';
      const txnId = booking.demoTransactionId || 'DEMO-TXN-VERIFIED';
      const totalAmount = booking.totalAmount || 0;
      const subtotal = booking.subtotal || totalAmount;
      const convenienceFee = booking.convenienceFee || 0;
      const gst = booking.gst || 0;

      // 1. Top Decorative Brand Banner
      doc
        .rect(40, 40, 515, 60)
        .fill(darkNavy);

      // Accent border at the top of banner
      doc
        .rect(40, 40, 515, 4)
        .fill(primaryColor);

      // Brand Logo Text
      doc
        .font('Helvetica-Bold')
        .fontSize(22)
        .fillColor(primaryColor)
        .text('iMOVIES', 60, 55, { continued: true })
        .fillColor(textLight)
        .fontSize(14)
        .text('  CINEMAS');

      doc
        .font('Helvetica')
        .fontSize(9)
        .fillColor(textMuted)
        .text('OFFICIAL ELECTRONIC TICKET & TAX INVOICE', 60, 80);

      // Top Right Status Badge
      doc
        .roundedRect(415, 54, 125, 24, 4)
        .fill(successColor);

      doc
        .font('Helvetica-Bold')
        .fontSize(9)
        .fillColor('#ffffff')
        .text('✓ BOOKING CONFIRMED', 415, 61, { width: 125, align: 'center' });

      // 2. Main Ticket Card Container
      const cardTop = 115;
      const cardHeight = 490;

      doc
        .roundedRect(40, cardTop, 515, cardHeight, 8)
        .lineWidth(1)
        .strokeColor(borderColor)
        .fillAndStroke('#ffffff', borderColor);

      // Top section of Card: Movie Header Box
      doc
        .rect(41, cardTop + 1, 513, 85)
        .fill(cardBg);

      doc
        .font('Helvetica-Bold')
        .fontSize(20)
        .fillColor(textLight)
        .text(movieTitle, 60, cardTop + 18, { width: 380, ellipsis: true });

      doc
        .font('Helvetica-Bold')
        .fontSize(10)
        .fillColor(primaryColor)
        .text(`${movieFormat} • `, 60, cardTop + 45, { continued: true })
        .fillColor(textMuted)
        .font('Helvetica')
        .text(`Certification: ${movieCert} • Duration: ${booking.movie?.duration || 'Standard Feature'}`);

      // Booking Reference in Header Box
      doc
        .font('Helvetica')
        .fontSize(8)
        .fillColor(textMuted)
        .text('BOOKING ID', 420, cardTop + 22, { align: 'right', width: 115 });

      doc
        .font('Helvetica-Bold')
        .fontSize(11)
        .fillColor(primaryColor)
        .text(bookingRef, 420, cardTop + 35, { align: 'right', width: 115 });

      // 3. Ticket Core Grid (Cinema, Show Date, Time, Seats)
      const gridTop = cardTop + 105;

      // Col 1: Cinema Details
      doc
        .font('Helvetica-Bold')
        .fontSize(9)
        .fillColor(textMuted)
        .text('CINEMA & SCREEN', 60, gridTop);

      doc
        .font('Helvetica-Bold')
        .fontSize(13)
        .fillColor(textDark)
        .text(theatreName, 60, gridTop + 15, { width: 220 });

      doc
        .font('Helvetica')
        .fontSize(9)
        .fillColor('#64748b')
        .text(theatreLocation, 60, gridTop + 32, { width: 220 });

      // Col 2: Date & Showtime
      doc
        .font('Helvetica-Bold')
        .fontSize(9)
        .fillColor(textMuted)
        .text('DATE & TIME', 310, gridTop);

      doc
        .font('Helvetica-Bold')
        .fontSize(13)
        .fillColor(textDark)
        .text(showDate, 310, gridTop + 15);

      doc
        .font('Helvetica-Bold')
        .fontSize(14)
        .fillColor(primaryColor)
        .text(showTime, 310, gridTop + 32);

      // Divider Line
      doc
        .moveTo(60, gridTop + 65)
        .lineTo(515, gridTop + 65)
        .lineWidth(0.8)
        .strokeColor(borderColor)
        .stroke();

      // Row 2: Customer & Seats Details
      const row2Top = gridTop + 75;

      // Seats Block
      doc
        .font('Helvetica-Bold')
        .fontSize(9)
        .fillColor(textMuted)
        .text(`RESERVED SEATS (${seatCount} ${seatCount === 1 ? 'SEAT' : 'SEATS'})`, 60, row2Top);

      doc
        .font('Helvetica-Bold')
        .fontSize(16)
        .fillColor(primaryColor)
        .text(seatsList, 60, row2Top + 16, { width: 220 });

      // Customer Info Block
      doc
        .font('Helvetica-Bold')
        .fontSize(9)
        .fillColor(textMuted)
        .text('TICKET HOLDER', 310, row2Top);

      doc
        .font('Helvetica-Bold')
        .fontSize(12)
        .fillColor(textDark)
        .text(customerName, 310, row2Top + 15, { width: 220 });

      if (customerEmail) {
        doc
          .font('Helvetica')
          .fontSize(9)
          .fillColor('#64748b')
          .text(customerEmail, 310, row2Top + 32, { width: 220 });
      }

      // Divider Line
      doc
        .moveTo(60, row2Top + 60)
        .lineTo(515, row2Top + 60)
        .lineWidth(0.8)
        .strokeColor(borderColor)
        .stroke();

      // Row 3: Payment & Fare Breakdown
      const row3Top = row2Top + 70;

      doc
        .font('Helvetica-Bold')
        .fontSize(10)
        .fillColor(textDark)
        .text('PAYMENT BREAKDOWN (DEMO / SIMULATED)', 60, row3Top);

      const fareY = row3Top + 20;

      // Itemized rows
      doc.font('Helvetica').fontSize(9).fillColor('#475569');
      doc.text(`Ticket Base Fare (${seatCount} seats):`, 60, fareY);
      doc.text(`₹${subtotal.toFixed(2)}`, 430, fareY, { align: 'right', width: 85 });

      doc.text('Convenience Fee:', 60, fareY + 16);
      doc.text(`₹${convenienceFee.toFixed(2)}`, 430, fareY + 16, { align: 'right', width: 85 });

      doc.text('GST (18% on Convenience Fee):', 60, fareY + 32);
      doc.text(`₹${gst.toFixed(2)}`, 430, fareY + 32, { align: 'right', width: 85 });

      // Total Line Box
      doc
        .rect(55, fareY + 48, 465, 26)
        .fill('#f1f5f9');

      doc
        .font('Helvetica-Bold')
        .fontSize(11)
        .fillColor(textDark)
        .text('TOTAL AMOUNT PAID:', 65, fareY + 56);

      doc
        .font('Helvetica-Bold')
        .fontSize(13)
        .fillColor(primaryColor)
        .text(`₹${totalAmount.toFixed(2)}`, 420, fareY + 54, { align: 'right', width: 90 });

      // Payment details subtext
      doc
        .font('Helvetica')
        .fontSize(8)
        .fillColor('#64748b')
        .text(`Payment Mode: ${paymentMethod} • Txn Ref: ${txnId}`, 60, fareY + 82);

      // 4. Perforated Divider Effect
      const tearY = cardTop + 395;
      doc
        .moveTo(40, tearY)
        .lineTo(555, tearY)
        .lineWidth(1)
        .dash(4, { space: 4 })
        .strokeColor('#94a3b8')
        .stroke();
      doc.undash();

      // Half-circle cutouts on left and right for ticket look
      doc.circle(40, tearY, 9).fill('#0b1120');
      doc.circle(555, tearY, 9).fill('#0b1120');

      // 5. Bottom Cinema Pass & Barcode Section
      const bottomY = tearY + 15;

      doc
        .font('Helvetica-Bold')
        .fontSize(9)
        .fillColor(textDark)
        .text('ENTRY PASS • SCAN AT CINEMA AUDITORIUM ENTRANCE', 60, bottomY, {
          width: 475,
          align: 'center',
        });

      // Realistic Vector Barcode Simulation
      const barcodeY = bottomY + 18;
      const barcodeWidths = [
        3, 1, 2, 4, 1, 3, 2, 1, 4, 2, 1, 3, 2, 4, 1, 2, 3, 1, 4, 2, 1, 3, 4, 1, 2, 3,
        1, 2, 4, 3, 1, 2, 1, 4, 2, 3, 1, 4, 2, 1, 3, 2, 4, 1, 3, 2, 1, 4, 2, 3, 1,
      ];
      let barX = 140;
      doc.fillColor('#0f172a');
      for (const w of barcodeWidths) {
        doc.rect(barX, barcodeY, w, 28).fill();
        barX += w + 2;
      }

      doc
        .font('Courier')
        .fontSize(9)
        .fillColor('#64748b')
        .text(`* ${bookingRef} *`, 60, barcodeY + 32, { width: 475, align: 'center' });

      // 6. Footer Terms & Academic Disclaimer
      const footerY = 620;

      doc
        .font('Helvetica-Bold')
        .fontSize(8)
        .fillColor('#475569')
        .text('IMPORTANT GUIDELINES:', 40, footerY);

      doc
        .font('Helvetica')
        .fontSize(7.5)
        .fillColor('#64748b')
        .text(
          '1. Please carry a digital copy of this M-Ticket or a physical printout. Outside food and beverages are not allowed inside auditorium screens.\n' +
          '2. Entry is permitted up to 20 minutes after the scheduled showtime. Patrons must adhere to cinema age ratings (A / UA).\n' +
          '3. Academic Demonstration Notice: This booking and payment were processed in simulated demo mode on the iMovies platform.',
          40,
          footerY + 12,
          { width: 515, lineGap: 2 }
        );

      // Finalize the PDF document
      doc.end();
    } catch (err) {
      reject(err);
    }
  });
};

module.exports = {
  generateTicketPdf,
};

