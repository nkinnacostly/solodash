"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Check, X, ArrowRight, Loader2 } from "lucide-react";

export default function PricingPage() {
  const router = useRouter();
  const [isAnnual, setIsAnnual] = useState(false);
  const [upgrading, setUpgrading] = useState(false);

  const handleUpgrade = async () => {
    setUpgrading(true);

    try {
      // Check if user is logged in
      const response = await fetch("/api/billing/create-checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          billing_cycle: isAnnual ? "annual" : "monthly",
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        if (response.status === 401) {
          // Not logged in, redirect to signup
          router.push("/signup?redirect=/pricing");
          return;
        }
        throw new Error(data.error || "Failed to create checkout");
      }

      // Redirect to Flutterwave payment page
      window.location.href = data.payment_link;
    } catch (err: any) {
      alert(err.message || "Failed to start upgrade");
      setUpgrading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#14171d]">
      {/* Navbar */}
      <nav className="border-b border-[#2a303c] bg-[#14171d]">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link href="/" className="text-2xl font-bold text-[#6ea8ff]">
            Paidly
          </Link>
          <div className="flex items-center gap-4">
            <Link
              href="/login"
              className="text-sm text-[#8f9db1] hover:text-white transition-colors"
            >
              Log in
            </Link>
            <Link
              href="/signup"
              className="text-sm px-4 py-2 bg-[#6ea8ff] text-[#0e1116] font-medium rounded-lg hover:bg-[#5b93e6] transition-colors"
            >
              Start free
            </Link>
          </div>
        </div>
      </nav>

      <div className="max-w-5xl mx-auto px-6 py-20">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
            Simple pricing. No surprises.
          </h1>
          <p className="text-lg text-[#8f9db1]">
            Start free. Upgrade when your business grows.
          </p>
        </div>

        {/* Toggle */}
        <div className="flex items-center justify-center gap-4 mb-12">
          <span
            className={`text-sm font-medium ${
              !isAnnual ? "text-white" : "text-[#8f9db1]"
            }`}
          >
            Monthly
          </span>
          <button
            onClick={() => setIsAnnual(!isAnnual)}
            className={`relative w-14 h-7 rounded-full transition-colors ${
              isAnnual ? "bg-[#6ea8ff]" : "bg-[#2a303c]"
            }`}
          >
            <span
              className={`absolute top-0.5 left-0.5 w-6 h-6 bg-white rounded-full transition-transform ${
                isAnnual ? "translate-x-7" : "translate-x-0"
              }`}
            />
          </button>
          <span
            className={`text-sm font-medium ${
              isAnnual ? "text-white" : "text-[#8f9db1]"
            }`}
          >
            Annual <span className="text-[#6ea8ff]">(save 30%)</span>
          </span>
        </div>

        {/* Pricing Cards */}
        <div className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto mb-20">
          {/* Free Plan */}
          <div className="bg-[#1c202a] border border-[#2a303c] rounded-2xl p-8">
            <h3 className="text-xl font-semibold text-white mb-2">Free</h3>
            <p className="text-sm text-[#8f9db1] mb-6">
              For freelancers just getting started
            </p>
            <div className="mb-8">
              <span className="text-5xl font-bold text-white">$0</span>
              <span className="text-[#8f9db1]">/mo</span>
              <p className="text-xs text-[#8f9db1] mt-1">Free forever</p>
            </div>

            <ul className="space-y-4 mb-8">
              <li className="flex items-start gap-3">
                <Check
                  size={18}
                  className="text-[#6ea8ff] mt-0.5 flex-shrink-0"
                />
                <span className="text-sm text-white">3 invoices per month</span>
              </li>
              <li className="flex items-start gap-3">
                <Check
                  size={18}
                  className="text-[#6ea8ff] mt-0.5 flex-shrink-0"
                />
                <span className="text-sm text-white">1 contract per month</span>
              </li>
              <li className="flex items-start gap-3">
                <Check
                  size={18}
                  className="text-[#6ea8ff] mt-0.5 flex-shrink-0"
                />
                <span className="text-sm text-white">Earnings tracking</span>
              </li>
              <li className="flex items-start gap-3">
                <Check
                  size={18}
                  className="text-[#6ea8ff] mt-0.5 flex-shrink-0"
                />
                <span className="text-sm text-white">
                  Flutterwave payments (5% fee)
                </span>
              </li>
              <li className="flex items-start gap-3">
                <Check
                  size={18}
                  className="text-[#6ea8ff] mt-0.5 flex-shrink-0"
                />
                <span className="text-sm text-white">PDF exports</span>
              </li>
              <li className="flex items-start gap-3">
                <X size={18} className="text-[#8f9db1] mt-0.5 flex-shrink-0" />
                <span className="text-sm text-[#8f9db1]">
                  Unlimited invoices
                </span>
              </li>
              <li className="flex items-start gap-3">
                <X size={18} className="text-[#8f9db1] mt-0.5 flex-shrink-0" />
                <span className="text-sm text-[#8f9db1]">Custom branding</span>
              </li>
              <li className="flex items-start gap-3">
                <X size={18} className="text-[#8f9db1] mt-0.5 flex-shrink-0" />
                <span className="text-sm text-[#8f9db1]">0% platform fee</span>
              </li>
              <li className="flex items-start gap-3">
                <X size={18} className="text-[#8f9db1] mt-0.5 flex-shrink-0" />
                <span className="text-sm text-[#8f9db1]">Priority support</span>
              </li>
            </ul>

            <Link
              href="/signup"
              className="w-full py-3 border border-[#2a303c] text-white font-medium rounded-lg hover:border-[#6ea8ff] transition-colors flex items-center justify-center gap-2"
            >
              Get started free
            </Link>
          </div>

          {/* Pro Plan */}
          <div className="bg-[#1c202a] border-2 border-[#6ea8ff] rounded-2xl p-8 relative shadow-lg shadow-[#6ea8ff]/10">
            <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 bg-[#6ea8ff] text-[#0e1116] text-xs font-semibold rounded-full">
              Most popular
            </div>

            <h3 className="text-xl font-semibold text-white mb-2">Pro</h3>
            <p className="text-sm text-[#8f9db1] mb-6">
              For serious freelancers
            </p>
            <div className="mb-8">
              <span className="text-5xl font-bold text-white">
                {isAnnual ? "₦130,000" : "₦15,000"}
              </span>
              <span className="text-[#8f9db1]">/mo</span>
              {isAnnual && (
                <>
                  <span className="text-[#8f9db1]">/yr</span>
                  <p className="text-xs text-[#6ea8ff] mt-1">Save ₦50,000</p>
                </>
              )}
              <p className="text-xs text-[#8f9db1] mt-1">
                ~$9/mo at current exchange rate
              </p>
            </div>

            <ul className="space-y-4 mb-8">
              <li className="flex items-start gap-3">
                <Check
                  size={18}
                  className="text-[#6ea8ff] mt-0.5 flex-shrink-0"
                />
                <span className="text-sm text-white">Unlimited invoices</span>
              </li>
              <li className="flex items-start gap-3">
                <Check
                  size={18}
                  className="text-[#6ea8ff] mt-0.5 flex-shrink-0"
                />
                <span className="text-sm text-white">Unlimited contracts</span>
              </li>
              <li className="flex items-start gap-3">
                <Check
                  size={18}
                  className="text-[#6ea8ff] mt-0.5 flex-shrink-0"
                />
                <span className="text-sm text-white">Earnings tracking</span>
              </li>
              <li className="flex items-start gap-3">
                <Check
                  size={18}
                  className="text-[#6ea8ff] mt-0.5 flex-shrink-0"
                />
                <span className="text-sm text-white">
                  Flutterwave payments (0% fee — you keep 100%)
                </span>
              </li>
              <li className="flex items-start gap-3">
                <Check
                  size={18}
                  className="text-[#6ea8ff] mt-0.5 flex-shrink-0"
                />
                <span className="text-sm text-white">PDF exports</span>
              </li>
              <li className="flex items-start gap-3">
                <Check
                  size={18}
                  className="text-[#6ea8ff] mt-0.5 flex-shrink-0"
                />
                <span className="text-sm text-white">Custom branding</span>
              </li>
              <li className="flex items-start gap-3">
                <Check
                  size={18}
                  className="text-[#6ea8ff] mt-0.5 flex-shrink-0"
                />
                <span className="text-sm text-white">Priority support</span>
              </li>
              <li className="flex items-start gap-3">
                <Check
                  size={18}
                  className="text-[#6ea8ff] mt-0.5 flex-shrink-0"
                />
                <span className="text-sm text-white">Tax export</span>
              </li>
            </ul>

            <button
              onClick={handleUpgrade}
              disabled={upgrading}
              className="w-full py-3 bg-[#6ea8ff] text-[#0e1116] font-medium rounded-lg hover:bg-[#5b93e6] transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {upgrading ? (
                <>
                  <Loader2 size={18} className="animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  Upgrade to Pro <ArrowRight size={18} />
                </>
              )}
            </button>
          </div>
        </div>

        {/* FAQ */}
        <div className="max-w-3xl mx-auto">
          <h2 className="text-2xl font-bold text-white text-center mb-8">
            Frequently asked questions
          </h2>

          <div className="space-y-4">
            <div className="bg-[#1c202a] border border-[#2a303c] rounded-xl p-6">
              <h3 className="text-lg font-semibold text-white mb-2">
                Can I cancel anytime?
              </h3>
              <p className="text-sm text-[#8f9db1]">
                Yes, cancel anytime. Your account reverts to the free plan
                immediately. You won't lose any data.
              </p>
            </div>

            <div className="bg-[#1c202a] border border-[#2a303c] rounded-xl p-6">
              <h3 className="text-lg font-semibold text-white mb-2">
                What payment methods do you accept?
              </h3>
              <p className="text-sm text-[#8f9db1]">
                Card payments via Flutterwave in NGN. International cards
                accepted.
              </p>
            </div>

            <div className="bg-[#1c202a] border border-[#2a303c] rounded-xl p-6">
              <h3 className="text-lg font-semibold text-white mb-2">
                Do you offer refunds?
              </h3>
              <p className="text-sm text-[#8f9db1]">
                Yes, within 7 days of payment if you haven't used Pro features.
                Contact us at support@getpaidly.co
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
