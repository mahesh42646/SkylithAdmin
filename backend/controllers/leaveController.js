const Leave = require('../schemas/leaveSchema');
const Attendance = require('../schemas/attendanceSchema');
const createAuditLog = require('../utils/createAuditLog');
const { PERMISSIONS } = require('../utils/permissions');

// Check overlap with existing approved/pending leaves
async function hasOverlappingLeave(userId, start, end, excludeId = null) {
  const query = {
    user: userId,
    status: { $in: ['pending', 'approved'] },
    $or: [
      { startDate: { $lte: end }, endDate: { $gte: start } }
    ]
  };
  if (excludeId) query._id = { $ne: excludeId };
  const overlap = await Leave.findOne(query);
  return !!overlap;
}

// @desc    Apply for leave (user)
// @route   POST /api/leaves
// @access  Private
exports.createLeave = async (req, res) => {
  try {
    const { startDate, endDate, type, reason } = req.body;
    const userId = req.user.id;

    const start = new Date(startDate);
    const end = new Date(endDate);
    start.setHours(0, 0, 0, 0);
    end.setHours(23, 59, 59, 999);

    if (end < start) {
      return res.status(400).json({ success: false, message: 'End date must be after start date' });
    }

    const overlap = await hasOverlappingLeave(userId, start, end);
    if (overlap) {
      return res.status(400).json({
        success: false,
        message: 'You already have a leave request for these dates. Cannot apply for overlapping leave.'
      });
    }

    const leave = new Leave({
      user: userId,
      startDate: start,
      endDate: end,
      type: type || 'casual',
      reason: reason || ''
    });

    await leave.save();

    await createAuditLog('Leave Request', req.user, 'leave', leave._id, { startDate: start, endDate: end }, req);

    res.status(201).json({
      success: true,
      data: leave,
      message: 'Leave request submitted successfully'
    });
  } catch (error) {
    console.error('Create leave error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// @desc    Get my leaves
// @route   GET /api/leaves/my
// @access  Private
exports.getMyLeaves = async (req, res) => {
  try {
    const { startDate, endDate, status } = req.query;
    const userId = req.user.id;

    const query = { user: userId };
    if (startDate) query.startDate = { $gte: new Date(startDate) };
    if (endDate) query.endDate = { $lte: new Date(endDate) };
    if (status) query.status = status;

    const leaves = await Leave.find(query).sort({ startDate: -1 });

    res.status(200).json({ success: true, data: leaves });
  } catch (error) {
    console.error('Get my leaves error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// @desc    Get all leaves (admin)
// @route   GET /api/leaves
// @access  Private (MANAGE_LEAVES or VIEW_LEAVES)
exports.getAllLeaves = async (req, res) => {
  try {
    const { userId, startDate, endDate, status } = req.query;

    const query = {};
    if (userId) query.user = userId;
    if (startDate) query.startDate = { $gte: new Date(startDate) };
    if (endDate) query.endDate = { $lte: new Date(endDate) };
    if (status) query.status = status;

    const leaves = await Leave.find(query)
      .populate('user', 'name email avatar')
      .populate('approvedBy', 'name')
      .sort({ createdAt: -1 });

    res.status(200).json({ success: true, data: leaves });
  } catch (error) {
    console.error('Get all leaves error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// @desc    Approve leave
// @route   PUT /api/leaves/:id/approve
// @access  Private (MANAGE_LEAVES)
exports.approveLeave = async (req, res) => {
  try {
    const leave = await Leave.findById(req.params.id);
    if (!leave) {
      return res.status(404).json({ success: false, message: 'Leave not found' });
    }
    if (leave.status !== 'pending') {
      return res.status(400).json({ success: false, message: 'Leave is not pending' });
    }

    leave.status = 'approved';
    leave.approvedBy = req.user.id;
    leave.approvedAt = new Date();
    await leave.save();

    // Create attendance records with status 'leave' for each date
    const current = new Date(leave.startDate);
    const end = new Date(leave.endDate);
    current.setHours(0, 0, 0, 0);
    end.setHours(23, 59, 59, 999);

    while (current <= end) {
      const dateOnly = new Date(current);
      dateOnly.setHours(0, 0, 0, 0);

      await Attendance.findOneAndUpdate(
        { user: leave.user, date: dateOnly },
        { status: 'leave', notes: `Leave: ${leave.type}` },
        { upsert: true, new: true }
      );

      current.setDate(current.getDate() + 1);
    }

    await createAuditLog('Leave Approved', req.user, 'leave', leave._id, { leaveId: leave._id }, req);

    res.status(200).json({
      success: true,
      data: leave,
      message: 'Leave approved successfully'
    });
  } catch (error) {
    console.error('Approve leave error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// @desc    Reject leave
// @route   PUT /api/leaves/:id/reject
// @access  Private (MANAGE_LEAVES)
exports.rejectLeave = async (req, res) => {
  try {
    const { rejectionReason } = req.body;
    const leave = await Leave.findById(req.params.id);
    if (!leave) {
      return res.status(404).json({ success: false, message: 'Leave not found' });
    }
    if (leave.status !== 'pending') {
      return res.status(400).json({ success: false, message: 'Leave is not pending' });
    }

    leave.status = 'rejected';
    leave.approvedBy = req.user.id;
    leave.approvedAt = new Date();
    leave.rejectionReason = rejectionReason || '';
    await leave.save();

    await createAuditLog('Leave Rejected', req.user, 'leave', leave._id, { leaveId: leave._id }, req);

    res.status(200).json({
      success: true,
      data: leave,
      message: 'Leave rejected'
    });
  } catch (error) {
    console.error('Reject leave error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// @desc    Update leave (if pending)
// @route   PUT /api/leaves/:id
// @access  Private
exports.updateLeave = async (req, res) => {
  try {
    const leave = await Leave.findById(req.params.id);
    if (!leave) {
      return res.status(404).json({ success: false, message: 'Leave not found' });
    }
    if (leave.user.toString() !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }
    if (leave.status !== 'pending') {
      return res.status(400).json({ success: false, message: 'Only pending leaves can be edited' });
    }

    const { startDate, endDate, type, reason } = req.body;
    if (startDate) leave.startDate = new Date(startDate);
    if (endDate) leave.endDate = new Date(endDate);
    if (type) leave.type = type;
    if (reason !== undefined) leave.reason = reason;

    leave.startDate.setHours(0, 0, 0, 0);
    leave.endDate.setHours(23, 59, 59, 999);

    if (leave.endDate < leave.startDate) {
      return res.status(400).json({ success: false, message: 'End date must be after start date' });
    }

    const overlap = await hasOverlappingLeave(req.user.id, leave.startDate, leave.endDate, leave._id);
    if (overlap) {
      return res.status(400).json({
        success: false,
        message: 'Overlaps with another leave request'
      });
    }

    leave.isEdited = true;
    leave.editedAt = new Date();
    await leave.save();

    await createAuditLog('Leave Updated', req.user, 'leave', leave._id, {}, req);

    res.status(200).json({ success: true, data: leave, message: 'Leave updated' });
  } catch (error) {
    console.error('Update leave error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// @desc    Cancel own leave (if pending) - stores as cancelled
// @route   PUT /api/leaves/:id/cancel
// @access  Private
exports.cancelLeave = async (req, res) => {
  try {
    const leave = await Leave.findById(req.params.id);
    if (!leave) {
      return res.status(404).json({ success: false, message: 'Leave not found' });
    }

    const isOwner = leave.user.toString() === req.user.id;
    if (!isOwner && !req.user.permissions?.includes(PERMISSIONS.MANAGE_LEAVES)) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    if (leave.status !== 'pending') {
      return res.status(400).json({ success: false, message: 'Only pending leaves can be cancelled' });
    }

    leave.status = 'cancelled';
    leave.approvedBy = req.user.id;
    leave.approvedAt = new Date();
    await leave.save();

    await createAuditLog('Leave Cancelled', req.user, 'leave', leave._id, {}, req);

    res.status(200).json({ success: true, data: leave, message: 'Leave cancelled' });
  } catch (error) {
    console.error('Cancel leave error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};
