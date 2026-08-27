const webPush = require('web-push');
const PushSubscription = require('../models/PushSubscription');

// VAPID Keys setup
let vapidPublicKey = process.env.VAPID_PUBLIC_KEY;
let vapidPrivateKey = process.env.VAPID_PRIVATE_KEY;

if (!vapidPublicKey || !vapidPrivateKey) {
  // Generate a fallback pair if not provided in .env
  const vapidKeys = webPush.generateVAPIDKeys();
  vapidPublicKey = vapidKeys.publicKey;
  vapidPrivateKey = vapidKeys.privateKey;
  console.log('--- Generated WebPush VAPID Keys ---');
  console.log('Public Key:', vapidPublicKey);
}

try {
  webPush.setVapidDetails(
    process.env.VAPID_MAILTO || 'mailto:support@web3central.pro',
    vapidPublicKey,
    vapidPrivateKey
  );
} catch (e) {
  console.warn('VAPID setup warning:', e.message);
}

// Get public VAPID key for frontend subscription
const getVapidPublicKey = () => vapidPublicKey;

// Save or update subscription in MongoDB
const saveSubscription = async (subscription, userId = null, userAgent = '') => {
  if (!subscription || !subscription.endpoint || !subscription.keys) {
    throw new Error('Invalid subscription object');
  }

  const existing = await PushSubscription.findOne({ endpoint: subscription.endpoint });
  if (existing) {
    existing.keys = subscription.keys;
    if (userId) existing.user = userId;
    existing.userAgent = userAgent;
    await existing.save();
    return existing;
  }

  return await PushSubscription.create({
    endpoint: subscription.endpoint,
    keys: subscription.keys,
    user: userId,
    userAgent
  });
};

// Broadcast WebPush notification payload to ALL stored subscriptions
const broadcastPushNotification = async ({ title, body, url = '/', icon = '/logo.jpg' }) => {
  const subscriptions = await PushSubscription.find({});
  if (subscriptions.length === 0) return { success: true, sent: 0 };

  const payload = JSON.stringify({
    title,
    body,
    url,
    icon,
    badge: icon,
    timestamp: Date.now()
  });

  let sentCount = 0;
  let errorCount = 0;
  const expiredEndpoints = [];

  const sendPromises = subscriptions.map(async (sub) => {
    try {
      await webPush.sendNotification(
        {
          endpoint: sub.endpoint,
          keys: sub.keys
        },
        payload
      );
      sentCount++;
    } catch (err) {
      errorCount++;
      // If 404 (Not Found) or 410 (Gone), the subscription has expired or user unsubscribed
      if (err.statusCode === 404 || err.statusCode === 410) {
        expiredEndpoints.push(sub.endpoint);
      }
    }
  });

  await Promise.all(sendPromises);

  // Clean up expired subscriptions
  if (expiredEndpoints.length > 0) {
    await PushSubscription.deleteMany({ endpoint: { $in: expiredEndpoints } });
  }

  return { success: true, sent: sentCount, errors: errorCount };
};

module.exports = {
  getVapidPublicKey,
  saveSubscription,
  broadcastPushNotification
};
