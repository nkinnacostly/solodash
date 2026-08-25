import type { Metadata } from "next";
import "../globals.css";
import { ToastProvider } from "@/components/ui/Toast";

/** Auth screens are transactional, not content — keep them out of indexes. */
export const metadata: Metadata = {
  title: { default: "Log in", template: "%s | Paidly" },
  robots: { index: false, follow: false },
};

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-[#0a0a0b] flex items-center justify-center p-4">
      <ToastProvider>{children}</ToastProvider>
    </div>
  );
}
