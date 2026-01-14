const mongoose = require('mongoose');

const auditLogSchema = new mongoose.Schema({
  action: {
    type: String,
    required: true
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  resourceType: {
    type: String,
    enum: ['user', 'project', 'task', 'attendance', 'settings', 'other']
  },
  resourceId: {
    type: mongoose.Schema.Types.ObjectId
  },
  details: {
    type: mongoose.Schema.Types.Mixed
  },
  ipAddress: {
    type: String
  },
  userAgent: {
    type: String
  },
  timestamp: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Index for faster queries
auditLogSchema.index({ user: 1, timestamp: -1 });
auditLogSchema.index({ resourceType: 1, resourceId: 1 });

module.exports = mongoose.model('AuditLog', auditLogSchema);

