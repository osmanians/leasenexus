const sgMail = require('@sendgrid/mail');
const apiKey = process.env.SENDGRID_API_KEY;

if (apiKey) {
  sgMail.setApiKey(apiKey);
  console.log('✅ SendGrid initialised – emails will be sent');
} else {
  console.warn('⚠️ SENDGRID_API_KEY not set – email disabled');
}

function sendEmailAsync(msg) {
  if (!apiKey) return;
  setImmediate(() => {
    sgMail.send(msg).catch(err => {
      console.error('SendGrid error:', err.response?.body || err.message);
    });
  });
}

// --------------------------------------------------------------
// AUTO‑REPLY TO CLIENT (mobile‑optimised, branded)
// --------------------------------------------------------------
async function sendAutoReply({ name, email, message }) {
  const html = `
<div style="font-family: system-ui, -apple-system, 'Segoe UI', sans-serif; max-width: 550px; margin:0 auto; background:#ffffff; border-radius:24px; overflow:hidden; box-shadow:0 4px 12px rgba(0,0,0,0.05);">
  <div style="background: linear-gradient(135deg, #1a365d, #2c5282); padding: 30px 20px; text-align:center;">
    <div style="font-size:42px; font-weight:800; color:white;">Lease Nexus</div>
    <div style="font-size:13px; color:#ecc94b; letter-spacing:2px;">PROPERTY MANAGEMENT</div>
  </div>
  <div style="padding: 30px 20px;">
    <h2 style="color:#1a365d; margin-top:0;">Hello ${name},</h2>
    <p style="color:#334155;">Thank you for reaching out to <strong>Lease Nexus</strong>. We have received your message:</p>
    <div style="background:#f8fafc; padding:16px; border-left:4px solid #d69e2e; border-radius:12px; margin:20px 0;">
      “${message}”
    </div>
    <p>One of our property specialists will contact you <strong>within 24 hours</strong>.</p>
    <div style="text-align:center; margin:30px 0;">
      <a href="https://osmanians.github.io/leasenexus/#calculator" style="background:#1a365d; color:white; padding:12px 24px; border-radius:40px; text-decoration:none; display:inline-block;">Calculate ROI Now</a>
    </div>
    <hr style="border:none; border-top:1px solid #e2e8f0;">
    <p style="font-size:12px; color:#64748b;">Lease Nexus Property Management<br>1-800-LEASE-01 | info@leasenexus.com<br>Windsor-Essex, Ontario</p>
  </div>
</div>
  `;
  const msg = {
    to: email,
    from: 'desinest.ca@gmail.com',
    subject: 'Thank you for contacting Lease Nexus',
    html
  };
  sendEmailAsync(msg);
}

// --------------------------------------------------------------
// INTERNAL NOTIFICATION TO MANAGEMENT TEAM (mobile friendly)
// --------------------------------------------------------------
async function sendManagementNotification({ name, email, phone, message, propertyInterest }) {
  const html = `
<div style="font-family: system-ui, sans-serif; max-width:600px; margin:0 auto; background:#fff; border-radius:20px; overflow:hidden;">
  <div style="background:#1a365d; padding:15px 20px; color:white; display:flex; justify-content:space-between; align-items:center;">
    <div><b>Lease Nexus</b><br><small style="color:#ecc94b;">NEW LEAD</small></div>
    <div style="background:#d69e2e; padding:4px 12px; border-radius:30px; color:#1a365d; font-weight:bold;">URGENT</div>
  </div>
  <div style="padding:20px;">
    <h3 style="color:#1a365d; margin-top:0;">📋 Contact Details</h3>
    <table style="width:100%; border-collapse:collapse;">
      <tr><td style="padding:8px 0;"><b>Name</b></td><td>${name}</td></tr>
      <tr><td style="padding:8px 0;"><b>Email</b></td><td><a href="mailto:${email}" style="color:#d69e2e;">${email}</a></td></tr>
      <tr><td style="padding:8px 0;"><b>Phone</b></td><td>${phone || 'Not provided'}</td></tr>
      <tr><td style="padding:8px 0;"><b>Property Interest</b></td><td>${propertyInterest || 'Not specified'}</td></tr>
      <tr><td style="padding:8px 0;"><b>Message</b></td><td>${message}</td></tr>
    </table>
    <div style="background:#fef9e6; border-left:4px solid #d69e2e; padding:12px; margin-top:20px;">
      ⚠️ <strong>Action required</strong><br>Please respond within 24 hours.
    </div>
    <hr style="margin:20px 0;">
    <p style="font-size:11px; color:#64748b;">Automated notification – do not reply directly.</p>
  </div>
</div>
  `;
  const msg = {
    to: process.env.MANAGEMENT_EMAIL,
    from: 'desinest.ca@gmail.com',
    subject: `📞 New Contact from ${name}`,
    html
  };
  sendEmailAsync(msg);
}

module.exports = { sendAutoReply, sendManagementNotification };