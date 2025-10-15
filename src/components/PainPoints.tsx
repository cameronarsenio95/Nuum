import { Users, MessagesSquare, FolderSearch } from 'lucide-react';

const painPoints = [
  {
    icon: FolderSearch,
    title: 'Lost in chaos',
    description: 'Campaign info scattered across tools and chats',
  },
  {
    icon: Users,
    title: 'No team overview',
    description: 'Nobody knows who is working on what',
  },
  {
    icon: MessagesSquare,
    title: 'Endless updates',
    description: 'Constant back-and-forth to stay aligned',
  },
];

export function PainPoints() {
  return (
    <section className="py-32 px-6">
      <div className="max-w-5xl mx-auto text-center">
        <h2 className="text-3xl font-medium mb-6 text-balance">
          Built for modern creator marketing
        </h2>

        <p className="text-lg max-w-3xl mx-auto leading-relaxed dark:text-text-secondary light:text-text-light-secondary">
          Whether you're managing 10 or 100 creators, UGC System gives you clarity.
          Save hours every week by connecting data, campaigns, and assets in one dashboard.
          No extra tools. No confusion. Just visibility.
        </p>
      </div>
    </section>
  );
}
