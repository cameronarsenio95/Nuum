import { Play, Users, FolderKanban, TrendingUp } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

interface MiniDemoProps {
  onDemoClick: () => void;
}

const demoSteps = [
  {
    step: 1,
    title: 'Connect creators',
    description: 'Import creators from campaigns, spreadsheets, or social platforms with all their stats in one place.',
    icon: Users,
  },
  {
    step: 2,
    title: 'Track campaigns',
    description: 'Monitor engagement in real-time with automatic analytics updates across all your collaborations.',
    icon: FolderKanban,
  },
  {
    step: 3,
    title: 'Report impact',
    description: 'Generate performance reports and share live dashboards showing exactly which creators drive results.',
    icon: TrendingUp,
  },
];

export function MiniDemo({ onDemoClick }: MiniDemoProps) {
  const [activeStep, setActiveStep] = useState<number | null>(null);
  const sectionRef = useRef<HTMLDivElement>(null);
  const [lineHeight, setLineHeight] = useState(0);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setLineHeight(100);
          }
        });
      },
      { threshold: 0.2 }
    );

    if (sectionRef.current) {
      observer.observe(sectionRef.current);
    }

    return () => observer.disconnect();
  }, []);

  return (
    <section id="how-it-works" ref={sectionRef} className="py-24 px-6 relative overflow-hidden dark:bg-linear-bg light:bg-linear-light-bg">
      <div className="max-w-7xl mx-auto relative">
        <div className="text-center mb-20">
          <h2 className="mb-4">See how it works</h2>
          <p className="text-lg dark:text-text-secondary light:text-text-light-secondary">Three steps to organized creator workflows</p>
        </div>

        <div className="relative max-w-6xl mx-auto">
          <div className="hidden md:block absolute top-[31px] left-0 right-0 h-px overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-transparent via-linear-border to-transparent transition-all duration-1500 ease-out"
              style={{ width: `${lineHeight}%` }}
            />
          </div>

          <div className="grid md:grid-cols-3 gap-8 md:gap-12">
            {demoSteps.map((step, index) => {
              const Icon = step.icon;
              const isActive = activeStep === step.step;

              return (
                <div
                  key={step.step}
                  className="relative group"
                  onMouseEnter={() => setActiveStep(step.step)}
                  onMouseLeave={() => setActiveStep(null)}
                  style={{
                    animation: `fadeInUp 0.6s ease-out ${0.2 * index}s both`
                  }}
                >
                  <div className="flex flex-col items-center">
                    <div className="relative z-10 mb-6">
                      <div className={`w-16 h-16 rounded-lg border-2 flex items-center justify-center transition-all duration-300 ${
                        isActive
                          ? 'bg-linear-accent border-linear-accent shadow-lg shadow-linear-accent/20'
                          : 'dark:bg-linear-bg-secondary light:bg-white border-linear-border-subtle group-hover:border-linear-border'
                      }`}>
                        <Icon
                          className={`w-7 h-7 transition-colors duration-300 ${
                            isActive ? 'text-linear-bg' : 'dark:text-text-secondary light:text-text-light-secondary group-hover:dark:text-text-primary light:text-text-light-primary'
                          }`}
                          strokeWidth={1.5}
                        />
                      </div>
                      <div className={`absolute -bottom-3 left-1/2 -translate-x-1/2 w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium transition-all duration-300 ${
                        isActive
                          ? 'bg-linear-accent text-linear-bg scale-110'
                          : 'bg-linear-bg-hover border border-linear-border-subtle dark:text-text-tertiary light:text-text-light-tertiary'
                      }`}>
                        {step.step}
                      </div>
                    </div>

                    <div className="w-full">
                      <div className={`p-6 rounded-lg border transition-all duration-300 ${
                        isActive
                          ? 'dark:bg-linear-bg-secondary light:bg-white border-linear-border shadow-lg hover:shadow-white/5'
                          : 'dark:bg-linear-bg-secondary light:bg-white border-linear-border-subtle group-hover:border-linear-border-hover hover:shadow-lg hover:shadow-white/5'
                      }`}>
                        <h3 className="text-lg font-medium mb-3 text-center">{step.title}</h3>
                        <p className="dark:text-text-secondary light:text-text-light-secondary text-sm leading-relaxed text-center">
                          {step.description}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="text-center mt-16">
          <button
            onClick={onDemoClick}
            className="group px-6 py-3 dark:bg-linear-bg-secondary light:bg-white hover:dark:bg-linear-bg-hover hover:light:bg-gray-50 border border-linear-border-subtle hover:border-linear-border rounded-lg text-sm font-medium linear-transition inline-flex items-center gap-2 shadow-lg hover:shadow-xl"
          >
            <Play className="w-4 h-4 group-hover:scale-110 transition-transform" strokeWidth={2} />
            Watch 90s Demo
          </button>
        </div>
      </div>

      <style>{`
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </section>
  );
}
