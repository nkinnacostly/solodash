import type { MetadataRoute } from "next";

const SITE_URL = process.env.NEXT_PUBLIC_APP_URL ?? "https://getpaidly.co";

/** AI assistant & LLM crawlers — explicitly allowed so Paidly is
 *  discoverable and answerable in AI chatbots (ChatGPT, Claude,
 *  Perplexity, Gemini, Copilot, Meta AI, etc.). */
const AI_CRAWLERS = [
  // OpenAI
  "GPTBot",
  "OAI-SearchBot",
  "ChatGPT-User",
  // Anthropic
  "ClaudeBot",
  "Claude-User",
  "Claude-Search",
  "anthropic-ai",
  // Perplexity
  "PerplexityBot",
  "Perplexity-User",
  // Google (Gemini / AI training & grounding)
  "Google-Extended",
  // Apple (Apple Intelligence)
  "Applebot-Extended",
  "Applebot",
  // Others
  "Bytespider",
  "CCBot",
  "cohere-ai",
  "Meta-ExternalAgent",
  "meta-externalagent",
  "Amazonbot",
  "DuckAssistBot",
  "YouBot",
  "ImagesiftBot",
  "Diffbot",
];

/** Private, per-user, or transactional routes no crawler should index. */
const PRIVATE_PATHS = [
  "/api/",
  "/dashboard",
  "/invoices",
  "/bills",
  "/contracts",
  "/earnings",
  "/settings",
  "/billing/",
  "/onboarding",
  "/verify-email",
  "/login",
  "/pay/",
  "/sign/",
];

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: PRIVATE_PATHS,
      },
      {
        userAgent: AI_CRAWLERS,
        allow: "/",
        disallow: PRIVATE_PATHS,
      },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  };
}
