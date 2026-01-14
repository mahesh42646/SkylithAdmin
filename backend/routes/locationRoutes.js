const express = require('express');
const router = express.Router();
const {
  trackLocation,
  getActiveLocations,
  getLocationHistory,
  deactivateLocation
} = require('../controllers/locationTrackingController');
const { protect, checkPermission } = require('../middleware/auth');
const { PERMISSIONS } = require('../utils/permissions');

// User routes
router.post('/track', protect, trackLocation);
router.post('/deactivate', protect, deactivateLocation);

// Admin routes
router.get('/active', protect, checkPermission(PERMISSIONS.VIEW_ATTENDANCE), getActiveLocations);
router.get('/history/:userId', protect, checkPermission(PERMISSIONS.VIEW_ATTENDANCE), getLocationHistory);

module.exports = router;
