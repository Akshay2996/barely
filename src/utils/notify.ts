// Fire a notification in the most compatible way available.
//
// On Android Chrome the `new Notification()` constructor is forbidden - you MUST
// go through the service worker registration. On desktop either works. So we
// prefer the SW registration and fall back to the constructor.
export async function showNudge(title: string, body: string): Promise<boolean> {
  if (typeof Notification === "undefined" || Notification.permission !== "granted") {
    return false;
  }
  const options: NotificationOptions = {
    body,
    icon: "/icon-192.png",
    badge: "/icon-192.png",
    tag: "barely-reminder",
    requireInteraction: true,
  };

  try {
    if ("serviceWorker" in navigator) {
      const reg = await navigator.serviceWorker.getRegistration();
      if (reg) {
        await reg.showNotification(title, options);
        return true;
      }
    }
  } catch {
    /* fall through to the constructor */
  }

  try {
    new Notification(title, options);
    return true;
  } catch {
    return false;
  }
}
