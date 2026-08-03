import type { BackupData } from "@/utils/backup";
import type { SyncProvider } from "@/utils/sync";

// Sync provider backed by the user's own Google Drive. Data lives in a single
// file inside the hidden per-app `appDataFolder`, so it never clutters the
// user's Drive and only this app (for this user) can read it. No app server is
// involved - the browser talks to Google directly.
//
// Uses the NON-SENSITIVE `drive.appdata` scope (+ userinfo.email to show the
// account), which needs only basic OAuth consent setup - no sensitive/restricted
// verification and no 100-user cap.

// The Vercel/`.env` build-time var wins if set; otherwise fall back to Barely's
// public OAuth client id. A Google client id is not a secret - it ships in the
// bundle either way and only works from its Authorized JavaScript origins
// (barelytrack.vercel.app + localhost), so committing it is safe. Forks can
// override it with their own VITE_GOOGLE_CLIENT_ID.
const CLIENT_ID =
  import.meta.env.VITE_GOOGLE_CLIENT_ID ||
  "296481444111-7oid7daud02rhebcij7iqkuel0pi7shp.apps.googleusercontent.com";
const SCOPES = [
  "https://www.googleapis.com/auth/drive.appdata",
  "https://www.googleapis.com/auth/userinfo.email",
].join(" ");
const FILE_NAME = "barely-sync.json";
const GIS_SRC = "https://accounts.google.com/gsi/client";

const CONNECTED_KEY = "barely:sync:gdrive"; // "1" once the user has connected
const EMAIL_KEY = "barely:sync:gdrive-email"; // remembered account for the UI

/** True when a Google OAuth client id has been configured at build time. */
export function isGoogleDriveConfigured(): boolean {
  return CLIENT_ID.length > 0;
}

export function isGoogleDriveConnected(): boolean {
  try {
    return localStorage.getItem(CONNECTED_KEY) === "1";
  } catch {
    return false;
  }
}

export function googleAccountEmail(): string | null {
  try {
    return localStorage.getItem(EMAIL_KEY);
  } catch {
    return null;
  }
}

// ── Auth (Google Identity Services token flow) ────────────────────────

let gisReady: Promise<void> | null = null;
function loadGis(): Promise<void> {
  if (gisReady) return gisReady;
  gisReady = new Promise((resolve, reject) => {
    if (window.google?.accounts?.oauth2) return resolve();
    const s = document.createElement("script");
    s.src = GIS_SRC;
    s.async = true;
    s.defer = true;
    s.onload = () => resolve();
    s.onerror = () => reject(new Error("Could not load Google sign-in."));
    document.head.appendChild(s);
  });
  return gisReady;
}

let accessToken: string | null = null;
let tokenExpiry = 0; // epoch ms

/**
 * Get a valid access token. `interactive` shows the Google account/consent
 * popup (required the first time); otherwise it tries a silent refresh.
 */
async function getToken(interactive: boolean): Promise<string> {
  if (!CLIENT_ID) throw new Error("Google Drive sync is not configured.");
  if (accessToken && Date.now() < tokenExpiry - 60_000) return accessToken;
  await loadGis();

  return new Promise<string>((resolve, reject) => {
    const client = window.google!.accounts.oauth2.initTokenClient({
      client_id: CLIENT_ID,
      scope: SCOPES,
      callback: (resp) => {
        if (resp.error || !resp.access_token) {
          reject(new Error(resp.error || "Google sign-in was cancelled."));
          return;
        }
        accessToken = resp.access_token;
        tokenExpiry = Date.now() + (resp.expires_in ?? 3600) * 1000;
        resolve(accessToken);
      },
      error_callback: (err) => reject(new Error(err.message || "Google sign-in failed.")),
    });
    // Empty prompt tries silent; "consent"/default shows the popup.
    client.requestAccessToken({ prompt: interactive ? "" : "none" });
  });
}

async function driveFetch(token: string, url: string, init?: RequestInit): Promise<Response> {
  const res = await fetch(url, {
    ...init,
    headers: { Authorization: `Bearer ${token}`, ...(init?.headers ?? {}) },
  });
  if (res.status === 401) {
    // Token expired mid-flight - force a fresh one and retry once.
    accessToken = null;
    const fresh = await getToken(false);
    return fetch(url, {
      ...init,
      headers: { Authorization: `Bearer ${fresh}`, ...(init?.headers ?? {}) },
    });
  }
  return res;
}

// ── Drive appdata file ops ────────────────────────────────────────────

async function findFileId(token: string): Promise<string | null> {
  const url =
    "https://www.googleapis.com/drive/v3/files?spaces=appDataFolder" +
    "&fields=files(id,name)&q=" +
    encodeURIComponent(`name='${FILE_NAME}'`);
  const res = await driveFetch(token, url);
  if (!res.ok) throw new Error("Couldn't reach Google Drive.");
  const data = (await res.json()) as { files?: { id: string }[] };
  return data.files?.[0]?.id ?? null;
}

async function fetchEmail(token: string): Promise<string | null> {
  try {
    const res = await driveFetch(token, "https://www.googleapis.com/oauth2/v3/userinfo");
    if (!res.ok) return null;
    const data = (await res.json()) as { email?: string };
    return data.email ?? null;
  } catch {
    return null;
  }
}

// ── Public API ────────────────────────────────────────────────────────

/** Trigger the Google sign-in popup and remember the connection. */
export async function connectGoogleDrive(): Promise<{ email: string | null }> {
  const token = await getToken(true);
  const email = await fetchEmail(token);
  try {
    localStorage.setItem(CONNECTED_KEY, "1");
    if (email) localStorage.setItem(EMAIL_KEY, email);
  } catch {
    /* ignore */
  }
  return { email };
}

export function disconnectGoogleDrive(): void {
  if (accessToken) {
    try {
      window.google?.accounts.oauth2.revoke(accessToken);
    } catch {
      /* ignore */
    }
  }
  accessToken = null;
  tokenExpiry = 0;
  try {
    localStorage.removeItem(CONNECTED_KEY);
    localStorage.removeItem(EMAIL_KEY);
  } catch {
    /* ignore */
  }
}

/** SyncProvider implementation over Google Drive appdata. */
export const googleDriveProvider: SyncProvider = {
  id: "gdrive",
  label: "Google Drive",
  async pull() {
    const token = await getToken(false);
    const fileId = await findFileId(token);
    if (!fileId) return null;
    const res = await driveFetch(
      token,
      `https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`,
    );
    if (!res.ok) throw new Error("Couldn't read the sync file from Google Drive.");
    return (await res.json()) as BackupData;
  },
  async push(data: BackupData) {
    const token = await getToken(false);
    const fileId = await findFileId(token);
    const body = JSON.stringify(data);
    if (fileId) {
      const res = await driveFetch(
        token,
        `https://www.googleapis.com/upload/drive/v3/files/${fileId}?uploadType=media`,
        { method: "PATCH", headers: { "Content-Type": "application/json" }, body },
      );
      if (!res.ok) throw new Error("Couldn't save the sync file to Google Drive.");
    } else {
      const boundary = "barely" + Math.random().toString(36).slice(2);
      const metadata = { name: FILE_NAME, parents: ["appDataFolder"] };
      const multipart =
        `--${boundary}\r\nContent-Type: application/json; charset=UTF-8\r\n\r\n` +
        `${JSON.stringify(metadata)}\r\n` +
        `--${boundary}\r\nContent-Type: application/json\r\n\r\n` +
        `${body}\r\n--${boundary}--`;
      const res = await driveFetch(
        token,
        "https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart",
        {
          method: "POST",
          headers: { "Content-Type": `multipart/related; boundary=${boundary}` },
          body: multipart,
        },
      );
      if (!res.ok) throw new Error("Couldn't create the sync file in Google Drive.");
    }
  },
};
