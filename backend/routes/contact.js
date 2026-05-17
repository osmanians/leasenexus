const express = require('express');
const router = express.Router();
const { sendAutoReply, sendManagementNotification } = require('../services/emailService.js');

router.post('/submit', async (req, res) => {
  const { firstName, lastName, email, phone, message, address, role, service, contactMethod, bestTime } = req.body;

  if (!email || !firstName || !message) {
    return res.status(400).json({ success: false, error: 'Missing required fields' });
  }

  const fullName = `${firstName} ${lastName}`;
  const propertyInterest = address || 'Not specified';

  // Fire-and-forget – send emails in background, respond immediately
  setImmediate(() => {
    sendAutoReply({ name: fullName, email, message }).catch(console.error);
    sendManagementNotification({ name: fullName, email, phone, message, propertyInterest }).catch(console.error);
  });

  res.json({ success: true, message: 'Emails queued' });
});

module.exports = router;