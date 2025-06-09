const jwt = require('jsonwebtoken');
const db = require('../config/db');

// Verify JWT token
const verifyToken = async (req, res, next) => {
  try {
    console.log('=== TOKEN VERIFICATION START ===');
    console.log('Headers:', req.headers.authorization ? 'Authorization header present' : 'No authorization header');
    
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      console.log('Missing or invalid authorization header');
      return res.status(401).json({ error: 'Access token required' });
    }

    const token = authHeader.substring(7);
    console.log('Token extracted, length:', token.length);
    
    if (!process.env.JWT_SECRET) {
      console.error('JWT_SECRET is not set in environment variables!');
      return res.status(500).json({ error: 'Server configuration error' });
    }
    
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    console.log('Token decoded successfully:', { 
      id: decoded.id, 
      username: decoded.username, 
      role: decoded.role 
    });
    
    req.user = decoded;
    console.log('=== TOKEN VERIFICATION SUCCESS ===');
    next();
  } catch (error) {
    console.log('=== TOKEN VERIFICATION FAILED ===');
    console.error('Token verification error:', {
      name: error.name,
      message: error.message,
      stack: error.stack
    });
    
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ 
        error: 'Token expired',
        code: 'TOKEN_EXPIRED'
      });
    } else if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ 
        error: 'Invalid token',
        code: 'INVALID_TOKEN' 
      });
    } else {
      return res.status(401).json({ 
        error: 'Token verification failed',
        code: 'VERIFICATION_FAILED'
      });
    }
  }
};

// Check if user is owner
const isOwner = (req, res, next) => {
  console.log('Checking owner role for user:', req.user.role);
  if (req.user.role !== 'owner') {
    return res.status(403).json({ 
      error: 'Access denied. Owner role required.',
      userRole: req.user.role,
      requiredRole: 'owner'
    });
  }
  next();
};

// Check if user is warehouse
const isWarehouse = (req, res, next) => {
  console.log('Checking warehouse role for user:', req.user.role);
  if (req.user.role !== 'warehouse') {
    return res.status(403).json({ 
      error: 'Access denied. Warehouse role required.',
      userRole: req.user.role,
      requiredRole: 'warehouse'
    });
  }
  next();
};

// Check if user is owner or warehouse
const isOwnerOrWarehouse = (req, res, next) => {
  console.log('Checking owner or warehouse role for user:', req.user.role);
  if (!['owner', 'warehouse'].includes(req.user.role)) {
    return res.status(403).json({ 
      error: 'Access denied. Owner or warehouse role required.',
      userRole: req.user.role,
      requiredRoles: ['owner', 'warehouse']
    });
  }
  next();
};

// Check if user is dealer
const isDealer = (req, res, next) => {
  console.log('Checking dealer role for user:', req.user.role);
  if (req.user.role !== 'dealer') {
    return res.status(403).json({ 
      error: 'Access denied. Dealer role required.',
      userRole: req.user.role,
      requiredRole: 'dealer'
    });
  }
  next();
};

// Check if user is salesman
const isSalesman = (req, res, next) => {
  console.log('Checking salesman role for user:', req.user.role);
  if (req.user.role !== 'salesman') {
    return res.status(403).json({ 
      error: 'Access denied. Salesman role required.',
      userRole: req.user.role,
      requiredRole: 'salesman'
    });
  }
  next();
};

// Check if user is salesman OR dealer (for mobile app users)
const isSalesmanOrDealer = (req, res, next) => {
  console.log('Checking salesman or dealer role for user:', req.user.role);
  if (!['salesman', 'dealer'].includes(req.user.role)) {
    return res.status(403).json({ 
      error: 'Access denied. Salesman or Dealer role required.',
      userRole: req.user.role,
      requiredRoles: ['salesman', 'dealer']
    });
  }
  next();
};

// Check multiple roles (flexible role checker) - FIXED VERSION
const hasRole = (roles) => {
  return (req, res, next) => {
    console.log('Checking roles:', roles, 'for user:', req.user.role);
    if (!Array.isArray(roles)) {
      console.error('hasRole middleware expects an array of roles');
      return res.status(500).json({ error: 'Server configuration error' });
    }
    
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ 
        error: `Access denied. Required roles: ${roles.join(', ')}`,
        userRole: req.user.role,
        requiredRoles: roles
      });
    }
    next();
  };
};

// Check if user has permission for warehouse operations
const canAccessWarehouse = (req, res, next) => {
  const { role, id: userId } = req.user;
  const warehouseId = req.params.warehouseId || req.body.warehouseId || req.query.warehouseId;
  
  console.log('Checking warehouse access:', { role, userId, warehouseId });
  
  if (role === 'owner') {
    // Owner can access any warehouse
    next();
  } else if (role === 'warehouse') {
    // Warehouse can only access their own warehouse
    if (parseInt(warehouseId) === userId) {
      next();
    } else {
      return res.status(403).json({ 
        error: 'Access denied. Can only access your own warehouse.',
        userWarehouse: userId,
        requestedWarehouse: warehouseId
      });
    }
  } else {
    return res.status(403).json({ 
      error: 'Access denied. Owner or warehouse role required for warehouse operations.',
      userRole: role
    });
  }
};

// Check if user can access specific dealer
const canAccessDealer = (req, res, next) => {
  const { role, id: userId } = req.user;
  const dealerId = req.params.dealerId || req.body.dealerId || req.query.dealerId;
  
  console.log('Checking dealer access:', { role, userId, dealerId });
  
  if (['owner', 'warehouse'].includes(role)) {
    // Owner and warehouse can access any dealer
    next();
  } else if (role === 'dealer') {
    // Dealer can only access their own data
    if (parseInt(dealerId) === userId) {
      next();
    } else {
      return res.status(403).json({ 
        error: 'Access denied. Can only access your own dealer data.',
        userDealer: userId,
        requestedDealer: dealerId
      });
    }
  } else {
    return res.status(403).json({ 
      error: 'Access denied. Insufficient permissions for dealer operations.',
      userRole: role
    });
  }
};

// Check if user can access specific salesman
const canAccessSalesman = (req, res, next) => {
  const { role, id: userId } = req.user;
  const salesmanId = req.params.salesmanId || req.body.salesmanId || req.query.salesmanId;
  
  console.log('Checking salesman access:', { role, userId, salesmanId });
  
  if (['owner', 'warehouse'].includes(role)) {
    // Owner and warehouse can access any salesman
    next();
  } else if (role === 'salesman') {
    // Salesman can only access their own data
    if (parseInt(salesmanId) === userId) {
      next();
    } else {
      return res.status(403).json({ 
        error: 'Access denied. Can only access your own salesman data.',
        userSalesman: userId,
        requestedSalesman: salesmanId
      });
    }
  } else {
    return res.status(403).json({ 
      error: 'Access denied. Insufficient permissions for salesman operations.',
      userRole: role
    });
  }
};

module.exports = {
  verifyToken,
  isOwner,
  isWarehouse,
  isOwnerOrWarehouse,
  isDealer,
  isSalesman,
  isSalesmanOrDealer,
  hasRole,
  canAccessWarehouse,
  canAccessDealer,
  canAccessSalesman
};