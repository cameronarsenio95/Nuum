import { ArrowRight } from 'lucide-react';
import { useEffect, useState } from 'react';

interface StickyMobileCTAProps {
  onSignupClick: () => void;
}

export function StickyMobileCTA({ onSignupClick }: StickyMobileCTAProps) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      // Show CTA after scrolling 300px
      if (window.scrollY > 300) {
        setIsVisible(true);
      } else {
        setIsVisible(false);
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <div
      className={`fixed bottom-0 left-0 right-0 z-50 md:hidden linear-transition ${
        isVisible ? 'translate-y-0 opacity-100' : 'translate-y-full opacity-0'
      }`}
    >
      <div className="bg-linear-bg/95 backdrop-blur-xl border-t border-linear-border-subtle p-4">
        <button
          onClick={onSignupClick}
          className="w-full py-3 bg-linear-accent hover:bg-linear-accent-hover rounded-linear text-sm font-medium linear-transition flex items-center justify-center gap-2 text-linear-bg"
        >
          Start Free
          <ArrowRight className="w-4 h-4" strokeWidth={2} />
        </button>
      </div>
    </div>
  );
}
