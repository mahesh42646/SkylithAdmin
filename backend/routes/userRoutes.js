const express = require('express');
const router = express.Router();
const {
  getUsers,
  getUser,
  createUser,
  updateUser,
  deleteUser,
  uploadAvatar
} = require('../controllers/userController');
const { protect, authorize, checkPermission } = require('../middleware/auth');
const { upload } = require('../middleware/upload');
const uploadFiles = require('../middleware/uploadFiles');
const { PERMISSIONS } = require('../utils/permissions');

// All routes are protected
router.use(protect);

// Get all users - requires view_users permission
router.get('/', checkPermission(PERMISSIONS.VIEW_USERS), getUsers);

// Get single user
router.get('/:id', getUser);

// Create user - requires create_users permission
router.post(
  '/',
  checkPermission(PERMISSIONS.CREATE_USERS),
  uploadFiles.fields([
    { name: 'avatar', maxCount: 1 },
    { name: 'documents', maxCount: 10 }
  ]),
  createUser
);

// Update user
router.put(
  '/:id',
  uploadFiles.fields([
    { name: 'avatar', maxCount: 1 },
    { name: 'documents', maxCount: 10 }
  ]),
  updateUser
);

// Delete user - requires delete_users permission
router.delete(
  '/:id',
  checkPermission(PERMISSIONS.DELETE_USERS),
  deleteUser
);

// Upload avatar
router.post(
  '/:id/avatar',
  upload.single('avatar'),
  uploadAvatar
);

module.exports = router;

