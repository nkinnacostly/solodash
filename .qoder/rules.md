# SoloDash — Qodo AI Rules

## Project Identity

- App name: SoloDash (domain: solodash.co)
- Product: Freelancer admin SaaS — invoicing, contracts, earnings, tax export
- Target market: African freelancers (Nigeria, Ghana, Kenya, South Africa)
- Package manager: ALWAYS use pnpm. Never suggest npm or yarn.

## Tech Stack (strict — do not deviate)

- Framework: Next.js 16 (App Router, TypeScript)
- Styling: Tailwind CSS v4
- Database + Auth: Supabase
- Payments: Flutterwave (primary), Paystack (secondary)
- Email: Resend + React Email
- PDF: @react-pdf/renderer
- Charts: Recharts
- Forms: react-hook-form + zod + @hookform/resolvers
- Icons: lucide-react
- Deployment: Vercel

## Design System (never deviate)

- Background: #0f0f0f
- Sidebar: #111111
- Card: #18181b
- Border: #27272a
- Brand/accent: #10b981 (emerald green)
- Secondary text: #a1a1aa
- Error: #ef4444
- Success: #10b981
- Warning: #fbbf24
- Font: system font stack — never import Google Fonts
- Border radius: rounded-xl for cards, rounded-lg for buttons/inputs
- Logo: "SoloDash" wordmark in #10b981, bold, no image logo yet

## Tailwind v4 Rules

- NEVER use @tailwind base/components/utilities directives
- ALWAYS use @import "tailwindcss" in globals.css
- Custom theme values go inside @theme {} block in globals.css
- No tailwind.config.ts — Tailwind v4 does not use it

## Next.js 16 Rules

- NEVER create middleware.ts — it is deprecated in Next.js 16
- Route protection is handled by proxy.ts at the project root
- NEVER modify or recreate proxy.ts
- Use App Router only — no pages/ directory
- File conventions: page.tsx, layout.tsx, loading.tsx, error.tsx
- Server components by default — only use 'use client' when
  interactivity is required

## Folder Structure

- app/(auth)/ — login, signup, onboarding (no sidebar)
- app/(app)/ — all authenticated pages (with sidebar)
- app/(public)/ — pay/[id], sign/[id] (no auth required)
- app/api/ — all API routes
- components/ui/ — base reusable components
- components/ — feature components
- lib/supabase/client.ts — browser Supabase client
- lib/supabase/server.ts — server Supabase client
- lib/ — stripe, paystack, flutterwave, email, pdf utilities
- emails/ — React Email templates
- types/ — TypeScript types

## Supabase Rules

- ALWAYS use lib/supabase/server.ts for server components and API routes
- ALWAYS use lib/supabase/client.ts for client components
- NEVER expose SUPABASE_SERVICE_ROLE_KEY to the client
- ALWAYS use RLS — never bypass it with service role key
  except in webhook handlers
- Auth: get current user with supabase.auth.getUser()
  never supabase.auth.getSession() (insecure)

## Database Tables

- profiles, clients, invoices, invoice_items,
  contracts, income_log, payments
- All PKs are UUIDs
- All tables have created_at, updated_at
- user_id always references profiles(id)

## Payment Rules

- Primary gateway: Flutterwave
- Secondary gateway: Paystack
- NEVER reference Stripe — it is not in this project
- Flutterwave env vars: FLW_PUBLIC_KEY, FLW_SECRET_KEY,
  FLW_WEBHOOK_SECRET
- Paystack env vars: PAYSTACK_SECRET_KEY,
  NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY

## Environment Variables

- NEXT_PUBLIC_SUPABASE_URL
- NEXT_PUBLIC_SUPABASE_ANON_KEY
- SUPABASE_SERVICE_ROLE_KEY (server only, never client)
- FLW_PUBLIC_KEY
- FLW_SECRET_KEY
- FLW_WEBHOOK_SECRET
- PAYSTACK_SECRET_KEY
- NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY
- RESEND_API_KEY
- RESEND_FROM_EMAIL
- NEXT_PUBLIC_APP_URL
- CRON_SECRET

## Component Rules

- ALWAYS use lucide-react for icons
- NEVER use any other icon library
- Forms: ALWAYS use react-hook-form + zod
- NEVER use uncontrolled forms or raw HTML form submission
- Loading states: ALWAYS show on async actions
- Error states: ALWAYS show inline, never just console.log
- Empty states: ALWAYS design them — never leave blank screens

## Code Style

- TypeScript strict mode — no any types
- ALWAYS type Supabase responses explicitly
- Async/await — never .then() chains
- Server components fetch data directly — no useEffect for
  initial data
- Client components use SWR or React state for dynamic data
- NEVER use var — use const and let only

## Features (MVP scope — do not add extras)

1. Invoicing — create, send, track, collect payment
2. Contracts — generate from template, e-sign, store PDF
3. Earnings — track income, manual entry
4. Tax export — PDF + CSV annual summary

## Out of Scope (do not build or suggest)

- Time tracking
- Project management
- Client portal
- Expense scanning
- Proposals
- Team accounts
- Mobile app
- Slack/Notion integrations

## Pricing Plans

- Free: 3 invoices/month, 1 contract/month
- Pro: $9/month or $79/year — unlimited everything
- ALWAYS enforce plan limits before creating invoices/contracts
- Show UpgradeModal when limit is hit

## Status Values

- Invoice: draft, sent, viewed, paid, overdue, cancelled
- Contract: draft, sent, signed, active, completed
- Payment: pending, success, failed

## Currency Support

- USD, GBP, EUR, NGN, GHS, KES, ZAR
- Default: USD
- Show correct currency symbol always
- African currencies (NGN, GHS, KES, ZAR) should offer
  Flutterwave/Paystack as payment options

## Data Fetching Rules (CRITICAL)

- NEVER write directly to Supabase from client components using
  the browser client (createClient from lib/supabase/client.ts)
- Browser client does NOT attach user_id automatically —
  inserts will fail with null user_id or RLS violations
- ALL database writes (INSERT, UPDATE, DELETE) must go through
  Next.js API routes in app/api/
- API routes use the server client (createClient from lib/supabase/server.ts)
  which correctly reads the auth session from cookies
- Client components fetch data by calling fetch('/api/...')
  NOT by calling supabase.from(...) directly
- ONLY exception: reading public data that doesn't require auth context
- Pattern for all form submissions:
  Client component → fetch('/api/route') → API route →
  server Supabase client → database

## Supabase Join Rules (CRITICAL)

- NEVER join invoices to profiles using nested select
- The profiles table has no direct foreign key that Supabase
  can auto-resolve from invoices
- ALWAYS fetch profile separately using:
  const { data: profile } = await supabase
  .from("profiles")
  .select("name, business_name, email, phone, address")
  .eq("id", user.id)
  .single()
- Then merge into response: { ...invoice, profiles: profile }
- Safe joins from invoices: clients, invoice_items
- Safe joins from contracts: clients
- Safe joins from income_log: clients
