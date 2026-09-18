const mongoose = require('mongoose');

const alertSchema = new mongoose.Schema({
  reading: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'SensorReading',
    required: true
  },
  device: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Device',
    required: true
  },
  parameter_name: {
    type: String,
    enum: ['pH', 'temperature', 'salinity', 'dissolved_o2'],
    required: true
  },
  severity_level: {
    type: String,
    enum: ['low', 'medium', 'high', 'critical'],
    required: true
  },
  measured_value: {
    type: Number,
    required: true
  },
  threshold_breached: {
    type: String,
    enum: ['min', 'max'],
    required: true
  },
  threshold_value: {
    type: Number,
    required: true
  },
  recipients: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  status: {
    type: String,
    enum: ['unread', 'read', 'resolved'],
    default: 'unread'
  },
  message: {
    type: String,
    required: true
  }
}, {
  timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' }
});

alertSchema.index({ device: 1, created_at: -1 });
alertSchema.index({ status: 1 });

module.exports = mongoose.model('Alert', alertSchema);