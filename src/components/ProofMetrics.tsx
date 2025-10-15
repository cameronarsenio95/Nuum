import { useEffect, useRef, useState } from 'react';

const metrics = [
  {
    label: 'Avg. time saved on reporting',
    value: 8.5,
    suffix: 'h/week',
  },
  {
    label: 'Higher conversion from UGC vs static',
    value: 2.3,
    suffix: 'x',
  },
  {
    label: 'Faster campaign approvals',
    value: 65,
    suffix: '%',
  },
];

function AnimatedCounter({ value, suffix }: { value: number; suffix: string }) {
  const [count, setCount] = useState(0);
  const [hasAnimated, setHasAnimated] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !hasAnimated) {
          setHasAnimated(true);
          const duration = 2000;
          const steps = 60;
          const increment = value / steps;
          let current = 0;

          const timer = setInterval(() => {
            current += increment;
            if (current >= value) {
              setCount(value);
              clearInterval(timer);
            } else {
              setCount(current);
            }
          }, duration / steps);

          return () => clearInterval(timer);
        }
      },
      { threshold: 0.3 }
    );

    if (ref.current) {
      observer.observe(ref.current);
    }

    return () => observer.disconnect();
  }, [value, hasAnimated]);

  return (
    <div ref={ref} className="text-4xl font-medium dark:text-linear-accent light:text-linear-light-accent">
      {count.toFixed(1)}
      {suffix}
    </div>
  );
}

export function ProofMetrics() {
  return (
    <section className="py-20 px-6">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="mb-4">Make creator marketing measurable</h2>
          <p className="text-lg max-w-2xl mx-auto dark:text-text-secondary light:text-text-light-secondary">
            Real metrics from teams using UGC System to streamline their creator workflows
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
          {metrics.map((metric, index) => (
            <div
              key={index}
              className="border rounded-linear-lg p-8 text-center linear-transition dark:bg-linear-bg-secondary dark:border-linear-border-subtle dark:hover:border-linear-border light:bg-white light:border-linear-light-border light:hover:border-linear-light-border"
            >
              <AnimatedCounter value={metric.value} suffix={metric.suffix} />
              <p className="mt-4 dark:text-text-secondary light:text-text-light-secondary">{metric.label}</p>
            </div>
          ))}
        </div>

        <p className="text-center text-xs mt-6 max-w-3xl mx-auto dark:text-text-secondary light:text-text-light-secondary">
          Benchmarks from aggregated UGC System workspaces. Results vary.
        </p>
      </div>
    </section>
  );
}
