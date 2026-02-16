const jwt = require('jsonwebtoken');
const User = require('../schemas/userSchema');
const { ROLE_PERMISSIONS } = require('../utils/permissions');

// Protect routes
exports.protect = async (req, res, next) => {
  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'Not authorized to access this route'
    });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = await User.findById(decoded.id).select('-password');
    
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'User not found'
      });
    }

    if (req.user.status !== 'active') {
      return res.status(401).json({
        success: false,
        message: 'Your account is inactive. Please contact administrator.'
      });
    }

    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: 'Not authorized to access this route'
    });
  }
};

// Grant access to specific roles
exports.authorize = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `User role '${req.user.role}' is not authorized to access this route`
      });
    }
    next();
  };
};

// Check permission
exports.checkPermission = (permission) => {
  return async (req, res, next) => {
    const user = req.user;

    // Admin has all permissions
    if (user.role === 'admin') {
      return next();
    }

    const userPermissions = user.permissions || [];
    const rolePermissions = ROLE_PERMISSIONS[user.role] || [];
    const hasPermission = userPermissions.includes(permission) || rolePermissions.includes(permission);

    if (!hasPermission) {
      return res.status(403).json({
        success: false,
        message: `You do not have permission to perform this action. Required: ${permission}`
      });
    }

    next();
  };
};

