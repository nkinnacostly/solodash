import type { Metadata } from "next";
import LandingView from "./landing-view";

const SITE_URL = process.env.NEXT_PUBLIC_APP_URL ?? "https://getpaidly.co";

const TITLE =
  "Paidly — Invoices, Contracts & Earnings for African Freelancers";
const DESCRIPTION =
  "Stop chasing payments. Paidly gives African freelancers professional invoices with a Pay Now button, e-signature contracts, automatic earnings tracking, and one-click tax export. Free to start — built for Nigeria, Ghana, Kenya & South Africa.";

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: {
    canonical: "/",
  },
  openGraph: {
    title: TITLE,
    description: DESCRIPTION,
    url: "/",
    type: "website",
    siteName: "Paidly",
  },
  twitter: {
    card: "summary_large_image",
    title: TITLE,
    description: DESCRIPTION,
  },
};

/** Product structured data — helps search engines and AI assistants
 *  understand what Paidly is, what it costs, and what it can do. */
function SoftwareAppJsonLd() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    "@id": `${SITE_URL}/#app`,
    name: "Paidly",
    url: SITE_URL,
    applicationCategory: "BusinessApplication",
    applicationSubCategory: "Invoicing Software",
    operatingSystem: "Web",
    description: DESCRIPTION,
    inLanguage: "en",
    offers: [
      {
        "@type": "Offer",
        name: "Free",
        price: "0",
        priceCurrency: "USD",
        description:
          "3 invoices/month, 1 contract/month, earnings tracking, PDF exports.",
      },
      {
        "@type": "Offer",
        name: "Pro (monthly)",
        price: "15000",
        priceCurrency: "NGN",
        description:
          "Unlimited invoices and contracts, 0% platform fee, custom branding, tax export, priority support.",
      },
      {
        "@type": "Offer",
        name: "Pro (annual)",
        price: "130000",
        priceCurrency: "NGN",
        description: "Everything in Pro, billed yearly — save 30%.",
      },
    ],
    featureList: [
      "Professional invoices with a Pay Now button",
      "Digital contracts with e-signatures",
      "Automatic earnings tracking",
      "One-click tax export (PDF & CSV)",
      "Payments via Flutterwave & Paystack",
      "Multi-currency: USD, GBP, EUR, NGN, GHS, KES, ZAR",
      "Bills, vendors & expense tracking",
    ],
  };
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
    />
  );
}

export default function Home() {
  return (
    <>
      <LandingView />
      <SoftwareAppJsonLd />
    </>
  );
}
