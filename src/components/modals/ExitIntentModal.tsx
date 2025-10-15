import { X, ArrowRight } from 'lucide-react';
import { useState } from 'react';

interface ExitIntentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSignup: () => void;
}

export function ExitIntentModal({ isOpen, onClose, onSignup }: ExitIntentModalProps) {
  const [email, setEmail] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (window.UGC?.track) {
      window.UGC.track('exit_intent_submit');
    }
    onSignup();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="border rounded-linear-lg max-w-md w-full p-8 relative animate-slide-up dark:bg-linear-bg-secondary dark:border-linear-border light:bg-linear-light-bg-secondary light:border-linear-light-border">
        <button
          onClick={onClose}
          className="absolute top-6 right-6 linear-transition dark:text-text-secondary dark:hover:text-text-primary light:text-text-light-secondary light:hover:text-text-light-primary"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="text-center mb-6">
          <h3 className="text-2xl font-medium mb-3 dark:text-text-primary light:text-text-light-primary">Wait! Before you go...</h3>
          <p className="dark:text-text-secondary light:text-text-light-secondary">
            Get early access and join 200+ brands already organizing their creator workflows with UGC System.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-3 border rounded-linear text-sm focus:outline-none linear-transition dark:bg-linear-bg dark:border-linear-border-subtle dark:focus:border-linear-border dark:text-text-primary dark:placeholder:text-text-tertiary light:bg-linear-light-bg light:border-linear-light-border-subtle light:focus:border-linear-light-border light:text-text-light-primary light:placeholder:text-text-light-tertiary"
              placeholder="you@company.com"
              required
            />
          </div>

          <button
            type="submit"
            className="w-full py-3 rounded-linear text-sm font-medium linear-transition inline-flex items-center justify-center gap-2 dark:bg-linear-accent dark:hover:bg-linear-accent-hover dark:text-linear-bg light:bg-linear-light-accent light:hover:bg-linear-light-accent-hover light:text-linear-light-bg"
          >
            Start Free Trial
            <ArrowRight className="w-4 h-4" />
          </button>

          <p className="text-xs text-center dark:text-text-tertiary light:text-text-light-tertiary">
            14 days free. No credit card required.
          </p>
        </form>
      </div>
    </div>
  );
}
