import { X, Plus, Link2, Edit2, DollarSign, TrendingUp, Target, Zap, Mail, Phone, Award } from 'lucide-react';
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
    snapchat_handle: string;
    notes: string;
    status: 'active' | 'inactive' | 'blacklisted';
    tags: string[];
    discount_code?: string;
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
                Email
              </label>
              <input
                type="email"
                value={newCreator.email}
                onChange={(e) => setNewCreator({ ...newCreator, email: e.target.value })}
                className="w-full px-4 py-2 dark:bg-linear-bg light:bg-linear-light-bg border dark:border-linear-border light:border-linear-light-border rounded-linear focus:outline-none focus:border-linear-accent"
                placeholder="creator@example.com"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">
                Phone
              </label>
              <input
                type="tel"
                value={newCreator.phone}
                onChange={(e) => setNewCreator({ ...newCreator, phone: e.target.value })}
                className="w-full px-4 py-2 dark:bg-linear-bg light:bg-linear-light-bg border dark:border-linear-border light:border-linear-light-border rounded-linear focus:outline-none focus:border-linear-accent"
                placeholder="+31 6 12345678"
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
              <label className="block text-sm font-medium mb-2">Snapchat</label>
              <input
                type="text"
                value={newCreator.snapchat_handle}
                onChange={(e) => setNewCreator({ ...newCreator, snapchat_handle: e.target.value })}
                className="w-full px-4 py-2 dark:bg-linear-bg light:bg-linear-light-bg border dark:border-linear-border light:border-linear-light-border rounded-linear focus:outline-none focus:border-linear-accent"
                placeholder="username"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Discount Code</label>
            <input
              type="text"
              value={newCreator.discount_code || ''}
              onChange={(e) => setNewCreator({ ...newCreator, discount_code: e.target.value })}
              className="w-full px-4 py-2 dark:bg-linear-bg light:bg-linear-light-bg border dark:border-linear-border light:border-linear-light-border rounded-linear focus:outline-none focus:border-linear-accent"
              placeholder="e.g., CREATOR10"
            />
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
  const totalRevenue = adSets.reduce((sum, adSet) => sum + (Number(adSet.revenue) || 0), 0);
  const totalSpend = adSets.reduce((sum, adSet) => sum + (Number(adSet.spend) || 0), 0);
  const profit = totalRevenue - totalSpend;
  const roi = totalSpend > 0 ? ((profit / totalSpend) * 100) : 0;

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('nl-NL', {
      style: 'currency',
      currency: 'EUR'
    }).format(amount);
  };

  const getPrimaryHandle = () => {
    return creator.instagram_handle || creator.tiktok_handle || creator.snapchat_handle;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'text-linear-success bg-linear-success-subtle border-linear-success-border';
      case 'inactive':
        return 'text-text-tertiary bg-linear-bg-hover border-linear-border';
      case 'blacklisted':
        return 'text-linear-error bg-linear-error-subtle border-linear-error-border';
      default:
        return 'text-text-tertiary bg-linear-bg-hover border-linear-border';
    }
  };

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50" onClick={onClose}>
      <div className="dark:bg-linear-bg light:bg-linear-light-bg border dark:border-linear-border light:border-linear-light-border rounded-linear-lg w-full max-w-4xl max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <div className="sticky top-0 dark:bg-linear-bg-secondary light:bg-linear-light-bg-secondary border-b dark:border-linear-border-subtle light:border-linear-light-border-subtle p-4 md:p-6 flex items-start justify-between z-10">
          <div className="flex-1 min-w-0 pr-4">
            <h2 className="text-xl md:text-2xl font-medium mb-1">{creator.name}</h2>
            {getPrimaryHandle() && (
              <div className="text-sm dark:text-text-secondary light:text-text-light-secondary mb-2">
                @{getPrimaryHandle()}
              </div>
            )}
            <div className="flex items-center gap-2 flex-wrap">
              <span className={`inline-flex text-xs px-2.5 py-1 rounded-full border ${getStatusColor(creator.status)}`}>
                {creator.status}
              </span>
              <span className="text-xs px-2.5 py-1 rounded-full dark:bg-linear-accent-subtle light:bg-linear-light-accent-subtle dark:text-linear-accent light:text-linear-light-accent border dark:border-linear-accent-border light:border-linear-light-accent-border">
                {adSets.length} ad set{adSets.length !== 1 ? 's' : ''}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={onEdit}
              className="flex-shrink-0 p-2 hover:dark:bg-linear-bg-hover light:hover:bg-linear-light-bg-hover rounded-linear linear-transition"
            >
              <Edit2 className="w-4 h-4" />
            </button>
            <button
              onClick={onClose}
              className="flex-shrink-0 p-2 hover:dark:bg-linear-bg-hover light:hover:bg-linear-light-bg-hover rounded-linear linear-transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="p-4 md:p-6 space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
            <div className="dark:bg-linear-bg-secondary light:bg-linear-light-bg-secondary border dark:border-linear-border-subtle light:border-linear-light-border-subtle rounded-linear-lg p-4 md:p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="w-10 h-10 bg-red-500/10 rounded-linear flex items-center justify-center">
                  <Zap className="w-5 h-5 text-red-500" />
                </div>
                <span className="text-xs dark:text-text-tertiary light:text-text-light-tertiary">Costs</span>
              </div>
              <div className="space-y-1">
                <div className="text-xl md:text-2xl font-medium">{formatCurrency(totalSpend)}</div>
                <div className="text-xs md:text-sm dark:text-text-secondary light:text-text-light-secondary">
                  Total investment
                </div>
              </div>
            </div>

            <div className="dark:bg-linear-bg-secondary light:bg-linear-light-bg-secondary border dark:border-linear-border-subtle light:border-linear-light-border-subtle rounded-linear-lg p-4 md:p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="w-10 h-10 bg-green-500/10 rounded-linear flex items-center justify-center">
                  <DollarSign className="w-5 h-5 text-green-500" />
                </div>
                <span className="text-xs dark:text-text-tertiary light:text-text-light-tertiary">Revenue</span>
              </div>
              <div className="space-y-1">
                <div className="text-xl md:text-2xl font-medium">{formatCurrency(totalRevenue)}</div>
                <div className="text-xs md:text-sm dark:text-text-secondary light:text-text-light-secondary">
                  Total generated
                </div>
              </div>
            </div>

            <div className="dark:bg-linear-bg-secondary light:bg-linear-light-bg-secondary border dark:border-linear-border-subtle light:border-linear-light-border-subtle rounded-linear-lg p-4 md:p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="w-10 h-10 bg-linear-accent-subtle rounded-linear flex items-center justify-center">
                  <TrendingUp className="w-5 h-5 text-linear-accent" />
                </div>
                <span className="text-xs dark:text-text-tertiary light:text-text-light-tertiary">ROI</span>
              </div>
              <div className="space-y-1">
                <div className={`text-xl md:text-2xl font-medium ${roi > 0 ? 'text-linear-success' : 'text-linear-error'}`}>
                  {roi > 0 ? '+' : ''}{Math.round(roi)}%
                </div>
                <div className="text-xs md:text-sm dark:text-text-secondary light:text-text-light-secondary">
                  {formatCurrency(profit)} profit
                </div>
              </div>
            </div>

            <div className="dark:bg-linear-bg-secondary light:bg-linear-light-bg-secondary border dark:border-linear-border-subtle light:border-linear-light-border-subtle rounded-linear-lg p-4 md:p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="w-10 h-10 bg-linear-info-subtle rounded-linear flex items-center justify-center">
                  <Target className="w-5 h-5 text-linear-info" />
                </div>
                <span className="text-xs dark:text-text-tertiary light:text-text-light-tertiary">Ad Sets</span>
              </div>
              <div className="space-y-1">
                <div className="text-xl md:text-2xl font-medium">{adSets.length}</div>
                <div className="text-xs md:text-sm dark:text-text-secondary light:text-text-light-secondary">
                  Active campaigns
                </div>
              </div>
            </div>
          </div>

          {(creator.email || creator.phone) && (
            <div className="dark:bg-linear-bg-secondary light:bg-linear-light-bg-secondary border dark:border-linear-border-subtle light:border-linear-light-border-subtle rounded-linear-lg p-4 md:p-6">
              <h3 className="text-sm md:text-base font-medium mb-4">Contact Information</h3>
              <div className="space-y-3">
                {creator.email && (
                  <a
                    href={`mailto:${creator.email}`}
                    className="flex items-center gap-3 text-sm hover:dark:bg-linear-bg-hover light:hover:bg-linear-light-bg-hover p-2 rounded-linear linear-transition"
                  >
                    <Mail className="w-4 h-4 dark:text-text-tertiary light:text-text-light-tertiary flex-shrink-0" />
                    <span className="text-linear-info truncate">{creator.email}</span>
                  </a>
                )}
                {creator.phone && (
                  <a
                    href={`tel:${creator.phone}`}
                    className="flex items-center gap-3 text-sm hover:dark:bg-linear-bg-hover light:hover:bg-linear-light-bg-hover p-2 rounded-linear linear-transition"
                  >
                    <Phone className="w-4 h-4 dark:text-text-tertiary light:text-text-light-tertiary flex-shrink-0" />
                    <span className="text-linear-info">{creator.phone}</span>
                  </a>
                )}
              </div>
            </div>
          )}

          {creator.discount_code && (
            <div className="dark:bg-linear-bg-secondary light:bg-linear-light-bg-secondary border dark:border-linear-border-subtle light:border-linear-light-border-subtle rounded-linear-lg p-4 md:p-6">
              <div className="flex items-center gap-2 mb-3">
                <Award className="w-4 h-4 dark:text-text-tertiary light:text-text-light-tertiary" />
                <h3 className="text-sm md:text-base font-medium">Discount Code</h3>
              </div>
              <div className="px-4 py-3 dark:bg-linear-bg light:bg-linear-light-bg rounded-linear border-2 dark:border-linear-accent light:border-linear-light-accent">
                <div className="font-mono text-lg font-medium text-linear-accent text-center tracking-wider">
                  {creator.discount_code}
                </div>
              </div>
            </div>
          )}

          {(creator.instagram_handle || creator.tiktok_handle || creator.snapchat_handle) && (
            <div className="dark:bg-linear-bg-secondary light:bg-linear-light-bg-secondary border dark:border-linear-border-subtle light:border-linear-light-border-subtle rounded-linear-lg p-4 md:p-6">
              <h3 className="text-sm md:text-base font-medium mb-4">Social Media</h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {creator.instagram_handle && (
                  <a
                    href={`https://instagram.com/${creator.instagram_handle}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 px-4 py-3 dark:bg-linear-bg light:bg-linear-light-bg rounded-linear hover:dark:bg-linear-bg-hover light:hover:bg-linear-light-bg-hover linear-transition"
                  >
                    <Link2 className="w-4 h-4 dark:text-text-secondary light:text-text-light-secondary flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <div className="text-xs dark:text-text-tertiary light:text-text-light-tertiary">Instagram</div>
                      <div className="text-sm font-medium truncate">@{creator.instagram_handle}</div>
                    </div>
                  </a>
                )}
                {creator.tiktok_handle && (
                  <a
                    href={`https://tiktok.com/@${creator.tiktok_handle}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 px-4 py-3 dark:bg-linear-bg light:bg-linear-light-bg rounded-linear hover:dark:bg-linear-bg-hover light:hover:bg-linear-light-bg-hover linear-transition"
                  >
                    <Link2 className="w-4 h-4 dark:text-text-secondary light:text-text-light-secondary flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <div className="text-xs dark:text-text-tertiary light:text-text-light-tertiary">TikTok</div>
                      <div className="text-sm font-medium truncate">@{creator.tiktok_handle}</div>
                    </div>
                  </a>
                )}
                {creator.snapchat_handle && (
                  <a
                    href={`https://snapchat.com/add/${creator.snapchat_handle}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 px-4 py-3 dark:bg-linear-bg light:bg-linear-light-bg rounded-linear hover:dark:bg-linear-bg-hover light:hover:bg-linear-light-bg-hover linear-transition"
                  >
                    <Link2 className="w-4 h-4 dark:text-text-secondary light:text-text-light-secondary flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <div className="text-xs dark:text-text-tertiary light:text-text-light-tertiary">Snapchat</div>
                      <div className="text-sm font-medium truncate">@{creator.snapchat_handle}</div>
                    </div>
                  </a>
                )}
              </div>
            </div>
          )}

          {creator.tags && creator.tags.length > 0 && (
            <div className="dark:bg-linear-bg-secondary light:bg-linear-light-bg-secondary border dark:border-linear-border-subtle light:border-linear-light-border-subtle rounded-linear-lg p-4 md:p-6">
              <h3 className="text-sm md:text-base font-medium mb-3">Tags</h3>
              <div className="flex flex-wrap gap-2">
                {creator.tags.map((tag, i) => (
                  <span
                    key={i}
                    className="px-3 py-1.5 text-xs dark:bg-linear-info-subtle light:bg-linear-light-info-subtle dark:text-linear-info light:text-linear-light-info rounded-full border dark:border-linear-info-border light:border-linear-light-info-border"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          )}

          {creator.notes && (
            <div className="dark:bg-linear-bg-secondary light:bg-linear-light-bg-secondary border dark:border-linear-border-subtle light:border-linear-light-border-subtle rounded-linear-lg p-4 md:p-6">
              <h3 className="text-sm md:text-base font-medium mb-2">Notes</h3>
              <p className="text-sm dark:text-text-secondary light:text-text-light-secondary whitespace-pre-wrap">
                {creator.notes}
              </p>
            </div>
          )}

          {adSets.length > 0 && (
            <div className="dark:bg-linear-bg-secondary light:bg-linear-light-bg-secondary border dark:border-linear-border-subtle light:border-linear-light-border-subtle rounded-linear-lg p-4 md:p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm md:text-base font-medium flex items-center gap-2">
                  <Target className="w-4 h-4" />
                  Ad Set Performance
                </h3>
                <button
                  onClick={onAddToCampaign}
                  className="text-sm px-3 py-1.5 bg-white hover:bg-gray-100 text-black rounded-linear linear-transition"
                >
                  Add Ad Set
                </button>
              </div>
              <div className="space-y-2">
                {adSets.map((adSet) => {
                  const adSetRevenue = Number(adSet.revenue) || 0;
                  const adSetSpend = Number(adSet.spend) || 0;
                  const adSetProfit = adSetRevenue - adSetSpend;
                  const adSetRoi = adSetSpend > 0 ? ((adSetProfit / adSetSpend) * 100) : 0;

                  return (
                    <div
                      key={adSet.id}
                      className="dark:bg-linear-bg light:bg-linear-light-bg border dark:border-linear-border-subtle light:border-linear-light-border-subtle rounded-linear p-4 hover:dark:bg-linear-bg-hover light:hover:bg-linear-light-bg-hover linear-transition"
                    >
                      <div className="flex items-start justify-between gap-3 mb-3">
                        <div className="flex-1 min-w-0">
                          <div className="font-medium text-sm truncate mb-1">{adSet.name}</div>
                          <span className={`inline-flex text-xs px-2 py-0.5 rounded-full border ${
                            adSet.status === 'active' ? 'text-linear-success bg-linear-success-subtle border-linear-success-border' :
                            adSet.status === 'completed' ? 'text-linear-info bg-linear-info-subtle border-linear-info-border' :
                            'text-text-tertiary bg-linear-bg-hover border-linear-border'
                          }`}>
                            {adSet.status}
                          </span>
                        </div>
                        <div className="text-right flex-shrink-0">
                          <div className="font-medium">{formatCurrency(adSetRevenue)}</div>
                          <div className={`text-xs font-medium ${adSetRoi > 0 ? 'text-linear-success' : 'text-linear-error'}`}>
                            {adSetRoi > 0 ? '+' : ''}{Math.round(adSetRoi)}% ROI
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center justify-between pt-3 border-t dark:border-linear-border-subtle light:border-linear-light-border-subtle text-xs">
                        <div>
                          <div className="dark:text-text-tertiary light:text-text-light-tertiary mb-1">Costs</div>
                          <div className="font-medium">{formatCurrency(adSetSpend)}</div>
                        </div>
                        <div className="text-right">
                          <div className="dark:text-text-tertiary light:text-text-light-tertiary mb-1">Profit</div>
                          <div className="font-medium">{formatCurrency(adSetProfit)}</div>
                        </div>
                        <button
                          onClick={() => onRemoveAdSet(adSet.id)}
                          className="text-sm text-linear-error hover:text-red-400 linear-transition"
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {adSets.length === 0 && (
            <div className="dark:bg-linear-bg-secondary light:bg-linear-light-bg-secondary border dark:border-linear-border-subtle light:border-linear-light-border-subtle rounded-linear-lg p-4 md:p-6">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm md:text-base font-medium flex items-center gap-2">
                  <Target className="w-4 h-4" />
                  Ad Set Performance
                </h3>
                <button
                  onClick={onAddToCampaign}
                  className="text-sm px-3 py-1.5 bg-white hover:bg-gray-100 text-black rounded-linear linear-transition"
                >
                  Add Ad Set
                </button>
              </div>
              <p className="text-sm dark:text-text-secondary light:text-text-light-secondary py-8 text-center">
                No ad sets created yet. Click "Add Ad Set" to get started.
              </p>
            </div>
          )}
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
