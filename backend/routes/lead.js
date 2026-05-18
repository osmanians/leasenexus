// backend/routes/lead.js
// Enhanced lead submission handler for landlord and tenant inquiries
// Integrates with Supabase and SendGrid for complete lead management

const express = require('express');
const router = express.Router();
const { createClient } = require('@supabase/supabase-js');
const { sendAutoReply, sendManagementNotification } = require('../services/emailService');

// Initialize Supabase client
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

/**
 * POST /api/lead/submit
 * Handles both landlord and tenant lead submissions
 * 
 * Expected payload:
 * {
 *   type: 'landlord' | 'tenant',
 *   first_name: string,
 *   last_name: string,
 *   email: string,
 *   phone: string,
 *   property_address: string (landlord) | preferred_area: string (tenant),
 *   house_type: string,
 *   levels: string,
 *   basement_entrance: string | null,
 *   bedrooms: string,
 *   bathrooms: string,
 *   kitchen: string,
 *   garage: string,
 *   expected_rent: number | null,
 *   utilities: string
 * }
 */
router.post('/submit', async (req, res) => {
  try {
    const { type, ...formData } = req.body;

    // Validate required fields
    if (!type || !['landlord', 'tenant'].includes(type)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid lead type. Must be "landlord" or "tenant"'
      });
    }

    if (!formData.first_name || !formData.last_name || !formData.email || !formData.phone) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: first_name, last_name, email, phone'
      });
    }

    // Validate address/area
    if (type === 'landlord' && !formData.property_address) {
      return res.status(400).json({
        success: false,
        error: 'Property address is required for landlord inquiries'
      });
    }

    if (type === 'tenant' && !formData.preferred_area) {
      return res.status(400).json({
        success: false,
        error: 'Preferred area is required for tenant inquiries'
      });
    }

    // Prepare data for database
    const leadData = {
      type,
      first_name: formData.first_name?.trim() || null,
      last_name: formData.last_name?.trim() || null,
      email: formData.email?.toLowerCase().trim() || null,
      phone: formData.phone?.trim() || null,
      property_address: formData.property_address?.trim() || null,
      preferred_area: formData.preferred_area?.trim() || null,
      house_type: formData.house_type?.trim() || null,
      levels: formData.levels?.toString() || null,
      basement_entrance: formData.basement_entrance?.trim() || null,
      bedrooms: formData.bedrooms?.toString() || null,
      bathrooms: formData.bathrooms?.toString() || null,
      kitchen: formData.kitchen?.toString() || null,
      garage: formData.garage?.trim() || null,
      expected_rent: formData.expected_rent ? parseFloat(formData.expected_rent) : null,
      utilities: formData.utilities?.trim() || null,
      created_at: new Date().toISOString(),
      status: 'new'
    };

    // Insert into Supabase
    const { data, error } = await supabase
      .from('leads')
      .insert([leadData])
      .select();

    if (error) {
      console.error('Supabase error:', error);
      return res.status(500).json({
        success: false,
        error: `Database error: ${error.message}`
      });
    }

    if (!data || data.length === 0) {
      return res.status(500).json({
        success: false,
        error: 'Failed to create lead record'
      });
    }

    const leadId = data[0].id;

    // Send emails asynchronously (non-blocking)
    const fullName = `${formData.first_name} ${formData.last_name}`;
    const leadType = type === 'landlord' ? '🏢 Property Management Inquiry' : '🏠 Tenant Inquiry';
    const location = type === 'landlord' ? formData.property_address : formData.preferred_area;

    // Auto-reply to client
    sendAutoReply({
      name: fullName,
      email: formData.email,
      type: type,
      location: location
    }).catch(err => {
      console.error('Auto-reply email error:', err);
    });

    // Management notification with full lead details
    sendManagementNotification({
      name: fullName,
      email: formData.email,
      phone: formData.phone,
      type: type,
      leadType: leadType,
      location: location,
      leadData: formData,
      leadId: leadId
    }).catch(err => {
      console.error('Management notification error:', err);
    });

    // Return success response immediately (emails send in background)
    res.json({
      success: true,
      message: `${type === 'landlord' ? 'Landlord' : 'Tenant'} inquiry received successfully`,
      leadId: leadId,
      timestamp: new Date().toISOString()
    });

  } catch (err) {
    console.error('Lead submission error:', err);
    res.status(500).json({
      success: false,
      error: err.message || 'An unexpected error occurred'
    });
  }
});

/**
 * GET /api/lead/status/:leadId
 * Optional: Check status of a submitted lead
 */
router.get('/status/:leadId', async (req, res) => {
  try {
    const { leadId } = req.params;

    if (!leadId) {
      return res.status(400).json({
        success: false,
        error: 'Lead ID is required'
      });
    }

    const { data, error } = await supabase
      .from('leads')
      .select('*')
      .eq('id', leadId)
      .single();

    if (error) {
      return res.status(404).json({
        success: false,
        error: 'Lead not found'
      });
    }

    res.json({
      success: true,
      lead: data
    });

  } catch (err) {
    console.error('Lead status check error:', err);
    res.status(500).json({
      success: false,
      error: err.message
    });
  }
});

module.exports = router;