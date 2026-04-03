"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Loader2, CheckCircle, XCircle } from "lucide-react";

function BillingSuccessContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const txRef = searchParams.get("tx_ref");

  const [status, setStatus] = useState<"loading" | "success" | "error">(
    "loading",
  );
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!txRef) {
      setStatus("error");
      setErrorMessage("No payment reference found");
      return;
    }

    verifyPayment();
  }, [txRef]);

  const verifyPayment = async () => {
    try {
      const response = await fetch("/api/billing/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tx_ref: txRef }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || "Payment verification failed");
      }

      setStatus("success");
    } catch (err: any) {
      setStatus("error");
      setErrorMessage(err.message);
    }
  };

  if (status === "loading") {
    return (
      <div className="min-h-screen bg-[#0f0f0f] flex items-center justify-center p-4">
        <div className="text-center">
          <Loader2
            size={48}
            className="text-[#10b981] animate-spin mx-auto mb-4"
          />
          <p className="text-lg text-white">Verifying your payment...</p>
        </div>
      </div>
    );
  }

  if (status === "error") {
    return (
      <div className="min-h-screen bg-[#0f0f0f] flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-[#18181b] border border-[#27272a] rounded-xl p-8 text-center">
          <XCircle size={48} className="text-[#ef4444] mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-white mb-2">
            Payment verification failed
          </h1>
          <p className="text-[#a1a1aa] mb-6">{errorMessage}</p>
          <button
            onClick={verifyPayment}
            className="px-6 py-3 bg-[#10b981] text-white font-medium rounded-lg hover:bg-[#059669] transition-colors"
          >
            Retry Verification
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0f0f0f] flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-[#18181b] border border-[#27272a] rounded-xl p-8">
        {/* Success Icon */}
        <div className="text-center mb-6">
          <CheckCircle size={64} className="text-[#10b981] mx-auto mb-4" />
          <h1 className="text-3xl font-bold text-white mb-2">
            Welcome to Pro! 🎉
          </h1>
          <p className="text-[#a1a1aa]">Your account has been upgraded.</p>
        </div>

        {/* Features Unlocked */}
        <div className="bg-[#0f0f0f] border border-[#10b981]/30 rounded-lg p-4 mb-6">
          <h2 className="text-sm font-semibold text-white mb-3">
            Pro Features Unlocked:
          </h2>
          <ul className="space-y-2">
            <li className="flex items-center gap-2 text-sm text-[#a1a1aa]">
              <CheckCircle size={14} className="text-[#10b981]" />
              Unlimited invoices
            </li>
            <li className="flex items-center gap-2 text-sm text-[#a1a1aa]">
              <CheckCircle size={14} className="text-[#10b981]" />
              Unlimited contracts
            </li>
            <li className="flex items-center gap-2 text-sm text-[#a1a1aa]">
              <CheckCircle size={14} className="text-[#10b981]" />
              0% platform fee — keep 100%
            </li>
            <li className="flex items-center gap-2 text-sm text-[#a1a1aa]">
              <CheckCircle size={14} className="text-[#10b981]" />
              Custom branding
            </li>
            <li className="flex items-center gap-2 text-sm text-[#a1a1aa]">
              <CheckCircle size={14} className="text-[#10b981]" />
              Priority support
            </li>
            <li className="flex items-center gap-2 text-sm text-[#a1a1aa]">
              <CheckCircle size={14} className="text-[#10b981]" />
              Tax export
            </li>
          </ul>
        </div>

        {/* CTA */}
        <Link
          href="/dashboard"
          className="w-full py-3 bg-[#10b981] text-white font-medium rounded-lg hover:bg-[#059669] transition-colors flex items-center justify-center gap-2"
        >
          Go to Dashboard →
        </Link>
      </div>
    </div>
  );
}

export default function BillingSuccessPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#0f0f0f] flex items-center justify-center p-4">
          <div className="text-center">
            <Loader2
              size={48}
              className="text-[#10b981] animate-spin mx-auto mb-4"
            />
            <p className="text-lg text-white">Loading...</p>
          </div>
        </div>
      }
    >
      <BillingSuccessContent />
    </Suspense>
  );
}
