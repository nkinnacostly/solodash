import DOMPurify from "isomorphic-dompurify";

/**
 * Sanitize HTML content for safe rendering.
 * Strips scripts, event handlers, javascript: URLs, and other
 * dangerous content.
 *
 * Use this on ANY user-supplied HTML before rendering with
 * dangerouslySetInnerHTML.
 */
export function sanitizeContractHtml(html: string): string {
  if (!html) return "";

  return DOMPurify.sanitize(html, {
    ALLOWED_TAGS: [
      // Block-level
      "p",
      "br",
      "div",
      "span",
      "h1",
      "h2",
      "h3",
      "h4",
      "h5",
      "h6",
      "hr",
      // Lists
      "ul",
      "ol",
      "li",
      // Text formatting
      "strong",
      "b",
      "em",
      "i",
      "u",
      "s",
      "sub",
      "sup",
      // Structure
      "blockquote",
      "pre",
      "code",
      // Tables
      "table",
      "thead",
      "tbody",
      "tr",
      "th",
      "td",
      // Links (sanitized via ALLOWED_URI_REGEXP)
      "a",
    ],
    ALLOWED_ATTR: [
      "href",
      "target",
      "rel",
      "style",
      "class",
      "colspan",
      "rowspan",
    ],
    ALLOWED_URI_REGEXP: /^(https?:|mailto:|tel:)/i,
    FORBID_TAGS: [
      "script",
      "style",
      "iframe",
      "object",
      "embed",
      "form",
      "input",
      "button",
    ],
    FORBID_ATTR: [
      "onerror",
      "onload",
      "onclick",
      "onmouseover",
      "onfocus",
      "onblur",
    ],
    ALLOW_DATA_ATTR: false,
  });
}

/**
 * Sanitize a plain-text field that will be inserted into HTML.
 * Escapes HTML entities so the field renders as literal text.
 * Use this for user inputs like client name, project description.
 */
export function escapeHtml(text: string): string {
  if (!text) return "";
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#x27;")
    .replace(/\//g, "&#x2F;");
}
