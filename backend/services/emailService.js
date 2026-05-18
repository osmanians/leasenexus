// Mock email service – logs only, no actual emails
async function sendAutoReply({ name, email, message }) {
  console.log(`📧 [MOCK] Auto-reply to ${email} (${name}): "${message}"`);
}

async function sendManagementNotification({ name, email, phone, message, propertyInterest }) {
  console.log(`📧 [MOCK] Notification to management: New lead from ${name} (${email})`);
}

module.exports = { sendAutoReply, sendManagementNotification };