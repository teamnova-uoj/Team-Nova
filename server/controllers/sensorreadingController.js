const mongoose = require('mongoose');
const SensorReading = require('../models/SensorReading');
const Device = require('../models/Device');
const Alert = require('../models/Alert');
const User = require('../models/User');
const { sendAlertSMS } = require('../services/smsservice');

// Helper: check reading against site thresholds and generate alerts
const generateAlerts = async (reading, device, site, io) => {
  const parameters = ['pH', 'temperature', 'salinity', 'dissolved_o2'];
  const alerts = [];

  for (const param of parameters) {
    const value = reading[param];
    const threshold = site.thresholds[param];

    if (!threshold || value === undefined || value === null) continue;

    let breached = null;
    let thresholdValue = null;

    if (value < threshold.min) {
      breached = 'min';
      thresholdValue = threshold.min;
    } else if (value > threshold.max) {
      breached = 'max';
      thresholdValue = threshold.max;
    }

    if (!breached) continue;

    // Calculate severity based on how far the value is from threshold
    const deviation = Math.abs(value - thresholdValue) / thresholdValue;
    let severity = 'low';
    if (deviation > 0.3) severity = 'critical';
    else if (deviation > 0.2) severity = 'high';
    else if (deviation > 0.1) severity = 'medium';

    // Build a human readable message
    const unit = { 
      pH: '', 
      temperature: '°C', 
      salinity: ' ppt', 
      dissolved_o2: ' mg/L' 
    }[param];

    const paramLabel = param === 'dissolved_o2' ? 'Dissolved O₂' : param.toUpperCase();
    const direction = breached === 'min' ? 'dropped below minimum' : 'exceeded maximum';
    const message = `${paramLabel} level of ${value}${unit} has ${direction} threshold of ${thresholdValue}${unit} at site ${site.name}.`;

    // Send alert to all admin users
    const adminUsers = await User.find({ role: 'admin' }, '_id');
    const recipientIds = adminUsers.map(u => u._id);

    const alert = await Alert.create({
      reading: reading._id,
      device: device._id,
      parameter_name: param,
      severity_level: severity,
      measured_value: value,
      threshold_breached: breached,
      threshold_value: thresholdValue,
      message,
      recipients: recipientIds,
      status: 'unread'
    });

    alerts.push(alert);

    // Emit real-time alert via Socket.io if available
    if (io) {
      io.emit('new_alert', alert);
    }

    // Send SMS notification (logs + skips gracefully if no provider configured)
    const smsResult = await sendAlertSMS(message);
    if (smsResult.success) {
      console.log(`SMS notification sent for ${paramLabel} alert.`);
    } else if (smsResult.skipped) {
      console.log(`SMS skipped for ${paramLabel} alert.`);
    } else {
      console.error(`SMS failed for ${paramLabel} alert.`);
    }
  }

  return alerts;
};

// @desc    Submit a new sensor reading
// @route   POST /api/readings
// @access  Private
exports.createReading = async (req, res, next) => {
  try {
    const { device: deviceId, pH, temperature, salinity, dissolved_o2 } = req.body;

    // Find device and populate its site (with thresholds)
    const device = await Device.findById(deviceId).populate('site');
    if (!device) {
      return res.status(404).json({ success: false, message: 'Device not found' });
    }
    if (device.status !== 'active') {
      return res.status(400).json({ success: false, message: 'Device is not active' });
    }

    // Save the reading
    const reading = await SensorReading.create({
      device: deviceId,
      pH,
      temperature,
      salinity,
      dissolved_o2
    });

    // Update device lastSeen timestamp
    await Device.findByIdAndUpdate(deviceId, { lastSeen: new Date() });

    // Generate alerts based on site thresholds
    const io = req.app.get('io');
    const alerts = await generateAlerts(reading, device, device.site, io);

    // Emit real-time reading to dashboard
    if (io) {
      io.emit('new_reading', reading);
    }

    res.status(201).json({
      success: true,
      data: reading,
      alertsGenerated: alerts.length
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all readings (with filters)
// @route   GET /api/readings
// @access  Private
exports.getReadings = async (req, res, next) => {
  try {
    const { device, limit = 50, from, to, page = 1 } = req.query;

    const query = {};
    if (device) query.device = device;
    if (from || to) {
      query.recorded_at = {};
      if (from) query.recorded_at.$gte = new Date(from);
      if (to) query.recorded_at.$lte = new Date(to);
    }

    const pageNum = parseInt(page);
    const limitNum = Math.min(parseInt(limit), 1000);
    const skip = (pageNum - 1) * limitNum;

    const [readings, total] = await Promise.all([
      SensorReading.find(query)
        .populate('device', 'device_id site')
        .sort({ recorded_at: -1 })
        .skip(skip)
        .limit(limitNum),
      SensorReading.countDocuments(query)
    ]);

    res.status(200).json({
      success: true,
      count: readings.length,
      total,
      page: pageNum,
      pages: Math.ceil(total / limitNum),
      data: readings
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get latest reading per device
// @route   GET /api/readings/latest
// @access  Private
exports.getLatestReadings = async (req, res, next) => {
  try {
    const latestReadings = await SensorReading.aggregate([
      { $sort: { recorded_at: -1 } },
      { $group: { _id: '$device', doc: { $first: '$$ROOT' } } },
      { $replaceRoot: { newRoot: '$doc' } }
    ]);

    const populated = await SensorReading.populate(latestReadings, {
      path: 'device',
      select: 'device_id status site',
      populate: { path: 'site', select: 'name location region' }
    });

    res.status(200).json({ 
      success: true, 
      count: populated.length, 
      data: populated 
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get reading stats for dashboard
// @route   GET /api/readings/stats
// @access  Private
exports.getStats = async (req, res, next) => {
  try {
    const { device, hours = 24 } = req.query;
    const since = new Date(Date.now() - hours * 60 * 60 * 1000);

    const matchStage = { recorded_at: { $gte: since } };
    if (device) matchStage.device = new mongoose.Types.ObjectId(device);

    const stats = await SensorReading.aggregate([
      { $match: matchStage },
      {
        $group: {
          _id: null,
          avgPH: { $avg: '$pH' },
          minPH: { $min: '$pH' },
          maxPH: { $max: '$pH' },
          avgTemp: { $avg: '$temperature' },
          minTemp: { $min: '$temperature' },
          maxTemp: { $max: '$temperature' },
          avgSalinity: { $avg: '$salinity' },
          avgDO: { $avg: '$dissolved_o2' },
          count: { $sum: 1 }
        }
      }
    ]);

    res.status(200).json({ 
      success: true, 
      data: stats[0] || {}, 
      hours: parseInt(hours) 
    });
  } catch (error) {
    next(error);
  }
};