import { X, Trash2, Edit, Users, Tag } from 'lucide-react';

interface BulkActionBarProps {
  selectedCount: number;
  onClearSelection: () => void;
  actions: {
    label: string;
    icon: React.ElementType;
    onClick: () => void;
    variant?: 'default' | 'danger';
  }[];
}

export function BulkActionBar({ selectedCount, onClearSelection, actions }: BulkActionBarProps) {
  if (selectedCount === 0) return null;

  return (
    <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 z-50">
      <div className="bg-blue-600 text-white rounded-lg shadow-2xl border border-blue-500 flex items-center gap-4 px-4 py-3">
        <div className="flex items-center gap-2">
          <span className="font-medium">{selectedCount} selected</span>
          <button
            onClick={onClearSelection}
            className="p-1 hover:bg-blue-700 rounded transition-colors"
            title="Clear selection"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="w-px h-6 bg-blue-400" />

        <div className="flex items-center gap-2">
          {actions.map((action, index) => {
            const Icon = action.icon;
            const isDanger = action.variant === 'danger';
            return (
              <button
                key={index}
                onClick={action.onClick}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg font-medium transition-colors ${
                  isDanger
                    ? 'bg-red-500 hover:bg-red-600 text-white'
                    : 'bg-white/10 hover:bg-white/20 text-white'
                }`}
              >
                <Icon className="w-4 h-4" />
                {action.label}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
