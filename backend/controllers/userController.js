const User = require('../schemas/userSchema');
const { getDefaultPermissions } = require('../utils/permissions');
const createAuditLog = require('../utils/createAuditLog');

// @desc    Get all users
// @route   GET /api/users
// @access  Private
exports.getUsers = async (req, res) => {
  try {
    const { status, role, search, page = 1, limit = 10 } = req.query;

    // Build query
    const query = {};
    if (status) query.status = status;
    if (role) query.role = role;
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ];
    }

    // Pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const users = await User.find(query)
      .select('-password')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await User.countDocuments(query);

    res.status(200).json({
      success: true,
      count: users.length,
      total,
      data: users,
      page: parseInt(page),
      pages: Math.ceil(total / parseInt(limit))
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Get single user
// @route   GET /api/users/:id
// @access  Private
exports.getUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('-password');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

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

// @desc    Create user
// @route   POST /api/users
// @access  Private/Admin
exports.createUser = async (req, res) => {
  try {
    let { name, email, password, role, subRole, status, department, dateOfBirth, permissions } = req.body;

    // Parse permissions if it's a string
    if (typeof permissions === 'string') {
      try {
        permissions = JSON.parse(permissions);
      } catch (e) {
        permissions = [];
      }
    }

    // Check if user exists
    const userExists = await User.findOne({ email: email.toLowerCase() });
    if (userExists) {
      return res.status(400).json({
        success: false,
        message: 'User already exists with this email'
      });
    }

    // Get default permissions if not provided
    const userPermissions = (permissions && Array.isArray(permissions) && permissions.length > 0) 
      ? permissions 
      : getDefaultPermissions(role || 'team_member');

    // Handle avatar upload
    let avatar = null;
    if (req.files && req.files.avatar) {
      const avatarFile = Array.isArray(req.files.avatar) ? req.files.avatar[0] : req.files.avatar;
      avatar = `/uploads/${req.user.role === 'admin' ? 'admin' : 'users'}/${avatarFile.filename}`;
    } else if (req.file && req.file.fieldname === 'avatar') {
      avatar = `/uploads/${req.user.role === 'admin' ? 'admin' : 'users'}/${req.file.filename}`;
    }

    // Handle documents upload
    const documents = [];
    if (req.files && req.files.documents) {
      const docFiles = Array.isArray(req.files.documents) ? req.files.documents : [req.files.documents];
      const uploadPath = req.user.role === 'admin' ? 'admin' : req.user.role === 'management' ? 'team' : 'users';
      docFiles.forEach(file => {
        documents.push({
          filename: file.filename,
          originalName: file.originalname,
          path: `/uploads/${uploadPath}/documents/${file.filename}`,
          mimeType: file.mimetype,
          size: file.size
        });
      });
    }

    // Parse dateOfBirth if provided
    let parsedDateOfBirth = null;
    if (dateOfBirth) {
      parsedDateOfBirth = new Date(dateOfBirth);
      if (isNaN(parsedDateOfBirth.getTime())) {
        parsedDateOfBirth = null;
      }
    }

    const user = await User.create({
      name,
      email: email.toLowerCase(),
      password,
      role: role || 'team_member',
      subRole: subRole || '',
      status: status || 'active',
      department: department || '',
      dateOfBirth: parsedDateOfBirth,
      avatar,
      documents,
      permissions: userPermissions
    });

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

// @desc    Update user
// @route   PUT /api/users/:id
// @access  Private
exports.updateUser = async (req, res) => {
  try {
    let user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Check if user can update (own profile or admin)
    if (req.user.id !== req.params.id && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update this user'
      });
    }

    let { name, email, role, subRole, status, department, dateOfBirth, permissions, password } = req.body;

    // Parse permissions if it's a string
    if (typeof permissions === 'string') {
      try {
        permissions = JSON.parse(permissions);
      } catch (e) {
        permissions = undefined;
      }
    }

    // Handle avatar upload
    if (req.files && req.files.avatar) {
      const avatarFile = Array.isArray(req.files.avatar) ? req.files.avatar[0] : req.files.avatar;
      user.avatar = `/uploads/${req.user.role === 'admin' ? 'admin' : 'users'}/${avatarFile.filename}`;
    } else if (req.file && req.file.fieldname === 'avatar') {
      user.avatar = `/uploads/${req.user.role === 'admin' ? 'admin' : 'users'}/${req.file.filename}`;
    }

    // Handle documents upload - append new documents to existing ones
    if (req.files && req.files.documents) {
      const docFiles = Array.isArray(req.files.documents) ? req.files.documents : [req.files.documents];
      const uploadPath = req.user.role === 'admin' ? 'admin' : req.user.role === 'management' ? 'team' : 'users';
      const newDocuments = docFiles.map(file => ({
        filename: file.filename,
        originalName: file.originalname,
        path: `/uploads/${uploadPath}/documents/${file.filename}`,
        mimeType: file.mimetype,
        size: file.size
      }));
      user.documents = [...(user.documents || []), ...newDocuments];
    }

    // Update fields
    if (name) user.name = name;
    if (email && email !== user.email) {
      const emailExists = await User.findOne({ email: email.toLowerCase() });
      if (emailExists) {
        return res.status(400).json({
          success: false,
          message: 'Email already in use'
        });
      }
      user.email = email.toLowerCase();
    }
    if (department !== undefined) user.department = department;
    
    // Parse and update dateOfBirth if provided
    if (dateOfBirth !== undefined) {
      if (dateOfBirth === '' || dateOfBirth === null) {
        user.dateOfBirth = null;
      } else {
        const parsedDate = new Date(dateOfBirth);
        if (!isNaN(parsedDate.getTime())) {
          user.dateOfBirth = parsedDate;
        }
      }
    }
    
    // Only admin can change role, subRole, status, and permissions
    if (req.user.role === 'admin') {
      if (role) user.role = role;
      if (subRole !== undefined) user.subRole = subRole;
      if (status) user.status = status;
      // Always update permissions if provided (even if empty array)
      if (permissions !== undefined && Array.isArray(permissions)) {
        user.permissions = permissions;
      }
    }

    // Update password if provided
    if (password) {
      user.password = password;
    }

    user.updatedAt = Date.now();
    await user.save();

    await createAuditLog('User Updated', req.user, 'user', user._id, { updatedFields: Object.keys(req.body) }, req);

    res.status(200).json({
      success: true,
      data: user,
      message: 'User updated successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Delete user
// @route   DELETE /api/users/:id
// @access  Private/Admin
exports.deleteUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Prevent deleting yourself
    if (req.user.id === req.params.id) {
      return res.status(400).json({
        success: false,
        message: 'You cannot delete your own account'
      });
    }

    await user.deleteOne();

    await createAuditLog('User Deleted', req.user, 'user', req.params.id, { name: user.name, email: user.email }, req);

    res.status(200).json({
      success: true,
      message: 'User deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Upload user avatar
// @route   POST /api/users/:id/avatar
// @access  Private
exports.uploadAvatar = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'Please upload an image file'
      });
    }

    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Check if user can update (own profile or admin)
    if (req.user.id !== req.params.id && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update this user'
      });
    }

    user.avatar = `/uploads/${req.user.role === 'admin' ? 'admin' : 'users'}/${req.file.filename}`;
    await user.save();

    res.status(200).json({
      success: true,
      data: user,
      message: 'Avatar uploaded successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

