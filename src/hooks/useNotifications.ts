import { useState, useEffect, useCallback } from "react";
import { useAppStore } from "@/stores/appStore";
import { showNudge } from "@/utils/notify";

export type NotificationPermission = "default" | "granted" | "denied";

interface UseNotificationsOptions {
  /** When true, this instance drives the recurring reminder scheduling. */
  schedule?: boolean;
}

interface UseNotificationsReturn {
  permission: NotificationPermission;
  requestPermission: () => Promise<NotificationPermission>;
}

const MAX_TIMEOUT = 2_147_483_647; // setTimeout caps at ~24.8 days

/** Ms until the next occurrence of HH:MM (today if still ahead, else tomorrow). */
function msUntil(time: string): number {
  const [h, m] = time.split(":").map(Number);
  const now = new Date();
  const target = new Date();
  target.setHours(h, m, 0, 0);
  if (target.getTime() <= now.getTime()) target.setDate(target.getDate() + 1);
  return target.getTime() - now.getTime();
}

export function useNotifications(options: UseNotificationsOptions = {}): UseNotificationsReturn {
  const { schedule = false } = options;
  const reminderOn = useAppStore((s) => s.settings.reminderOn);
  const reminderTime = useAppStore((s) => s.settings.reminderTime);

  const [permission, setPermission] = useState<NotificationPermission>(
    typeof Notification !== "undefined" ? Notification.permission : "default",
  );

  const requestPermission = useCallback(async () => {
    if (typeof Notification === "undefined") return "denied" as const;
    const result = await Notification.requestPermission();
    setPermission(result);
    return result;
  }, []);

  // Reactively (re)schedule the nudge whenever the reminder settings or the
  // permission change. Fires while the app is open and re-arms for the next day.
  useEffect(() => {
    if (!schedule) return;
    if (!reminderOn || !reminderTime || permission !== "granted") return;

    let timer: ReturnType<typeof setTimeout>;
    let cancelled = false;

    const arm = () => {
      const delay = Math.min(msUntil(reminderTime), MAX_TIMEOUT);
      timer = setTimeout(async () => {
        if (cancelled) return;
        await showNudge(
          "Time to open your laptop",
          "Your three things are waiting. Barely counts - remember?",
        );
        arm(); // re-arm for the following day
      }, delay);
    };
    arm();

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [schedule, reminderOn, reminderTime, permission]);

  return { permission, requestPermission };
}
