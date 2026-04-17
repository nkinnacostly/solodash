"use client";

import Link from "next/link";
import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type ReactNode,
} from "react";

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

function useScrollPast(thresholdPx: number): boolean {
  const [past, setPast] = useState(false);

  useEffect(() => {
    const onScroll = () => setPast(window.scrollY > thresholdPx);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [thresholdPx]);

  return past;
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
      { threshold: 0.1, rootMargin: "0px 0px -50px 0px" },
    );

    obs.observe(el);
    return () => obs.disconnect();
  }, [reduced]);

  return ref;
}

function Reveal({
  children,
  className = "",
  style,
  delayMs = 0,
}: {
  children: ReactNode;
  className?: string;
  style?: CSSProperties;
  delayMs?: number;
}) {
  const ref = useReveal<HTMLDivElement>();
  return (
    <div
      ref={ref}
      data-visible="false"
      className={`opacity-0 translate-y-5 transition-[opacity,transform] duration-300 ease-out data-[visible=true]:opacity-100 data-[visible=true]:translate-y-0 ${className}`}
      style={{ ...style, transitionDelay: `${delayMs}ms` }}
    >
      {children}
    </div>
  );
}

function useParallaxTilt(strength = 8) {
  const ref = useRef<HTMLDivElement>(null);
  const reduced = usePrefersReducedMotion();

  const onMove = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (reduced) return;
      const node = ref.current;
      if (!node) return;
      const r = node.getBoundingClientRect();
      const px = (e.clientX - r.left) / r.width - 0.5;
      const py = (e.clientY - r.top) / r.height - 0.5;
      node.style.setProperty("--tx", `${-px * strength}px`);
      node.style.setProperty("--ty", `${-py * strength}px`);
    },
    [reduced, strength],
  );

  const onLeave = useCallback(() => {
    const node = ref.current;
    if (!node) return;
    node.style.setProperty("--tx", "0px");
    node.style.setProperty("--ty", "0px");
  }, []);

  return { ref, onMove, onLeave };
}

function MockShell({
  children,
  rotateDeg = 0,
}: {
  children: ReactNode;
  rotateDeg?: number;
}) {
  const { ref, onMove, onLeave } = useParallaxTilt(10);
  const rot =
    rotateDeg === 0
      ? ""
      : rotateDeg === 1
        ? "rotate-1 max-lg:rotate-0"
        : rotateDeg === -1
          ? "-rotate-1 max-lg:rotate-0"
          : rotateDeg === 0.5
            ? "rotate-[0.5deg] max-lg:rotate-0"
            : rotateDeg === -0.75
              ? "-rotate-[0.75deg] max-lg:rotate-0"
              : "";

  return (
    <div
      ref={ref}
      onMouseMove={onMove}
      onMouseLeave={onLeave}
      className="relative flex justify-center [perspective:1200px]"
      style={
        {
          ["--tx" as string]: "0px",
          ["--ty" as string]: "0px",
        } as CSSProperties
      }
    >
      <div
        className="w-full max-w-[420px] transition-transform duration-300 ease-out"
        style={{ transform: "translate3d(var(--tx,0px), var(--ty,0px), 0)" }}
      >
        <div
          className={`relative rounded-2xl border border-[#1a1a1a] bg-[#0a0a0a] p-5 shadow-[0_0_0_1px_rgba(255,255,255,0.02),0_0_120px_#10b98110,0_24px_80px_rgba(0,0,0,0.45)] transition-[transform,box-shadow] duration-300 ease-out hover:scale-[1.01] hover:shadow-[0_0_0_1px_rgba(255,255,255,0.02),0_0_140px_#10b98118,0_28px_90px_rgba(0,0,0,0.5)] ${rot}`}
        >
          {children}
        </div>
      </div>
    </div>
  );
}

function HeroInvoiceVisual() {
  return (
    <div
      className="relative mx-auto w-full max-w-[min(100%,420px)] select-none"
      aria-hidden
    >
      <div className="absolute inset-0 -z-10 rounded-[28px] bg-[radial-gradient(ellipse_at_center,#10b98112,transparent_70%)] blur-2xl" />
      <svg
        viewBox="0 0 400 260"
        className="h-auto w-full overflow-visible text-[#1a1a1a]"
        role="img"
      >
        <defs>
          <linearGradient id="paidlyGrad" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#10b981" />
            <stop offset="100%" stopColor="#059669" />
          </linearGradient>
        </defs>
        {/* Floating sheet */}
        <g className="transition-transform duration-300 ease-out">
          <rect
            x="48"
            y="36"
            width="304"
            height="188"
            rx="16"
            fill="#0a0a0a"
            stroke="#1a1a1a"
            strokeWidth="1"
          />
          <rect x="72" y="64" width="120" height="10" rx="4" fill="#1a1a1a" />
          <rect x="72" y="84" width="180" height="8" rx="3" fill="#262626" />
          <rect x="280" y="64" width="48" height="14" rx="6" fill="#10b98122" />
          <text
            x="304"
            y="74"
            textAnchor="middle"
            fill="#10b981"
            fontSize="9"
            fontFamily="ui-sans-serif, system-ui"
            fontWeight="700"
          >
            NEW
          </text>
          <rect x="72" y="118" width="256" height="1" fill="#1a1a1a" />
          <rect x="72" y="132" width="140" height="8" rx="3" fill="#2a2a2a" />
          <rect x="72" y="148" width="100" height="8" rx="3" fill="#2a2a2a" />
          <rect x="280" y="132" width="48" height="8" rx="3" fill="#3f3f46" />
          <rect x="72" y="176" width="96" height="28" rx="14" fill="url(#paidlyGrad)" />
          <text
            x="120"
            y="194"
            textAnchor="middle"
            fill="#ffffff"
            fontSize="11"
            fontFamily="ui-sans-serif, system-ui"
            fontWeight="600"
          >
            Pay now →
          </text>
        </g>
        {/* Cursor / pen */}
        <g className="paidly-cursor-float">
          <path
            d="M312 48 L338 58 L318 92 L292 82 Z"
            fill="#0a0a0a"
            stroke="#1a1a1a"
          />
          <circle cx="326" cy="58" r="4" fill="#10b981" />
        </g>
        <g opacity="0.35">
          <rect
            x="64"
            y="28"
            width="304"
            height="188"
            rx="16"
            fill="none"
            stroke="#10b981"
            strokeWidth="1"
            strokeDasharray="6 6"
          />
        </g>
      </svg>
      <style>{`
        @keyframes paidlyCursorFloat {
          0%, 100% { transform: translate(0, 0); }
          50% { transform: translate(-3px, 2px); }
        }
        .paidly-cursor-float {
          animation: paidlyCursorFloat 6s ease-in-out infinite;
        }
        @media (prefers-reduced-motion: reduce) {
          .paidly-cursor-float { animation: none; }
        }
      `}</style>
    </div>
  );
}

export default function Home() {
  const navScrolled = useScrollPast(100);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [annual, setAnnual] = useState(false);
  const reducedMotion = usePrefersReducedMotion();

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
    <div
      className="min-h-screen text-[#e4e4e7] antialiased"
      style={{
        backgroundColor: "#050505",
        fontFamily:
          'ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
        backgroundImage:
          "radial-gradient(#ffffff03 1px, transparent 1px), radial-gradient(ellipse 80% 55% at 50% -10%, #10b98108, transparent 55%)",
        backgroundSize: "20px 20px, 100% 100%",
        backgroundAttachment: "fixed, scroll",
      }}
    >
      <style>{`
        @keyframes paidlyHeroIn {
          from { opacity: 0; transform: translateY(18px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .paidly-hero-item {
          opacity: ${reducedMotion ? 1 : 0};
          animation: ${reducedMotion ? "none" : "paidlyHeroIn 700ms ease-out forwards"};
        }
        .paidly-hero-0 { animation-delay: 0ms; }
        .paidly-hero-1 { animation-delay: 90ms; }
        .paidly-hero-2 { animation-delay: 180ms; }
        .paidly-hero-3 { animation-delay: 270ms; }
        .paidly-hero-4 { animation-delay: 360ms; }
        .paidly-hero-5 { animation-delay: 450ms; }
        @media (prefers-reduced-motion: reduce) {
          .paidly-hero-item { opacity: 1; transform: none; animation: none; }
        }
      `}</style>

      {/* NAV */}
      <header
        className={`fixed inset-x-0 top-0 z-50 h-16 border-b transition-[background-color,backdrop-filter,border-color] duration-300 ease-out ${
          navScrolled
            ? "border-[#1a1a1a] bg-[#050505]/80 backdrop-blur-md"
            : "border-transparent bg-transparent"
        }`}
      >
        <div className="mx-auto flex h-full max-w-[1100px] items-center justify-between px-4 sm:px-6">
          <a
            href="/"
            className="text-[22px] font-bold tracking-tight text-[#10b981]"
            style={{ fontWeight: 700 }}
          >
            Paidly
          </a>

          <nav className="hidden items-center gap-8 md:flex">
            <a
              href="#features"
              className="text-sm text-[#71717a] transition-colors duration-300 ease-out hover:text-[#e4e4e7]"
            >
              Features
            </a>
            <a
              href="#pricing"
              className="text-sm text-[#71717a] transition-colors duration-300 ease-out hover:text-[#e4e4e7]"
            >
              Pricing
            </a>
            <Link
              href="/login"
              className="text-sm text-[#71717a] transition-colors duration-300 ease-out hover:text-[#e4e4e7]"
            >
              Log in
            </Link>
            <Link
              href="/signup"
              className="rounded-full bg-gradient-to-r from-[#10b981] to-[#059669] px-5 py-2 text-sm font-semibold text-white shadow-none transition-[box-shadow,transform] duration-300 ease-out hover:shadow-[0_0_24px_#10b98140] active:scale-[0.99]"
            >
              Start free →
            </Link>
          </nav>

          <button
            type="button"
            aria-label={mobileOpen ? "Close menu" : "Open menu"}
            className="flex h-10 w-10 flex-col items-center justify-center gap-1.5 rounded-lg border border-transparent text-[#e4e4e7] transition-colors hover:border-[#1a1a1a] md:hidden"
            onClick={() => setMobileOpen((o) => !o)}
          >
            <span
              className={`block h-0.5 w-5 rounded-full bg-current transition-transform duration-300 ease-out ${mobileOpen ? "translate-y-2 rotate-45" : ""}`}
            />
            <span
              className={`block h-0.5 w-5 rounded-full bg-current transition-opacity duration-300 ease-out ${mobileOpen ? "opacity-0" : ""}`}
            />
            <span
              className={`block h-0.5 w-5 rounded-full bg-current transition-transform duration-300 ease-out ${mobileOpen ? "-translate-y-2 -rotate-45" : ""}`}
            />
          </button>
        </div>
      </header>

      {/* Mobile drawer */}
      <div
        className={`fixed inset-0 z-40 md:hidden ${mobileOpen ? "pointer-events-auto" : "pointer-events-none"}`}
        aria-hidden={!mobileOpen}
      >
        <button
          type="button"
          className={`absolute inset-0 bg-black/60 transition-opacity duration-300 ease-out ${mobileOpen ? "opacity-100" : "opacity-0"}`}
          onClick={closeMobile}
          tabIndex={mobileOpen ? 0 : -1}
          aria-label="Close menu overlay"
        />
        <div
          className={`absolute right-0 top-0 flex h-full w-[min(100%,320px)] flex-col border-l border-[#1a1a1a] bg-[#050505] px-6 pb-10 pt-20 transition-transform duration-300 ease-out ${mobileOpen ? "translate-x-0" : "translate-x-full"}`}
        >
          <a
            href="#features"
            onClick={closeMobile}
            className="py-3 text-sm uppercase tracking-widest text-[#a1a1aa] transition-colors hover:text-white"
          >
            Features
          </a>
          <a
            href="#pricing"
            onClick={closeMobile}
            className="py-3 text-sm uppercase tracking-widest text-[#a1a1aa] transition-colors hover:text-white"
          >
            Pricing
          </a>
          <div className="my-6 h-px w-full bg-[#1a1a1a]" />
          <Link
            href="/login"
            onClick={closeMobile}
            className="py-2 text-base text-[#e4e4e7]"
          >
            Log in
          </Link>
          <Link
            href="/signup"
            onClick={closeMobile}
            className="mt-4 rounded-full bg-gradient-to-r from-[#10b981] to-[#059669] py-3 text-center text-sm font-semibold text-white transition-shadow duration-300 ease-out hover:shadow-[0_0_24px_#10b98140]"
          >
            Start free →
          </Link>
        </div>
      </div>

      {/* HERO */}
      <section className="relative flex min-h-[calc(100dvh-4rem)] flex-col items-center justify-center px-4 pb-24 pt-28 sm:px-6">
        <div className="mx-auto flex w-full max-w-[720px] flex-col items-center text-center">
          <div className="paidly-hero-item paidly-hero-0 mb-8 inline-flex items-center rounded-full border border-[#10b98130] bg-[#10b98110] px-4 py-1.5 text-[12px] font-semibold uppercase tracking-widest text-[#10b981]">
            ✦ Built for African freelancers
          </div>

          <h1 className="paidly-hero-item paidly-hero-1 text-balance text-[2.35rem] font-extrabold leading-[1.05] tracking-[-0.02em] text-white sm:text-[56px]">
            Stop chasing payments.
            <br />
            <span className="text-[#10b981]">Start getting paid.</span>
          </h1>

          <p className="paidly-hero-item paidly-hero-2 mx-auto mt-6 max-w-[520px] text-balance text-[18px] leading-relaxed text-[#71717a]">
            Paidly replaces your WhatsApp invoices, Google Docs contracts, and
            spreadsheet tracking with one clean tool.
          </p>

          <div className="paidly-hero-item paidly-hero-3 mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row sm:gap-6">
            <Link
              href="/signup"
              className="inline-flex items-center justify-center rounded-full bg-gradient-to-r from-[#10b981] to-[#059669] px-8 py-3 text-sm font-semibold text-white transition-[box-shadow,transform] duration-300 ease-out hover:shadow-[0_0_24px_#10b98140] active:scale-[0.99]"
            >
              Start for free →
            </Link>
            <a
              href="#features"
              className="text-[#71717a] underline decoration-transparent underline-offset-4 transition-colors duration-300 ease-out hover:text-white hover:decoration-current"
            >
              See how it works
            </a>
          </div>

          <p className="paidly-hero-item paidly-hero-4 mt-8 text-[13px] font-medium tracking-wide text-[#52525b]">
            No credit card · Free forever · 2 min setup
          </p>

          <div className="paidly-hero-item paidly-hero-5 mt-14 w-full max-w-[min(100%,460px)]">
            <HeroInvoiceVisual />
          </div>
        </div>
      </section>

      {/* SOCIAL STRIP */}
      <div className="border-y border-[#1a1a1a] py-4">
        <p className="text-center text-[13px] font-medium uppercase tracking-widest text-[#52525b]">
          Trusted by freelancers across Nigeria · Ghana · Kenya · South Africa
        </p>
      </div>

      {/* SHOWCASE */}
      <section id="features" className="px-4 sm:px-6">
        <div className="mx-auto max-w-[1100px] pt-24 pb-8 text-center">
          <Reveal>
            <h2 className="text-[40px] font-bold leading-tight tracking-tight text-white">
              Everything you need.
            </h2>
            <p className="mt-3 text-base text-[#71717a]">Nothing you don&apos;t.</p>
          </Reveal>
        </div>

        {/* Row 1 */}
        <div className="mx-auto grid max-w-[1100px] grid-cols-1 items-center gap-12 py-20 lg:grid-cols-2 lg:gap-16">
          <Reveal className="order-1 lg:order-1">
            <p className="text-[12px] font-semibold uppercase tracking-widest text-[#10b981]">
              Invoicing
            </p>
            <h3 className="mt-3 text-[28px] font-bold leading-snug tracking-tight text-white">
              Send professional invoices in 60 seconds
            </h3>
            <p className="mt-4 max-w-[480px] text-[15px] leading-[1.7] text-[#71717a]">
              Add your client, line items, and due date. Hit send. Your client
              gets an email with a Pay Now button. Money goes straight to your
              bank.
            </p>
          </Reveal>
          <Reveal className="order-2 lg:order-2" delayMs={80}>
            <MockShell rotateDeg={1}>
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-xs uppercase tracking-widest text-[#52525b]">
                    Invoice
                  </p>
                  <p className="mt-2 text-sm font-semibold text-[#e4e4e7]">
                    Acme Studios Ltd.
                  </p>
                </div>
                <span className="rounded-md bg-[#10b98114] px-2 py-1 text-xs font-bold text-[#10b981]">
                  INV-001
                </span>
              </div>
              <div className="mt-6 space-y-3 border-t border-[#1a1a1a] pt-5">
                <div className="flex justify-between text-sm text-[#a1a1aa]">
                  <span>Brand identity sprint</span>
                  <span className="text-[#e4e4e7]">₦280,000</span>
                </div>
                <div className="flex justify-between text-sm text-[#a1a1aa]">
                  <span>Web design — 4 pages</span>
                  <span className="text-[#e4e4e7]">₦170,000</span>
                </div>
              </div>
              <div className="mt-6 flex items-center justify-between border-t border-[#1a1a1a] pt-5">
                <span className="text-sm text-[#71717a]">Total due</span>
                <span className="text-lg font-bold tracking-tight text-white">
                  ₦450,000
                </span>
              </div>
              <button
                type="button"
                className="mt-5 w-full rounded-full bg-gradient-to-r from-[#10b981] to-[#059669] py-2.5 text-sm font-semibold text-white transition-shadow duration-300 ease-out hover:shadow-[0_0_24px_#10b98130]"
              >
                Pay Now →
              </button>
            </MockShell>
          </Reveal>
        </div>

        {/* Row 2 */}
        <div className="mx-auto grid max-w-[1100px] grid-cols-1 items-center gap-12 py-20 lg:grid-cols-2 lg:gap-16">
          <Reveal className="order-2 lg:order-1" delayMs={80}>
            <MockShell rotateDeg={-1}>
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs uppercase tracking-widest text-[#52525b]">
                    Service agreement
                  </p>
                  <p className="mt-2 text-sm font-semibold text-[#e4e4e7]">
                    Paidly × Client Co.
                  </p>
                </div>
                <span className="rounded-full border border-[#10b98140] bg-[#10b98110] px-3 py-1 text-[11px] font-semibold uppercase tracking-wider text-[#10b981]">
                  ✓ Signed
                </span>
              </div>
              <div className="mt-6 space-y-2 text-sm leading-relaxed text-[#71717a]">
                <p>
                  Both parties acknowledge deliverables, timelines, and payment
                  milestones as outlined in Schedule A.
                </p>
              </div>
              <div className="mt-8 grid grid-cols-2 gap-4 border-t border-dashed border-[#1a1a1a] pt-6">
                <div>
                  <p className="text-[11px] uppercase tracking-widest text-[#52525b]">
                    Client
                  </p>
                  <div className="mt-4 h-10 rounded border border-[#262626] bg-[#0f0f0f]" />
                  <p className="mt-2 text-xs text-[#52525b]">Signature</p>
                </div>
                <div>
                  <p className="text-[11px] uppercase tracking-widest text-[#52525b]">
                    You
                  </p>
                  <div className="mt-4 h-10 rounded border border-[#10b98140] bg-[#10b98108]" />
                  <p className="mt-2 text-xs text-[#10b981]">Signed Apr 12</p>
                </div>
              </div>
            </MockShell>
          </Reveal>
          <Reveal className="order-1 lg:order-2">
            <p className="text-[12px] font-semibold uppercase tracking-widest text-[#10b981]">
              Contracts
            </p>
            <h3 className="mt-3 text-[28px] font-bold leading-snug tracking-tight text-white">
              Contracts signed in minutes, not days
            </h3>
            <p className="mt-4 max-w-[480px] text-[15px] leading-[1.7] text-[#71717a]">
              Pick a template. Fill in the details. Send for digital signature.
              Both parties sign. PDF stored forever.
            </p>
          </Reveal>
        </div>

        {/* Row 3 */}
        <div className="mx-auto grid max-w-[1100px] grid-cols-1 items-center gap-12 py-20 lg:grid-cols-2 lg:gap-16">
          <Reveal className="order-1">
            <p className="text-[12px] font-semibold uppercase tracking-widest text-[#10b981]">
              Earnings
            </p>
            <h3 className="mt-3 text-[28px] font-bold leading-snug tracking-tight text-white">
              Know exactly what you&apos;ve earned
            </h3>
            <p className="mt-4 max-w-[480px] text-[15px] leading-[1.7] text-[#71717a]">
              Every payment auto-tracked. See monthly breakdown, per-client
              income, and export your annual summary in one click.
            </p>
          </Reveal>
          <Reveal className="order-2" delayMs={80}>
            <MockShell rotateDeg={0.5}>
              <div className="flex items-end justify-between gap-2 px-2 pt-2">
                {[40, 64, 48, 88, 56, 72].map((h, i) => (
                  <div
                    key={i}
                    className="w-[12%] rounded-t-md bg-gradient-to-t from-[#059669] to-[#10b981] opacity-90"
                    style={{ height: `${h}px` }}
                  />
                ))}
              </div>
              <div className="mt-8 border-t border-[#1a1a1a] pt-5">
                <p className="text-xs uppercase tracking-widest text-[#52525b]">
                  Year to date
                </p>
                <p className="mt-2 text-2xl font-bold tracking-tight text-white">
                  ₦2,450,000{" "}
                  <span className="text-base font-medium text-[#71717a]">
                    this year
                  </span>
                </p>
              </div>
            </MockShell>
          </Reveal>
        </div>

        {/* Row 4 */}
        <div className="mx-auto grid max-w-[1100px] grid-cols-1 items-center gap-12 py-20 lg:grid-cols-2 lg:gap-16">
          <Reveal className="order-2 lg:order-1" delayMs={80}>
            <MockShell rotateDeg={-0.75}>
              <div className="flex items-center gap-4">
                <div className="flex h-14 w-11 shrink-0 items-center justify-center rounded-lg border border-[#1a1a1a] bg-[#0f0f0f]">
                  <svg width="22" height="26" viewBox="0 0 24 28" aria-hidden>
                    <path
                      fill="#ef4444"
                      d="M4 2h12l6 6v18a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2z"
                    />
                    <path fill="#fecaca" d="M16 2v6h6" opacity="0.35" />
                    <text
                      x="12"
                      y="19"
                      textAnchor="middle"
                      fill="white"
                      fontSize="8"
                      fontWeight="700"
                    >
                      PDF
                    </text>
                  </svg>
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-[#e4e4e7]">
                    paidly-earnings-2026.pdf
                  </p>
                  <p className="text-xs text-[#52525b]">Ready to download</p>
                </div>
                <span className="flex h-10 w-10 items-center justify-center rounded-full border border-[#1a1a1a] text-[#10b981] transition-colors duration-300 ease-out hover:border-[#10b98140] hover:bg-[#10b98110]">
                  ↓
                </span>
              </div>
            </MockShell>
          </Reveal>
          <Reveal className="order-1 lg:order-2">
            <p className="text-[12px] font-semibold uppercase tracking-widest text-[#10b981]">
              Tax export
            </p>
            <h3 className="mt-3 text-[28px] font-bold leading-snug tracking-tight text-white">
              Tax season in 30 seconds
            </h3>
            <p className="mt-4 max-w-[480px] text-[15px] leading-[1.7] text-[#71717a]">
              Download your annual income summary as PDF or CSV. Hand it to your
              accountant. Done.
            </p>
          </Reveal>
        </div>
      </section>

      {/* COMPARISON */}
      <section className="px-4 pb-24 sm:px-6">
        <Reveal className="mx-auto max-w-[800px] text-center">
          <h2 className="text-[36px] font-bold tracking-tight text-white">
            The old way vs the Paidly way
          </h2>
        </Reveal>
        <Reveal className="mx-auto mt-12 max-w-[800px]" delayMs={60}>
          <div className="overflow-x-auto rounded-2xl border border-[#1a1a1a] bg-[#0a0a0a]">
            <div className="min-w-[520px]">
              <div className="grid grid-cols-2 border-b border-[#1a1a1a]">
                <div className="px-5 py-4 text-left text-[14px] font-semibold text-[#ef4444]">
                  Without Paidly
                </div>
                <div className="border-l border-[#1a1a1a] px-5 py-4 text-left text-[14px] font-semibold text-[#10b981]">
                  With Paidly
                </div>
              </div>
              {[
                [
                  "WhatsApp invoice",
                  "Professional PDF with Pay Now button",
                ],
                ["No contracts", "Digital contracts with e-signature"],
                ["Spreadsheet tracking", "Automatic income dashboard"],
                ["Tax panic", "One-click annual export"],
                ["Chase payments for weeks", "Client pays in hours"],
              ].map(([left, right], i) => (
                <div
                  key={i}
                  className="grid grid-cols-2 border-b border-[#1a1a1a] last:border-b-0"
                >
                  <div className="px-5 py-5 text-[15px] leading-snug text-[#71717a] line-through">
                    {left}
                  </div>
                  <div className="border-l border-[#1a1a1a] px-5 py-5 text-[15px] leading-snug text-[#e4e4e7]">
                    {right}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </Reveal>
      </section>

      {/* PRICING */}
      <section id="pricing" className="px-4 pb-28 sm:px-6">
        <div className="mx-auto max-w-[700px] text-center">
          <Reveal>
            <h2 className="text-[36px] font-bold tracking-tight text-white">
              Simple pricing
            </h2>
            <p className="mt-3 text-base text-[#71717a]">
              Start free. Upgrade when you&apos;re ready.
            </p>
          </Reveal>

          <Reveal className="mt-10 flex justify-center" delayMs={50}>
            <div className="inline-flex items-center gap-3 rounded-full border border-[#1a1a1a] bg-[#0a0a0a] p-1">
              <button
                type="button"
                onClick={() => setAnnual(false)}
                className={`rounded-full px-4 py-2 text-sm font-medium transition-colors duration-300 ease-out ${
                  !annual
                    ? "bg-[#141414] text-white shadow-sm"
                    : "text-[#71717a] hover:text-[#e4e4e7]"
                }`}
              >
                Monthly
              </button>
              <button
                type="button"
                onClick={() => setAnnual(true)}
                className={`rounded-full px-4 py-2 text-sm font-medium transition-colors duration-300 ease-out ${
                  annual
                    ? "bg-[#141414] text-white shadow-sm"
                    : "text-[#71717a] hover:text-[#e4e4e7]"
                }`}
              >
                Annual
              </button>
            </div>
          </Reveal>

          <div className="mt-12 grid grid-cols-1 gap-6 md:grid-cols-2">
            <Reveal>
              <div className="flex h-full flex-col rounded-2xl border border-[#1a1a1a] bg-[#0a0a0a] p-8 text-left">
                <p className="text-sm font-semibold uppercase tracking-widest text-[#52525b]">
                  Free
                </p>
                <p className="mt-4 text-4xl font-bold text-white">₦0</p>
                <div className="mt-8 space-y-3 text-sm leading-relaxed text-[#a1a1aa]">
                  <p>3 invoices per month</p>
                  <p>1 contract per month</p>
                  <p>Earnings tracking</p>
                  <p>5% platform fee</p>
                </div>
                <div className="flex-1" />
                <Link
                  href="/signup"
                  className="mt-10 inline-flex w-full items-center justify-center rounded-full border border-[#1a1a1a] py-3 text-sm font-semibold text-[#e4e4e7] transition-colors duration-300 ease-out hover:border-[#2a2a2a] hover:bg-[#0f0f0f]"
                >
                  Get started
                </Link>
              </div>
            </Reveal>

            <Reveal delayMs={80}>
              <div
                className="flex h-full flex-col rounded-2xl border border-[#10b98140] bg-[#0a0a0a] p-8 text-left transition-[transform,box-shadow] duration-300 ease-out hover:scale-[1.01]"
                style={{ boxShadow: "0 0 60px #10b98110" }}
              >
                <div className="flex items-center gap-2">
                  <p className="text-sm font-semibold uppercase tracking-widest text-[#10b981]">
                    Pro
                  </p>
                  <span className="rounded-full bg-[#10b98114] px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-[#10b981]">
                    Popular
                  </span>
                </div>
                <p className="mt-4 text-4xl font-bold text-white">
                  {annual ? "₦130,000" : "₦15,000"}
                  <span className="text-base font-medium text-[#71717a]">
                    {annual ? "/yr" : "/mo"}
                  </span>
                </p>
                <div className="mt-8 space-y-3 text-sm leading-relaxed text-[#d4d4d8]">
                  <p>Unlimited invoices</p>
                  <p>Unlimited contracts</p>
                  <p>0% platform fee</p>
                  <p>Custom branding</p>
                  <p>Tax export</p>
                  <p>Priority support</p>
                </div>
                <div className="flex-1" />
                <Link
                  href="/signup"
                  className="mt-10 inline-flex w-full items-center justify-center rounded-full bg-gradient-to-r from-[#10b981] to-[#059669] py-3 text-sm font-semibold text-white transition-shadow duration-300 ease-out hover:shadow-[0_0_24px_#10b98140]"
                >
                  Upgrade to Pro →
                </Link>
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      {/* FINAL CTA */}
      <section className="border-t border-[#1a1a1a] px-4 py-28 sm:px-6">
        <Reveal className="mx-auto max-w-[720px] text-center">
          <h2 className="text-balance text-[44px] font-bold leading-tight tracking-tight text-white">
            Your talent deserves better admin.
          </h2>
          <p className="mx-auto mt-5 max-w-[560px] text-balance text-base leading-relaxed text-[#71717a]">
            Join freelancers across Africa who stopped chasing payments and
            started getting paid.
          </p>
          <Link
            href="/signup"
            className="mt-10 inline-flex items-center justify-center rounded-full bg-gradient-to-r from-[#10b981] to-[#059669] px-10 py-4 text-base font-semibold text-white transition-[box-shadow,transform] duration-300 ease-out hover:shadow-[0_0_28px_#10b98145] active:scale-[0.99]"
          >
            Start for free →
          </Link>
          <p className="mt-8 text-sm tracking-wide text-[#52525b]">
            Free forever · No credit card · 2 minutes to start
          </p>
        </Reveal>
      </section>

      {/* FOOTER */}
      <footer className="border-t border-[#1a1a1a] px-4 py-14 sm:px-6">
        <div className="mx-auto grid max-w-[1100px] grid-cols-1 gap-10 text-sm text-[#52525b] md:grid-cols-3 md:gap-8">
          <div>
            <p className="text-lg font-bold text-[#10b981]">Paidly</p>
            <p className="mt-3 max-w-xs leading-relaxed transition-colors duration-300 ease-out">
              Built for African freelancers
            </p>
            <p className="mt-6">© 2026 Paidly</p>
          </div>
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-widest text-[#3f3f46]">
              Product
            </p>
            <ul className="mt-4 space-y-3">
              <li>
                <a
                  href="#features"
                  className="transition-colors duration-300 ease-out hover:text-[#e4e4e7]"
                >
                  Features
                </a>
              </li>
              <li>
                <a
                  href="#pricing"
                  className="transition-colors duration-300 ease-out hover:text-[#e4e4e7]"
                >
                  Pricing
                </a>
              </li>
            </ul>
          </div>
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-widest text-[#3f3f46]">
              Legal
            </p>
            <ul className="mt-4 space-y-3">
              <li>
                <Link
                  href="/privacy"
                  className="transition-colors duration-300 ease-out hover:text-[#e4e4e7]"
                >
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link
                  href="/terms"
                  className="transition-colors duration-300 ease-out hover:text-[#e4e4e7]"
                >
                  Terms of Service
                </Link>
              </li>
            </ul>
          </div>
        </div>
      </footer>
    </div>
  );
}
