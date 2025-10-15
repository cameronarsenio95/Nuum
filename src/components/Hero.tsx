import { ArrowRight, Play, ChevronDown } from 'lucide-react';
import { useState, useEffect, useRef } from 'react';

interface HeroProps {
  onSignupClick: () => void;
  onDemoClick: () => void;
}

const brandLogos = ['Saint Blanc', 'Celest Diary', 'Aura Cosmetics', 'Viva Agency'];

export function Hero({ onSignupClick, onDemoClick }: HeroProps) {
  const [showScrollIndicator, setShowScrollIndicator] = useState(true);
  const [isVisible, setIsVisible] = useState(false);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [imageLoaded, setImageLoaded] = useState(false);
  const heroRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), 1500);

    const handleScroll = () => {
      if (window.scrollY > 100) {
        setShowScrollIndicator(false);
      } else {
        setShowScrollIndicator(true);
      }
    };

    const handleMouseMove = (e: MouseEvent) => {
      if (heroRef.current) {
        const rect = heroRef.current.getBoundingClientRect();
        const x = (e.clientX - rect.left - rect.width / 2) / rect.width;
        const y = (e.clientY - rect.top - rect.height / 2) / rect.height;
        setMousePosition({ x, y });
      }
    };

    window.addEventListener('scroll', handleScroll);
    window.addEventListener('mousemove', handleMouseMove);

    return () => {
      clearTimeout(timer);
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('mousemove', handleMouseMove);
    };
  }, []);

  const handleCTAClick = () => {
    if (window.UGC?.track) {
      window.UGC.track('click_cta_hero_start');
    }
    onSignupClick();
  };

  const handleDemoClick = () => {
    if (window.UGC?.track) {
      window.UGC.track('click_cta_watch_demo');
    }
    onDemoClick();
  };

  const handleScrollClick = () => {
    const nextSection = document.querySelector('section:nth-of-type(2)');
    if (nextSection) {
      nextSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  return (
    <section id="hero" ref={heroRef} className="relative min-h-screen flex items-center justify-center overflow-hidden pt-24 md:pt-20 pb-24 md:pb-32 px-4">
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-20 left-10 w-72 h-72 rounded-full blur-3xl dark:bg-linear-accent/20 light:bg-linear-light-accent/20" />
        <div className="absolute bottom-20 right-10 w-96 h-96 rounded-full blur-3xl dark:bg-linear-accent/10 light:bg-linear-light-accent/10" />
      </div>

      <div className="relative max-w-7xl mx-auto w-full">
        <div className="grid lg:grid-cols-2 gap-8 md:gap-12 lg:gap-16 items-center">
          <div className="animate-slide-up">
            <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-semibold mb-4 md:mb-6 text-balance leading-tight tracking-tight">
              All your creator data. One system.
            </h1>

            <p className="text-base sm:text-lg md:text-xl mb-6 md:mb-8 max-w-xl text-balance dark:text-text-secondary light:text-text-light-secondary leading-relaxed">
              Centralize creators, campaigns, and UGC — turn spreadsheets into a clear, measurable workflow.
            </p>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-start gap-3">
              <button
                onClick={handleCTAClick}
                className="group px-6 py-3 sm:px-5 sm:py-2.5 rounded-md text-base sm:text-sm font-medium linear-transition flex items-center justify-center gap-2 touch-manipulation active:scale-95 dark:bg-linear-accent dark:hover:bg-linear-accent-hover dark:text-linear-bg dark:hover:shadow-lg dark:hover:shadow-linear-accent/20 light:bg-linear-light-accent light:hover:bg-linear-light-accent-hover light:text-linear-light-bg light:hover:shadow-lg light:hover:shadow-linear-light-accent/20"
              >
                Start Free
                <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 linear-transition" strokeWidth={2} />
              </button>
              <button
                onClick={handleDemoClick}
                className="flex items-center justify-center gap-2 px-6 py-3 sm:px-5 sm:py-2.5 text-base sm:text-sm rounded-md linear-transition border touch-manipulation active:scale-95 dark:text-text-secondary dark:hover:text-text-primary dark:bg-linear-bg-hover dark:hover:bg-linear-bg-active dark:border-linear-border-subtle dark:hover:border-linear-border-hover light:text-text-light-secondary light:hover:text-text-light-primary light:bg-linear-light-bg-hover light:hover:bg-linear-light-bg-active light:border-linear-light-border light:hover:border-linear-light-border-hover"
              >
                <Play className="w-4 h-4" strokeWidth={2} />
                Watch Demo
              </button>
            </div>
          </div>

          <div
            className="relative mt-8 lg:mt-0"
            style={{
              perspective: '2000px',
            }}
          >
            <div
              className="relative transform-gpu transition-transform duration-200 ease-out"
              style={{
                transform: `
                  rotateX(${mousePosition.y * -5}deg)
                  rotateY(${mousePosition.x * 5}deg)
                  translateZ(0)
                `,
              }}
            >
              <div className="relative rounded-lg overflow-hidden border shadow-2xl dark:border-linear-border-subtle dark:bg-linear-bg-elevated light:border-linear-light-border light:bg-linear-light-bg-elevated">
                <div className="absolute inset-0 bg-gradient-to-br via-transparent to-transparent dark:from-linear-accent/10 light:from-linear-light-accent/10" />

                <div className="relative p-6">
                  <div className="flex items-center justify-between mb-6">
                    <div>
                      <div className="h-2.5 w-28 rounded animate-pulse dark:bg-white/90 light:bg-black/90" style={{ animationDelay: '0ms', animationDuration: '2000ms' }} />
                      <div className="h-2 w-40 rounded mt-1.5 animate-pulse dark:bg-white/50 light:bg-black/50" style={{ animationDelay: '100ms', animationDuration: '2000ms' }} />
                    </div>
                    <div className="flex gap-2">
                      <div className="h-7 w-20 rounded flex items-center justify-center dark:bg-linear-accent dark:text-linear-bg light:bg-linear-light-accent light:text-linear-light-bg">
                        <div className="h-1.5 w-14 rounded animate-pulse dark:bg-white/80 light:bg-black/80" style={{ animationDuration: '2000ms' }} />
                      </div>
                      <div className="h-7 w-7 rounded flex items-center justify-center border dark:bg-white/10 dark:border-white/20 light:bg-black/10 light:border-black/20">
                        <div className="h-1 w-3.5 rounded dark:bg-white/60 light:bg-black/60" />
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-4 gap-3 mb-6">
                  {[
                    { label: 'Active Creators', value: '142', change: '+12%', color: 'green' },
                    { label: 'Campaigns', value: '38', change: '+5%', color: 'green' },
                    { label: 'Total Content', value: '1,248', change: '+18%', color: 'green' },
                    { label: 'Total Revenue', value: '$87.2K', change: '+24%', color: 'green' },
                    ].map((stat, i) => (
                      <div key={i} className="border rounded-md p-2.5 transition-colors duration-200 dark:bg-linear-bg-hover dark:border-linear-border-subtle dark:hover:bg-linear-bg-active light:bg-linear-light-bg-hover light:border-linear-light-border light:hover:bg-linear-light-bg-active">
                        <div className="text-[9px] mb-1.5 font-medium tracking-wide uppercase dark:text-text-tertiary light:text-text-light-tertiary">{stat.label}</div>
                        <div className="text-lg font-semibold mb-0.5 dark:text-text-primary light:text-text-light-primary">{stat.value}</div>
                        <div className="flex items-center gap-1">
                          <div className="text-[9px] font-medium dark:text-linear-success light:text-linear-light-success">{stat.change}</div>
                          <div className="w-1.5 h-1.5">
                            <svg viewBox="0 0 12 12" className="fill-current dark:text-linear-success light:text-linear-light-success">
                              <path d="M6 3l4 4H2z" />
                            </svg>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="border rounded-md p-4 transition-colors duration-200 dark:bg-linear-bg-hover dark:border-linear-border-subtle dark:hover:bg-linear-bg-active light:bg-linear-light-bg-hover light:border-linear-light-border light:hover:bg-linear-light-bg-active">
                      <div className="text-[10px] mb-3 font-medium uppercase tracking-wide dark:text-text-tertiary light:text-text-light-tertiary">Top Creators</div>
                      <div className="space-y-2.5">
                      {[
                        { name: '@sarahcreates', revenue: '$12,400', color: 'from-gray-500 to-gray-600' },
                        { name: '@markvisuals', revenue: '$9,800', color: 'from-gray-600 to-gray-700' },
                        { name: '@emilystyle', revenue: '$8,200', color: 'from-gray-500 to-gray-700' },
                        { name: '@alexcontent', revenue: '$7,500', color: 'from-gray-600 to-gray-800' },
                        ].map((creator, i) => (
                          <div key={i} className="flex items-center gap-2.5 group p-1.5 -mx-1.5 rounded transition-colors duration-150 dark:hover:bg-linear-bg-hover light:hover:bg-linear-light-bg-hover">
                            <div className={`h-7 w-7 rounded-full bg-gradient-to-br ${creator.color} flex items-center justify-center text-white text-[10px] font-semibold shadow-lg`}>
                              {creator.name[1].toUpperCase()}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="text-[11px] font-medium truncate dark:text-text-primary light:text-text-light-primary">{creator.name}</div>
                              <div className="text-[9px] mt-0.5 dark:text-text-tertiary light:text-text-light-tertiary">Total Revenue</div>
                            </div>
                            <div className="text-[11px] font-semibold dark:text-linear-success light:text-linear-light-success">{creator.revenue}</div>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="border rounded-md p-4 transition-colors duration-200 dark:bg-linear-bg-hover dark:border-linear-border-subtle dark:hover:bg-linear-bg-active light:bg-linear-light-bg-hover light:border-linear-light-border light:hover:bg-linear-light-bg-active">
                      <div className="flex items-center justify-between mb-3">
                        <div className="text-[10px] font-medium uppercase tracking-wide dark:text-text-tertiary light:text-text-light-tertiary">Content Performance</div>
                        <div className="text-[9px] uppercase tracking-wide dark:text-text-tertiary light:text-text-light-tertiary">Last 7 Days</div>
                      </div>
                      <div className="h-32 w-full rounded relative overflow-hidden">
                      <div className="absolute bottom-0 left-0 right-0 flex items-end justify-between gap-1.5 h-full">
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
                                className="w-full bg-gradient-to-t rounded-t transition-all duration-200 relative overflow-hidden dark:from-linear-accent dark:to-linear-accent/60 dark:hover:from-linear-accent-hover dark:hover:to-linear-accent/70 light:from-linear-light-accent light:to-linear-light-accent/60 light:hover:from-linear-light-accent-hover light:hover:to-linear-light-accent/70"
                                style={{ height: `${day.height}%` }}
                              >
                                <div className="absolute inset-0 bg-gradient-to-t from-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
                              </div>
                              <div className="text-[8px] mt-1.5 font-medium dark:text-text-quaternary light:text-text-light-quaternary">{day.label}</div>
                            </div>
                          ))}
                        </div>
                        <div className="absolute top-0 left-0 right-0 h-px dark:bg-linear-border-subtle light:bg-linear-light-border-subtle" />
                        <div className="absolute top-1/3 left-0 right-0 h-px dark:bg-linear-border-subtle light:bg-linear-light-border-subtle" />
                        <div className="absolute top-2/3 left-0 right-0 h-px dark:bg-linear-border-subtle light:bg-linear-light-border-subtle" />
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 border rounded-md p-4 transition-colors duration-200 dark:bg-linear-bg-hover dark:border-linear-border-subtle dark:hover:bg-linear-bg-active light:bg-linear-light-bg-hover light:border-linear-light-border light:hover:bg-linear-light-bg-active">
                    <div className="flex items-center justify-between mb-3">
                      <div className="text-[10px] font-medium uppercase tracking-wide dark:text-text-tertiary light:text-text-light-tertiary">Recent Campaigns</div>
                      <div className="text-[9px] font-medium cursor-pointer transition-colors dark:text-linear-accent dark:hover:text-linear-accent-hover light:text-text-light-link light:hover:text-text-light-link-hover">View All →</div>
                    </div>
                    <div className="space-y-2.5">
                    {[
                      {
                        title: 'Summer Collection Launch',
                        status: 'Active',
                        creators: 12,
                        content: 48,
                        statusColor: 'green',
                        image: 'from-orange-400 to-pink-500'
                      },
                      {
                        title: 'Product Review Series',
                        status: 'Active',
                        creators: 8,
                        content: 32,
                        statusColor: 'green',
                        image: 'from-blue-400 to-cyan-500'
                      },
                      {
                        title: 'Brand Ambassador Program',
                        status: 'Planning',
                        creators: 24,
                        content: 0,
                        statusColor: 'yellow',
                        image: 'from-gray-500 to-gray-600'
                      },
                      ].map((campaign, i) => (
                        <div key={i} className="flex items-center justify-between py-1.5 px-2.5 -mx-2.5 rounded-md transition-all duration-150 group cursor-pointer dark:hover:bg-linear-bg-hover light:hover:bg-linear-light-bg-hover">
                          <div className="flex items-center gap-3 flex-1 min-w-0">
                            <div className={`h-10 w-10 rounded-md bg-gradient-to-br ${campaign.image} flex-shrink-0 shadow-lg`}>
                              <div className="h-full w-full bg-white/10 rounded-md" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="text-[11px] font-medium transition-colors truncate dark:text-text-secondary dark:group-hover:text-text-primary light:text-text-light-secondary light:group-hover:text-text-light-primary">{campaign.title}</div>
                              <div className="flex items-center gap-2 mt-0.5">
                                <div className="text-[9px] dark:text-text-tertiary light:text-text-light-tertiary">
                                  <span className="font-medium dark:text-text-secondary light:text-text-light-secondary">{campaign.creators}</span> creators
                                </div>
                                <div className="w-0.5 h-0.5 rounded-full dark:bg-linear-border light:bg-linear-light-border" />
                                <div className="text-[9px] dark:text-text-tertiary light:text-text-light-tertiary">
                                  <span className="font-medium dark:text-text-secondary light:text-text-light-secondary">{campaign.content}</span> content
                                </div>
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-2 flex-shrink-0">
                            <div className={`px-2.5 py-0.5 rounded-full text-[9px] font-medium border ${
                              campaign.statusColor === 'green'
                                ? 'dark:bg-linear-success-subtle dark:text-linear-success dark:border-linear-success-border light:bg-linear-light-success-subtle light:text-linear-light-success light:border-linear-light-success-border'
                                : 'dark:bg-linear-warning-subtle dark:text-linear-warning dark:border-linear-warning-border light:bg-linear-light-warning-subtle light:text-linear-light-warning light:border-linear-light-warning-border'
                            }`}>
                              {campaign.status}
                            </div>
                            <div className="transition-colors dark:text-text-quaternary dark:group-hover:text-text-tertiary light:text-text-light-quaternary light:group-hover:text-text-light-tertiary">
                              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                              </svg>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent pointer-events-none" />

                <div className="absolute -inset-px rounded-lg bg-gradient-to-br from-linear-accent/30 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
              </div>

              <div
                className="absolute -inset-4 bg-gradient-to-r via-transparent rounded-lg blur-2xl opacity-50 -z-10 dark:from-linear-accent/20 dark:to-linear-accent/20 light:from-linear-light-accent/20 light:to-linear-light-accent/20"
                style={{
                  transform: `translateZ(-50px)`,
                }}
              />
            </div>
          </div>
        </div>
      </div>

      <button
        onClick={handleScrollClick}
        aria-label="Scroll to next section"
        className={`absolute bottom-10 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 cursor-pointer group transition-all duration-500 ${
          isVisible && showScrollIndicator ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
      >
        <span className="text-xs opacity-50 group-hover:opacity-70 transition-opacity duration-300 dark:text-text-secondary light:text-text-light-secondary">
          scroll to explore
        </span>
        <ChevronDown
          className="w-6 h-6 md:w-6 md:h-6 opacity-60 group-hover:opacity-100 group-hover:scale-110 transition-all duration-300 animate-bounce-slow dark:text-linear-accent light:text-linear-light-accent"
          strokeWidth={2}
        />
      </button>
    </section>
  );
}
