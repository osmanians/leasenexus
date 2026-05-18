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

async function sendAutoReply({ name, email, message }) {
  const html = `
<div style="font-family: 'Segoe UI', Arial; max-width: 550px; margin:0 auto; background:#fff; border-radius:24px; overflow:hidden; box-shadow:0 20px 35px -10px rgba(0,0,0,0.1);">
  <div style="background: linear-gradient(135deg,#1a365d,#2c5282); padding:40px 30px; text-align:center;">
    <div style="font-size:48px; font-weight:800; color:#fff;">Lease Nexus</div>
    <div style="font-size:14px; color:#ecc94b; letter-spacing:2px;">PROPERTY MANAGEMENT</div>
    <div style="width:60px; height:3px; background:#d69e2e; margin:20px auto 0;"></div>
  </div>
  <div style="padding:40px 30px;">
    <h2 style="color:#1a365d; margin-top:0;">Hello ${name},</h2>
    <p>Thank you for reaching out. We have received your message:</p>
    <div style="background:#f8fafc; padding:20px; border-left:4px solid #d69e2e; margin:25px 0;">“${message}”</div>
    <p>One of our specialists will contact you <strong>within 24 hours</strong>.</p>
    <div style="text-align:center; margin:35px 0 20px;">
      <a href="https://osmanians.github.io/leasenexus/#calculator" style="background:#1a365d; color:#fff; padding:12px 28px; text-decoration:none; border-radius:40px;">Calculate ROI Now</a>
    </div>
    <hr style="border:none; border-top:1px solid #e2e8f0; margin:30px 0 20px;">
    <p style="font-size:13px; color:#64748b;">Lease Nexus Property Management<br>1-800-LEASE-01 | info@leasenexus.com<br>Windsor-Essex, Ontario</p>
  </div>
</div>`;
  const msg = {
    to: email,
    from: 'noreply@leasenexus.com',   // MUST be verified in SendGrid
    subject: 'Thank you for contacting Lease Nexus',
    html
  };
  sendEmailAsync(msg);
}

async function sendManagementNotification({ name, email, phone, message, propertyInterest }) {
  const html = `
<div style="font-family: Arial; max-width:600px;">
  <h3 style="color:#1a365d;">New Contact from ${name}</h3>
  <table style="width:100%; border-collapse:collapse;">
    <tr><td style="padding:8px; background:#f1f5f9;"><b>Name</b></td><td style="padding:8px;">${name}</td></tr>
    <tr><td style="padding:8px;"><b>Email</b></td><td style="padding:8px;">${email}</td></tr>
    <tr><td style="padding:8px; background:#f1f5f9;"><b>Phone</b></td><td style="padding:8px;">${phone || 'N/A'}</td></tr>
    <tr><td style="padding:8px;"><b>Property Interest</b></td><td style="padding:8px;">${propertyInterest || 'N/A'}</td></tr>
    <tr><td style="padding:8px; background:#f1f5f9;"><b>Message</b></td><td style="padding:8px;">${message}</td></tr>
  </table>
  <div style="margin-top:20px; background:#fef9e6; padding:15px; border-left:4px solid #d69e2e;">
    <b>⚠️ Action required</b><br>Please respond within 24 hours.
  </div>
</div>`;
  const msg = {
    to: process.env.MANAGEMENT_EMAIL,
    from: 'noreply@leasenexus.com',
    subject: `New Lead: ${name}`,
    html
  };
  sendEmailAsync(msg);
}

module.exports = { sendAutoReply, sendManagementNotification };