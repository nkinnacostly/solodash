import type { Metadata } from "next";

/** Billing flow pages are transactional — never index them. */
export const metadata: Metadata = {
  title: { default: "Billing", template: "%s | Paidly" },
  robots: { index: false, follow: false },
};

export default function BillingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
