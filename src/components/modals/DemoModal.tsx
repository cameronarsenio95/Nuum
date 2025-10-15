import { X } from 'lucide-react';

interface DemoModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function DemoModal({ isOpen, onClose }: DemoModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div className="border rounded-linear-lg max-w-5xl w-full relative dark:bg-linear-bg-secondary dark:border-linear-border light:bg-linear-light-bg-secondary light:border-linear-light-border">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-10 w-8 h-8 rounded-full flex items-center justify-center linear-transition dark:bg-linear-bg-hover dark:hover:bg-linear-bg-active dark:text-text-secondary dark:hover:text-text-primary light:bg-linear-light-bg-hover light:hover:bg-linear-light-bg-active light:text-text-light-secondary light:hover:text-text-light-primary"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="aspect-video w-full rounded-linear-lg overflow-hidden">
          <video
            className="w-full h-full"
            controls
            autoPlay
            poster="/assets/demo/poster.jpg"
          >
            <source src="/assets/demo/ugc-system-90s.mp4" type="video/mp4" />
            Your browser does not support the video tag.
          </video>
        </div>
      </div>
    </div>
  );
}
