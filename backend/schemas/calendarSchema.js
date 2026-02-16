const mongoose = require('mongoose');

const calendarSchema = new mongoose.Schema({
  date: {
    type: Date,
    required: [true, 'Date is required']
  },
  type: {
    type: String,
    enum: ['public_holiday', 'optional_holiday', 'company_event', 'other'],
    default: 'public_holiday'
  },
  name: {
    type: String,
    required: [true, 'Name is required']
  },
  description: {
    type: String,
    default: ''
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, { timestamps: true });

calendarSchema.index({ date: 1 });

module.exports = mongoose.model('CalendarEvent', calendarSchema);
