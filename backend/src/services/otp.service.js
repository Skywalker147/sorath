// src/services/otp.service.js
const otpModel = require('../models/otp.model');
const smsUtil = require('../utils/sms.util');

function generateCode() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

async function sendOtp(phoneNumber) {
  const code = generateCode();
  const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes
  await otpModel.insertOtp({ phoneNumber, code, expiresAt });
  await smsUtil.sendSms(phoneNumber, `Your OTP code is ${code}`);
  return code;
}

async function verifyOtp(phoneNumber, code) {
  const record = await otpModel.findValidOtp(phoneNumber, code);
  if (!record) {
    throw new Error('Invalid or expired OTP');
  }
  await otpModel.markOtpUsed(record.id);
  return true;
}

module.exports = {
  sendOtp,
  verifyOtp,
};
