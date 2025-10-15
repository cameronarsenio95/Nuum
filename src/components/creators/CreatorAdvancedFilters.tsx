import { useState } from 'react';
import { Filter, X, Tag } from 'lucide-react';

export interface CreatorFilters {
  status: string[];
  tags: string[];
  platforms: string[];
  minRevenue?: number;
  maxRevenue?: number;
  searchQuery: string;
}

interface CreatorAdvancedFiltersProps {
  isOpen: boolean;
  onClose: () => void;
  filters: CreatorFilters;
  onFiltersChange: (filters: CreatorFilters) => void;
  availableTags: string[];
}

export function CreatorAdvancedFilters({
  isOpen,
  onClose,
  filters,
  onFiltersChange,
  availableTags
}: CreatorAdvancedFiltersProps) {
  const [localFilters, setLocalFilters] = useState<CreatorFilters>(filters);

  const handleApply = () => {
    onFiltersChange(localFilters);
    onClose();
  };

  const handleReset = () => {
    const resetFilters: CreatorFilters = {
      status: [],
      tags: [],
      platforms: [],
      searchQuery: ''
    };
    setLocalFilters(resetFilters);
    onFiltersChange(resetFilters);
  };

  const toggleStatus = (status: string) => {
    setLocalFilters(prev => ({
      ...prev,
      status: prev.status.includes(status)
        ? prev.status.filter(s => s !== status)
        : [...prev.status, status]
    }));
  };

  const toggleTag = (tag: string) => {
    setLocalFilters(prev => ({
      ...prev,
      tags: prev.tags.includes(tag)
        ? prev.tags.filter(t => t !== tag)
        : [...prev.tags, tag]
    }));
  };

  const togglePlatform = (platform: string) => {
    setLocalFilters(prev => ({
      ...prev,
      platforms: prev.platforms.includes(platform)
        ? prev.platforms.filter(p => p !== platform)
        : [...prev.platforms, platform]
    }));
  };

  if (!isOpen) return null;

  const activeFilterCount =
    localFilters.status.length +
    localFilters.tags.length +
    localFilters.platforms.length +
    (localFilters.minRevenue ? 1 : 0) +
    (localFilters.maxRevenue ? 1 : 0);

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-6 z-50" onClick={onClose}>
      <div
        className="dark:bg-linear-bg light:bg-linear-light-bg border dark:border-linear-border light:border-linear-light-border rounded-linear-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <Filter className="w-6 h-6 dark:text-linear-accent light:text-linear-light-accent" />
            <h2 className="text-2xl font-medium">Advanced Filters</h2>
            {activeFilterCount > 0 && (
              <span className="px-2 py-1 text-xs bg-linear-accent text-black rounded-full font-medium">
                {activeFilterCount}
              </span>
            )}
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:dark:bg-linear-bg-subtle hover:light:bg-linear-light-bg-subtle rounded-linear linear-transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-6">
          <div>
            <label className="block text-sm font-medium mb-3">Status</label>
            <div className="flex flex-wrap gap-2">
              {['active', 'inactive', 'blacklisted'].map(status => (
                <button
                  key={status}
                  onClick={() => toggleStatus(status)}
                  className={`px-4 py-2 rounded-linear border text-sm linear-transition ${
                    localFilters.status.includes(status)
                      ? 'dark:bg-linear-accent/10 light:bg-linear-light-accent/10 border-linear-accent'
                      : 'dark:bg-linear-bg-secondary light:bg-white dark:border-linear-border light:border-linear-light-border hover:dark:border-linear-border-subtle hover:light:border-linear-light-border'
                  }`}
                >
                  {status.charAt(0).toUpperCase() + status.slice(1)}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-3">Platform Presence</label>
            <div className="flex flex-wrap gap-2">
              {['Instagram', 'TikTok', 'YouTube'].map(platform => (
                <button
                  key={platform}
                  onClick={() => togglePlatform(platform.toLowerCase())}
                  className={`px-4 py-2 rounded-linear border text-sm linear-transition ${
                    localFilters.platforms.includes(platform.toLowerCase())
                      ? 'dark:bg-linear-accent/10 light:bg-linear-light-accent/10 border-linear-accent'
                      : 'dark:bg-linear-bg-secondary light:bg-white dark:border-linear-border light:border-linear-light-border hover:dark:border-linear-border-subtle hover:light:border-linear-light-border'
                  }`}
                >
                  {platform}
                </button>
              ))}
            </div>
          </div>

          {availableTags.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-3">
                <Tag className="w-4 h-4 dark:text-text-tertiary light:text-text-light-tertiary" />
                <label className="block text-sm font-medium">Tags</label>
              </div>
              <div className="flex flex-wrap gap-2 max-h-48 overflow-y-auto">
                {availableTags.map(tag => (
                  <button
                    key={tag}
                    onClick={() => toggleTag(tag)}
                    className={`px-3 py-1.5 rounded-linear border text-sm linear-transition ${
                      localFilters.tags.includes(tag)
                        ? 'dark:bg-linear-accent/10 light:bg-linear-light-accent/10 border-linear-accent'
                        : 'dark:bg-linear-bg-secondary light:bg-white dark:border-linear-border light:border-linear-light-border hover:dark:border-linear-border-subtle hover:light:border-linear-light-border'
                    }`}
                  >
                    {tag}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium mb-3">Revenue Range</label>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs dark:text-text-secondary light:text-text-light-secondary mb-2">
                  Minimum
                </label>
                <input
                  type="number"
                  value={localFilters.minRevenue || ''}
                  onChange={(e) => setLocalFilters(prev => ({
                    ...prev,
                    minRevenue: e.target.value ? parseFloat(e.target.value) : undefined
                  }))}
                  placeholder="0"
                  className="w-full px-4 py-2 dark:bg-linear-bg-secondary light:bg-white border dark:border-linear-border light:border-linear-light-border rounded-linear focus:outline-none focus:border-linear-accent"
                />
              </div>
              <div>
                <label className="block text-xs dark:text-text-secondary light:text-text-light-secondary mb-2">
                  Maximum
                </label>
                <input
                  type="number"
                  value={localFilters.maxRevenue || ''}
                  onChange={(e) => setLocalFilters(prev => ({
                    ...prev,
                    maxRevenue: e.target.value ? parseFloat(e.target.value) : undefined
                  }))}
                  placeholder="No limit"
                  className="w-full px-4 py-2 dark:bg-linear-bg-secondary light:bg-white border dark:border-linear-border light:border-linear-light-border rounded-linear focus:outline-none focus:border-linear-accent"
                />
              </div>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3 mt-8 pt-6 border-t dark:border-linear-border-subtle light:border-linear-light-border">
          <button
            onClick={handleReset}
            className="flex-1 px-4 py-2 dark:bg-linear-bg-secondary light:bg-white border dark:border-linear-border light:border-linear-light-border rounded-linear hover:dark:border-linear-border-subtle hover:light:border-linear-light-border linear-transition"
          >
            Reset All
          </button>
          <button
            onClick={handleApply}
            className="flex-1 px-4 py-2 bg-white hover:bg-gray-100 text-black rounded-linear linear-transition"
          >
            Apply Filters
          </button>
        </div>
      </div>
    </div>
  );
}
