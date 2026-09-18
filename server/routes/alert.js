const express = require('express');

const router = express.Router();

const {
  getAlerts,
  getAlert,
  updateAlertStatus,
  markAllRead,
  getUnreadCount
} = require('../controllers/alertController');

const { protect } = require('../middleware/auth');

// Protect all alert routes
router.use(protect);

// Get number of unread alerts
router.get('/unread-count', getUnreadCount);

// Mark all alerts as read
router.put('/markallread', markAllRead);

// Get all alerts
router.route('/').get(getAlerts);

// Get one alert by ID
router.route('/:id').get(getAlert);

// Update one alert's status
router.put('/:id/status', updateAlertStatus);

module.exports = router;