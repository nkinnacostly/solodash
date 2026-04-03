import Link from "next/link";

export default function TermsOfService() {
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
            Terms of Service
          </h1>
          <p className="text-[#a1a1aa] mb-12">Last updated: April 2026</p>

          <div className="space-y-12">
            <section>
              <h2 className="text-2xl font-semibold mb-4 text-[#10b981]">
                1. Agreement to Terms
              </h2>
              <p className="text-[#a1a1aa] leading-relaxed mb-4">
                By accessing or using Paidly (the "Service"), operated by
                Paidly ("we," "our," or "us"), you agree to be bound by these
                Terms of Service ("Terms"). If you disagree with any part of
                these terms, you may not access the Service.
              </p>
              <p className="text-[#a1a1aa] leading-relaxed">
                These Terms apply to all visitors, users, and others who access
                or use the Service at getpaidly.co.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4 text-[#10b981]">
                2. Description of Service
              </h2>
              <p className="text-[#a1a1aa] leading-relaxed mb-4">
                Paidly is a SaaS platform that provides freelance business
                management tools, including but not limited to:
              </p>
              <ul className="list-disc pl-6 text-[#a1a1aa] space-y-2">
                <li>Invoice creation and management</li>
                <li>Contract generation and e-signature</li>
                <li>Earnings tracking and reporting</li>
                <li>Tax export and income summaries</li>
                <li>Payment processing via Flutterwave/Paystack</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4 text-[#10b981]">
                3. Account Registration
              </h2>
              <h3 className="text-lg font-semibold mb-2 text-white">
                3.1 Account Creation
              </h3>
              <p className="text-[#a1a1aa] leading-relaxed mb-4">
                To use Paidly, you must create an account by providing
                accurate and complete information. You must be at least 18 years
                old to use this Service.
              </p>

              <h3 className="text-lg font-semibold mb-2 text-white">
                3.2 Account Security
              </h3>
              <p className="text-[#a1a1aa] leading-relaxed mb-4">
                You are responsible for safeguarding your account credentials
                and for all activities that occur under your account. You must
                notify us immediately of any unauthorized use or security
                breach.
              </p>

              <h3 className="text-lg font-semibold mb-2 text-white">
                3.3 One Account Per User
              </h3>
              <p className="text-[#a1a1aa] leading-relaxed">
                Each user may only maintain one account. Creating multiple
                accounts to circumvent plan limitations is prohibited and may
                result in account suspension.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4 text-[#10b981]">
                4. Plans and Pricing
              </h2>

              <h3 className="text-lg font-semibold mb-2 text-white">
                4.1 Free Plan
              </h3>
              <p className="text-[#a1a1aa] leading-relaxed mb-4">
                The Free plan includes:
              </p>
              <ul className="list-disc pl-6 text-[#a1a1aa] space-y-2 mb-6">
                <li>Up to 3 invoices per month</li>
                <li>Up to 1 contract per month</li>
                <li>Basic earnings view</li>
                <li>Standard email support</li>
              </ul>

              <h3 className="text-lg font-semibold mb-2 text-white">
                4.2 Pro Plan
              </h3>
              <p className="text-[#a1a1aa] leading-relaxed mb-4">
                The Pro plan ($9/month or $79/year) includes:
              </p>
              <ul className="list-disc pl-6 text-[#a1a1aa] space-y-2 mb-6">
                <li>Unlimited invoices and contracts</li>
                <li>Payment processing via Flutterwave</li>
                <li>Tax export functionality</li>
                <li>Custom branding options</li>
                <li>Priority support</li>
              </ul>

              <h3 className="text-lg font-semibold mb-2 text-white">
                4.3 Payment Terms
              </h3>
              <ul className="list-disc pl-6 text-[#a1a1aa] space-y-2">
                <li>
                  Pro subscriptions are billed monthly or annually in advance
                </li>
                <li>
                  Payments are processed via Flutterwave or Paystack using your
                  preferred payment method
                </li>
                <li>
                  Annual subscriptions receive a 27% discount ($79/year vs
                  $108/year)
                </li>
                <li>
                  You may upgrade, downgrade, or cancel your subscription at any
                  time
                </li>
                <li>
                  Downgrades take effect at the end of your current billing
                  period
                </li>
                <li>No refunds are provided for partial billing periods</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4 text-[#10b981]">
                5. Acceptable Use
              </h2>
              <p className="text-[#a1a1aa] leading-relaxed mb-4">
                You agree not to use the Service to:
              </p>
              <ul className="list-disc pl-6 text-[#a1a1aa] space-y-2">
                <li>
                  Violate any applicable local, state, national, or
                  international law
                </li>
                <li>Send fraudulent invoices or create fake client records</li>
                <li>Distribute malware, spam, or harmful content</li>
                <li>
                  Attempt to gain unauthorized access to other users' accounts
                  or our systems
                </li>
                <li>
                  Use the Service for money laundering or illegal financial
                  activities
                </li>
                <li>
                  Resell, redistribute, or sublicense the Service without
                  permission
                </li>
                <li>Impersonate another person or entity</li>
                <li>Overload or disrupt the Service's infrastructure</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4 text-[#10b981]">
                6. User Content and Data
              </h2>
              <h3 className="text-lg font-semibold mb-2 text-white">
                6.1 Ownership
              </h3>
              <p className="text-[#a1a1aa] leading-relaxed mb-4">
                You retain all rights to the content you create using Paidly,
                including invoices, contracts, and client data. We do not claim
                ownership of your content.
              </p>

              <h3 className="text-lg font-semibold mb-2 text-white">
                6.2 License to Us
              </h3>
              <p className="text-[#a1a1aa] leading-relaxed mb-4">
                By using the Service, you grant us a limited license to host,
                store, and process your content solely for the purpose of
                providing the Service to you.
              </p>

              <h3 className="text-lg font-semibold mb-2 text-white">
                6.3 Data Accuracy
              </h3>
              <p className="text-[#a1a1aa] leading-relaxed">
                You are responsible for the accuracy of the information you
                enter into the Service. Paidly does not verify the correctness
                of invoice amounts, contract terms, or client details.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4 text-[#10b981]">
                7. Payment Processing
              </h2>
              <p className="text-[#a1a1aa] leading-relaxed mb-4">
                Paidly integrates with Flutterwave and Paystack to facilitate
                payments. By using these payment features, you agree to their
                respective terms of service.
              </p>
              <p className="text-[#a1a1aa] leading-relaxed mb-4">
                We do not store or process payment card information. All payment
                details are handled securely by our payment processors.
              </p>
              <p className="text-[#a1a1aa] leading-relaxed">
                Transaction fees may apply and will be clearly disclosed at the
                point of payment. These fees are charged by the payment
                processor, not by Paidly.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4 text-[#10b981]">
                8. Intellectual Property
              </h2>
              <p className="text-[#a1a1aa] leading-relaxed mb-4">
                The Service and its original content, features, and
                functionality are and will remain the exclusive property of
                Paidly and its licensors. The Service is protected by
                copyright, trademark, and other laws.
              </p>
              <p className="text-[#a1a1aa] leading-relaxed">
                Our trademarks and trade dress may not be used in connection
                with any product or service without our prior written consent.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4 text-[#10b981]">
                9. Termination
              </h2>
              <p className="text-[#a1a1aa] leading-relaxed mb-4">
                We may terminate or suspend your account immediately, without
                prior notice or liability, for any reason, including if you
                breach these Terms.
              </p>
              <p className="text-[#a1a1aa] leading-relaxed mb-4">
                Upon termination, your right to use the Service will cease
                immediately. You may request an export of your data before
                account deletion by contacting hello@getpaidly.co.
              </p>
              <p className="text-[#a1a1aa] leading-relaxed">
                All provisions of these Terms which by their nature should
                survive termination shall survive, including ownership
                provisions, warranty disclaimers, and limitations of liability.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4 text-[#10b981]">
                10. Disclaimers and Limitation of Liability
              </h2>
              <h3 className="text-lg font-semibold mb-2 text-white">
                10.1 No Warranty
              </h3>
              <p className="text-[#a1a1aa] leading-relaxed mb-4">
                The Service is provided on an "AS IS" and "AS AVAILABLE" basis.
                Paidly makes no warranties, expressed or implied, including
                but not limited to:
              </p>
              <ul className="list-disc pl-6 text-[#a1a1aa] space-y-2 mb-6">
                <li>
                  The Service will be uninterrupted, secure, or error-free
                </li>
                <li>
                  The accuracy or reliability of any results or data obtained
                </li>
                <li>
                  The quality of any products, services, or information
                  purchased or obtained
                </li>
              </ul>

              <h3 className="text-lg font-semibold mb-2 text-white">
                10.2 Limitation of Liability
              </h3>
              <p className="text-[#a1a1aa] leading-relaxed mb-4">
                In no event shall Paidly, its directors, employees, or agents
                be liable for any indirect, incidental, special, consequential,
                or punitive damages, including but not limited to:
              </p>
              <ul className="list-disc pl-6 text-[#a1a1aa] space-y-2 mb-6">
                <li>Loss of profits, data, or business opportunities</li>
                <li>Service interruption or data loss</li>
                <li>Unauthorized access to your data</li>
                <li>Client disputes over invoices or contracts</li>
                <li>Tax filing errors or penalties</li>
              </ul>
              <p className="text-[#a1a1aa] leading-relaxed mb-4">
                Our total liability shall not exceed the amount you paid us in
                the 12 months preceding the claim, or $100 if you used the Free
                plan.
              </p>

              <h3 className="text-lg font-semibold mb-2 text-white">
                10.3 Tax Advice Disclaimer
              </h3>
              <p className="text-[#a1a1aa] leading-relaxed">
                Paidly provides income tracking and export features for
                convenience only. We do not provide tax advice or guarantee
                compliance with tax laws. Consult a qualified tax professional
                for tax-related matters.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4 text-[#10b981]">
                11. Indemnification
              </h2>
              <p className="text-[#a1a1aa] leading-relaxed">
                You agree to indemnify and hold harmless Paidly and its
                officers, directors, employees, and agents from any claims,
                liabilities, damages, losses, and expenses (including legal
                fees) arising from your use of the Service, violation of these
                Terms, or infringement of any third-party rights.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4 text-[#10b981]">
                12. Service Modifications
              </h2>
              <p className="text-[#a1a1aa] leading-relaxed mb-4">
                We reserve the right to modify or discontinue the Service (or
                any part thereof) at any time, with or without notice.
              </p>
              <p className="text-[#a1a1aa] leading-relaxed">
                We may also adjust pricing for paid plans with 30 days' notice.
                Existing subscriptions will continue at current rates until the
                end of the billing cycle.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4 text-[#10b981]">
                13. Governing Law
              </h2>
              <p className="text-[#a1a1aa] leading-relaxed mb-4">
                These Terms shall be governed by and construed in accordance
                with the laws of the Federal Republic of Nigeria, without regard
                to its conflict of law provisions.
              </p>
              <p className="text-[#a1a1aa] leading-relaxed mb-4">
                Any disputes arising from these Terms or the Service shall be
                subject to the exclusive jurisdiction of the courts in Lagos,
                Nigeria.
              </p>
              <p className="text-[#a1a1aa] leading-relaxed">
                If you are using the Service from outside Nigeria, you are
                responsible for compliance with your local laws and regulations.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4 text-[#10b981]">
                14. Dispute Resolution
              </h2>
              <p className="text-[#a1a1aa] leading-relaxed mb-4">
                We encourage you to contact us first to resolve any disputes
                informally. If we cannot resolve a dispute within 30 days, both
                parties agree to pursue mediation before initiating formal legal
                proceedings.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4 text-[#10b981]">
                15. Changes to Terms
              </h2>
              <p className="text-[#a1a1aa] leading-relaxed mb-4">
                We reserve the right to update or modify these Terms at any
                time. We will notify users of material changes by:
              </p>
              <ul className="list-disc pl-6 text-[#a1a1aa] space-y-2 mb-4">
                <li>Posting the updated Terms on this page</li>
                <li>Sending an email notification to registered users</li>
                <li>Displaying a notice within the Service</li>
              </ul>
              <p className="text-[#a1a1aa] leading-relaxed">
                Your continued use of the Service after changes constitutes
                acceptance of the new Terms.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4 text-[#10b981]">
                16. Contact Information
              </h2>
              <p className="text-[#a1a1aa] leading-relaxed mb-4">
                For questions about these Terms, please contact us:
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
            <Link
              href="/privacy"
              className="text-sm text-[#a1a1aa] hover:text-white transition-colors"
            >
              Privacy Policy
            </Link>
            <Link href="/terms" className="text-sm text-white font-medium">
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
