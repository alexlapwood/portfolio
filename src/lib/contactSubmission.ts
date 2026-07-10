// contactSubmission — pure, DOM-free, framework-free: the contact form's
// validation + spam policy as a single input→decision function. It never sends
// mail and never touches the clock or a store; the transport injects `now` and
// the sender's `recent` accepted-send timestamps, so accept/reject is fully
// testable in isolation (see contactSubmission.test.ts).
//
// The result is a discriminated union, not a thrown error: callers switch on
// `decision.ok` and, on reject, surface `decision.message` (terminal-style, to
// match the form's "! …" feedback) or branch on the machine-readable `reason`.

// Per-field caps — reject anything oversized before it reaches Resend. Sane for
// a contact form: a real name/email are short, a message is a few paragraphs.
export const FIELD_LIMITS = { name: 100, email: 200, message: 5000 } as const;

// Best-effort rate limit: at most `max` accepted sends per rolling `windowMs`
// from one sender. Kept as pure arithmetic over injected timestamps here; the
// server transport owns the (per-IP, in-memory) store that feeds `recent`.
export const RATE_LIMIT = { windowMs: 60_000, max: 3 } as const;

// The same shape the form pre-validates against: a local part, an @, and a
// dotted domain, with no whitespace — deliberately loose (real deliverability
// is Resend's job), just enough to catch obvious typos and junk.
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export type ContactReason =
  | "honeypot"
  | "missing"
  | "too-long"
  | "bad-email"
  | "rate-limit";

// The trimmed, validated fields the transport actually emails.
export type CleanSubmission = { name: string; email: string; message: string };

export type ContactInput = {
  name: string;
  email: string;
  message: string;
  honeypot: string;
  // Rate-limit state, injected so the policy stays pure: `now` is epoch-ms and
  // `recent` are this sender's prior accepted-send timestamps (epoch-ms).
  now: number;
  recent: readonly number[];
};

export type ContactDecision =
  | { ok: true; value: CleanSubmission }
  | { ok: false; reason: ContactReason; message: string };

export function contactSubmission(input: ContactInput): ContactDecision {
  const name = input.name.trim();
  const email = input.email.trim();
  const message = input.message.trim();

  // Honeypot first: a filled hidden field means a bot, so reject before doing
  // (or leaking) any further validation work on obvious spam.
  if (input.honeypot.trim() !== "") {
    return { ok: false, reason: "honeypot", message: "! blocked." };
  }

  if (!name || !email || !message) {
    return {
      ok: false,
      reason: "missing",
      message: "! all fields are required.",
    };
  }

  if (
    name.length > FIELD_LIMITS.name ||
    email.length > FIELD_LIMITS.email ||
    message.length > FIELD_LIMITS.message
  ) {
    return { ok: false, reason: "too-long", message: "! that message is too long." };
  }

  if (!EMAIL_RE.test(email)) {
    return { ok: false, reason: "bad-email", message: "! that email looks malformed." };
  }

  // Rate limit: count only the sends still inside the rolling window ending now.
  const inWindow = input.recent.filter(
    (t) => input.now - t < RATE_LIMIT.windowMs,
  ).length;
  if (inWindow >= RATE_LIMIT.max) {
    return {
      ok: false,
      reason: "rate-limit",
      message: "! too many messages — give it a minute.",
    };
  }

  return { ok: true, value: { name, email, message } };
}
