const Alert = require('../models/Alert');

// @desc    Get all alerts (admin) or user's alerts
// @route   GET /api/alerts
// @access  Private
exports.getAlerts = async (req, res, next) => {
  try {
    const { status, severity, page = 1, limit = 20 } = req.query;
    const query = {};

    // Non-admins only see their own alerts
    if (req.user.role !== 'admin') {
      query.recipients = req.user._id;
    }

    if (status) query.status = status;
    if (severity) query.severity_level = severity;

    const pageNum = parseInt(page);
    const limitNum = Math.min(parseInt(limit), 100);
    const skip = (pageNum - 1) * limitNum;

    const [alerts, total] = await Promise.all([
      Alert.find(query)
        .populate({ path: 'device', select: 'device_id', populate: { path: 'site', select: 'name location' } })
        .populate('reading', 'pH temperature salinity dissolved_o2 recorded_at')
        .sort({ created_at: -1 })
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
      .populate({ path: 'device', select: 'device_id site', populate: { path: 'site', select: 'name location region' } })
      .populate('reading')
      .populate('recipients', 'name email');
    if (!alert) return res.status(404).json({ success: false, message: 'Alert not found' });
    res.status(200).json({ success: true, data: alert });
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
    const alert = await Alert.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true, runValidators: true }
    );
    if (!alert) return res.status(404).json({ success: false, message: 'Alert not found' });
    res.status(200).json({ success: true, data: alert });
  } catch (error) {
    next(error);
  }
};

// @desc    Mark all alerts as read for the current user
// @route   PUT /api/alerts/markallread
// @access  Private
exports.markAllRead = async (req, res, next) => {
  try {
    const query = req.user.role === 'admin' ? {} : { recipients: req.user._id };
    await Alert.updateMany({ ...query, status: 'unread' }, { status: 'read' });
    res.status(200).json({ success: true, message: 'All alerts marked as read' });
  } catch (error) {
    next(error);
  }
};

// @desc    Get unread alert count
// @route   GET /api/alerts/unread-count
// @access  Private
exports.getUnreadCount = async (req, res, next) => {
  try {
    const query = { status: 'unread' };
    if (req.user.role !== 'admin') query.recipients = req.user._id;
    const count = await Alert.countDocuments(query);
    res.status(200).json({ success: true, count });
  } catch (error) {
    next(error);
  }
};
