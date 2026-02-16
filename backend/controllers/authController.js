const User = require('../schemas/userSchema');
const generateToken = require('../utils/generateToken');
const { getDefaultPermissions, PERMISSIONS, ROLE_PERMISSIONS } = require('../utils/permissions');
const createAuditLog = require('../utils/createAuditLog');

const MOBILE_APP_PERMISSIONS = [
  PERMISSIONS.MARK_ATTENDANCE,
  PERMISSIONS.VIEW_ATTENDANCE,
  PERMISSIONS.VIEW_LEAVES,
  PERMISSIONS.VIEW_CALENDAR,
  PERMISSIONS.VIEW_TICKETS,
  PERMISSIONS.RAISE_TICKET,
  PERMISSIONS.VIEW_TASKS,
  PERMISSIONS.VIEW_PROJECTS
];

function hasMobileAccess(user) {
  const perms = user.permissions || [];
  const rolePerms = ROLE_PERMISSIONS[user.role] || [];
  const allPerms = [...new Set([...perms, ...rolePerms])];
  return MOBILE_APP_PERMISSIONS.some(p => allPerms.includes(p));
}

// @desc    Register user (Admin only)
// @route   POST /api/auth/register
// @access  Private/Admin
exports.register = async (req, res) => {
  try {
    const { name, email, password, role, status, department, permissions } = req.body;

    // Check if user exists
    const userExists = await User.findOne({ email: email.toLowerCase() });
    if (userExists) {
      return res.status(400).json({
        success: false,
        message: 'User already exists with this email'
      });
    }

    // Get default permissions if not provided
    const userPermissions = permissions || getDefaultPermissions(role || 'team_member');

    // Create user
    const user = await User.create({
      name,
      email: email.toLowerCase(),
      password,
      role: role || 'team_member',
      status: status || 'active',
      department,
      permissions: userPermissions
    });

    // Create audit log
    await createAuditLog('User Created', req.user, 'user', user._id, { name, email, role }, req);

    res.status(201).json({
      success: true,
      data: user,
      message: 'User created successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validate email & password
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide email and password'
      });
    }

    // Check for user
    const user = await User.findOne({ email: email.toLowerCase() }).select('+password');

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    // Check if password matches
    const isMatch = await user.matchPassword(password);

    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    // Check if user is active
    if (user.status !== 'active') {
      return res.status(401).json({
        success: false,
        message: 'Your account is inactive. Please contact administrator.'
      });
    }

    // Update last login
    user.lastLogin = Date.now();
    await user.save({ validateBeforeSave: false });

    // Ensure permissions are set
    if (!user.permissions || user.permissions.length === 0) {
      user.permissions = getDefaultPermissions(user.role);
      await user.save({ validateBeforeSave: false });
    }

    // Mobile app: reject if user has no mobile access
    if (req.body.client === 'mobile' && !hasMobileAccess(user)) {
      return res.status(403).json({
        success: false,
        message: 'You do not have access to the mobile app. Please contact your administrator.'
      });
    }

    // Create audit log
    await createAuditLog('User Login', user, 'other', null, null, req);

    // Generate token
    const token = generateToken(user._id);

    res.status(200).json({
      success: true,
      token,
      data: user
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Get current logged in user
// @route   GET /api/auth/me
// @access  Private
exports.getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);

    res.status(200).json({
      success: true,
      data: user
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Logout user
// @route   POST /api/auth/logout
// @access  Private
exports.logout = async (req, res) => {
  try {
    await createAuditLog('User Logout', req.user, 'other', null, null, req);

    res.status(200).json({
      success: true,
      message: 'Logged out successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

