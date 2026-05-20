// backend/services/emailService.js
const nodemailer = require('nodemailer');

// Create transporter using Gmail SMTP with optimized settings for Render
const transporter = nodemailer.createTransport({
  host: 'smtp.gmail.com',
  port: 465,
  secure: true, // true for 465, false for 587
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  },
  timeout: 60000, // 60 seconds timeout (increased)
  connectionTimeout: 60000,
  socketTimeout: 60000,
  logger: false, // Set to true for debugging
  debug: false
});

// Verify connection on startup (non-blocking)
transporter.verify((error, success) => {
  if (error) {
    console.error('❌ Gmail SMTP connection failed:', error.message);
    console.error('⚠️ Will retry on each email send');
  } else {
    console.log('✅ Gmail SMTP ready to send emails');
  }
});

// Brand Colors for Emails (unchanged)
const BRAND_COLORS = {
  primary: '#0071e3',
  lightBlue: '#60a5fa',
  dark: '#0f172a',
  white: '#ffffff'
};

/**
 * Send email with retry logic
 */
async function sendEmailWithRetry(msg, maxRetries = 3) {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const info = await transporter.sendMail(msg);
      console.log(`✅ Email sent to: ${msg.to} (Attempt ${attempt})`, info.messageId);
      return true;
    } catch (err) {
      console.error(`❌ Attempt ${attempt} failed for ${msg.to}:`, err.message);
      
      if (attempt === maxRetries) {
        console.error(`❌ All ${maxRetries} attempts failed for ${msg.to}`);
        return false;
      }
      
      // Wait 2 seconds before retry
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
  }
  return false;
}

/**
 * Send email asynchronously in the background
 */
function sendEmailAsync(msg) {
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
    console.warn('📧 Email service disabled – no Gmail credentials');
    return;
  }

  setImmediate(async () => {
    await sendEmailWithRetry(msg);
  });
}

/**
 * Format table row for email
 */
function formatRow(label, value) {
  if (!value || value === 'null' || value === 'undefined' || value === null) return '';
  
  return `
    <tr>
      <td style="padding: 10px 12px; background: #f8fafc; font-weight: 600; width: 35%; border-bottom: 1px solid #e2e8f0; color: #0f172a;">
        ${label}
       </td>
      <td style="padding: 10px 12px; border-bottom: 1px solid #e2e8f0; color: #64748b;">
        ${value}
       </td>
     </tr>
  `;
}

/**
 * Send auto-reply to client
 */
async function sendAutoReply({ name, email, type, location }) {
  try {
    let subject = 'Thank You for Contacting Lease Nexus';
    let headerText = 'We Received Your Inquiry';
    let bodyText = 'Thank you for reaching out to Lease Nexus.';
    let actionLink = 'https://leasenexus.onrender.com/';
    let actionText = 'View Your Estimate';

    if (type === 'landlord') {
      headerText = 'We Received Your Property Inquiry';
      bodyText = `Thank you for submitting your property at <strong>${location}</strong>. Our team will review your details and contact you soon.`;
      subject = 'Property Inquiry Received - Lease Nexus';
      actionLink = 'https://osmanians.github.io/leasenexus/index.html#services';
      actionText = 'Check Our Services';
    } else if (type === 'tenant') {
      headerText = 'We Received Your Tenant Application';
      bodyText = `Thank you for your interest in finding a home in <strong>${location}</strong>. We'll match you with available properties and contact you soon.`;
      subject = 'Application Received - Lease Nexus';
      actionLink = 'https://leasenexus.onrender.com/';
      actionText = 'Browse Properties';
    } else if (type === 'contact') {
      headerText = 'We Received Your Message';
      bodyText = 'Thank you for contacting us. We appreciate your inquiry and will get back to you as soon as possible.';
      subject = 'Message Received - Lease Nexus';
      actionLink = 'https://leasenexus.onrender.com/';
      actionText = 'Visit Our Website';
    }

    const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body { font-family: 'Segoe UI', Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; background: #f8fafc; padding: 20px; }
    .card { background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.1); }
    .header { background: linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #3b82f6 100%); color: white; padding: 40px 20px; text-align: center; }
    .header h1 { margin: 0; font-size: 28px; font-weight: 700; }
    .header p { margin: 8px 0 0 0; font-size: 14px; opacity: 0.9; }
    .content { padding: 30px 25px; }
    .content p { margin: 0 0 15px 0; color: #334155; line-height: 1.8; }
    .button { display: inline-block; background: linear-gradient(135deg, #3b82f6, #06b6d4); color: white; padding: 12px 28px; border-radius: 25px; text-decoration: none; font-weight: 600; margin: 20px 0; }
    .button:hover { opacity: 0.9; }
    .footer { background: #0f172a; color: white; padding: 20px; text-align: center; font-size: 12px; }
    .footer p { margin: 5px 0; opacity: 0.8; }
  </style>
</head>
<body>
  <div class="container">
    <div class="card">
      <div class="header">
        <h1>Lease Nexus</h1>
        <p>Premium Property Management</p>
      </div>
      <div class="content">
        <h2 style="color: #0f172a; margin-top: 0;">Hello ${name},</h2>
        <p>${bodyText}</p>
        <p>Our dedicated team is reviewing your information and will reach out within 24 hours. We're committed to providing you with the best service possible.</p>
        <center>
          <a href="${actionLink}" class="button">${actionText}</a>
        </center>
        <p style="margin-top: 25px; padding-top: 20px; border-top: 1px solid #e2e8f0; font-size: 14px;">
          If you have any questions in the meantime, feel free to reply to this email or contact us at:
          <br><strong>📞 1-800-LEASE-01</strong>
          <br><strong>📧 info@leasenexus.com</strong>
        </p>
      </div>
      <div class="footer">
        <p><strong>Lease Nexus</strong> | Premium Property Management Platform</p>
        <p>1976 McKay Ave, Windsor, ON N9B 0A1 | Canada</p>
        <p style="margin-top: 10px; opacity: 0.6;">© 2025 Lease Nexus. All rights reserved.</p>
      </div>
    </div>
  </div>
</body>
</html>
    `;

    const msg = {
      to: email,
      from: `"Lease Nexus" <${process.env.EMAIL_USER}>`,
      subject: subject,
      html: html
    };

    sendEmailAsync(msg);
  } catch (err) {
    console.error('Auto-reply email error:', err);
  }
}

/**
 * Send management notification
 */
async function sendManagementNotification({
  name,
  email,
  phone,
  type,
  leadType,
  location,
  leadData,
  leadId,
  additionalInfo
}) {
  try {
    const managementEmail = process.env.MANAGEMENT_EMAIL || 'usmansafdar.uos@gmail.com,shahido@live.com';

    let rows = '';
    rows += formatRow('Lead Type', leadType);
    rows += formatRow('Name', name);
    rows += formatRow('Email', email);
    rows += formatRow('Phone', phone);
    rows += formatRow('Location', location);

    if (leadData) {
      rows += formatRow('House Type', leadData.house_type);
      rows += formatRow('Levels', leadData.levels);
      if (leadData.levels && (leadData.levels === '2' || leadData.levels === '3')) {
        rows += formatRow('Basement Entrance', leadData.basement_entrance || 'N/A');
      }
      rows += formatRow('Bedrooms', leadData.bedrooms);
      rows += formatRow('Bathrooms', leadData.bathrooms);
      rows += formatRow('Kitchen', leadData.kitchen);
      rows += formatRow('Garage', leadData.garage);
      if (leadData.expected_rent) {
        rows += formatRow('Expected Rent', `$${parseFloat(leadData.expected_rent).toFixed(2)}/month`);
      }
      rows += formatRow('Utilities', leadData.utilities);
    }

    if (additionalInfo) {
      if (additionalInfo.role) rows += formatRow('Role', additionalInfo.role);
      if (additionalInfo.service) rows += formatRow('Service Interested', additionalInfo.service);
      if (additionalInfo.contactMethod) rows += formatRow('Preferred Contact', additionalInfo.contactMethod);
      if (additionalInfo.bestTime) rows += formatRow('Best Time to Contact', additionalInfo.bestTime);
    }

    const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body { font-family: 'Segoe UI', Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 800px; margin: 0 auto; background: #f8fafc; padding: 20px; }
    .card { background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.1); }
    .header { background: #0f172a; color: white; padding: 25px 20px; }
    .header h1 { margin: 0; font-size: 24px; font-weight: 700; }
    .header p { margin: 8px 0 0 0; font-size: 14px; color: #06b6d4; }
    .content { padding: 25px; }
    .content h3 { color: #0f172a; margin-top: 0; }
    table { width: 100%; border-collapse: collapse; margin: 20px 0; }
    td { padding: 10px 12px; border-bottom: 1px solid #e2e8f0; }
    .alert { background: #fef9e6; border-left: 4px solid #d69e2e; padding: 15px; border-radius: 8px; margin: 20px 0; }
    .alert strong { color: #b45309; }
    .footer { background: #0f172a; color: white; padding: 15px; text-align: center; font-size: 12px; }
    .footer p { margin: 5px 0; opacity: 0.8; }
    .badge { display: inline-block; background: #3b82f6; color: white; padding: 4px 12px; border-radius: 20px; font-size: 12px; font-weight: 600; }
  </style>
</head>
<body>
  <div class="container">
    <div class="card">
      <div class="header">
        <h1>📊 New Lead Submission</h1>
        <p>${leadType}</p>
      </div>
      <div class="content">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
          <h3 style="margin: 0;">Lead Details - ID: ${leadId || 'N/A'}</h3>
          <span class="badge">${type.toUpperCase()}</span>
        </div>

        <table>
          ${rows}
        </table>

        <div class="alert">
          <strong>⏰ Action Required:</strong><br>
          Please review this inquiry and respond within 24 hours to maintain our 98% satisfaction rate.
        </div>

        <div style="background: #f1f5f9; padding: 15px; border-radius: 8px; margin: 20px 0;">
          <h4 style="margin-top: 0; color: #0f172a;">Quick Actions:</h4>
          <ul style="margin: 10px 0; padding-left: 20px;">
            <li>Review the lead details above</li>
            <li>Contact ${name} at ${email} or ${phone}</li>
            <li>Update lead status in your CRM</li>
            <li>Schedule follow-up if needed</li>
          </ul>
        </div>

        <p style="font-size: 12px; color: #64748b; margin-top: 25px; padding-top: 15px; border-top: 1px solid #e2e8f0;">
          <strong>Submitted:</strong> ${new Date().toLocaleString()}<br>
          <strong>Lead Source:</strong> Lease Nexus Website<br>
          <strong>Contact Preference:</strong> Email / Phone
        </p>
      </div>
      <div class="footer">
        <p><strong>Lease Nexus Management System</strong></p>
        <p>This is an automated notification. Do not reply directly to this email.</p>
        <p>© 2025 Lease Nexus. All rights reserved.</p>
      </div>
    </div>
  </div>
</body>
</html>
    `;

    // Handle multiple management emails
    const emails = managementEmail.split(',').map(e => e.trim());
    
    for (const mgmtEmail of emails) {
      const msg = {
        to: mgmtEmail,
        from: `"Lease Nexus Alerts" <${process.env.EMAIL_USER}>`,
        subject: `New Lead: ${name} (${type === 'landlord' ? '🏢 Landlord' : type === 'tenant' ? '🏠 Tenant' : '💬 Contact'})`,
        html: html
      };
      sendEmailAsync(msg);
    }
  } catch (err) {
    console.error('Management notification error:', err);
  }
}

module.exports = {
  sendAutoReply,
  sendManagementNotification
};