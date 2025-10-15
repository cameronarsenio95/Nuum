import { useState, useEffect, useRef } from 'react';
import { Users, FolderKanban, FileImage, LayoutGrid, TrendingUp, Calendar, Target, CheckSquare, DollarSign, ChevronRight } from 'lucide-react';

type SectionId = 'creators' | 'campaigns' | 'ugc' | 'analytics';

export function DashboardShowcase() {
  const [activeSection, setActiveSection] = useState<SectionId>('creators');
  const sectionRefs = useRef<Record<SectionId, HTMLElement | null>>({
    creators: null,
    campaigns: null,
    ugc: null,
    analytics: null,
  });

  const sections = [
    { id: 'creators' as SectionId, label: 'Creator Profiles', icon: Users },
    { id: 'campaigns' as SectionId, label: 'Campaign Tracking', icon: FolderKanban },
    { id: 'ugc' as SectionId, label: 'UGC Library', icon: FileImage },
    { id: 'analytics' as SectionId, label: 'Analytics & Reports', icon: LayoutGrid },
  ];

  useEffect(() => {
    const observers = new Map<SectionId, IntersectionObserver>();

    sections.forEach(({ id }) => {
      const observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting && entry.intersectionRatio >= 0.5) {
              setActiveSection(id);
            }
          });
        },
        {
          threshold: [0.5],
          rootMargin: '-100px 0px -100px 0px',
        }
      );

      const element = sectionRefs.current[id];
      if (element) {
        observer.observe(element);
        observers.set(id, observer);
      }
    });

    return () => {
      observers.forEach((observer) => observer.disconnect());
    };
  }, []);

  const scrollToSection = (sectionId: SectionId) => {
    const element = sectionRefs.current[sectionId];
    if (element) {
      const offset = 100;
      const elementPosition = element.getBoundingClientRect().top + window.pageYOffset;
      const offsetPosition = elementPosition - offset;

      window.scrollTo({
        top: offsetPosition,
        behavior: 'smooth',
      });
    }
  };

  return (
    <section id="dashboard-showcase" className="py-12 md:py-20 px-4 md:px-6 dark:bg-linear-bg light:bg-gray-50 relative">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-8 md:mb-12">
          <h2 className="text-2xl md:text-3xl lg:text-4xl font-semibold mb-3 md:mb-4 tracking-tight dark:text-text-primary light:text-text-light-primary">Your complete creator workspace</h2>
          <p className="text-base md:text-lg max-w-2xl mx-auto leading-relaxed dark:text-text-secondary light:text-text-light-secondary">
            Everything you need to manage creators, campaigns, and content in one organized system.
          </p>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 md:gap-3 mb-12 md:mb-16 max-w-5xl mx-auto">
          {sections.map((section) => {
            const Icon = section.icon;
            return (
              <button
                key={section.id}
                onClick={() => scrollToSection(section.id)}
                className="group flex flex-col items-center gap-2 md:gap-3 p-4 md:p-6 dark:bg-linear-bg-secondary dark:border-linear-border-subtle light:bg-white light:border-gray-200 border rounded-lg hover:border-gray-300 hover:bg-gray-50 linear-transition touch-manipulation active:scale-98 light:shadow-sm hover:light:shadow-md"
              >
                <div className="w-9 h-9 md:w-10 md:h-10 dark:bg-linear-bg-hover light:bg-gray-100 rounded-md flex items-center justify-center group-hover:bg-linear-bg linear-transition">
                  <Icon className="w-4 h-4 md:w-5 md:h-5 dark:text-text-secondary light:text-text-light-secondary" />
                </div>
                <div className="text-center">
                  <div className="text-xs md:text-sm font-semibold dark:text-text-primary light:text-text-light-primary mb-0.5">{section.label}</div>
                </div>
                <ChevronRight className="w-3.5 h-3.5 md:w-4 md:h-4 dark:text-text-tertiary light:text-text-light-tertiary opacity-0 group-hover:opacity-100 linear-transition" />
              </button>
            );
          })}
        </div>

        <div className="space-y-16 md:space-y-24 lg:space-y-32">
          <div
            ref={(el) => (sectionRefs.current.creators = el)}
            id="section-creators"
            className="scroll-mt-24"
          >
            <div className="grid lg:grid-cols-2 gap-6 md:gap-8 lg:gap-12 items-start">
              <div className="order-1">
                <h3 className="text-xl md:text-2xl lg:text-3xl font-semibold mb-3 md:mb-4 tracking-tight dark:text-text-primary light:text-text-light-primary">Every creator, one clear view</h3>
                <p className="dark:text-text-secondary light:text-text-light-secondary mb-6 md:mb-8 leading-relaxed text-sm md:text-[15px]">
                  See all your creator relationships in one organized database. Track contact info, social stats,
                  content history, and performance metrics. No more scattered spreadsheets.
                </p>
                <ul className="space-y-2.5">
                  <li className="flex items-start gap-3 dark:text-text-secondary light:text-text-light-secondary text-sm">
                    <div className="w-px h-4 bg-linear-border mt-0.5" />
                    Contact details and social profiles
                  </li>
                  <li className="flex items-start gap-3 dark:text-text-secondary light:text-text-light-secondary text-sm">
                    <div className="w-px h-4 bg-linear-border mt-0.5" />
                    Performance history and analytics
                  </li>
                  <li className="flex items-start gap-3 dark:text-text-secondary light:text-text-light-secondary text-sm">
                    <div className="w-px h-4 bg-linear-border mt-0.5" />
                    Notes and collaboration tags
                  </li>
                </ul>
              </div>
              <div className="order-2 dark:bg-linear-bg-secondary dark:border-linear-border-subtle light:bg-white light:border-gray-200 border rounded-lg p-4 md:p-6 lg:p-8 overflow-hidden light:shadow-lg">
                <div className="space-y-2">
                  {[
                    { name: 'Sarah Johnson', handle: '@sarahjohnson', followers: '125K', engagement: '4.2%' },
                    { name: 'Emma Davis', handle: '@emmadavis', followers: '89K', engagement: '5.1%' },
                    { name: 'Lisa Chen', handle: '@lisachen', followers: '210K', engagement: '3.8%' },
                    { name: 'Maya Rodriguez', handle: '@mayarodriguez', followers: '156K', engagement: '4.5%' },
                  ].map((creator, i) => (
                    <div key={i} className="flex items-center gap-3 p-3 dark:bg-linear-bg dark:border-linear-border-subtle light:bg-linear-light-bg-subtle light:border-linear-light-border border rounded-md hover:border-linear-border-hover linear-transition">
                      <div className="w-10 h-10 dark:bg-linear-bg-hover light:bg-gray-100 rounded-full flex items-center justify-center">
                        <Users className="w-4 h-4 dark:text-text-secondary light:text-text-light-secondary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-sm mb-0.5 dark:text-text-primary light:text-text-light-primary">{creator.name}</div>
                        <div className="text-xs dark:text-text-tertiary light:text-text-light-tertiary">{creator.handle} • {creator.followers} followers • {creator.engagement} engagement</div>
                      </div>
                      <div className="flex gap-2">
                        <div className="px-2 py-0.5 bg-linear-success-subtle rounded text-xs text-linear-success">Active</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div
            ref={(el) => (sectionRefs.current.campaigns = el)}
            id="section-campaigns"
            className="scroll-mt-24"
          >
            <div className="grid lg:grid-cols-2 gap-6 md:gap-8 lg:gap-12 items-start">
              <div className="order-2">
                <h3 className="text-xl md:text-2xl lg:text-3xl font-semibold mb-3 md:mb-4 tracking-tight dark:text-text-primary light:text-text-light-primary">Track every campaign, measure real impact</h3>
                <p className="dark:text-text-secondary light:text-text-light-secondary mb-6 md:mb-8 leading-relaxed text-sm md:text-[15px]">
                  Monitor campaign performance in real-time. See which creators drive conversions, track budgets,
                  and measure ROI across all your influencer partnerships.
                </p>
                <ul className="space-y-2.5">
                  <li className="flex items-start gap-3 dark:text-text-secondary light:text-text-light-secondary text-sm">
                    <div className="w-px h-4 bg-linear-border mt-0.5" />
                    Real-time engagement tracking
                  </li>
                  <li className="flex items-start gap-3 dark:text-text-secondary light:text-text-light-secondary text-sm">
                    <div className="w-px h-4 bg-linear-border mt-0.5" />
                    ROI and conversion analytics
                  </li>
                  <li className="flex items-start gap-3 dark:text-text-secondary light:text-text-light-secondary text-sm">
                    <div className="w-px h-4 bg-linear-border mt-0.5" />
                    Budget and timeline management
                  </li>
                </ul>
              </div>
              <div className="order-1 dark:bg-linear-bg-secondary dark:border-linear-border-subtle light:bg-white light:border-gray-200 border rounded-lg p-4 md:p-6 light:shadow-lg">
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 dark:bg-linear-bg dark:border-linear-border-subtle light:bg-linear-light-bg-subtle light:border-linear-light-border border rounded-md">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 dark:bg-linear-bg-hover light:bg-gray-100 rounded-md flex items-center justify-center">
                        <FolderKanban className="w-4 h-4 dark:text-text-secondary light:text-text-light-secondary" />
                      </div>
                      <div>
                        <div className="font-medium text-sm mb-0.5 dark:text-text-primary light:text-text-light-primary">Summer Collection Launch</div>
                        <div className="text-xs dark:text-text-tertiary light:text-text-light-tertiary">Active • 30 creators • Ends in 12 days</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-base font-medium dark:text-text-primary light:text-text-light-primary">€12,450</div>
                      <div className="text-xs dark:text-text-tertiary light:text-text-light-tertiary">ROI</div>
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-3">
                    <div className="p-4 dark:bg-linear-bg dark:border-linear-border-subtle light:bg-linear-light-bg-subtle light:border-linear-light-border border rounded-md text-center">
                      <TrendingUp className="w-4 h-4 mx-auto mb-2 dark:text-text-secondary light:text-text-light-secondary" />
                      <div className="text-xl font-medium mb-0.5 dark:text-text-primary light:text-text-light-primary">2.3x</div>
                      <div className="text-xs dark:text-text-tertiary light:text-text-light-tertiary">Conversion</div>
                    </div>
                    <div className="p-4 dark:bg-linear-bg dark:border-linear-border-subtle light:bg-linear-light-bg-subtle light:border-linear-light-border border rounded-md text-center">
                      <Users className="w-4 h-4 mx-auto mb-2 dark:text-text-secondary light:text-text-light-secondary" />
                      <div className="text-xl font-medium mb-0.5 dark:text-text-primary light:text-text-light-primary">45</div>
                      <div className="text-xs dark:text-text-tertiary light:text-text-light-tertiary">Creators</div>
                    </div>
                    <div className="p-4 dark:bg-linear-bg dark:border-linear-border-subtle light:bg-linear-light-bg-subtle light:border-linear-light-border border rounded-md text-center">
                      <Calendar className="w-4 h-4 mx-auto mb-2 dark:text-text-secondary light:text-text-light-secondary" />
                      <div className="text-xl font-medium mb-0.5 dark:text-text-primary light:text-text-light-primary">12</div>
                      <div className="text-xs dark:text-text-tertiary light:text-text-light-tertiary">Days left</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div
            ref={(el) => (sectionRefs.current.ugc = el)}
            id="section-ugc"
            className="scroll-mt-24"
          >
            <div className="grid lg:grid-cols-2 gap-6 md:gap-8 lg:gap-12 items-start">
              <div className="order-1">
                <h3 className="text-xl md:text-2xl lg:text-3xl font-semibold mb-3 md:mb-4 tracking-tight dark:text-text-primary light:text-text-light-primary">Organize all your UGC content</h3>
                <p className="dark:text-text-secondary light:text-text-light-secondary mb-6 md:mb-8 leading-relaxed text-sm md:text-[15px]">
                  Auto-collect and organize creator content. Track usage rights, download assets, and reuse UGC across channels.
                  Everything tagged and searchable.
                </p>
                <ul className="space-y-2.5">
                  <li className="flex items-start gap-3 dark:text-text-secondary light:text-text-light-secondary text-sm">
                    <div className="w-px h-4 bg-linear-border mt-0.5" />
                    Automatic content collection
                  </li>
                  <li className="flex items-start gap-3 dark:text-text-secondary light:text-text-light-secondary text-sm">
                    <div className="w-px h-4 bg-linear-border mt-0.5" />
                    Rights and licensing tracking
                  </li>
                  <li className="flex items-start gap-3 dark:text-text-secondary light:text-text-light-secondary text-sm">
                    <div className="w-px h-4 bg-linear-border mt-0.5" />
                    Smart tagging and search
                  </li>
                </ul>
              </div>
              <div className="order-2 dark:bg-linear-bg-secondary dark:border-linear-border-subtle light:bg-white light:border-gray-200 border rounded-lg p-4 md:p-6 light:shadow-lg">
                <div className="mb-4">
                  <div className="text-xs dark:text-text-tertiary light:text-text-light-tertiary font-medium uppercase tracking-wide mb-3">UGC Library</div>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { type: 'video', color: 'from-gray-700 to-gray-600' },
                      { type: 'image', color: 'from-gray-600 to-gray-500' },
                      { type: 'video', color: 'from-gray-800 to-gray-700' },
                      { type: 'image', color: 'from-gray-500 to-gray-400' },
                      { type: 'video', color: 'from-gray-700 to-gray-600' },
                      { type: 'image', color: 'from-gray-600 to-gray-500' },
                    ].map((item, i) => (
                      <div key={i} className="aspect-square dark:bg-linear-bg dark:border-linear-border-subtle light:bg-linear-light-bg-subtle light:border-linear-light-border border rounded-md relative overflow-hidden group cursor-pointer hover:border-linear-border-hover linear-transition">
                        <div className={`absolute inset-0 bg-gradient-to-br ${item.color} opacity-10 group-hover:opacity-20 linear-transition`} />
                        <div className="absolute inset-0 flex items-center justify-center">
                          {item.type === 'video' ? (
                            <div className="w-8 h-8 bg-linear-bg/80 rounded-full flex items-center justify-center">
                              <div className="w-0 h-0 border-l-8 border-l-white border-y-4 border-y-transparent ml-1" />
                            </div>
                          ) : (
                            <div className="w-12 h-12 bg-linear-bg-subtle/50 rounded" />
                          )}
                        </div>
                        <div className="absolute top-2 right-2">
                          <div className="px-1.5 py-0.5 bg-linear-bg/80 rounded text-[10px] dark:text-text-tertiary light:text-text-light-tertiary">
                            {item.type === 'video' ? '0:15' : 'JPG'}
                          </div>
                        </div>
                        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-2">
                          <div className="h-1 bg-white/40 rounded w-3/4" />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex gap-2">
                    <div className="px-2 py-1 dark:bg-linear-bg dark:border-linear-border-subtle light:bg-linear-light-bg-subtle light:border-linear-light-border border rounded text-xs dark:text-text-secondary light:text-text-light-secondary hover:border-linear-border-hover linear-transition cursor-pointer">#Fashion</div>
                    <div className="px-2 py-1 dark:bg-linear-bg dark:border-linear-border-subtle light:bg-linear-light-bg-subtle light:border-linear-light-border border rounded text-xs dark:text-text-secondary light:text-text-light-secondary hover:border-linear-border-hover linear-transition cursor-pointer">#Summer2024</div>
                    <div className="px-2 py-1 dark:bg-linear-bg dark:border-linear-border-subtle light:bg-linear-light-bg-subtle light:border-linear-light-border border rounded text-xs dark:text-text-secondary light:text-text-light-secondary hover:border-linear-border-hover linear-transition cursor-pointer">+12</div>
                  </div>
                  <button className="text-xs dark:text-text-tertiary light:text-text-light-tertiary hover:dark:text-text-secondary hover:light:text-text-light-secondary linear-transition">View All →</button>
                </div>
                <div className="flex items-center gap-3 text-xs dark:text-text-tertiary light:text-text-light-tertiary">
                  <div className="flex items-center gap-1">
                    <div className="w-2 h-2 bg-linear-success rounded-full" />
                    <span>124 approved</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div
            ref={(el) => (sectionRefs.current.analytics = el)}
            id="section-analytics"
            className="scroll-mt-24"
          >
            <div className="grid lg:grid-cols-2 gap-6 md:gap-8 lg:gap-12 items-start">
              <div className="order-2">
                <h3 className="text-xl md:text-2xl lg:text-3xl font-semibold mb-3 md:mb-4 tracking-tight dark:text-text-primary light:text-text-light-primary">Clear insights, shareable reports</h3>
                <p className="dark:text-text-secondary light:text-text-light-secondary mb-6 md:mb-8 leading-relaxed text-sm md:text-[15px]">
                  See what's working at a glance. Export professional reports for stakeholders.
                  Turn creator data into actionable insights.
                </p>
                <ul className="space-y-2.5">
                  <li className="flex items-start gap-3 dark:text-text-secondary light:text-text-light-secondary text-sm">
                    <div className="w-px h-4 bg-linear-border mt-0.5" />
                    Real-time performance dashboards
                  </li>
                  <li className="flex items-start gap-3 dark:text-text-secondary light:text-text-light-secondary text-sm">
                    <div className="w-px h-4 bg-linear-border mt-0.5" />
                    Exportable reports and analytics
                  </li>
                  <li className="flex items-start gap-3 dark:text-text-secondary light:text-text-light-secondary text-sm">
                    <div className="w-px h-4 bg-linear-border mt-0.5" />
                    Team collaboration and sharing
                  </li>
                </ul>
              </div>
              <div className="order-1 space-y-3 md:space-y-4">
                <div className="grid grid-cols-2 gap-2.5 md:gap-3">
                  <div className="dark:bg-linear-bg-secondary dark:border-linear-border-subtle light:bg-white light:border-gray-200 border rounded-md p-4 light:shadow-md">
                    <div className="flex items-center justify-between mb-3">
                      <div className="w-7 h-7 dark:bg-linear-bg-hover light:bg-gray-100 rounded-md flex items-center justify-center">
                        <Target className="w-3.5 h-3.5 dark:text-text-secondary light:text-text-light-secondary" />
                      </div>
                      <span className="text-xs dark:text-text-tertiary light:text-text-light-tertiary">Campaigns</span>
                    </div>
                    <div className="space-y-0.5">
                      <div className="text-lg font-medium dark:text-text-primary light:text-text-light-primary">12</div>
                      <div className="text-xs dark:text-text-tertiary light:text-text-light-tertiary">5 active</div>
                    </div>
                  </div>

                  <div className="dark:bg-linear-bg-secondary dark:border-linear-border-subtle light:bg-white light:border-gray-200 border rounded-md p-4 light:shadow-md">
                    <div className="flex items-center justify-between mb-3">
                      <div className="w-7 h-7 dark:bg-linear-bg-hover light:bg-gray-100 rounded-md flex items-center justify-center">
                        <Users className="w-3.5 h-3.5 dark:text-text-secondary light:text-text-light-secondary" />
                      </div>
                      <span className="text-xs dark:text-text-tertiary light:text-text-light-tertiary">Creators</span>
                    </div>
                    <div className="space-y-0.5">
                      <div className="text-lg font-medium dark:text-text-primary light:text-text-light-primary">48</div>
                      <div className="text-xs dark:text-text-tertiary light:text-text-light-tertiary">Total creators</div>
                    </div>
                  </div>

                  <div className="dark:bg-linear-bg-secondary dark:border-linear-border-subtle light:bg-white light:border-gray-200 border rounded-md p-4 light:shadow-md">
                    <div className="flex items-center justify-between mb-3">
                      <div className="w-7 h-7 dark:bg-linear-bg-hover light:bg-gray-100 rounded-md flex items-center justify-center">
                        <CheckSquare className="w-3.5 h-3.5 dark:text-text-secondary light:text-text-light-secondary" />
                      </div>
                      <span className="text-xs dark:text-text-tertiary light:text-text-light-tertiary">Tasks</span>
                    </div>
                    <div className="space-y-0.5">
                      <div className="text-lg font-medium dark:text-text-primary light:text-text-light-primary">34</div>
                      <div className="text-xs dark:text-text-tertiary light:text-text-light-tertiary">12 completed, 22 pending</div>
                    </div>
                  </div>

                  <div className="dark:bg-linear-bg-secondary dark:border-linear-border-subtle light:bg-white light:border-gray-200 border rounded-md p-4 light:shadow-md">
                    <div className="flex items-center justify-between mb-3">
                      <div className="w-7 h-7 dark:bg-linear-bg-hover light:bg-gray-100 rounded-md flex items-center justify-center">
                        <DollarSign className="w-3.5 h-3.5 dark:text-text-secondary light:text-text-light-secondary" />
                      </div>
                      <span className="text-xs dark:text-text-tertiary light:text-text-light-tertiary">Revenue</span>
                    </div>
                    <div className="space-y-0.5">
                      <div className="text-lg font-medium dark:text-text-primary light:text-text-light-primary">€87,450</div>
                      <div className="text-xs dark:text-text-tertiary light:text-text-light-tertiary">All campaigns</div>
                    </div>
                  </div>
                </div>

                <div className="dark:bg-linear-bg-secondary dark:border-linear-border-subtle light:bg-white light:border-gray-200 border rounded-md p-4 light:shadow-md">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-xs font-medium flex items-center gap-2 dark:text-text-tertiary light:text-text-light-tertiary">
                      <Target className="w-3.5 h-3.5" />
                      Recent Campaigns
                    </h3>
                    <select className="text-xs dark:bg-linear-bg dark:border-linear-border-subtle light:bg-linear-light-bg-subtle light:border-linear-light-border border rounded px-2 py-1 dark:text-text-secondary light:text-text-light-secondary cursor-pointer">
                      <option>Last 30 days</option>
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    {[
                      { name: 'Summer Collection Launch', date: 'Nov 15, 2024', status: 'active' },
                      { name: 'Holiday Gift Guide', date: 'Dec 1, 2024', status: 'in_progress' },
                      { name: 'New Year Fitness', date: 'Jan 2, 2025', status: 'completed' }
                    ].map((campaign, i) => (
                      <div
                        key={i}
                        className="flex items-center justify-between p-2 dark:bg-linear-bg light:bg-linear-light-bg-subtle rounded-md hover:dark:bg-linear-bg-hover hover:light:bg-gray-50 linear-transition"
                      >
                        <div className="flex-1 min-w-0">
                          <div className="font-medium text-xs truncate dark:text-text-primary light:text-text-light-primary">{campaign.name}</div>
                          <div className="text-xs dark:text-text-tertiary light:text-text-light-tertiary">{campaign.date}</div>
                        </div>
                        <span className={`text-xs px-1.5 py-0.5 rounded border whitespace-nowrap ${
                          campaign.status === 'active' ? 'text-linear-success bg-linear-success-subtle border-linear-success-border' :
                          campaign.status === 'in_progress' ? 'text-linear-warning bg-linear-warning-subtle border-linear-warning-border' :
                          'text-linear-info bg-linear-info-subtle border-linear-info-border'
                        }`}>
                          {campaign.status.replace('_', ' ')}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
