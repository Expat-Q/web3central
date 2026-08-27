// Browser Web Push Notification Helper

export const registerServiceWorker = async () => {
  if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
    try {
      const reg = await navigator.serviceWorker.register('/sw.js');
      console.log('Push Service Worker registered with scope:', reg.scope);
      return reg;
    } catch (err) {
      console.warn('Service Worker registration failed:', err);
    }
  }
  return null;
};

export const requestPushPermission = async () => {
  if (typeof window === 'undefined' || !('Notification' in window)) {
    // Dispatch in-app toast if unsupported
    dispatchFloatingToast({
      title: '🔔 Floating Notifications Active',
      body: 'In-app alerts are active! Browser native push permissions are unavailable in this environment.',
      url: '/'
    });
    return 'unsupported';
  }

  try {
    const permission = await Notification.requestPermission();
    await registerServiceWorker();
    
    // Always trigger floating toast for immediate user feedback
    dispatchFloatingToast({
      title: permission === 'granted' ? '🔔 Push & Floating Alerts Active!' : '🔔 Floating Alerts Active',
      body: permission === 'granted'
        ? 'You are now set up to receive real-time floating and OS push alerts for new dApps, TVL surges, and price movers!'
        : 'In-app floating alerts are enabled for new dApps and market updates.',
      url: '/'
    });

    if (permission === 'granted') {
      await subscribeUserToPush();
      await triggerNativeOSNotification({
        title: '🔔 Web3Central Alerts Active',
        body: 'You will receive notifications for new dApps, TVL surges, and market metrics even when away!',
        url: '/'
      });
    }

    return permission;
  } catch (err) {
    console.error('Error requesting push permission:', err);
    dispatchFloatingToast({
      title: '🔔 Floating Alerts Active',
      body: 'In-app floating alerts are active for all new dApps and market updates.',
      url: '/'
    });
    return 'denied';
  }
};

// Dispatch in-app floating banner toast on screen
export const dispatchFloatingToast = ({ title, body, url = '/', type = 'protocol', logoUrl = null }) => {
  if (typeof window !== 'undefined') {
    const event = new CustomEvent('web3central_floating_toast', {
      detail: { title, body, url, type, logoUrl }
    });
    window.dispatchEvent(event);
  }
};

// Trigger native OS push notification
export const triggerNativeOSNotification = async ({ title, body, url = '/' }) => {
  if (typeof window === 'undefined' || !('Notification' in window)) return;
  if (Notification.permission !== 'granted') return;

  const options = {
    body,
    icon: '/logo.jpg',
    badge: '/logo.jpg',
    vibrate: [100, 50, 100],
    data: { url }
  };

  // Try Service Worker showNotification first
  if ('serviceWorker' in navigator) {
    try {
      const reg = await navigator.serviceWorker.ready;
      if (reg && reg.showNotification) {
        await reg.showNotification(title, options);
        return;
      }
    } catch (e) {
      console.warn('Service worker showNotification fallback:', e);
    }
  }

  // Fallback to standard Window Notification
  try {
    const notif = new Notification(title, options);
    notif.onclick = () => {
      window.focus();
      if (url && url !== '/') {
        window.location.href = url;
      }
    };
  } catch (e) {
    console.warn('Native Window Notification failed:', e);
  }
};

// Combined helper — triggers BOTH floating on-screen toast AND native OS alert
export const triggerPushNotification = async ({ title, body, url = '/', type = 'protocol', logoUrl = null }) => {
  // 1. Always show floating on-screen toast banner
  dispatchFloatingToast({ title, body, url, type, logoUrl });

  // 2. Also fire native OS desktop/mobile notification if permitted
  await triggerNativeOSNotification({ title, body, url });
};

function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/\-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

export const subscribeUserToPush = async () => {
  if (typeof window === 'undefined' || !('serviceWorker' in navigator)) return null;

  try {
    const API_BASE = window.location.hostname === 'localhost' ? 'http://localhost:5000/api' : '/api';
    
    // Fetch backend VAPID public key
    const vapidRes = await fetch(`${API_BASE}/notifications/vapid-key`);
    if (!vapidRes.ok) return null;
    const { publicKey } = await vapidRes.json();
    if (!publicKey) return null;

    const reg = await navigator.serviceWorker.ready;
    if (!reg || !reg.pushManager) return null;

    let sub = await reg.pushManager.getSubscription();
    if (!sub) {
      const convertedKey = urlBase64ToUint8Array(publicKey);
      sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: convertedKey
      });
    }

    // Send subscription endpoint to backend MongoDB
    await fetch(`${API_BASE}/notifications/subscribe`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ subscription: sub })
    });

    return sub;
  } catch (err) {
    console.warn('Failed to register WebPush subscription with backend:', err);
    return null;
  }
};
