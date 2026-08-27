const express = require('express');
const router = express.Router();
const { getVapidPublicKey, saveSubscription, broadcastPushNotification } = require('../services/pushService');
const { protect, admin } = require('../middleware/auth');

// @desc    Get VAPID Public Key for WebPush subscription
// @route   GET /api/notifications/vapid-key
// @access  Public
router.get('/vapid-key', (req, res) => {
  res.json({ success: true, publicKey: getVapidPublicKey() });
});

// @desc    Subscribe browser device to background Web Push notifications
// @route   POST /api/notifications/subscribe
// @access  Public
router.post('/subscribe', async (req, res) => {
  try {
    const { subscription } = req.body;
    if (!subscription) {
      return res.status(400).json({ success: false, error: 'Subscription object required' });
    }

    const userId = req.user ? req.user._id : null;
    const userAgent = req.headers['user-agent'] || '';

    const saved = await saveSubscription(subscription, userId, userAgent);
    res.json({ success: true, message: 'Push subscription registered successfully', data: saved });
  } catch (err) {
    console.error('Push subscription error:', err.message);
    res.status(500).json({ success: false, error: err.message });
  }
});

// @desc    Send test WebPush notification to subscribers
// @route   POST /api/notifications/send-test
// @access  Public
router.post('/send-test', async (req, res) => {
  try {
    const result = await broadcastPushNotification({
      title: '🚀 Web3Central OS Push Alert Active!',
      body: 'Background OS Push notifications are working perfectly! You will receive system alerts for new dApps & market shifts even when Web3Central is closed.',
      url: '/apps'
    });
    res.json({ success: true, message: 'Test notification broadcasted', result });
  } catch (err) {
    console.error('Test push error:', err.message);
    res.status(500).json({ success: false, error: err.message });
  }
});

// @desc    Admin broadcast push notification to all devices
// @route   POST /api/notifications/broadcast
// @access  Private/Admin
router.post('/broadcast', protect, admin, async (req, res) => {
  try {
    const { title, body, url } = req.body;
    if (!title || !body) {
      return res.status(400).json({ success: false, error: 'Title and body are required' });
    }

    const result = await broadcastPushNotification({ title, body, url: url || '/apps' });
    res.json({ success: true, message: 'Notification broadcasted to all subscribers', result });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
