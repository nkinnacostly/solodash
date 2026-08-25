import type { Metadata } from "next";
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

export const metadata: Metadata = {
  title: "Paidly",
  description: "Admin tools for freelancers",
  icons: {
    icon: "/favicon.ico",
    apple: "/apple-touch-icon.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={jakarta.variable}>
      <body className="antialiased bg-[#0a0a0b] text-[#f4f4f5] min-h-screen">
        {children}
      </body>
    </html>
  );
}
