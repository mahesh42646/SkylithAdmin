const express = require('express');
const router = express.Router();
const {
  getCalendarEvents,
  getCalendar,
  createCalendarEvent,
  updateCalendarEvent,
  deleteCalendarEvent
} = require('../controllers/calendarController');
const { protect, checkPermission } = require('../middleware/auth');
const { PERMISSIONS } = require('../utils/permissions');

router.get('/events', protect, getCalendarEvents);
router.get('/', protect, checkPermission(PERMISSIONS.MANAGE_CALENDAR), getCalendar);
router.post('/', protect, checkPermission(PERMISSIONS.MANAGE_CALENDAR), createCalendarEvent);
router.put('/:id', protect, checkPermission(PERMISSIONS.MANAGE_CALENDAR), updateCalendarEvent);
router.delete('/:id', protect, checkPermission(PERMISSIONS.MANAGE_CALENDAR), deleteCalendarEvent);

module.exports = router;
