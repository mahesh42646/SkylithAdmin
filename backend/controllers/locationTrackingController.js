const LocationTracking = require('../schemas/locationTrackingSchema');
const Attendance = require('../schemas/attendanceSchema');

// Helper: Calculate distance between two coordinates
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

// Helper: Group employees by location proximity
function groupByProximity(locations, radiusMeters) {
  const groups = [];
  const used = new Set();

  locations.forEach((loc1, i) => {
    if (used.has(i)) return;

    const group = {
      center: loc1.location,
      employees: [loc1]
    };

    locations.forEach((loc2, j) => {
      if (i === j || used.has(j)) return;

      const distance = calculateDistance(
        loc1.location.latitude,
        loc1.location.longitude,
        loc2.location.latitude,
        loc2.location.longitude
      );

      if (distance <= radiusMeters) {
        group.employees.push(loc2);
        used.add(j);
      }
    });

    if (group.employees.length > 1) {
      groups.push(group);
    }
    used.add(i);
  });

  return groups;
}

// @desc    Save location update
// @route   POST /api/location/track
// @access  Private
exports.trackLocation = async (req, res) => {
  try {
    const { latitude, longitude, address, accuracy, batteryLevel, speed } = req.body;
    const userId = req.user.id;

    // Check if user has active attendance today
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const attendance = await Attendance.findOne({
      user: userId,
      date: today,
      'punchIn.time': { $exists: true },
      'punchOut.time': { $exists: false } // Not punched out yet
    });

    if (!attendance) {
      return res.status(400).json({
        success: false,
        message: 'No active attendance session'
      });
    }

    // Calculate distance from punch in location
    let distanceFromPunchIn = 0;
    if (attendance.punchIn.location?.latitude && attendance.punchIn.location?.longitude) {
      distanceFromPunchIn = calculateDistance(
        attendance.punchIn.location.latitude,
        attendance.punchIn.location.longitude,
        latitude,
        longitude
      );
    }

    // Save location
    const locationData = await LocationTracking.create({
      user: userId,
      attendance: attendance._id,
      location: {
        latitude,
        longitude,
        address,
        accuracy
      },
      batteryLevel,
      speed,
      distanceFromPunchIn: parseFloat(distanceFromPunchIn.toFixed(2)),
      isActive: true
    });

    res.status(200).json({
      success: true,
      data: locationData
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Get all users with their attendance status and location
// @route   GET /api/location/active
// @access  Private (Admin only)
exports.getActiveLocations = async (req, res) => {
  try {
    const User = require('../schemas/userSchema');
    const Attendance = require('../schemas/attendanceSchema');
    
    // Get today's date range
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    // Get all users
    const allUsers = await User.find({}, 'name email department avatar role');

    // Get today's attendance for all users
    const todayAttendances = await Attendance.find({
      date: { $gte: today, $lt: tomorrow }
    }).populate('user', 'name email');

    // Get latest locations for active users
    const activeLocations = await LocationTracking.getAllActiveLocations();

    // Map attendance by user ID
    const attendanceMap = {};
    todayAttendances.forEach(att => {
      if (att.user && att.user._id) {
        attendanceMap[att.user._id.toString()] = att;
      }
    });

    // Map locations by user ID
    const locationMap = {};
    activeLocations.forEach(loc => {
      locationMap[loc.userId.toString()] = loc;
    });

    // Build complete user list with status
    const userStatuses = allUsers.map(user => {
      const userId = user._id.toString();
      const attendance = attendanceMap[userId];
      const location = locationMap[userId];

      return {
        userId: userId,
        name: user.name,
        email: user.email,
        department: user.department,
        role: user.role,
        avatar: user.avatar,
        status: attendance ? 'active' : 'inactive',
        hasPunchedIn: attendance && attendance.punchIn && attendance.punchIn.time ? true : false,
        hasPunchedOut: attendance && attendance.punchOut && attendance.punchOut.time ? true : false,
        attendanceStatus: attendance ? attendance.status : null,
        punchInTime: attendance && attendance.punchIn ? attendance.punchIn.time : null,
        punchOutTime: attendance && attendance.punchOut ? attendance.punchOut.time : null,
        location: location ? location.location : null,
        timestamp: location ? location.timestamp : null,
        distanceFromPunchIn: location ? location.distanceFromPunchIn : null,
        isTracking: location ? true : false
      };
    });

    // Separate active and inactive users
    const activeUsers = userStatuses.filter(u => u.hasPunchedIn && !u.hasPunchedOut);
    const inactiveUsers = userStatuses.filter(u => !u.hasPunchedIn || u.hasPunchedOut);

    // Group active users by proximity
    const groups = groupByProximity(activeUsers.filter(u => u.location), 100);

    res.status(200).json({
      success: true,
      data: userStatuses,
      activeUsers: activeUsers,
      inactiveUsers: inactiveUsers,
      groups: groups,
      totalUsers: userStatuses.length,
      totalActive: activeUsers.length,
      totalInactive: inactiveUsers.length
    });
  } catch (error) {
    console.error('Get active locations error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Get location history for a user
// @route   GET /api/location/history/:userId
// @access  Private (Admin only)
exports.getLocationHistory = async (req, res) => {
  try {
    const { userId } = req.params;
    const { date } = req.query;

    const query = { user: userId };

    if (date) {
      const startDate = new Date(date);
      startDate.setHours(0, 0, 0, 0);
      const endDate = new Date(date);
      endDate.setHours(23, 59, 59, 999);

      query.timestamp = { $gte: startDate, $lte: endDate };
    }

    const locations = await LocationTracking.find(query)
      .sort({ timestamp: 1 })
      .populate('user', 'name email')
      .populate('attendance', 'date status');

    res.status(200).json({
      success: true,
      data: locations,
      count: locations.length
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Deactivate user location (called on punch out)
// @route   POST /api/location/deactivate
// @access  Private
exports.deactivateLocation = async (req, res) => {
  try {
    const userId = req.user.id;

    await LocationTracking.updateMany(
      { user: userId, isActive: true },
      { $set: { isActive: false } }
    );

    res.status(200).json({
      success: true,
      message: 'Location tracking deactivated'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Functions are already exported using exports.functionName above
