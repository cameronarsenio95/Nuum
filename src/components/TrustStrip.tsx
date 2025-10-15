import { ArrowRight } from 'lucide-react';

interface TrustStripProps {
  onSignupClick: () => void;
}

export function TrustStrip({ onSignupClick }: TrustStripProps) {
  return (
    <section className="py-24 px-6 border-t dark:bg-linear-bg-secondary dark:border-linear-border-subtle light:bg-white light:border-linear-light-border">
      <div className="max-w-4xl mx-auto text-center">
        <h2 className="mb-4 text-balance">
          Build your creator system today.
        </h2>
        <p className="text-lg mb-8 max-w-2xl mx-auto text-balance dark:text-text-secondary light:text-text-light-secondary">
          Organize every influencer, campaign, and piece of content — all in one clean workspace.
        </p>
        <button
          onClick={onSignupClick}
          className="group px-6 py-3 rounded-linear text-sm font-medium linear-transition inline-flex items-center gap-2 dark:bg-linear-accent dark:hover:bg-linear-accent-hover dark:hover:shadow-lg dark:hover:shadow-linear-accent/20 dark:text-linear-bg light:bg-linear-light-accent light:hover:bg-linear-light-accent-hover light:hover:shadow-lg light:hover:shadow-linear-light-accent/20 light:text-linear-light-bg"
        >
          Start Free
          <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 linear-transition" strokeWidth={2} />
        </button>
      </div>
    </section>
  );
}
