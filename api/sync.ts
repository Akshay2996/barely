// Passphrase-sync backend: a tiny Vercel Edge Function that stores one opaque,
// end-to-end-encrypted blob per sync id in Upstash Redis. It never sees
// plaintext - only an id derived from the passphrase and the ciphertext.
//
//   GET  /api/sync?id=<hex>   -> { ciphertext, updatedAt } | null (404)
//   PUT  /api/sync            <- { id, ciphertext, updatedAt } -> { ok: true }
//
// Env (server-only, set in Vercel): UPSTASH_REDIS_REST_URL, UPSTASH_REDIS_REST_TOKEN.

export const config = { runtime: "edge" };

const MAX_BODY = 1_000_000; // ~1 MB ceiling on a stored blob
const TTL_SECONDS = 60 * 60 * 24 * 180; // expire after ~180 days of no writes
const ID_RE = /^[a-f0-9]{64}$/; // syncId is SHA-256 hex

function json(body: unknown, status = 200): Response {
  return new Response(body === null ? "null" : JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json", "Cache-Control": "no-store" },
  });
}

async function redis(cmd: unknown[]): Promise<{ result: unknown }> {
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) throw new Error("sync backend not configured");
  const res = await fetch(url, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify(cmd),
  });
  if (!res.ok) throw new Error(`upstash ${res.status}`);
  return res.json();
}

export default async function handler(req: Request): Promise<Response> {
  try {
    if (!process.env.UPSTASH_REDIS_REST_URL) return json({ error: "not configured" }, 503);

    if (req.method === "GET") {
      const id = new URL(req.url).searchParams.get("id") ?? "";
      if (!ID_RE.test(id)) return json({ error: "bad id" }, 400);
      const { result } = await redis(["GET", `sync:${id}`]);
      if (typeof result !== "string") return json(null, 404);
      return json(JSON.parse(result), 200);
    }

    if (req.method === "PUT") {
      const raw = await req.text();
      if (raw.length > MAX_BODY) return json({ error: "too large" }, 413);
      let body: { id?: unknown; ciphertext?: unknown; updatedAt?: unknown };
      try {
        body = JSON.parse(raw);
      } catch {
        return json({ error: "bad json" }, 400);
      }
      const id = String(body.id ?? "");
      if (!ID_RE.test(id) || typeof body.ciphertext !== "string") {
        return json({ error: "bad request" }, 400);
      }
      const value = JSON.stringify({
        ciphertext: body.ciphertext,
        updatedAt: typeof body.updatedAt === "number" ? body.updatedAt : Date.now(),
      });
      await redis(["SET", `sync:${id}`, value, "EX", TTL_SECONDS]);
      return json({ ok: true }, 200);
    }

    return json({ error: "method not allowed" }, 405);
  } catch {
    return json({ error: "sync failed" }, 500);
  }
}
