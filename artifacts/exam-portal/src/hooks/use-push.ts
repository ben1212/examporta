import { useEffect, useCallback } from 'react';

export function usePushNotifications() {
  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js')
        .then(registration => {
          console.log('SW registered:', registration.scope);
        })
        .catch(error => {
          console.error('SW registration failed:', error);
        });
    }

    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, []);

  const sendNotification = useCallback((title: string, body: string) => {
    if (!('Notification' in window)) return;

    if (Notification.permission === 'granted') {
      // Only show push notification if tab is in background
      if (document.visibilityState === 'hidden') {
        if ('serviceWorker' in navigator && navigator.serviceWorker.ready) {
          navigator.serviceWorker.ready.then(registration => {
            registration.showNotification(title, {
              body,
              icon: '/favicon.svg',
              vibrate: [100, 50, 100],
            });
          });
        } else {
          new Notification(title, { body, icon: '/favicon.svg' });
        }
      }
    }
  }, []);

  return { sendNotification };
}
