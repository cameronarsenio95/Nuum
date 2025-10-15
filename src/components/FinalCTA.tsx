import { ArrowRight } from 'lucide-react';

interface FinalCTAProps {
  onSignupClick: () => void;
  onHowItWorksClick: () => void;
}

export function FinalCTA({ onSignupClick, onHowItWorksClick }: FinalCTAProps) {
  return (
    <section className="py-12 md:py-20 px-4 md:px-6">
      <div className="max-w-4xl mx-auto text-center">
        <h2 className="text-2xl md:text-3xl lg:text-4xl font-semibold mb-3 md:mb-4 tracking-tight">Organize your creator world today.</h2>
        <p className="text-base md:text-lg mb-6 md:mb-8 max-w-2xl mx-auto dark:text-text-secondary light:text-text-light-secondary leading-relaxed">
          Start free and turn chaos into a clear, measurable workflow.
        </p>
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-center gap-3">
          <button
            onClick={onSignupClick}
            className="group px-6 py-3 sm:px-5 sm:py-2.5 rounded-md text-base sm:text-sm font-medium linear-transition inline-flex items-center justify-center gap-2 touch-manipulation active:scale-95 dark:bg-linear-accent dark:hover:bg-linear-accent-hover dark:hover:shadow-lg dark:hover:shadow-linear-accent/20 dark:text-linear-bg light:bg-linear-light-accent light:hover:bg-linear-light-accent-hover light:hover:shadow-lg light:hover:shadow-linear-light-accent/20 light:text-linear-light-bg"
          >
            Start Free
            <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 linear-transition" strokeWidth={2} />
          </button>
          <button
            onClick={onHowItWorksClick}
            className="px-6 py-3 sm:px-5 sm:py-2.5 border rounded-md text-base sm:text-sm font-medium linear-transition touch-manipulation active:scale-95 dark:bg-white/10 dark:hover:bg-white/15 dark:border-linear-border-subtle dark:hover:border-linear-border-hover light:bg-black/10 light:hover:bg-black/15 light:border-linear-light-border-subtle light:hover:border-linear-light-border-hover"
          >
            See How It Works
          </button>
        </div>
      </div>
    </section>
  );
}
