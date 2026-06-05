/**
 * Logging guidelines for Paidly:
 *
 * DO log:
 * - Operation names and outcomes ("Invoice marked as paid")
 * - Generic error messages
 * - Redacted IDs for tracing
 *
 * DO NOT log:
 * - Full cookies, session tokens, or access tokens
 * - Full email addresses (use redactEmail)
 * - Full user IDs (use redactUserId)
 * - Bank details
 * - tx_ref strings (use redactTxRef)
 * - Full request/response bodies
 */

/**
 * Redact sensitive data from log messages.
 */
export function redactEmail(email: string | null | undefined): string {
  if (!email || !email.includes("@")) return "[redacted]";
  const [local, domain] = email.split("@");
  return `${local.slice(0, 1)}***@${domain}`;
}

export function redactUserId(id: string | null | undefined): string {
  if (!id) return "[redacted]";
  return `${id.slice(0, 8)}***`;
}

export function redactTxRef(txRef: string | null | undefined): string {
  if (!txRef) return "[redacted]";
  // PAIDLY-{uuid}-{ts} or PAIDLY-SUB-NGN-{uuid}-{ts}
  // Keep just the prefix and timestamp, redact the UUID portion
  const parts = txRef.split("-");
  if (parts.length < 3) return "[redacted-tx]";
  return `${parts[0]}-***-${parts[parts.length - 1]}`;
}

/** Log message from unknown errors without dumping full objects. */
export function errorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  if (typeof error === "string") return error;
  if (error && typeof error === "object" && "message" in error) {
    const msg = (error as { message: unknown }).message;
    if (typeof msg === "string") return msg;
  }
  return "Unknown error";
}
