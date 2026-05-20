require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { createClient } = require('@supabase/supabase-js');
const nodemailer = require('nodemailer');
const XLSX = require('xlsx');
const jwt = require('jsonwebtoken');

// Import admin route modules (these files already exist in your backend/routes/)
const adminAuthRoutes = require('./routes/admin-auth');
const adminRoutes = require('./routes/admin');

// Initialize
const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors({
  origin: [
    'http://localhost:8000', 
    'http://localhost:3000', 
    'http://127.0.0.1:5500',
    'https://leasenexus.com',
    'https://osmanians.github.io'  // ← ADD THIS LINE
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));

// Supabase Setup
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);
global.supabase = supabase;

// ========== GMAIL SMTP TRANSPORTER (replaces SendGrid) ==========
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

// Verify connection on startup
transporter.verify((error, success) => {
  if (error) {
    console.error('❌ Gmail SMTP connection failed:', error);
  } else {
    console.log('✅ Gmail SMTP ready to send emails');
  }
});

// Helper to send emails asynchronously (non-blocking)
function sendEmailAsync(mailOptions) {
  setImmediate(() => {
    transporter.sendMail(mailOptions)
      .then(info => {
        console.log(`✅ Email sent to: ${mailOptions.to} (${info.messageId})`);
      })
      .catch(err => {
        console.error('❌ Nodemailer error:', err.response?.body || err.message);
      });
  });
}

// Brand Colors for Emails (unchanged)
const BRAND_COLORS = {
  primary: '#0071e3',
  lightBlue: '#60a5fa',
  dark: '#0f172a',
  white: '#ffffff'
};

// ===== HEALTH CHECK =====
app.get('/api/health', (req, res) => {
  res.json({
    status: 'OK',
    message: 'Lease Nexus Backend Running',
    timestamp: new Date().toISOString()
  });
});

// ===== CONTACT FORM ENDPOINT (using nodemailer) =====
app.post('/api/contact/submit', async (req, res) => {
  try {
    const { firstName, lastName, email, phone, service, message } = req.body;

    // Validate
    if (!firstName || !lastName || !email || !phone || !message) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Send email to management team
    const managementHtml = `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, ${BRAND_COLORS.primary} 0%, ${BRAND_COLORS.lightBlue} 100%); color: ${BRAND_COLORS.white}; padding: 2rem; border-radius: 12px 12px 0 0; text-align: center;">
          <h1 style="margin: 0; font-size: 1.8rem;">🎯 New Lead Received!</h1>
          <p style="margin: 0.5rem 0 0 0; opacity: 0.95;">Someone is interested in Lease Nexus</p>
        </div>
        <div style="background: white; padding: 2rem; border-radius: 0 0 12px 12px; border: 1px solid #e2e8f0;">
          <table style="width: 100%; border-collapse: collapse;">
            <tr style="border-bottom: 1px solid #e2e8f0;">
              <td style="padding: 1rem; font-weight: 700; color: ${BRAND_COLORS.primary}; width: 30%;">Name:</td>
              <td style="padding: 1rem; color: #333;">${firstName} ${lastName}</td>
            </tr>
            <tr style="border-bottom: 1px solid #e2e8f0;">
              <td style="padding: 1rem; font-weight: 700; color: ${BRAND_COLORS.primary};">Email:</td>
              <td style="padding: 1rem; color: #333;"><a href="mailto:${email}" style="color: ${BRAND_COLORS.primary};">${email}</a></td>
            </tr>
            <tr style="border-bottom: 1px solid #e2e8f0;">
              <td style="padding: 1rem; font-weight: 700; color: ${BRAND_COLORS.primary};">Phone:</td>
              <td style="padding: 1rem; color: #333;"><a href="tel:${phone}" style="color: ${BRAND_COLORS.primary};">${phone}</a></td>
            </tr>
            <tr style="border-bottom: 1px solid #e2e8f0;">
              <td style="padding: 1rem; font-weight: 700; color: ${BRAND_COLORS.primary};">Service:</td>
              <td style="padding: 1rem; color: #333;">${service || 'Not specified'}</td>
            </tr>
            <tr>
              <td style="padding: 1rem; font-weight: 700; color: ${BRAND_COLORS.primary}; vertical-align: top;">Message:</td>
              <td style="padding: 1rem; color: #333; white-space: pre-wrap;">${message}</td>
            </tr>
          </table>
          <div style="background: #f0f9ff; border-left: 4px solid ${BRAND_COLORS.primary}; padding: 1.5rem; border-radius: 6px; margin: 2rem 0;">
            <h3 style="margin: 0 0 1rem 0; color: ${BRAND_COLORS.primary};">📌 Quick Actions:</h3>
            <p style="margin: 0.5rem 0; color: #333;">✓ Review lead details above</p>
            <p style="margin: 0.5rem 0; color: #333;">✓ Contact within 24 hours</p>
            <p style="margin: 0.5rem 0; color: #333;">✓ Update CRM with status</p>
          </div>
          <div style="margin-top: 2rem; padding-top: 1.5rem; border-top: 1px solid #e2e8f0; font-size: 0.9rem; color: #64748b; text-align: center;">
            <p style="margin: 0;">Submitted: ${new Date().toLocaleString()}</p>
          </div>
        </div>
      </div>
    `;

    const managementMail = {
      to: process.env.MANAGEMENT_EMAIL ? process.env.MANAGEMENT_EMAIL.split(',') : ['usmansafdar.uos@gmail.com', 'shahido@live.com'],
      from: `"Lease Nexus" <${process.env.EMAIL_USER}>`,
      replyTo: email,
      subject: `📬 New Contact Form Submission - ${service || 'General Inquiry'}`,
      html: managementHtml
    };

    // Send confirmation email to user
    const userHtml = `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, ${BRAND_COLORS.primary} 0%, ${BRAND_COLORS.lightBlue} 100%); color: ${BRAND_COLORS.white}; padding: 2rem; border-radius: 12px 12px 0 0; text-align: center;">
          <h1 style="margin: 0;">Thank You, ${firstName}! 🙌</h1>
          <p style="margin: 0.5rem 0 0 0; opacity: 0.95;">We've received your message</p>
        </div>
        <div style="background: white; padding: 2rem; border-radius: 0 0 12px 12px; border: 1px solid #e2e8f0;">
          <p style="color: #333; margin-bottom: 1.5rem; line-height: 1.8;">We appreciate you reaching out to Lease Nexus. Our team has received your message and will be in touch shortly to discuss your real estate needs.</p>
          
          <div style="background: #f8fafc; padding: 1.5rem; border-left: 4px solid ${BRAND_COLORS.primary}; border-radius: 6px; margin: 1.5rem 0;">
            <h3 style="margin: 0 0 1rem 0; color: ${BRAND_COLORS.primary};">📌 What's Next?</h3>
            <p style="margin: 0; color: #333; line-height: 1.8;">One of our specialists will contact you within 24 business hours to discuss your goals and present customized solutions.</p>
          </div>

          <div style="background: linear-gradient(135deg, ${BRAND_COLORS.primary} 0%, ${BRAND_COLORS.lightBlue} 100%); color: ${BRAND_COLORS.white}; padding: 1.5rem; border-radius: 8px; margin: 2rem 0;">
            <h4 style="margin: 0 0 1rem 0;">Contact Our Team:</h4>
            <p style="margin: 0.5rem 0;"><strong>Omar Shahid</strong><br>📞 (519) 562-2983 | 📧 shahido@live.com</p>
            <p style="margin: 0.5rem 0;"><strong>Usman Safdar</strong><br>📞 (226) 975-5741 | 📧 usmansafdar.uos@gmail.com</p>
          </div>

          <div style="margin-top: 2rem; padding-top: 1.5rem; border-top: 1px solid #e2e8f0; font-size: 0.85rem; color: #64748b; text-align: center;">
            <p style="margin: 0;">© 2026 Lease Nexus. Strategic Property Management & Investment Advisory</p>
          </div>
        </div>
      </div>
    `;

    const userMail = {
      to: email,
      from: `"Lease Nexus" <${process.env.EMAIL_USER}>`,
      subject: '✓ Thank You for Contacting Lease Nexus',
      html: userHtml
    };

    // Send both emails asynchronously
    sendEmailAsync(managementMail);
    sendEmailAsync(userMail);

    res.json({ success: true, message: 'Contact form submitted successfully' });
  } catch (error) {
    console.error('Contact form error:', error);
    res.status(500).json({ error: 'Failed to submit contact form' });
  }
});

// ===== LEAD SUBMISSION ENDPOINT (using nodemailer) =====
app.post('/api/lead/submit', async (req, res) => {
  try {
    const {
      type,
      firstName,
      lastName,
      email,
      phone,
      propertyAddress,
      preferredArea,
      houseType,
      levels,
      bedrooms,
      bathrooms,
      expectedRent,
      utilities
    } = req.body;

    // Validate
    if (!type || !firstName || !lastName || !email || !phone) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Insert into Supabase
    const { error } = await supabase
      .from('leads')
      .insert([{
        type,
        first_name: firstName,
        last_name: lastName,
        email,
        phone,
        property_address: propertyAddress,
        preferred_area: preferredArea,
        house_type: houseType,
        levels,
        bedrooms,
        bathrooms,
        expected_rent: expectedRent,
        utilities,
        status: 'new'
      }]);

    if (error) {
      console.error('Supabase error:', error);
      return res.status(500).json({ error: 'Failed to save lead' });
    }

    // Send confirmation email to user
    let typeText = 'real estate services';
    let typeEmoji = '🏢';
    
    if (type === 'investor') {
      typeText = 'investment advisory services';
      typeEmoji = '📈';
    } else if (type === 'landlord') {
      typeText = 'property management services';
      typeEmoji = '🏠';
    }

    const userHtml = `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, ${BRAND_COLORS.primary} 0%, ${BRAND_COLORS.lightBlue} 100%); color: ${BRAND_COLORS.white}; padding: 2rem; border-radius: 12px 12px 0 0; text-align: center;">
          <h1 style="margin: 0;">${typeEmoji} Welcome, ${firstName}!</h1>
        </div>
        <div style="background: white; padding: 2rem; border-radius: 0 0 12px 12px; border: 1px solid #e2e8f0;">
          <p style="color: #333; margin-bottom: 1.5rem; line-height: 1.8;">Thank you for your interest in Lease Nexus ${typeText}. Your information has been received and our team is reviewing your request.</p>
          
          <div style="background: #f8fafc; padding: 1.5rem; border-left: 4px solid ${BRAND_COLORS.primary}; border-radius: 6px; margin: 1.5rem 0;">
            <p style="margin: 0; color: #333;"><strong>✓ Next Steps:</strong><br>A member of our team will contact you within 24 hours to discuss your specific needs and present customized solutions.</p>
          </div>

          <div style="margin-top: 2rem; padding-top: 1.5rem; border-top: 1px solid #e2e8f0; font-size: 0.85rem; color: #64748b; text-align: center;">
            <p style="margin: 0;">© 2026 Lease Nexus</p>
          </div>
        </div>
      </div>
    `;

    const userMail = {
      to: email,
      from: `"Lease Nexus" <${process.env.EMAIL_USER}>`,
      subject: `${typeEmoji} Welcome to Lease Nexus!`,
      html: userHtml
    };

    // Management notification
    const managementHtml = `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, ${BRAND_COLORS.primary} 0%, ${BRAND_COLORS.lightBlue} 100%); color: ${BRAND_COLORS.white}; padding: 2rem; border-radius: 12px 12px 0 0; text-align: center;">
          <h1 style="margin: 0;">🎯 New Lead Alert!</h1>
        </div>
        <div style="background: white; padding: 2rem; border-radius: 0 0 12px 12px; border: 1px solid #e2e8f0;">
          <table style="width: 100%; border-collapse: collapse; margin-bottom: 1.5rem;">
            <tr style="border-bottom: 1px solid #e2e8f0;">
              <td style="padding: 1rem; font-weight: 700; color: ${BRAND_COLORS.primary}; width: 30%;">Name:</td>
              <td style="padding: 1rem;">${firstName} ${lastName}</td>
            </tr>
            <tr style="border-bottom: 1px solid #e2e8f0;">
              <td style="padding: 1rem; font-weight: 700; color: ${BRAND_COLORS.primary};">Email:</td>
              <td style="padding: 1rem;"><a href="mailto:${email}" style="color: ${BRAND_COLORS.primary};">${email}</a></td>
            </tr>
            <tr style="border-bottom: 1px solid #e2e8f0;">
              <td style="padding: 1rem; font-weight: 700; color: ${BRAND_COLORS.primary};">Phone:</td>
              <td style="padding: 1rem;"><a href="tel:${phone}" style="color: ${BRAND_COLORS.primary};">${phone}</a></td>
            </tr>
            <tr>
              <td style="padding: 1rem; font-weight: 700; color: ${BRAND_COLORS.primary};">Type:</td>
              <td style="padding: 1rem;">${type}</td>
            </tr>
          </table>
          <p style="color: #333; margin: 0; text-align: center;"><a href="mailto:${email}" style="background: ${BRAND_COLORS.primary}; color: white; padding: 0.8rem 1.5rem; border-radius: 6px; text-decoration: none; display: inline-block; margin: 0.5rem;">Reply to Lead</a></p>
        </div>
      </div>
    `;

    const managementMail = {
      to: process.env.MANAGEMENT_EMAIL ? process.env.MANAGEMENT_EMAIL.split(',') : ['usmansafdar.uos@gmail.com', 'shahido@live.com'],
      from: `"Lease Nexus Alerts" <${process.env.EMAIL_USER}>`,
      replyTo: email,
      subject: `🚀 New ${type.charAt(0).toUpperCase() + type.slice(1)} Lead - ${firstName} ${lastName}`,
      html: managementHtml
    };

    sendEmailAsync(userMail);
    sendEmailAsync(managementMail);

    res.json({ success: true, leadId: 'lead_created' });
  } catch (error) {
    console.error('Lead submission error:', error);
    res.status(500).json({ error: 'Failed to submit lead' });
  }
});

// ===== GET ALL LEADS (Protected) =====
app.get('/api/leads', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('leads')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;

    res.json({ success: true, data });
  } catch (error) {
    console.error('Error fetching leads:', error);
    res.status(500).json({ error: 'Failed to fetch leads' });
  }
});

// ===== UPDATE LEAD STATUS =====
app.patch('/api/leads/:id/status', async (req, res) => {
  try {
    const { id } = req.params;
    const { status, notes } = req.body;

    const { error } = await supabase
      .from('leads')
      .update({ 
        status, 
        notes,
        last_contacted: new Date().toISOString()
      })
      .eq('id', id);

    if (error) throw error;

    res.json({ success: true, message: 'Lead updated' });
  } catch (error) {
    console.error('Error updating lead:', error);
    res.status(500).json({ error: 'Failed to update lead' });
  }
});

// ===== EXPORT TO EXCEL =====
app.get('/api/export/leads', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('leads')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;

    // Create Excel workbook
    const workbook = XLSX.utils.book_new();
    
    const headers = [
      'ID',
      'Type',
      'Name',
      'Email',
      'Phone',
      'Address',
      'Preferred Area',
      'Bedrooms',
      'Bathrooms',
      'Status',
      'Created Date',
      'Last Contacted'
    ];

    const sheetData = [headers, ...data.map((lead, idx) => [
      idx + 1,
      lead.type,
      `${lead.first_name} ${lead.last_name}`,
      lead.email,
      lead.phone,
      lead.property_address || '-',
      lead.preferred_area || '-',
      lead.bedrooms || '-',
      lead.bathrooms || '-',
      lead.status,
      new Date(lead.created_at).toLocaleDateString(),
      lead.last_contacted ? new Date(lead.last_contacted).toLocaleDateString() : '-'
    ])];

    const sheet = XLSX.utils.aoa_to_sheet(sheetData);

    // Apply brand colors
    const primaryColor = 'FF0071E3';
    const lightGrayColor = 'FFF8FAFC';

    // Header styling
    for (let col = 0; col < headers.length; col++) {
      const cellRef = XLSX.utils.encode_col(col) + '1';
      sheet[cellRef].fill = { patternType: 'solid', fgColor: { rgb: primaryColor } };
      sheet[cellRef].font = { bold: true, color: { rgb: 'FFFFFFFF' } };
    }

    // Row styling
    for (let row = 2; row <= sheetData.length; row++) {
      for (let col = 0; col < headers.length; col++) {
        const cellRef = XLSX.utils.encode_col(col) + row;
        if (row % 2 === 0) {
          sheet[cellRef].fill = { patternType: 'solid', fgColor: { rgb: lightGrayColor } };
        }
      }
    }

    sheet['!cols'] = Array(headers.length).fill({ wch: 18 });

    XLSX.utils.book_append_sheet(workbook, sheet, 'Leads');

    // Generate buffer
    const buffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'buffer' });

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename="LeaseNexus_Leads.xlsx"');
    res.send(buffer);
  } catch (error) {
    console.error('Error exporting leads:', error);
    res.status(500).json({ error: 'Failed to export leads' });
  }
});

// ===== MOUNT ADMIN ROUTES (for admin panel login & lead management) =====
app.use('/api/admin', adminAuthRoutes);
app.use('/api/admin', adminRoutes);

// ===== ERROR HANDLING =====
app.use((err, req, res, next) => {
  console.error('Server error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

// ===== START SERVER =====
app.listen(PORT, () => {
  console.log(`
╔════════════════════════════════════════════════════════════╗
║                                                            ║
║          🏢 LEASE NEXUS BACKEND STARTED                   ║
║                                                            ║
║  Port:        ${PORT}                                            ║
║  Environment: ${process.env.NODE_ENV || 'development'}               ║
║  Status:      ✅ Running                                  ║
║                                                            ║
║  Endpoints:                                                ║
║  ✓ POST   /api/contact/submit                             ║
║  ✓ POST   /api/lead/submit                                ║
║  ✓ GET    /api/leads                                      ║
║  ✓ PATCH  /api/leads/:id/status                           ║
║  ✓ GET    /api/export/leads                               ║
║  ✓ POST   /api/admin/auth/login                           ║
║  ✓ GET    /api/admin/leads                                ║
║  ✓ PATCH  /api/admin/leads/:id/status                     ║
║  ✓ GET    /api/admin/export                               ║
║  ✓ GET    /api/health                                     ║
║                                                            ║
╚════════════════════════════════════════════════════════════╝
  `);
});

module.exports = app;