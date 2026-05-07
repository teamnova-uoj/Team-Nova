const mongoose = require('mongoose');

const deviceSchema = new mongoose.Schema({
  device_id: {
    type: String,
    required: [true, 'Device ID is required'],
    unique: true,
    trim: true,
    uppercase: true
  },
  installation_date: {
    type: Date,
    required: [true, 'Installation date is required']
  },
  status: {
    type: String,
    enum: ['active', 'inactive', 'maintenance', 'faulty'],
    default: 'active'
  },
  site: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Site',
    required: [true, 'Site is required']
  },
  timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' }
});

module.exports = mongoose.model('Device', deviceSchema);
