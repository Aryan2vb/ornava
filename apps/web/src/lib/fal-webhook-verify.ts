import { createHash, createPublicKey, verify } from "node:crypto";

/**
 * Fal.ai webhook verification.
 *
 * Fal signs webhooks with ED25519 using rotating keys published as JWKS at
 * https://rest.fal.ai/.well-known/jwks.json. We cache the key set for 24h.
 *
 * The signed message is constructed as:
 *   request_id \n user_id \n timestamp \n sha256_hex(body)
 *
 * Headers we receive:
 *   X-Fal-Webhook-Request-Id
 *   X-Fal-Webhook-User-Id
 *   X-Fal-Webhook-Timestamp (unix seconds)
 *   X-Fal-Webhook-Signature (hex)
 *
 * Reference: https://docs.fal.ai/model-endpoints/webhooks#verifying-your-webhook
 */

const JWKS_URL = "https://rest.fal.ai/.well-known/jwks.json";
const JWKS_CACHE_MS = 24 * 60 * 60 * 1000; // 24 hours
const TIMESTAMP_LEEWAY_SEC = 300; // ±5 minutes

type JwksKey = {
  x?: string; // base64url-encoded ED25519 public key
  kty?: string; // should be "OKP"
  crv?: string; // should be "Ed25519"
  kid?: string;
};

type JwksResponse = {
  keys?: JwksKey[];
};

// Module-level cache shared across webhook invocations. On Next.js dev
// mode with hot reload, this resets on each compile — that's fine.
let jwksCache: JwksKey[] | null = null;
let jwksCachedAt = 0;

async function fetchJwks(): Promise<JwksKey[]> {
  const now = Date.now();
  if (jwksCache && now - jwksCachedAt < JWKS_CACHE_MS) {
    return jwksCache;
  }

  const response = await fetch(JWKS_URL, {
    // Don't keep Next.js from being able to cache this response in some modes
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(`JWKS fetch failed: HTTP ${response.status}`);
  }

  const data = (await response.json()) as JwksResponse;
  const keys = data.keys ?? [];

  if (keys.length === 0) {
    throw new Error("JWKS returned no keys");
  }

  jwksCache = keys;
  jwksCachedAt = now;
  return keys;
}

/**
 * Build the ED25519 public key object from a JWKS entry. Node's crypto module
 * accepts JWK format directly via createPublicKey — we just need to ensure
 * kty/crv are set correctly.
 */
function jwkToPublicKey(jwk: JwksKey) {
  if (!jwk.x) return null;

  return createPublicKey({
    key: {
      kty: jwk.kty ?? "OKP",
      crv: jwk.crv ?? "Ed25519",
      x: jwk.x,
    },
    format: "jwk",
  });
}

export type FalWebhookHeaders = {
  requestId: string | null;
  userId: string | null;
  timestamp: string | null;
  signature: string | null;
};

export function extractFalWebhookHeaders(headers: Headers): FalWebhookHeaders {
  return {
    requestId: headers.get("x-fal-webhook-request-id"),
    userId: headers.get("x-fal-webhook-user-id"),
    timestamp: headers.get("x-fal-webhook-timestamp"),
    signature: headers.get("x-fal-webhook-signature"),
  };
}

export type VerifyResult =
  | { ok: true }
  | { ok: false; reason: string };

/**
 * Verify a Fal.ai webhook. Returns { ok: true } only if all checks pass:
 *   1. All four headers present
 *   2. Timestamp within ±5 min of now
 *   3. Signature validates against at least one public key in the JWKS
 *
 * Pass the rawBody (string or Buffer) — do NOT use a parsed JSON object,
 * since the signature covers the exact bytes Fal sent.
 */
export async function verifyFalWebhook(input: {
  rawBody: string | Buffer;
  headers: FalWebhookHeaders;
}): Promise<VerifyResult> {
  const { requestId, userId, timestamp, signature } = input.headers;

  if (!requestId || !userId || !timestamp || !signature) {
    return { ok: false, reason: "missing_headers" };
  }

  // Check timestamp freshness (prevents replay of old valid signatures)
  const tsNum = Number.parseInt(timestamp, 10);
  if (!Number.isFinite(tsNum)) {
    return { ok: false, reason: "invalid_timestamp" };
  }
  const nowSec = Math.floor(Date.now() / 1000);
  if (Math.abs(nowSec - tsNum) > TIMESTAMP_LEEWAY_SEC) {
    return { ok: false, reason: "timestamp_out_of_range" };
  }

  // Build the message that Fal signed
  const bodyBuffer = Buffer.isBuffer(input.rawBody)
    ? input.rawBody
    : Buffer.from(input.rawBody, "utf8");
  const bodyHash = createHash("sha256").update(bodyBuffer).digest("hex");
  const message = Buffer.from(
    [requestId, userId, timestamp, bodyHash].join("\n"),
    "utf8",
  );

  // Signature is hex-encoded
  let signatureBuffer: Buffer;
  try {
    signatureBuffer = Buffer.from(signature, "hex");
  } catch {
    return { ok: false, reason: "invalid_signature_encoding" };
  }
  if (signatureBuffer.length === 0) {
    return { ok: false, reason: "invalid_signature_encoding" };
  }

  // Fetch the public keys (cached)
  let keys: JwksKey[];
  try {
    keys = await fetchJwks();
  } catch (error) {
    console.error("[fal-webhook-verify] JWKS fetch failed:", error);
    return { ok: false, reason: "jwks_unavailable" };
  }

  // Try verifying against each key — Fal rotates keys, so multiple may be valid
  for (const jwk of keys) {
    try {
      const publicKey = jwkToPublicKey(jwk);
      if (!publicKey) continue;

      // Node's crypto.verify for ED25519: algorithm arg must be null
      const isValid = verify(null, message, publicKey, signatureBuffer);
      if (isValid) {
        return { ok: true };
      }
    } catch (error) {
      // Key decode failed — try the next one
      console.warn("[fal-webhook-verify] key verify error:", error);
      continue;
    }
  }

  return { ok: false, reason: "signature_mismatch" };
}

// Exported for testing / diagnostics
export function clearJwksCache() {
  jwksCache = null;
  jwksCachedAt = 0;
}
