// backend/routes/lead.js
const express = require('express');
const router = express.Router();
const { createClient } = require('@supabase/supabase-js');
const { sendAutoReply, sendManagementNotification } = require('../services/emailService');

// Initialize Supabase
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

router.post('/submit', async (req, res) => {
  try {
    const { type, ...formData } = req.body; // type = 'landlord' or 'tenant'
    
    // 1. Insert into Supabase
    const { data, error } = await supabase
      .from('leads')
      .insert([{ type, ...formData }])
      .select();
    
    if (error) throw error;
    
    // 2. Send emails (non-blocking)
    const fullName = `${formData.first_name} ${formData.last_name}`;
    const message = `New ${type} inquiry:\n${JSON.stringify(formData, null, 2)}`;
    
    // Auto-reply to client
    sendAutoReply({ name: fullName, email: formData.email, message });
    
    // Management notification
    sendManagementNotification({
      name: fullName,
      email: formData.email,
      phone: formData.phone,
      message: `Type: ${type}\nDetails: ${JSON.stringify(formData)}`,
      propertyInterest: formData.property_address || formData.preferred_area || 'N/A'
    });
    
    res.json({ success: true, message: 'Lead saved and emails sent', id: data[0].id });
  } catch (err) {
    console.error('Lead submission error:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;