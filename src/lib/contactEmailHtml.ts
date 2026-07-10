// contactEmailHtml — renders the themed HTML body for the contact-notification
// email, matching the site's black-terminal aesthetic. Email clients are
// hostile to modern CSS, so this is deliberately old-school: table-based layout
// with inline styles only, no <style> blocks, no external fonts, and no
// border-radius beyond the three titlebar dots.
//
// SECURITY: every piece of visitor-supplied input (name, email, message) is run
// through escapeHtml before interpolation. The plain-text body in contact.ts is
// the fallback; this HTML is the richer view. Nothing user-controlled reaches
// the output unescaped.

// Escapes the five HTML-significant characters. `&` MUST be replaced first, or
// the ampersands introduced by the later replacements would be double-escaped.
export function escapeHtml(input: string): string {
  return input
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

// Font stack shared by every text cell — a monospace terminal voice.
const FONT = "ui-monospace,SFMono-Regular,Menlo,Consolas,monospace";

// The rainbow hairline colours, left→right, ending back on the opening red.
const RAINBOW = [
  "#ff004d",
  "#ff6a00",
  "#ffd500",
  "#00e08a",
  "#00b8ff",
  "#7a5cff",
  "#ff00c8",
  "#ff004d",
];

// A single round titlebar dot (the only border-radius in the whole document).
function dot(color: string, gap: boolean): string {
  const margin = gap ? ";margin-right:6px" : "";
  return `<span style="display:inline-block;width:9px;height:9px;border-radius:50%;background:${color}${margin}"></span>`;
}

// Turns the escaped message into HTML: newlines normalised to \n, then \n → <br>.
// The message is escaped by the caller BEFORE reaching here, so no raw markup
// can slip through the <br> substitution.
function messageToHtml(escapedMessage: string): string {
  return escapedMessage.replace(/\n/g, "<br>");
}

export function renderContactEmailHtml(value: {
  name: string;
  email: string;
  message: string;
}): string {
  const name = escapeHtml(value.name);
  const email = escapeHtml(value.email);
  // Normalise CRLF / CR to LF first, THEN escape, THEN turn newlines into <br>.
  const normalisedMessage = value.message.replace(/\r\n/g, "\n").replace(/\r/g, "\n");
  const message = messageToHtml(escapeHtml(normalisedMessage));

  const rainbowCells = RAINBOW.map(
    (color) =>
      `<td width="12.5%" height="3" style="width:12.5%;height:3px;line-height:0;font-size:0;background:${color}"></td>`,
  ).join("");

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>New message via alexlapwood.com</title>
</head>
<body style="margin:0;padding:0;background:#000;font-family:${FONT}">
<span style="display:none;max-height:0;overflow:hidden;opacity:0">New message from ${name}</span>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="width:100%;background:#000">
<tr>
<td align="center" style="padding:32px 16px">
<table role="presentation" width="560" cellpadding="0" cellspacing="0" border="0" style="width:100%;max-width:560px;background:#050505;border:1px solid #262626">
<tr>
<td style="padding:12px 16px;border-bottom:1px solid #1c1c1c;font-family:${FONT}">
${dot("#262626", true)}${dot("#2a2a2a", true)}${dot("#262626", false)}<span style="color:#5a5a5a;font-size:13px;margin-left:10px">//contact</span>
</td>
</tr>
<tr>
<td style="padding:0">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="width:100%;border-collapse:collapse">
<tr>
${rainbowCells}
</tr>
</table>
</td>
</tr>
<tr>
<td style="padding:24px 20px;color:#fff;font-size:14px;line-height:1.6;font-family:${FONT}">
<div style="color:#737373;font-size:12px;margin-bottom:20px">New message via alexlapwood.com</div>
<div><span style="color:#5a5a5a">&gt;</span> <span style="color:#737373">name</span></div>
<div style="color:#fff;margin:2px 0 16px">${name}</div>
<div><span style="color:#5a5a5a">&gt;</span> <span style="color:#737373">email</span></div>
<div style="color:#fff;margin:2px 0 18px">${email}</div>
<div style="color:#5a5a5a;margin-bottom:6px">// message</div>
<div style="padding:14px 16px;background:#060606;border:1px solid #262626;color:#e5e5e5;white-space:pre-wrap;word-break:break-word">${message}</div>
</td>
</tr>
<tr>
<td style="padding:14px 20px;border-top:1px solid #1c1c1c;font-size:11px;color:#5a5a5a;font-family:${FONT}">↗ sent from the contact form at alexlapwood.com</td>
</tr>
</table>
</td>
</tr>
</table>
</body>
</html>`;
}
