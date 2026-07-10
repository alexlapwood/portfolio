import { describe, expect, it } from "vitest";
import { escapeHtml, renderContactEmailHtml } from "~/lib/contactEmailHtml";

describe("escapeHtml", () => {
  it("escapes the five HTML-significant characters", () => {
    expect(escapeHtml("<")).toBe("&lt;");
    expect(escapeHtml(">")).toBe("&gt;");
    expect(escapeHtml("&")).toBe("&amp;");
    expect(escapeHtml('"')).toBe("&quot;");
    expect(escapeHtml("'")).toBe("&#39;");
  });

  it("escapes `&` first so nothing is double-escaped", () => {
    expect(escapeHtml("a & b < c")).toBe("a &amp; b &lt; c");
    expect(escapeHtml("<>&")).toBe("&lt;&gt;&amp;");
  });
});

describe("renderContactEmailHtml", () => {
  it("includes the provided name, email, and message text", () => {
    const html = renderContactEmailHtml({
      name: "Ada Lovelace",
      email: "ada@example.com",
      message: "Hello there.",
    });
    expect(html).toContain("Ada Lovelace");
    expect(html).toContain("ada@example.com");
    expect(html).toContain("Hello there.");
  });

  it("escapes a script payload so no raw <script> survives", () => {
    const html = renderContactEmailHtml({
      name: "Mallory",
      email: "mallory@example.com",
      message: "<script>alert(1)</script>",
    });
    expect(html).not.toContain("<script>");
    expect(html).toContain("&lt;script&gt;alert(1)&lt;/script&gt;");
  });

  it("escapes HTML-significant characters in the name", () => {
    const html = renderContactEmailHtml({
      name: "<b>Ada</b>",
      email: "ada@example.com",
      message: "hi",
    });
    expect(html).not.toContain("<b>Ada</b>");
    expect(html).toContain("&lt;b&gt;Ada&lt;/b&gt;");
  });

  it("turns newlines in the message into <br>", () => {
    const html = renderContactEmailHtml({
      name: "Ada",
      email: "ada@example.com",
      message: "line one\nline two",
    });
    expect(html).toContain("line one<br>line two");
  });

  it("normalises CRLF and CR to <br> too", () => {
    const html = renderContactEmailHtml({
      name: "Ada",
      email: "ada@example.com",
      message: "a\r\nb\rc",
    });
    expect(html).toContain("a<br>b<br>c");
  });

  it("returns a full standalone HTML document", () => {
    const html = renderContactEmailHtml({
      name: "Ada",
      email: "ada@example.com",
      message: "hi",
    });
    expect(html).toContain("<!DOCTYPE html>");
    expect(html).toContain("//contact");
    expect(html).toContain("sent from the contact form at alexlapwood.com");
  });
});
