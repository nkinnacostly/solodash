import Link from "next/link";

export default function PrivacyPolicy() {
  return (
    <div className="min-h-screen bg-[#0f0f0f] text-white antialiased">
      {/* NAVBAR */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-[#0f0f0f]/90 backdrop-blur-md border-b border-[#27272a]">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <Link href="/" className="text-xl font-bold text-[#10b981]">
            Paidly
          </Link>
          <div className="hidden md:flex items-center gap-6">
            <Link
              href="/"
              className="text-sm text-[#a1a1aa] hover:text-white transition-colors"
            >
              Home
            </Link>
            <Link
              href="/login"
              className="text-sm text-[#a1a1aa] hover:text-white transition-colors"
            >
              Log in
            </Link>
            <Link
              href="/signup"
              className="px-4 py-2 text-sm bg-[#10b981] text-white font-medium rounded-lg hover:bg-[#059669] transition-colors"
            >
              Start free
            </Link>
          </div>
        </div>
      </nav>

      {/* CONTENT */}
      <main className="pt-32 pb-20 px-4 sm:px-6">
        <div className="max-w-3xl mx-auto">
          <h1 className="text-4xl sm:text-5xl font-bold text-[#10b981] mb-4">
            Privacy Policy
          </h1>
          <p className="text-[#a1a1aa] mb-12">Last updated: April 2026</p>

          <div className="space-y-12">
            <section>
              <h2 className="text-2xl font-semibold mb-4 text-[#10b981]">
                1. Introduction
              </h2>
              <p className="text-[#a1a1aa] leading-relaxed mb-4">
                Paidly ("we," "our," or "us") is committed to protecting your
                privacy. This Privacy Policy explains how we collect, use,
                disclose, and safeguard your information when you use our SaaS
                platform at getpaidly.co (the "Service").
              </p>
              <p className="text-[#a1a1aa] leading-relaxed">
                By using Paidly, you agree to the collection and use of
                information in accordance with this policy. If you do not agree
                with the terms of this Privacy Policy, please do not access the
                Service.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4 text-[#10b981]">
                2. Information We Collect
              </h2>

              <h3 className="text-lg font-semibold mb-2 text-white">
                2.1 Information You Provide
              </h3>
              <ul className="list-disc pl-6 text-[#a1a1aa] space-y-2 mb-6">
                <li>Account information (name, email address, password)</li>
                <li>Business details (business name, country, timezone)</li>
                <li>Client information you add to the platform</li>
                <li>Invoice and contract data you create</li>
                <li>Payment and billing information</li>
                <li>Communication with us (support emails, feedback)</li>
              </ul>

              <h3 className="text-lg font-semibold mb-2 text-white">
                2.2 Information Automatically Collected
              </h3>
              <ul className="list-disc pl-6 text-[#a1a1aa] space-y-2 mb-6">
                <li>Usage data (how you interact with the Service)</li>
                <li>Device information (browser type, IP address)</li>
                <li>Log data (access times, pages viewed, referring URL)</li>
                <li>Cookies and similar tracking technologies</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4 text-[#10b981]">
                3. How We Use Your Information
              </h2>
              <p className="text-[#a1a1aa] leading-relaxed mb-4">
                We use the information we collect to:
              </p>
              <ul className="list-disc pl-6 text-[#a1a1aa] space-y-2">
                <li>Provide, maintain, and improve the Service</li>
                <li>Process invoices and payments on your behalf</li>
                <li>Send invoices, contracts, and payment notifications</li>
                <li>
                  Communicate with you about updates, features, and support
                </li>
                <li>Detect and prevent fraud or abuse</li>
                <li>Comply with legal obligations</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4 text-[#10b981]">
                4. Data Storage and Security
              </h2>
              <h3 className="text-lg font-semibold mb-2 text-white">
                4.1 Supabase Database
              </h3>
              <p className="text-[#a1a1aa] leading-relaxed mb-4">
                Your data is stored securely using Supabase, a PostgreSQL-based
                database platform. We implement Row Level Security (RLS) to
                ensure that users can only access their own data. All data is
                encrypted in transit using TLS/SSL.
              </p>

              <h3 className="text-lg font-semibold mb-2 text-white">
                4.2 Authentication
              </h3>
              <p className="text-[#a1a1aa] leading-relaxed mb-4">
                We use Supabase Auth for secure user authentication. Passwords
                are never stored in plain text and are hashed using industry-
                standard encryption.
              </p>

              <h3 className="text-lg font-semibold mb-2 text-white">
                4.3 Data Retention
              </h3>
              <p className="text-[#a1a1aa] leading-relaxed">
                We retain your data for as long as your account is active or as
                needed to provide the Service. You may request deletion of your
                data at any time by contacting us at hello@getpaidly.co.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4 text-[#10b981]">
                5. Payment Processing
              </h2>
              <p className="text-[#a1a1aa] leading-relaxed mb-4">
                Payment processing is handled by Flutterwave, a third-party
                payment gateway. When clients pay invoices through Paidly,
                payment details are processed directly by Flutterwave and are
                not stored on our servers.
              </p>
              <p className="text-[#a1a1aa] leading-relaxed mb-4">
                Flutterwave is PCI DSS compliant and adheres to industry
                standards for payment security. We recommend reviewing
                Flutterwave's Privacy Policy at flutterwave.com for more
                information on how they handle payment data.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4 text-[#10b981]">
                6. Email Communication
              </h2>
              <p className="text-[#a1a1aa] leading-relaxed mb-4">
                We use Resend to send transactional emails, including:
              </p>
              <ul className="list-disc pl-6 text-[#a1a1aa] space-y-2 mb-4">
                <li>Invoice delivery notifications</li>
                <li>Payment confirmations</li>
                <li>Contract signature requests</li>
                <li>Account-related communications</li>
              </ul>
              <p className="text-[#a1a1aa] leading-relaxed">
                Email addresses are processed in accordance with Resend's
                privacy practices. You can review their policy at resend.com.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4 text-[#10b981]">
                7. Cookies and Tracking
              </h2>
              <p className="text-[#a1a1aa] leading-relaxed mb-4">
                We use essential cookies and similar technologies to:
              </p>
              <ul className="list-disc pl-6 text-[#a1a1aa] space-y-2 mb-4">
                <li>Maintain your session and authentication state</li>
                <li>Remember your preferences</li>
                <li>Analyze usage patterns to improve the Service</li>
              </ul>
              <p className="text-[#a1a1aa] leading-relaxed">
                You can control cookie preferences through your browser
                settings. Note that disabling cookies may affect the
                functionality of the Service.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4 text-[#10b981]">
                8. Third-Party Services
              </h2>
              <p className="text-[#a1a1aa] leading-relaxed mb-4">
                Paidly integrates with the following third-party services:
              </p>
              <ul className="list-disc pl-6 text-[#a1a1aa] space-y-2">
                <li>
                  <strong>Supabase</strong> — Database and authentication
                </li>
                <li>
                  <strong>Flutterwave</strong> — Payment processing
                </li>
                <li>
                  <strong>Resend</strong> — Email delivery
                </li>
                <li>
                  <strong>Paystack</strong> — Alternative payment processing
                  (optional)
                </li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4 text-[#10b981]">
                9. Your Rights
              </h2>
              <p className="text-[#a1a1aa] leading-relaxed mb-4">
                Depending on your location, you may have the following rights:
              </p>
              <ul className="list-disc pl-6 text-[#a1a1aa] space-y-2 mb-4">
                <li>
                  <strong>Access:</strong> Request a copy of your personal data
                </li>
                <li>
                  <strong>Correction:</strong> Update or correct inaccurate data
                </li>
                <li>
                  <strong>Deletion:</strong> Request deletion of your account
                  and data
                </li>
                <li>
                  <strong>Portability:</strong> Export your data in a
                  machine-readable format
                </li>
                <li>
                  <strong>Restriction:</strong> Limit how we process your data
                </li>
                <li>
                  <strong>Objection:</strong> Object to certain data processing
                  activities
                </li>
              </ul>
              <p className="text-[#a1a1aa] leading-relaxed">
                To exercise any of these rights, contact us at{" "}
                <a
                  href="mailto:hello@getpaidly.co"
                  className="text-[#10b981] hover:underline"
                >
                  hello@getpaidly.co
                </a>
                . We will respond within 30 days.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4 text-[#10b981]">
                10. Data Protection
              </h2>
              <p className="text-[#a1a1aa] leading-relaxed">
                We implement appropriate technical and organizational measures
                to protect your personal data against unauthorized access,
                alteration, disclosure, or destruction. However, no method of
                transmission over the Internet is 100% secure, and we cannot
                guarantee absolute security.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4 text-[#10b981]">
                11. Children's Privacy
              </h2>
              <p className="text-[#a1a1aa] leading-relaxed">
                Paidly is not intended for individuals under the age of 18. We
                do not knowingly collect personal information from children. If
                you believe we have collected data from a child, please contact
                us immediately.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4 text-[#10b981]">
                12. Changes to This Policy
              </h2>
              <p className="text-[#a1a1aa] leading-relaxed">
                We may update this Privacy Policy from time to time. We will
                notify you of significant changes by posting the new policy on
                this page and updating the "Last updated" date. We encourage you
                to review this policy periodically.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4 text-[#10b981]">
                13. Contact Us
              </h2>
              <p className="text-[#a1a1aa] leading-relaxed mb-4">
                If you have questions about this Privacy Policy or our data
                practices, please contact us:
              </p>
              <div className="text-[#a1a1aa] space-y-2">
                <p>
                  <strong className="text-white">Email:</strong>{" "}
                  <a
                    href="mailto:hello@getpaidly.co"
                    className="text-[#10b981] hover:underline"
                  >
                    hello@getpaidly.co
                  </a>
                </p>
                <p>
                  <strong className="text-white">Website:</strong>{" "}
                  <a
                    href="https://getpaidly.co"
                    className="text-[#10b981] hover:underline"
                  >
                    getpaidly.co
                  </a>
                </p>
              </div>
            </section>
          </div>
        </div>
      </main>

      {/* FOOTER */}
      <footer className="border-t border-[#27272a] py-8 px-4 sm:px-6">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex flex-col sm:flex-row items-center gap-4">
            <span className="text-lg font-bold text-[#10b981]">Paidly</span>
            <span className="text-sm text-[#a1a1aa]">
              © 2026 Paidly. Built for freelancers.
            </span>
          </div>

          <div className="flex items-center gap-6">
            <Link href="/privacy" className="text-sm text-white font-medium">
              Privacy Policy
            </Link>
            <Link
              href="/terms"
              className="text-sm text-[#a1a1aa] hover:text-white transition-colors"
            >
              Terms of Service
            </Link>
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
