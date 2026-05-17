const nodemailer = require('nodemailer');

let transporter = null;
if (process.env.EMAIL_USER && process.env.EMAIL_PASS) {
  transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS
    }
  });
}

// Non‑blocking email sender
function sendEmailAsync(mailOptions) {
  if (!transporter) return;
  setImmediate(() => {
    transporter.sendMail(mailOptions).catch(err => console.error('Email send error:', err));
  });
}

async function sendAutoReply({ name, email, message }) {
  const mailOptions = {
    from: `"Lease Nexus" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: 'Thank you for contacting Lease Nexus',
    html: `
      <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 550px; margin: 0 auto; border: 1px solid #e0e0e0; border-radius: 16px; overflow: hidden;">
        <div style="background: linear-gradient(135deg, #1a365d 0%, #2c5282 100%); padding: 30px 20px; text-align: center;">
          <h1 style="color: #fff; margin: 0; font-size: 28px;">Lease Nexus</h1>
          <p style="color: #ecc94b; margin: 5px 0 0;">Premium Property Management</p>
        </div>
        <div style="padding: 30px 25px; background: #fff;">
          <h2 style="color: #1a365d; margin-top: 0;">Hello ${name},</h2>
          <p>We have received your message:</p>
          <div style="background: #f8fafc; padding: 15px; border-left: 4px solid #d69e2e; margin: 20px 0;">
            <em>“${message}”</em>
          </div>
          <p>One of our property specialists will get back to you <strong>within 24 hours</strong>.</p>
          <hr style="margin: 25px 0; border: none; border-top: 1px solid #e2e8f0;">
          <p style="font-size: 13px; color: #64748b;">Lease Nexus – Smart Property Management<br>1-800-LEASE-01 | info@leasenexus.com</p>
        </div>
      </div>
    `
  };
  sendEmailAsync(mailOptions);
}

async function sendManagementNotification({ name, email, phone, message, propertyInterest }) {
  const mailOptions = {
    from: `"Lease Nexus Contact" <${process.env.EMAIL_USER}>`,
    to: process.env.MANAGEMENT_EMAIL,
    subject: `📞 New Contact from ${name}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px;">
        <h2 style="color: #1a365d;">New Client Inquiry</h2>
        <table style="width: 100%; border-collapse: collapse;">
          <tr><td style="padding: 8px; background: #f1f5f9; font-weight: bold;">Name</td><td style="padding: 8px;">${name}</td></tr>
          <tr><td style="padding: 8px; background: #f1f5f9; font-weight: bold;">Email</td><td style="padding: 8px;">${email}</td></tr>
          <tr><td style="padding: 8px; background: #f1f5f9; font-weight: bold;">Phone</td><td style="padding: 8px;">${phone || 'Not provided'}</td></tr>
          <tr><td style="padding: 8px; background: #f1f5f9; font-weight: bold;">Property Interest</td><td style="padding: 8px;">${propertyInterest || 'Not specified'}</td></tr>
          <tr><td style="padding: 8px; background: #f1f5f9; font-weight: bold;">Message</td><td style="padding: 8px;">${message}</td></tr>
        </table>
        <p style="margin-top: 20px; color: #64748b;">This is an automated notification from leasenexus.com</p>
      </div>
    `
  };
  sendEmailAsync(mailOptions);
}

module.exports = { sendAutoReply, sendManagementNotification };