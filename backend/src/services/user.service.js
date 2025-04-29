// src/services/user.service.js
const userModel = require('../models/user.model');

async function registerUser({ name, phoneNumber, location, role }) {
  const existing = await userModel.findUserByPhone(phoneNumber);
  if (existing) {
    throw new Error('User already exists');
  }
  return userModel.createUser({ name, phoneNumber, location, role });
}

async function getUserByPhone(phoneNumber) {
  return userModel.findUserByPhone(phoneNumber);
}

async function verifyUserPhone(phoneNumber) {
  await userModel.markUserVerified(phoneNumber);
}

module.exports = {
  registerUser,
  getUserByPhone,
  verifyUserPhone,
};
