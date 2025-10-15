import { FolderKanban, Users, CheckSquare, Calendar, LayoutGrid } from 'lucide-react';

export function DashboardPreview() {
  return (
    <section className="py-32 px-6">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="mb-4 text-balance">Your workspace at a glance</h2>
          <p className="text-lg text-text-secondary text-balance">Everything your team needs to manage campaigns, organized and accessible.</p>
        </div>

        <div className="relative">
          <div className="absolute inset-0 bg-gradient-to-t from-linear-bg via-transparent to-transparent z-10" />

          <div className="bg-linear-bg-secondary backdrop-blur-sm rounded-linear-lg border border-linear-border-subtle p-8">
            <div className="grid md:grid-cols-4 gap-6 mb-8">
              <div className="p-4 bg-linear-bg-subtle rounded-linear">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-xs text-text-tertiary uppercase tracking-wider">Active Campaigns</span>
                  <FolderKanban className="w-4 h-4 text-linear-accent" strokeWidth={2} />
                </div>
                <div className="text-3xl font-bold mb-2">12</div>
                <div className="text-xs text-linear-accent">3 launching soon</div>
              </div>

              <div className="p-4 bg-linear-bg-subtle rounded-linear">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-xs text-text-tertiary uppercase tracking-wider">Team Tasks</span>
                  <CheckSquare className="w-4 h-4 text-green-400" strokeWidth={2} />
                </div>
                <div className="text-3xl font-bold mb-2">24</div>
                <div className="text-xs text-green-400">8 completed today</div>
              </div>

              <div className="p-4 bg-linear-bg-subtle rounded-linear">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-xs text-text-tertiary uppercase tracking-wider">Collaborators</span>
                  <Users className="w-4 h-4 text-linear-accent" strokeWidth={2} />
                </div>
                <div className="text-3xl font-bold mb-2">8</div>
                <div className="text-xs text-linear-accent">online now</div>
              </div>

              <div className="p-4 bg-linear-bg-subtle rounded-linear">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-xs text-text-tertiary uppercase tracking-wider">Upcoming</span>
                  <Calendar className="w-4 h-4 text-linear-accent" strokeWidth={2} />
                </div>
                <div className="text-3xl font-bold mb-2">6</div>
                <div className="text-xs text-linear-accent">deliverables due</div>
              </div>
            </div>

            <div className="bg-linear-bg-subtle rounded-linear p-8 h-64 flex items-center justify-center border border-linear-border-subtle">
              <div className="text-center text-text-secondary">
                <LayoutGrid className="w-16 h-16 mx-auto mb-4 opacity-50" />
                <p>Team Workspace Overview</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
