// src/routes/admin.routes.js
const express = require('express');
const router = express.Router();
const adminCtrl = require('../controllers/admin.controller');

router.post('/login', adminCtrl.login);

module.exports = router;