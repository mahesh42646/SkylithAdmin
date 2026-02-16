const CalendarEvent = require('../schemas/calendarSchema');
const Leave = require('../schemas/leaveSchema');
const Attendance = require('../schemas/attendanceSchema');
const { PERMISSIONS } = require('../utils/permissions');

// @desc    Get calendar events (public holidays + approved leaves for date range)
// @route   GET /api/calendar/events
// @access  Private
exports.getCalendarEvents = async (req, res) => {
  try {
    let { startDate, endDate, userId } = req.query;
    if (!userId && (!req.user.permissions || !req.user.permissions.includes(PERMISSIONS.MANAGE_LEAVES))) {
      userId = req.user.id;
    }

    if (!startDate || !endDate) {
      return res.status(400).json({
        success: false,
        message: 'startDate and endDate are required'
      });
    }

    const start = new Date(startDate);
    const end = new Date(endDate);
    start.setHours(0, 0, 0, 0);
    end.setHours(23, 59, 59, 999);

    // Public holidays / calendar events
    const holidays = await CalendarEvent.find({
      date: { $gte: start, $lte: end }
    }).sort({ date: 1 });

    const events = holidays.map(h => ({
      id: h._id,
      date: h.date,
      type: 'holiday',
      name: h.name,
      description: h.description,
      eventType: h.type
    }));

    // Approved leaves - for own user or all if admin
    const leaveQuery = {
      status: 'approved',
      startDate: { $lte: end },
      endDate: { $gte: start }
    };
    if (userId) leaveQuery.user = userId;

    const leaves = await Leave.find(leaveQuery)
      .populate('user', 'name email')
      .sort({ startDate: 1 });

    leaves.forEach(leave => {
      const current = new Date(Math.max(leave.startDate.getTime(), start.getTime()));
      const leaveEnd = new Date(Math.min(leave.endDate.getTime(), end.getTime()));
      current.setHours(0, 0, 0, 0);
      leaveEnd.setHours(23, 59, 59, 999);

      while (current <= leaveEnd) {
        events.push({
          id: `${leave._id}-${current.toISOString().split('T')[0]}`,
          date: new Date(current),
          type: 'leave',
          name: leave.user?.name || 'Leave',
          leaveType: leave.type,
          userId: leave.user?._id,
          userName: leave.user?.name
        });
        current.setDate(current.getDate() + 1);
      }
    });

    events.sort((a, b) => new Date(a.date) - new Date(b.date));

    res.status(200).json({ success: true, data: events });
  } catch (error) {
    console.error('Get calendar events error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// @desc    Get all calendar events (admin - for setup)
// @route   GET /api/calendar
// @access  Private (MANAGE_CALENDAR)
exports.getCalendar = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    const query = {};
    if (startDate) query.date = { ...query.date, $gte: new Date(startDate) };
    if (endDate) query.date = { ...query.date, $lte: new Date(endDate) };

    const events = await CalendarEvent.find(query).sort({ date: 1 });

    res.status(200).json({ success: true, data: events });
  } catch (error) {
    console.error('Get calendar error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// @desc    Create calendar event (public holiday)
// @route   POST /api/calendar
// @access  Private (MANAGE_CALENDAR)
exports.createCalendarEvent = async (req, res) => {
  try {
    const { date, type, name, description } = req.body;

    const dateObj = new Date(date);
    dateObj.setHours(0, 0, 0, 0);

    const event = new CalendarEvent({
      date: dateObj,
      type: type || 'public_holiday',
      name: name || 'Holiday',
      description: description || ''
    });

    await event.save();

    res.status(201).json({
      success: true,
      data: event,
      message: 'Calendar event created'
    });
  } catch (error) {
    console.error('Create calendar event error:', error);
    if (error.code === 11000) {
      return res.status(400).json({ success: false, message: 'Event already exists for this date' });
    }
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// @desc    Update calendar event
// @route   PUT /api/calendar/:id
// @access  Private (MANAGE_CALENDAR)
exports.updateCalendarEvent = async (req, res) => {
  try {
    const event = await CalendarEvent.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );

    if (!event) {
      return res.status(404).json({ success: false, message: 'Event not found' });
    }

    res.status(200).json({ success: true, data: event });
  } catch (error) {
    console.error('Update calendar event error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// @desc    Delete calendar event
// @route   DELETE /api/calendar/:id
// @access  Private (MANAGE_CALENDAR)
exports.deleteCalendarEvent = async (req, res) => {
  try {
    const event = await CalendarEvent.findByIdAndDelete(req.params.id);

    if (!event) {
      return res.status(404).json({ success: false, message: 'Event not found' });
    }

    res.status(200).json({ success: true, message: 'Event deleted' });
  } catch (error) {
    console.error('Delete calendar event error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};
