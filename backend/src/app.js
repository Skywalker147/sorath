// src/app.js
const express = require('express');
const cors    = require('cors');
require('dotenv').config();

const authRoutes = require('./routes/auth.routes');
const adminRoutes = require('./routes/admin.routes');
const itemRoutes = require('./routes/item.routes');
const inventoryRoutes = require('./routes/inventory.routes');
const orderRoutes = require('./routes/order.routes');

const app = express();

// CORS configuration
const corsOptions = {
  origin: ['http://82.29.164.109:3000', 'http://82.29.164.109:4000', 'http://localhost:5173', 'http://localhost:4000', 'http://localhost:3000'],
  methods: ['GET', 'POST', 'PUT','PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Referer', 'User-Agent'],
  exposedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
  maxAge: 86400, // 24 hours
  preflightContinue: false,
  optionsSuccessStatus: 204
};

app.use(cors(corsOptions));

// Security headers middleware
app.use((req, res, next) => {
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  next();
});

app.use(express.json());

// Health check
app.get('/', (req, res) => res.send('API is running'));

// Auth routes
app.use('/auth', authRoutes);

// Admin routes
app.use('/admin', adminRoutes);

// Item routes
app.use('/items', itemRoutes);

// Inventory routes
app.use('/inventory', inventoryRoutes);

// Order routes
app.use('/orders', orderRoutes);

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Not Found' });
});

module.exports = app;