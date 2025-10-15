import { ArrowRight, ArrowLeft, Download, FileText, BarChart3, Users, TrendingUp } from 'lucide-react';
import { useState, useEffect } from 'react';
import { Header } from '../components/Header';
import { Footer } from '../components/Footer';

type Category = 'all' | 'data' | 'templates' | 'case-studies' | 'tutorials';

const featuredInsights = [
  {
    id: 1,
    category: 'data',
    image: '📊',
    title: 'The Creator ROI Report — 2025 Edition',
    description: 'What 2,000 influencer campaigns taught us about real conversion rates.',
  },
  {
    id: 2,
    category: 'data',
    image: '📈',
    title: 'Top Performing UGC Formats in Fashion',
    description: 'From try-ons to testimonials — see which content drives the highest CTR.',
  },
  {
    id: 3,
    category: 'templates',
    image: '📝',
    title: 'UGC Brief Template (Free Download)',
    description: 'Our internal template for clear creator communication — ready to copy.',
  },
  {
    id: 4,
    category: 'case-studies',
    image: '✨',
    title: 'Case Study: How AURA Cosmetics Grew 180% With UGC System',
    description: 'Inside look at their workflow and analytics setup.',
  },
  {
    id: 5,
    category: 'tutorials',
    image: '🎯',
    title: 'How to Track Creator Performance Like a Pro',
    description: 'A step-by-step guide to building meaningful KPI dashboards.',
  },
  {
    id: 6,
    category: 'data',
    image: '💡',
    title: 'What Makes Creators Actually Convert',
    description: 'Analysis of 500+ campaigns reveals the hidden patterns behind sales.',
  },
];

const dataStats = [
  {
    stat: '4.8%',
    label: 'Average engagement rate across beauty creators',
  },
  {
    stat: '2.3x',
    label: 'UGC videos convert higher than static images',
  },
  {
    stat: '+27%',
    label: 'Influencer retention increases when performance is visible',
  },
];

const templates = [
  {
    icon: FileText,
    name: 'UGC Campaign Brief Template',
    format: '.docx',
    description: 'Complete brief structure for creator partnerships',
  },
  {
    icon: Users,
    name: 'Creator Outreach Email Template',
    format: '.txt',
    description: 'Proven email scripts that get responses',
  },
  {
    icon: BarChart3,
    name: 'Monthly Report Sheet',
    format: '.xlsx',
    description: 'Track campaign performance over time',
  },
  {
    icon: TrendingUp,
    name: 'Performance Summary Deck',
    format: '.pptx',
    description: 'Present results to stakeholders',
  },
];

const caseStudies = [
  {
    brand: 'Saint Blanc',
    result: 'Cut campaign reporting time by 80%.',
  },
  {
    brand: 'Celest Diary',
    result: 'Scaled to 120 creators with 1 dashboard.',
  },
  {
    brand: 'Viva Agency',
    result: 'Reduced UGC approval time by 65%.',
  },
];

interface ResourcesPageProps {
  onBackClick: () => void;
  onLoginClick: () => void;
  onSignupClick?: () => void;
  onPricingClick?: () => void;
  onResourcesClick?: () => void;
  onHowItWorksClick?: () => void;
}

export function ResourcesPage({ onBackClick, onLoginClick, onSignupClick, onPricingClick, onResourcesClick, onHowItWorksClick }: ResourcesPageProps) {
  const [activeCategory, setActiveCategory] = useState<Category>('all');
  const [activeSection, setActiveSection] = useState('hero');
  const [showStickyCTA, setShowStickyCTA] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      const sections = ['hero', 'insights', 'data', 'templates', 'case-studies', 'cta'];
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
    { id: 'insights', label: 'Insights' },
    { id: 'data', label: 'Data' },
    { id: 'templates', label: 'Templates' },
    { id: 'case-studies', label: 'Case Studies' },
    { id: 'cta', label: 'Get Started' },
  ];

  const filteredInsights = featuredInsights.filter(
    (insight) => activeCategory === 'all' || insight.category === activeCategory
  );

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
        <div className="absolute top-40 left-10 w-72 h-72 bg-linear-accent/10 rounded-full blur-3xl animate-pulse text-linear-bg" style={{ animationDuration: '5s' }} />
        <div className="absolute bottom-40 right-10 w-96 h-96 bg-linear-accent/5 rounded-full blur-3xl animate-pulse text-linear-bg" style={{ animationDuration: '7s' }} />
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
            className="group px-6 py-3 bg-linear-accent hover:bg-linear-accent-hover hover:shadow-xl hover:shadow-linear-accent/30 rounded-linear text-sm font-medium linear-transition flex items-center gap-2 text-linear-bg"
          >
            Start Free
            <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 linear-transition" strokeWidth={2} />
          </button>
        </div>
      )}

      <div className="pt-24 px-6 bg-gradient-to-b from-linear-bg-subtle/30 to-transparent relative">
        <section id="hero" className="py-12 max-w-7xl mx-auto">
          <button
            onClick={onBackClick}
            className="flex items-center gap-2 text-sm dark:text-text-secondary light:text-text-light-secondary hover:dark:text-text-primary light:text-text-light-primary linear-transition mb-12"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to home
          </button>

          <div className="text-center mb-12 animate-slide-up">
              <h1 className="mb-6 text-balance">Insights that make creator marketing smarter.</h1>
              <p className="text-xl dark:text-text-secondary light:text-text-light-secondary text-balance max-w-3xl mx-auto mb-8">
                Learn from real creator data, performance reports, and workflow templates — straight from inside
                UGC System.
              </p>
              <button
                onClick={() => document.getElementById('insights')?.scrollIntoView({ behavior: 'smooth' })}
                className="group px-6 py-3 bg-white/10 hover:bg-white/15 border dark:border-linear-border-subtle light:border-linear-light-border-subtle hover:dark:border-linear-border light:border-linear-light-border rounded-linear text-sm font-medium linear-transition inline-flex items-center gap-2"
              >
                Browse Insights
                <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 linear-transition" strokeWidth={2} />
              </button>
            </div>

          <div className="dark:bg-linear-bg-secondary light:bg-linear-light-bg-secondary border dark:border-linear-border-subtle light:border-linear-light-border-subtle rounded-linear-lg p-8 max-w-4xl mx-auto hover:dark:border-linear-border light:border-linear-light-border linear-transition hover:scale-[1.01] animate-slide-up" style={{ animationDelay: '0.2s' }}>
              <div className="grid grid-cols-3 gap-4">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="dark:bg-linear-bg light:bg-linear-light-bg border dark:border-linear-border-subtle light:border-linear-light-border-subtle rounded-linear p-4 hover:dark:border-linear-border light:border-linear-light-border linear-transition">
                    <div className="h-2 bg-linear-bg-subtle rounded w-1/2 mb-3" />
                    <div className="h-12 bg-gradient-to-br from-linear-accent/20 to-linear-accent/5 rounded mb-2" />
                    <div className="h-2 bg-linear-bg-subtle rounded w-3/4" />
                  </div>
                ))}
              </div>
          </div>
        </section>

        <section id="insights" className="py-20 px-6">
          <div className="max-w-7xl mx-auto">
          <div className="flex flex-wrap gap-3 justify-center mb-12">
              {[
                { key: 'all', label: 'All' },
                { key: 'data', label: 'Data Reports' },
                { key: 'templates', label: 'Templates' },
                { key: 'case-studies', label: 'Case Studies' },
                { key: 'tutorials', label: 'Tutorials' },
              ].map((cat) => (
                <button
                  key={cat.key}
                  onClick={() => setActiveCategory(cat.key as Category)}
                  className={`px-4 py-2 rounded-linear text-sm font-medium linear-transition ${
                    activeCategory === cat.key
                      ? 'bg-white text-black'
                      : 'bg-linear-bg-secondary border border-linear-border-subtle hover:border-linear-border text-text-secondary'
                  }`}
                >
                  {cat.label}
                </button>
              ))}
            </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              {filteredInsights.map((insight) => (
                <div
                  key={insight.id}
                  className="dark:bg-linear-bg-secondary light:bg-linear-light-bg-secondary border dark:border-linear-border-subtle light:border-linear-light-border-subtle rounded-linear-lg overflow-hidden hover:dark:border-linear-border light:border-linear-light-border hover:scale-[1.02] hover:shadow-lg linear-transition cursor-pointer group animate-slide-up"
                  style={{ animationDelay: `${0.1 * (insight.id % 3)}s` }}
                >
                  <div className="aspect-video bg-gradient-to-br from-linear-bg-subtle to-linear-bg flex items-center justify-center text-5xl">
                    {insight.image}
                  </div>
                  <div className="p-6">
                    <h3 className="text-lg font-medium mb-2 group-hover:text-white linear-transition">
                      {insight.title}
                    </h3>
                    <p className="dark:text-text-secondary light:text-text-light-secondary text-sm mb-4">{insight.description}</p>
                    <button className="text-sm dark:text-text-secondary light:text-text-light-secondary hover:dark:text-text-primary light:text-text-light-primary linear-transition inline-flex items-center gap-1">
                      Read More
                      <ArrowRight className="w-3 h-3" strokeWidth={2} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section id="data" className="py-20 px-6 bg-linear-bg-subtle/30">
          <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12 animate-slide-up">
              <h2 className="text-2xl font-medium mb-4">Exclusive data, from inside our platform.</h2>
              <p className="dark:text-text-secondary light:text-text-light-secondary max-w-2xl mx-auto">
                Each month, UGC System analyzes thousands of creator posts and campaign results. We turn that data
                into actionable insights for brands and agencies.
              </p>
            </div>

          <div className="grid md:grid-cols-3 gap-8 mb-8">
              {dataStats.map((item, index) => (
                <div
                  key={index}
                  className="dark:bg-linear-bg-secondary light:bg-linear-light-bg-secondary border dark:border-linear-border-subtle light:border-linear-light-border-subtle rounded-linear-lg p-8 text-center hover:dark:border-linear-border light:border-linear-light-border hover:shadow-lg linear-transition hover:scale-[1.02] animate-slide-up"
                  style={{ animationDelay: `${0.1 * index}s` }}
                >
                  <div className="text-4xl font-medium mb-2 text-linear-accent">{item.stat}</div>
                  <p className="dark:text-text-secondary light:text-text-light-secondary text-sm">{item.label}</p>
                </div>
              ))}
            </div>

          <div className="text-center">
              <button className="px-6 py-3 bg-white/10 hover:bg-white/15 border dark:border-linear-border-subtle light:border-linear-light-border-subtle hover:dark:border-linear-border light:border-linear-light-border rounded-linear text-sm font-medium linear-transition">
                See Full Data Report
              </button>
            </div>
          </div>
        </section>

        <section id="templates" className="py-20 px-6">
          <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12 animate-slide-up">
              <h2 className="text-2xl font-medium mb-4">Ready-to-use templates</h2>
              <p className="dark:text-text-secondary light:text-text-light-secondary">Built from real workflows inside UGC System.</p>
            </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              {templates.map((template, index) => {
                const Icon = template.icon;
                return (
                  <div
                    key={index}
                    className="dark:bg-linear-bg-secondary light:bg-linear-light-bg-secondary border dark:border-linear-border-subtle light:border-linear-light-border-subtle rounded-linear p-6 hover:dark:border-linear-border light:border-linear-light-border hover:shadow-lg linear-transition group hover:scale-[1.02] animate-slide-up"
                    style={{ animationDelay: `${0.1 * index}s` }}
                  >
                    <div className="w-12 h-12 bg-white/10 rounded-linear flex items-center justify-center mb-4 group-hover:bg-white/15 linear-transition">
                      <Icon className="w-6 h-6" strokeWidth={1.5} />
                    </div>
                    <h3 className="font-medium mb-1">{template.name}</h3>
                    <p className="text-xs dark:text-text-secondary light:text-text-light-secondary mb-4">{template.description}</p>
                    <button className="w-full py-2 bg-white/5 hover:bg-white/10 border dark:border-linear-border-subtle light:border-linear-light-border-subtle rounded-linear text-xs font-medium linear-transition flex items-center justify-center gap-2">
                      <Download className="w-3 h-3" strokeWidth={2} />
                      Download {template.format}
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        <section id="case-studies" className="py-20 px-6 bg-linear-bg-subtle/30">
          <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12 animate-slide-up">
              <h2 className="text-2xl font-medium mb-4">See how brands use UGC System.</h2>
            </div>

          <div className="grid md:grid-cols-3 gap-8">
              {caseStudies.map((study, index) => (
                <div
                  key={index}
                  className="dark:bg-linear-bg-secondary light:bg-linear-light-bg-secondary border dark:border-linear-border-subtle light:border-linear-light-border-subtle rounded-linear-lg p-8 hover:dark:border-linear-border light:border-linear-light-border hover:scale-[1.02] hover:shadow-lg linear-transition cursor-pointer animate-slide-up"
                  style={{ animationDelay: `${0.1 * index}s` }}
                >
                  <div className="w-12 h-12 bg-white/10 rounded-full mb-6 flex items-center justify-center text-xl font-medium">
                    {study.brand.charAt(0)}
                  </div>
                  <h3 className="text-lg font-medium mb-2">{study.brand}</h3>
                  <p className="dark:text-text-secondary light:text-text-light-secondary">{study.result}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section id="cta" className="py-20 px-6">
          <div className="max-w-4xl mx-auto text-center animate-slide-up">
            <h2 className="text-2xl font-medium mb-4">Bring these insights into your own workflow.</h2>
            <p className="dark:text-text-secondary light:text-text-light-secondary mb-8">
              All the data, automation, and templates you see here — built directly into your UGC System account.
            </p>
            <button
              onClick={onLoginClick}
              className="group px-6 py-3 bg-linear-accent hover:bg-linear-accent-hover hover:shadow-lg hover:shadow-linear-accent/20 rounded-linear text-sm font-medium linear-transition inline-flex items-center gap-2 text-linear-bg"
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
