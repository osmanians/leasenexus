// Mock email service – no external dependencies, only logs to console
async function sendAutoReply({ name, email, message }) {
  console.log(`📧 [MOCK] Auto-reply to ${email} (${name}): "${message.substring(0, 100)}"`);
}

async function sendManagementNotification({ name, email, phone, message, propertyInterest }) {
  console.log(`📧 [MOCK] Management notification: New lead from ${name} (${email})`);
}

module.exports = { sendAutoReply, sendManagementNotification };