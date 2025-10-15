import { ArrowRight } from 'lucide-react';
import { useEffect, useState } from 'react';

interface StickyHeaderCTAProps {
  onSignupClick: () => void;
}

export function StickyHeaderCTA({ onSignupClick }: StickyHeaderCTAProps) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsVisible(window.scrollY > 600);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  if (!isVisible) return null;

  return (
    <div className="fixed top-20 left-0 right-0 z-40 px-6 py-3 bg-linear-bg-secondary/95 backdrop-blur-xl border-b border-linear-border-subtle animate-slide-down">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="text-sm font-medium">Start Free</span>
          <span className="text-xs text-text-secondary">• No credit card required</span>
        </div>
        <button
          onClick={onSignupClick}
          className="group px-4 py-2 bg-linear-accent hover:bg-linear-accent-hover rounded-linear text-sm font-medium linear-transition inline-flex items-center gap-2 text-linear-bg"
        >
          Start Free
          <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 linear-transition" strokeWidth={2} />
        </button>
      </div>
    </div>
  );
}
