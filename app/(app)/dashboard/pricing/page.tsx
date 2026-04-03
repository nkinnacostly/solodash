"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Check, Loader2, Zap } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

export default function DashboardPricingPage() {
  const router = useRouter();
  const [isAnnual, setIsAnnual] = useState(false);
  const [loading, setLoading] = useState(false);
  const [profile, setProfile] = useState<any>(null);
  const [loadingProfile, setLoadingProfile] = useState(true);

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const response = await fetch("/api/settings/profile");
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to fetch profile");
      }

      setProfile(data);
    } catch (err: any) {
      console.error("Failed to fetch profile:", err);
    } finally {
      setLoadingProfile(false);
    }
  };

  const handleUpgrade = async () => {
    setLoading(true);

    try {
      const plan = isAnnual ? "annual" : "monthly";

      const response = await fetch("/api/billing/create-checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan }),
      });

      const data = await response.json();

      if (!response.ok || !data.payment_link) {
        throw new Error(data.error || "Failed to create checkout session");
      }

      // Redirect to Flutterwave checkout
      window.location.href = data.payment_link;
    } catch (err: any) {
      console.error("Upgrade error:", err);
      alert(err.message || "Failed to initiate upgrade. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (loadingProfile) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 size={32} className="text-[#10b981] animate-spin" />
      </div>
    );
  }

  const isPro = profile?.plan === "pro";

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white mb-2">Plans & Pricing</h1>
        <p className="text-[#a1a1aa]">Choose the plan that works for you</p>
      </div>

      {/* Current Plan Badge */}
      {profile && (
        <div
          className={`p-4 rounded-lg border ${
            isPro
              ? "bg-[#10b981]/10 border-[#10b981]/30"
              : "bg-[#27272a]/50 border-[#27272a]"
          }`}
        >
          <div className="flex items-center gap-2">
            {isPro ? (
              <>
                <Check size={20} className="text-[#10b981]" />
                <span className="text-sm text-white font-medium">
                  Your current plan:{" "}
                  <span className="text-[#10b981]">Pro ✓</span>
                </span>
              </>
            ) : (
              <>
                <span className="text-sm text-white font-medium">
                  Your current plan:{" "}
                  <span className="text-[#a1a1aa]">Free</span>
                </span>
              </>
            )}
          </div>
        </div>
      )}

      {/* Pro users message */}
      {isPro && (
        <div className="bg-[#10b981]/10 border border-[#10b981]/30 rounded-xl p-8 text-center">
          <Zap size={48} className="text-[#10b981] mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-white mb-2">
            You're already on Pro! 🎉
          </h2>
          <p className="text-[#a1a1aa] mb-6">
            Enjoy unlimited invoices, contracts, and 0% platform fees.
          </p>
          <Link
            href="/dashboard"
            className="inline-block px-6 py-3 bg-[#10b981] text-white font-medium rounded-lg hover:bg-[#059669] transition-colors"
          >
            Go to Dashboard →
          </Link>
        </div>
      )}

      {/* Pricing Cards (for free users) */}
      {!isPro && (
        <>
          {/* Toggle */}
          <div className="flex items-center justify-center gap-4">
            <span
              className={`text-sm ${
                !isAnnual ? "text-white font-medium" : "text-[#a1a1aa]"
              }`}
            >
              Monthly
            </span>
            <button
              onClick={() => setIsAnnual(!isAnnual)}
              className={`relative w-14 h-7 rounded-full transition-colors ${
                isAnnual ? "bg-[#10b981]" : "bg-[#27272a]"
              }`}
            >
              <div
                className={`absolute top-0.5 left-0.5 w-6 h-6 bg-white rounded-full transition-transform ${
                  isAnnual ? "translate-x-7" : "translate-x-0"
                }`}
              />
            </button>
            <span
              className={`text-sm ${
                isAnnual ? "text-white font-medium" : "text-[#a1a1aa]"
              }`}
            >
              Annual
              <span className="ml-2 text-xs text-[#10b981]">Save ₦50,000</span>
            </span>
          </div>

          {/* Pricing Card */}
          <div className="max-w-md mx-auto">
            <div className="bg-[#18181b] border-2 border-[#10b981] rounded-xl p-8 relative">
              {/* Popular Badge */}
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 bg-[#10b981] text-white text-xs font-medium rounded-full">
                Pro
              </div>

              <div className="mb-8">
                <span className="text-5xl font-bold text-white">
                  {isAnnual ? "₦130,000" : "₦15,000"}
                </span>
                <span className="text-[#a1a1aa]">/mo</span>
                {isAnnual && (
                  <>
                    <span className="text-[#a1a1aa]">/yr</span>
                    <p className="text-xs text-[#10b981] mt-1">Save ₦50,000</p>
                  </>
                )}
                <p className="text-xs text-[#a1a1aa] mt-1">
                  ~$9/mo at current exchange rate
                </p>
              </div>

              {/* Features */}
              <ul className="space-y-3 mb-8">
                {[
                  "Unlimited invoices",
                  "Unlimited contracts",
                  "0% platform fee — keep 100%",
                  "Custom branding",
                  "Priority support",
                  "Tax export (PDF + CSV)",
                ].map((feature) => (
                  <li
                    key={feature}
                    className="flex items-center gap-3 text-sm text-[#a1a1aa]"
                  >
                    <Check size={16} className="text-[#10b981] flex-shrink-0" />
                    {feature}
                  </li>
                ))}
              </ul>

              {/* CTA */}
              <button
                onClick={handleUpgrade}
                disabled={loading}
                className="w-full py-3 bg-[#10b981] text-white font-medium rounded-lg hover:bg-[#059669] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <Loader2 size={20} className="animate-spin" />
                    Creating checkout...
                  </>
                ) : (
                  "Upgrade to Pro"
                )}
              </button>

              <p className="text-xs text-[#a1a1aa] text-center mt-4">
                Free forever. No credit card required.
              </p>
            </div>
          </div>

          {/* Payment Methods */}
          <div className="text-center">
            <p className="text-sm text-[#a1a1aa] mb-2">
              Accepted payment methods:
            </p>
            <p className="text-xs text-[#52525b]">
              Card (Visa, Mastercard, Verve), Bank Transfer, USSD, Mobile Money
            </p>
          </div>
        </>
      )}
    </div>
  );
}
