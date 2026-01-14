const mongoose = require('mongoose');

const locationTrackingSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  attendance: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Attendance',
    index: true
  },
  location: {
    latitude: { type: Number, required: true },
    longitude: { type: Number, required: true },
    address: String,
    accuracy: Number // Accuracy in meters
  },
  timestamp: {
    type: Date,
    default: Date.now,
    required: true,
    index: true
  },
  isActive: {
    type: Boolean,
    default: true // Is user currently active/working
  },
  batteryLevel: Number,
  speed: Number, // Speed in m/s (to detect if moving)
  distanceFromPunchIn: Number // Distance from original punch in location
}, {
  timestamps: true
});

// Index for efficient queries
locationTrackingSchema.index({ user: 1, timestamp: -1 });
locationTrackingSchema.index({ attendance: 1, timestamp: -1 });
locationTrackingSchema.index({ timestamp: 1 }, { expireAfterSeconds: 2592000 }); // Auto-delete after 30 days

// Static method to get latest location for a user
locationTrackingSchema.statics.getLatestLocation = function(userId) {
  return this.findOne({ user: userId, isActive: true })
    .sort({ timestamp: -1 })
    .limit(1)
    .populate('user', 'name email');
};

// Static method to get all active users with their latest locations
locationTrackingSchema.statics.getAllActiveLocations = function() {
  return this.aggregate([
    {
      $match: {
        isActive: true,
        timestamp: { $gte: new Date(Date.now() - 15 * 60 * 1000) } // Last 15 minutes
      }
    },
    {
      $sort: { timestamp: -1 }
    },
    {
      $group: {
        _id: '$user',
        latestLocation: { $first: '$$ROOT' }
      }
    },
    {
      $lookup: {
        from: 'users',
        localField: '_id',
        foreignField: '_id',
        as: 'userDetails'
      }
    },
    {
      $unwind: '$userDetails'
    },
    {
      $project: {
        userId: '$_id',
        name: '$userDetails.name',
        email: '$userDetails.email',
        department: '$userDetails.department',
        location: '$latestLocation.location',
        timestamp: '$latestLocation.timestamp',
        distanceFromPunchIn: '$latestLocation.distanceFromPunchIn',
        isActive: '$latestLocation.isActive'
      }
    }
  ]);
};

module.exports = mongoose.model('LocationTracking', locationTrackingSchema);
