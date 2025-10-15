import { FolderKanban, UserPlus, MessagesSquare, ListChecks } from 'lucide-react';

const benefits = [
  { icon: FolderKanban, label: 'Campaign Workspace' },
  { icon: UserPlus, label: 'Creator Database' },
  { icon: MessagesSquare, label: 'Team Communication' },
  { icon: ListChecks, label: 'Task Management' },
];

export function ForBusinesses() {
  return (
    <section className="py-32 px-6 dark:bg-gradient-to-b dark:from-transparent dark:via-linear-bg-subtle/30 dark:to-transparent light:bg-gradient-to-b light:from-transparent light:via-linear-light-bg-subtle/30 light:to-transparent">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="mb-6 text-balance">Built for teams that scale</h2>
          <p className="text-lg max-w-2xl mx-auto text-balance dark:text-text-secondary light:text-text-light-secondary">
            Whether you're an agency managing hundreds of creators or a brand running your first campaign — NUUM grows with you.
          </p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          {benefits.map((benefit, index) => {
            const Icon = benefit.icon;
            return (
              <div
                key={index}
                className="p-5 backdrop-blur-sm rounded-md border linear-transition text-center group dark:bg-linear-bg-secondary dark:border-linear-border-subtle dark:hover:border-linear-border-hover light:bg-linear-light-bg-secondary light:border-linear-light-border-subtle light:hover:border-linear-light-border-hover"
              >
                <div className="w-10 h-10 rounded-md flex items-center justify-center mx-auto mb-3 linear-transition dark:bg-linear-bg-hover dark:group-hover:bg-linear-bg-active light:bg-linear-light-bg-hover light:group-hover:bg-linear-light-bg-active">
                  <Icon className="w-4 h-4 dark:text-text-secondary light:text-text-light-secondary" strokeWidth={2} />
                </div>
                <p className="text-xs font-medium dark:text-text-primary light:text-text-light-primary">{benefit.label}</p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
