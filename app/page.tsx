"use client";

import Link from "next/link";
import {
  ArrowUpRight,
  Download,
  FileText,
  Menu,
  PenLine,
  TrendingUp,
  Wallet,
  X,
} from "lucide-react";
import {
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";

/* ---------------------------------- utils --------------------------------- */

function usePrefersReducedMotion(): boolean {
  const [reduced, setReduced] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setReduced(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);

  return reduced;
}

function useReveal<T extends HTMLElement = HTMLDivElement>() {
  const ref = useRef<T>(null);
  const reduced = usePrefersReducedMotion();

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    if (reduced) {
      el.dataset.visible = "true";
      return;
    }

    const obs = new IntersectionObserver(
      ([e]) => {
        if (e?.isIntersecting) {
          el.dataset.visible = "true";
          obs.unobserve(el);
        }
      },
      { threshold: 0.1, rootMargin: "0px 0px -60px 0px" },
    );

    obs.observe(el);
    return () => obs.disconnect();
  }, [reduced]);

  return ref;
}

function Reveal({
  children,
  className = "",
  delayMs = 0,
}: {
  children: ReactNode;
  className?: string;
  delayMs?: number;
}) {
  const ref = useReveal<HTMLDivElement>();
  return (
    <div
      ref={ref}
      data-visible="false"
      className={`opacity-0 translate-y-6 transition-[opacity,transform] duration-500 ease-out data-[visible=true]:opacity-100 data-[visible=true]:translate-y-0 ${className}`}
      style={{ transitionDelay: `${delayMs}ms` }}
    >
      {children}
    </div>
  );
}

/* ---------------------------------- brand --------------------------------- */

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

function Logo({ dark = false }: { dark?: boolean }) {
  return (
    <span className="inline-flex items-center gap-2">
      <LogoMark className="h-6 w-6" />
      <span
        className={`text-lg font-extrabold tracking-tight ${dark ? "text-lp-ink" : "text-white"}`}
      >
        Paidly
      </span>
    </span>
  );
}

function CircleArrow({ size = "md" }: { size?: "sm" | "md" | "lg" }) {
  const dim =
    size === "lg" ? "h-14 w-14" : size === "sm" ? "h-7 w-7" : "h-10 w-10";
  const icon = size === "lg" ? 24 : size === "sm" ? 13 : 17;
  return (
    <span
      className={`inline-flex ${dim} shrink-0 items-center justify-center rounded-full bg-lp-accent text-white`}
    >
      <ArrowUpRight size={icon} strokeWidth={2.4} />
    </span>
  );
}

/* ------------------------------ mockup pieces ----------------------------- */

const DOT_GRID: number[][] = [
  [2, 1, 1, 0, 1, 2, 1],
  [1, 1, 0, 2, 1, 1, 0],
  [0, 2, 1, 1, 2, 0, 1],
  [1, 0, 2, 1, 1, 1, 2],
];

function DotMatrix({ cols = 7 }: { cols?: number }) {
  return (
    <div
      className="grid gap-[7px]"
      style={{ gridTemplateColumns: `repeat(${cols}, 1fr)` }}
    >
      {DOT_GRID.flatMap((row, ri) =>
        row.slice(0, cols).map((v, ci) => (
          <span
            key={`${ri}-${ci}`}
            className={`h-3 w-3 rounded-full ${
              v === 1
                ? "bg-lp-accent"
                : v === 2
                  ? "bg-lp-ink"
                  : "bg-lp-line"
            }`}
          />
        )),
      )}
    </div>
  );
}

function Gauge({ pct, label }: { pct: number; label: string }) {
  const r = 34;
  const c = 2 * Math.PI * r;
  return (
    <div className="relative h-24 w-24">
      <svg viewBox="0 0 88 88" className="h-full w-full -rotate-90">
        <circle
          cx="44"
          cy="44"
          r={r}
          fill="none"
          stroke="#e8efff"
          strokeWidth="10"
        />
        <circle
          cx="44"
          cy="44"
          r={r}
          fill="none"
          stroke="#2563eb"
          strokeWidth="10"
          strokeLinecap="round"
          strokeDasharray={`${(pct / 100) * c} ${c}`}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-lg font-extrabold text-lp-ink">{pct}%</span>
        <span className="text-[9px] font-medium text-lp-gray">{label}</span>
      </div>
    </div>
  );
}

function MiniBars({
  values,
  highlight = -1,
}: {
  values: number[];
  highlight?: number;
}) {
  const max = Math.max(...values);
  return (
    <div className="flex items-end gap-2.5">
      {values.map((v, i) => (
        <div key={i} className="flex flex-col items-center gap-1.5">
          <div
            className={`w-6 rounded-md ${
              i === highlight
                ? "bg-lp-accent"
                : i % 2 === 0
                  ? "bg-lp-ink"
                  : "bg-[#bcd4ff]"
            }`}
            style={{ height: `${Math.round((v / max) * 72) + 14}px` }}
          />
        </div>
      ))}
    </div>
  );
}

function Badge({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <span
      className={`inline-flex items-center gap-2 rounded-full bg-lp-accent py-1.5 pl-3.5 pr-1.5 text-[11px] font-semibold text-white shadow-lg shadow-lp-accent/30 ${className}`}
    >
      {children}
      <span className="flex h-5 w-5 items-center justify-center rounded-full bg-white/20">
        <ArrowUpRight size={11} strokeWidth={2.5} />
      </span>
    </span>
  );
}

function PillSelect({ children }: { children: ReactNode }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-lp-line px-3 py-1 text-[11px] font-medium text-lp-gray">
      {children}
      <span className="text-[8px]">▼</span>
    </span>
  );
}

function FacebookIcon() {
  return (
    <svg viewBox="0 0 24 24" width="15" height="15" fill="currentColor" aria-hidden>
      <path d="M13.5 21v-7h2.4l.4-3h-2.8V9.1c0-.9.3-1.5 1.6-1.5h1.3V4.9c-.3 0-1.1-.1-2-.1-2 0-3.4 1.2-3.4 3.5V11H8.5v3H11v7h2.5Z" />
    </svg>
  );
}

function InstagramIcon() {
  return (
    <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden>
      <rect x="3.5" y="3.5" width="17" height="17" rx="4.5" />
      <circle cx="12" cy="12" r="3.8" />
      <circle cx="17" cy="7" r="1" fill="currentColor" stroke="none" />
    </svg>
  );
}

function XIcon() {
  return (
    <svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor" aria-hidden>
      <path d="M17.2 4h2.6l-5.7 6.5L20.8 20h-5.3l-4.1-5.4L6.6 20H4l6.1-7L3.6 4H9l3.7 4.9L17.2 4Zm-.9 14.4h1.4L7.9 5.5H6.4l9.9 12.9Z" />
    </svg>
  );
}

function YoutubeIcon() {
  return (
    <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor" aria-hidden>
      <path d="M21.6 7.2a2.5 2.5 0 0 0-1.8-1.8C18.3 5 12 5 12 5s-6.3 0-7.8.4A2.5 2.5 0 0 0 2.4 7.2 26 26 0 0 0 2 12a26 26 0 0 0 .4 4.8 2.5 2.5 0 0 0 1.8 1.8c1.5.4 7.8.4 7.8.4s6.3 0 7.8-.4a2.5 2.5 0 0 0 1.8-1.8A26 26 0 0 0 22 12a26 26 0 0 0-.4-4.8ZM10 15.2V8.8l5.2 3.2-5.2 3.2Z" />
    </svg>
  );
}

function LinkedinIcon() {
  return (
    <svg viewBox="0 0 24 24" width="15" height="15" fill="currentColor" aria-hidden>
      <path d="M6.9 8.6H4V20h2.9V8.6ZM5.4 7.3a1.7 1.7 0 1 0 0-3.4 1.7 1.7 0 0 0 0 3.4ZM9.5 20h2.9v-5.7c0-1.5.7-2.4 2-2.4 1.2 0 1.8.8 1.8 2.4V20h2.9v-6.2c0-2.9-1.5-4.3-3.8-4.3-1.7 0-2.6.9-2.9 1.6V8.6H9.5V20Z" />
    </svg>
  );
}

/* --------------------------------- page ----------------------------------- */

const NAV_LINKS = [
  { label: "Home", href: "/", active: true },
  { label: "Features", href: "#features", active: false },
  { label: "Why Paidly", href: "#why", active: false },
  { label: "Pricing", href: "/pricing", active: false },
];

const LIGHT_FEATURES = [
  {
    icon: FileText,
    text: "Send professional invoices with a Pay Now button — in about 60 seconds.",
  },
  {
    icon: PenLine,
    text: "Get service agreements signed in minutes with built-in e-signatures.",
  },
  {
    icon: TrendingUp,
    text: "Every payment is auto-tracked the moment it hits your account.",
  },
  {
    icon: Download,
    text: "Export your annual income summary as PDF or CSV in one click.",
  },
];

const COUNTRIES = ["Nigeria", "Ghana", "Kenya", "South Africa"];
const PARTNERS = ["Flutterwave", "Paystack"];

const STATS: Array<{ value: string; label: string }> = [
  { value: "60s", label: "Average invoice setup" },
  { value: "4+", label: "African countries" },
  { value: "7", label: "Currencies supported" },
];

const SOCIALS = [
  { Icon: FacebookIcon, label: "Facebook" },
  { Icon: InstagramIcon, label: "Instagram" },
  { Icon: XIcon, label: "X (Twitter)" },
  { Icon: YoutubeIcon, label: "YouTube" },
  { Icon: LinkedinIcon, label: "LinkedIn" },
];

export default function Home() {
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    if (!mobileOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [mobileOpen]);

  const closeMobile = () => setMobileOpen(false);

  return (
    <div className="min-h-screen bg-lp-page font-sans text-lp-ink antialiased">
      {/* =============================== NAV =============================== */}
      <header className="fixed inset-x-0 top-3 z-50 px-2 sm:top-4 sm:px-3">
        <div className="flex items-center justify-between rounded-2xl border border-white/10 bg-lp-ink/95 py-2.5 pl-4 pr-2.5 shadow-xl shadow-black/20 backdrop-blur-md sm:pl-6">
            <Link href="/" aria-label="Paidly home">
              <Logo />
            </Link>

            <nav className="hidden items-center gap-1 lg:flex">
              {NAV_LINKS.map((l) =>
                l.href.startsWith("#") ? (
                  <a
                    key={l.label}
                    href={l.href}
                    className={`rounded-full px-4 py-2 text-[13px] font-medium transition-colors duration-200 ${
                      l.active
                        ? "bg-lp-accent text-white"
                        : "text-white/70 hover:bg-white/10 hover:text-white"
                    }`}
                  >
                    {l.active && (
                      <span className="mr-1.5 inline-block h-1.5 w-1.5 rounded-full bg-white align-middle" />
                    )}
                    {l.label}
                  </a>
                ) : (
                  <Link
                    key={l.label}
                    href={l.href}
                    className={`rounded-full px-4 py-2 text-[13px] font-medium transition-colors duration-200 ${
                      l.active
                        ? "bg-lp-accent text-white"
                        : "text-white/70 hover:bg-white/10 hover:text-white"
                    }`}
                  >
                    {l.label}
                  </Link>
                ),
              )}
            </nav>

            <div className="hidden items-center gap-2 lg:flex">
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

            <button
              type="button"
              aria-label={mobileOpen ? "Close menu" : "Open menu"}
              className="flex h-10 w-10 items-center justify-center rounded-xl text-white transition-colors hover:bg-white/10 lg:hidden"
              onClick={() => setMobileOpen((o) => !o)}
            >
              {mobileOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
      </header>

      {/* Mobile drawer */}
      <div
        className={`fixed inset-0 z-40 lg:hidden ${mobileOpen ? "pointer-events-auto" : "pointer-events-none"}`}
        aria-hidden={!mobileOpen}
      >
        <button
          type="button"
          className={`absolute inset-0 bg-black/60 transition-opacity duration-300 ${mobileOpen ? "opacity-100" : "opacity-0"}`}
          onClick={closeMobile}
          tabIndex={mobileOpen ? 0 : -1}
          aria-label="Close menu overlay"
        />
        <div
          className={`absolute right-0 top-0 flex h-full w-[min(100%,320px)] flex-col bg-lp-ink px-6 pb-10 pt-24 transition-transform duration-300 ${mobileOpen ? "translate-x-0" : "translate-x-full"}`}
        >
          {NAV_LINKS.map((l) =>
            l.href.startsWith("#") ? (
              <a
                key={l.label}
                href={l.href}
                onClick={closeMobile}
                className="border-b border-white/10 py-4 text-base font-medium text-white/80"
              >
                {l.label}
              </a>
            ) : (
              <Link
                key={l.label}
                href={l.href}
                onClick={closeMobile}
                className="border-b border-white/10 py-4 text-base font-medium text-white/80"
              >
                {l.label}
              </Link>
            ),
          )}
          <div className="mt-8 flex flex-col gap-3">
            <Link
              href="/login"
              onClick={closeMobile}
              className="rounded-full border border-white/20 py-3 text-center text-sm font-medium text-white"
            >
              Log in
            </Link>
            <Link
              href="/signup"
              onClick={closeMobile}
              className="rounded-full bg-lp-accent py-3 text-center text-sm font-semibold text-white"
            >
              Get Started
            </Link>
          </div>
        </div>
      </div>

      {/* =============================== HERO ============================== */}
      <section className="px-2 pt-20 sm:px-3 sm:pt-24">
        <div className="relative overflow-hidden rounded-[28px] bg-lp-ink">
          <div
            className="pointer-events-none absolute inset-0 opacity-40"
            style={{
              background:
                "radial-gradient(ellipse 60% 50% at 85% 20%, rgba(37,99,235,0.25), transparent 60%)",
            }}
          />
          <div className="relative grid gap-12 px-6 py-12 sm:px-10 sm:py-16 lg:grid-cols-[1.05fr_1fr] lg:gap-8 lg:px-14 lg:py-20">
            {/* Left */}
            <div className="flex flex-col">
              <h1 className="text-[2.6rem] font-extrabold leading-[1.04] tracking-tight text-white sm:text-6xl lg:text-[4.2rem]">
                Take Control
                <br />
                <span className="inline-flex items-center gap-3">
                  Of Your
                  <CircleArrow size="lg" />
                </span>
                <br />
                Freelance Money
              </h1>

              <div className="mt-9 flex items-center gap-3">
                <Link
                  href="/signup"
                  className="rounded-full bg-white px-6 py-3 text-sm font-semibold text-lp-ink transition-transform duration-200 hover:scale-[1.03]"
                >
                  Get Started Now
                </Link>
                <CircleArrow size="md" />
              </div>

              <p className="mt-10 max-w-sm text-[13px] leading-relaxed text-lp-gray-dark">
                We understand your freelance journey is unique. Paidly handles
                your invoices, contracts, and earnings — so you can focus on
                the work and get paid faster.
              </p>

              <p className="mt-auto pt-14 text-[11px] font-medium text-white/35">
                © 2026 Paidly
              </p>
            </div>

            {/* Right — dashboard composition */}
            <div
              className="relative mx-auto w-full max-w-[560px] lg:my-auto"
              aria-hidden
            >
              <div className="absolute -right-6 top-16 hidden h-40 w-40 rounded-full bg-lp-accent/25 blur-3xl lg:block" />

              {/* Card A — income overview */}
              <div className="relative z-10 ml-auto w-[94%]">
                <Badge className="absolute -left-6 top-[42%] z-30">
                  Invoicing
                </Badge>
                <Badge className="absolute -left-3 top-[68%] z-30">
                  E-Sign Contracts
                </Badge>
                <div className="rounded-2xl bg-white p-5 shadow-2xl shadow-black/40">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-[11px] font-medium text-lp-gray">
                        Income Sources
                      </p>
                      <p className="mt-1 text-2xl font-extrabold tracking-tight text-lp-ink">
                        ₦ 772K
                      </p>
                      <p className="mt-0.5 text-[10px] text-lp-gray">
                        Statistics in a month
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-[11px] font-bold text-lp-ink">
                        Welcome back, Ada!
                      </p>
                      <p className="text-[10px] text-lp-gray">
                        Financial Overview
                      </p>
                      <div className="ml-auto mt-3 grid w-[104px] grid-cols-6 gap-1">
                        {Array.from({ length: 18 }).map((_, i) => (
                          <span
                            key={i}
                            className={`h-2 w-2 rounded-full ${
                              i % 4 === 0
                                ? "bg-lp-accent"
                                : i % 3 === 0
                                  ? "bg-lp-ink"
                                  : "bg-lp-line"
                            }`}
                          />
                        ))}
                      </div>
                    </div>
                  </div>
                  <div className="mt-4 flex items-center justify-end gap-2">
                    <span className="rounded-md bg-lp-accent-soft px-2 py-1 text-[10px] font-bold text-lp-accent">
                      +73.6%
                    </span>
                    <span className="text-[10px] text-lp-gray">
                      better than last month
                    </span>
                  </div>
                </div>
              </div>

              {/* Card B — financial report */}
              <div className="relative z-20 -mt-6 w-[94%]">
                <Badge className="absolute -right-5 bottom-[30%] z-30">
                  Auto Tracking
                </Badge>
                <Badge className="absolute right-8 -bottom-4 z-30">
                  Tax Export
                </Badge>
                <div className="overflow-hidden rounded-2xl bg-white shadow-2xl shadow-black/40">
                  <div className="flex items-center justify-between bg-lp-ink px-5 py-3">
                    <p className="text-[11px] font-semibold text-white">
                      Financial Report
                    </p>
                    <span className="flex h-5 w-5 items-center justify-center rounded-full bg-white/15 text-white">
                      <X size={11} />
                    </span>
                  </div>
                  <div className="flex items-center justify-between gap-4 p-5">
                    <Gauge pct={22} label="of goal" />
                    <div>
                      <p className="text-[11px] font-medium text-lp-gray">
                        Paid Today
                      </p>
                      <p className="text-xl font-extrabold tracking-tight text-lp-ink">
                        ₦ 552,921
                      </p>
                      <div className="mt-3 flex items-end justify-end gap-2">
                        <div className="h-9 w-5 rounded-md bg-lp-ink" />
                        <div className="h-14 w-5 rounded-md bg-lp-accent" />
                        <div className="h-7 w-5 rounded-md bg-[#bcd4ff]" />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ============================ LOGO STRIP =========================== */}
      <section className="px-4 py-12 sm:px-6">
        <Reveal className="mx-auto max-w-6xl">
          <p className="text-center text-[11px] font-semibold uppercase tracking-[0.2em] text-lp-gray">
            Trusted by freelancers across Africa · Powered by
          </p>
          <div className="mt-6 flex flex-wrap items-center justify-center gap-x-10 gap-y-4 sm:gap-x-14">
            {PARTNERS.map((p) => (
              <span
                key={p}
                className="text-lg font-extrabold tracking-tight text-[#b3b6bd]"
              >
                {p}
              </span>
            ))}
            {COUNTRIES.map((c) => (
              <span
                key={c}
                className="text-lg font-bold uppercase tracking-widest text-[#c3c6cd]"
              >
                {c}
              </span>
            ))}
          </div>
        </Reveal>
      </section>

      {/* ========================== SPLIT FEATURE ========================== */}
      <section id="how" className="px-4 py-16 sm:px-6 lg:py-24">
        <div className="mx-auto grid max-w-6xl items-center gap-14 lg:grid-cols-2 lg:gap-20">
          {/* Left visual */}
          <Reveal className="relative" aria-hidden>
            <div className="relative mx-auto max-w-[440px]">
              <div className="rounded-[28px] bg-gradient-to-br from-lp-accent-soft to-white p-8 shadow-sm ring-1 ring-lp-line">
                <div className="flex items-center justify-between">
                  <span className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-lp-accent text-white">
                    <Wallet size={20} />
                  </span>
                  <span className="flex h-9 w-9 items-center justify-center rounded-full bg-lp-ink text-white">
                    <ArrowUpRight size={15} />
                  </span>
                </div>

                <div className="mt-6 rounded-2xl bg-white p-5 shadow-lg shadow-lp-accent/10 ring-1 ring-lp-line">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-[11px] font-medium text-lp-gray">
                        Paid Today
                      </p>
                      <p className="text-2xl font-extrabold tracking-tight text-lp-ink">
                        ₦ 552,921
                      </p>
                    </div>
                    <Gauge pct={22} label="of goal" />
                  </div>
                  <div className="mt-4 flex items-center justify-between border-t border-lp-line pt-4">
                    <span className="text-[11px] text-lp-gray">
                      Profit margin
                    </span>
                    <span className="rounded-full bg-lp-accent-soft px-2.5 py-1 text-[10px] font-bold text-lp-accent">
                      +12% this week
                    </span>
                  </div>
                </div>

                <div className="mt-5 flex items-center justify-between rounded-2xl bg-lp-ink p-5">
                  <div>
                    <p className="text-[11px] text-white/50">
                      Track and Export
                    </p>
                    <p className="mt-0.5 text-sm font-bold text-white">
                      Earnings Report
                    </p>
                  </div>
                  <span className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-lp-accent text-white">
                    <Download size={15} />
                  </span>
                </div>
              </div>

              <Badge className="absolute -right-3 top-8 shadow-xl lg:-right-8">
                Financial Report
              </Badge>
            </div>
          </Reveal>

          {/* Right copy */}
          <Reveal delayMs={80}>
            <h2 className="text-4xl font-extrabold leading-[1.08] tracking-tight text-lp-ink sm:text-5xl">
              Experience admin in a whole{" "}
              <span className="text-lp-accent">new light</span>
            </h2>
            <p className="mt-5 max-w-md text-[15px] leading-relaxed text-lp-gray">
              Every invoice, contract, and payment in one clean tool —
              accessible anywhere, on any device, built for African
              freelancers.
            </p>

            <div className="mt-10 grid gap-x-8 gap-y-8 sm:grid-cols-2">
              {LIGHT_FEATURES.map((f) => (
                <div key={f.text} className="flex items-start gap-4">
                  <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-lp-accent text-white">
                    <f.icon size={18} />
                  </span>
                  <p className="pt-1 text-[13px] leading-relaxed text-lp-gray">
                    {f.text}
                  </p>
                </div>
              ))}
            </div>
          </Reveal>
        </div>
      </section>

      {/* ========================== DARK FEATURES ========================== */}
      <section id="features" className="px-2 sm:px-3">
        <div className="rounded-[28px] bg-lp-ink px-6 py-12 sm:px-10 lg:px-14 lg:py-16">
          <div className="mx-auto max-w-[1400px]">
          {/* Header */}
          <div className="grid gap-10 lg:grid-cols-2">
            <Reveal>
              <h2 className="text-5xl font-extrabold leading-[1.05] tracking-tight text-white sm:text-6xl">
                Our
                <br />
                Featu
                <span className="mx-1 inline-flex h-12 w-12 items-center justify-center rounded-full bg-lp-accent align-middle text-white sm:h-14 sm:w-14">
                  <ArrowUpRight size={22} strokeWidth={2.4} />
                </span>
                res
              </h2>
            </Reveal>
            <Reveal delayMs={80} className="lg:pt-2">
              <div className="flex flex-col items-start gap-4 lg:items-end">
                <Badge>Invoicing · Contracts · Earnings</Badge>
                <p className="max-w-xs text-[13px] leading-relaxed text-lp-gray-dark lg:text-right">
                  Run your entire back office with interactive dashboards and
                  clean reports.
                </p>
                <div className="text-right">
                  <p className="text-sm font-bold text-white">( 02 )</p>
                  <p className="text-[11px] text-lp-gray-dark">
                    Journey to financial freedom
                  </p>
                </div>
              </div>
            </Reveal>
          </div>

          {/* Content */}
          <div className="mt-12 grid gap-10 lg:grid-cols-2 lg:gap-14">
            {/* Column 1 */}
            <div>
              <Reveal>
                <div className="flex items-center gap-4">
                  <span className="text-sm font-bold text-white">( 01 )</span>
                  <span className="rounded-full bg-white/10 px-3.5 py-1.5 text-[11px] font-semibold text-white">
                    Invoices
                  </span>
                  <span className="rounded-full bg-lp-accent px-3.5 py-1.5 text-[11px] font-semibold text-white">
                    E-Sign
                  </span>
                </div>
                <p className="mt-4 max-w-sm text-[13px] leading-relaxed text-lp-gray-dark">
                  Professional invoices and contracts. Send in seconds —
                  clarity and convenience to manage your money.
                </p>
              </Reveal>

              <Reveal delayMs={80} className="mt-8">
                <div className="rounded-2xl bg-white p-6 shadow-2xl shadow-black/40">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-bold text-lp-ink">
                      Invoice Breakdown
                    </p>
                    <PillSelect>This Month</PillSelect>
                  </div>
                  <p className="mt-3 text-3xl font-extrabold tracking-tight text-lp-ink">
                    ₦ 450K
                  </p>
                  <div className="mt-6">
                    <DotMatrix />
                  </div>
                  <div className="mt-5 flex items-center gap-5 border-t border-lp-line pt-4 text-[10px] font-medium text-lp-gray">
                    <span className="flex items-center gap-1.5">
                      <span className="h-2.5 w-2.5 rounded-full bg-lp-accent" />
                      Paid
                    </span>
                    <span className="flex items-center gap-1.5">
                      <span className="h-2.5 w-2.5 rounded-full bg-lp-ink" />
                      Sent
                    </span>
                    <span className="flex items-center gap-1.5">
                      <span className="h-2.5 w-2.5 rounded-full bg-lp-line" />
                      Draft
                    </span>
                  </div>
                  <div className="mt-3 grid grid-cols-7 text-center text-[10px] font-semibold text-lp-gray">
                    {["M", "T", "W", "T", "F", "S", "S"].map((d, i) => (
                      <span key={i}>{d}</span>
                    ))}
                  </div>
                </div>
              </Reveal>
            </div>

            {/* Column 2 */}
            <div>
              <Reveal>
                <div className="flex flex-wrap items-center gap-4">
                  <div className="flex-1 rounded-2xl bg-white p-5 shadow-2xl shadow-black/40">
                    <p className="text-[11px] font-medium text-lp-gray">
                      Today Received
                    </p>
                    <p className="mt-1 text-2xl font-extrabold tracking-tight text-lp-ink">
                      ₦ 552,921
                    </p>
                    <p className="mt-1 text-[10px] text-lp-gray">12% of goal</p>
                  </div>
                  <div className="flex-1 rounded-2xl bg-lp-ink-2 p-5 ring-1 ring-white/10">
                    <p className="text-[11px] text-white/50">
                      Track and Run Report
                    </p>
                    <p className="mt-1 text-sm font-bold text-white">
                      Earnings Report
                    </p>
                    <span className="mt-3 inline-flex h-7 w-12 items-center rounded-full bg-lp-accent px-1">
                      <span className="ml-auto h-5 w-5 rounded-full bg-white" />
                    </span>
                  </div>
                  <CircleArrow size="md" />
                </div>
              </Reveal>

              <Reveal delayMs={80} className="mt-6">
                <div className="rounded-2xl bg-white p-6 shadow-2xl shadow-black/40">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-bold text-lp-ink">
                      Income Sources
                    </p>
                    <div className="flex items-center gap-2">
                      <PillSelect>Sort By Month</PillSelect>
                      <PillSelect>All Sources</PillSelect>
                    </div>
                  </div>

                  <div className="mt-4 flex flex-wrap items-end justify-between gap-6">
                    <div>
                      <span className="rounded-md bg-lp-line px-2 py-1 text-[10px] font-bold text-lp-gray">
                        ₦ 0 Day
                      </span>
                      <p className="mt-2 text-3xl font-extrabold tracking-tight text-lp-ink">
                        ₦ 772K
                      </p>
                      <p className="mt-1 text-[10px] text-lp-gray">
                        Income Sources · Statistics in a month
                      </p>
                    </div>
                    <div>
                      <p className="text-2xl font-extrabold text-lp-accent">
                        +73,6%
                      </p>
                      <p className="text-[10px] text-lp-gray">
                        better than last month
                      </p>
                    </div>
                  </div>

                  <div className="mt-6 flex items-end justify-center gap-8 border-t border-lp-line pt-6">
                    <div className="flex flex-col items-center gap-1.5">
                      <span className="rounded bg-lp-accent-soft px-1.5 py-0.5 text-[9px] font-bold text-lp-accent">
                        ₦ 450K
                      </span>
                      <div className="h-24 w-10 rounded-lg bg-[repeating-linear-gradient(45deg,#2563eb_0_6px,#4f83f0_6px_12px)]" />
                    </div>
                    <div className="flex flex-col items-center gap-1.5">
                      <span className="rounded bg-lp-line px-1.5 py-0.5 text-[9px] font-bold text-lp-gray">
                        ₦ 180K
                      </span>
                      <div className="h-14 w-10 rounded-lg bg-lp-ink" />
                    </div>
                    <div className="flex flex-col items-center gap-1.5">
                      <span className="rounded bg-lp-line px-1.5 py-0.5 text-[9px] font-bold text-lp-gray">
                        ₦ 320K
                      </span>
                      <div className="h-20 w-10 rounded-lg bg-[#bcd4ff]" />
                    </div>
                  </div>
                </div>
              </Reveal>
            </div>
          </div>
          </div>
        </div>
      </section>

      {/* ============================ STATEMENT ============================ */}
      <section id="why" className="px-4 pt-20 sm:px-6 lg:pt-28">
        <div className="mx-auto grid max-w-6xl items-center gap-12 lg:grid-cols-2 lg:gap-20">
          <Reveal>
            <p className="max-w-md text-[15px] leading-relaxed text-lp-gray">
              We know every freelance journey is different. Paidly gives you
              the tools to invoice, get signed, and get paid — so you can
              focus on the work you love, not the admin behind it.
            </p>
            <Link
              href="/pricing"
              className="mt-8 inline-flex items-center gap-2.5 rounded-full bg-lp-accent py-2 pl-5 pr-2 text-sm font-semibold text-white transition-colors duration-200 hover:bg-lp-accent-strong"
            >
              See More
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-white/20">
                <ArrowUpRight size={14} strokeWidth={2.4} />
              </span>
            </Link>
          </Reveal>
          <Reveal delayMs={80}>
            <h2 className="text-4xl font-extrabold leading-[1.1] tracking-tight text-lp-ink sm:text-5xl">
              Strengthening Your Pathway To{" "}
              <span className="text-lp-accent">Getting Paid</span> Faster
            </h2>
          </Reveal>
        </div>
        <div className="mx-auto mt-16 max-w-6xl border-t border-[#c9cbd2] sm:mt-20" />
      </section>

      {/* ============================== STATS ============================== */}
      <section className="px-4 py-16 sm:px-6 lg:py-20">
        <div className="mx-auto grid max-w-6xl items-center gap-10 lg:grid-cols-[1fr_1.6fr]">
          <Reveal>
            <h2 className="text-3xl font-bold tracking-tight text-lp-ink sm:text-4xl">
              Our Journey
            </h2>
          </Reveal>
          <div className="grid grid-cols-1 gap-10 sm:grid-cols-3">
            {STATS.map((s, i) => (
              <Reveal key={s.label} delayMs={i * 80}>
                <p className="text-5xl font-extrabold tracking-tight text-lp-ink sm:text-[3.4rem]">
                  {s.value}
                </p>
                <p className="mt-2 text-sm text-lp-gray">{s.label}</p>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ============================= SHOWCASE ============================ */}
      <section className="px-4 pb-20 sm:px-6 lg:pb-28">
        <div className="mx-auto grid max-w-6xl gap-6 lg:grid-cols-2">
          {/* Left stack */}
          <div className="flex flex-col gap-4">
            <Reveal>
              <div className="flex items-center justify-between rounded-2xl bg-white p-5 ring-1 ring-lp-line">
                <div className="flex items-center gap-4">
                  <span className="flex h-11 w-11 items-center justify-center rounded-full bg-lp-accent-soft text-lp-accent">
                    <PenLine size={18} />
                  </span>
                  <div>
                    <p className="text-sm font-bold text-lp-ink">
                      For African Freelancers
                    </p>
                    <p className="text-[12px] text-lp-gray">
                      Designers, Developers, Writers
                    </p>
                  </div>
                </div>
                <ArrowUpRight size={18} className="text-lp-ink" />
              </div>
            </Reveal>

            <Reveal delayMs={60}>
              <div className="flex min-h-[240px] flex-col justify-between rounded-2xl bg-lp-accent p-7 text-white">
                <p className="max-w-xs text-3xl font-extrabold leading-tight tracking-tight">
                  Your Entire Back Office, One Clean Display
                </p>
                <div className="mt-8 flex items-end justify-between">
                  <span className="inline-flex h-9 w-16 items-center rounded-full bg-white/25 px-1">
                    <span className="h-7 w-7 rounded-full bg-white" />
                  </span>
                  <p className="text-right text-[11px] font-bold uppercase tracking-[0.18em]">
                    Let&apos;s get you
                    <br />
                    paid faster
                  </p>
                </div>
              </div>
            </Reveal>

            {[
              {
                title: "Bills & Vendors",
                sub: "Track what you owe",
                cta: "See more",
              },
              {
                title: "Expenses",
                sub: "Log, track, and export",
                cta: "See more",
              },
            ].map((row, i) => (
              <Reveal key={row.title} delayMs={i * 60}>
                <div className="flex items-center justify-between rounded-2xl bg-white p-5 ring-1 ring-lp-line">
                  <div className="flex items-center gap-4">
                    <span className="flex h-11 w-11 items-center justify-center rounded-full bg-lp-accent-soft text-lp-accent">
                      <Wallet size={18} />
                    </span>
                    <div>
                      <p className="text-sm font-bold text-lp-ink">
                        {row.title}
                      </p>
                      <p className="text-[12px] text-lp-gray">{row.sub}</p>
                    </div>
                  </div>
                  <span className="flex items-center gap-1.5 text-[12px] font-semibold text-lp-ink">
                    {row.cta}
                    <ArrowUpRight size={14} />
                  </span>
                </div>
              </Reveal>
            ))}
          </div>

          {/* Right dark card */}
          <Reveal delayMs={100}>
            <div className="relative h-full overflow-hidden rounded-[24px] bg-lp-ink p-7 sm:p-9">
              <div
                className="pointer-events-none absolute inset-0 opacity-50"
                style={{
                  background:
                    "radial-gradient(ellipse 55% 45% at 80% 10%, rgba(37,99,235,0.3), transparent 60%)",
                }}
              />
              <div className="relative">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm font-bold text-white">( 02 )</p>
                    <p className="mt-0.5 text-[11px] text-lp-gray-dark">
                      Journey to Financial Freedom
                    </p>
                  </div>
                  <CircleArrow size="md" />
                </div>

                <h3 className="mt-6 text-4xl font-extrabold leading-[1.08] tracking-tight text-white">
                  Forefront of
                  <br />
                  Getting You{" "}
                  <span className="text-lp-accent">Paid</span>
                </h3>

                <div className="mt-8 grid gap-4 sm:grid-cols-2">
                  <div className="rounded-2xl bg-white p-5">
                    <div className="flex items-center justify-between">
                      <p className="text-[12px] font-bold text-lp-ink">
                        Financial Overview
                      </p>
                      <span className="text-[9px] font-semibold text-lp-gray">
                        For Week
                      </span>
                    </div>
                    <div className="mt-3 flex items-center justify-between">
                      <Gauge pct={22} label="of goal" />
                      <div>
                        <p className="text-[10px] text-lp-gray">Profit Today</p>
                        <p className="text-lg font-extrabold text-lp-ink">
                          ₦ 552,921
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="rounded-2xl bg-white p-5">
                    <div className="flex items-center justify-between">
                      <p className="text-[12px] font-bold text-lp-ink">
                        Income Sources
                      </p>
                      <span className="rounded bg-lp-accent-soft px-1.5 py-0.5 text-[9px] font-bold text-lp-accent">
                        +73.6%
                      </span>
                    </div>
                    <p className="mt-2 text-xl font-extrabold text-lp-ink">
                      ₦ 772K
                    </p>
                    <div className="mt-3">
                      <MiniBars values={[40, 68, 30, 90]} highlight={3} />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      {/* =========================== CTA + FOOTER ========================== */}
      <section className="px-2 pb-2 sm:px-3 sm:pb-3">
        <div className="rounded-[28px] bg-lp-ink px-6 py-12 sm:px-10 lg:px-14 lg:py-16">
          <div className="mx-auto max-w-[1400px]">
          <Reveal>
            <div className="flex flex-col gap-8 lg:flex-row lg:items-center lg:justify-between">
              <h2 className="max-w-2xl text-4xl font-extrabold leading-[1.1] tracking-tight text-white sm:text-5xl">
                Keep Your Freelance{" "}
                <span className="text-lp-accent">Money Growing</span> and
                Stable
              </h2>
              <div className="flex items-center gap-4">
                <span className="hidden h-9 w-16 items-center rounded-full bg-white/15 px-1 sm:inline-flex">
                  <span className="ml-auto h-7 w-7 rounded-full bg-white" />
                </span>
                <Link
                  href="/signup"
                  className="inline-flex items-center gap-2.5 rounded-full bg-lp-accent py-2.5 pl-6 pr-2.5 text-sm font-semibold text-white transition-colors duration-200 hover:bg-lp-accent-strong"
                >
                  Get Started Now
                  <span className="flex h-8 w-8 items-center justify-center rounded-full bg-white/20">
                    <ArrowUpRight size={14} strokeWidth={2.4} />
                  </span>
                </Link>
              </div>
            </div>
          </Reveal>

          <div className="mt-12 border-t border-dashed border-white/15 pt-12">
            <div className="grid gap-10 md:grid-cols-2 lg:grid-cols-[1.4fr_1fr_1fr_1.3fr]">
              <div>
                <Logo />
                <p className="mt-4 max-w-xs text-[13px] leading-relaxed text-lp-gray-dark">
                  Invoices, contracts, earnings, and tax export — the admin
                  side of freelancing, handled. Built for Africa.
                </p>
                <p className="mt-8 text-[11px] text-white/35">© 2026 Paidly</p>
              </div>

              <div>
                <p className="text-sm font-bold text-white">Quick Links</p>
                <ul className="mt-4 space-y-3 text-[13px] text-lp-gray-dark">
                  <li>
                    <a
                      href="#features"
                      className="transition-colors hover:text-white"
                    >
                      Features
                    </a>
                  </li>
                  <li>
                    <Link
                      href="/pricing"
                      className="transition-colors hover:text-white"
                    >
                      Pricing
                    </Link>
                  </li>
                  <li>
                    <Link
                      href="/login"
                      className="transition-colors hover:text-white"
                    >
                      Log in
                    </Link>
                  </li>
                  <li>
                    <Link
                      href="/signup"
                      className="transition-colors hover:text-white"
                    >
                      Get Started
                    </Link>
                  </li>
                </ul>
              </div>

              <div>
                <p className="text-sm font-bold text-white">Company</p>
                <ul className="mt-4 space-y-3 text-[13px] text-lp-gray-dark">
                  <li>
                    <Link
                      href="/privacy"
                      className="transition-colors hover:text-white"
                    >
                      Privacy Policy
                    </Link>
                  </li>
                  <li>
                    <Link
                      href="/terms"
                      className="transition-colors hover:text-white"
                    >
                      Terms of Services
                    </Link>
                  </li>
                </ul>
              </div>

              <div>
                <p className="text-sm font-bold text-white">Get It Free</p>
                <p className="mt-4 max-w-xs text-[13px] leading-relaxed text-lp-gray-dark">
                  Paidly is free to start — 3 invoices and 1 contract every
                  month, forever. Upgrade only when you outgrow it.
                </p>
                <div className="mt-5 flex items-center gap-2.5">
                  {SOCIALS.map(({ Icon, label }) => (
                    <span
                      key={label}
                      aria-label={label}
                      className="flex h-9 w-9 items-center justify-center rounded-full bg-white/10 text-white transition-colors hover:bg-lp-accent"
                    >
                      <Icon />
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
          </div>
        </div>
      </section>
    </div>
  );
}
