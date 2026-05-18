// backend/routes/contact.js
// General contact form handler
// Used for generic inquiries and questions

const express = require('express');
const router = express.Router();
const { sendAutoReply, sendManagementNotification } = require('../services/emailService');

/**
 * POST /api/contact/submit
 * Handles general contact form submissions
 * 
 * Expected payload:
 * {
 *   firstName: string,
 *   lastName: string,
 *   email: string,
 *   phone: string,
 *   message: string,
 *   address: string (optional),
 *   role: string (optional) - 'landlord' | 'tenant',
 *   service: string (optional),
 *   contactMethod: string (optional) - 'email' | 'phone' | 'both',
 *   bestTime: string (optional)
 * }
 */
router.post('/submit', async (req, res) => {
  try {
    const {
      firstName,
      lastName,
      email,
      phone,
      message,
      address,
      role,
      service,
      contactMethod,
      bestTime
    } = req.body;

    // Validate required fields
    if (!firstName || !lastName || !email || !message) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: firstName, lastName, email, message'
      });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid email format'
      });
    }

    const fullName = `${firstName} ${lastName}`;
    const propertyInterest = address || 'Not specified';
    const preferredRole = role || 'Not specified';
    const preferredService = service || 'General inquiry';
    const preferredMethod = contactMethod || 'email';
    const bestTimeToContact = bestTime || 'Not specified';

    // Log the contact submission
    console.log(`📧 Contact form submitted: ${fullName} (${email}) - ${preferredRole}`);

    // Send emails in the background (non-blocking)
    // Auto-reply to client
    sendAutoReply({
      name: fullName,
      email: email,
      message: message,
      type: 'contact' // Different from 'landlord'/'tenant' types
    }).catch(err => {
      console.error('Auto-reply email error:', err);
    });

    // Management notification with contact details
    sendManagementNotification({
      name: fullName,
      email: email,
      phone: phone || 'Not provided',
      message: message,
      propertyInterest: propertyInterest,
      type: 'contact',
      leadType: '💬 General Contact Inquiry',
      location: propertyInterest,
      additionalInfo: {
        role: preferredRole,
        service: preferredService,
        contactMethod: preferredMethod,
        bestTime: bestTimeToContact
      }
    }).catch(err => {
      console.error('Management notification error:', err);
    });

    // Return success response immediately (emails send in background)
    res.json({
      success: true,
      message: 'Your message has been received. We will get back to you shortly.',
      timestamp: new Date().toISOString()
    });

  } catch (err) {
    console.error('Contact form submission error:', err);
    res.status(500).json({
      success: false,
      error: err.message || 'An unexpected error occurred while processing your request'
    });
  }
});

module.exports = router;