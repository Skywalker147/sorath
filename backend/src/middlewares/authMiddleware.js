const jwt = require('jsonwebtoken');

// Verify JWT token
const verifyToken = (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '') || req.header('x-auth-token');

    if (!token) {
      return res.status(401).json({ error: 'Access denied. No token provided.' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Token expired' });
    }
    return res.status(401).json({ error: 'Invalid token' });
  }
};

// Check if user is owner/admin
const isOwner = (req, res, next) => {
  if (req.user.role !== 'owner') {
    return res.status(403).json({ error: 'Access denied. Owner privileges required.' });
  }
  next();
};

// Check if user is warehouse
const isWarehouse = (req, res, next) => {
  if (req.user.role !== 'warehouse') {
    return res.status(403).json({ error: 'Access denied. Warehouse privileges required.' });
  }
  next();
};

// Check if user is owner or warehouse
const isOwnerOrWarehouse = (req, res, next) => {
  if (!['owner', 'warehouse'].includes(req.user.role)) {
    return res.status(403).json({ error: 'Access denied. Owner or warehouse privileges required.' });
  }
  next();
};

// Check if user is dealer
const isDealer = (req, res, next) => {
  if (req.user.role !== 'dealer') {
    return res.status(403).json({ error: 'Access denied. Dealer privileges required.' });
  }
  next();
};

// Check if user is salesman
const isSalesman = (req, res, next) => {
  if (req.user.role !== 'salesman') {
    return res.status(403).json({ error: 'Access denied. Salesman privileges required.' });
  }
  next();
};

// Check multiple roles
const hasRole = (roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ 
        error: `Access denied. Required roles: ${roles.join(', ')}` 
      });
    }
    next();
  };
};

module.exports = {
  verifyToken,
  isOwner,
  isWarehouse,
  isOwnerOrWarehouse,
  isDealer,
  isSalesman,
  hasRole
};