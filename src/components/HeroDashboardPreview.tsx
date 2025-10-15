import { Users, TrendingUp, FolderKanban } from 'lucide-react';
import { useEffect, useState } from 'react';

const views = [
  {
    id: 'creators',
    title: 'Creator Profiles',
    component: () => (
      <div className="p-4 space-y-2.5">
        {[
          { name: 'Sarah Johnson', handle: '@sarahjohnson', followers: '125K', engagement: '4.2%' },
          { name: 'Emma Davis', handle: '@emmadavis', followers: '89K', engagement: '5.1%' },
          { name: 'Lisa Chen', handle: '@lisachen', followers: '210K', engagement: '3.8%' }
        ].map((creator, i) => (
          <div key={i} className="flex items-center gap-3 p-3 bg-linear-bg border border-linear-border-subtle rounded-linear">
            <div className="w-10 h-10 bg-linear-accent/20 rounded-full flex items-center justify-center flex-shrink-0 text-linear-bg">
              <Users className="w-4 h-4 text-linear-accent" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-xs font-medium mb-0.5 truncate">{creator.name}</div>
              <div className="text-[10px] text-text-tertiary truncate">{creator.handle} • {creator.followers} • {creator.engagement}</div>
            </div>
            <div className="px-2 py-0.5 bg-green-500/10 rounded text-[10px] text-green-400 flex-shrink-0">Active</div>
          </div>
        ))}
      </div>
    ),
  },
  {
    id: 'campaigns',
    title: 'Campaign Analytics',
    component: () => (
      <div className="p-4">
        <div className="flex items-center justify-between p-3 bg-linear-bg border border-linear-border-subtle rounded-linear mb-3">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-linear-accent/20 rounded-linear flex items-center justify-center text-linear-bg">
              <FolderKanban className="w-4 h-4 text-linear-accent" />
            </div>
            <div>
              <div className="text-xs font-medium mb-0.5">Summer Collection</div>
              <div className="text-[10px] text-text-tertiary">Active • 30 creators</div>
            </div>
          </div>
          <div className="text-right">
            <div className="text-sm font-medium text-linear-accent">€12,450</div>
            <div className="text-[10px] text-text-tertiary">ROI</div>
          </div>
        </div>
        <div className="grid grid-cols-3 gap-2.5">
          <div className="p-3 bg-linear-bg border border-linear-border-subtle rounded-linear text-center">
            <TrendingUp className="w-4 h-4 mx-auto mb-1.5 text-green-400" />
            <div className="text-base font-medium mb-0.5">2.3x</div>
            <div className="text-[10px] text-text-tertiary">Conversion</div>
          </div>
          <div className="p-3 bg-linear-bg border border-linear-border-subtle rounded-linear text-center">
            <Users className="w-4 h-4 mx-auto mb-1.5 text-linear-accent" />
            <div className="text-base font-medium mb-0.5">45</div>
            <div className="text-[10px] text-text-tertiary">Creators</div>
          </div>
          <div className="p-3 bg-linear-bg border border-linear-border-subtle rounded-linear text-center">
            <div className="w-4 h-4 mx-auto mb-1.5 text-yellow-400">📅</div>
            <div className="text-base font-medium mb-0.5">12</div>
            <div className="text-[10px] text-text-tertiary">Days left</div>
          </div>
        </div>
      </div>
    ),
  },
  {
    id: 'analytics',
    title: 'Performance Reports',
    component: () => (
      <div className="p-4">
        <div className="mb-4">
          <div className="h-32 flex items-end justify-between gap-1.5">
            {[45, 70, 55, 85, 75, 95, 80, 90].map((height, i) => (
              <div
                key={i}
                className="flex-1 bg-gradient-to-t from-linear-accent to-[#4169E1] rounded-t-sm"
                style={{ height: `${height}%` }}
              />
            ))}
          </div>
        </div>
        <div className="grid grid-cols-3 gap-4 pt-4 border-t border-linear-border-subtle">
          <div>
            <div className="text-xs text-text-tertiary mb-1">Reach</div>
            <div className="text-lg font-medium">1.2M</div>
          </div>
          <div>
            <div className="text-xs text-text-tertiary mb-1">Engagement</div>
            <div className="text-lg font-medium">4.8%</div>
          </div>
          <div>
            <div className="text-xs text-text-tertiary mb-1">Conv.</div>
            <div className="text-lg font-medium">3.2K</div>
          </div>
        </div>
      </div>
    ),
  },
];

export function HeroDashboardPreview() {
  const [currentView, setCurrentView] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  useEffect(() => {
    if (isPaused) return;

    const interval = setInterval(() => {
      setCurrentView((prev) => (prev + 1) % views.length);
    }, 4000);

    return () => clearInterval(interval);
  }, [isPaused]);

  const CurrentComponent = views[currentView].component;

  return (
    <div
      className="relative"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      <div className="bg-linear-bg-secondary border border-linear-border rounded-linear-lg overflow-hidden shadow-2xl">
        <div className="border-b border-linear-border-subtle px-4 py-3 flex items-center gap-2">
          <div className="flex gap-1.5">
            <div className="w-3 h-3 rounded-full bg-red-500/20" />
            <div className="w-3 h-3 rounded-full bg-yellow-500/20" />
            <div className="w-3 h-3 rounded-full bg-green-500/20" />
          </div>
          <div className="flex-1 text-center">
            <span className="text-xs text-text-secondary">{views[currentView].title}</span>
          </div>
        </div>

        <div className="relative aspect-[4/3] bg-gradient-to-br from-linear-bg-subtle to-linear-bg overflow-hidden">
          {views.map((view, index) => (
            <div
              key={view.id}
              className={`absolute inset-0 linear-transition ${
                currentView === index ? 'opacity-100' : 'opacity-0'
              }`}
            >
              <view.component />
            </div>
          ))}
        </div>

        <div className="flex justify-center gap-2 py-3 border-t border-linear-border-subtle">
          {views.map((view, index) => (
            <button
              key={view.id}
              onClick={() => setCurrentView(index)}
              className={`w-1.5 h-1.5 rounded-full linear-transition ${
                currentView === index ? 'bg-linear-accent w-4' : 'bg-white/20'
              }`}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
