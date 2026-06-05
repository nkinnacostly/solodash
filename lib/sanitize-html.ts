import sanitizeHtmlLib from "sanitize-html";

/**
 * Sanitize HTML content for safe rendering.
 * Strips scripts, event handlers, javascript: URLs, and other
 * dangerous content.
 *
 * Safe for both server (API routes, edge functions) and client
 * (React components).
 *
 * Uses sanitize-html which is pure JS — no jsdom dependency,
 * no ESM/CJS issues on Vercel.
 */
export function sanitizeContractHtml(html: string): string {
  if (!html) return "";

  return sanitizeHtmlLib(html, {
    allowedTags: [
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
      // Links
      "a",
    ],
    allowedAttributes: {
      a: ["href", "target", "rel"],
      "*": ["style", "class", "colspan", "rowspan"],
    },
    allowedSchemes: ["http", "https", "mailto", "tel"],
    allowedSchemesByTag: {
      a: ["http", "https", "mailto", "tel"],
    },
    disallowedTagsMode: "discard",
    nonTextTags: [
      "script",
      "style",
      "iframe",
      "object",
      "embed",
      "form",
      "input",
      "button",
      "noscript",
    ],
    transformTags: {
      "*": (tagName, attribs) => {
        const cleanAttribs: Record<string, string> = {};
        for (const [key, value] of Object.entries(attribs)) {
          if (!key.toLowerCase().startsWith("on")) {
            cleanAttribs[key] = value;
          }
        }
        return { tagName, attribs: cleanAttribs };
      },
    },
  });
}

/**
 * Escape HTML entities in a plain-text field.
 * Use this for user inputs (client name, project description)
 * before inserting into HTML templates.
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
