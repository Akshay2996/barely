// End-to-end encryption for passphrase sync, using the built-in Web Crypto API
// (no dependencies). From a single passphrase we derive two independent things:
//
//   syncId  - an opaque, non-secret identifier (which blob to fetch). Sent to
//             the server; reveals nothing about the passphrase or the data.
//   key     - an AES-GCM key used to encrypt/decrypt the snapshot. Never leaves
//             the device; the server only ever stores ciphertext.
//
// Both are derived with domain-separated salts so `syncId` can't be used to
// attack the key.

const enc = new TextEncoder();
const dec = new TextDecoder();
const PBKDF2_ITERS = 210_000;
const ID_SALT = enc.encode("barely:sync:id:v1");
const KEY_SALT = enc.encode("barely:sync:key:v1");

function toHex(buf: ArrayBuffer): string {
  return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, "0")).join("");
}
function toB64(bytes: Uint8Array): string {
  let s = "";
  for (const b of bytes) s += String.fromCharCode(b);
  return btoa(s);
}
function fromB64(b64: string): Uint8Array {
  const s = atob(b64);
  const out = new Uint8Array(s.length);
  for (let i = 0; i < s.length; i++) out[i] = s.charCodeAt(i);
  return out;
}

async function passphraseKeyMaterial(passphrase: string): Promise<CryptoKey> {
  return crypto.subtle.importKey("raw", enc.encode(passphrase), "PBKDF2", false, [
    "deriveBits",
    "deriveKey",
  ]);
}

/** Opaque, non-secret id for the passphrase (64 hex chars). Safe to send to the server. */
export async function deriveSyncId(passphrase: string): Promise<string> {
  const material = await passphraseKeyMaterial(passphrase);
  const bits = await crypto.subtle.deriveBits(
    { name: "PBKDF2", salt: ID_SALT, iterations: PBKDF2_ITERS, hash: "SHA-256" },
    material,
    256,
  );
  return toHex(bits);
}

async function deriveKey(passphrase: string): Promise<CryptoKey> {
  const material = await passphraseKeyMaterial(passphrase);
  return crypto.subtle.deriveKey(
    { name: "PBKDF2", salt: KEY_SALT, iterations: PBKDF2_ITERS, hash: "SHA-256" },
    material,
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt", "decrypt"],
  );
}

/** Encrypt an arbitrary object to a compact string (iv + ciphertext, base64). */
export async function encryptJSON(passphrase: string, data: unknown): Promise<string> {
  const key = await deriveKey(passphrase);
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const ct = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv: iv as BufferSource },
    key,
    enc.encode(JSON.stringify(data)) as BufferSource,
  );
  return `${toB64(iv)}.${toB64(new Uint8Array(ct))}`;
}

/** Decrypt a string produced by encryptJSON. Throws if the passphrase is wrong. */
export async function decryptJSON<T = unknown>(passphrase: string, payload: string): Promise<T> {
  const [ivB64, ctB64] = payload.split(".");
  if (!ivB64 || !ctB64) throw new Error("Malformed encrypted payload.");
  const key = await deriveKey(passphrase);
  const pt = await crypto.subtle.decrypt(
    { name: "AES-GCM", iv: fromB64(ivB64) as BufferSource },
    key,
    fromB64(ctB64) as BufferSource,
  );
  return JSON.parse(dec.decode(pt)) as T;
}
