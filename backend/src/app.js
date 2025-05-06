// src/app.js
const express = require('express');
const cors    = require('cors');
require('dotenv').config();

const authRoutes = require('./routes/auth.routes');
const adminRoutes = require('./routes/admin.routes');
const itemRoutes = require('./routes/item.routes');
const inventoryRoutes = require('./routes/inventory.routes');

const app = express();

// CORS configuration
const corsOptions = {
  origin: ['http://82.29.164.109:4000', 'http://localhost:5173', 'http://localhost:3000'],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
  maxAge: 86400 // 24 hours
};

app.use(cors(corsOptions));
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

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Not Found' });
});

module.exports = app;