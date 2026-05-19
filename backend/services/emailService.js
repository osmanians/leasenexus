// backend/services/emailService.js
// SendGrid email service for automated notifications
// Sends branded HTML emails to clients and management

const sgMail = require('@sendgrid/mail');
const apiKey = process.env.SENDGRID_API_KEY;

// Initialize SendGrid
if (apiKey) {
  sgMail.setApiKey(apiKey);
  console.log('✅ SendGrid initialized');
} else {
  console.warn('⚠️ SENDGRID_API_KEY not set – email functionality disabled');
}

/**
 * Send email asynchronously in the background
 * Uses setImmediate to prevent blocking the response
 */
function sendEmailAsync(msg) {
  if (!apiKey) {
    console.warn('📧 Email service disabled - no API key');
    return;
  }

  setImmediate(() => {
    sgMail.send(msg)
      .then(() => {
        console.log(`✅ Email sent to: ${msg.to}`);
      })
      .catch(err => {
        console.error('❌ SendGrid error:', err.response?.body || err.message);
      });
  });
}

/**
 * Format table row for email
 * Creates a styled HTML table row
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
 * Confirms receipt of their inquiry and provides next steps
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
      from: 'desinest.ca@gmail.com',
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
 * Alerts management team about new leads with full details
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
    const managementEmail = process.env.MANAGEMENT_EMAIL || 'shahido@live.com, usmansafdar.uos@gmail.com';

    // Build dynamic table rows based on lead type
    let rows = '';
    rows += formatRow('Lead Type', leadType);
    rows += formatRow('Name', name);
    rows += formatRow('Email', email);
    rows += formatRow('Phone', phone);
    rows += formatRow('Location', location);

    // Add property/preference details
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

    // Add additional info if present
    if (additionalInfo) {
      if (additionalInfo.role) {
        rows += formatRow('Role', additionalInfo.role);
      }
      if (additionalInfo.service) {
        rows += formatRow('Service Interested', additionalInfo.service);
      }
      if (additionalInfo.contactMethod) {
        rows += formatRow('Preferred Contact', additionalInfo.contactMethod);
      }
      if (additionalInfo.bestTime) {
        rows += formatRow('Best Time to Contact', additionalInfo.bestTime);
      }
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

    const msg = {
      to: managementEmail,
      from: 'desinest.ca@gmail.com',
      subject: `New Lead: ${name} (${type === 'landlord' ? '🏢' : '🏠'} ${type})`,
      html: html
    };

    sendEmailAsync(msg);
  } catch (err) {
    console.error('Management notification error:', err);
  }
}

/**
 * Notify landlord when a tenant creates a new service call
 */
async function sendServiceCallCreated({ serviceCall, tenantName, landlordEmail, propertyAddress }) {
  try {
    const priorityColors = {
      low: '#22c55e',
      medium: '#f59e0b',
      high: '#ef4444',
      emergency: '#7c3aed'
    };

    const priorityColor = priorityColors[serviceCall.priority] || '#64748b';

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
    .header { background: linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #3b82f6 100%); color: white; padding: 30px 20px; }
    .header h1 { margin: 0; font-size: 22px; font-weight: 700; }
    .header p { margin: 6px 0 0; font-size: 13px; opacity: 0.85; }
    .content { padding: 25px; }
    .badge { display: inline-block; padding: 4px 12px; border-radius: 20px; font-size: 12px; font-weight: 600; color: white; }
    table { width: 100%; border-collapse: collapse; margin: 15px 0; }
    td { padding: 10px 12px; border-bottom: 1px solid #e2e8f0; }
    .label { background: #f8fafc; font-weight: 600; width: 35%; color: #0f172a; }
    .footer { background: #0f172a; color: white; padding: 15px; text-align: center; font-size: 12px; }
    .footer p { margin: 4px 0; opacity: 0.8; }
  </style>
</head>
<body>
  <div class="container">
    <div class="card">
      <div class="header">
        <h1>New Service Call Submitted</h1>
        <p>Lease Nexus | Property Management</p>
      </div>
      <div class="content">
        <p>A new service call has been submitted by <strong>${tenantName}</strong> for the property at <strong>${propertyAddress}</strong>.</p>
        <table>
          <tr><td class="label">Property</td><td>${propertyAddress}</td></tr>
          <tr><td class="label">Submitted By</td><td>${tenantName}</td></tr>
          <tr><td class="label">Title</td><td>${serviceCall.title}</td></tr>
          <tr><td class="label">Category</td><td>${serviceCall.category}</td></tr>
          <tr><td class="label">Priority</td><td><span class="badge" style="background:${priorityColor}">${(serviceCall.priority || 'medium').toUpperCase()}</span></td></tr>
          <tr><td class="label">Description</td><td>${serviceCall.description}</td></tr>
          <tr><td class="label">Submitted</td><td>${new Date(serviceCall.created_at).toLocaleString()}</td></tr>
        </table>
        <p style="font-size: 13px; color: #64748b; margin-top: 20px; padding-top: 15px; border-top: 1px solid #e2e8f0;">
          Please log in to the Lease Nexus portal to review and assign this service call.
        </p>
      </div>
      <div class="footer">
        <p><strong>Lease Nexus</strong> | Premium Property Management Platform</p>
        <p>© 2025 Lease Nexus. All rights reserved.</p>
      </div>
    </div>
  </div>
</body>
</html>
    `;

    const msg = {
      to: landlordEmail,
      from: 'desinest.ca@gmail.com',
      subject: `[Service Call] ${serviceCall.title} — ${propertyAddress}`,
      html
    };

    sendEmailAsync(msg);
  } catch (err) {
    console.error('sendServiceCallCreated error:', err);
  }
}

/**
 * Notify tenant when a service call status is updated
 */
async function sendServiceCallUpdate({ serviceCall, tenantEmail, update, propertyAddress }) {
  try {
    const statusLabels = {
      open: 'Open',
      in_progress: 'In Progress',
      resolved: 'Resolved',
      closed: 'Closed',
      cancelled: 'Cancelled'
    };

    const statusColors = {
      open: '#f59e0b',
      in_progress: '#3b82f6',
      resolved: '#22c55e',
      closed: '#64748b',
      cancelled: '#ef4444'
    };

    const statusLabel = statusLabels[update.status] || update.status;
    const statusColor = statusColors[update.status] || '#64748b';

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
    .header { background: linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #3b82f6 100%); color: white; padding: 30px 20px; }
    .header h1 { margin: 0; font-size: 22px; font-weight: 700; }
    .header p { margin: 6px 0 0; font-size: 13px; opacity: 0.85; }
    .content { padding: 25px; }
    .status-banner { background: ${statusColor}1a; border-left: 4px solid ${statusColor}; padding: 12px 16px; border-radius: 6px; margin: 15px 0; }
    .status-banner strong { color: ${statusColor}; }
    table { width: 100%; border-collapse: collapse; margin: 15px 0; }
    td { padding: 10px 12px; border-bottom: 1px solid #e2e8f0; }
    .label { background: #f8fafc; font-weight: 600; width: 35%; color: #0f172a; }
    .footer { background: #0f172a; color: white; padding: 15px; text-align: center; font-size: 12px; }
    .footer p { margin: 4px 0; opacity: 0.8; }
  </style>
</head>
<body>
  <div class="container">
    <div class="card">
      <div class="header">
        <h1>Service Call Update</h1>
        <p>Lease Nexus | Property Management</p>
      </div>
      <div class="content">
        <div class="status-banner">
          Status updated to: <strong>${statusLabel}</strong>
        </div>
        <p>Your service call for <strong>${propertyAddress}</strong> has been updated.</p>
        <table>
          <tr><td class="label">Property</td><td>${propertyAddress}</td></tr>
          <tr><td class="label">Title</td><td>${serviceCall.title}</td></tr>
          <tr><td class="label">New Status</td><td>${statusLabel}</td></tr>
          ${update.note ? `<tr><td class="label">Note</td><td>${update.note}</td></tr>` : ''}
          ${serviceCall.assigned_to ? `<tr><td class="label">Assigned To</td><td>${serviceCall.assigned_to}</td></tr>` : ''}
          ${serviceCall.estimated_cost ? `<tr><td class="label">Estimated Cost</td><td>$${parseFloat(serviceCall.estimated_cost).toFixed(2)}</td></tr>` : ''}
        </table>
        <p style="font-size: 13px; color: #64748b; margin-top: 20px; padding-top: 15px; border-top: 1px solid #e2e8f0;">
          Log in to the Lease Nexus portal to view your full service call history.
          <br><br><strong>Questions?</strong> Contact us at <strong>info@leasenexus.com</strong> or <strong>1-800-LEASE-01</strong>.
        </p>
      </div>
      <div class="footer">
        <p><strong>Lease Nexus</strong> | Premium Property Management Platform</p>
        <p>© 2025 Lease Nexus. All rights reserved.</p>
      </div>
    </div>
  </div>
</body>
</html>
    `;

    const msg = {
      to: tenantEmail,
      from: 'desinest.ca@gmail.com',
      subject: `[Service Call Update] ${serviceCall.title} is now ${statusLabel}`,
      html
    };

    sendEmailAsync(msg);
  } catch (err) {
    console.error('sendServiceCallUpdate error:', err);
  }
}

/**
 * Send monthly rent reminder to a tenant
 */
async function sendRentReminder({ tenantName, tenantEmail, propertyAddress, amountDue, dueDate }) {
  try {
    const formattedAmount = parseFloat(amountDue).toLocaleString('en-CA', {
      style: 'currency',
      currency: 'CAD'
    });

    const formattedDate = dueDate
      ? new Date(dueDate).toLocaleDateString('en-CA', { year: 'numeric', month: 'long', day: 'numeric' })
      : 'the 1st of this month';

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
    .header p { margin: 8px 0 0; font-size: 14px; opacity: 0.9; }
    .content { padding: 30px 25px; }
    .amount-box { background: linear-gradient(135deg, #f0f4f8, #e2e8f0); border-radius: 10px; padding: 20px; text-align: center; margin: 20px 0; }
    .amount-box .label { font-size: 13px; color: #64748b; text-transform: uppercase; letter-spacing: 0.05em; }
    .amount-box .amount { font-size: 36px; font-weight: 700; color: #0f172a; margin: 5px 0; }
    .amount-box .due { font-size: 14px; color: #64748b; }
    .alert { background: #fef9e6; border-left: 4px solid #d69e2e; padding: 12px 16px; border-radius: 6px; margin: 20px 0; font-size: 14px; }
    .footer { background: #0f172a; color: white; padding: 20px; text-align: center; font-size: 12px; }
    .footer p { margin: 5px 0; opacity: 0.8; }
  </style>
</head>
<body>
  <div class="container">
    <div class="card">
      <div class="header">
        <h1>Lease Nexus</h1>
        <p>Monthly Rent Reminder</p>
      </div>
      <div class="content">
        <h2 style="color: #0f172a; margin-top: 0;">Hello ${tenantName},</h2>
        <p>This is a friendly reminder that your monthly rent payment is due for your property at <strong>${propertyAddress}</strong>.</p>

        <div class="amount-box">
          <div class="label">Amount Due</div>
          <div class="amount">${formattedAmount}</div>
          <div class="due">Due by ${formattedDate}</div>
        </div>

        <div class="alert">
          Please ensure your payment is received on time to avoid any late fees. If you have already submitted payment, please disregard this reminder.
        </div>

        <p>To view your full rent history or submit a service request, please log in to your tenant portal.</p>

        <p style="margin-top: 25px; padding-top: 20px; border-top: 1px solid #e2e8f0; font-size: 14px;">
          If you have any questions, please contact us at:<br>
          <strong>📞 1-800-LEASE-01</strong><br>
          <strong>📧 info@leasenexus.com</strong>
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
      to: tenantEmail,
      from: 'desinest.ca@gmail.com',
      subject: `Rent Reminder — ${formattedAmount} due ${formattedDate}`,
      html
    };

    sendEmailAsync(msg);
  } catch (err) {
    console.error('sendRentReminder error:', err);
  }
}

module.exports = {
  sendAutoReply,
  sendManagementNotification,
  sendServiceCallCreated,
  sendServiceCallUpdate,
  sendRentReminder
};