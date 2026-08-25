<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# Paidly (repo: `solostack`)

**Read [CLAUDE.md](CLAUDE.md) first — it is the single source of truth for this repo** (product scope, stack rules, conventions, design system, security/performance guardrails). Everything below is a summary; CLAUDE.md wins on conflict.

## What this is

Paidly (`getpaidly.co`) — freelancer admin SaaS for African freelancers (NG, GH, KE, ZA). Core "get paid" side: invoicing, contracts (e-sign + PDF), earnings, tax export. Approved additive Phase 1 expansion ("pay others"): vendors, bills, expenses, role-flipped contracts — tracking only, no money movement. Do not build anything on the out-of-scope list in CLAUDE.md.

## Stack & commands

- Next.js 16 App Router + TypeScript strict (no `any`) · React 19 · Tailwind v4 (`@theme` tokens in `app/globals.css`, no `tailwind.config.ts`) · Supabase (`@supabase/ssr`) · Flutterwave/Paystack (never Stripe) · Resend + React Email · react-hook-form + zod · lucide-react only.
- **pnpm only** — never npm/yarn.
- `pnpm dev` · **`pnpm build` is mandatory after every feature; fix all errors before done.**

## Non-negotiables (see CLAUDE.md for full list)

- No `middleware.ts` — auth lives in [proxy.ts](proxy.ts); **never modify or recreate it**.
- Route params are Promises: `const { id } = await params`.
- Server components by default; `'use client'` only when needed.
- Data writes go through `/api` routes using the server Supabase client — client components never call `supabase.from(...)` to mutate.
- Auth check: `supabase.auth.getUser()`, never `getSession()`. RLS always; service-role only in webhooks/public endpoints with their own auth checks.
- Forms: react-hook-form + zod only. Always loading/error/empty states.
- Design system "Paidly Electric": ink surfaces (`#0a0a0b` bg, `#141419` cards), electric blue `#3b82f6` (white text on solid blue fills; `#2563eb` on white surfaces/marketing CTAs), teal `#57c9b0` = success/paid/signed, Plus Jakarta Sans via `next/font/local`.
- Security guardrails in CLAUDE.md are open audit findings — never regress them (profiles mass-assignment, pay/sign IDOR, payment/billing verify amount+idempotency rules, HTML sanitization via [lib/sanitize-html.ts](lib/sanitize-html.ts), log redaction, webhook/cron secrets).
