import { Users, FolderKanban, FileText, BarChart3, ArrowRight, ArrowLeft } from 'lucide-react';
import { useState, useEffect } from 'react';
import { Header } from '../components/Header';
import { Footer } from '../components/Footer';

const steps = [
  {
    number: '1',
    icon: Users,
    title: 'Connect your creators',
    description: 'Import creators from campaigns, spreadsheets, or social platforms. See follower stats, content links, and audience data all in one place.',
    visual: (
      <div className="dark:bg-linear-bg-secondary light:bg-linear-light-bg-secondary border dark:border-linear-border-subtle light:border-linear-light-border-subtle rounded-lg p-8">
        <div className="space-y-2">
          {[
            { name: 'Sarah Johnson', handle: '@sarahjohnson', followers: '125K', engagement: '4.2%' },
            { name: 'Emma Davis', handle: '@emmadavis', followers: '89K', engagement: '5.1%' },
            { name: 'Lisa Chen', handle: '@lisachen', followers: '210K', engagement: '3.8%' },
            { name: 'Maya Rodriguez', handle: '@mayarodriguez', followers: '156K', engagement: '4.5%' },
          ].map((creator, i) => (
            <div key={i} className="flex items-center gap-3 p-3 dark:bg-linear-bg light:bg-linear-light-bg border dark:border-linear-border-subtle light:border-linear-light-border-subtle rounded-md hover:border-linear-border-hover linear-transition">
              <div className="w-10 h-10 bg-linear-bg-hover rounded-full flex items-center justify-center">
                <Users className="w-4 h-4 dark:text-text-secondary light:text-text-light-secondary" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-medium text-sm mb-0.5">{creator.name}</div>
                <div className="text-xs dark:text-text-tertiary light:text-text-light-tertiary">{creator.handle} • {creator.followers} followers • {creator.engagement} engagement</div>
              </div>
              <div className="flex gap-2">
                <div className="px-2 py-0.5 bg-green-500/10 rounded text-xs text-green-400">Active</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    ),
  },
  {
    number: '2',
    icon: FolderKanban,
    title: 'Track your campaigns in real time',
    description: 'Assign creators to campaigns, monitor engagement, and instantly see what performs. Analytics update automatically — no more manual reports.',
    visual: (
      <div className="dark:bg-linear-bg-secondary light:bg-linear-light-bg-secondary border dark:border-linear-border-subtle light:border-linear-light-border-subtle rounded-lg p-6">
        <div className="space-y-4">
          <div className="flex items-center justify-between p-4 dark:bg-linear-bg light:bg-linear-light-bg border dark:border-linear-border-subtle light:border-linear-light-border-subtle rounded-md">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 bg-linear-bg-hover rounded-md flex items-center justify-center">
                <FolderKanban className="w-4 h-4 dark:text-text-secondary light:text-text-light-secondary" />
              </div>
              <div>
                <div className="font-medium text-sm mb-0.5">Summer Collection Launch</div>
                <div className="text-xs dark:text-text-tertiary light:text-text-light-tertiary">Active • 30 creators • Ends in 12 days</div>
              </div>
            </div>
            <div className="text-right">
              <div className="text-base font-medium">€12,450</div>
              <div className="text-xs dark:text-text-tertiary light:text-text-light-tertiary">ROI</div>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div className="p-4 dark:bg-linear-bg light:bg-linear-light-bg border dark:border-linear-border-subtle light:border-linear-light-border-subtle rounded-md text-center">
              <BarChart3 className="w-4 h-4 mx-auto mb-2 dark:text-text-secondary light:text-text-light-secondary" />
              <div className="text-xl font-medium mb-0.5">2.3x</div>
              <div className="text-xs dark:text-text-tertiary light:text-text-light-tertiary">Conversion</div>
            </div>
            <div className="p-4 dark:bg-linear-bg light:bg-linear-light-bg border dark:border-linear-border-subtle light:border-linear-light-border-subtle rounded-md text-center">
              <Users className="w-4 h-4 mx-auto mb-2 dark:text-text-secondary light:text-text-light-secondary" />
              <div className="text-xl font-medium mb-0.5">45</div>
              <div className="text-xs dark:text-text-tertiary light:text-text-light-tertiary">Creators</div>
            </div>
            <div className="p-4 dark:bg-linear-bg light:bg-linear-light-bg border dark:border-linear-border-subtle light:border-linear-light-border-subtle rounded-md text-center">
              <FileText className="w-4 h-4 mx-auto mb-2 dark:text-text-secondary light:text-text-light-secondary" />
              <div className="text-xl font-medium mb-0.5">12</div>
              <div className="text-xs dark:text-text-tertiary light:text-text-light-tertiary">Days left</div>
            </div>
          </div>
        </div>
      </div>
    ),
  },
  {
    number: '3',
    icon: FileText,
    title: 'Store and reuse every piece of content',
    description: 'Your UGC library automatically collects posts and videos from your creators. Tag, download, and reuse content with rights tracking built in.',
    visual: (
      <div className="dark:bg-linear-bg-secondary light:bg-linear-light-bg-secondary border dark:border-linear-border-subtle light:border-linear-light-border-subtle rounded-lg p-6">
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
              <div key={i} className="aspect-square dark:bg-linear-bg light:bg-linear-light-bg border dark:border-linear-border-subtle light:border-linear-light-border-subtle rounded-md relative overflow-hidden group cursor-pointer hover:border-linear-border-hover linear-transition">
                <div className={`absolute inset-0 bg-gradient-to-br ${item.color} opacity-10 group-hover:opacity-20 linear-transition`} />
                <div className="absolute inset-0 flex items-center justify-center">
                  {item.type === 'video' ? (
                    <div className="w-8 h-8 dark:bg-linear-bg/ light:bg-linear-light-bg/80 rounded-full flex items-center justify-center">
                      <div className="w-0 h-0 border-l-8 border-l-white border-y-4 border-y-transparent ml-1" />
                    </div>
                  ) : (
                    <div className="w-12 h-12 bg-linear-bg-subtle/50 rounded" />
                  )}
                </div>
                <div className="absolute top-2 right-2">
                  <div className="px-1.5 py-0.5 dark:bg-linear-bg/ light:bg-linear-light-bg/80 rounded text-[10px] dark:text-text-tertiary light:text-text-light-tertiary">
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
            <div className="px-2 py-1 dark:bg-linear-bg light:bg-linear-light-bg border dark:border-linear-border-subtle light:border-linear-light-border-subtle rounded text-xs dark:text-text-secondary light:text-text-light-secondary hover:border-linear-border-hover linear-transition cursor-pointer">#Fashion</div>
            <div className="px-2 py-1 dark:bg-linear-bg light:bg-linear-light-bg border dark:border-linear-border-subtle light:border-linear-light-border-subtle rounded text-xs dark:text-text-secondary light:text-text-light-secondary hover:border-linear-border-hover linear-transition cursor-pointer">#Summer2024</div>
            <div className="px-2 py-1 dark:bg-linear-bg light:bg-linear-light-bg border dark:border-linear-border-subtle light:border-linear-light-border-subtle rounded text-xs dark:text-text-secondary light:text-text-light-secondary hover:border-linear-border-hover linear-transition cursor-pointer">+12</div>
          </div>
          <button className="text-xs dark:text-text-tertiary light:text-text-light-tertiary hover:dark:text-text-secondary light:text-text-light-secondary linear-transition">View All →</button>
        </div>
        <div className="flex items-center gap-3 text-xs dark:text-text-tertiary light:text-text-light-tertiary">
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 bg-linear-success rounded-full" />
            <span>124 approved</span>
          </div>
        </div>
      </div>
    ),
  },
  {
    number: '4',
    icon: BarChart3,
    title: 'Report results that matter',
    description: 'Export campaign performance or share live dashboards with your team or clients. Show exactly which creators drive reach and sales.',
    visual: (
      <div className="dark:bg-linear-bg-secondary light:bg-linear-light-bg-secondary border dark:border-linear-border-subtle light:border-linear-light-border-subtle rounded-lg p-6">
        <div className="mb-4">
          <div className="flex items-center justify-between mb-4">
            <div className="text-xs dark:text-text-tertiary light:text-text-light-tertiary font-medium uppercase tracking-wide">Campaign Performance</div>
            <select className="text-xs dark:bg-linear-bg light:bg-linear-light-bg border dark:border-linear-border-subtle light:border-linear-light-border-subtle rounded px-2 py-1 dark:text-text-secondary light:text-text-light-secondary cursor-pointer">
              <option>Last 7 days</option>
            </select>
          </div>
          <div className="flex items-end justify-between gap-2 h-32 mb-2">
            {[
              { height: 60, label: 'Mon' },
              { height: 80, label: 'Tue' },
              { height: 45, label: 'Wed' },
              { height: 90, label: 'Thu' },
              { height: 70, label: 'Fri' },
              { height: 85, label: 'Sat' },
              { height: 95, label: 'Sun' },
            ].map((day, i) => (
              <div key={i} className="flex-1 flex flex-col items-center justify-end h-full group">
                <div
                  className="w-full bg-linear-accent/30 rounded-t hover:bg-linear-accent/40 linear-transition"
                  style={{ height: `${day.height}%` }}
                />
                <div className="text-[9px] text-text-quaternary mt-2 font-medium">{day.label}</div>
              </div>
            ))}
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="p-3 dark:bg-linear-bg light:bg-linear-light-bg border dark:border-linear-border-subtle light:border-linear-light-border-subtle rounded-md">
            <div className="text-xs dark:text-text-tertiary light:text-text-light-tertiary mb-1">Total Reach</div>
            <div className="text-lg font-medium">2.4M</div>
          </div>
          <div className="p-3 dark:bg-linear-bg light:bg-linear-light-bg border dark:border-linear-border-subtle light:border-linear-light-border-subtle rounded-md">
            <div className="text-xs dark:text-text-tertiary light:text-text-light-tertiary mb-1">Engagement</div>
            <div className="text-lg font-medium">4.8%</div>
          </div>
        </div>
      </div>
    ),
  },
];

interface HowItWorksPageProps {
  onBackClick: () => void;
  onLoginClick: () => void;
  onSignupClick?: () => void;
  onPricingClick?: () => void;
  onResourcesClick?: () => void;
  onHowItWorksClick?: () => void;
}

export function HowItWorksPage({ onBackClick, onLoginClick, onSignupClick, onPricingClick, onResourcesClick, onHowItWorksClick }: HowItWorksPageProps) {
  const [activeSection, setActiveSection] = useState('hero');
  const [showStickyCTA, setShowStickyCTA] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      const sections = ['hero', 'step1', 'step2', 'step3', 'step4', 'cta'];
      const scrollPosition = window.scrollY + 200;

      setShowStickyCTA(window.scrollY > 600);

      for (const section of sections) {
        const element = document.getElementById(section);
        if (element) {
          const { offsetTop, offsetHeight } = element;
          if (scrollPosition >= offsetTop && scrollPosition < offsetTop + offsetHeight) {
            setActiveSection(section);
            break;
          }
        }
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToSection = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      const offset = 100;
      const elementPosition = element.getBoundingClientRect().top + window.scrollY;
      window.scrollTo({ top: elementPosition - offset, behavior: 'smooth' });
    }
  };

  const navItems = [
    { id: 'hero', label: 'Overview' },
    { id: 'step1', label: 'Connect Creators' },
    { id: 'step2', label: 'Track Campaigns' },
    { id: 'step3', label: 'Store Content' },
    { id: 'step4', label: 'Report Results' },
    { id: 'cta', label: 'Get Started' },
  ];

  return (
    <div className="min-h-screen">
      <Header
        onLoginClick={onLoginClick}
        onSignupClick={onSignupClick}
        onBackClick={onBackClick}
        onPricingClick={onPricingClick}
        onResourcesClick={onResourcesClick}
        onHowItWorksClick={onHowItWorksClick}
      />

      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-40 right-10 w-72 h-72 bg-linear-accent/10 rounded-full blur-3xl animate-pulse text-linear-bg" style={{ animationDuration: '5s' }} />
        <div className="absolute bottom-40 left-10 w-96 h-96 bg-linear-accent/5 rounded-full blur-3xl animate-pulse text-linear-bg" style={{ animationDuration: '7s' }} />
      </div>

      <div className="fixed left-8 top-1/2 -translate-y-1/2 z-30 hidden lg:block">
        <nav className="space-y-2">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => scrollToSection(item.id)}
              className={`block w-2 h-2 rounded-full linear-transition ${
                activeSection === item.id ? 'bg-linear-accent w-8' : 'bg-white/20 hover:bg-white/40'
              }`}
              aria-label={`Navigate to ${item.label}`}
            />
          ))}
        </nav>
      </div>

      {showStickyCTA && (
        <div className="fixed bottom-6 right-6 z-40 animate-slide-up">
          <button
            onClick={onLoginClick}
            className="group px-5 py-2.5 bg-linear-accent hover:bg-linear-accent-hover hover:shadow-xl hover:shadow-linear-accent/30 rounded-md text-sm font-medium linear-transition flex items-center gap-2 text-linear-bg"
          >
            Start Free
            <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 linear-transition" strokeWidth={2} />
          </button>
        </div>
      )}

      <div className="pt-24 px-6 relative">
        <section id="hero" className="py-12 max-w-7xl mx-auto">
          <button
            onClick={onBackClick}
            className="flex items-center gap-2 text-sm dark:text-text-secondary light:text-text-light-secondary hover:dark:text-text-primary light:text-text-light-primary linear-transition mb-12"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to home
          </button>

          <div className="text-center mb-20 animate-slide-up">
              <h1 className="mb-6 text-balance">
                Manage every creator, campaign, and piece of content — without chaos.
              </h1>
              <p className="text-xl dark:text-text-secondary light:text-text-light-secondary text-balance max-w-3xl mx-auto">
                Here's how UGC System turns disconnected influencer workflows into one clear dashboard.
              </p>
          </div>

          <div className="space-y-24">
              {steps.map((step, index) => {
                const sectionId = `step${index + 1}`;
                const Icon = step.icon;
                const isEven = index % 2 === 0;

                return (
                  <div
                    key={index}
                    id={sectionId}
                    className={`grid md:grid-cols-2 gap-12 items-center ${
                      isEven ? '' : 'md:flex-row-reverse'
                    } animate-slide-up`}
                    style={{ animationDelay: `${0.1 * index}s` }}
                  >
                    <div className={`${isEven ? 'md:order-1' : 'md:order-2'}`}>
                      <div className="inline-flex items-center gap-2 px-2.5 py-1 dark:bg-linear-bg-secondary light:bg-linear-light-bg-secondary border dark:border-linear-border-subtle light:border-linear-light-border-subtle rounded-md text-xs dark:text-text-tertiary light:text-text-light-tertiary mb-6">
                        <Icon className="w-3.5 h-3.5" />
                        Step {step.number}
                      </div>
                      <h2 className="text-3xl font-medium mb-4 tracking-tight">{step.title}</h2>
                      <p className="dark:text-text-secondary light:text-text-light-secondary leading-relaxed text-[15px]">{step.description}</p>
                    </div>
                    <div className={`${isEven ? 'md:order-2' : 'md:order-1'} hover:scale-[1.02] linear-transition`}>
                      {step.visual}
                    </div>
                  </div>
                );
              })}
          </div>

          <div id="cta" className="text-center mt-24 pt-12 border-t dark:border-linear-border-subtle light:border-linear-light-border-subtle animate-slide-up" style={{ animationDelay: '0.5s' }}>
              <h2 className="text-3xl font-medium mb-4 tracking-tight">Ready to simplify your creator management?</h2>
              <p className="dark:text-text-secondary light:text-text-light-secondary mb-8 max-w-2xl mx-auto text-[15px]">
                Start your free 14-day trial today — no credit card required.
              </p>
              <button
                onClick={onLoginClick}
                className="group px-5 py-2.5 bg-linear-accent hover:bg-linear-accent-hover hover:shadow-lg hover:shadow-linear-accent/20 rounded-md text-sm font-medium linear-transition inline-flex items-center gap-2 text-linear-bg"
              >
                Start Free
                <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 linear-transition" strokeWidth={2} />
              </button>
          </div>
        </section>
      </div>

      <Footer />
    </div>
  );
}
