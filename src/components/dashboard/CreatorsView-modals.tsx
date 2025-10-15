import { X, Plus, Link2, Edit2 } from 'lucide-react';
import type { Database } from '../../lib/database.types';

type Creator = Database['public']['Tables']['creators']['Row'];
type Campaign = Database['public']['Tables']['campaigns']['Row'];
type AdSet = Database['public']['Tables']['ad_sets']['Row'];

interface CreatorFormProps {
  newCreator: {
    name: string;
    email: string;
    phone: string;
    instagram_handle: string;
    tiktok_handle: string;
    youtube_handle: string;
    notes: string;
    status: 'active' | 'inactive' | 'blacklisted';
    tags: string[];
  };
  setNewCreator: (creator: any) => void;
  tagInput: string;
  setTagInput: (value: string) => void;
  addTag: () => void;
  removeTag: (tag: string) => void;
  onSubmit: (e: React.FormEvent) => void;
  onCancel: () => void;
  submitLabel: string;
  title: string;
  onDelete?: () => void;
}

export function CreatorFormModal({
  newCreator,
  setNewCreator,
  tagInput,
  setTagInput,
  addTag,
  removeTag,
  onSubmit,
  onCancel,
  submitLabel,
  title,
  onDelete,
}: CreatorFormProps) {
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-6 z-50" onClick={onCancel}>
      <div className="dark:bg-linear-bg-secondary light:bg-linear-light-bg-secondary border dark:border-linear-border light:border-linear-light-border rounded-linear-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-medium">{title}</h3>
          <button onClick={onCancel} className="p-1 hover:dark:bg-linear-bg-subtle light:bg-linear-light-bg-subtle rounded-linear">
            <X className="w-5 h-5" />
          </button>
        </div>
        <form onSubmit={onSubmit} className="space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">
                Name <span className="text-linear-error">*</span>
              </label>
              <input
                type="text"
                value={newCreator.name}
                onChange={(e) => setNewCreator({ ...newCreator, name: e.target.value })}
                className="w-full px-4 py-2 dark:bg-linear-bg light:bg-linear-light-bg border dark:border-linear-border light:border-linear-light-border rounded-linear focus:outline-none focus:border-linear-accent"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Status</label>
              <select
                value={newCreator.status}
                onChange={(e) => setNewCreator({ ...newCreator, status: e.target.value as any })}
                className="w-full px-4 py-2 dark:bg-linear-bg light:bg-linear-light-bg border dark:border-linear-border light:border-linear-light-border rounded-linear focus:outline-none focus:border-linear-accent"
              >
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
                <option value="blacklisted">Blacklisted</option>
              </select>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">
                Email <span className="text-linear-error">*</span>
              </label>
              <input
                type="email"
                value={newCreator.email}
                onChange={(e) => setNewCreator({ ...newCreator, email: e.target.value })}
                className="w-full px-4 py-2 dark:bg-linear-bg light:bg-linear-light-bg border dark:border-linear-border light:border-linear-light-border rounded-linear focus:outline-none focus:border-linear-accent"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">
                Phone <span className="text-linear-error">*</span>
              </label>
              <input
                type="tel"
                value={newCreator.phone}
                onChange={(e) => setNewCreator({ ...newCreator, phone: e.target.value })}
                className="w-full px-4 py-2 dark:bg-linear-bg light:bg-linear-light-bg border dark:border-linear-border light:border-linear-light-border rounded-linear focus:outline-none focus:border-linear-accent"
                required
              />
            </div>
          </div>

          <div className="grid md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">Instagram</label>
              <input
                type="text"
                value={newCreator.instagram_handle}
                onChange={(e) => setNewCreator({ ...newCreator, instagram_handle: e.target.value })}
                className="w-full px-4 py-2 dark:bg-linear-bg light:bg-linear-light-bg border dark:border-linear-border light:border-linear-light-border rounded-linear focus:outline-none focus:border-linear-accent"
                placeholder="username"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">TikTok</label>
              <input
                type="text"
                value={newCreator.tiktok_handle}
                onChange={(e) => setNewCreator({ ...newCreator, tiktok_handle: e.target.value })}
                className="w-full px-4 py-2 dark:bg-linear-bg light:bg-linear-light-bg border dark:border-linear-border light:border-linear-light-border rounded-linear focus:outline-none focus:border-linear-accent"
                placeholder="username"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">YouTube</label>
              <input
                type="text"
                value={newCreator.youtube_handle}
                onChange={(e) => setNewCreator({ ...newCreator, youtube_handle: e.target.value })}
                className="w-full px-4 py-2 dark:bg-linear-bg light:bg-linear-light-bg border dark:border-linear-border light:border-linear-light-border rounded-linear focus:outline-none focus:border-linear-accent"
                placeholder="@channel"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Tags</label>
            <div className="flex gap-2 mb-2">
              <input
                type="text"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
                className="flex-1 px-4 py-2 dark:bg-linear-bg light:bg-linear-light-bg border dark:border-linear-border light:border-linear-light-border rounded-linear focus:outline-none focus:border-linear-accent"
                placeholder="Add tag..."
              />
              <button
                type="button"
                onClick={addTag}
                className="px-4 py-2 dark:bg-linear-bg-subtle light:bg-linear-light-bg-subtle hover:bg-linear-border-subtle rounded-linear linear-transition"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
            {newCreator.tags.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {newCreator.tags.map((tag, i) => (
                  <span
                    key={i}
                    className="px-3 py-1 bg-linear-info/10 text-linear-info text-sm rounded-full flex items-center gap-2 cursor-pointer hover:bg-linear-info/20"
                    onClick={() => removeTag(tag)}
                  >
                    {tag}
                    <X className="w-3 h-3" />
                  </span>
                ))}
              </div>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Notes</label>
            <textarea
              value={newCreator.notes}
              onChange={(e) => setNewCreator({ ...newCreator, notes: e.target.value })}
              className="w-full px-4 py-2 dark:bg-linear-bg light:bg-linear-light-bg border dark:border-linear-border light:border-linear-light-border rounded-linear focus:outline-none focus:border-linear-accent h-24"
            />
          </div>

          <div className="flex gap-3 mt-6">
            {onDelete && (
              <button
                type="button"
                onClick={onDelete}
                className="px-4 py-2 bg-linear-error-subtle hover:bg-red-500/20 text-linear-error border border-linear-error-border/20 rounded-linear linear-transition"
              >
                Delete
              </button>
            )}
            <div className="flex-1" />
            <button
              type="button"
              onClick={onCancel}
              className="px-4 py-2 dark:bg-linear-bg-subtle light:bg-linear-light-bg-subtle hover:bg-linear-border-subtle rounded-linear linear-transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-white hover:bg-gray-100 text-black rounded-linear linear-transition"
            >
              {submitLabel}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

interface DetailModalProps {
  creator: Creator;
  adSets: AdSet[];
  onClose: () => void;
  onEdit: () => void;
  onAddToCampaign: () => void;
  onRemoveAdSet: (id: string) => void;
}

export function CreatorDetailModal({
  creator,
  adSets,
  onClose,
  onEdit,
  onAddToCampaign,
  onRemoveAdSet,
}: DetailModalProps) {
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-6 z-50" onClick={onClose}>
      <div className="dark:bg-linear-bg-secondary light:bg-linear-light-bg-secondary border dark:border-linear-border light:border-linear-light-border rounded-linear-lg p-6 w-full max-w-3xl max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-start justify-between mb-6">
          <div>
            <h3 className="text-2xl font-medium mb-2">{creator.name}</h3>
            <span className={`text-xs px-2 py-1 rounded-full border ${
              creator.status === 'active' ? 'text-linear-success bg-linear-success/10 border-linear-success-border/20' :
              creator.status === 'inactive' ? 'text-text-tertiary bg-text-tertiary/10 border-linear-border/20' :
              'text-linear-error bg-linear-error/10 border-linear-error-border/20'
            }`}>
              {creator.status}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={onEdit}
              className="p-2 hover:dark:bg-linear-bg-subtle light:bg-linear-light-bg-subtle rounded-linear linear-transition"
            >
              <Edit2 className="w-4 h-4" />
            </button>
            <button onClick={onClose} className="p-2 hover:dark:bg-linear-bg-subtle light:bg-linear-light-bg-subtle rounded-linear">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="space-y-6">
          <div className="dark:bg-linear-bg light:bg-linear-light-bg border dark:border-linear-border-subtle light:border-linear-light-border-subtle rounded-linear-lg p-4">
            <div className="text-sm dark:text-text-tertiary light:text-text-light-tertiary mb-2">Total Revenue Generated</div>
            <div className="text-3xl font-medium dark:text-linear-success light:text-linear-light-success">
              ${adSets.reduce((sum, adSet) => sum + (Number(adSet.revenue) || 0), 0).toLocaleString()}
            </div>
            <div className="text-sm dark:text-text-secondary light:text-text-light-secondary mt-1">
              Across {adSets.length} ad set{adSets.length !== 1 ? 's' : ''}
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            {creator.email && (
              <div>
                <h4 className="text-sm font-medium dark:text-text-tertiary light:text-text-light-tertiary mb-2">Email</h4>
                <a href={`mailto:${creator.email}`} className="text-linear-info hover:underline">
                  {creator.email}
                </a>
              </div>
            )}
            {creator.phone && (
              <div>
                <h4 className="text-sm font-medium dark:text-text-tertiary light:text-text-light-tertiary mb-2">Phone</h4>
                <a href={`tel:${creator.phone}`} className="text-linear-info hover:underline">
                  {creator.phone}
                </a>
              </div>
            )}
          </div>

          <div>
            <h4 className="text-sm font-medium dark:text-text-tertiary light:text-text-light-tertiary mb-3">Social Media</h4>
            <div className="grid md:grid-cols-3 gap-4">
              {creator.instagram_handle && (
                <div className="flex items-center gap-2 px-4 py-2 dark:bg-linear-bg-subtle light:bg-linear-light-bg-subtle rounded-linear">
                  <Link2 className="w-4 h-4 dark:text-text-secondary light:text-text-light-secondary" />
                  <span className="text-sm">@{creator.instagram_handle}</span>
                </div>
              )}
              {creator.tiktok_handle && (
                <div className="flex items-center gap-2 px-4 py-2 dark:bg-linear-bg-subtle light:bg-linear-light-bg-subtle rounded-linear">
                  <Link2 className="w-4 h-4 dark:text-text-secondary light:text-text-light-secondary" />
                  <span className="text-sm">@{creator.tiktok_handle}</span>
                </div>
              )}
              {creator.youtube_handle && (
                <div className="flex items-center gap-2 px-4 py-2 dark:bg-linear-bg-subtle light:bg-linear-light-bg-subtle rounded-linear">
                  <Link2 className="w-4 h-4 dark:text-text-secondary light:text-text-light-secondary" />
                  <span className="text-sm">@{creator.youtube_handle}</span>
                </div>
              )}
            </div>
          </div>

          {creator.tags && creator.tags.length > 0 && (
            <div>
              <h4 className="text-sm font-medium dark:text-text-tertiary light:text-text-light-tertiary mb-3">Tags</h4>
              <div className="flex flex-wrap gap-2">
                {creator.tags.map((tag, i) => (
                  <span key={i} className="px-3 py-1 bg-linear-info/10 text-linear-info text-sm rounded-full">
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          )}

          {creator.notes && (
            <div>
              <h4 className="text-sm font-medium dark:text-text-tertiary light:text-text-light-tertiary mb-2">Notes</h4>
              <p className="dark:text-text-secondary light:text-text-light-secondary">{creator.notes}</p>
            </div>
          )}

          <div>
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-sm font-medium dark:text-text-tertiary light:text-text-light-tertiary">
                Ad Sets
              </h4>
              <button
                onClick={onAddToCampaign}
                className="text-sm px-3 py-1 bg-white hover:bg-gray-100 text-black rounded-linear linear-transition"
              >
                Add Ad Set
              </button>
            </div>
            {adSets.length === 0 ? (
              <p className="text-sm dark:text-text-secondary light:text-text-light-secondary">No ad sets created yet</p>
            ) : (
              <div className="space-y-2">
                {adSets.map((adSet) => (
                  <div key={adSet.id} className="flex items-center justify-between p-3 dark:bg-linear-bg-subtle light:bg-linear-light-bg-subtle rounded-linear">
                    <div className="flex-1">
                      <p className="font-medium">{adSet.name}</p>
                      <div className="flex items-center gap-3 text-sm dark:text-text-secondary light:text-text-light-secondary mt-1">
                        <span className="capitalize">{adSet.status}</span>
                        <span className="dark:text-text-tertiary light:text-text-light-tertiary">
                          {(adSet as any).campaign?.name || 'No Campaign'}
                        </span>
                        {adSet.revenue > 0 && (
                          <span className="dark:text-linear-success light:text-linear-light-success">
                            ${Number(adSet.revenue).toLocaleString()} revenue
                          </span>
                        )}
                      </div>
                    </div>
                    <button
                      onClick={() => onRemoveAdSet(adSet.id)}
                      className="text-sm text-linear-error hover:text-red-300"
                    >
                      Remove
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

interface CampaignModalProps {
  campaigns: Campaign[];
  onSelect: (campaignId: string) => void;
  onClose: () => void;
}

export function AddToCampaignModal({ campaigns, onSelect, onClose }: CampaignModalProps) {
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-6 z-50" onClick={onClose}>
      <div className="dark:bg-linear-bg-secondary light:bg-linear-light-bg-secondary border dark:border-linear-border light:border-linear-light-border rounded-linear-lg p-6 w-full max-w-lg" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-medium">Add to Campaign</h3>
          <button onClick={onClose} className="p-1 hover:dark:bg-linear-bg-subtle light:bg-linear-light-bg-subtle rounded-linear">
            <X className="w-5 h-5" />
          </button>
        </div>
        {campaigns.length === 0 ? (
          <p className="dark:text-text-secondary light:text-text-light-secondary py-8 text-center">No campaigns available</p>
        ) : (
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {campaigns.map((campaign) => (
              <button
                key={campaign.id}
                onClick={() => onSelect(campaign.id)}
                className="w-full text-left p-4 dark:bg-linear-bg-subtle light:bg-linear-light-bg-subtle hover:bg-linear-border-subtle rounded-linear linear-transition"
              >
                <p className="font-medium">{campaign.name}</p>
                {campaign.description && (
                  <p className="text-sm dark:text-text-secondary light:text-text-light-secondary mt-1">{campaign.description}</p>
                )}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
