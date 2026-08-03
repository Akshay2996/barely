import type { BackupData } from "@/utils/backup";
import type { SyncProvider } from "@/utils/sync";
import { deriveSyncId, encryptJSON, decryptJSON } from "@/utils/crypto";

// Passphrase sync: the user picks (or generates) a secret code and enters the
// same one on each device. Data is end-to-end encrypted here on the device and
// stored as opaque ciphertext via /api/sync - the server can't read it, and the
// passphrase is the only key.

const CODE_KEY = "barely:sync:passphrase";

// Crockford-ish alphabet (no I/O/0/1) for a code that's easy to read + type.
const ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

/** A high-entropy, human-typeable code, e.g. "ABCD-EFGH-JKLM-NPQR" (~80 bits). */
export function generatePassphrase(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(16));
  const chars = [...bytes].map((b) => ALPHABET[b % ALPHABET.length]);
  return [0, 4, 8, 12].map((i) => chars.slice(i, i + 4).join("")).join("-");
}

/** Normalize user input (case, spaces) so "abcd efgh" == "ABCD-EFGH". */
export function normalizePassphrase(input: string): string {
  return input.trim().toUpperCase().replace(/\s+/g, "");
}

export function getPassphrase(): string | null {
  try {
    return localStorage.getItem(CODE_KEY);
  } catch {
    return null;
  }
}

export function setPassphrase(code: string): void {
  try {
    localStorage.setItem(CODE_KEY, code);
  } catch {
    /* ignore */
  }
}

export function clearPassphrase(): void {
  try {
    localStorage.removeItem(CODE_KEY);
  } catch {
    /* ignore */
  }
}

export function isPassphraseEnabled(): boolean {
  return !!getPassphrase();
}

interface StoredBlob {
  ciphertext?: string;
  updatedAt?: number;
}

/** SyncProvider backed by the encrypted /api/sync key-value endpoint. */
export const passphraseProvider: SyncProvider = {
  id: "passphrase",
  label: "Passphrase",
  async pull() {
    const code = getPassphrase();
    if (!code) return null;
    const id = await deriveSyncId(code);
    const res = await fetch(`/api/sync?id=${id}`);
    if (res.status === 404) return null;
    if (!res.ok) throw new Error("Couldn't reach the sync service.");
    const stored = (await res.json()) as StoredBlob | null;
    if (!stored?.ciphertext) return null;
    // Wrong passphrase -> decrypt throws; surface a clear message.
    try {
      return await decryptJSON<BackupData>(code, stored.ciphertext);
    } catch {
      throw new Error("That passphrase doesn't match this synced data.");
    }
  },
  async push(data: BackupData) {
    const code = getPassphrase();
    if (!code) throw new Error("No passphrase set.");
    const id = await deriveSyncId(code);
    const ciphertext = await encryptJSON(code, data);
    const res = await fetch("/api/sync", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, ciphertext, updatedAt: Date.now() }),
    });
    if (!res.ok) throw new Error("Couldn't save to the sync service.");
  },
};
