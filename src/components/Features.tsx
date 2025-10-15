import { Users, BarChart3, FolderHeart } from 'lucide-react';

const features = [
  {
    icon: Users,
    title: 'Unified Creator Profiles',
    description: 'Every creator\'s stats, content, and contacts in one place. One source of truth.',
    link: '/how-it-works#creators',
  },
  {
    icon: BarChart3,
    title: 'Campaign Analytics',
    description: 'Track engagement, reach, and ROI across all collaborations. See who drives sales.',
    link: '/how-it-works#campaigns',
  },
  {
    icon: FolderHeart,
    title: 'UGC Library & Rights',
    description: 'Auto-collect, tag, and reuse UGC. Rights tracking built in.',
    link: '/how-it-works#ugc',
  },
];

export function Features() {
  return (
    <section id="features" className="py-12 md:py-20 px-4 md:px-6">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-8 md:mb-12">
          <h2 className="text-2xl md:text-3xl lg:text-4xl font-semibold mb-3 md:mb-4 tracking-tight">Everything you need in one platform</h2>
          <p className="text-base md:text-lg max-w-2xl mx-auto dark:text-text-secondary light:text-text-light-secondary leading-relaxed">
            Powerful features to manage your creator relationships, campaigns, and content library
          </p>
        </div>

        <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-4 md:gap-6 max-w-6xl mx-auto">
          {features.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <div
                key={index}
                className="group rounded-lg border linear-transition overflow-hidden touch-manipulation active:scale-98 dark:bg-linear-bg-secondary dark:border-linear-border-subtle dark:hover:border-linear-border-hover dark:hover:shadow-lg dark:hover:shadow-white/5 light:bg-linear-light-bg-secondary light:border-linear-light-border-subtle light:hover:border-linear-light-border-hover light:hover:shadow-lg light:hover:shadow-black/5"
              >
                <div className="p-5 md:p-6">
                  <div className="w-10 h-10 md:w-9 md:h-9 border rounded-md flex items-center justify-center mb-3 md:mb-4 dark:bg-linear-bg-hover dark:border-linear-border-subtle light:bg-linear-light-bg-hover light:border-linear-light-border-subtle">
                    <Icon className="w-5 h-5 md:w-4 md:h-4 dark:text-text-secondary light:text-text-light-secondary" strokeWidth={1.5} />
                  </div>
                  <h3 className="text-base md:text-lg font-semibold mb-2 dark:text-text-primary light:text-text-light-primary">{feature.title}</h3>
                  <p className="leading-relaxed mb-3 md:mb-4 text-sm dark:text-text-secondary light:text-text-light-secondary">{feature.description}</p>
                  <a
                    href={feature.link}
                    className="text-xs linear-transition inline-flex items-center gap-1 dark:text-text-tertiary dark:hover:text-text-primary light:text-text-light-tertiary light:hover:text-text-light-primary"
                  >
                    Learn more →
                  </a>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
