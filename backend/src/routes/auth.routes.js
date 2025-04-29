// src/routes/auth.routes.js
const express = require('express');
const router  = express.Router();
const authCtrl = require('../controllers/auth.controller');

router.post('/signup',    authCtrl.signup);
router.post('/login',     authCtrl.login);
router.post('/verify-otp', authCtrl.verifyOtp);

module.exports = router;
