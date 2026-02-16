const mongoose = require('mongoose');

const attendanceSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'User is required']
  },
  date: {
    type: Date,
    required: [true, 'Date is required']
  },
  punchIn: {
    time: {
      type: Date,
      default: null
    },
    location: {
      latitude: Number,
      longitude: Number,
      address: String
    },
    image: {
      type: String,
      default: null
    },
    deviceInfo: {
      deviceId: String,
      platform: String,
      appVersion: String
    }
  },
  punchOut: {
    time: {
      type: Date,
      default: null
    },
    location: {
      latitude: Number,
      longitude: Number,
      address: String
    },
    image: {
      type: String,
      default: null
    },
    deviceInfo: {
      deviceId: String,
      platform: String,
      appVersion: String
    }
  },
  status: {
    type: String,
    enum: ['present', 'absent', 'late', 'half_day', 'late_half_day', 'leave', 'holiday'],
    default: 'absent'
  },
  locationMismatch: {
    type: Boolean,
    default: false
  },
  locationDistance: {
    type: Number, // Distance in meters between punch in and out
    default: 0
  },
  locationWarning: {
    type: String,
    default: null
  },
  activeHours: {
    type: Number,
    default: 0
  },
  workingHours: {
    type: Number,
    default: 0
  },
  notes: {
    type: String,
    default: ''
  },
  isEdited: {
    type: Boolean,
    default: false
  },
  editedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  editedAt: {
    type: Date,
    default: null
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Index for efficient queries
attendanceSchema.index({ user: 1, date: 1 }, { unique: true });
attendanceSchema.index({ date: 1 });
attendanceSchema.index({ status: 1 });

// Helper function to calculate distance between two coordinates (Haversine formula)
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

// Calculate working hours before saving
attendanceSchema.pre('save', function(next) {
  if (this.punchIn && this.punchIn.time && this.punchOut && this.punchOut.time) {
    const hours = (this.punchOut.time - this.punchIn.time) / (1000 * 60 * 60);
    this.activeHours = parseFloat(hours.toFixed(2));
    this.workingHours = this.activeHours; // Keep both for compatibility
    
    // Calculate distance between punch in and out locations
    if (this.punchIn.location?.latitude && this.punchIn.location?.longitude &&
        this.punchOut.location?.latitude && this.punchOut.location?.longitude) {
      const distance = calculateDistance(
        this.punchIn.location.latitude,
        this.punchIn.location.longitude,
        this.punchOut.location.latitude,
        this.punchOut.location.longitude
      );
      this.locationDistance = parseFloat(distance.toFixed(2));
      
      // Flag if punch out is >100m away from punch in
      if (distance > 100) {
        this.locationMismatch = true;
        this.locationWarning = `Punch out location is ${distance.toFixed(0)}m away from punch in location`;
      }
    }
    
    // Determine status based on working hours and punch in time (IST: late after 10:00 AM)
    const punchInIST = new Date(this.punchIn.time.getTime() + (5.5 * 60 * 60 * 1000));
    const punchInHour = punchInIST.getUTCHours();
    const punchInMinutes = punchInIST.getUTCMinutes();
    const isLate = punchInHour > 10 || (punchInHour === 10 && punchInMinutes > 0);
    const isHalfDay = this.activeHours < 8;
    
    // Combined status: late AND half day
    if (isLate && isHalfDay) {
      this.status = 'late_half_day';
    }
    // Late but full hours
    else if (isLate) {
      this.status = 'late';
    }
    // Half day but on time
    else if (isHalfDay) {
      this.status = 'half_day';
    }
    // Present (on time and full hours)
    else {
      this.status = 'present';
    }
  } else if (this.punchIn && this.punchIn.time && (!this.punchOut || !this.punchOut.time)) {
    // Only punch in, no punch out yet (IST: late after 10:00 AM)
    const punchInIST = new Date(this.punchIn.time.getTime() + (5.5 * 60 * 60 * 1000));
    const punchInHour = punchInIST.getUTCHours();
    const punchInMinutes = punchInIST.getUTCMinutes();
    
    // Set status based on punch in time
    if (punchInHour > 10 || (punchInHour === 10 && punchInMinutes > 0)) {
      this.status = 'late';
    } else {
      this.status = 'present';
    }
  }
  
  next();
});

// Method to check if attendance can be edited
attendanceSchema.methods.canEdit = function() {
  const now = new Date();
  const attendanceDate = new Date(this.date);
  const daysDiff = Math.floor((now - attendanceDate) / (1000 * 60 * 60 * 24));
  
  // Allow editing within 7 days
  return daysDiff <= 7;
};

module.exports = mongoose.model('Attendance', attendanceSchema);
