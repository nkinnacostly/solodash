import type { Metadata } from "next";
import PricingView from "./pricing-view";
import { FAQS } from "@/lib/faqs";

const SITE_URL = process.env.NEXT_PUBLIC_APP_URL ?? "https://getpaidly.co";

const TITLE = "Pricing — Free Forever, Pro from ₦15,000/mo";
const DESCRIPTION =
  "Start free with 3 invoices and 1 contract every month. Upgrade to Paidly Pro for unlimited invoices and contracts, 0% platform fee, custom branding, and one-click tax export. Cancel anytime.";

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: {
    canonical: "/pricing",
  },
  openGraph: {
    title: `${TITLE} | Paidly`,
    description: DESCRIPTION,
    url: "/pricing",
    type: "website",
    siteName: "Paidly",
  },
  twitter: {
    card: "summary_large_image",
    title: `${TITLE} | Paidly`,
    description: DESCRIPTION,
  },
};

/** FAQPage structured data — makes the pricing FAQs eligible for rich
 *  results and directly answerable by AI chatbots. */
function FaqJsonLd() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: FAQS.map((f) => ({
      "@type": "Question",
      name: f.q,
      acceptedAnswer: { "@type": "Answer", text: f.a },
    })),
  };
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
    />
  );
}

export default function PricingPage() {
  return (
    <>
      <PricingView />
      <FaqJsonLd />
    </>
  );
}
