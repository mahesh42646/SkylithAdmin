const express = require('express');
const router = express.Router();
const {
  createLeave,
  getMyLeaves,
  getAllLeaves,
  approveLeave,
  rejectLeave,
  cancelLeave
} = require('../controllers/leaveController');
const { protect, checkPermission } = require('../middleware/auth');
const { PERMISSIONS } = require('../utils/permissions');

router.post('/', protect, createLeave);
router.get('/my', protect, getMyLeaves);
router.get('/', protect, checkPermission(PERMISSIONS.VIEW_LEAVES), getAllLeaves);
router.put('/:id/approve', protect, checkPermission(PERMISSIONS.MANAGE_LEAVES), approveLeave);
router.put('/:id/reject', protect, checkPermission(PERMISSIONS.MANAGE_LEAVES), rejectLeave);
router.delete('/:id', protect, cancelLeave);

module.exports = router;
