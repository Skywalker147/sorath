// src/controllers/auth.controller.js
const userService = require('../services/user.service');
const otpService  = require('../services/otp.service');
const jwtUtil     = require('../utils/jwt.util');

async function signup(req, res) {
  try {
    const { name, phoneNumber, location, role } = req.body;

    // 1. Prevent duplicate phone registrations
    const existing = await userService.getUserByPhone(phoneNumber);
    if (existing) {
      return res.status(400).json({ error: 'User already exists' });
    }

    // 2. Send OTP first; if this fails, we never create the user
    await otpService.sendOtp(phoneNumber);

    // 3. Only after successful SMS, register the user
    await userService.registerUser({ name, phoneNumber, location, role });

    return res.status(201).json({ message: 'OTP sent for verification' });
  } catch (err) {
    return res.status(400).json({ error: err.message });
  }
}

async function login(req, res) {
  try {
    const { phoneNumber } = req.body;
    const user = await userService.getUserByPhone(phoneNumber);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    await otpService.sendOtp(phoneNumber);
    return res.json({ message: 'OTP sent to your phone' });
  } catch (err) {
    return res.status(400).json({ error: err.message });
  }
}

async function verifyOtp(req, res) {
  try {
    const { phoneNumber, code } = req.body;

    await otpService.verifyOtp(phoneNumber, code);
    await userService.verifyUserPhone(phoneNumber);

    const user = await userService.getUserByPhone(phoneNumber);
    const token = jwtUtil.signToken({ userId: user.id, role: user.role });

    return res.json({ token });
  } catch (err) {
    return res.status(400).json({ error: err.message });
  }
}

module.exports = {
  signup,
  login,
  verifyOtp,
};
