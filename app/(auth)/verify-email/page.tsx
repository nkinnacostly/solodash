"use client";

import { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Mail, Loader2, CheckCircle } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

function VerifyEmailContent() {
  const searchParams = useSearchParams();
  const email = searchParams.get("email") || "";

  const [loading, setLoading] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [message, setMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  // Countdown timer
  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);

  const handleResendEmail = async () => {
    if (!email || countdown > 0) return;

    setLoading(true);
    setMessage(null);

    try {
      const supabase = createClient();
      const { error } = await supabase.auth.resend({
        type: "signup",
        email: email,
      });

      if (error) throw error;

      setMessage({
        type: "success",
        text: "Confirmation email resent! Check your inbox.",
      });
      setCountdown(60);
    } catch (err: any) {
      setMessage({
        type: "error",
        text: err.message || "Failed to resend email. Please try again.",
      });
    } finally {
      setLoading(false);
    }
  };

  const openGmail = () => {
    window.open("https://mail.google.com", "_blank");
  };

  return (
    <div className="w-full max-w-md">
      {/* Logo */}
      <div className="text-center mb-8">
        <Link href="/" className="text-3xl font-bold text-[#10b981]">
          Paidly
        </Link>
      </div>

      {/* Card */}
      <div className="bg-[#18181b] border border-[#27272a] rounded-xl p-8">
        {/* Email Icon */}
        <div className="text-center mb-6">
          <div className="w-16 h-16 bg-[#10b981]/10 border border-[#10b981]/30 rounded-full flex items-center justify-center mx-auto mb-4">
            <Mail size={32} className="text-[#10b981]" />
          </div>

          <h1 className="text-2xl font-bold text-white mb-2">
            Check your inbox
          </h1>
          {email && (
            <p className="text-[#a1a1aa] text-sm mb-1">
              We sent a confirmation link to
            </p>
          )}
          {email && (
            <p className="text-white font-medium text-sm mb-2">{email}</p>
          )}
          {!email && (
            <p className="text-[#a1a1aa] mb-2">
              Click the link to verify your account and get started.
            </p>
          )}
          {email && (
            <p className="text-[#a1a1aa] text-sm">
              Click the link to verify your account and get started.
            </p>
          )}
        </div>

        {/* Action Buttons */}
        <div className="space-y-3 mb-6">
          {/* Open Gmail */}
          <button
            onClick={openGmail}
            className="w-full py-3 border border-[#27272a] text-white font-medium rounded-lg hover:border-[#10b981] hover:text-[#10b981] transition-colors flex items-center justify-center gap-2"
          >
            <Mail size={18} />
            Open Gmail
          </button>

          {/* Resend Email */}
          <button
            onClick={handleResendEmail}
            disabled={loading || countdown > 0}
            className="w-full py-3 border border-[#27272a] text-white font-medium rounded-lg hover:border-[#10b981] hover:text-[#10b981] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <Loader2 size={18} className="animate-spin" />
                Sending...
              </>
            ) : countdown > 0 ? (
              <>Resend in {countdown}s</>
            ) : (
              <>Resend confirmation email</>
            )}
          </button>
        </div>

        {/* Success/Error Message */}
        {message && (
          <div
            className={`p-3 rounded-lg mb-6 flex items-center gap-2 ${
              message.type === "success"
                ? "bg-[#10b981]/10 border border-[#10b981]/30 text-[#10b981]"
                : "bg-[#ef4444]/10 border border-[#ef4444]/30 text-[#ef4444]"
            }`}
          >
            {message.type === "success" && <CheckCircle size={16} />}
            <p className="text-sm">{message.text}</p>
          </div>
        )}

        {/* Divider */}
        <div className="relative mb-6">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-[#27272a]" />
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-4 bg-[#18181b] text-[#a1a1aa]">or</span>
          </div>
        </div>

        {/* Links */}
        <div className="space-y-3 mb-6">
          <p className="text-center text-sm text-[#a1a1aa]">
            Already verified?{" "}
            <Link
              href="/login"
              className="text-[#10b981] hover:underline font-medium"
            >
              Log in
            </Link>
          </p>
          <p className="text-center text-sm text-[#a1a1aa]">
            Wrong email?{" "}
            <Link
              href="/signup"
              className="text-[#10b981] hover:underline font-medium"
            >
              Sign up again
            </Link>
          </p>
        </div>

        {/* Spam Note */}
        <div className="p-3 bg-[#27272a]/50 rounded-lg">
          <p className="text-xs text-[#a1a1aa] text-center">
            Can't find the email? Check your spam folder.
          </p>
        </div>
      </div>
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense
      fallback={
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <div className="text-3xl font-bold text-[#10b981]">Paidly</div>
          </div>
          <div className="bg-[#18181b] border border-[#27272a] rounded-xl p-8 text-center">
            <Loader2
              size={32}
              className="text-[#10b981] animate-spin mx-auto mb-4"
            />
            <p className="text-white">Loading...</p>
          </div>
        </div>
      }
    >
      <VerifyEmailContent />
    </Suspense>
  );
}
