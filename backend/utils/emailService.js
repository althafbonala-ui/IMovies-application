const nodemailer = require('nodemailer');
const Booking = require('../models/Booking');
const { generateTicketPdf } = require('./ticketPdfGenerator');

/**
 * Checks whether valid SMTP credentials are configured in environment variables
 * @returns {boolean}
 */
const isSmtpConfigured = () => {
  const host = process.env.SMTP_HOST;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  if (!host || !user || !pass) return false;

  const isPlaceholder =
    user.includes('your-email') ||
    user.includes('your_email') ||
    pass.includes('your_smtp') ||
    pass.includes('your-smtp');

  return !isPlaceholder;
};

/**
 * Creates Nodemailer Transporter based on environment variables
 */
const createTransporter = () => {
  if (!isSmtpConfigured()) {
    return null;
  }

  return nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT, 10) || 587,
    secure: process.env.SMTP_SECURE === 'true',
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
    connectionTimeout: 10000,
    greetingTimeout: 10000,
    socketTimeout: 15000,
  });
};

/**
 * Generates clean, responsive HTML Email Template inspired by cinema booking confirmation
 * Uses inline CSS for universal email client compatibility.
 *
 * @param {Object} data
 * @returns {string} HTML string
 */
const buildBookingConfirmationHtml = ({
  customerName,
  movieTitle,
  movieFormat,
  movieCert,
  theatreName,
  theatreLocation,
  showDate,
  showTime,
  seatsList,
  seatCount,
  bookingRef,
  totalAmount,
  paymentMethod,
  demoTransactionId,
}) => {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Booking Confirmed - ${bookingRef}</title>
</head>
<body style="margin: 0; padding: 0; background-color: #050811; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #f8fafc;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #050811; padding: 30px 10px;">
    <tr>
      <td align="center">
        <!-- Main Email Container -->
        <table role="presentation" width="100%" style="max-width: 600px; background-color: #0d1527; border-radius: 12px; overflow: hidden; border: 1px solid rgba(255,255,255,0.1); box-shadow: 0 10px 30px rgba(0,0,0,0.5);" cellspacing="0" cellpadding="0">
          
          <!-- Top Header Brand Ribbon -->
          <tr>
            <td style="background-color: #070c18; padding: 24px 32px; border-bottom: 3px solid #f84464;">
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                <tr>
                  <td>
                    <span style="font-size: 24px; font-weight: 900; letter-spacing: 1px; color: #f84464;">iMOVIES</span>
                    <span style="font-size: 13px; font-weight: 700; letter-spacing: 3px; color: #94a3b8; margin-left: 6px;">CINEMAS</span>
                  </td>
                  <td align="right">
                    <span style="display: inline-block; background-color: rgba(16, 185, 129, 0.15); border: 1px solid #10b981; color: #10b981; padding: 5px 12px; border-radius: 20px; font-size: 11px; font-weight: 700; letter-spacing: 0.5px;">
                      ✓ CONFIRMED
                    </span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Hero Heading & Greeting -->
          <tr>
            <td style="padding: 32px 32px 20px 32px; text-align: center;">
              <div style="display: inline-block; width: 56px; height: 56px; line-height: 56px; background-color: rgba(16, 185, 129, 0.15); border: 2px solid #10b981; border-radius: 50%; font-size: 26px; color: #10b981; margin-bottom: 16px;">
                ✓
              </div>
              <h1 style="margin: 0 0 8px 0; font-size: 26px; font-weight: 800; color: #ffffff; letter-spacing: -0.5px;">
                Booking Confirmed!
              </h1>
              <p style="margin: 0; font-size: 15px; color: #94a3b8; line-height: 1.5;">
                Hello <strong style="color: #ffffff;">${customerName}</strong>, your movie tickets have been confirmed in the iMovies system.
              </p>
            </td>
          </tr>

          <!-- E-Ticket Card Summary -->
          <tr>
            <td style="padding: 0 32px 24px 32px;">
              <table role="presentation" width="100%" style="background: linear-gradient(145deg, #131c31 0%, #0d1424 100%); border-radius: 10px; border: 1px solid rgba(248, 68, 100, 0.35); overflow: hidden;" cellspacing="0" cellpadding="0">
                
                <!-- Ticket Header: Movie Title -->
                <tr>
                  <td style="padding: 20px 24px; border-bottom: 1px dashed rgba(255,255,255,0.15);">
                    <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                      <tr>
                        <td>
                          <h2 style="margin: 0 0 6px 0; font-size: 20px; font-weight: 800; color: #ffffff;">
                            ${movieTitle}
                          </h2>
                          <span style="font-size: 12px; font-weight: 700; color: #f84464;">${movieFormat}</span>
                          <span style="color: #64748b; font-size: 12px;"> • Certification: ${movieCert}</span>
                        </td>
                        <td align="right" valign="top">
                          <span style="font-size: 10px; color: #94a3b8; display: block; font-family: monospace;">BOOKING ID</span>
                          <span style="font-size: 13px; font-weight: 700; color: #f84464; font-family: monospace;">${bookingRef}</span>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>

                <!-- Ticket Grid Info -->
                <tr>
                  <td style="padding: 20px 24px;">
                    <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                      <tr>
                        <td width="50%" valign="top" style="padding-bottom: 16px;">
                          <span style="font-size: 11px; text-transform: uppercase; color: #94a3b8; font-weight: 600; display: block; margin-bottom: 4px;">Cinema</span>
                          <strong style="font-size: 14px; color: #ffffff; display: block;">${theatreName}</strong>
                          <span style="font-size: 11px; color: #64748b; display: block; margin-top: 2px;">${theatreLocation}</span>
                        </td>
                        <td width="50%" valign="top" align="right" style="padding-bottom: 16px;">
                          <span style="font-size: 11px; text-transform: uppercase; color: #94a3b8; font-weight: 600; display: block; margin-bottom: 4px;">Show Date & Time</span>
                          <strong style="font-size: 14px; color: #ffffff; display: block;">${showDate}</strong>
                          <span style="font-size: 13px; font-weight: 700; color: #fbbf24; display: block; margin-top: 2px;">${showTime}</span>
                        </td>
                      </tr>
                      <tr>
                        <td width="50%" valign="top">
                          <span style="font-size: 11px; text-transform: uppercase; color: #94a3b8; font-weight: 600; display: block; margin-bottom: 4px;">Seats (${seatCount} ${seatCount === 1 ? 'Seat' : 'Seats'})</span>
                          <strong style="font-size: 16px; color: #f84464; font-family: monospace;">${seatsList}</strong>
                        </td>
                        <td width="50%" valign="top" align="right">
                          <span style="font-size: 11px; text-transform: uppercase; color: #94a3b8; font-weight: 600; display: block; margin-bottom: 4px;">Amount Paid (Demo)</span>
                          <strong style="font-size: 18px; color: #ffffff;">₹${totalAmount.toFixed(2)}</strong>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>

                <!-- Demo Payment Note inside card -->
                <tr>
                  <td style="padding: 12px 24px; background-color: rgba(0,0,0,0.25); border-top: 1px solid rgba(255,255,255,0.06); font-size: 11px; color: #94a3b8;">
                    <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                      <tr>
                        <td>
                          <span>Payment Method: <strong style="color: #cbd5e1;">${paymentMethod}</strong></span>
                        </td>
                        <td align="right">
                          <span>Ref: <code style="color: #38bdf8;">${demoTransactionId}</code></span>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>

              </table>
            </td>
          </tr>

          <!-- PDF Attachment Notice Box -->
          <tr>
            <td style="padding: 0 32px 24px 32px;">
              <table role="presentation" width="100%" style="background-color: rgba(248, 68, 100, 0.08); border: 1px solid rgba(248, 68, 100, 0.25); border-radius: 8px; padding: 14px 18px;" cellspacing="0" cellpadding="0">
                <tr>
                  <td width="36" valign="middle">
                    <span style="font-size: 24px;">🎟️</span>
                  </td>
                  <td valign="middle">
                    <strong style="font-size: 13px; color: #ffffff; display: block;">PDF Movie Ticket Attached</strong>
                    <span style="font-size: 12px; color: #94a3b8;">
                      Your official e-ticket <code>imovies-ticket-${bookingRef}.pdf</code> is attached to this email. You can present this PDF on your mobile device at the cinema entrance.
                    </span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Guidelines & Academic Simulation Notice -->
          <tr>
            <td style="padding: 0 32px 32px 32px;">
              <p style="margin: 0 0 10px 0; font-size: 12px; font-weight: 700; color: #cbd5e1; text-transform: uppercase; letter-spacing: 0.5px;">
                Important Cinema Guidelines:
              </p>
              <ul style="margin: 0; padding-left: 18px; font-size: 12px; color: #94a3b8; line-height: 1.6;">
                <li>Please arrive at least 15 minutes before the showtime for security screening.</li>
                <li>Outside food and beverages are not allowed inside cinema auditorium halls.</li>
                <li>Age-restricted features (A / UA) require age verification at the gate.</li>
              </ul>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color: #070c18; padding: 20px 32px; border-top: 1px solid rgba(255,255,255,0.08); text-align: center;">
              <p style="margin: 0 0 6px 0; font-size: 11px; color: #64748b;">
                Simulated academic project demonstration • No real financial transactions were executed.
              </p>
              <p style="margin: 0; font-size: 11px; color: #475569;">
                © 2026 iMovies Application. All rights reserved.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim();
};

/**
 * Dispatches a booking confirmation email with attached PDF ticket.
 * Implements atomic database claim to guarantee duplicate-prevention under concurrent requests.
 * Safely handles SMTP errors without affecting confirmed booking status.
 *
 * @param {string|mongoose.Types.ObjectId} bookingId
 * @returns {Promise<{ success: boolean, status: string, error?: string, skipped?: boolean }>}
 */
const sendBookingConfirmationEmail = async (bookingId) => {
  try {
    if (!bookingId) {
      return { success: false, status: 'failed', error: 'Missing booking ID.' };
    }

    // ATOMIC CLAIM: Atomically find booking that is confirmed, paid, and has email status in ['pending', 'failed']
    // Updates status to 'processing' in one single atomic operation, preventing race conditions!
    const claimedBooking = await Booking.findOneAndUpdate(
      {
        _id: bookingId,
        status: 'confirmed',
        paymentStatus: 'paid',
        'emailDelivery.status': { $in: ['pending', 'failed'] },
      },
      {
        $set: {
          'emailDelivery.status': 'processing',
          'emailDelivery.lastAttemptAt': new Date(),
        },
        $inc: { 'emailDelivery.attempts': 1 },
      },
      { new: true }
    )
      .populate('movie', 'title certification formats duration')
      .populate('theatre', 'name location city badge')
      .populate('user', 'name email');

    if (!claimedBooking) {
      // Either booking does not exist, is not paid/confirmed, or was already claimed/sent
      const existing = await Booking.findById(bookingId).select('status paymentStatus emailDelivery');
      if (existing?.emailDelivery?.status === 'sent') {
        return { success: true, status: 'sent', skipped: true, reason: 'Confirmation email already sent.' };
      }
      if (existing?.emailDelivery?.status === 'processing') {
        return { success: false, status: 'processing', skipped: true, reason: 'Email delivery already in progress.' };
      }
      return {
        success: false,
        status: existing?.emailDelivery?.status || 'failed',
        skipped: true,
        reason: 'Booking is not eligible for confirmation email (must be confirmed & paid).',
      };
    }

    const recipientEmail = claimedBooking.user?.email;
    const customerName = claimedBooking.user?.name || 'Valued Customer';

    if (!recipientEmail || !/^\S+@\S+\.\S+$/.test(recipientEmail)) {
      console.warn(`[EmailService] Missing or invalid recipient email for booking ${claimedBooking.bookingRef}`);
      await Booking.updateOne(
        { _id: claimedBooking._id },
        {
          $set: {
            'emailDelivery.status': 'failed',
            'emailDelivery.error': 'User does not have a valid registered email address.',
          },
        }
      );
      return { success: false, status: 'failed', error: 'Invalid recipient email.' };
    }

    // 1. Generate in-memory PDF Ticket Buffer
    let pdfBuffer;
    try {
      pdfBuffer = await generateTicketPdf(claimedBooking);
    } catch (pdfErr) {
      console.error(`[EmailService] Error generating ticket PDF for ${claimedBooking.bookingRef}:`, pdfErr.message);
      await Booking.updateOne(
        { _id: claimedBooking._id },
        {
          $set: {
            'emailDelivery.status': 'failed',
            'emailDelivery.error': `PDF generation error: ${pdfErr.message}`,
          },
        }
      );
      return { success: false, status: 'failed', error: 'PDF generation failed.' };
    }

    // 2. Build HTML Template
    const seatsList = Array.isArray(claimedBooking.seats)
      ? claimedBooking.seats.join(', ')
      : claimedBooking.seats || 'General';
    const seatCount = claimedBooking.seatCount || (Array.isArray(claimedBooking.seats) ? claimedBooking.seats.length : 1);

    const htmlContent = buildBookingConfirmationHtml({
      customerName,
      movieTitle: claimedBooking.movie?.title || 'Featured Movie',
      movieFormat: claimedBooking.format || '2D',
      movieCert: claimedBooking.movie?.certification || 'UA',
      theatreName: claimedBooking.theatre?.name || 'Cinema Hall',
      theatreLocation: claimedBooking.theatre?.location || 'Cinema Complex',
      showDate: claimedBooking.showDate,
      showTime: claimedBooking.showTime,
      seatsList,
      seatCount,
      bookingRef: claimedBooking.bookingRef,
      totalAmount: claimedBooking.totalAmount || 0,
      paymentMethod: claimedBooking.paymentMethod || 'Demo Payment (Simulated)',
      demoTransactionId: claimedBooking.demoTransactionId || 'DEMO-TXN-VERIFIED',
    });

    // 3. Handle Delivery Mode: Real SMTP vs Safe Development Mode
    const smtpConfigured = isSmtpConfigured();

    if (!smtpConfigured) {
      // Safe Development Mode:
      // SMTP credentials not provided. Log clean notice without failing confirmed booking.
      console.log(
        `[EmailService] (Safe Development Mode) SMTP credentials not configured in backend/.env.\n` +
        `  -> Booking Ref: ${claimedBooking.bookingRef}\n` +
        `  -> Recipient: ${recipientEmail}\n` +
        `  -> Generated Ticket PDF Size: ${pdfBuffer.length} bytes\n` +
        `  -> Delivery marked as 'pending' (Awaiting SMTP configuration).`
      );

      // We mark status as 'pending' so frontend accurately reflects it was not dispatched yet
      await Booking.updateOne(
        { _id: claimedBooking._id },
        {
          $set: {
            'emailDelivery.status': 'pending',
            'emailDelivery.recipientEmail': recipientEmail,
            'emailDelivery.error': 'SMTP credentials not configured in backend environment.',
          },
        }
      );

      return {
        success: true,
        status: 'pending',
        isDevMode: true,
        message: 'Safe development mode: PDF generated and email preview compiled.',
      };
    }

    // Real SMTP Mode:
    const transporter = createTransporter();
    const mailOptions = {
      from: process.env.EMAIL_FROM || `"iMovies Cinemas" <${process.env.SMTP_USER}>`,
      to: recipientEmail,
      subject: `Booking Confirmed! [${claimedBooking.bookingRef}] - ${claimedBooking.movie?.title || 'Movie Tickets'}`,
      html: htmlContent,
      attachments: [
        {
          filename: `imovies-ticket-${claimedBooking.bookingRef}.pdf`,
          content: pdfBuffer,
          contentType: 'application/pdf',
        },
      ],
    };

    const info = await transporter.sendMail(mailOptions);
    console.log(
      `[EmailService] ✓ Confirmation email sent for booking ${claimedBooking.bookingRef} to ${recipientEmail} (Message ID: ${info.messageId})`
    );

    // Update database atomically to 'sent'
    await Booking.updateOne(
      { _id: claimedBooking._id },
      {
        $set: {
          'emailDelivery.status': 'sent',
          'emailDelivery.sentAt': new Date(),
          'emailDelivery.recipientEmail': recipientEmail,
          'emailDelivery.error': '',
        },
      }
    );

    return {
      success: true,
      status: 'sent',
      messageId: info.messageId,
    };
  } catch (deliveryError) {
    // Catch SMTP delivery failures safely: NEVER affect the confirmed booking or seats
    console.error(`[EmailService] ⚠️ SMTP delivery failed for booking ID ${bookingId}:`, deliveryError.message);

    await Booking.updateOne(
      { _id: bookingId },
      {
        $set: {
          'emailDelivery.status': 'failed',
          'emailDelivery.error': deliveryError.message || 'SMTP delivery failed',
          'emailDelivery.lastAttemptAt': new Date(),
        },
      }
    ).catch(() => {});

    return {
      success: false,
      status: 'failed',
      error: deliveryError.message,
    };
  }
};

module.exports = {
  isSmtpConfigured,
  sendBookingConfirmationEmail,
  buildBookingConfirmationHtml,
};

