import { ArrowRight, ArrowLeft, Check, ChevronRight, TrendingUp, Target, Users, FolderHeart, DollarSign } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Header } from '../components/Header';

interface FeaturesPageProps {
  onSignupClick: () => void;
  onBackClick?: () => void;
  onLoginClick?: () => void;
  onHowItWorksClick?: () => void;
  onPricingClick?: () => void;
  onResourcesClick?: () => void;
}

export function FeaturesPage({ onSignupClick, onBackClick, onLoginClick, onHowItWorksClick, onPricingClick, onResourcesClick }: FeaturesPageProps) {
  const [activeSection, setActiveSection] = useState('hero');
  const [showStickyCTA, setShowStickyCTA] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      const sections = ['hero', 'creators', 'analytics', 'library', 'reports', 'integrations', 'collaboration'];
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
    { id: 'creators', label: 'Creator Profiles' },
    { id: 'analytics', label: 'Analytics' },
    { id: 'library', label: 'UGC Library' },
    { id: 'reports', label: 'Reports' },
    { id: 'integrations', label: 'Integrations' },
    { id: 'collaboration', label: 'Collaboration' },
  ];

  return (
    <div className="min-h-screen bg-[#0a0a0a]">
      <Header
        onLoginClick={onLoginClick}
        onSignupClick={onSignupClick}
        onBackClick={onBackClick}
        onHowItWorksClick={onHowItWorksClick}
        onPricingClick={onPricingClick}
        onResourcesClick={onResourcesClick}
      />
      <div className="fixed left-6 top-1/2 -translate-y-1/2 z-30 hidden lg:block">
        <nav className="space-y-3">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => scrollToSection(item.id)}
              className={`block w-1 h-1 rounded-full transition-all duration-200 ${
                activeSection === item.id ? 'bg-white w-6 h-1' : 'bg-white/20 hover:bg-white/40'
              }`}
              aria-label={`Navigate to ${item.label}`}
            />
          ))}
        </nav>
      </div>

      {showStickyCTA && (
        <div className="fixed bottom-4 right-4 z-40 animate-fade-in">
          <button
            onClick={onSignupClick}
            className="group px-4 py-2 bg-white hover:bg-gray-100 rounded text-xs font-medium transition-all duration-200 flex items-center gap-1.5 text-black shadow-linear-lg"
          >
            Start Free Trial
            <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform duration-200" strokeWidth={2} />
          </button>
        </div>
      )}

      <div className="pt-20 px-6 relative">
        <section id="hero" className="py-12 max-w-7xl mx-auto">
          <button
            onClick={onBackClick}
            className="flex items-center gap-1.5 text-xs text-[#9ea0a5] hover:text-[#e6e6e7] transition-colors duration-200 mb-8"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Back to home
          </button>

          <div className="relative min-h-[60vh] flex items-center justify-center">
            <div className="relative w-full">
              <div className="text-center animate-slide-up mb-12">
                <h1 className="mb-4 text-4xl font-medium tracking-tight text-[#e6e6e7]">
                  Powerful features. Built for creator-first teams.
                </h1>
                <p className="text-base text-[#9ea0a5] mb-6 max-w-2xl mx-auto leading-normal">
                  Everything you need to manage creators, campaigns, and UGC — organized, measurable, and easy to use.
                </p>
                <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
                  <button
                    onClick={onSignupClick}
                    className="group px-4 py-2 bg-white hover:bg-gray-100 rounded text-xs font-medium transition-all duration-200 flex items-center gap-1.5 text-black"
                  >
                    Start Free Trial
                    <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform duration-200" strokeWidth={2} />
                  </button>
                  <a
                    href="/pricing"
                    className="px-4 py-2 text-xs text-[#9ea0a5] hover:text-[#e6e6e7] bg-[#161718] hover:bg-[#1a1b1c] border border-[#1a1b1c] hover:border-[#232426] rounded transition-all duration-200"
                  >
                    See Pricing
                  </a>
                </div>
              </div>

              <div className="relative max-w-5xl mx-auto">
                <div className="relative rounded overflow-hidden border border-[#1a1b1c] bg-[#0f1011] shadow-linear-lg hover:border-[#232426] transition-all duration-200">
                  <img
                    src="/assets/members/reporting.png"
                    alt="UGC System Dashboard Overview"
                    className="w-full h-auto"
                  />
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>

      <section className="relative py-16 overflow-hidden">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-10">
            <h2 className="text-2xl font-medium mb-3 text-[#e6e6e7]">Real Results from Real Teams</h2>
            <p className="text-sm text-[#9ea0a5] max-w-xl mx-auto">
              See what teams are achieving with UGC System every day
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <div className="bg-[#161718] border border-[#1a1b1c] rounded p-5 hover:border-[#232426] transition-all duration-200 animate-slide-up">
              <div className="flex items-center justify-between mb-3">
                <div className="text-[10px] text-[#6c6e73] uppercase tracking-wider font-medium">Active Creators</div>
                <div className="w-7 h-7 bg-[#1a1b1c] rounded flex items-center justify-center border border-[#232426]">
                  <Users className="w-3.5 h-3.5 text-[#9ea0a5]" strokeWidth={1.5} />
                </div>
              </div>
              <div className="text-2xl font-medium mb-1.5 text-[#e6e6e7]">142</div>
              <div className="flex items-center gap-1 text-xs text-[#3dd68c]">
                <TrendingUp className="w-3 h-3" strokeWidth={2} />
                <span>+12%</span>
              </div>
            </div>

            <div className="bg-[#161718] border border-[#1a1b1c] rounded p-5 hover:border-[#232426] transition-all duration-200 animate-slide-up" style={{ animationDelay: '0.05s' }}>
              <div className="flex items-center justify-between mb-3">
                <div className="text-[10px] text-[#6c6e73] uppercase tracking-wider font-medium">Campaigns</div>
                <div className="w-7 h-7 bg-[#1a1b1c] rounded flex items-center justify-center border border-[#232426]">
                  <Target className="w-3.5 h-3.5 text-[#9ea0a5]" strokeWidth={1.5} />
                </div>
              </div>
              <div className="text-2xl font-medium mb-1.5 text-[#e6e6e7]">38</div>
              <div className="flex items-center gap-1 text-xs text-[#3dd68c]">
                <TrendingUp className="w-3 h-3" strokeWidth={2} />
                <span>+5%</span>
              </div>
            </div>

            <div className="bg-[#161718] border border-[#1a1b1c] rounded p-5 hover:border-[#232426] transition-all duration-200 animate-slide-up" style={{ animationDelay: '0.1s' }}>
              <div className="flex items-center justify-between mb-3">
                <div className="text-[10px] text-[#6c6e73] uppercase tracking-wider font-medium">Total Content</div>
                <div className="w-7 h-7 bg-[#1a1b1c] rounded flex items-center justify-center border border-[#232426]">
                  <FolderHeart className="w-3.5 h-3.5 text-[#9ea0a5]" strokeWidth={1.5} />
                </div>
              </div>
              <div className="text-2xl font-medium mb-1.5 text-[#e6e6e7]">1,248</div>
              <div className="flex items-center gap-1 text-xs text-[#3dd68c]">
                <TrendingUp className="w-3 h-3" strokeWidth={2} />
                <span>+18%</span>
              </div>
            </div>

            <div className="bg-[#161718] border border-[#1a1b1c] rounded p-5 hover:border-[#232426] transition-all duration-200 animate-slide-up" style={{ animationDelay: '0.15s' }}>
              <div className="flex items-center justify-between mb-3">
                <div className="text-[10px] text-[#6c6e73] uppercase tracking-wider font-medium">Total Revenue</div>
                <div className="w-7 h-7 bg-[#1a1b1c] rounded flex items-center justify-center border border-[#232426]">
                  <DollarSign className="w-3.5 h-3.5 text-[#9ea0a5]" strokeWidth={1.5} />
                </div>
              </div>
              <div className="text-2xl font-medium mb-1.5 text-[#e6e6e7]">$87.2K</div>
              <div className="flex items-center gap-1 text-xs text-[#3dd68c]">
                <TrendingUp className="w-3 h-3" strokeWidth={2} />
                <span>+24%</span>
              </div>
            </div>
          </div>

          <div className="grid lg:grid-cols-2 gap-6">
            <div className="bg-[#161718] border border-[#1a1b1c] rounded p-5 animate-slide-up" style={{ animationDelay: '0.2s' }}>
              <div className="flex items-center justify-between mb-5">
                <h3 className="text-sm font-medium flex items-center gap-2 text-[#e6e6e7]">
                  <Users className="w-3.5 h-3.5" strokeWidth={1.5} />
                  Top Creators
                </h3>
              </div>
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 bg-[#0f1011] rounded">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-pink-500 to-purple-500 flex items-center justify-center text-white text-xs font-medium">
                      S
                    </div>
                    <div>
                      <div className="text-xs font-medium text-[#e6e6e7]">@sarahcreates</div>
                      <div className="text-[10px] text-[#6c6e73]">Total Revenue</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-xs font-medium text-[#3dd68c]">$12,400</div>
                  </div>
                </div>

                <div className="flex items-center justify-between p-3 bg-[#0f1011] rounded">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center text-white text-xs font-medium">
                      M
                    </div>
                    <div>
                      <div className="text-xs font-medium text-[#e6e6e7]">@markvisuals</div>
                      <div className="text-[10px] text-[#6c6e73]">Total Revenue</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-xs font-medium text-[#3dd68c]">$9,800</div>
                  </div>
                </div>

                <div className="flex items-center justify-between p-3 bg-[#0f1011] rounded">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-orange-500 to-red-500 flex items-center justify-center text-white text-xs font-medium">
                      E
                    </div>
                    <div>
                      <div className="text-xs font-medium text-[#e6e6e7]">@emilystyle</div>
                      <div className="text-[10px] text-[#6c6e73]">Total Revenue</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-xs font-medium text-[#3dd68c]">$8,200</div>
                  </div>
                </div>

                <div className="flex items-center justify-between p-3 bg-[#0f1011] rounded">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-green-500 to-emerald-500 flex items-center justify-center text-white text-xs font-medium">
                      A
                    </div>
                    <div>
                      <div className="text-xs font-medium text-[#e6e6e7]">@alexcontent</div>
                      <div className="text-[10px] text-[#6c6e73]">Total Revenue</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-xs font-medium text-[#3dd68c]">$7,500</div>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-[#161718] border border-[#1a1b1c] rounded p-5 animate-slide-up" style={{ animationDelay: '0.25s' }}>
              <div className="flex items-center justify-between mb-5">
                <h3 className="text-sm font-medium text-[#e6e6e7]">Content Performance</h3>
                <div className="text-[10px] text-[#6c6e73]">Last 7 Days</div>
              </div>
              <div className="h-40 flex items-end justify-between gap-1.5">
                <div className="flex-1 flex flex-col items-center gap-2">
                  <div className="w-full bg-gradient-to-t from-[#9ea0a5] to-[#6c6e73] rounded-t relative group cursor-pointer" style={{ height: '45%' }}>
                    <div className="absolute -top-7 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 text-[10px] font-medium bg-[#161718] px-2 py-1 rounded border border-[#1a1b1c] whitespace-nowrap">
                      124 posts
                    </div>
                  </div>
                  <div className="text-[10px] text-[#6c6e73]">Mon</div>
                </div>
                <div className="flex-1 flex flex-col items-center gap-2">
                  <div className="w-full bg-gradient-to-t from-[#9ea0a5] to-[#6c6e73] rounded-t relative group cursor-pointer" style={{ height: '65%' }}>
                    <div className="absolute -top-7 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 text-[10px] font-medium bg-[#161718] px-2 py-1 rounded border border-[#1a1b1c] whitespace-nowrap">
                      156 posts
                    </div>
                  </div>
                  <div className="text-[10px] text-[#6c6e73]">Tue</div>
                </div>
                <div className="flex-1 flex flex-col items-center gap-2">
                  <div className="w-full bg-gradient-to-t from-[#9ea0a5] to-[#6c6e73] rounded-t relative group cursor-pointer" style={{ height: '35%' }}>
                    <div className="absolute -top-7 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 text-[10px] font-medium bg-[#161718] px-2 py-1 rounded border border-[#1a1b1c] whitespace-nowrap">
                      98 posts
                    </div>
                  </div>
                  <div className="text-[10px] text-[#6c6e73]">Wed</div>
                </div>
                <div className="flex-1 flex flex-col items-center gap-2">
                  <div className="w-full bg-gradient-to-t from-[#9ea0a5] to-[#6c6e73] rounded-t relative group cursor-pointer" style={{ height: '85%' }}>
                    <div className="absolute -top-7 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 text-[10px] font-medium bg-[#161718] px-2 py-1 rounded border border-[#1a1b1c] whitespace-nowrap">
                      178 posts
                    </div>
                  </div>
                  <div className="text-[10px] text-[#6c6e73]">Thu</div>
                </div>
                <div className="flex-1 flex flex-col items-center gap-2">
                  <div className="w-full bg-gradient-to-t from-[#9ea0a5] to-[#6c6e73] rounded-t relative group cursor-pointer" style={{ height: '55%' }}>
                    <div className="absolute -top-7 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 text-[10px] font-medium bg-[#161718] px-2 py-1 rounded border border-[#1a1b1c] whitespace-nowrap">
                      142 posts
                    </div>
                  </div>
                  <div className="text-[10px] text-[#6c6e73]">Fri</div>
                </div>
                <div className="flex-1 flex flex-col items-center gap-2">
                  <div className="w-full bg-gradient-to-t from-[#9ea0a5] to-[#6c6e73] rounded-t relative group cursor-pointer" style={{ height: '95%' }}>
                    <div className="absolute -top-7 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 text-[10px] font-medium bg-[#161718] px-2 py-1 rounded border border-[#1a1b1c] whitespace-nowrap">
                      189 posts
                    </div>
                  </div>
                  <div className="text-[10px] text-[#6c6e73]">Sat</div>
                </div>
                <div className="flex-1 flex flex-col items-center gap-2">
                  <div className="w-full bg-gradient-to-t from-[#9ea0a5] to-[#6c6e73] rounded-t relative group cursor-pointer" style={{ height: '100%' }}>
                    <div className="absolute -top-7 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 text-[10px] font-medium bg-[#161718] px-2 py-1 rounded border border-[#1a1b1c] whitespace-nowrap">
                      203 posts
                    </div>
                  </div>
                  <div className="text-[10px] text-[#6c6e73]">Sun</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="creators" className="relative py-20 overflow-hidden border-t border-[#1a1b1c]">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="order-2 lg:order-1 animate-slide-up">
              <div className="relative rounded overflow-hidden border border-[#1a1b1c] bg-[#0f1011] shadow-linear hover:border-[#232426] transition-all duration-200">
                <img
                  src="/assets/members/creator-profiles.png"
                  alt="Creator Profiles Interface"
                  className="w-full h-auto"
                />
              </div>
            </div>
            <div className="order-1 lg:order-2 animate-slide-up" style={{ animationDelay: '0.05s' }}>
              <h2 className="text-2xl font-medium mb-4 text-[#e6e6e7]">All creator data in one view</h2>
              <p className="text-sm text-[#9ea0a5] mb-6 leading-relaxed">
                Import creators from spreadsheets or campaigns and instantly see their stats, content, and audience.
                Stop searching DMs — get one source of truth.
              </p>
              <ul className="space-y-3 mb-6">
                {[
                  'Real-time follower and engagement stats',
                  'Contact & rate cards',
                  'Content links auto-synced',
                  'Tags & filters for easy sorting',
                ].map((item, i) => (
                  <li key={i} className="flex items-start gap-2.5">
                    <div className="mt-0.5 p-0.5 rounded-full bg-[#1a1b1c] border border-[#232426]">
                      <Check className="w-3 h-3 text-[#9ea0a5]" strokeWidth={2} />
                    </div>
                    <span className="text-xs text-[#9ea0a5]">{item}</span>
                  </li>
                ))}
              </ul>
              <a
                href="/how-it-works#creators"
                className="inline-flex items-center gap-1 text-[#9ea0a5] hover:text-[#e6e6e7] transition-colors duration-200 text-xs font-medium"
              >
                See how it works
                <ChevronRight className="w-3.5 h-3.5" strokeWidth={2} />
              </a>
            </div>
          </div>
        </div>
      </section>

      <section id="analytics" className="relative py-20 overflow-hidden border-t border-[#1a1b1c]">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="animate-slide-up">
              <h2 className="text-2xl font-medium mb-4 text-[#e6e6e7]">Measure what matters</h2>
              <p className="text-sm text-[#9ea0a5] mb-6 leading-relaxed">
                Track every post, story, and video from your creators.
                See engagement, conversions, and ROI — all live in one dashboard.
              </p>
              <ul className="space-y-3 mb-6">
                {[
                  'Performance by campaign & creator',
                  'Conversion attribution (Shopify/GA4)',
                  'ROI & budget tracking',
                  'Exportable reports',
                ].map((item, i) => (
                  <li key={i} className="flex items-start gap-2.5">
                    <div className="mt-0.5 p-0.5 rounded-full bg-[#1a1b1c] border border-[#232426]">
                      <Check className="w-3 h-3 text-[#9ea0a5]" strokeWidth={2} />
                    </div>
                    <span className="text-xs text-[#9ea0a5]">{item}</span>
                  </li>
                ))}
              </ul>
              <a
                href="/how-it-works#analytics"
                className="inline-flex items-center gap-1 text-[#9ea0a5] hover:text-[#e6e6e7] transition-colors duration-200 text-xs font-medium"
              >
                View analytics demo
                <ChevronRight className="w-3.5 h-3.5" strokeWidth={2} />
              </a>
            </div>
            <div className="animate-slide-up" style={{ animationDelay: '0.05s' }}>
              <div className="relative rounded overflow-hidden border border-[#1a1b1c] bg-[#0f1011] shadow-linear hover:border-[#232426] transition-all duration-200">
                <img
                  src="/assets/members/campaign-analytics.png"
                  alt="Campaign Analytics Dashboard"
                  className="w-full h-auto"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="library" className="relative py-20 overflow-hidden border-t border-[#1a1b1c]">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="order-2 lg:order-1 animate-slide-up">
              <div className="relative rounded overflow-hidden border border-[#1a1b1c] bg-[#0f1011] shadow-linear hover:border-[#232426] transition-all duration-200">
                <img
                  src="/assets/members/ugc-library.png"
                  alt="UGC Library Interface"
                  className="w-full h-auto"
                />
              </div>
            </div>
            <div className="order-1 lg:order-2 animate-slide-up" style={{ animationDelay: '0.05s' }}>
              <h2 className="text-2xl font-medium mb-4 text-[#e6e6e7]">Your entire UGC archive, organized</h2>
              <p className="text-sm text-[#9ea0a5] mb-6 leading-relaxed">
                Every creator post automatically stored, tagged, and rights-verified.
                Find, reuse, and track performance of each asset.
              </p>
              <ul className="space-y-3 mb-6">
                {[
                  'Auto-tagged content import',
                  'Rights tracking & expiry alerts',
                  'AI search by caption or product',
                  'Download & reuse with attribution',
                ].map((item, i) => (
                  <li key={i} className="flex items-start gap-2.5">
                    <div className="mt-0.5 p-0.5 rounded-full bg-[#1a1b1c] border border-[#232426]">
                      <Check className="w-3 h-3 text-[#9ea0a5]" strokeWidth={2} />
                    </div>
                    <span className="text-xs text-[#9ea0a5]">{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      <section id="reports" className="relative py-20 overflow-hidden border-t border-[#1a1b1c]">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="animate-slide-up">
              <h2 className="text-2xl font-medium mb-4 text-[#e6e6e7]">Turn data into insight</h2>
              <p className="text-sm text-[#9ea0a5] mb-6 leading-relaxed">
                Create client-ready reports in seconds.
                Share live dashboards with teammates or partners — no PDF chaos.
              </p>
              <ul className="space-y-3 mb-6">
                {[
                  'Live links & scheduled exports',
                  'Branded templates',
                  'PDF/CSV exports',
                  'Performance comparisons',
                ].map((item, i) => (
                  <li key={i} className="flex items-start gap-2.5">
                    <div className="mt-0.5 p-0.5 rounded-full bg-[#1a1b1c] border border-[#232426]">
                      <Check className="w-3 h-3 text-[#9ea0a5]" strokeWidth={2} />
                    </div>
                    <span className="text-xs text-[#9ea0a5]">{item}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="animate-slide-up" style={{ animationDelay: '0.05s' }}>
              <div className="relative rounded overflow-hidden border border-[#1a1b1c] bg-[#0f1011] shadow-linear hover:border-[#232426] transition-all duration-200">
                <img
                  src="/assets/members/report-impact.png"
                  alt="Reports and Impact Tracking"
                  className="w-full h-auto"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="relative py-16 overflow-hidden border-t border-[#1a1b1c]">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-10">
            <h2 className="text-2xl font-medium mb-3 text-[#e6e6e7]">Recent Campaigns</h2>
            <p className="text-sm text-[#9ea0a5] max-w-xl mx-auto">
              See how teams are organizing and tracking their creator collaborations
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-4">
            <div className="bg-[#161718] border border-[#1a1b1c] rounded overflow-hidden hover:border-[#232426] transition-all duration-200 group animate-slide-up">
              <div className="h-0.5 bg-gradient-to-r from-pink-500 to-rose-500"></div>
              <div className="p-5">
                <h3 className="font-medium text-sm mb-2.5 text-[#e6e6e7]">Summer Collection Launch</h3>
                <div className="flex items-center gap-3 text-xs text-[#9ea0a5] mb-3">
                  <div className="flex items-center gap-1">
                    <Users className="w-3 h-3" strokeWidth={1.5} />
                    <span>12 creators</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <FolderHeart className="w-3 h-3" strokeWidth={1.5} />
                    <span>48 content</span>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[10px] px-2 py-1 rounded border text-[#3dd68c] bg-[#1a1b1c] border-[#232426]">
                    Active
                  </span>
                  <button
                    onClick={onSignupClick}
                    className="text-[10px] text-[#6c6e73] hover:text-[#e6e6e7] transition-colors duration-200 flex items-center gap-0.5"
                  >
                    View details
                    <ChevronRight className="w-3 h-3" strokeWidth={2} />
                  </button>
                </div>
              </div>
            </div>

            <div className="bg-[#161718] border border-[#1a1b1c] rounded overflow-hidden hover:border-[#232426] transition-all duration-200 group animate-slide-up" style={{ animationDelay: '0.05s' }}>
              <div className="h-0.5 bg-gradient-to-r from-blue-500 to-cyan-500"></div>
              <div className="p-5">
                <h3 className="font-medium text-sm mb-2.5 text-[#e6e6e7]">Product Review Series</h3>
                <div className="flex items-center gap-3 text-xs text-[#9ea0a5] mb-3">
                  <div className="flex items-center gap-1">
                    <Users className="w-3 h-3" strokeWidth={1.5} />
                    <span>8 creators</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <FolderHeart className="w-3 h-3" strokeWidth={1.5} />
                    <span>32 content</span>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[10px] px-2 py-1 rounded border text-[#3dd68c] bg-[#1a1b1c] border-[#232426]">
                    Active
                  </span>
                  <button
                    onClick={onSignupClick}
                    className="text-[10px] text-[#6c6e73] hover:text-[#e6e6e7] transition-colors duration-200 flex items-center gap-0.5"
                  >
                    View details
                    <ChevronRight className="w-3 h-3" strokeWidth={2} />
                  </button>
                </div>
              </div>
            </div>

            <div className="bg-[#161718] border border-[#1a1b1c] rounded overflow-hidden hover:border-[#232426] transition-all duration-200 group animate-slide-up" style={{ animationDelay: '0.1s' }}>
              <div className="h-0.5 bg-gradient-to-r from-amber-500 to-orange-500"></div>
              <div className="p-5">
                <h3 className="font-medium text-sm mb-2.5 text-[#e6e6e7]">Brand Ambassador Program</h3>
                <div className="flex items-center gap-3 text-xs text-[#9ea0a5] mb-3">
                  <div className="flex items-center gap-1">
                    <Users className="w-3 h-3" strokeWidth={1.5} />
                    <span>24 creators</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <FolderHeart className="w-3 h-3" strokeWidth={1.5} />
                    <span>0 content</span>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[10px] px-2 py-1 rounded border text-[#f2994a] bg-[#1a1b1c] border-[#232426]">
                    Planning
                  </span>
                  <button
                    onClick={onSignupClick}
                    className="text-[10px] text-[#6c6e73] hover:text-[#e6e6e7] transition-colors duration-200 flex items-center gap-0.5"
                  >
                    View details
                    <ChevronRight className="w-3 h-3" strokeWidth={2} />
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div className="text-center mt-6">
            <button
              onClick={onSignupClick}
              className="group inline-flex items-center gap-1.5 text-[#9ea0a5] hover:text-[#e6e6e7] transition-colors duration-200 text-xs font-medium"
            >
              View all campaigns in your workspace
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform duration-200" strokeWidth={2} />
            </button>
          </div>
        </div>
      </section>

      <section id="integrations" className="relative py-20 overflow-hidden border-t border-[#1a1b1c]">
        <div className="max-w-7xl mx-auto px-6 text-center">
          <h2 className="text-2xl font-medium mb-4 text-[#e6e6e7]">Works with your stack</h2>
          <p className="text-sm text-[#9ea0a5] mb-10 max-w-xl mx-auto">
            Connect UGC System to the tools you already use.
          </p>

          <div className="flex flex-wrap justify-center gap-4 mb-10">
            {['Shopify', 'GA4', 'TikTok', 'Meta', 'Klaviyo', 'Gorgias'].map((logo, i) => (
              <div
                key={i}
                className="px-5 py-2.5 bg-[#161718] border border-[#1a1b1c] rounded text-[#9ea0a5] text-xs font-medium"
              >
                {logo}
              </div>
            ))}
          </div>

          <ul className="grid sm:grid-cols-2 gap-4 max-w-2xl mx-auto mb-6 text-left">
            {[
              'Two-way data sync with Shopify & GA4',
              'Import campaign costs from Meta/TikTok',
              'Auto-push reports to Slack or email',
            ].map((item, i) => (
              <li key={i} className="flex items-start gap-2.5">
                <div className="mt-0.5 p-0.5 rounded-full bg-[#1a1b1c] border border-[#232426]">
                  <Check className="w-3 h-3 text-[#9ea0a5]" strokeWidth={2} />
                </div>
                <span className="text-xs text-[#9ea0a5]">{item}</span>
              </li>
            ))}
          </ul>

          <a
            href="/how-it-works#integrations"
            className="inline-flex items-center gap-1 text-[#9ea0a5] hover:text-[#e6e6e7] transition-colors duration-200 text-xs font-medium"
          >
            Explore Integrations
            <ChevronRight className="w-3.5 h-3.5" strokeWidth={2} />
          </a>
        </div>
      </section>

      <section id="collaboration" className="relative py-20 overflow-hidden border-t border-[#1a1b1c]">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="animate-slide-up">
              <h2 className="text-2xl font-medium mb-4 text-[#e6e6e7]">Built for busy teams</h2>
              <p className="text-sm text-[#9ea0a5] mb-6 leading-relaxed">
                Assign creators, automate reminders, and keep everyone aligned — from outreach to reporting.
              </p>
              <ul className="space-y-3 mb-6">
                {[
                  'Multi-seat access',
                  'Commenting & notes',
                  'Automated status updates',
                  'Workflow reminders',
                ].map((item, i) => (
                  <li key={i} className="flex items-start gap-2.5">
                    <div className="mt-0.5 p-0.5 rounded-full bg-[#1a1b1c] border border-[#232426]">
                      <Check className="w-3 h-3 text-[#9ea0a5]" strokeWidth={2} />
                    </div>
                    <span className="text-xs text-[#9ea0a5]">{item}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="animate-slide-up" style={{ animationDelay: '0.05s' }}>
              <div className="relative rounded overflow-hidden border border-[#1a1b1c] bg-[#0f1011] shadow-linear hover:border-[#232426] transition-all duration-200">
                <img
                  src="/assets/members/track-campaigns.png"
                  alt="Team Collaboration Features"
                  className="w-full h-auto"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="relative py-20 overflow-hidden border-t border-[#1a1b1c]">
        <div className="max-w-5xl mx-auto px-6">
          <div className="grid sm:grid-cols-3 gap-6 text-center">
            <div className="p-6 bg-[#161718] border border-[#1a1b1c] rounded">
              <div className="text-4xl font-medium text-[#e6e6e7] mb-2">8.5h</div>
              <div className="text-xs text-[#9ea0a5]">Hours saved per week per team</div>
            </div>
            <div className="p-6 bg-[#161718] border border-[#1a1b1c] rounded">
              <div className="text-4xl font-medium text-[#e6e6e7] mb-2">+42%</div>
              <div className="text-xs text-[#9ea0a5]">Average ROI increase vs manual process</div>
            </div>
            <div className="p-6 bg-[#161718] border border-[#1a1b1c] rounded">
              <div className="text-4xl font-medium text-[#e6e6e7] mb-2">65%</div>
              <div className="text-xs text-[#9ea0a5]">Creator approval speed improvement</div>
            </div>
          </div>
          <p className="text-center text-[10px] text-[#6c6e73] mt-6">
            Data aggregated from active UGC System workspaces.
          </p>
        </div>
      </section>

      <section className="relative py-20 overflow-hidden border-t border-[#1a1b1c]">
        <div className="max-w-3xl mx-auto px-6 text-center">
          <h2 className="text-2xl font-medium mb-4 text-[#e6e6e7]">Ready to work smarter with your creators?</h2>
          <p className="text-sm text-[#9ea0a5] mb-6 max-w-xl mx-auto">
            Every feature you've just seen is live in the UGC System dashboard.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <button
              onClick={onSignupClick}
              className="group px-4 py-2 bg-white hover:bg-gray-100 rounded text-xs font-medium transition-all duration-200 flex items-center gap-1.5 text-black"
            >
              Start Free Trial
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform duration-200" strokeWidth={2} />
            </button>
            <a
              href="/pricing"
              className="px-4 py-2 text-xs text-[#9ea0a5] hover:text-[#e6e6e7] bg-[#161718] hover:bg-[#1a1b1c] border border-[#1a1b1c] hover:border-[#232426] rounded transition-all duration-200"
            >
              See Pricing
            </a>
          </div>
        </div>
      </section>
    </div>
  );
}
