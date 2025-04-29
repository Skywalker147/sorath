// src/utils/sms.util.js
const twilio = require('twilio');
require('dotenv').config();

const client = twilio(
  process.env.TWILIO_API_KEY,
  process.env.TWILIO_API_SECRET,
  { accountSid: process.env.TWILIO_ACCOUNT_SID }
);

/**
 * @param {string} to      Local (10-digit) or E.164 number
 * @param {string} message The SMS body text
 */
async function sendSms(to, message) {
  // If they passed 10 digits, assume India and prefix +91
  if (/^\d{10}$/.test(to)) {
    to = '+91' + to;
  }
  try {
    const msg = await client.messages.create({
      body: message,
      from: process.env.TWILIO_FROM,
      to
    });
    console.log(`Twilio SMS sent (${to}): ${msg.sid}`);
    return msg;
  } catch (err) {
    console.error('Twilio SMS error:', err);
    throw new Error('Failed to send SMS');
  }
}

module.exports = {
  sendSms,
};
