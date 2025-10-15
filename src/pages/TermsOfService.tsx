import { ArrowLeft } from 'lucide-react';
import { Header } from '../components/Header';
import { Footer } from '../components/Footer';

interface TermsOfServiceProps {
  onBackClick: () => void;
  onLoginClick: () => void;
  onSignupClick: () => void;
  onPricingClick: () => void;
  onResourcesClick: () => void;
  onHowItWorksClick: () => void;
}

export function TermsOfService({
  onBackClick,
  onLoginClick,
  onSignupClick,
  onPricingClick,
  onResourcesClick,
  onHowItWorksClick,
}: TermsOfServiceProps) {
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
            Terms of Service
          </h1>

          <p className="text-sm mb-12 dark:text-text-tertiary light:text-text-light-tertiary">
            Last updated: {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
          </p>

          <div className="space-y-8 dark:text-text-secondary light:text-text-light-secondary">
            <section>
              <h2 className="text-2xl font-semibold mb-4 dark:text-text-primary light:text-text-light-primary">
                1. Acceptance of Terms
              </h2>
              <p className="leading-relaxed">
                By accessing and using NUUM, you accept and agree to be bound by the terms and provisions of this agreement. If you do not agree to these Terms of Service, you should not access or use the platform.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4 dark:text-text-primary light:text-text-light-primary">
                2. Description of Service
              </h2>
              <p className="leading-relaxed">
                NUUM provides a creator management platform that helps brands and agencies centralize creator data, manage campaigns, and organize UGC content. We reserve the right to modify, suspend, or discontinue any aspect of the service at any time.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4 dark:text-text-primary light:text-text-light-primary">
                3. User Accounts
              </h2>
              <p className="leading-relaxed mb-4">When you create an account with us, you agree to:</p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>Provide accurate and complete information</li>
                <li>Maintain the security of your password</li>
                <li>Notify us immediately of any unauthorized access</li>
                <li>Accept responsibility for all activities under your account</li>
                <li>Use the service in compliance with all applicable laws</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4 dark:text-text-primary light:text-text-light-primary">
                4. Acceptable Use
              </h2>
              <p className="leading-relaxed mb-4">You agree not to:</p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>Use the service for any illegal purposes</li>
                <li>Violate any laws in your jurisdiction</li>
                <li>Infringe on intellectual property rights</li>
                <li>Transmit any malicious code or viruses</li>
                <li>Attempt to gain unauthorized access to our systems</li>
                <li>Interfere with or disrupt the service</li>
                <li>Harass, abuse, or harm other users</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4 dark:text-text-primary light:text-text-light-primary">
                5. Intellectual Property
              </h2>
              <p className="leading-relaxed">
                The service and its original content, features, and functionality are owned by NUUM and are protected by international copyright, trademark, patent, trade secret, and other intellectual property laws.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4 dark:text-text-primary light:text-text-light-primary">
                6. User Content
              </h2>
              <p className="leading-relaxed">
                You retain all rights to the content you upload to NUUM. By uploading content, you grant us a license to use, store, and display that content as necessary to provide the service.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4 dark:text-text-primary light:text-text-light-primary">
                7. Payment Terms
              </h2>
              <p className="leading-relaxed mb-4">For paid services:</p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>Payments are processed securely through our payment providers</li>
                <li>Subscriptions renew automatically unless cancelled</li>
                <li>Refunds are provided according to our refund policy</li>
                <li>You are responsible for all taxes</li>
                <li>Prices may change with 30 days notice</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4 dark:text-text-primary light:text-text-light-primary">
                8. Termination
              </h2>
              <p className="leading-relaxed">
                We may terminate or suspend your account immediately, without prior notice, for any breach of these Terms. Upon termination, your right to use the service will immediately cease.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4 dark:text-text-primary light:text-text-light-primary">
                9. Limitation of Liability
              </h2>
              <p className="leading-relaxed">
                NUUM shall not be liable for any indirect, incidental, special, consequential, or punitive damages resulting from your use or inability to use the service.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4 dark:text-text-primary light:text-text-light-primary">
                10. Disclaimer
              </h2>
              <p className="leading-relaxed">
                The service is provided "as is" and "as available" without warranties of any kind, either express or implied, including but not limited to implied warranties of merchantability and fitness for a particular purpose.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4 dark:text-text-primary light:text-text-light-primary">
                11. Changes to Terms
              </h2>
              <p className="leading-relaxed">
                We reserve the right to modify these terms at any time. We will notify users of any material changes via email or through the platform.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4 dark:text-text-primary light:text-text-light-primary">
                12. Contact Information
              </h2>
              <p className="leading-relaxed">
                For questions about these Terms, please contact us at:{' '}
                <a
                  href="mailto:legal@nuum.app"
                  className="dark:text-linear-accent light:text-text-light-link hover:underline"
                >
                  legal@nuum.app
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
