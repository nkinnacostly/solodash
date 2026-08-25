import type { Metadata } from "next";

/** Pay and sign pages are private, per-client documents (invoices and
 *  contracts) — they must never appear in search engines or AI indexes. */
export const metadata: Metadata = {
  title: { default: "Paidly", template: "%s | Paidly" },
  robots: { index: false, follow: false, nocache: true },
};

export default function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
