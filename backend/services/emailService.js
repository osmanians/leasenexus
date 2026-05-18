const brevo = require('@getbrevo/brevo');

let apiInstance = null;
const apiKey = process.env.BREVO_API_KEY;

if (apiKey) {
  // Correct way to initialise the API client (v5+)
  apiInstance = new brevo.TransactionalEmailsApi();
  apiInstance.setApiKey(brevo.TransactionalEmailsApiApiKeys.apiKey, apiKey);
  console.log('Brevo API initialised');
} else {
  console.warn('BREVO_API_KEY not set – email sending disabled');
}

// Non‑blocking email sender
function sendEmailAsync(mailOptions) {
  if (!apiInstance) {
    console.log('Email not sent – missing Brevo API key');
    return;
  }
  setImmediate(() => {
    const sendSmtpEmail = new brevo.SendSmtpEmail();
    sendSmtpEmail.subject = mailOptions.subject;
    sendSmtpEmail.sender = { name: 'Lease Nexus', email: 'noreply@leasenexus.com' };
    sendSmtpEmail.to = [{ email: mailOptions.to, name: mailOptions.toName || '' }];
    sendSmtpEmail.htmlContent = mailOptions.html;
    
    apiInstance.sendTransacEmail(sendSmtpEmail).catch(err => {
      console.error('Brevo email error:', err);
    });
  });
}

// ---------- AUTO‑REPLY (branded) ----------
async function sendAutoReply({ name, email, message }) {
  const htmlTemplate = `
<div style="font-family: 'Poppins', 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 24px; overflow: hidden; box-shadow: 0 20px 35px -10px rgba(0,0,0,0.1);">
  <div style="background: linear-gradient(135deg, #1a365d 0%, #2c5282 100%); padding: 40px 30px; text-align: center;">
    <div style="font-size: 48px; font-weight: 800; letter-spacing: -1px; color: white;">Lease Nexus</div>
    <div style="font-size: 14px; color: #ecc94b; margin-top: 8px; letter-spacing: 2px;">PROPERTY MANAGEMENT</div>
    <div style="width: 60px; height: 3px; background: #d69e2e; margin: 20px auto 0;"></div>
  </div>
  <div style="padding: 40px 30px;">
    <h2 style="color: #1a365d; margin-top: 0; font-size: 24px;">Hello {{name}},</h2>
    <p style="color: #334155; line-height: 1.6; margin-bottom: 25px;">Thank you for reaching out to <strong>Lease Nexus</strong>. We have received your message and our team is already reviewing it.</p>
    <div style="background: #f8fafc; padding: 20px; border-left: 4px solid #d69e2e; border-radius: 12px; margin: 25px 0;">
      <p style="margin: 0; color: #1e293b; font-style: italic; font-size: 15px;">“{{message}}”</p>
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
  const finalHtml = htmlTemplate.replace(/{{name}}/g, name).replace(/{{message}}/g, message);
  const mailOptions = {
    to: email,
    subject: 'Thank you for contacting Lease Nexus',
    html: finalHtml
  };
  sendEmailAsync(mailOptions);
}

// ---------- INTERNAL NOTIFICATION (management) ----------
async function sendManagementNotification({ name, email, phone, message, propertyInterest }) {
  const htmlTemplate = `
<div style="font-family: 'Poppins', 'Segoe UI', Arial, sans-serif; max-width: 650px; margin: 0 auto; background: #ffffff; border-radius: 24px; overflow: hidden; box-shadow: 0 20px 35px -10px rgba(0,0,0,0.1);">
  <div style="background: linear-gradient(135deg, #1a365d 0%, #2c5282 100%); padding: 25px 30px;">
    <div style="display: flex; justify-content: space-between; align-items: flex-end;">
      <div>
        <div style="font-size: 26px; font-weight: 800; color: white;">Lease Nexus</div>
        <div style="font-size: 11px; color: #ecc94b; letter-spacing: 1.5px;">INTERNAL NOTIFICATION</div>
      </div>
      <div style="background: #d69e2e; padding: 6px 12px; border-radius: 40px; font-size: 12px; font-weight: bold; color: #1a365d;">NEW LEAD</div>
    </div>
  </div>
  <div style="padding: 30px;">
    <h3 style="color: #1a365d; margin-top: 0; font-size: 20px;">📋 New Contact Submission</h3>
    <p style="color: #475569; margin-bottom: 20px;">A potential client has filled the contact form on your website. Details below:</p>
    <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
      <tr style="background: #f8fafc;"><td style="padding: 12px; font-weight: 600; width: 35%;">Full Name</td><td style="padding: 12px;">{{name}}</td></tr>
      <tr><td style="padding: 12px; font-weight: 600;">Email Address</td><td style="padding: 12px;"><a href="mailto:{{email}}" style="color: #d69e2e; text-decoration: none;">{{email}}</a></td></tr>
      <tr style="background: #f8fafc;"><td style="padding: 12px; font-weight: 600;">Phone Number</td><td style="padding: 12px;">{{phone}}</td></tr>
      <tr><td style="padding: 12px; font-weight: 600;">Property Interest</td><td style="padding: 12px;">{{propertyInterest}}</td></tr>
      <tr style="background: #f8fafc;"><td style="padding: 12px; font-weight: 600;">Message</td><td style="padding: 12px;">{{message}}</td></tr>
    </table>
    <div style="background: #fef9e6; border-left: 4px solid #d69e2e; padding: 15px; margin: 20px 0;">
      <p style="margin: 0; font-size: 13px; color: #92400e;"><strong>⚠️ Action required</strong><br>Please respond to this inquiry within 24 hours to maintain our 98% satisfaction rate.</p>
    </div>
    <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 25px 0;">
    <p style="font-size: 12px; color: #64748b; margin: 0;">This is an automated message from your website backend. Do not reply directly to this email.</p>
  </div>
</div>
  `;
  const finalHtml = htmlTemplate
    .replace(/{{name}}/g, name)
    .replace(/{{email}}/g, email)
    .replace(/{{phone}}/g, phone || 'Not provided')
    .replace(/{{propertyInterest}}/g, propertyInterest || 'Not specified')
    .replace(/{{message}}/g, message);
  const mailOptions = {
    to: process.env.MANAGEMENT_EMAIL,
    subject: `📞 New Contact from ${name}`,
    html: finalHtml
  };
  sendEmailAsync(mailOptions);
}

module.exports = { sendAutoReply, sendManagementNotification };