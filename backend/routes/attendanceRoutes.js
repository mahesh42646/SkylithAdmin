const express = require('express');
const router = express.Router();
const {
  punchIn,
  punchOut,
  getTodayAttendance,
  getMyAttendance,
  getAllAttendance,
  getAttendanceById,
  updateAttendance,
  deleteAttendance,
  getAttendanceSummary
} = require('../controllers/attendanceController');
const { protect, checkPermission } = require('../middleware/auth');
const { PERMISSIONS } = require('../utils/permissions');

// Mobile app routes (for users)
router.post('/punch-in', protect, punchIn);
router.post('/punch-out', protect, punchOut);
router.get('/today', protect, getTodayAttendance);
router.get('/my-attendance', protect, getMyAttendance);

// Admin routes - using checkPermission instead of authorize
// Note: Specific routes BEFORE generic :id route
router.get('/', protect, checkPermission(PERMISSIONS.VIEW_ATTENDANCE), getAllAttendance);
router.get('/summary/:userId', protect, checkPermission(PERMISSIONS.VIEW_ATTENDANCE), getAttendanceSummary);
router.get('/:id', protect, checkPermission(PERMISSIONS.VIEW_ATTENDANCE), getAttendanceById);
router.put('/:id', protect, checkPermission(PERMISSIONS.MANAGE_ATTENDANCE), updateAttendance);
router.delete('/:id', protect, checkPermission(PERMISSIONS.MANAGE_ATTENDANCE), deleteAttendance);

module.exports = router;
