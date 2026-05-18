const sgMail = require('@sendgrid/mail');
const apiKey = process.env.SENDGRID_API_KEY;

if (apiKey) {
  sgMail.setApiKey(apiKey);
  console.log('✅ SendGrid initialised – emails will be sent');
} else {
  console.warn('⚠️ SENDGRID_API_KEY not set – email disabled');
}

// Non‑blocking email sender
function sendEmailAsync(msg) {
  if (!apiKey) return;
  setImmediate(() => {
    sgMail.send(msg).catch(err => {
      console.error('SendGrid error:', err.response?.body || err.message);
    });
  });
}

// --------------------------------------------------------------
// 1. AUTO‑REPLY TO CLIENT (branded)
// --------------------------------------------------------------
async function sendAutoReply({ name, email, message }) {
  const html = `
<div style="font-family: 'Poppins', 'Segoe UI', Arial, sans-serif; max-width: 550px; margin: 0 auto; background: #ffffff; border-radius: 24px; overflow: hidden; box-shadow: 0 20px 35px -10px rgba(0,0,0,0.1);">
  <div style="background: linear-gradient(135deg, #1a365d 0%, #2c5282 100%); padding: 40px 30px; text-align: center;">
    <div style="font-size: 48px; font-weight: 800; letter-spacing: -1px; color: white;">Lease Nexus</div>
    <div style="font-size: 14px; color: #ecc94b; margin-top: 8px; letter-spacing: 2px;">PROPERTY MANAGEMENT</div>
    <div style="width: 60px; height: 3px; background: #d69e2e; margin: 20px auto 0;"></div>
  </div>
  <div style="padding: 40px 30px;">
    <h2 style="color: #1a365d; margin-top: 0; font-size: 24px;">Hello ${name},</h2>
    <p style="color: #334155; line-height: 1.6; margin-bottom: 25px;">Thank you for reaching out to <strong>Lease Nexus</strong>. We have received your message and our team is already reviewing it.</p>
    <div style="background: #f8fafc; padding: 20px; border-left: 4px solid #d69e2e; border-radius: 12px; margin: 25px 0;">
      <p style="margin: 0; color: #1e293b; font-style: italic; font-size: 15px;">“${message}”</p>
    </div>
    <p style="color: #334155; line-height: 1.6;">One of our property specialists will contact you <strong style="color: #d69e2e;">within 24 hours</strong>. In the meantime, feel free to calculate your property’s ROI using our online tool.</p>
    <div style="text-align: center; margin: 35px 0 20px;">
      <a href="https://osmanians.github.io/leasenexus/#calculator" style="background: #1a365d; color: white; padding: 12px 28px; text-decoration: none; border-radius: 40px; font-weight: 600; display: inline-block;">Calculate ROI Now</a>
    </div>
    <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 30px 0 20px;">
    <p style="font-size: 13px; color: #64748b; text-align: center; margin: 0;">Lease Nexus Property Management<br>1-800-LEASE-01 | info@leasenexus.com<br>Windsor-Essex, Ontario</p>
  </div>
</div>
  `;
  const msg = {
    to: email,
    from: 'desinest.ca@gmail.com',   // ✅ verified sender
    subject: 'Thank you for contacting Lease Nexus',
    html: html
  };
  sendEmailAsync(msg);
}

// --------------------------------------------------------------
// 2. INTERNAL NOTIFICATION TO MANAGEMENT TEAM
// --------------------------------------------------------------
async function sendManagementNotification({ name, email, phone, message, propertyInterest }) {
  const html = `
<div style="font-family: 'Poppins', 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 20px; overflow: hidden; box-shadow: 0 10px 25px -5px rgba(0,0,0,0.1);">
  <div style="background: linear-gradient(135deg, #1a365d 0%, #2c5282 100%); padding: 25px 30px;">
    <div style="display: flex; justify-content: space-between; align-items: center;">
      <div>
        <div style="font-size: 24px; font-weight: 800; color: white;">Lease Nexus</div>
        <div style="font-size: 11px; color: #ecc94b; letter-spacing: 1.5px;">INTERNAL NOTIFICATION</div>
      </div>
      <div style="background: #d69e2e; padding: 6px 12px; border-radius: 40px; font-size: 12px; font-weight: bold; color: #1a365d;">NEW LEAD</div>
    </div>
  </div>
  <div style="padding: 30px;">
    <h3 style="color: #1a365d; margin-top: 0;">📋 New Contact Submission</h3>
    <p>A potential client has filled the contact form on your website. Details below:</p>
    <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
      <tr style="background: #f8fafc;"><td style="padding: 12px; font-weight: 600; width: 35%;">Full Name</td><td style="padding: 12px;">${name}</td></tr>
      <tr><td style="padding: 12px; font-weight: 600;">Email Address</td><td style="padding: 12px;"><a href="mailto:${email}" style="color: #d69e2e;">${email}</a></td></tr>
      <tr style="background: #f8fafc;"><td style="padding: 12px; font-weight: 600;">Phone Number</td><td style="padding: 12px;">${phone || 'Not provided'}</td></tr>
      <tr><td style="padding: 12px; font-weight: 600;">Property Interest</td><td style="padding: 12px;">${propertyInterest || 'Not specified'}</td></tr>
      <tr style="background: #f8fafc;"><td style="padding: 12px; font-weight: 600;">Message</td><td style="padding: 12px;">${message}</td></tr>
    </table>
    <div style="background: #fef9e6; border-left: 4px solid #d69e2e; padding: 15px; margin: 20px 0;">
      <p style="margin: 0; font-size: 13px; color: #92400e;"><strong>⚠️ Action required</strong><br>Please respond to this inquiry within 24 hours to maintain our 98% satisfaction rate.</p>
    </div>
    <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 25px 0;">
    <p style="font-size: 12px; color: #64748b;">This is an automated message from your website backend. Do not reply directly to this email.</p>
  </div>
</div>
  `;
  const msg = {
    to: process.env.MANAGEMENT_EMAIL,
    from: 'desinest.ca@gmail.com',   // ✅ verified sender
    subject: `📞 New Contact from ${name}`,
    html: html
  };
  sendEmailAsync(msg);
}

module.exports = { sendAutoReply, sendManagementNotification };