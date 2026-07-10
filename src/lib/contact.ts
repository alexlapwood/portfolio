// contact — the orchestrator between the pure policy (contactSubmission) and the
// transport (resendTransport). Deliberately framework-free and DOM-free: the
// transport and config are parameters, so the whole accept→send→result flow is
// unit-testable with a fake transport that sends nothing (see contact.test.ts).
// The "use server" action in ~/server/contact.ts is a thin wrapper that reads
// FormData + env + the per-IP store and calls deliverContact.

import { renderContactEmailHtml } from "~/lib/contactEmailHtml";
import {
  contactSubmission,
  type CleanSubmission,
} from "~/lib/contactSubmission";
import type { ContactEmail, ContactTransport } from "~/lib/resendTransport";

// Env-configurable addresses. Notifications land in whatever inbox CONTACT_TO
// points to, and the from address must sit on the Resend-verified apex domain
// alexlapwood.com (DKIM resend._domainkey); send.alexlapwood.com is only the
// return-path / MAIL FROM subdomain.
// Overridable via CONTACT_TO / CONTACT_FROM.
export type ContactConfig = { apiKey: string; to: string; from: string };

// What the form surfaces: an ok/err flag plus terminal-style feedback text.
export type ContactResult = { ok: true; text: string } | { ok: false; text: string };

export type DeliverInput = {
  name: string;
  email: string;
  message: string;
  honeypot: string;
  now: number;
  recent: readonly number[];
};

// Shown on a clean, delivered send — keeps the form's "✓ …" terminal voice.
const SENT_TEXT = "✓ sent.";

// Reads the transport config from the environment, with sensible defaults so the
// action works the moment RESEND_API_KEY is present without further wiring.
export function contactConfigFromEnv(): ContactConfig {
  return {
    apiKey: process.env.RESEND_API_KEY ?? "",
    to: process.env.CONTACT_TO ?? "contact@alexlapwood.com",
    from: process.env.CONTACT_FROM ?? "Portfolio Contact <noreply@alexlapwood.com>",
  };
}

// Renders a validated submission into the Resend email payload. reply_to is the
// visitor so Alex can reply straight from his inbox to the sender.
export function buildContactEmail(
  value: CleanSubmission,
  config: ContactConfig,
): ContactEmail {
  return {
    from: config.from,
    to: config.to,
    replyTo: value.email,
    subject: `Portfolio contact from ${value.name}`,
    text: `New message via alexlapwood.com\n\nName: ${value.name}\nEmail: ${value.email}\n\n${value.message}\n`,
    html: renderContactEmailHtml(value),
  };
}

// The orchestrator: apply the policy, and only on accept hand the built email to
// the injected transport. On any policy reject the transport is never called
// (no mail sent); a filled honeypot is answered as success so the bot gets no
// signal it was caught.
export async function deliverContact(
  input: DeliverInput,
  transport: ContactTransport,
  config: ContactConfig,
): Promise<ContactResult> {
  const decision = contactSubmission(input);
  if (!decision.ok) {
    if (decision.reason === "honeypot") return { ok: true, text: SENT_TEXT };
    return { ok: false, text: decision.message };
  }

  const sent = await transport(buildContactEmail(decision.value, config));
  if (!sent.ok) return { ok: false, text: sent.error };
  return { ok: true, text: SENT_TEXT };
}
