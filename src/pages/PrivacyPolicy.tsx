import { ArrowLeft } from 'lucide-react';
import { Header } from '../components/Header';
import { Footer } from '../components/Footer';

interface PrivacyPolicyProps {
  onBackClick: () => void;
  onLoginClick: () => void;
  onSignupClick: () => void;
  onPricingClick: () => void;
  onResourcesClick: () => void;
  onHowItWorksClick: () => void;
}

export function PrivacyPolicy({
  onBackClick,
  onLoginClick,
  onSignupClick,
  onPricingClick,
  onResourcesClick,
  onHowItWorksClick,
}: PrivacyPolicyProps) {
  return (
    <div className="min-h-screen">
      <Header
        onLoginClick={onLoginClick}
        onSignupClick={onSignupClick}
        onHowItWorksClick={onHowItWorksClick}
        onPricingClick={onPricingClick}
        onResourcesClick={onResourcesClick}
        onBackClick={onBackClick}
      />

      <div className="pt-32 pb-20 px-4 md:px-6">
        <div className="max-w-4xl mx-auto">
          <button
            onClick={onBackClick}
            className="flex items-center gap-2 mb-8 linear-transition dark:text-text-secondary dark:hover:text-text-primary light:text-text-light-secondary light:hover:text-text-light-primary"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="text-sm">Back</span>
          </button>

          <h1 className="text-4xl md:text-5xl font-semibold mb-6 dark:text-text-primary light:text-text-light-primary">
            Privacy Policy
          </h1>

          <p className="text-sm mb-12 dark:text-text-tertiary light:text-text-light-tertiary">
            Last updated: {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
          </p>

          <div className="space-y-8 dark:text-text-secondary light:text-text-light-secondary">
            <section>
              <h2 className="text-2xl font-semibold mb-4 dark:text-text-primary light:text-text-light-primary">
                1. Introduction
              </h2>
              <p className="leading-relaxed">
                NUUM ("we," "our," or "us") is committed to protecting your privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our creator management platform.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4 dark:text-text-primary light:text-text-light-primary">
                2. Information We Collect
              </h2>
              <p className="leading-relaxed mb-4">We collect information that you provide directly to us, including:</p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>Account information (name, email, password)</li>
                <li>Company information</li>
                <li>Creator data you input into the platform</li>
                <li>Campaign and content information</li>
                <li>Payment and billing information</li>
                <li>Communications with our support team</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4 dark:text-text-primary light:text-text-light-primary">
                3. How We Use Your Information
              </h2>
              <p className="leading-relaxed mb-4">We use the information we collect to:</p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>Provide, maintain, and improve our services</li>
                <li>Process transactions and send related information</li>
                <li>Send technical notices and support messages</li>
                <li>Respond to your comments and questions</li>
                <li>Analyze usage patterns and trends</li>
                <li>Detect and prevent fraud and abuse</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4 dark:text-text-primary light:text-text-light-primary">
                4. Data Security
              </h2>
              <p className="leading-relaxed">
                We implement appropriate technical and organizational measures to protect your personal data against unauthorized or unlawful processing, accidental loss, destruction, or damage. All data is encrypted in transit and at rest using industry-standard encryption protocols.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4 dark:text-text-primary light:text-text-light-primary">
                5. Data Retention
              </h2>
              <p className="leading-relaxed">
                We retain your information for as long as your account is active or as needed to provide you services. You may request deletion of your account and associated data at any time by contacting us.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4 dark:text-text-primary light:text-text-light-primary">
                6. Your Rights
              </h2>
              <p className="leading-relaxed mb-4">Depending on your location, you may have the following rights:</p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>Access your personal data</li>
                <li>Correct inaccurate data</li>
                <li>Request deletion of your data</li>
                <li>Object to processing of your data</li>
                <li>Request data portability</li>
                <li>Withdraw consent</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4 dark:text-text-primary light:text-text-light-primary">
                7. Cookies and Tracking
              </h2>
              <p className="leading-relaxed">
                We use cookies and similar tracking technologies to track activity on our platform and hold certain information. You can instruct your browser to refuse all cookies or to indicate when a cookie is being sent.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4 dark:text-text-primary light:text-text-light-primary">
                8. Third-Party Services
              </h2>
              <p className="leading-relaxed">
                We use third-party services (such as Supabase for database hosting) that may collect information used to identify you. These third parties have their own privacy policies addressing how they use such information.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4 dark:text-text-primary light:text-text-light-primary">
                9. International Data Transfers
              </h2>
              <p className="leading-relaxed">
                Your information may be transferred to and maintained on computers located outside of your state, province, country, or other governmental jurisdiction where data protection laws may differ.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4 dark:text-text-primary light:text-text-light-primary">
                10. Changes to This Policy
              </h2>
              <p className="leading-relaxed">
                We may update our Privacy Policy from time to time. We will notify you of any changes by posting the new Privacy Policy on this page and updating the "Last updated" date.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4 dark:text-text-primary light:text-text-light-primary">
                11. Contact Us
              </h2>
              <p className="leading-relaxed">
                If you have any questions about this Privacy Policy, please contact us at:{' '}
                <a
                  href="mailto:privacy@nuum.app"
                  className="dark:text-linear-accent light:text-text-light-link hover:underline"
                >
                  privacy@nuum.app
                </a>
              </p>
            </section>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}
