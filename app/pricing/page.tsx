"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowUpRight, Check, Loader2, X } from "lucide-react";

function LogoMark({ className = "h-6 w-6" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden>
      <circle cx="8.5" cy="8.5" r="4.5" fill="#2563eb" />
      <circle cx="15.5" cy="8.5" r="4.5" fill="#2563eb" opacity="0.75" />
      <circle cx="8.5" cy="15.5" r="4.5" fill="#2563eb" opacity="0.75" />
      <circle cx="15.5" cy="15.5" r="4.5" fill="#2563eb" />
    </svg>
  );
}

function FeatureItem({ text, excluded = false }: { text: string; excluded?: boolean }) {
  return (
    <li className="flex items-start gap-3">
      {excluded ? (
        <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-lp-line text-lp-gray">
          <X size={11} strokeWidth={2.5} />
        </span>
      ) : (
        <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-lp-accent text-white">
          <Check size={11} strokeWidth={3} />
        </span>
      )}
      <span
        className={`text-sm leading-relaxed ${excluded ? "text-lp-gray/70" : "text-lp-ink"}`}
      >
        {text}
      </span>
    </li>
  );
}

const FAQS = [
  {
    q: "Can I cancel anytime?",
    a: "Yes, cancel anytime. Your account reverts to the free plan immediately. You won't lose any data.",
  },
  {
    q: "What payment methods do you accept?",
    a: "Card payments via Flutterwave in NGN. International cards accepted.",
  },
  {
    q: "Do you offer refunds?",
    a: "Yes, within 7 days of payment if you haven't used Pro features. Contact us at support@getpaidly.co",
  },
];

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
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to start upgrade";
      alert(message);
      setUpgrading(false);
    }
  };

  return (
    <div className="min-h-screen bg-lp-page font-sans text-lp-ink antialiased">
      {/* Navbar */}
      <header className="fixed inset-x-0 top-3 z-50 px-2 sm:top-4 sm:px-3">
        <div className="flex items-center justify-between rounded-2xl border border-white/10 bg-lp-ink/95 py-2.5 pl-4 pr-2.5 shadow-xl shadow-black/20 backdrop-blur-md sm:pl-6">
          <Link href="/" className="inline-flex items-center gap-2">
            <LogoMark />
            <span className="text-lg font-extrabold tracking-tight text-white">
              Paidly
            </span>
          </Link>
          <div className="flex items-center gap-2">
            <Link
              href="/login"
              className="rounded-full border border-white/20 px-4 py-2 text-[13px] font-medium text-white transition-colors duration-200 hover:bg-white/10"
            >
              Log in
            </Link>
            <Link
              href="/signup"
              className="rounded-full bg-white px-4 py-2 text-[13px] font-semibold text-lp-ink transition-transform duration-200 hover:scale-[1.03]"
            >
              Get Started
            </Link>
          </div>
        </div>
      </header>

      <div className="px-2 pb-3 pt-28 sm:px-3 sm:pt-36">
        {/* Header */}
        <div className="mx-auto max-w-3xl px-2 text-center">
          <h1 className="text-4xl font-extrabold leading-[1.08] tracking-tight text-lp-ink sm:text-6xl">
            Simple pricing.{" "}
            <span className="text-lp-accent">No surprises.</span>
          </h1>
          <p className="mx-auto mt-5 max-w-md text-[15px] leading-relaxed text-lp-gray">
            Start free. Upgrade when your business grows.
          </p>

          {/* Toggle */}
          <div className="mt-8 inline-flex items-center rounded-full bg-lp-ink p-1">
            <button
              type="button"
              onClick={() => setIsAnnual(false)}
              className={`rounded-full px-5 py-2 text-[13px] font-semibold transition-colors duration-200 ${
                !isAnnual
                  ? "bg-lp-accent text-white"
                  : "text-white/60 hover:text-white"
              }`}
            >
              Monthly
            </button>
            <button
              type="button"
              onClick={() => setIsAnnual(true)}
              className={`rounded-full px-5 py-2 text-[13px] font-semibold transition-colors duration-200 ${
                isAnnual
                  ? "bg-lp-accent text-white"
                  : "text-white/60 hover:text-white"
              }`}
            >
              Annual · save 30%
            </button>
          </div>
        </div>

        {/* Dark panel with plans */}
        <div className="mx-auto mt-12 max-w-[1100px] rounded-[28px] bg-lp-ink px-4 py-10 sm:px-8 sm:py-14 lg:px-12">
          <div className="mx-auto grid max-w-4xl gap-6 md:grid-cols-2">
            {/* Free Plan */}
            <div className="flex flex-col rounded-2xl bg-white p-7 sm:p-8">
              <h3 className="text-xl font-extrabold tracking-tight text-lp-ink">
                Free
              </h3>
              <p className="mt-1 text-[13px] text-lp-gray">
                For freelancers just getting started
              </p>
              <div className="mt-6">
                <span className="text-5xl font-extrabold tracking-tight text-lp-ink">
                  $0
                </span>
                <span className="text-lp-gray">/mo</span>
                <p className="mt-1 text-xs text-lp-gray">Free forever</p>
              </div>

              <ul className="mt-8 flex-1 space-y-4">
                <FeatureItem text="3 invoices per month" />
                <FeatureItem text="1 contract per month" />
                <FeatureItem text="Earnings tracking" />
                <FeatureItem text="Flutterwave payments (5% fee)" />
                <FeatureItem text="PDF exports" />
                <FeatureItem excluded text="Unlimited invoices" />
                <FeatureItem excluded text="Custom branding" />
                <FeatureItem excluded text="0% platform fee" />
                <FeatureItem excluded text="Priority support" />
              </ul>

              <Link
                href="/signup"
                className="mt-10 flex w-full items-center justify-center rounded-full border border-lp-ink/15 py-3 text-sm font-semibold text-lp-ink transition-colors duration-200 hover:bg-lp-ink hover:text-white"
              >
                Get started free
              </Link>
            </div>

            {/* Pro Plan */}
            <div className="relative flex flex-col rounded-2xl bg-white p-7 ring-2 ring-lp-accent sm:p-8">
              <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 rounded-full bg-lp-accent px-4 py-1.5 text-[11px] font-bold uppercase tracking-wider text-white shadow-lg shadow-lp-accent/40">
                Most popular
              </div>

              <h3 className="text-xl font-extrabold tracking-tight text-lp-ink">
                Pro
              </h3>
              <p className="mt-1 text-[13px] text-lp-gray">
                For serious freelancers
              </p>
              <div className="mt-6">
                <span className="text-5xl font-extrabold tracking-tight text-lp-ink">
                  {isAnnual ? "₦130,000" : "₦15,000"}
                </span>
                <span className="text-lp-gray">/mo</span>
                {isAnnual && (
                  <>
                    <span className="text-lp-gray">/yr</span>
                    <p className="mt-1 text-xs font-semibold text-lp-accent">
                      Save ₦50,000
                    </p>
                  </>
                )}
                <p className="mt-1 text-xs text-lp-gray">
                  ~$9/mo at current exchange rate
                </p>
              </div>

              <ul className="mt-8 flex-1 space-y-4">
                <FeatureItem text="Unlimited invoices" />
                <FeatureItem text="Unlimited contracts" />
                <FeatureItem text="Earnings tracking" />
                <FeatureItem text="Flutterwave payments (0% fee — you keep 100%)" />
                <FeatureItem text="PDF exports" />
                <FeatureItem text="Custom branding" />
                <FeatureItem text="Priority support" />
                <FeatureItem text="Tax export" />
              </ul>

              <button
                type="button"
                onClick={handleUpgrade}
                disabled={upgrading}
                className="mt-10 flex w-full items-center justify-center gap-2.5 rounded-full bg-lp-accent py-2 pl-6 pr-2 text-sm font-semibold text-white transition-colors duration-200 hover:bg-lp-accent-strong disabled:cursor-not-allowed disabled:opacity-60"
              >
                {upgrading ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    Upgrade to Pro
                    <span className="flex h-8 w-8 items-center justify-center rounded-full bg-white/20">
                      <ArrowUpRight size={14} strokeWidth={2.4} />
                    </span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* FAQ */}
          <div className="mx-auto mt-16 max-w-3xl">
            <h2 className="text-center text-2xl font-extrabold tracking-tight text-white sm:text-3xl">
              Frequently asked{" "}
              <span className="text-lp-accent">questions</span>
            </h2>

            <div className="mt-8 space-y-4">
              {FAQS.map((f) => (
                <div
                  key={f.q}
                  className="rounded-2xl bg-white/[0.05] p-6 ring-1 ring-white/10"
                >
                  <h3 className="text-base font-bold text-white">{f.q}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-lp-gray-dark">
                    {f.a}
                  </p>
                </div>
              ))}
            </div>
          </div>

          <p className="mt-14 text-center text-[11px] font-medium text-white/35">
            © 2026 Paidly
          </p>
        </div>
      </div>
    </div>
  );
}
