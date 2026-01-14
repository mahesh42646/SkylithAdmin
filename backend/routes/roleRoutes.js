const express = require('express');
const router = express.Router();
const {
  getRoles,
  getRole,
  createRole,
  updateRole,
  deleteRole,
  addSubRole,
  updateSubRole,
  deleteSubRole
} = require('../controllers/roleController');
const { protect, authorize } = require('../middleware/auth');

// All routes are protected
router.use(protect);

// Get all roles
router.get('/', getRoles);

// Get single role
router.get('/:id', getRole);

// Create role (Admin only)
router.post('/', authorize('admin'), createRole);

// Update role (Admin only)
router.put('/:id', authorize('admin'), updateRole);

// Delete role (Admin only)
router.delete('/:id', authorize('admin'), deleteRole);

// Add sub-role (Admin only)
router.post('/:id/sub-roles', authorize('admin'), addSubRole);

// Update sub-role (Admin only)
router.put('/:id/sub-roles/:subRoleId', authorize('admin'), updateSubRole);

// Delete sub-role (Admin only)
router.delete('/:id/sub-roles/:subRoleId', authorize('admin'), deleteSubRole);

module.exports = router;


