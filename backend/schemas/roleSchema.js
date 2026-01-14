const mongoose = require('mongoose');

const subRoleSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Please provide a sub-role name'],
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  permissions: [{
    type: String
  }],
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

const roleSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Please provide a role name'],
    unique: true,
    trim: true,
    lowercase: true
  },
  displayName: {
    type: String,
    required: [true, 'Please provide a display name'],
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  subRoles: [subRoleSchema],
  defaultPermissions: [{
    type: String
  }],
  allowSubRoles: {
    type: Boolean,
    default: false
  },
  isActive: {
    type: Boolean,
    default: true
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Role', roleSchema);

