import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import "./globals.css";

// Self-hosted (no Google CDN) — Plus Jakarta Sans, the rebrand typeface.
const jakarta = localFont({
  src: [
    { path: "./fonts/pjs-400.woff2", weight: "400", style: "normal" },
    { path: "./fonts/pjs-500.woff2", weight: "500", style: "normal" },
    { path: "./fonts/pjs-600.woff2", weight: "600", style: "normal" },
    { path: "./fonts/pjs-700.woff2", weight: "700", style: "normal" },
  ],
  variable: "--font-jakarta",
  display: "swap",
});

const SITE_URL =
  process.env.NEXT_PUBLIC_APP_URL ?? "https://getpaidly.co";

const SITE_TITLE =
  "Paidly — Invoices, Contracts & Earnings for African Freelancers";
const SITE_DESCRIPTION =
  "Paidly is the admin tool built for African freelancers. Send professional invoices with a Pay Now button, get contracts signed with e-signatures, track earnings automatically, and export taxes in one click. Built for Nigeria, Ghana, Kenya & South Africa.";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: SITE_TITLE,
    template: "%s | Paidly",
  },
  description: SITE_DESCRIPTION,
  applicationName: "Paidly",
  keywords: [
    "invoicing for freelancers",
    "invoice app Africa",
    "freelancer invoice software Nigeria",
    "get paid faster freelance",
    "e-signature contracts freelancers",
    "freelance earnings tracker",
    "freelance tax export",
    "Flutterwave invoicing",
    "invoice NGN GHS KES ZAR",
    "contracts for designers developers writers",
    "Paidly",
    "getpaidly.co",
  ],
  authors: [{ name: "Paidly", url: SITE_URL }],
  creator: "Paidly",
  publisher: "Paidly",
  formatDetection: {
    telephone: false,
    email: false,
    address: false,
  },
  alternates: {
    canonical: "/",
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: SITE_URL,
    siteName: "Paidly",
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,
  },
  twitter: {
    card: "summary_large_image",
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1,
    },
  },
  category: "finance",
};

export const viewport: Viewport = {
  themeColor: "#0a0a0b",
  width: "device-width",
  initialScale: 1,
};

/** Site-wide structured data: who we are + what the site is. */
function OrganizationJsonLd() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Organization",
        "@id": `${SITE_URL}/#organization`,
        name: "Paidly",
        url: SITE_URL,
        logo: `${SITE_URL}/android-chrome-512x512.png`,
        description: SITE_DESCRIPTION,
      },
      {
        "@type": "WebSite",
        "@id": `${SITE_URL}/#website`,
        url: SITE_URL,
        name: "Paidly",
        description: SITE_DESCRIPTION,
        publisher: { "@id": `${SITE_URL}/#organization` },
        inLanguage: "en",
      },
    ],
  };
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
    />
  );
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={jakarta.variable}>
      <body className="antialiased bg-[#0a0a0b] text-[#f4f4f5] min-h-screen">
        {children}
        <OrganizationJsonLd />
      </body>
    </html>
  );
}
