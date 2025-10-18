import { useState, useEffect } from 'react';
import { X, DollarSign } from 'lucide-react';

export interface CostBreakdown {
  fee: number;
  items: number;
  advertisement: number;
  shipping: number;
  production: number;
  other: number;
}

interface CostBreakdownModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (breakdown: CostBreakdown, total: number) => void;
  initialBreakdown?: CostBreakdown;
  initialTotal?: number;
}

export function CostBreakdownModal({ isOpen, onClose, onSave, initialBreakdown, initialTotal }: CostBreakdownModalProps) {
  const [breakdown, setBreakdown] = useState<CostBreakdown>({
    fee: initialBreakdown?.fee || 0,
    items: initialBreakdown?.items || 0,
    advertisement: initialBreakdown?.advertisement || 0,
    shipping: initialBreakdown?.shipping || 0,
    production: initialBreakdown?.production || 0,
    other: initialBreakdown?.other || 0,
  });

  useEffect(() => {
    if (initialBreakdown) {
      setBreakdown(initialBreakdown);
    }
  }, [initialBreakdown]);

  const calculateTotal = () => {
    return Object.values(breakdown).reduce((sum, value) => sum + (value || 0), 0);
  };

  const handleInputChange = (field: keyof CostBreakdown, value: string) => {
    const numValue = value === '' ? 0 : parseFloat(value);
    setBreakdown(prev => ({
      ...prev,
      [field]: isNaN(numValue) ? 0 : numValue
    }));
  };

  const handleSave = () => {
    const total = calculateTotal();
    onSave(breakdown, total);
    onClose();
  };

  if (!isOpen) return null;

  const total = calculateTotal();

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-6 z-[60]" onClick={onClose}>
      <div
        className="dark:bg-linear-bg-secondary light:bg-linear-light-bg-secondary border dark:border-linear-border light:border-linear-light-border rounded-linear-lg p-6 w-full max-w-md"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-medium">Cost Breakdown</h3>
          <button
            onClick={onClose}
            className="p-1 hover:dark:bg-linear-bg-subtle hover:light:bg-linear-light-bg-subtle rounded-linear"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">Fee</label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 dark:text-text-tertiary light:text-text-light-tertiary">$</span>
              <input
                type="number"
                value={breakdown.fee || ''}
                onChange={(e) => handleInputChange('fee', e.target.value)}
                className="w-full pl-8 pr-4 py-2 dark:bg-linear-bg light:bg-linear-light-bg border dark:border-linear-border light:border-linear-light-border rounded-linear focus:outline-none focus:border-linear-accent"
                placeholder="0.00"
                step="0.01"
                min="0"
              />
            </div>
            <p className="text-xs dark:text-text-tertiary light:text-text-light-tertiary mt-1">Creator fees, platform fees</p>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Items</label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 dark:text-text-tertiary light:text-text-light-tertiary">$</span>
              <input
                type="number"
                value={breakdown.items || ''}
                onChange={(e) => handleInputChange('items', e.target.value)}
                className="w-full pl-8 pr-4 py-2 dark:bg-linear-bg light:bg-linear-light-bg border dark:border-linear-border light:border-linear-light-border rounded-linear focus:outline-none focus:border-linear-accent"
                placeholder="0.00"
                step="0.01"
                min="0"
              />
            </div>
            <p className="text-xs dark:text-text-tertiary light:text-text-light-tertiary mt-1">Products, samples, props</p>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Advertisement</label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 dark:text-text-tertiary light:text-text-light-tertiary">$</span>
              <input
                type="number"
                value={breakdown.advertisement || ''}
                onChange={(e) => handleInputChange('advertisement', e.target.value)}
                className="w-full pl-8 pr-4 py-2 dark:bg-linear-bg light:bg-linear-light-bg border dark:border-linear-border light:border-linear-light-border rounded-linear focus:outline-none focus:border-linear-accent"
                placeholder="0.00"
                step="0.01"
                min="0"
              />
            </div>
            <p className="text-xs dark:text-text-tertiary light:text-text-light-tertiary mt-1">Ad spend, boosting costs</p>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Shipping</label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 dark:text-text-tertiary light:text-text-light-tertiary">$</span>
              <input
                type="number"
                value={breakdown.shipping || ''}
                onChange={(e) => handleInputChange('shipping', e.target.value)}
                className="w-full pl-8 pr-4 py-2 dark:bg-linear-bg light:bg-linear-light-bg border dark:border-linear-border light:border-linear-light-border rounded-linear focus:outline-none focus:border-linear-accent"
                placeholder="0.00"
                step="0.01"
                min="0"
              />
            </div>
            <p className="text-xs dark:text-text-tertiary light:text-text-light-tertiary mt-1">Logistics and delivery</p>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Production</label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 dark:text-text-tertiary light:text-text-light-tertiary">$</span>
              <input
                type="number"
                value={breakdown.production || ''}
                onChange={(e) => handleInputChange('production', e.target.value)}
                className="w-full pl-8 pr-4 py-2 dark:bg-linear-bg light:bg-linear-light-bg border dark:border-linear-border light:border-linear-light-border rounded-linear focus:outline-none focus:border-linear-accent"
                placeholder="0.00"
                step="0.01"
                min="0"
              />
            </div>
            <p className="text-xs dark:text-text-tertiary light:text-text-light-tertiary mt-1">Video editing, photography</p>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Other</label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 dark:text-text-tertiary light:text-text-light-tertiary">$</span>
              <input
                type="number"
                value={breakdown.other || ''}
                onChange={(e) => handleInputChange('other', e.target.value)}
                className="w-full pl-8 pr-4 py-2 dark:bg-linear-bg light:bg-linear-light-bg border dark:border-linear-border light:border-linear-light-border rounded-linear focus:outline-none focus:border-linear-accent"
                placeholder="0.00"
                step="0.01"
                min="0"
              />
            </div>
            <p className="text-xs dark:text-text-tertiary light:text-text-light-tertiary mt-1">Miscellaneous expenses</p>
          </div>

          <div className="pt-4 border-t dark:border-linear-border light:border-linear-light-border">
            <div className="flex items-center justify-between mb-4">
              <span className="text-lg font-medium">Total Costs</span>
              <div className="flex items-center gap-2">
                <DollarSign className="w-5 h-5 dark:text-text-tertiary light:text-text-light-tertiary" />
                <span className="text-2xl font-medium">{total.toFixed(2)}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="flex gap-3 mt-6">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 px-4 py-2 dark:bg-linear-bg-subtle light:bg-linear-light-bg-subtle hover:bg-linear-border-subtle rounded-linear linear-transition"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSave}
            className="flex-1 px-4 py-2 bg-white hover:bg-gray-100 text-black rounded-linear linear-transition"
          >
            Save
          </button>
        </div>
      </div>
    </div>
  );
}
