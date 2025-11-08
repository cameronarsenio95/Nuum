import { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { NUUM_COLORS, TYPOGRAPHY } from '../../utils/designSystem';
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

export function AdSetFormModal({ campaignId, workspaceId, adSet, onClose, onSave }: AdSetFormModalProps) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    platform: 'instagram',
    status: 'active',
    spend: 0,
    revenue: 0,
  });

  useEffect(() => {
    if (adSet) {
      setFormData({
        name: adSet.name,
        platform: adSet.platform,
        status: adSet.status,
        spend: Number(adSet.spend) || 0,
        revenue: Number(adSet.revenue) || 0,
      });
    }
  }, [adSet]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (adSet) {
        const { error } = await supabase
          .from('ad_sets')
          .update({
            name: formData.name,
            platform: formData.platform,
            status: formData.status,
            spend: formData.spend,
            revenue: formData.revenue,
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
            name: formData.name,
            platform: formData.platform,
            status: formData.status,
            spend: formData.spend,
            revenue: formData.revenue,
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
        className="w-full max-w-lg rounded-xl border p-6 animate-fade-in-up"
        style={{
          backgroundColor: NUUM_COLORS.surface,
          borderColor: NUUM_COLORS.border,
          boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold" style={{ color: NUUM_COLORS.textPrimary }}>
            {adSet ? 'Edit Ad Set' : 'Add Ad Set'}
          </h2>
          <button
            onClick={onClose}
            className="p-2 rounded-lg transition-all duration-150"
            style={{ color: NUUM_COLORS.textSecondary }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = NUUM_COLORS.surfaceHover;
              e.currentTarget.style.color = NUUM_COLORS.textPrimary;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'transparent';
              e.currentTarget.style.color = NUUM_COLORS.textSecondary;
            }}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-medium mb-1.5" style={{ color: NUUM_COLORS.textSecondary }}>
              Name
            </label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-3 py-2 rounded-lg border text-sm transition-all duration-150"
              style={{
                backgroundColor: NUUM_COLORS.background,
                borderColor: NUUM_COLORS.border,
                color: NUUM_COLORS.textPrimary,
              }}
              onFocus={(e) => e.currentTarget.style.borderColor = NUUM_COLORS.accent}
              onBlur={(e) => e.currentTarget.style.borderColor = NUUM_COLORS.border}
              placeholder="Enter ad set name"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium mb-1.5" style={{ color: NUUM_COLORS.textSecondary }}>
                Platform
              </label>
              <select
                value={formData.platform}
                onChange={(e) => setFormData({ ...formData, platform: e.target.value })}
                className="w-full px-3 py-2 rounded-lg border text-sm transition-all duration-150"
                style={{
                  backgroundColor: NUUM_COLORS.background,
                  borderColor: NUUM_COLORS.border,
                  color: NUUM_COLORS.textPrimary,
                }}
                onFocus={(e) => e.currentTarget.style.borderColor = NUUM_COLORS.accent}
                onBlur={(e) => e.currentTarget.style.borderColor = NUUM_COLORS.border}
              >
                {PLATFORMS.map((platform) => (
                  <option key={platform.value} value={platform.value}>
                    {platform.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium mb-1.5" style={{ color: NUUM_COLORS.textSecondary }}>
                Status
              </label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                className="w-full px-3 py-2 rounded-lg border text-sm transition-all duration-150"
                style={{
                  backgroundColor: NUUM_COLORS.background,
                  borderColor: NUUM_COLORS.border,
                  color: NUUM_COLORS.textPrimary,
                }}
                onFocus={(e) => e.currentTarget.style.borderColor = NUUM_COLORS.accent}
                onBlur={(e) => e.currentTarget.style.borderColor = NUUM_COLORS.border}
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
              <label className="block text-xs font-medium mb-1.5" style={{ color: NUUM_COLORS.textSecondary }}>
                Spend (€)
              </label>
              <input
                type="number"
                min="0"
                step="1"
                required
                value={formData.spend}
                onChange={(e) => setFormData({ ...formData, spend: Number(e.target.value) })}
                className="w-full px-3 py-2 rounded-lg border text-sm transition-all duration-150"
                style={{
                  backgroundColor: NUUM_COLORS.background,
                  borderColor: NUUM_COLORS.border,
                  color: NUUM_COLORS.textPrimary,
                }}
                onFocus={(e) => e.currentTarget.style.borderColor = NUUM_COLORS.accent}
                onBlur={(e) => e.currentTarget.style.borderColor = NUUM_COLORS.border}
                placeholder="0"
              />
            </div>

            <div>
              <label className="block text-xs font-medium mb-1.5" style={{ color: NUUM_COLORS.textSecondary }}>
                Revenue (€)
              </label>
              <input
                type="number"
                min="0"
                step="1"
                required
                value={formData.revenue}
                onChange={(e) => setFormData({ ...formData, revenue: Number(e.target.value) })}
                className="w-full px-3 py-2 rounded-lg border text-sm transition-all duration-150"
                style={{
                  backgroundColor: NUUM_COLORS.background,
                  borderColor: NUUM_COLORS.border,
                  color: NUUM_COLORS.textPrimary,
                }}
                onFocus={(e) => e.currentTarget.style.borderColor = NUUM_COLORS.accent}
                onBlur={(e) => e.currentTarget.style.borderColor = NUUM_COLORS.border}
                placeholder="0"
              />
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 mt-6 pt-4 border-t" style={{ borderColor: NUUM_COLORS.border }}>
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
