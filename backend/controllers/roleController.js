const Role = require('../schemas/roleSchema');
const createAuditLog = require('../utils/createAuditLog');

// @desc    Get all roles
// @route   GET /api/roles
// @access  Private
exports.getRoles = async (req, res) => {
  try {
    const { isActive } = req.query;
    const query = {};
    if (isActive !== undefined) {
      query.isActive = isActive === 'true';
    }

    const roles = await Role.find(query).sort({ displayName: 1 });

    res.status(200).json({
      success: true,
      count: roles.length,
      data: roles
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Get single role
// @route   GET /api/roles/:id
// @access  Private
exports.getRole = async (req, res) => {
  try {
    const role = await Role.findById(req.params.id);

    if (!role) {
      return res.status(404).json({
        success: false,
        message: 'Role not found'
      });
    }

    res.status(200).json({
      success: true,
      data: role
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Create role
// @route   POST /api/roles
// @access  Private/Admin
exports.createRole = async (req, res) => {
  try {
    const { name, displayName, description, defaultPermissions, subRoles, allowSubRoles } = req.body;

    // Check if role exists
    const roleExists = await Role.findOne({ name: name.toLowerCase() });
    if (roleExists) {
      return res.status(400).json({
        success: false,
        message: 'Role already exists'
      });
    }

    const role = await Role.create({
      name: name.toLowerCase(),
      displayName,
      description,
      defaultPermissions: defaultPermissions || [],
      subRoles: subRoles || [],
      allowSubRoles: allowSubRoles || false,
      createdBy: req.user.id
    });

    await createAuditLog('Role Created', req.user, 'other', role._id, { name, displayName }, req);

    res.status(201).json({
      success: true,
      data: role,
      message: 'Role created successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Update role
// @route   PUT /api/roles/:id
// @access  Private/Admin
exports.updateRole = async (req, res) => {
  try {
    let role = await Role.findById(req.params.id);

    if (!role) {
      return res.status(404).json({
        success: false,
        message: 'Role not found'
      });
    }

    const { displayName, description, defaultPermissions, isActive, subRoles, allowSubRoles } = req.body;

    if (displayName) role.displayName = displayName;
    if (description !== undefined) role.description = description;
    if (defaultPermissions) role.defaultPermissions = defaultPermissions;
    if (isActive !== undefined) role.isActive = isActive;
    if (subRoles) role.subRoles = subRoles;
    if (allowSubRoles !== undefined) role.allowSubRoles = allowSubRoles;

    await role.save();

    await createAuditLog('Role Updated', req.user, 'other', role._id, { updatedFields: Object.keys(req.body) }, req);

    res.status(200).json({
      success: true,
      data: role,
      message: 'Role updated successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Delete role
// @route   DELETE /api/roles/:id
// @access  Private/Admin
exports.deleteRole = async (req, res) => {
  try {
    const role = await Role.findById(req.params.id);

    if (!role) {
      return res.status(404).json({
        success: false,
        message: 'Role not found'
      });
    }

    // Don't allow deleting default roles
    const defaultRoles = ['admin', 'management', 'team_member'];
    if (defaultRoles.includes(role.name)) {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete default system roles'
      });
    }

    await role.deleteOne();

    await createAuditLog('Role Deleted', req.user, 'other', req.params.id, { name: role.name }, req);

    res.status(200).json({
      success: true,
      message: 'Role deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Add sub-role to role
// @route   POST /api/roles/:id/sub-roles
// @access  Private/Admin
exports.addSubRole = async (req, res) => {
  try {
    const role = await Role.findById(req.params.id);

    if (!role) {
      return res.status(404).json({
        success: false,
        message: 'Role not found'
      });
    }

    const { name, description, permissions } = req.body;

    role.subRoles.push({
      name,
      description,
      permissions: permissions || []
    });

    await role.save();

    res.status(200).json({
      success: true,
      data: role,
      message: 'Sub-role added successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Update sub-role
// @route   PUT /api/roles/:id/sub-roles/:subRoleId
// @access  Private/Admin
exports.updateSubRole = async (req, res) => {
  try {
    const role = await Role.findById(req.params.id);

    if (!role) {
      return res.status(404).json({
        success: false,
        message: 'Role not found'
      });
    }

    const subRole = role.subRoles.id(req.params.subRoleId);
    if (!subRole) {
      return res.status(404).json({
        success: false,
        message: 'Sub-role not found'
      });
    }

    const { name, description, permissions, isActive } = req.body;
    if (name) subRole.name = name;
    if (description !== undefined) subRole.description = description;
    if (permissions) subRole.permissions = permissions;
    if (isActive !== undefined) subRole.isActive = isActive;

    await role.save();

    res.status(200).json({
      success: true,
      data: role,
      message: 'Sub-role updated successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Delete sub-role
// @route   DELETE /api/roles/:id/sub-roles/:subRoleId
// @access  Private/Admin
exports.deleteSubRole = async (req, res) => {
  try {
    const role = await Role.findById(req.params.id);

    if (!role) {
      return res.status(404).json({
        success: false,
        message: 'Role not found'
      });
    }

    role.subRoles.id(req.params.subRoleId).deleteOne();
    await role.save();

    res.status(200).json({
      success: true,
      data: role,
      message: 'Sub-role deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

