"use client";

import { useState, useEffect, useRef } from "react";
import {
  FileText,
  FileSignature,
  TrendingUp,
  Download,
  Menu,
  X,
  ArrowRight,
  Check,
  Star,
} from "lucide-react";

// Custom hook for Intersection Observer animations
function useReveal() {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          element.classList.add("reveal-active");
          observer.unobserve(element);
        }
      },
      { threshold: 0.1, rootMargin: "0px 0px -50px 0px" },
    );

    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  return ref;
}

// Reveal component wrapper
function Reveal({
  children,
  className = "",
  delay = 0,
}: {
  children: React.ReactNode;
  className?: string;
  delay?: number;
}) {
  const ref = useReveal();

  return (
    <div
      ref={ref}
      className={`reveal ${className}`.trim()}
      style={{ transitionDelay: `${delay}ms` }}
    >
      {children}
    </div>
  );
}

// Slide from left
function RevealLeft({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          element.classList.add("reveal-left-active");
          observer.unobserve(element);
        }
      },
      { threshold: 0.1, rootMargin: "0px 0px -50px 0px" },
    );

    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  return (
    <div ref={ref} className={`reveal-left ${className}`.trim()}>
      {children}
    </div>
  );
}

// Slide from right
function RevealRight({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          element.classList.add("reveal-right-active");
          observer.unobserve(element);
        }
      },
      { threshold: 0.1, rootMargin: "0px 0px -50px 0px" },
    );

    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  return (
    <div ref={ref} className={`reveal-right ${className}`.trim()}>
      {children}
    </div>
  );
}

export default function Home() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [annualBilling, setAnnualBilling] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  // Navbar scroll effect
  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 50);
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <div className="min-h-screen bg-[#0f0f0f] text-white antialiased">
      {/* NAVBAR */}
      <nav
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          scrolled
            ? "bg-[#0f0f0f]/90 backdrop-blur-md border-b border-[#27272a]"
            : "bg-[#0f0f0f]/80 backdrop-blur-sm border-b border-transparent"
        }`}
      >
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <a href="/" className="text-xl font-bold text-[#10b981]">
            SoloDash
          </a>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center gap-4">
            <a
              href="/login"
              className="px-4 py-2 text-sm text-white hover:text-[#10b981] transition-colors"
            >
              Log in
            </a>
            <a
              href="/signup"
              className="px-4 py-2 text-sm bg-[#10b981] text-white font-medium rounded-lg hover:bg-[#059669] transition-colors"
            >
              Start free
            </a>
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 text-white"
          >
            {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden bg-[#0f0f0f] border-b border-[#27272a] px-4 pb-4">
            <a
              href="/login"
              className="block py-3 text-white hover:text-[#10b981] transition-colors"
              onClick={() => setMobileMenuOpen(false)}
            >
              Log in
            </a>
            <a
              href="/signup"
              className="block py-3 px-4 bg-[#10b981] text-white text-center font-medium rounded-lg hover:bg-[#059669] transition-colors"
              onClick={() => setMobileMenuOpen(false)}
            >
              Start free
            </a>
          </div>
        )}
      </nav>

      {/* HERO */}
      <section className="relative pt-32 pb-20 px-4 sm:px-6 overflow-hidden">
        {/* Background Pattern */}
        <div className="absolute inset-0 overflow-hidden">
          <div
            className="absolute inset-0 opacity-[0.03]"
            style={{
              backgroundImage: `
                linear-gradient(#10b981 1px, transparent 1px),
                linear-gradient(90deg, #10b981 1px, transparent 1px)
              `,
              backgroundSize: "60px 60px",
            }}
          />
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[500px] bg-[#10b981]/10 rounded-full blur-[120px]" />
        </div>

        <div className="relative max-w-4xl mx-auto text-center">
          <h1 className="hero-headline text-4xl sm:text-5xl md:text-6xl font-bold leading-tight tracking-tight mb-6">
            Get paid. Stay organised.
            <br />
            <span className="text-[#10b981]">Keep building.</span>
          </h1>
          <p className="hero-subheadline text-lg sm:text-xl text-[#a1a1aa] max-w-2xl mx-auto mb-8">
            SoloDash handles your invoices, contracts, and taxes — so you can
            focus on the work that actually pays.
          </p>
          <div className="hero-ctas flex flex-col sm:flex-row items-center justify-center gap-4 mb-6">
            <a
              href="/signup"
              className="btn-glow btn-hover w-full sm:w-auto px-6 py-3 bg-[#10b981] text-white font-medium rounded-lg hover:bg-[#059669] transition-all flex items-center justify-center gap-2 group"
            >
              Start for free
              <ArrowRight
                size={18}
                className="group-hover:translate-x-1 transition-transform"
              />
            </a>
            <a
              href="#features"
              className="btn-hover w-full sm:w-auto px-6 py-3 border border-[#27272a] text-white font-medium rounded-lg hover:border-[#10b981] transition-all text-center"
            >
              See how it works
            </a>
          </div>
          <p className="hero-trust text-sm text-[#a1a1aa]">
            Free plan available · No credit card required · Built for African
            freelancers
          </p>
        </div>
      </section>

      {/* SOCIAL PROOF BAR */}
      <div className="border-y border-[#27272a] py-6 px-4">
        <p className="text-center text-sm text-[#a1a1aa]">
          Trusted by freelancers in <span className="text-white">Nigeria</span>{" "}
          · <span className="text-white">Ghana</span> ·{" "}
          <span className="text-white">Kenya</span> ·{" "}
          <span className="text-white">South Africa</span> · and beyond
        </p>
      </div>

      {/* PROBLEM SECTION */}
      <section className="py-20 px-4 sm:px-6">
        <div className="max-w-6xl mx-auto">
          <Reveal>
            <h2 className="text-3xl sm:text-4xl font-bold text-center mb-12">
              Your work is great.{" "}
              <span className="text-[#a1a1aa]">Your admin is a mess.</span>
            </h2>
          </Reveal>

          <div className="grid md:grid-cols-2 gap-6">
            {/* Before */}
            <RevealLeft>
              <div className="problem-before bg-[#18181b] border border-[#27272a] rounded-xl p-6 transition-colors">
                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2 text-red-500">
                  <X size={20} />
                  Before SoloDash
                </h3>
                <ul className="space-y-3 text-[#a1a1aa]">
                  <li className="flex items-start gap-3">
                    <span className="text-red-500 mt-1">•</span>
                    Google Docs invoices that look unprofessional
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="text-red-500 mt-1">•</span>
                    Random contract templates from 2019
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="text-red-500 mt-1">•</span>
                    Tax panic every April
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="text-red-500 mt-1">•</span>
                    Chasing payments on WhatsApp
                  </li>
                </ul>
              </div>
            </RevealLeft>

            {/* After */}
            <RevealRight>
              <div className="problem-after bg-[#18181b] border border-[#10b981]/30 rounded-xl p-6 transition-colors">
                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2 text-[#10b981]">
                  <Check size={20} />
                  With SoloDash
                </h3>
                <ul className="space-y-3 text-white">
                  <li className="flex items-start gap-3">
                    <Check
                      size={18}
                      className="text-[#10b981] mt-0.5 shrink-0"
                    />
                    Professional invoices in 60 seconds
                  </li>
                  <li className="flex items-start gap-3">
                    <Check
                      size={18}
                      className="text-[#10b981] mt-0.5 shrink-0"
                    />
                    Contracts ready in 2 minutes
                  </li>
                  <li className="flex items-start gap-3">
                    <Check
                      size={18}
                      className="text-[#10b981] mt-0.5 shrink-0"
                    />
                    One-click tax export
                  </li>
                  <li className="flex items-start gap-3">
                    <Check
                      size={18}
                      className="text-[#10b981] mt-0.5 shrink-0"
                    />
                    Clients pay online instantly
                  </li>
                </ul>
              </div>
            </RevealRight>
          </div>
        </div>
      </section>

      {/* FEATURES */}
      <section id="features" className="py-20 px-4 sm:px-6 bg-[#18181b]/50">
        <div className="max-w-6xl mx-auto">
          <Reveal>
            <h2 className="text-3xl sm:text-4xl font-bold text-center mb-4">
              Everything a freelancer needs.
              <br />
              <span className="text-[#a1a1aa]">Nothing they don't.</span>
            </h2>
          </Reveal>
          <Reveal delay={100}>
            <p className="text-center text-[#a1a1aa] mb-12 max-w-2xl mx-auto">
              Four tools. One dashboard. Zero headaches.
            </p>
          </Reveal>

          <div className="grid md:grid-cols-2 gap-6">
            {/* Invoices */}
            <Reveal delay={0}>
              <div className="feature-card group bg-[#18181b] border border-[#27272a] rounded-xl p-6">
                <div className="w-12 h-12 bg-[#10b981]/10 rounded-lg flex items-center justify-center mb-4 group-hover:bg-[#10b981]/20">
                  <FileText className="text-[#10b981] feature-icon" size={24} />
                </div>
                <h3 className="text-xl font-semibold mb-2">Invoice</h3>
                <p className="text-[#a1a1aa] leading-relaxed">
                  Create and send professional invoices in under 60 seconds.
                  Accept payment via Flutterwave.
                </p>
              </div>
            </Reveal>

            {/* Contracts */}
            <Reveal delay={100}>
              <div className="feature-card group bg-[#18181b] border border-[#27272a] rounded-xl p-6">
                <div className="w-12 h-12 bg-[#10b981]/10 rounded-lg flex items-center justify-center mb-4 group-hover:bg-[#10b981]/20">
                  <FileSignature
                    className="text-[#10b981] feature-icon"
                    size={24}
                  />
                </div>
                <h3 className="text-xl font-semibold mb-2">Contract</h3>
                <p className="text-[#a1a1aa] leading-relaxed">
                  Generate client contracts from 3 templates. Send for
                  e-signature in minutes.
                </p>
              </div>
            </Reveal>

            {/* Earnings */}
            <Reveal delay={200}>
              <div className="feature-card group bg-[#18181b] border border-[#27272a] rounded-xl p-6">
                <div className="w-12 h-12 bg-[#10b981]/10 rounded-lg flex items-center justify-center mb-4 group-hover:bg-[#10b981]/20">
                  <TrendingUp
                    className="text-[#10b981] feature-icon"
                    size={24}
                  />
                </div>
                <h3 className="text-xl font-semibold mb-2">Earnings</h3>
                <p className="text-[#a1a1aa] leading-relaxed">
                  Track income across all clients. See exactly what you earned
                  and when.
                </p>
              </div>
            </Reveal>

            {/* Tax Export */}
            <Reveal delay={300}>
              <div className="feature-card group bg-[#18181b] border border-[#27272a] rounded-xl p-6">
                <div className="w-12 h-12 bg-[#10b981]/10 rounded-lg flex items-center justify-center mb-4 group-hover:bg-[#10b981]/20">
                  <Download className="text-[#10b981] feature-icon" size={24} />
                </div>
                <h3 className="text-xl font-semibold mb-2">Tax Export</h3>
                <p className="text-[#a1a1aa] leading-relaxed">
                  Export a clean annual income summary. Hand it to your
                  accountant or file yourself.
                </p>
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section className="py-20 px-4 sm:px-6">
        <div className="max-w-4xl mx-auto">
          <Reveal>
            <h2 className="text-3xl sm:text-4xl font-bold text-center mb-12">
              From invoice to paid in{" "}
              <span className="text-[#10b981]">3 steps</span>
            </h2>
          </Reveal>

          <div className="grid md:grid-cols-3 gap-8">
            {/* Step 1 */}
            <Reveal delay={0}>
              <div className="text-center">
                <div className="w-16 h-16 bg-[#10b981]/10 border-2 border-[#10b981] rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl font-bold text-[#10b981]">1</span>
                </div>
                <h3 className="text-lg font-semibold mb-2">
                  Create your invoice
                </h3>
                <p className="text-[#a1a1aa] text-sm">
                  Add client, line items, due date
                </p>
              </div>
            </Reveal>

            {/* Step 2 */}
            <Reveal delay={150}>
              <div className="text-center">
                <div className="w-16 h-16 bg-[#10b981]/10 border-2 border-[#10b981] rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl font-bold text-[#10b981]">2</span>
                </div>
                <h3 className="text-lg font-semibold mb-2">
                  Send the payment link
                </h3>
                <p className="text-[#a1a1aa] text-sm">
                  Client gets email + WhatsApp-ready link
                </p>
              </div>
            </Reveal>

            {/* Step 3 */}
            <Reveal delay={300}>
              <div className="text-center">
                <div className="w-16 h-16 bg-[#10b981]/10 border-2 border-[#10b981] rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl font-bold text-[#10b981]">3</span>
                </div>
                <h3 className="text-lg font-semibold mb-2">Get paid</h3>
                <p className="text-[#a1a1aa] text-sm">
                  Flutterwave handles the rest, you get notified instantly
                </p>
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      {/* PRICING */}
      <section className="py-20 px-4 sm:px-6 bg-[#18181b]/50">
        <div className="max-w-5xl mx-auto">
          <Reveal>
            <h2 className="text-3xl sm:text-4xl font-bold text-center mb-4">
              Simple pricing.{" "}
              <span className="text-[#a1a1aa]">No surprises.</span>
            </h2>
          </Reveal>
          <Reveal delay={100}>
            <p className="text-center text-[#a1a1aa] mb-8">
              Start free. Upgrade when you need more.
            </p>
          </Reveal>

          {/* Annual Toggle */}
          <div className="flex items-center justify-center gap-3 mb-12">
            <span
              className={`text-sm ${
                !annualBilling ? "text-white" : "text-[#a1a1aa]"
              }`}
            >
              Monthly
            </span>
            <button
              onClick={() => setAnnualBilling(!annualBilling)}
              className={`relative w-14 h-7 rounded-full transition-colors ${
                annualBilling ? "bg-[#10b981]" : "bg-[#27272a]"
              }`}
            >
              <div
                className={`absolute top-0.5 left-0.5 w-6 h-6 bg-white rounded-full transition-transform ${
                  annualBilling ? "translate-x-7" : "translate-x-0"
                }`}
              />
            </button>
            <span
              className={`text-sm ${
                annualBilling ? "text-white" : "text-[#a1a1aa]"
              }`}
            >
              Annual
            </span>
            {annualBilling && (
              <span className="text-xs text-[#10b981] font-medium">
                Save 27%
              </span>
            )}
          </div>

          <div className="grid md:grid-cols-2 gap-6 max-w-3xl mx-auto">
            {/* Free Plan */}
            <Reveal>
              <div className="bg-[#18181b] border border-[#27272a] rounded-xl p-8">
                <h3 className="text-lg font-semibold mb-2">Free</h3>
                <div className="mb-6">
                  <span className="text-4xl font-bold">$0</span>
                  <span className="text-[#a1a1aa]">/month</span>
                </div>
                <ul className="space-y-3 mb-8">
                  <li className="flex items-center gap-2 text-[#a1a1aa]">
                    <Check size={16} className="text-[#10b981]" />3
                    invoices/month
                  </li>
                  <li className="flex items-center gap-2 text-[#a1a1aa]">
                    <Check size={16} className="text-[#10b981]" />1
                    contract/month
                  </li>
                  <li className="flex items-center gap-2 text-[#a1a1aa]">
                    <Check size={16} className="text-[#10b981]" />
                    Earnings view
                  </li>
                  <li className="flex items-center gap-2 text-[#52525b]">
                    <X size={16} />
                    Payment processing
                  </li>
                  <li className="flex items-center gap-2 text-[#52525b]">
                    <X size={16} />
                    Tax export
                  </li>
                </ul>
                <a
                  href="/signup"
                  className="btn-hover block w-full py-3 border border-[#27272a] text-white text-center font-medium rounded-lg hover:border-[#10b981] transition-colors"
                >
                  Get started
                </a>
              </div>
            </Reveal>

            {/* Pro Plan */}
            <Reveal delay={100}>
              <div className="bg-[#18181b] border-2 border-[#10b981] rounded-xl p-8 relative">
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 bg-[#10b981] text-white text-xs font-medium rounded-full">
                  Most popular
                </div>
                <h3 className="text-lg font-semibold mb-2">Pro</h3>
                <div className="mb-6">
                  <span className="text-4xl font-bold">
                    ${annualBilling ? "79" : "9"}
                  </span>
                  <span className="text-[#a1a1aa]">
                    /{annualBilling ? "year" : "month"}
                  </span>
                </div>
                <ul className="space-y-3 mb-8">
                  <li className="flex items-center gap-2 text-white">
                    <Check size={16} className="text-[#10b981]" />
                    Unlimited invoices
                  </li>
                  <li className="flex items-center gap-2 text-white">
                    <Check size={16} className="text-[#10b981]" />
                    Unlimited contracts
                  </li>
                  <li className="flex items-center gap-2 text-white">
                    <Check size={16} className="text-[#10b981]" />
                    Payment processing (Flutterwave)
                  </li>
                  <li className="flex items-center gap-2 text-white">
                    <Check size={16} className="text-[#10b981]" />
                    Tax export
                  </li>
                  <li className="flex items-center gap-2 text-white">
                    <Check size={16} className="text-[#10b981]" />
                    Custom branding
                  </li>
                </ul>
                <a
                  href="/signup"
                  className="btn-glow btn-hover block w-full py-3 bg-[#10b981] text-white text-center font-medium rounded-lg hover:bg-[#059669] transition-colors"
                >
                  Start free trial
                </a>
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      {/* TESTIMONIALS */}
      <section className="py-20 px-4 sm:px-6">
        <div className="max-w-6xl mx-auto">
          <Reveal>
            <h2 className="text-3xl sm:text-4xl font-bold text-center mb-12">
              What early users are saying
            </h2>
          </Reveal>

          <div className="grid md:grid-cols-3 gap-6">
            {/* Testimonial 1 */}
            <Reveal delay={0}>
              <div className="bg-[#18181b] border border-[#27272a] rounded-xl p-6">
                <div className="flex gap-1 mb-4">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      size={16}
                      className="text-[#10b981] fill-[#10b981]"
                    />
                  ))}
                </div>
                <p className="text-[#a1a1aa] mb-4 leading-relaxed">
                  "I used to spend hours on invoices and chasing payments.
                  SoloDash cut that down to minutes. My clients actually pay
                  faster now."
                </p>
                <div className="text-sm text-[#a1a1aa]">
                  <span className="text-white font-medium">Early user</span> —
                  Nigeria
                </div>
              </div>
            </Reveal>

            {/* Testimonial 2 */}
            <Reveal delay={100}>
              <div className="bg-[#18181b] border border-[#27272a] rounded-xl p-6">
                <div className="flex gap-1 mb-4">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      size={16}
                      className="text-[#10b981] fill-[#10b981]"
                    />
                  ))}
                </div>
                <p className="text-[#a1a1aa] mb-4 leading-relaxed">
                  "Finally, a tool that gets it. I don't need another bloated
                  CRM — just invoices, contracts, and my earnings in one place.
                  Perfect."
                </p>
                <div className="text-sm text-[#a1a1aa]">
                  <span className="text-white font-medium">Early user</span> —
                  Ghana
                </div>
              </div>
            </Reveal>

            {/* Testimonial 3 */}
            <Reveal delay={200}>
              <div className="bg-[#18181b] border border-[#27272a] rounded-xl p-6">
                <div className="flex gap-1 mb-4">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      size={16}
                      className="text-[#10b981] fill-[#10b981]"
                    />
                  ))}
                </div>
                <p className="text-[#a1a1aa] mb-4 leading-relaxed">
                  "Tax season used to stress me out. Now I just export and hand
                  it to my accountant. Worth the Pro plan alone."
                </p>
                <div className="text-sm text-[#a1a1aa]">
                  <span className="text-white font-medium">Early user</span> —
                  Kenya
                </div>
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      {/* FINAL CTA */}
      <section className="py-20 px-4 sm:px-6 bg-[#18181b]/50">
        <Reveal>
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">
              Start free.{" "}
              <span className="text-[#a1a1aa]">Upgrade when you're ready.</span>
            </h2>
            <p className="text-[#a1a1aa] mb-8 text-lg">
              Join freelancers across Africa who've ditched the spreadsheets.
            </p>
            <a
              href="/signup"
              className="btn-glow btn-hover inline-flex items-center gap-2 px-8 py-4 bg-[#10b981] text-white font-medium rounded-lg hover:bg-[#059669] transition-all group text-lg"
            >
              Create your free account
              <ArrowRight
                size={20}
                className="group-hover:translate-x-1 transition-transform"
              />
            </a>
          </div>
        </Reveal>
      </section>

      {/* FOOTER */}
      <footer className="border-t border-[#27272a] py-8 px-4 sm:px-6">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex flex-col sm:flex-row items-center gap-4">
            <span className="text-lg font-bold text-[#10b981]">SoloDash</span>
            <span className="text-sm text-[#a1a1aa]">
              © 2026 SoloDash. Built for freelancers.
            </span>
          </div>

          <div className="flex items-center gap-6">
            <a
              href="/privacy"
              className="text-sm text-[#a1a1aa] hover:text-white transition-colors"
            >
              Privacy Policy
            </a>
            <a
              href="/terms"
              className="text-sm text-[#a1a1aa] hover:text-white transition-colors"
            >
              Terms of Service
            </a>
            <a
              href="https://twitter.com"
              target="_blank"
              rel="noopener noreferrer"
              className="text-[#a1a1aa] hover:text-[#10b981] transition-colors"
            >
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="currentColor"
              >
                <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
              </svg>
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
