import { describe, expect, it } from "vitest";
import {
  contactSubmission,
  FIELD_LIMITS,
  RATE_LIMIT,
  type ContactInput,
} from "~/lib/contactSubmission";

// contactSubmission is the pure validation + spam policy: (fields + injected
// rate-limit state) → an accept/reject decision. These assert on the returned
// decision only — never on internals — with `now`/`recent` injected so there's
// no real clock or store in play.

// A clean, accepted-by-default submission; each test overrides just what it needs.
const base = (over: Partial<ContactInput> = {}): ContactInput => ({
  name: "Ada Lovelace",
  email: "ada@example.com",
  message: "Hello — I'd love to chat about a project.",
  honeypot: "",
  now: 1_000_000,
  recent: [],
  ...over,
});

describe("contactSubmission", () => {
  it("accepts a clean submission and returns the trimmed fields", () => {
    const decision = contactSubmission(
      base({ name: "  Ada  ", email: " ada@example.com ", message: "  hi  " }),
    );
    expect(decision.ok).toBe(true);
    if (decision.ok) {
      expect(decision.value).toEqual({
        name: "Ada",
        email: "ada@example.com",
        message: "hi",
      });
    }
  });

  it("rejects a missing name, email, or message", () => {
    for (const field of ["name", "email", "message"] as const) {
      const decision = contactSubmission(base({ [field]: "   " }));
      expect(decision.ok).toBe(false);
      if (!decision.ok) expect(decision.reason).toBe("missing");
    }
  });

  it("rejects oversized fields", () => {
    const oversize = {
      name: "a".repeat(FIELD_LIMITS.name + 1),
      // keep it a valid email shape so it's the length, not the shape, rejected
      email: `${"a".repeat(FIELD_LIMITS.email)}@example.com`,
      message: "m".repeat(FIELD_LIMITS.message + 1),
    };
    for (const field of ["name", "email", "message"] as const) {
      const decision = contactSubmission(base({ [field]: oversize[field] }));
      expect(decision.ok).toBe(false);
      if (!decision.ok) expect(decision.reason).toBe("too-long");
    }
  });

  it("rejects a malformed email", () => {
    for (const email of ["nope", "no@domain", "a b@example.com", "@example.com"]) {
      const decision = contactSubmission(base({ email }));
      expect(decision.ok).toBe(false);
      if (!decision.ok) expect(decision.reason).toBe("bad-email");
    }
  });

  it("rejects when the honeypot is filled", () => {
    const decision = contactSubmission(base({ honeypot: "http://spam.example" }));
    expect(decision.ok).toBe(false);
    if (!decision.ok) expect(decision.reason).toBe("honeypot");
  });

  it("rejects when at or over the rate limit within the window", () => {
    const now = 1_000_000;
    // `max` sends already inside the window → the next one is refused
    const recent = Array.from(
      { length: RATE_LIMIT.max },
      (_, i) => now - i * 1000,
    );
    const decision = contactSubmission(base({ now, recent }));
    expect(decision.ok).toBe(false);
    if (!decision.ok) expect(decision.reason).toBe("rate-limit");
  });

  it("does not count sends that have aged out of the window", () => {
    const now = 1_000_000;
    // `max` sends, but all older than the window → they no longer count
    const recent = Array.from(
      { length: RATE_LIMIT.max },
      (_, i) => now - RATE_LIMIT.windowMs - i * 1000,
    );
    expect(contactSubmission(base({ now, recent })).ok).toBe(true);
  });
});
