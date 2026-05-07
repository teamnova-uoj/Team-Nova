const mongoose = require('mongoose');

const sensorReadingSchema = new mongoose.Schema({
  device: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Device',
    required: [true, 'Device is required']
  },
  recorded_at: {
    type: Date,
    default: Date.now,
    index: true
  },
  pH: {
    type: Number,
    min: [0, 'pH cannot be negative'],
    max: [14, 'pH cannot exceed 14']
  },
  temperature: {
    type: Number,
    comment: 'in Celsius'
  },
  salinity: {
    type: Number,
    min: [0, 'Salinity cannot be negative'],
    max: [60, 'Salinity cannot exceed 60']
    
  },
  dissolved_o2: {
    type: Number,
    min: [0, 'DO cannot be negative'],
    comment: 'in mg/L'
  }
}, {
  timestamps: false
});

// Index for efficient time-series queries
sensorReadingSchema.index({ device: 1, recorded_at: -1 });

module.exports = mongoose.model('SensorReading', sensorReadingSchema);