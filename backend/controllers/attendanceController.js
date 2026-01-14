const Attendance = require('../schemas/attendanceSchema');
const User = require('../schemas/userSchema');
const createAuditLog = require('../utils/createAuditLog');
const fs = require('fs');
const path = require('path');

// Helper function to save base64 image to filesystem
const saveBase64Image = (base64Data, userId, type) => {
  try {
    // Create uploads/attendance directory if it doesn't exist
    const uploadDir = path.join(__dirname, '../uploads/attendance');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }

    // Remove base64 header if present
    const base64Image = base64Data.replace(/^data:image\/\w+;base64,/, '');
    
    // Create unique filename
    const timestamp = Date.now();
    const filename = `${userId}-${type}-${timestamp}.jpg`;
    const filepath = path.join(uploadDir, filename);

    // Save image
    fs.writeFileSync(filepath, base64Image, 'base64');

    // Return relative path for database
    return `/uploads/attendance/${filename}`;
  } catch (error) {
    console.error('Error saving image:', error);
    return null;
  }
};

// @desc    Mark punch in
// @route   POST /api/attendance/punch-in
// @access  Private
exports.punchIn = async (req, res) => {
  try {
    const { location, image, deviceInfo } = req.body;
    const userId = req.user.id;

    // Get today's date (start of day in local timezone)
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Check if already punched in today
    let attendance = await Attendance.findOne({
      user: userId,
      date: today
    });

    if (attendance && attendance.punchIn && attendance.punchIn.time) {
      return res.status(400).json({
        success: false,
        message: 'Already punched in today'
      });
    }

    // Save image to filesystem
    const imagePath = image ? saveBase64Image(image, userId, 'punchin') : null;

    // Create or update attendance
    if (!attendance) {
      attendance = new Attendance({
        user: userId,
        date: today
      });
    }

    const punchInTime = new Date(); // This will be in server's timezone

    attendance.punchIn = {
      time: punchInTime,
      location,
      image: imagePath, // Store file path instead of base64
    };
    
    // Determine status based on punch in time
    const hour = punchInTime.getHours();
    const minute = punchInTime.getMinutes();
    
    // Late if after 10:00 AM
    if (hour > 10 || (hour === 10 && minute > 0)) {
      attendance.status = 'late';
    } else {
      attendance.status = 'present';
    }

    await attendance.save();

    await createAuditLog('Punch In', req.user, 'attendance', attendance._id, { time: punchInTime }, req);

    res.status(200).json({
      success: true,
      data: attendance,
      message: 'Punched in successfully'
    });
  } catch (error) {
    console.error('Punch in error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Helper function to calculate distance
function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371e3; // Earth's radius in meters
  const φ1 = lat1 * Math.PI / 180;
  const φ2 = lat2 * Math.PI / 180;
  const Δφ = (lat2 - lat1) * Math.PI / 180;
  const Δλ = (lon2 - lon1) * Math.PI / 180;

  const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
          Math.cos(φ1) * Math.cos(φ2) *
          Math.sin(Δλ/2) * Math.sin(Δλ/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));

  return R * c; // Distance in meters
}

// @desc    Mark punch out
// @route   POST /api/attendance/punch-out
// @access  Private
exports.punchOut = async (req, res) => {
  try {
    const { location, image, deviceInfo } = req.body;
    const userId = req.user.id;

    // Get today's date
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Find today's attendance
    const attendance = await Attendance.findOne({
      user: userId,
      date: today
    });

    if (!attendance || !attendance.punchIn || !attendance.punchIn.time) {
      return res.status(400).json({
        success: false,
        message: 'Please punch in first'
      });
    }

    if (attendance.punchOut && attendance.punchOut.time) {
      return res.status(400).json({
        success: false,
        message: 'Already punched out today'
      });
    }

    // Calculate distance from punch in location
    let locationWarning = null;
    let distanceFromPunchIn = 0;

    if (attendance.punchIn.location?.latitude && attendance.punchIn.location?.longitude &&
        location?.latitude && location?.longitude) {
      distanceFromPunchIn = calculateDistance(
        attendance.punchIn.location.latitude,
        attendance.punchIn.location.longitude,
        location.latitude,
        location.longitude
      );

      // Warn if >100m away
      if (distanceFromPunchIn > 100) {
        locationWarning = `You are ${Math.round(distanceFromPunchIn)}m away from your punch in location. This will be flagged.`;
      }
    }

    // Save image to filesystem
    const imagePath = image ? saveBase64Image(image, userId, 'punchout') : null;

    const punchOutTime = new Date();

    attendance.punchOut = {
      time: punchOutTime,
      location,
      image: imagePath, // Store file path instead of base64
    };

    // Calculate working hours
    const diffMs = punchOutTime - attendance.punchIn.time;
    const diffHours = diffMs / (1000 * 60 * 60);
    attendance.activeHours = parseFloat(diffHours.toFixed(2));

    // Status will be calculated by pre-save hook (handles late + half_day)

    await attendance.save();

    await createAuditLog('Punch Out', req.user, 'attendance', attendance._id, { 
      time: punchOutTime, 
      workingHours: attendance.activeHours,
      locationDistance: distanceFromPunchIn,
      locationWarning: locationWarning
    }, req);

    res.status(200).json({
      success: true,
      data: attendance,
      message: 'Punched out successfully',
      warning: locationWarning, // Send warning to client
      locationDistance: Math.round(distanceFromPunchIn)
    });
  } catch (error) {
    console.error('Punch out error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Get today's attendance status
// @route   GET /api/attendance/today
// @access  Private
exports.getTodayAttendance = async (req, res) => {
  try {
    const userId = req.user.id;

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const attendance = await Attendance.findOne({
      user: userId,
      date: today
    }).populate('user', 'name email');

    res.status(200).json({
      success: true,
      data: attendance
    });
  } catch (error) {
    console.error('Get today attendance error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Get user's attendance history
// @route   GET /api/attendance/my-attendance
// @access  Private
exports.getMyAttendance = async (req, res) => {
  try {
    const { startDate, endDate, page = 1, limit = 30 } = req.query;
    const userId = req.user.id;

    const query = { user: userId };

    if (startDate && endDate) {
      query.date = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    }

    const attendance = await Attendance.find(query)
      .sort({ date: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .populate('user', 'name email');

    const count = await Attendance.countDocuments(query);

    // Calculate statistics - convert ObjectId to string for matching
    const mongoose = require('mongoose');
    const userIdObj = new mongoose.Types.ObjectId(userId);
    const stats = await Attendance.aggregate([
      { $match: { user: userIdObj } },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]);

    const statistics = {
      present: stats.find(s => s._id === 'present')?.count || 0,
      absent: stats.find(s => s._id === 'absent')?.count || 0,
      late: stats.find(s => s._id === 'late')?.count || 0,
      half_day: stats.find(s => s._id === 'half_day')?.count || 0,
      leave: stats.find(s => s._id === 'leave')?.count || 0,
      holiday: stats.find(s => s._id === 'holiday')?.count || 0
    };

    console.log('My attendance stats:', statistics);
    console.log('Found attendance records:', attendance.length);

    res.status(200).json({
      success: true,
      data: attendance,
      statistics,
      pagination: {
        total: count,
        page: parseInt(page),
        pages: Math.ceil(count / limit)
      }
    });
  } catch (error) {
    console.error('Get my attendance error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Get attendance by ID
// @route   GET /api/attendance/:id
// @access  Private (VIEW_ATTENDANCE permission)
exports.getAttendanceById = async (req, res) => {
  try {
    const attendance = await Attendance.findById(req.params.id)
      .populate('user', 'name email role department')
      .populate('editedBy', 'name email');

    if (!attendance) {
      return res.status(404).json({
        success: false,
        message: 'Attendance record not found'
      });
    }

    res.status(200).json({
      success: true,
      data: attendance
    });
  } catch (error) {
    console.error('Get attendance by ID error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Get all attendance (Admin/Management)
// @route   GET /api/attendance
// @access  Private (Admin/Management with VIEW_ATTENDANCE permission)
exports.getAllAttendance = async (req, res) => {
  try {
    const { userId, startDate, endDate, status, page = 1, limit = 1000, showAllUsers = 'false' } = req.query;

    // If showAllUsers is true, return all users with their attendance for the date range
    if (showAllUsers === 'true' && startDate && endDate) {
      const start = new Date(startDate);
      const end = new Date(endDate);

      // Get all active users
      const users = await User.find({ status: { $ne: 'inactive' } })
        .select('name email avatar department role createdAt attendanceStartDate')
        .sort({ name: 1 });

      // Get all attendance records for the date range
      const attendanceRecords = await Attendance.find({
        date: { $gte: start, $lte: end }
      }).populate('editedBy', 'name email');

      // Create a map of attendance by user and date
      const attendanceMap = {};
      attendanceRecords.forEach(record => {
        const userId = record.user.toString();
        const dateKey = record.date.toISOString().split('T')[0];
        if (!attendanceMap[userId]) {
          attendanceMap[userId] = {};
        }
        attendanceMap[userId][dateKey] = record;
      });

      // Build result array with all users and their attendance
      const result = [];
      
      // Iterate through each day in the range
      const currentDate = new Date(start);
      while (currentDate <= end) {
        const dateKey = currentDate.toISOString().split('T')[0];
        
        users.forEach(user => {
          const userId = user._id.toString();
          
          // Check if user account was created before or on this date
          const userCreatedDate = new Date(user.createdAt);
          userCreatedDate.setHours(0, 0, 0, 0);
          
          const attendanceStartDate = user.attendanceStartDate 
            ? new Date(user.attendanceStartDate) 
            : userCreatedDate;
          attendanceStartDate.setHours(0, 0, 0, 0);
          
          // Only include dates after attendance start date
          if (currentDate >= attendanceStartDate) {
            const attendance = attendanceMap[userId]?.[dateKey];
            
            if (attendance) {
              // User has attendance record
              result.push({
                ...attendance.toObject(),
                user: user
              });
            } else {
              // User has no attendance record - create placeholder
              result.push({
                _id: null,
                user: user,
                date: new Date(currentDate),
                status: 'absent',
                punchIn: null,
                punchOut: null,
                workingHours: 0,
                isEdited: false,
                notes: 'Not marked'
              });
            }
          }
        });
        
        currentDate.setDate(currentDate.getDate() + 1);
      }

      // Apply filters
      let filteredResult = result;
      if (userId) {
        filteredResult = filteredResult.filter(r => r.user._id.toString() === userId);
      }
      if (status) {
        filteredResult = filteredResult.filter(r => r.status === status);
      }

      // Sort by date descending
      filteredResult.sort((a, b) => new Date(b.date) - new Date(a.date));

      return res.status(200).json({
        success: true,
        data: filteredResult,
        pagination: {
          total: filteredResult.length,
          page: 1,
          pages: 1
        }
      });
    }

    // Default behavior - only return existing attendance records
    const query = {};

    if (userId) {
      query.user = userId;
    }

    if (startDate && endDate) {
      query.date = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    }

    if (status) {
      query.status = status;
    }

    const attendance = await Attendance.find(query)
      .populate('user', 'name email avatar department')
      .populate('editedBy', 'name email')
      .sort({ date: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const count = await Attendance.countDocuments(query);

    res.status(200).json({
      success: true,
      data: attendance,
      pagination: {
        total: count,
        page: parseInt(page),
        pages: Math.ceil(count / limit)
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Update attendance (Admin)
// @route   PUT /api/attendance/:id
// @access  Private (Admin with MANAGE_ATTENDANCE permission)
exports.updateAttendance = async (req, res) => {
  try {
    const { status, notes, punchIn, punchOut } = req.body;
    const attendanceId = req.params.id;

    const attendance = await Attendance.findById(attendanceId);

    if (!attendance) {
      return res.status(404).json({
        success: false,
        message: 'Attendance record not found'
      });
    }

    // Update fields
    if (status) attendance.status = status;
    if (notes !== undefined) attendance.notes = notes;
    if (punchIn) {
      if (punchIn.time) attendance.punchIn.time = new Date(punchIn.time);
      if (punchIn.location) attendance.punchIn.location = punchIn.location;
    }
    if (punchOut) {
      if (punchOut.time) attendance.punchOut.time = new Date(punchOut.time);
      if (punchOut.location) attendance.punchOut.location = punchOut.location;
    }

    attendance.isEdited = true;
    attendance.editedBy = req.user.id;
    attendance.editedAt = new Date();

    await attendance.save();

    await createAuditLog('Attendance Updated', req.user, 'attendance', attendance._id, { status, notes }, req);

    res.status(200).json({
      success: true,
      data: attendance,
      message: 'Attendance updated successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Delete attendance (Admin)
// @route   DELETE /api/attendance/:id
// @access  Private (Admin with MANAGE_ATTENDANCE permission)
exports.deleteAttendance = async (req, res) => {
  try {
    const attendanceId = req.params.id;

    const attendance = await Attendance.findById(attendanceId);

    if (!attendance) {
      return res.status(404).json({
        success: false,
        message: 'Attendance record not found'
      });
    }

    await attendance.deleteOne();

    await createAuditLog('Attendance Deleted', req.user, 'attendance', attendanceId, null, req);

    res.status(200).json({
      success: true,
      message: 'Attendance deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Get attendance summary for a user
// @route   GET /api/attendance/summary/:userId
// @access  Private (Admin/Management with VIEW_ATTENDANCE permission)
exports.getAttendanceSummary = async (req, res) => {
  try {
    const { userId } = req.params;
    const { startDate, endDate } = req.query;

    const query = { user: userId };

    if (startDate && endDate) {
      query.date = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    } else {
      // Default to current month
      const now = new Date();
      query.date = {
        $gte: new Date(now.getFullYear(), now.getMonth(), 1),
        $lte: new Date(now.getFullYear(), now.getMonth() + 1, 0)
      };
    }

    const stats = await Attendance.aggregate([
      { $match: query },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
          totalHours: { $sum: '$workingHours' }
        }
      }
    ]);

    const summary = {
      present: stats.find(s => s._id === 'present')?.count || 0,
      absent: stats.find(s => s._id === 'absent')?.count || 0,
      late: stats.find(s => s._id === 'late')?.count || 0,
      half_day: stats.find(s => s._id === 'half_day')?.count || 0,
      leave: stats.find(s => s._id === 'leave')?.count || 0,
      holiday: stats.find(s => s._id === 'holiday')?.count || 0,
      totalWorkingHours: stats.reduce((sum, s) => sum + (s.totalHours || 0), 0)
    };

    res.status(200).json({
      success: true,
      data: summary
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Manually create/mark attendance (Admin only)
// @route   POST /api/attendance/manual
// @access  Private (Admin with MANAGE_ATTENDANCE permission)
exports.createManualAttendance = async (req, res) => {
  try {
    const { userId, date, status, punchInTime, punchOutTime, notes } = req.body;

    if (!userId || !date || !status) {
      return res.status(400).json({
        success: false,
        message: 'User ID, date, and status are required'
      });
    }

    // Parse the date and set to start of day
    const attendanceDate = new Date(date);
    attendanceDate.setHours(0, 0, 0, 0);

    // Check if attendance already exists for this user and date
    let attendance = await Attendance.findOne({
      user: userId,
      date: attendanceDate
    });

    if (attendance) {
      // Update existing attendance
      attendance.status = status;
      attendance.notes = notes || attendance.notes;
      
      if (punchInTime) {
        attendance.punchIn = attendance.punchIn || {};
        attendance.punchIn.time = new Date(punchInTime);
      }
      
      if (punchOutTime) {
        attendance.punchOut = attendance.punchOut || {};
        attendance.punchOut.time = new Date(punchOutTime);
      }
      
      attendance.isEdited = true;
      attendance.editedBy = req.user.id;
      attendance.editedAt = new Date();
    } else {
      // Create new attendance record
      const attendanceData = {
        user: userId,
        date: attendanceDate,
        status,
        notes,
        isEdited: true,
        editedBy: req.user.id,
        editedAt: new Date()
      };

      if (punchInTime) {
        attendanceData.punchIn = { time: new Date(punchInTime) };
      }

      if (punchOutTime) {
        attendanceData.punchOut = { time: new Date(punchOutTime) };
      }

      attendance = new Attendance(attendanceData);
    }

    await attendance.save();

    await createAuditLog(
      'Manual Attendance Created/Updated',
      req.user,
      'attendance',
      attendance._id,
      { userId, date, status },
      req
    );

    res.status(200).json({
      success: true,
      data: attendance,
      message: 'Attendance marked successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Auto-mark absent users (Called by cron job at midnight)
// @route   POST /api/attendance/auto-mark-absent
// @access  Private (Internal/Cron)
exports.autoMarkAbsent = async (req, res) => {
  try {
    // Get yesterday's date (the day that just ended)
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    yesterday.setHours(0, 0, 0, 0);

    // Get all active users
    const users = await User.find({ status: { $ne: 'inactive' } });

    let markedCount = 0;
    let punchOutMissCount = 0;

    for (const user of users) {
      // Check if user's attendance start date is set and is before or on yesterday
      const attendanceStartDate = user.attendanceStartDate 
        ? new Date(user.attendanceStartDate) 
        : new Date(user.createdAt);
      attendanceStartDate.setHours(0, 0, 0, 0);

      // Only mark if user was supposed to have attendance for yesterday
      if (yesterday >= attendanceStartDate) {
        // Check if attendance record exists for yesterday
        let attendance = await Attendance.findOne({
          user: user._id,
          date: yesterday
        });

        if (!attendance) {
          // No attendance record - mark as absent
          attendance = new Attendance({
            user: user._id,
            date: yesterday,
            status: 'absent',
            notes: 'Auto-marked absent (no punch in)',
            isEdited: true
          });
          await attendance.save();
          markedCount++;
        } else if (attendance.punchIn && attendance.punchIn.time && (!attendance.punchOut || !attendance.punchOut.time)) {
          // Punched in but not punched out - mark as punch out miss
          attendance.punchOut = {
            time: new Date(yesterday.getFullYear(), yesterday.getMonth(), yesterday.getDate(), 23, 59, 59),
            location: null,
            image: null
          };
          attendance.notes = (attendance.notes || '') + ' [Auto punch-out: User did not punch out]';
          attendance.isEdited = true;
          await attendance.save();
          punchOutMissCount++;
        }
      }
    }

    console.log(`Auto-marked ${markedCount} users as absent and ${punchOutMissCount} users with punch-out miss`);

    res.status(200).json({
      success: true,
      message: `Auto-marked ${markedCount} users as absent and ${punchOutMissCount} users with punch-out miss`,
      data: {
        markedAbsent: markedCount,
        punchOutMiss: punchOutMissCount,
        date: yesterday
      }
    });
  } catch (error) {
    console.error('Auto-mark absent error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};
