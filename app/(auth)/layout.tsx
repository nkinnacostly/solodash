import "../globals.css";
import { ToastProvider } from "@/components/ui/Toast";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-[#0f0f0f] flex items-center justify-center p-4">
      <ToastProvider>{children}</ToastProvider>
    </div>
  );
}
