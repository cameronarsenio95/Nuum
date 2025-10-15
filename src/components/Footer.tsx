import { Linkedin, Twitter } from 'lucide-react';

interface FooterProps {
  onPrivacyClick?: () => void;
  onTermsClick?: () => void;
}

export function Footer({ onPrivacyClick, onTermsClick }: FooterProps) {
  return (
    <footer className="border-t py-16 px-6 dark:border-linear-border-subtle light:border-linear-light-border-subtle">
      <div className="max-w-7xl mx-auto">
        <div className="grid md:grid-cols-4 gap-12 mb-12">
          <div>
            <div className="flex items-center mb-4">
              <span className="text-base font-medium dark:text-text-primary light:text-text-light-primary">NUUM</span>
            </div>
            <p className="text-sm dark:text-text-secondary light:text-text-light-secondary">
              Built for brands that grow through creators.
            </p>
          </div>

          <div>
            <h4 className="font-medium mb-4 text-sm dark:text-text-primary light:text-text-light-primary">Product</h4>
            <ul className="space-y-2 text-sm dark:text-text-secondary light:text-text-light-secondary">
              <li><a href="#features" className="linear-transition dark:hover:text-text-primary light:hover:text-text-light-primary">Features</a></li>
              <li><a href="#pricing" className="linear-transition dark:hover:text-text-primary light:hover:text-text-light-primary">Pricing</a></li>
              <li><a href="#how-it-works" className="linear-transition dark:hover:text-text-primary light:hover:text-text-light-primary">How It Works</a></li>
            </ul>
          </div>

          <div>
            <h4 className="font-medium mb-4 text-sm dark:text-text-primary light:text-text-light-primary">Company</h4>
            <ul className="space-y-2 text-sm dark:text-text-secondary light:text-text-light-secondary">
              <li><a href="#" className="linear-transition dark:hover:text-text-primary light:hover:text-text-light-primary">About</a></li>
              <li><a href="#" className="linear-transition dark:hover:text-text-primary light:hover:text-text-light-primary">Demo</a></li>
              <li><a href="#" className="linear-transition dark:hover:text-text-primary light:hover:text-text-light-primary">Login</a></li>
            </ul>
          </div>

          <div>
            <h4 className="font-medium mb-4 text-sm dark:text-text-primary light:text-text-light-primary">Connect</h4>
            <div className="flex gap-4">
              <a href="#" className="w-10 h-10 rounded-linear flex items-center justify-center linear-transition dark:bg-linear-bg-secondary dark:hover:bg-linear-bg-subtle light:bg-linear-light-bg-secondary light:hover:bg-linear-light-bg-subtle">
                <Linkedin className="w-4 h-4 dark:text-text-primary light:text-text-light-primary" strokeWidth={2} />
              </a>
              <a href="#" className="w-10 h-10 rounded-linear flex items-center justify-center linear-transition dark:bg-linear-bg-secondary dark:hover:bg-linear-bg-subtle light:bg-linear-light-bg-secondary light:hover:bg-linear-light-bg-subtle">
                <Twitter className="w-4 h-4 dark:text-text-primary light:text-text-light-primary" strokeWidth={2} />
              </a>
            </div>
            <div className="mt-6">
              <select className="border rounded-linear px-3 py-2 text-sm linear-transition dark:bg-linear-bg-secondary dark:border-linear-border-subtle dark:hover:border-linear-border dark:text-text-primary light:bg-linear-light-bg-secondary light:border-linear-light-border-subtle light:hover:border-linear-light-border light:text-text-light-primary">
                <option>EN</option>
                <option>NL</option>
                <option>DE</option>
              </select>
            </div>
          </div>
        </div>

        <div className="pt-8 border-t flex flex-col md:flex-row items-center justify-between gap-4 dark:border-linear-border-subtle light:border-linear-light-border-subtle">
          <div className="text-sm text-center md:text-left dark:text-text-secondary light:text-text-light-secondary">
            © 2025 NUUM · All rights reserved · Built for brands that grow through creators.
          </div>
          <div className="flex gap-6 text-sm dark:text-text-secondary light:text-text-light-secondary">
            {onPrivacyClick && (
              <button
                onClick={onPrivacyClick}
                className="linear-transition dark:hover:text-text-primary light:hover:text-text-light-primary"
              >
                Privacy Policy
              </button>
            )}
            {onTermsClick && (
              <button
                onClick={onTermsClick}
                className="linear-transition dark:hover:text-text-primary light:hover:text-text-light-primary"
              >
                Terms of Service
              </button>
            )}
          </div>
        </div>
      </div>
    </footer>
  );
}
