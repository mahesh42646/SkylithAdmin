const express = require('express');
const router = express.Router();
const {
  createLeave,
  getMyLeaves,
  getAllLeaves,
  approveLeave,
  rejectLeave,
  updateLeave,
  cancelLeave
} = require('../controllers/leaveController');
const { protect, checkPermission } = require('../middleware/auth');
const { PERMISSIONS } = require('../utils/permissions');

router.post('/', protect, createLeave);
router.get('/my', protect, getMyLeaves);
router.get('/', protect, checkPermission(PERMISSIONS.VIEW_LEAVES), getAllLeaves);
router.put('/:id', protect, updateLeave);
router.put('/:id/approve', protect, checkPermission(PERMISSIONS.MANAGE_LEAVES), approveLeave);
router.put('/:id/reject', protect, checkPermission(PERMISSIONS.MANAGE_LEAVES), rejectLeave);
router.put('/:id/cancel', protect, cancelLeave);

module.exports = router;
