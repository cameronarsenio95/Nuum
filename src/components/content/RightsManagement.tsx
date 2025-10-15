import { useState } from 'react';
import { Shield, Check, X, Calendar, AlertCircle, Download, ExternalLink } from 'lucide-react';

interface RightsManagementProps {
  contentId: string;
  currentRights: {
    usage_rights: string[];
    rights_expiry: string | null;
    usage_territories: string[];
    usage_notes: string | null;
  };
  onUpdate: (rights: any) => Promise<void>;
}

const USAGE_RIGHTS_OPTIONS = [
  'Social Media',
  'Paid Advertising',
  'Website',
  'Email Marketing',
  'Print',
  'Packaging',
  'In-Store',
  'TV/Broadcast',
];

const TERRITORIES = [
  'Worldwide',
  'North America',
  'Europe',
  'Asia Pacific',
  'Latin America',
  'Africa',
  'Middle East',
];

export function RightsManagement({ contentId, currentRights, onUpdate }: RightsManagementProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [rights, setRights] = useState({
    usage_rights: currentRights.usage_rights || [],
    rights_expiry: currentRights.rights_expiry || '',
    usage_territories: currentRights.usage_territories || ['Worldwide'],
    usage_notes: currentRights.usage_notes || '',
  });

  const handleSave = async () => {
    setSaving(true);
    try {
      await onUpdate(rights);
      setIsEditing(false);
    } catch (error) {
      console.error('Failed to update rights:', error);
    } finally {
      setSaving(false);
    }
  };

  const toggleRight = (right: string) => {
    setRights({
      ...rights,
      usage_rights: rights.usage_rights.includes(right)
        ? rights.usage_rights.filter(r => r !== right)
        : [...rights.usage_rights, right],
    });
  };

  const toggleTerritory = (territory: string) => {
    setRights({
      ...rights,
      usage_territories: rights.usage_territories.includes(territory)
        ? rights.usage_territories.filter(t => t !== territory)
        : [...rights.usage_territories, territory],
    });
  };

  const isExpired = rights.rights_expiry && new Date(rights.rights_expiry) < new Date();
  const isExpiringSoon = rights.rights_expiry && new Date(rights.rights_expiry) < new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

  return (
    <div className="dark:bg-linear-bg-secondary light:bg-white border dark:border-linear-border-subtle light:border-linear-light-border rounded-linear-lg p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-linear flex items-center justify-center ${
            isExpired
              ? 'bg-red-500/10 text-red-500'
              : isExpiringSoon
              ? 'bg-yellow-500/10 text-yellow-500'
              : 'bg-green-500/10 text-green-500'
          }`}>
            <Shield className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-lg font-medium">Usage Rights</h3>
            <p className="text-sm dark:text-text-tertiary light:text-text-light-tertiary">
              {isExpired
                ? 'Rights expired'
                : isExpiringSoon
                ? 'Rights expiring soon'
                : 'Active rights'}
            </p>
          </div>
        </div>
        {!isEditing ? (
          <button
            onClick={() => setIsEditing(true)}
            className="px-4 py-2 dark:bg-linear-bg-subtle light:bg-linear-light-bg-subtle hover:dark:bg-linear-bg-hover hover:light:bg-linear-light-bg-hover rounded-linear linear-transition text-sm"
          >
            Edit Rights
          </button>
        ) : (
          <div className="flex gap-2">
            <button
              onClick={() => setIsEditing(false)}
              className="px-4 py-2 dark:bg-linear-bg-subtle light:bg-linear-light-bg-subtle hover:dark:bg-linear-bg-hover hover:light:bg-linear-light-bg-hover rounded-linear linear-transition text-sm"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="px-4 py-2 bg-linear-accent hover:bg-linear-accent-hover text-white rounded-linear linear-transition text-sm disabled:opacity-50"
            >
              {saving ? 'Saving...' : 'Save'}
            </button>
          </div>
        )}
      </div>

      {isEditing ? (
        <div className="space-y-6">
          <div>
            <label className="block text-sm font-medium mb-3">Usage Rights</label>
            <div className="grid grid-cols-2 gap-2">
              {USAGE_RIGHTS_OPTIONS.map((right) => (
                <button
                  key={right}
                  onClick={() => toggleRight(right)}
                  className={`p-3 rounded-linear border text-sm text-left linear-transition ${
                    rights.usage_rights.includes(right)
                      ? 'border-linear-accent dark:bg-linear-accent/10 light:bg-linear-light-accent/10'
                      : 'dark:border-linear-border dark:bg-linear-bg light:border-linear-light-border light:bg-linear-light-bg hover:border-linear-border-hover'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    {rights.usage_rights.includes(right) && <Check className="w-4 h-4 text-linear-accent" />}
                    {right}
                  </div>
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Rights Expiry Date</label>
            <input
              type="date"
              value={rights.rights_expiry ? new Date(rights.rights_expiry).toISOString().split('T')[0] : ''}
              onChange={(e) => setRights({ ...rights, rights_expiry: e.target.value || null })}
              className="w-full px-4 py-2 dark:bg-linear-bg light:bg-linear-light-bg border dark:border-linear-border light:border-linear-light-border rounded-linear focus:outline-none focus:border-linear-accent"
            />
            <p className="text-xs dark:text-text-tertiary light:text-text-light-tertiary mt-1">
              Leave empty for perpetual rights
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium mb-3">Usage Territories</label>
            <div className="grid grid-cols-2 gap-2">
              {TERRITORIES.map((territory) => (
                <button
                  key={territory}
                  onClick={() => toggleTerritory(territory)}
                  className={`p-3 rounded-linear border text-sm text-left linear-transition ${
                    rights.usage_territories.includes(territory)
                      ? 'border-linear-accent dark:bg-linear-accent/10 light:bg-linear-light-accent/10'
                      : 'dark:border-linear-border dark:bg-linear-bg light:border-linear-light-border light:bg-linear-light-bg hover:border-linear-border-hover'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    {rights.usage_territories.includes(territory) && <Check className="w-4 h-4 text-linear-accent" />}
                    {territory}
                  </div>
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Additional Notes</label>
            <textarea
              value={rights.usage_notes}
              onChange={(e) => setRights({ ...rights, usage_notes: e.target.value })}
              className="w-full px-4 py-2 dark:bg-linear-bg light:bg-linear-light-bg border dark:border-linear-border light:border-linear-light-border rounded-linear focus:outline-none focus:border-linear-accent h-24"
              placeholder="Add any specific usage conditions or restrictions..."
            />
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {(isExpired || isExpiringSoon) && (
            <div className={`p-3 rounded-linear border flex items-start gap-2 ${
              isExpired
                ? 'bg-red-500/10 border-red-500/20 text-red-500'
                : 'bg-yellow-500/10 border-yellow-500/20 text-yellow-500'
            }`}>
              <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
              <div className="text-sm">
                {isExpired
                  ? `Rights expired on ${new Date(rights.rights_expiry!).toLocaleDateString()}. Update or renew rights before using this content.`
                  : `Rights expire on ${new Date(rights.rights_expiry!).toLocaleDateString()}. Consider renewing soon.`}
              </div>
            </div>
          )}

          <div>
            <h4 className="text-sm font-medium mb-2 dark:text-text-secondary light:text-text-light-secondary">Approved Usage</h4>
            {rights.usage_rights.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {rights.usage_rights.map((right) => (
                  <span key={right} className="px-3 py-1 bg-green-500/10 text-green-500 text-sm rounded-full border border-green-500/20">
                    {right}
                  </span>
                ))}
              </div>
            ) : (
              <p className="text-sm dark:text-text-tertiary light:text-text-light-tertiary">No usage rights specified</p>
            )}
          </div>

          <div>
            <h4 className="text-sm font-medium mb-2 dark:text-text-secondary light:text-text-light-secondary">Territories</h4>
            {rights.usage_territories.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {rights.usage_territories.map((territory) => (
                  <span key={territory} className="px-3 py-1 dark:bg-linear-bg-subtle light:bg-linear-light-bg-subtle text-sm rounded-full border dark:border-linear-border-subtle light:border-linear-light-border">
                    {territory}
                  </span>
                ))}
              </div>
            ) : (
              <p className="text-sm dark:text-text-tertiary light:text-text-light-tertiary">No territories specified</p>
            )}
          </div>

          {rights.rights_expiry && (
            <div>
              <h4 className="text-sm font-medium mb-2 dark:text-text-secondary light:text-text-light-secondary">Expiry Date</h4>
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 dark:text-text-tertiary light:text-text-light-tertiary" />
                <span className="text-sm">{new Date(rights.rights_expiry).toLocaleDateString()}</span>
              </div>
            </div>
          )}

          {rights.usage_notes && (
            <div>
              <h4 className="text-sm font-medium mb-2 dark:text-text-secondary light:text-text-light-secondary">Notes</h4>
              <p className="text-sm dark:text-text-secondary light:text-text-light-secondary">{rights.usage_notes}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
