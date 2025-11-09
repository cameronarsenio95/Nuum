import { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { Button } from '../Button';
import type { Database } from '../../lib/database.types';

type AdSet = Database['public']['Tables']['ad_sets']['Row'];

interface AdSetFormModalProps {
  campaignId: string;
  workspaceId: string;
  adSet?: AdSet | null;
  onClose: () => void;
  onSave: () => void;
}

const PLATFORMS = [
  { value: 'instagram', label: 'Instagram' },
  { value: 'tiktok', label: 'TikTok' },
  { value: 'meta', label: 'Meta' },
  { value: 'snapchat', label: 'Snapchat' },
  { value: 'youtube', label: 'YouTube' },
];

const STATUSES = [
  { value: 'active', label: 'Active' },
  { value: 'paused', label: 'Paused' },
  { value: 'completed', label: 'Completed' },
];

const DEAL_TYPES = [
  { value: 'spark', label: 'Spark' },
  { value: 'barter', label: 'Barter' },
  { value: 'gifting', label: 'Gifting' },
];

export function AdSetFormModal({ campaignId, workspaceId, adSet, onClose, onSave }: AdSetFormModalProps) {
  const [loading, setLoading] = useState(false);
  const [urlError, setUrlError] = useState('');
  const [formData, setFormData] = useState({
    name: '',
    platform: 'instagram',
    status: 'active',
    spend: 0,
    revenue: 0,
    creative_url: '',
    spark_code: '',
    ad_duration_days: 7,
    deal_type: 'spark',
  });

  useEffect(() => {
    if (adSet) {
      setFormData({
        name: adSet.name,
        platform: adSet.platform,
        status: adSet.status,
        spend: Number(adSet.spend) || 0,
        revenue: Number(adSet.revenue) || 0,
        creative_url: adSet.creative_url || '',
        spark_code: adSet.spark_code || '',
        ad_duration_days: adSet.ad_duration_days || 7,
        deal_type: adSet.deal_type || 'spark',
      });
    }
  }, [adSet]);

  const validateUrl = (url: string) => {
    if (url && !url.startsWith('http://') && !url.startsWith('https://')) {
      setUrlError('URL must start with http:// or https://');
      return false;
    }
    setUrlError('');
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateUrl(formData.creative_url)) return;

    setLoading(true);

    try {
      const adSetData = {
        name: formData.name,
        platform: formData.platform,
        status: formData.status,
        spend: formData.spend,
        revenue: formData.revenue,
        creative_url: formData.creative_url || null,
        spark_code: formData.spark_code || null,
        ad_duration_days: formData.ad_duration_days,
        deal_type: formData.deal_type,
      };

      if (adSet) {
        const { error } = await supabase
          .from('ad_sets')
          .update({
            ...adSetData,
            updated_at: new Date().toISOString(),
          })
          .eq('id', adSet.id);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('ad_sets')
          .insert({
            workspace_id: workspaceId,
            campaign_id: campaignId,
            ...adSetData,
          });

        if (error) throw error;
      }

      onSave();
      onClose();
    } catch (error) {
      console.error('Error saving ad set:', error);
      alert('Failed to save ad set. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ backgroundColor: 'rgba(0, 0, 0, 0.7)', backdropFilter: 'blur(10px)' }}
      onClick={onClose}
    >
      <div
        className="w-full max-w-2xl bg-nuum-surface border border-nuum-border rounded-xl p-6 animate-fade-in-up max-h-[90vh] overflow-y-auto"
        style={{ boxShadow: '0 8px 32px rgba(0,0,0,0.5)' }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-nuum-text-primary">
            {adSet ? 'Edit Ad Set' : 'Add Ad Set'}
          </h2>
          <button
            onClick={onClose}
            className="p-2 rounded-lg transition-all duration-150 text-nuum-text-secondary hover:bg-nuum-border hover:text-nuum-text-primary"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-medium mb-1.5 text-nuum-text-secondary">
              Name
            </label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-3 py-2 bg-nuum-background border border-nuum-border text-nuum-text-primary rounded-lg text-sm transition-all duration-150 focus:outline-none focus:border-nuum-accent-blue"
              placeholder="Enter ad set name"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium mb-1.5 text-nuum-text-secondary">
                Platform
              </label>
              <select
                value={formData.platform}
                onChange={(e) => setFormData({ ...formData, platform: e.target.value })}
                className="w-full px-3 py-2 bg-nuum-background border border-nuum-border text-nuum-text-primary rounded-lg text-sm transition-all duration-150 focus:outline-none focus:border-nuum-accent-blue"
              >
                {PLATFORMS.map((platform) => (
                  <option key={platform.value} value={platform.value}>
                    {platform.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium mb-1.5 text-nuum-text-secondary">
                Status
              </label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                className="w-full px-3 py-2 bg-nuum-background border border-nuum-border text-nuum-text-primary rounded-lg text-sm transition-all duration-150 focus:outline-none focus:border-nuum-accent-blue"
              >
                {STATUSES.map((status) => (
                  <option key={status.value} value={status.value}>
                    {status.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium mb-1.5 text-nuum-text-secondary">
                Spend (€)
              </label>
              <input
                type="number"
                min="0"
                step="1"
                required
                value={formData.spend}
                onChange={(e) => setFormData({ ...formData, spend: Number(e.target.value) })}
                className="w-full px-3 py-2 bg-nuum-background border border-nuum-border text-nuum-text-primary rounded-lg text-sm transition-all duration-150 focus:outline-none focus:border-nuum-accent-blue"
                placeholder="0"
              />
            </div>

            <div>
              <label className="block text-xs font-medium mb-1.5 text-nuum-text-secondary">
                Revenue (€)
              </label>
              <input
                type="number"
                min="0"
                step="1"
                required
                value={formData.revenue}
                onChange={(e) => setFormData({ ...formData, revenue: Number(e.target.value) })}
                className="w-full px-3 py-2 bg-nuum-background border border-nuum-border text-nuum-text-primary rounded-lg text-sm transition-all duration-150 focus:outline-none focus:border-nuum-accent-blue"
                placeholder="0"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium mb-1.5 text-nuum-text-secondary">
              Creative URL
            </label>
            <input
              type="text"
              value={formData.creative_url}
              onChange={(e) => {
                setFormData({ ...formData, creative_url: e.target.value });
                validateUrl(e.target.value);
              }}
              className="w-full px-3 py-2 bg-nuum-background border border-nuum-border text-nuum-text-primary rounded-lg text-sm transition-all duration-150 focus:outline-none focus:border-nuum-accent-blue"
              placeholder="https://..."
            />
            {urlError && (
              <p className="text-xs text-nuum-accent-red mt-1">{urlError}</p>
            )}
          </div>

          <div>
            <label className="block text-xs font-medium mb-1.5 text-nuum-text-secondary">
              Spark Code
            </label>
            <input
              type="text"
              value={formData.spark_code}
              onChange={(e) => setFormData({ ...formData, spark_code: e.target.value })}
              className="w-full px-3 py-2 bg-nuum-background border border-nuum-border text-nuum-text-primary rounded-lg text-sm transition-all duration-150 focus:outline-none focus:border-nuum-accent-blue"
              placeholder="Enter spark / ad code"
            />
          </div>

          <div>
            <label className="block text-xs font-medium mb-1.5 text-nuum-text-secondary">
              Ad Duration
            </label>
            <div className="flex gap-2">
              {[
                { label: '7 Days', value: 7 },
                { label: '14 Days', value: 14 },
                { label: '30 Days', value: 30 },
              ].map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => setFormData({ ...formData, ad_duration_days: option.value })}
                  className={`flex-1 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-150 ${
                    formData.ad_duration_days === option.value
                      ? 'bg-nuum-accent-blue text-white border-nuum-accent-blue'
                      : 'bg-nuum-background border-nuum-border text-nuum-text-secondary hover:border-nuum-accent-blue/50'
                  } border`}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium mb-1.5 text-nuum-text-secondary">
              Deal Type
            </label>
            <div className="flex gap-2">
              {DEAL_TYPES.map((dealType) => (
                <button
                  key={dealType.value}
                  type="button"
                  onClick={() => setFormData({ ...formData, deal_type: dealType.value })}
                  className={`flex-1 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-150 ${
                    formData.deal_type === dealType.value
                      ? 'bg-nuum-accent-blue text-white border-nuum-accent-blue'
                      : 'bg-nuum-background border-nuum-border text-nuum-text-secondary hover:border-nuum-accent-blue/50'
                  } border`}
                >
                  {dealType.label}
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 mt-6 pt-4 border-t border-nuum-border">
            <Button
              type="button"
              variant="ghost"
              onClick={onClose}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              disabled={loading}
            >
              {loading ? 'Saving...' : 'Save'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
