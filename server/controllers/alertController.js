const Alert = require('../models/Alert');
const Device = require('../models/Device');

// Allowed alert values
const VALID_STATUSES = ['unread', 'read', 'resolved'];
const VALID_SEVERITIES = ['low', 'medium', 'high', 'critical'];


// @desc    Get all alerts (admin) or user's alerts
// @route   GET /api/alerts
// @access  Private
exports.getAlerts = async (req, res, next) => {
  try {
    const {
      status,
      severity,
      site,
      page = 1,
      limit = 20
    } = req.query;

    const query = {};

    // ---------------------------------------------------------
    // Validate status filter
    // ---------------------------------------------------------
    if (status) {
      if (!VALID_STATUSES.includes(status)) {
        return res.status(400).json({
          success: false,
          message: `Invalid status. Allowed values: ${VALID_STATUSES.join(', ')}`
        });
      }

      query.status = status;
    }

    // ---------------------------------------------------------
    // Validate severity filter
    // ---------------------------------------------------------
    if (severity) {
      if (!VALID_SEVERITIES.includes(severity)) {
        return res.status(400).json({
          success: false,
          message: `Invalid severity. Allowed values: ${VALID_SEVERITIES.join(', ')}`
        });
      }

      query.severity_level = severity;
    }

    // ---------------------------------------------------------
    // Filter by site
    // Alert stores device, not site directly.
    // Therefore, first find devices belonging to the site.
    // ---------------------------------------------------------
    if (site) {
      const siteDevices = await Device
        .find({ site })
        .select('_id');

      const deviceIds = siteDevices.map(
        device => device._id
      );

      query.device = {
        $in: deviceIds
      };
    }

    // ---------------------------------------------------------
    // Validate pagination
    // ---------------------------------------------------------
    const pageNum = Math.max(parseInt(page) || 1, 1);
    const limitNum = Math.min(
      Math.max(parseInt(limit) || 20, 1),
      100
    );

    const skip = (pageNum - 1) * limitNum;

    // ---------------------------------------------------------
    // Retrieve alerts and total count
    // ---------------------------------------------------------
    const [alerts, total] = await Promise.all([
      Alert.find(query)
        .populate({
          path: 'device',
          select: 'device_id status site',
          populate: {
            path: 'site',
            select: 'name location region'
          }
        })
        .populate(
          'reading',
          'pH temperature salinity dissolved_o2 recorded_at'
        )
        .sort({
          created_at: -1
        })
        .skip(skip)
        .limit(limitNum),

      Alert.countDocuments(query)
    ]);

    res.status(200).json({
      success: true,
      count: alerts.length,
      total,
      page: pageNum,
      pages: Math.ceil(total / limitNum),
      data: alerts
    });

  } catch (error) {
    next(error);
  }
};


// @desc    Get single alert
// @route   GET /api/alerts/:id
// @access  Private
exports.getAlert = async (req, res, next) => {
  try {
    const alert = await Alert.findById(req.params.id)
      .populate({
        path: 'device',
        select: 'device_id status site',
        populate: {
          path: 'site',
          select: 'name location region'
        }
      })
      .populate('reading')
      .populate(
        'recipients',
        'name email'
      );

    // Alert does not exist
    if (!alert) {
      return res.status(404).json({
        success: false,
        message: 'Alert not found'
      });
    }

    res.status(200).json({
      success: true,
      data: alert
    });

  } catch (error) {
    next(error);
  }
};


// @desc    Update alert status
// @route   PUT /api/alerts/:id/status
// @access  Private
exports.updateAlertStatus = async (req, res, next) => {
  try {
    const { status } = req.body;

    // ---------------------------------------------------------
    // Validate status
    // ---------------------------------------------------------
    if (!status) {
      return res.status(400).json({
        success: false,
        message: 'Status is required'
      });
    }

    if (!VALID_STATUSES.includes(status)) {
      return res.status(400).json({
        success: false,
        message:
          `Invalid status. Allowed values: ${VALID_STATUSES.join(', ')}`
      });
    }

    // ---------------------------------------------------------
    // Find and update alert
    // ---------------------------------------------------------
    const alert = await Alert.findByIdAndUpdate(
      req.params.id,
      {
        status
      },
      {
        new: true,
        runValidators: true
      }
    )
      .populate({
        path: 'device',
        select: 'device_id status site',
        populate: {
          path: 'site',
          select: 'name location region'
        }
      })
      .populate(
        'reading',
        'pH temperature salinity dissolved_o2 recorded_at'
      );

    // Alert does not exist
    if (!alert) {
      return res.status(404).json({
        success: false,
        message: 'Alert not found'
      });
    }

    res.status(200).json({
      success: true,
      message: `Alert marked as ${status}`,
      data: alert
    });

  } catch (error) {
    next(error);
  }
};


// @desc    Mark all unread alerts as read
// @route   PUT /api/alerts/markallread
// @access  Private
exports.markAllRead = async (req, res, next) => {
  try {
    const result = await Alert.updateMany(
      {
        status: 'unread'
      },
      {
        status: 'read'
      }
    );

    res.status(200).json({
      success: true,
      message: 'All unread alerts marked as read',
      modifiedCount: result.modifiedCount
    });

  } catch (error) {
    next(error);
  }
};


// @desc    Get unread alert count
// @route   GET /api/alerts/unread-count
// @access  Private
exports.getUnreadCount = async (req, res, next) => {
  try {
    const count = await Alert.countDocuments({
      status: 'unread'
    });

    res.status(200).json({
      success: true,
      count
    });

  } catch (error) {
    next(error);
  }
};