import { useState } from 'react';
import { Upload, X, Check, AlertCircle, Download } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { validateCreatorData } from '../../utils/validation';

interface CreatorBulkImportProps {
  workspaceId: string;
  isOpen: boolean;
  onClose: () => void;
  onImportComplete: () => void;
}

interface ImportRow {
  name: string;
  email?: string;
  phone?: string;
  instagram_handle?: string;
  tiktok_handle?: string;
  youtube_handle?: string;
  notes?: string;
  tags?: string;
  status?: string;
}

interface ValidationResult {
  row: number;
  errors: string[];
  data: ImportRow;
}

export function CreatorBulkImport({ workspaceId, isOpen, onClose, onImportComplete }: CreatorBulkImportProps) {
  const [importData, setImportData] = useState<ImportRow[]>([]);
  const [validationResults, setValidationResults] = useState<ValidationResult[]>([]);
  const [importing, setImporting] = useState(false);
  const [importComplete, setImportComplete] = useState(false);
  const [importStats, setImportStats] = useState({ success: 0, failed: 0 });

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target?.result as string;
        const rows = text.split('\n').filter(row => row.trim());
        const headers = rows[0].split(',').map(h => h.trim().toLowerCase());

        const data: ImportRow[] = rows.slice(1).map(row => {
          const values = row.split(',').map(v => v.trim());
          const rowData: any = {};
          headers.forEach((header, idx) => {
            rowData[header] = values[idx] || '';
          });
          return rowData;
        });

        setImportData(data);
        validateImportData(data);
      } catch (error) {
        console.error('Error parsing CSV:', error);
        alert('Failed to parse CSV file. Please check the format.');
      }
    };
    reader.readAsText(file);
  };

  const validateImportData = (data: ImportRow[]) => {
    const results: ValidationResult[] = [];

    data.forEach((row, idx) => {
      const errors: string[] = [];

      if (!row.name || row.name.trim() === '') {
        errors.push('Name is required');
      }

      if (row.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(row.email)) {
        errors.push('Invalid email format');
      }

      if (row.phone && !/^\+?[\d\s()-]+$/.test(row.phone)) {
        errors.push('Invalid phone format');
      }

      if (row.status && !['active', 'inactive', 'blacklisted'].includes(row.status)) {
        errors.push('Invalid status (must be: active, inactive, or blacklisted)');
      }

      results.push({
        row: idx + 2,
        errors,
        data: row
      });
    });

    setValidationResults(results);
  };

  const handleImport = async () => {
    const validRows = validationResults.filter(r => r.errors.length === 0);
    if (validRows.length === 0) {
      alert('No valid rows to import');
      return;
    }

    setImporting(true);
    let successCount = 0;
    let failCount = 0;

    for (const result of validRows) {
      try {
        const { error } = await supabase.from('creators').insert({
          workspace_id: workspaceId,
          name: result.data.name,
          email: result.data.email || null,
          phone: result.data.phone || null,
          instagram_handle: result.data.instagram_handle || null,
          tiktok_handle: result.data.tiktok_handle || null,
          youtube_handle: result.data.youtube_handle || null,
          notes: result.data.notes || null,
          tags: result.data.tags ? result.data.tags.split(';').map(t => t.trim()) : [],
          status: (result.data.status as any) || 'active'
        });

        if (error) {
          console.error('Import error:', error);
          failCount++;
        } else {
          successCount++;
        }
      } catch (error) {
        console.error('Import error:', error);
        failCount++;
      }
    }

    setImportStats({ success: successCount, failed: failCount });
    setImportComplete(true);
    setImporting(false);

    if (successCount > 0) {
      onImportComplete();
    }
  };

  const downloadTemplate = () => {
    const template = 'name,email,phone,instagram_handle,tiktok_handle,youtube_handle,notes,tags,status\n' +
      'John Doe,john@example.com,+1234567890,@johndoe,@johndoe,,Sample creator,fashion;lifestyle,active\n' +
      'Jane Smith,jane@example.com,+0987654321,@janesmith,@janesmith,@janesmith,Another creator,beauty;health,active';

    const blob = new Blob([template], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'creators-import-template.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleClose = () => {
    setImportData([]);
    setValidationResults([]);
    setImportComplete(false);
    setImportStats({ success: 0, failed: 0 });
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-6 z-50" onClick={handleClose}>
      <div
        className="dark:bg-linear-bg light:bg-linear-light-bg border dark:border-linear-border light:border-linear-light-border rounded-linear-lg p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <Upload className="w-6 h-6 dark:text-linear-accent light:text-linear-light-accent" />
            <h2 className="text-2xl font-medium">Bulk Import Creators</h2>
          </div>
          <button
            onClick={handleClose}
            className="p-2 hover:dark:bg-linear-bg-subtle hover:light:bg-linear-light-bg-subtle rounded-linear linear-transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {!importComplete ? (
          <>
            <div className="mb-6">
              <button
                onClick={downloadTemplate}
                className="flex items-center gap-2 px-4 py-2 dark:bg-linear-bg-secondary light:bg-white border dark:border-linear-border light:border-linear-light-border rounded-linear hover:dark:border-linear-border-subtle hover:light:border-linear-light-border linear-transition"
              >
                <Download className="w-4 h-4" />
                Download CSV Template
              </button>
              <p className="text-sm dark:text-text-tertiary light:text-text-light-tertiary mt-2">
                Download the template to see the required format. Tags should be separated by semicolons.
              </p>
            </div>

            <div className="mb-6">
              <label className="block text-sm font-medium mb-2">Upload CSV File</label>
              <input
                type="file"
                accept=".csv"
                onChange={handleFileUpload}
                className="w-full px-4 py-2 dark:bg-linear-bg-secondary light:bg-white border dark:border-linear-border light:border-linear-light-border rounded-linear focus:outline-none focus:border-linear-accent"
              />
            </div>

            {validationResults.length > 0 && (
              <div className="mb-6">
                <h3 className="text-lg font-medium mb-3">Validation Results</h3>
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {validationResults.map((result) => (
                    <div
                      key={result.row}
                      className={`p-3 rounded-linear border ${
                        result.errors.length === 0
                          ? 'dark:bg-linear-success/10 light:bg-linear-light-success/10 border-linear-success-border/20'
                          : 'dark:bg-linear-error/10 light:bg-linear-light-error/10 border-linear-error-border/20'
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        {result.errors.length === 0 ? (
                          <Check className="w-5 h-5 text-linear-success flex-shrink-0 mt-0.5" />
                        ) : (
                          <AlertCircle className="w-5 h-5 text-linear-error flex-shrink-0 mt-0.5" />
                        )}
                        <div className="flex-1">
                          <div className="font-medium mb-1">
                            Row {result.row}: {result.data.name || 'Missing name'}
                          </div>
                          {result.errors.length > 0 && (
                            <ul className="text-sm text-linear-error space-y-1">
                              {result.errors.map((error, idx) => (
                                <li key={idx}>• {error}</li>
                              ))}
                            </ul>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {validationResults.length > 0 && (
              <div className="flex items-center justify-between pt-4 border-t dark:border-linear-border-subtle light:border-linear-light-border">
                <div className="text-sm">
                  <span className="text-linear-success font-medium">
                    {validationResults.filter(r => r.errors.length === 0).length} valid
                  </span>
                  {' / '}
                  <span className="text-linear-error font-medium">
                    {validationResults.filter(r => r.errors.length > 0).length} errors
                  </span>
                </div>
                <button
                  onClick={handleImport}
                  disabled={importing || validationResults.filter(r => r.errors.length === 0).length === 0}
                  className="px-6 py-2 bg-white hover:bg-gray-100 text-black rounded-linear linear-transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {importing ? 'Importing...' : 'Import Valid Creators'}
                </button>
              </div>
            )}
          </>
        ) : (
          <div className="text-center py-12">
            <Check className="w-16 h-16 text-linear-success mx-auto mb-4" />
            <h3 className="text-2xl font-medium mb-3">Import Complete</h3>
            <div className="text-lg mb-6">
              <span className="text-linear-success font-medium">{importStats.success} creators imported</span>
              {importStats.failed > 0 && (
                <>
                  {' • '}
                  <span className="text-linear-error font-medium">{importStats.failed} failed</span>
                </>
              )}
            </div>
            <button
              onClick={handleClose}
              className="px-6 py-2 bg-white hover:bg-gray-100 text-black rounded-linear linear-transition"
            >
              Close
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
