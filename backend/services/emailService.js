const sgMail = require('@sendgrid/mail');
const apiKey = process.env.SENDGRID_API_KEY;

if (apiKey) {
  sgMail.setApiKey(apiKey);
  console.log('✅ SendGrid initialised');
} else {
  console.warn('⚠️ SENDGRID_API_KEY not set – email disabled');
}

function sendEmailAsync(msg) {
  if (!apiKey) return;
  setImmediate(() => {
    sgMail.send(msg).catch(err => console.error('SendGrid error:', err.response?.body || err.message));
  });
}

// Helper to format a table row
function formatRow(label, value) {
  if (!value || value === 'null' || value === 'undefined') return '';
  return `<tr><td style="padding: 10px; background: #f8fafc; font-weight: 600; width: 35%; border-bottom: 1px solid #e2e8f0;">${label}</td><td style="padding: 10px; border-bottom: 1px solid #e2e8f0;">${value}</td></tr>`;
}

// AUTO-REPLY TO CLIENT (simple, branded)
async function sendAutoReply({ name, email, message }) {
  const html = `
<div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 550px; margin: 0 auto; background: #ffffff; border-radius: 24px; overflow: hidden; box-shadow: 0 10px 25px -5px rgba(0,0,0,0.1);">
  <div style="background: linear-gradient(135deg, #1a365d 0%, #2c5282 100%); padding: 30px 20px; text-align: center;">
    <div style="font-size: 42px; font-weight: 800; color: white;">Lease Nexus</div>
    <div style="font-size: 13px; color: #ecc94b; letter-spacing: 2px;">PROPERTY MANAGEMENT</div>
  </div>
  <div style="padding: 30px 25px;">
    <h2 style="color: #1a365d; margin-top: 0;">Hello ${name},</h2>
    <p style="color: #334155;">Thank you for reaching out to <strong>Lease Nexus</strong>. We have received your inquiry and our team will review it promptly.</p>
    <p style="color: #334155;">We will contact you within 24 hours. In the meantime, feel free to use our ROI calculator.</p>
    <div style="text-align: center; margin: 30px 0;">
      <a href="https://osmanians.github.io/leasenexus/#calculator" style="background: #1a365d; color: white; padding: 10px 24px; border-radius: 40px; text-decoration: none;">Calculate ROI Now</a>
    </div>
    <hr style="border: none; border-top: 1px solid #e2e8f0;">
    <p style="font-size: 12px; color: #64748b;">Lease Nexus Property Management<br>1-800-LEASE-01 | info@leasenexus.com</p>
  </div>
</div>`;
  const msg = { to: email, from: 'desinest.ca@gmail.com', subject: 'Thank you for contacting Lease Nexus', html };
  sendEmailAsync(msg);
}

// MANAGEMENT NOTIFICATION (full details in a clean table)
async function sendManagementNotification({ name, email, phone, message, propertyInterest }) {
  // message is a JSON string from lead.js – we parse it
  let details = {};
  try {
    details = JSON.parse(message);
  } catch(e) {
    details = { raw: message };
  }

  // Build the table rows dynamically
  let rows = '';
  rows += formatRow('Type', details.type === 'landlord' ? '🏢 Landlord Inquiry' : '🏠 Tenant Inquiry');
  rows += formatRow('Full Name', `${details.first_name || ''} ${details.last_name || ''}`.trim() || name);
  rows += formatRow('Email', details.email || email);
  rows += formatRow('Phone', details.phone || phone);
  
  if (details.type === 'landlord') {
    rows += formatRow('Property Address', details.property_address || 'N/A');
  } else {
    rows += formatRow('Preferred Area', details.preferred_area || 'N/A');
  }
  
  rows += formatRow('House Type', details.house_type || 'N/A');
  rows += formatRow('Levels', details.levels || 'N/A');
  if (details.levels && (details.levels === '2' || details.levels === '3')) {
    rows += formatRow('Basement Entrance', details.basement_entrance || 'N/A');
  }
  rows += formatRow('Bedrooms', details.bedrooms || 'N/A');
  rows += formatRow('Bathrooms', details.bathrooms || 'N/A');
  rows += formatRow('Kitchen', details.kitchen || 'N/A');
  rows += formatRow('Garage', details.garage || 'N/A');
  rows += formatRow('Expected Monthly Rent', details.expected_rent ? `$${details.expected_rent}` : 'N/A');
  rows += formatRow('Utilities', details.utilities || 'N/A');

  const html = `
<div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 700px; margin: 0 auto; background: #ffffff; border-radius: 24px; overflow: hidden; box-shadow: 0 10px 25px -5px rgba(0,0,0,0.1);">
  <div style="background: #1a365d; padding: 20px 25px; color: white;">
    <h2 style="margin: 0; font-size: 1.5rem;">Lease Nexus – New Lead</h2>
    <p style="margin: 5px 0 0; color: #ecc94b; font-size: 0.9rem;">${details.type === 'landlord' ? '🏢 Property Management Inquiry' : '🏠 Tenant Inquiry'}</p>
  </div>
  <div style="padding: 20px 25px;">
    <table style="width: 100%; border-collapse: collapse;">
      ${rows}
    </table>
    <div style="margin-top: 20px; padding: 15px; background: #fef9e6; border-left: 4px solid #d69e2e; border-radius: 12px;">
      <strong>⚠️ Action required</strong><br>Please respond to this inquiry within 24 hours to maintain our 98% satisfaction rate.
    </div>
    <hr style="margin: 20px 0; border: none; border-top: 1px solid #e2e8f0;">
    <p style="font-size: 12px; color: #64748b;">This is an automated message from your website backend. Do not reply directly to this email.</p>
  </div>
</div>`;
  const msg = { to: process.env.MANAGEMENT_EMAIL, from: 'desinest.ca@gmail.com', subject: `New Lead: ${name} (${details.type || 'inquiry'})`, html };
  sendEmailAsync(msg);
}

module.exports = { sendAutoReply, sendManagementNotification };