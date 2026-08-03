import { runSync, type SyncProvider, type SyncResult } from "@/utils/sync";
import {
  googleDriveProvider,
  isGoogleDriveConfigured,
  isGoogleDriveConnected,
} from "@/utils/googleDrive";
import { passphraseProvider, isPassphraseEnabled } from "@/utils/passphrase";

// Chooses whichever sync method the user has enabled and coordinates automatic
// syncing. Only one auto-sync method is active at a time; the UI keeps them
// mutually exclusive (enabling one disables the other).

export function getActiveProvider(): SyncProvider | null {
  if (isPassphraseEnabled()) return passphraseProvider;
  if (isGoogleDriveConfigured() && isGoogleDriveConnected()) return googleDriveProvider;
  return null;
}

export function isSyncEnabled(): boolean {
  return getActiveProvider() !== null;
}

// `applying` is true while runSync writes merged data locally, so the change it
// causes doesn't schedule yet another sync (avoids a feedback loop).
let applying = false;
let timer: ReturnType<typeof setTimeout> | null = null;

/** Run a sync now with the active provider (no-op if none). */
export async function syncNow(): Promise<SyncResult | null> {
  const provider = getActiveProvider();
  if (!provider) return null;
  applying = true;
  try {
    return await runSync(provider);
  } finally {
    applying = false;
  }
}

/** Debounced background sync, e.g. after the user changes a task. */
export function scheduleSync(delay = 2500): void {
  if (applying || !getActiveProvider()) return;
  if (timer) clearTimeout(timer);
  timer = setTimeout(() => {
    void syncNow().catch(() => {
      /* transient network/auth error - a later trigger will retry */
    });
  }, delay);
}
