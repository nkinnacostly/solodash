import crypto from "crypto";

const SECRET = process.env.PAIDLY_LINK_SECRET;
const DEFAULT_EXPIRY_DAYS = 30;

if (!SECRET) {
  console.warn("[link-tokens] PAIDLY_LINK_SECRET not set");
}

export type LinkType = "pay" | "sign";

interface TokenPayload {
  id: string;
  type: LinkType;
  exp: number;
}

/**
 * Generate a signed token for a public URL.
 * Format: base64url(payload).base64url(signature)
 */
export function generateLinkToken(
  id: string,
  type: LinkType,
  expiryDays: number = DEFAULT_EXPIRY_DAYS,
): string {
  if (!SECRET) throw new Error("PAIDLY_LINK_SECRET not configured");

  const payload: TokenPayload = {
    id,
    type,
    exp: Date.now() + expiryDays * 24 * 60 * 60 * 1000,
  };

  const payloadStr = base64url(JSON.stringify(payload));
  const signature = base64url(
    crypto.createHmac("sha256", SECRET).update(payloadStr).digest(),
  );

  return `${payloadStr}.${signature}`;
}

/**
 * Verify a token. Returns the payload if valid, null if invalid/expired.
 */
export function verifyLinkToken(
  token: string,
  expectedId: string,
  expectedType: LinkType,
): TokenPayload | null {
  if (!SECRET) return null;
  if (!token || !token.includes(".")) return null;

  const [payloadStr, signature] = token.split(".");

  const expectedSig = base64url(
    crypto.createHmac("sha256", SECRET).update(payloadStr).digest(),
  );

  if (signature.length !== expectedSig.length) {
    return null;
  }

  try {
    if (
      !crypto.timingSafeEqual(
        Buffer.from(signature),
        Buffer.from(expectedSig),
      )
    ) {
      return null;
    }
  } catch {
    return null;
  }

  let payload: TokenPayload;
  try {
    payload = JSON.parse(base64urlDecode(payloadStr)) as TokenPayload;
  } catch {
    return null;
  }

  if (payload.id !== expectedId) return null;
  if (payload.type !== expectedType) return null;
  if (payload.exp < Date.now()) return null;

  return payload;
}

/**
 * Generate a full public URL with embedded token.
 */
export function generatePublicUrl(
  baseUrl: string,
  path: "pay" | "sign",
  id: string,
): string {
  const token = generateLinkToken(id, path);
  const normalizedBase = baseUrl.replace(/\/$/, "");
  return `${normalizedBase}/${path}/${id}?token=${encodeURIComponent(token)}`;
}

function base64url(input: string | Buffer): string {
  const buf = typeof input === "string" ? Buffer.from(input) : input;
  return buf
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

function base64urlDecode(input: string): string {
  let str = input.replace(/-/g, "+").replace(/_/g, "/");
  while (str.length % 4) str += "=";
  return Buffer.from(str, "base64").toString();
}
