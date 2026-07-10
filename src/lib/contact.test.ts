import { describe, expect, it } from "vitest";
import {
  buildContactEmail,
  contactConfigFromEnv,
  deliverContact,
  type ContactConfig,
  type DeliverInput,
} from "~/lib/contact";
import type { ContactEmail, ContactTransport } from "~/lib/resendTransport";

// deliverContact is the accept→send→result seam between the policy and Resend.
// The transport is a parameter, so these use a fake that records the email and
// sends nothing — no real mail leaves in tests.

const config: ContactConfig = {
  apiKey: "test",
  to: "contact@alexlapwood.com",
  from: "Portfolio Contact <noreply@send.alexlapwood.com>",
};

const input = (over: Partial<DeliverInput> = {}): DeliverInput => ({
  name: "Ada Lovelace",
  email: "ada@example.com",
  message: "Hello there.",
  honeypot: "",
  now: 1_000_000,
  recent: [],
  ...over,
});

// A fake transport: succeeds by default, records every email it's handed.
function fakeTransport(result: Awaited<ReturnType<ContactTransport>> = { ok: true }) {
  const sent: ContactEmail[] = [];
  const transport: ContactTransport = async (email) => {
    sent.push(email);
    return result;
  };
  return { transport, sent };
}

describe("deliverContact", () => {
  it("calls the transport with the right email shape on accept", async () => {
    const { transport, sent } = fakeTransport();
    const result = await deliverContact(input(), transport, config);

    expect(result.ok).toBe(true);
    expect(sent).toHaveLength(1);
    expect(sent[0]).toMatchObject({
      from: config.from,
      to: config.to,
      replyTo: "ada@example.com", // reply-to is the visitor
      subject: "Portfolio contact from Ada Lovelace",
    });
    expect(sent[0].text).toContain("ada@example.com");
    expect(sent[0].text).toContain("Hello there.");
  });

  it("does NOT call the transport on a policy reject", async () => {
    const { transport, sent } = fakeTransport();
    const result = await deliverContact(input({ email: "nope" }), transport, config);

    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.text).toContain("malformed");
    expect(sent).toHaveLength(0);
  });

  it("answers a filled honeypot as success but sends nothing", async () => {
    const { transport, sent } = fakeTransport();
    const result = await deliverContact(input({ honeypot: "bot" }), transport, config);

    expect(result.ok).toBe(true); // bot gets no signal it was caught
    expect(sent).toHaveLength(0); // …but no mail is sent
  });

  it("surfaces the transport's error when sending fails", async () => {
    const { transport } = fakeTransport({ ok: false, error: "! send failed." });
    const result = await deliverContact(input(), transport, config);

    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.text).toBe("! send failed.");
  });
});

describe("buildContactEmail", () => {
  it("sets reply-to to the visitor and routes to the configured inbox", () => {
    const email = buildContactEmail(
      { name: "Ada", email: "ada@example.com", message: "hi" },
      config,
    );
    expect(email.replyTo).toBe("ada@example.com");
    expect(email.to).toBe(config.to);
    expect(email.from).toBe(config.from);
  });
});

describe("contactConfigFromEnv", () => {
  it("falls back to the alexlapwood.com defaults when env is unset", () => {
    const prev = {
      key: process.env.RESEND_API_KEY,
      to: process.env.CONTACT_TO,
      from: process.env.CONTACT_FROM,
    };
    delete process.env.RESEND_API_KEY;
    delete process.env.CONTACT_TO;
    delete process.env.CONTACT_FROM;
    try {
      expect(contactConfigFromEnv()).toEqual({
        apiKey: "",
        to: "contact@alexlapwood.com",
        from: "Portfolio Contact <noreply@send.alexlapwood.com>",
      });
    } finally {
      // restore whatever the runner had, so other tests see a clean env
      if (prev.key !== undefined) process.env.RESEND_API_KEY = prev.key;
      if (prev.to !== undefined) process.env.CONTACT_TO = prev.to;
      if (prev.from !== undefined) process.env.CONTACT_FROM = prev.from;
    }
  });
});
