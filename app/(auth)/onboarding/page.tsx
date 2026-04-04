"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { useToast } from "@/components/ui/Toast";
import { Loader2, ChevronLeft, ChevronRight, Check } from "lucide-react";

const countries = [
  "Nigeria",
  "Ghana",
  "Kenya",
  "South Africa",
  "Afghanistan",
  "Albania",
  "Algeria",
  "Argentina",
  "Australia",
  "Austria",
  "Bangladesh",
  "Belgium",
  "Brazil",
  "Canada",
  "China",
  "Egypt",
  "Ethiopia",
  "France",
  "Germany",
  "India",
  "Indonesia",
  "Italy",
  "Japan",
  "Morocco",
  "Netherlands",
  "New Zealand",
  "Pakistan",
  "Philippines",
  "Poland",
  "Portugal",
  "Rwanda",
  "Saudi Arabia",
  "Senegal",
  "Singapore",
  "Spain",
  "Sweden",
  "Switzerland",
  "Tanzania",
  "Thailand",
  "Tunisia",
  "Turkey",
  "Uganda",
  "United Arab Emirates",
  "United Kingdom",
  "United States",
  "Vietnam",
  "Zimbabwe",
];

const currencies = [
  { code: "NGN", name: "NGN - Nigerian Naira" },
  { code: "USD", name: "USD - US Dollar" },
  { code: "GBP", name: "GBP - British Pound" },
  { code: "EUR", name: "EUR - Euro" },
  { code: "GHS", name: "GHS - Ghanaian Cedi" },
  { code: "KES", name: "KES - Kenyan Shilling" },
  { code: "ZAR", name: "ZAR - South African Rand" },
];

const paymentTerms = [
  { value: "0", label: "Due on receipt" },
  { value: "7", label: "Net 7" },
  { value: "14", label: "Net 14" },
  { value: "30", label: "Net 30" },
];

export default function OnboardingPage() {
  return (
    <Suspense
      fallback={
        <div className="w-full max-w-lg">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-[#10b981]">Paidly</h1>
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
      <OnboardingContent />
    </Suspense>
  );
}

function OnboardingContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [user, setUser] = useState<any>(null);

  // Form state
  const [formData, setFormData] = useState({
    name: "",
    businessName: "",
    country: "Nigeria",
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    currency: "NGN",
    defaultPaymentTerms: "30",
  });

  // Fetch user on mount
  useEffect(() => {
    const fetchUser = async () => {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        router.push("/login");
        return;
      }

      // Check if email is verified
      if (!user.email_confirmed_at) {
        router.push(
          `/verify-email?email=${encodeURIComponent(user.email || "")}`,
        );
        return;
      }

      setUser(user);

      // Pre-fill name from auth metadata
      if (user.user_metadata?.name) {
        setFormData((prev) => ({
          ...prev,
          name: user.user_metadata.name,
        }));
      }

      // Check if onboarding already completed
      const { data: profile } = await supabase
        .from("profiles")
        .select("onboarding_completed")
        .eq("id", user.id)
        .single();

      if (profile?.onboarding_completed) {
        router.push("/dashboard");
      }
    };

    fetchUser();
  }, [router]);

  // Show success toast if email was just verified
  useEffect(() => {
    const verified = searchParams.get("verified");
    if (verified === "true") {
      toast.success("Email verified! Let's set up your account 🎉");
    }
  }, [searchParams, toast]);

  const handleNext = () => {
    if (step < 3) {
      setStep(step + 1);
    }
  };

  const handleBack = () => {
    if (step > 1) {
      setStep(step - 1);
    }
  };

  const handleSubmit = async () => {
    setError(null);
    setLoading(true);

    try {
      const supabase = createClient();

      // UPSERT profile
      const { error } = await supabase.from("profiles").upsert(
        {
          id: user.id,
          name: formData.name,
          business_name: formData.businessName || null,
          country: formData.country,
          timezone: formData.timezone,
          currency: formData.currency,
          default_payment_terms: parseInt(formData.defaultPaymentTerms),
          onboarding_completed: true,
          updated_at: new Date().toISOString(),
        },
        {
          onConflict: "id",
        },
      );

      if (error) throw error;

      router.push("/dashboard");
      router.refresh();
    } catch (err: any) {
      setError(err.message || "Failed to save your profile. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const updateField = (field: string, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  return (
    <div className="w-full max-w-lg">
      {/* Logo */}
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-[#10b981]">Paidly</h1>
      </div>

      {/* Card */}
      <div className="bg-[#18181b] border border-[#27272a] rounded-xl p-8">
        {/* Progress Indicator */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            {[1, 2, 3].map((s) => (
              <div key={s} className="flex items-center flex-1 last:flex-none">
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center font-medium transition-colors ${
                    s === step
                      ? "bg-[#10b981] text-white"
                      : s < step
                        ? "bg-[#10b981]/20 text-[#10b981]"
                        : "bg-[#27272a] text-[#52525b]"
                  }`}
                >
                  {s < step ? <Check size={20} /> : s}
                </div>
                {s < 3 && (
                  <div
                    className={`flex-1 h-1 mx-2 rounded ${
                      s < step ? "bg-[#10b981]" : "bg-[#27272a]"
                    }`}
                  />
                )}
              </div>
            ))}
          </div>
          <p className="text-sm text-[#a1a1aa] text-center">Step {step} of 3</p>
        </div>

        {/* Step 1: Personal Info */}
        {step === 1 && (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold text-white mb-2">
                Tell us about yourself
              </h2>
              <p className="text-[#a1a1aa]">
                Let's start with some basic information
              </p>
            </div>

            {/* Full Name */}
            <div>
              <label className="block text-sm font-medium text-white mb-2">
                Full name
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => updateField("name", e.target.value)}
                placeholder="John Doe"
                className="w-full px-4 py-3 bg-[#0f0f0f] border border-[#27272a] rounded-lg text-white placeholder-[#52525b] focus:outline-none focus:border-[#10b981] focus:ring-1 focus:ring-[#10b981] transition-colors"
              />
            </div>

            {/* Business Name */}
            <div>
              <label className="block text-sm font-medium text-white mb-2">
                Business name <span className="text-[#52525b]">(optional)</span>
              </label>
              <input
                type="text"
                value={formData.businessName}
                onChange={(e) => updateField("businessName", e.target.value)}
                placeholder="Acme Design Studio"
                className="w-full px-4 py-3 bg-[#0f0f0f] border border-[#27272a] rounded-lg text-white placeholder-[#52525b] focus:outline-none focus:border-[#10b981] focus:ring-1 focus:ring-[#10b981] transition-colors"
              />
            </div>

            {/* Next Button */}
            <button
              onClick={handleNext}
              disabled={!formData.name.trim()}
              className="w-full py-3 bg-[#10b981] text-white font-medium rounded-lg hover:bg-[#059669] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              Next
              <ChevronRight size={20} />
            </button>
          </div>
        )}

        {/* Step 2: Location */}
        {step === 2 && (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold text-white mb-2">
                Where are you based?
              </h2>
              <p className="text-[#a1a1aa]">
                Help us customize your experience
              </p>
            </div>

            {/* Country */}
            <div>
              <label className="block text-sm font-medium text-white mb-2">
                Country
              </label>
              <select
                value={formData.country}
                onChange={(e) => updateField("country", e.target.value)}
                className="w-full px-4 py-3 bg-[#0f0f0f] border border-[#27272a] rounded-lg text-white focus:outline-none focus:border-[#10b981] focus:ring-1 focus:ring-[#10b981] transition-colors appearance-none cursor-pointer"
              >
                {countries.map((country) => (
                  <option key={country} value={country}>
                    {country}
                  </option>
                ))}
              </select>
            </div>

            {/* Timezone */}
            <div>
              <label className="block text-sm font-medium text-white mb-2">
                Timezone
              </label>
              <select
                value={formData.timezone}
                onChange={(e) => updateField("timezone", e.target.value)}
                className="w-full px-4 py-3 bg-[#0f0f0f] border border-[#27272a] rounded-lg text-white focus:outline-none focus:border-[#10b981] focus:ring-1 focus:ring-[#10b981] transition-colors appearance-none cursor-pointer"
              >
                {Intl.supportedValuesOf("timeZone").map((tz) => (
                  <option key={tz} value={tz}>
                    {tz.replace(/_/g, " ")}
                  </option>
                ))}
              </select>
            </div>

            {/* Navigation Buttons */}
            <div className="flex gap-3">
              <button
                onClick={handleBack}
                className="flex-1 py-3 border border-[#27272a] text-white font-medium rounded-lg hover:border-[#10b981] transition-colors flex items-center justify-center gap-2"
              >
                <ChevronLeft size={20} />
                Back
              </button>
              <button
                onClick={handleNext}
                className="flex-1 py-3 bg-[#10b981] text-white font-medium rounded-lg hover:bg-[#059669] transition-colors flex items-center justify-center gap-2"
              >
                Next
                <ChevronRight size={20} />
              </button>
            </div>
          </div>
        )}

        {/* Step 3: Defaults */}
        {step === 3 && (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold text-white mb-2">
                Set your defaults
              </h2>
              <p className="text-[#a1a1aa]">
                You can change these anytime in settings
              </p>
            </div>

            {/* Currency */}
            <div>
              <label className="block text-sm font-medium text-white mb-2">
                Default currency
              </label>
              <select
                value={formData.currency}
                onChange={(e) => updateField("currency", e.target.value)}
                className="w-full px-4 py-3 bg-[#0f0f0f] border border-[#27272a] rounded-lg text-white focus:outline-none focus:border-[#10b981] focus:ring-1 focus:ring-[#10b981] transition-colors appearance-none cursor-pointer"
              >
                {currencies.map((currency) => (
                  <option key={currency.code} value={currency.code}>
                    {currency.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Payment Terms */}
            <div>
              <label className="block text-sm font-medium text-white mb-2">
                Default payment terms
              </label>
              <select
                value={formData.defaultPaymentTerms}
                onChange={(e) =>
                  updateField("defaultPaymentTerms", e.target.value)
                }
                className="w-full px-4 py-3 bg-[#0f0f0f] border border-[#27272a] rounded-lg text-white focus:outline-none focus:border-[#10b981] focus:ring-1 focus:ring-[#10b981] transition-colors appearance-none cursor-pointer"
              >
                {paymentTerms.map((term) => (
                  <option key={term.value} value={term.value}>
                    {term.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Error Message */}
            {error && (
              <div className="p-3 bg-[#ef4444]/10 border border-[#ef4444]/30 rounded-lg">
                <p className="text-sm text-[#ef4444]">{error}</p>
              </div>
            )}

            {/* Navigation Buttons */}
            <div className="flex gap-3">
              <button
                onClick={handleBack}
                disabled={loading}
                className="flex-1 py-3 border border-[#27272a] text-white font-medium rounded-lg hover:border-[#10b981] transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              >
                <ChevronLeft size={20} />
                Back
              </button>
              <button
                onClick={handleSubmit}
                disabled={loading}
                className="flex-1 py-3 bg-[#10b981] text-white font-medium rounded-lg hover:bg-[#059669] transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <Loader2 size={20} className="animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    Finish setup
                    <ChevronRight size={20} />
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
