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
    return 'unsupported';
  }

  try {
    const permission = await Notification.requestPermission();
    if (permission === 'granted') {
      await registerServiceWorker();
      await triggerPushNotification({
        title: '🔔 Web3Central Push Alerts Active',
        body: 'You are now set up to receive real-time push alerts for new dApps, protocols, and market metrics even when away!',
        url: '/'
      });
    }
    return permission;
  } catch (err) {
    console.error('Error requesting push permission:', err);
    return 'denied';
  }
};

export const triggerPushNotification = async ({ title, body, url = '/' }) => {
  if (typeof window === 'undefined' || !('Notification' in window)) return;
  if (Notification.permission !== 'granted') return;

  const options = {
    body,
    icon: '/logo.jpg',
    badge: '/logo.jpg',
    vibrate: [100, 50, 100],
    data: { url }
  };

  // Try Service Worker showNotification first (works in background / tab away)
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
