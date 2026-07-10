// resendTransport — the app's transactional email sender, kept behind a narrow
// ContactTransport seam (an email → result function). The contact orchestrator
// (deliverContact) depends only on this seam, never on Resend directly, so tests
// inject a fake that records the call and sends nothing.
//
// We POST Resend's HTTPS REST API with fetch rather than pulling in the `resend`
// npm package — one fewer dependency, and the payload is tiny. The API key is
// passed in (read from process.env at the server boundary), not read here.

export type ContactEmail = {
  from: string;
  to: string;
  replyTo: string; // set to the visitor's address so a reply reaches them
  subject: string;
  text: string;
  html: string; // themed terminal-aesthetic body; `text` is the fallback
};

export type TransportResult = { ok: true } | { ok: false; error: string };

export type ContactTransport = (email: ContactEmail) => Promise<TransportResult>;

const RESEND_ENDPOINT = "https://api.resend.com/emails";

// Builds the real Resend transport bound to an API key. Returns a transport that
// fails gracefully — never throws — so a missing key (local dev / an
// un-provisioned deploy) or a network/API error surfaces as a clear message
// instead of crashing the server action.
export function createResendTransport(apiKey: string): ContactTransport {
  return async (email) => {
    if (!apiKey) {
      // No key configured yet (local dev, or DNS/provisioning still pending —
      // that's slice 7). Fail clearly and point the visitor at the address.
      return {
        ok: false,
        error: "! email isn't wired up yet — reach me at contact@alexlapwood.com.",
      };
    }

    try {
      const res = await fetch(RESEND_ENDPOINT, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        // Resend's field name is snake_case `reply_to`; the rest map straight.
        body: JSON.stringify({
          from: email.from,
          to: email.to,
          reply_to: email.replyTo,
          subject: email.subject,
          text: email.text,
          html: email.html,
        }),
      });
      if (!res.ok) {
        return { ok: false, error: "! couldn't send just now — please try again." };
      }
      return { ok: true };
    } catch {
      return {
        ok: false,
        error: "! couldn't reach the mail service — please try again.",
      };
    }
  };
}
