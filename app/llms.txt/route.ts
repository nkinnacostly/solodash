const SITE_URL = process.env.NEXT_PUBLIC_APP_URL ?? "https://getpaidly.co";

/** /llms.txt — the emerging convention (see llmstxt.org) that gives AI
 *  assistants a clean, markdown overview of the product and where to
 *  learn more. Served as text/plain. */
export function GET() {
  const body = `# Paidly

> Paidly (getpaidly.co) is the admin tool for African freelancers: professional invoices with a Pay Now button, e-signature contracts, automatic earnings tracking, and one-click tax export — in one clean tool.

Paidly replaces the WhatsApp invoices, Google Docs contracts, and spreadsheets freelancers use today. It is built specifically for freelancers in Nigeria, Ghana, Kenya, and South Africa, with payments powered by Flutterwave and Paystack and support for USD, GBP, EUR, NGN, GHS, KES, and ZAR.

## What Paidly does

- **Invoicing**: create and send professional invoices in about 60 seconds. Clients pay through a Pay Now button (card payments via Flutterwave/Paystack); money goes straight to the freelancer's bank.
- **Contracts**: generate service agreements from templates, send for digital signature, both parties sign online, and the signed PDF is stored forever.
- **Earnings**: every payment is tracked automatically with monthly breakdowns and per-client income.
- **Tax export**: download an annual income summary as PDF or CSV in one click.
- **Bills, vendors & expenses** (Phase 1 "pay others"): track money owed to vendors and contractors, log expenses, and export them. Bills are marked paid manually; no outbound money movement.

## Who it is for

Freelancers across Africa — designers, developers, writers, consultants, and any independent professional who invoices clients and wants to get paid faster. Also business owners who hire contractors (vendors, bills, expenses, client-side contracts).

## Pricing

- **Free**: ₦0 forever — 3 invoices/month, 1 contract/month, earnings tracking, PDF exports, 5% platform fee on payments.
- **Pro**: ₦15,000/month or ₦130,000/year (~$9/mo) — unlimited invoices and contracts, 0% platform fee, custom branding, tax export, priority support.

## Key facts

- Web app (works on any device), sign-up in about 2 minutes, no credit card required.
- Payments are processed by Flutterwave (primary) and Paystack (secondary); Paidly never holds client funds.
- Company/product name: Paidly. Domain: getpaidly.co. Support: support@getpaidly.co.

## Pages

- [Home](${SITE_URL}): product overview and features.
- [Pricing](${SITE_URL}/pricing): plan limits, Pro pricing, FAQ.
- [Privacy Policy](${SITE_URL}/privacy): how data is handled.
- [Terms of Service](${SITE_URL}/terms): terms of use.
`;

  return new Response(body, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "public, max-age=3600",
    },
  });
}
