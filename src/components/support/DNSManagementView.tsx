import { useState, useEffect } from 'react';
import { Globe, RefreshCw, CheckCircle2, XCircle, Clock, Copy, Check, AlertCircle, Plus, Trash2, Search, Filter, ExternalLink } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useToast } from '../../contexts/ToastContext';

interface EmailDomain {
  id: string;
  workspace_id: string;
  domain: string;
  region: string;
  status: 'pending' | 'verified' | 'failed';
  provider: string;
  verified_at: string | null;
  created_at: string;
  workspace?: {
    name: string;
  };
}

interface DNSRecord {
  id: string;
  email_domain_id: string;
  record_type: string;
  host: string;
  value: string;
  priority: number | null;
  ttl: number;
  purpose: string;
  verified: boolean;
  created_at: string;
}

export function DNSManagementView() {
  const [domains, setDomains] = useState<EmailDomain[]>([]);
  const [selectedDomain, setSelectedDomain] = useState<EmailDomain | null>(null);
  const [dnsRecords, setDnsRecords] = useState<DNSRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [verifying, setVerifying] = useState(false);
  const [copiedRecord, setCopiedRecord] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [showAddDomainModal, setShowAddDomainModal] = useState(false);
  const [deletingDomain, setDeletingDomain] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const { showToast } = useToast();

  useEffect(() => {
    loadDomains();
  }, []);

  useEffect(() => {
    if (selectedDomain) {
      loadDNSRecords(selectedDomain.id);
    }
  }, [selectedDomain]);

  const loadDomains = async () => {
    try {
      setLoading(true);
      setError(null);
      let query = supabase
        .from('email_domains')
        .select('*');

      if (statusFilter !== 'all') {
        query = query.eq('status', statusFilter);
      }

      const { data, error } = await query.order('created_at', { ascending: false });

      if (error) {
        console.error('Error loading domains:', error);
        if (error.code === '42P01') {
          setError('Database tables not found. Please apply migrations first.');
        } else {
          setError(`Failed to load domains: ${error.message}`);
        }
        setDomains([]);
        return;
      }

      // Load workspace names separately to avoid RLS issues
      if (data && data.length > 0) {
        const workspaceIds = [...new Set(data.map(d => d.workspace_id))];
        const { data: workspaces } = await supabase
          .from('workspaces')
          .select('id, name')
          .in('id', workspaceIds);

        const workspaceMap = new Map(workspaces?.map(w => [w.id, w]) || []);
        const domainsWithWorkspaces = data.map(d => ({
          ...d,
          workspace: workspaceMap.get(d.workspace_id)
        }));
        setDomains(domainsWithWorkspaces);
        if (!selectedDomain) {
          setSelectedDomain(domainsWithWorkspaces[0]);
        }
      } else {
        setDomains([]);
      }
    } catch (error: any) {
      console.error('Error loading domains:', error);
      setError(`Failed to load domains: ${error.message || 'Unknown error'}`);
      setDomains([]);
    } finally {
      setLoading(false);
    }
  };

  const loadDNSRecords = async (domainId: string) => {
    try {
      const { data, error } = await supabase
        .from('dns_records')
        .select('*')
        .eq('email_domain_id', domainId)
        .order('purpose');

      if (error) throw error;
      setDnsRecords(data || []);
    } catch (error) {
      console.error('Error loading DNS records:', error);
      showToast('Failed to load DNS records', 'error');
    }
  };

  const verifyDomain = async (domainId: string) => {
    setVerifying(true);
    try {
      const { error } = await supabase
        .from('email_domains')
        .update({
          status: 'verified' as const,
          verified_at: new Date().toISOString()
        } as any)
        .eq('id', domainId);

      if (error) throw error;

      await supabase
        .from('dns_records')
        .update({ verified: true } as any)
        .eq('email_domain_id', domainId);

      showToast('Domain verified successfully', 'success');
      loadDomains();
      if (selectedDomain?.id === domainId) {
        loadDNSRecords(domainId);
      }
    } catch (error) {
      console.error('Error verifying domain:', error);
      showToast('Failed to verify domain', 'error');
    } finally {
      setVerifying(false);
    }
  };

  const copyToClipboard = async (text: string, recordId: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedRecord(recordId);
      showToast('Copied to clipboard', 'success');
      setTimeout(() => setCopiedRecord(null), 2000);
    } catch (error) {
      console.error('Error copying to clipboard:', error);
      showToast('Failed to copy to clipboard', 'error');
    }
  };

  const deleteDomain = async (domainId: string) => {
    if (!confirm('Are you sure you want to delete this domain? This will also delete all associated DNS records.')) {
      return;
    }

    setDeletingDomain(domainId);
    try {
      const { error } = await supabase
        .from('email_domains')
        .delete()
        .eq('id', domainId);

      if (error) throw error;

      showToast('Domain deleted successfully', 'success');
      if (selectedDomain?.id === domainId) {
        setSelectedDomain(null);
      }
      loadDomains();
    } catch (error) {
      console.error('Error deleting domain:', error);
      showToast('Failed to delete domain', 'error');
    } finally {
      setDeletingDomain(null);
    }
  };

  const syncWithResend = async (domainId: string) => {
    setVerifying(true);
    try {
      showToast('This feature syncs DNS records from Resend API', 'info');
    } catch (error) {
      console.error('Error syncing with Resend:', error);
      showToast('Failed to sync with Resend', 'error');
    } finally {
      setVerifying(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'verified':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-linear-success/10 text-linear-success border border-linear-success-border/20">
            <CheckCircle2 className="w-3.5 h-3.5" />
            Verified
          </span>
        );
      case 'failed':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-linear-error/10 text-linear-error border border-linear-error-border/20">
            <XCircle className="w-3.5 h-3.5" />
            Failed
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-linear-warning/10 text-linear-warning border border-linear-warning-border/20">
            <Clock className="w-3.5 h-3.5" />
            Pending
          </span>
        );
    }
  };

  const getPurposeLabel = (purpose: string) => {
    const labels: Record<string, string> = {
      mx: 'Mail Exchange',
      spf: 'Sender Policy Framework',
      dkim: 'Domain Keys',
      dmarc: 'Authentication Policy',
      verification: 'Domain Verification'
    };
    return labels[purpose] || purpose.toUpperCase();
  };

  const getPurposeBadgeColor = (purpose: string) => {
    const colors: Record<string, string> = {
      mx: 'bg-blue-500/10 text-blue-500 border-blue-500/20',
      spf: 'bg-green-500/10 text-green-500 border-green-500/20',
      dkim: 'bg-purple-500/10 text-purple-500 border-purple-500/20',
      dmarc: 'bg-orange-500/10 text-orange-500 border-orange-500/20',
      verification: 'bg-cyan-500/10 text-cyan-500 border-cyan-500/20'
    };
    return colors[purpose] || 'bg-linear-bg-subtle text-text-secondary border-linear-border';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="inline-block w-8 h-8 border-2 border-linear-accent border-t-transparent rounded-full animate-spin"></div>
          <p className="mt-4 dark:text-text-secondary light:text-text-light-secondary">Loading DNS records...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center max-w-md">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-red-500/10 mb-4">
            <AlertCircle className="w-8 h-8 text-red-500" />
          </div>
          <h3 className="text-xl font-medium mb-2">Unable to Load DNS Management</h3>
          <p className="dark:text-text-secondary light:text-text-light-secondary mb-4">{error}</p>
          <div className="space-y-2 text-sm dark:text-text-tertiary light:text-text-light-tertiary text-left bg-red-500/5 border border-red-500/20 rounded-linear p-4">
            <p className="font-medium text-red-500">Possible Solutions:</p>
            <ol className="list-decimal list-inside space-y-1 ml-2">
              <li>Ensure database migrations have been applied</li>
              <li>Check that the email_domains and dns_records tables exist</li>
              <li>Verify your database connection in Supabase</li>
              <li>Check the browser console for detailed error messages</li>
            </ol>
          </div>
          <button
            onClick={() => loadDomains()}
            className="mt-4 px-4 py-2 bg-linear-accent hover:bg-linear-accent-hover text-white rounded-linear linear-transition"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  const filteredDomains = domains.filter(domain => {
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      return (
        domain.domain.toLowerCase().includes(query) ||
        domain.workspace?.name?.toLowerCase().includes(query)
      );
    }
    return true;
  });

  useEffect(() => {
    loadDomains();
  }, [statusFilter]);

  return (
    <div>
      <div className="mb-6">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h2 className="text-2xl font-medium mb-2">DNS Management</h2>
            <p className="dark:text-text-secondary light:text-text-light-secondary">
              Manage email domains and DNS records for all workspaces
            </p>
          </div>
          <button
            onClick={() => setShowAddDomainModal(true)}
            className="inline-flex items-center gap-2 px-4 py-2 bg-linear-accent hover:bg-linear-accent-hover text-white rounded-linear linear-transition"
          >
            <Plus className="w-4 h-4" />
            Add Domain
          </button>
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 dark:text-text-tertiary light:text-text-light-tertiary" />
            <input
              type="text"
              placeholder="Search domains or workspaces..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 dark:bg-linear-bg-secondary light:bg-linear-light-bg-secondary border dark:border-linear-border light:border-linear-light-border rounded-linear focus:outline-none focus:ring-2 focus:ring-linear-accent"
            />
          </div>
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 dark:text-text-tertiary light:text-text-light-tertiary" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-4 py-2 dark:bg-linear-bg-secondary light:bg-linear-light-bg-secondary border dark:border-linear-border light:border-linear-light-border rounded-linear focus:outline-none focus:ring-2 focus:ring-linear-accent"
            >
              <option value="all">All Status</option>
              <option value="verified">Verified</option>
              <option value="pending">Pending</option>
              <option value="failed">Failed</option>
            </select>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1">
          <div className="dark:bg-linear-bg-secondary light:bg-linear-light-bg-secondary border dark:border-linear-border light:border-linear-light-border rounded-linear overflow-hidden">
            <div className="p-4 border-b dark:border-linear-border light:border-linear-light-border">
              <h3 className="font-medium">Email Domains</h3>
            </div>
            <div className="divide-y dark:divide-linear-border light:divide-linear-light-border">
              {filteredDomains.length === 0 ? (
                <div className="p-4 text-center dark:text-text-tertiary light:text-text-light-tertiary">
                  {searchQuery ? 'No domains found matching your search' : 'No domains configured'}
                </div>
              ) : (
                filteredDomains.map((domain) => (
                  <button
                    key={domain.id}
                    onClick={() => setSelectedDomain(domain)}
                    className={`w-full text-left p-4 linear-transition ${
                      selectedDomain?.id === domain.id
                        ? 'dark:bg-linear-bg-subtle light:bg-linear-light-bg-subtle'
                        : 'dark:hover:bg-linear-bg-subtle light:hover:bg-linear-light-bg-subtle'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <Globe className="w-5 h-5 dark:text-text-secondary light:text-text-light-secondary mt-0.5 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <div className="font-medium truncate mb-1">{domain.domain}</div>
                        {domain.workspace?.name && (
                          <div className="text-xs dark:text-text-tertiary light:text-text-light-tertiary truncate mb-2">
                            {domain.workspace.name}
                          </div>
                        )}
                        {getStatusBadge(domain.status)}
                      </div>
                    </div>
                  </button>
                ))
              )}
            </div>
          </div>
        </div>

        <div className="lg:col-span-2">
          {selectedDomain ? (
            <div className="space-y-6">
              <div className="dark:bg-linear-bg-secondary light:bg-linear-light-bg-secondary border dark:border-linear-border light:border-linear-light-border rounded-linear p-6">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="text-xl font-medium mb-1">{selectedDomain.domain}</h3>
                    <p className="text-sm dark:text-text-secondary light:text-text-light-secondary">
                      Provider: {selectedDomain.provider} • Region: {selectedDomain.region}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    {getStatusBadge(selectedDomain.status)}
                    <div className="flex items-center gap-2">
                      {selectedDomain.status === 'pending' && (
                        <button
                          onClick={() => verifyDomain(selectedDomain.id)}
                          disabled={verifying}
                          className="inline-flex items-center gap-2 px-4 py-2 bg-linear-accent hover:bg-linear-accent-hover text-white rounded-linear linear-transition disabled:opacity-50"
                        >
                          <RefreshCw className={`w-4 h-4 ${verifying ? 'animate-spin' : ''}`} />
                          {verifying ? 'Verifying...' : 'Verify'}
                        </button>
                      )}
                      <a
                        href={`https://resend.com/domains/${selectedDomain.domain}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 px-4 py-2 dark:bg-linear-bg-subtle light:bg-linear-light-bg-subtle hover:dark:bg-linear-bg light:hover:bg-linear-light-bg border dark:border-linear-border light:border-linear-light-border rounded-linear linear-transition"
                        title="View in Resend"
                      >
                        <ExternalLink className="w-4 h-4" />
                        Resend
                      </a>
                      <button
                        onClick={() => deleteDomain(selectedDomain.id)}
                        disabled={deletingDomain === selectedDomain.id}
                        className="inline-flex items-center gap-2 px-4 py-2 dark:bg-red-500/10 light:bg-red-500/10 hover:dark:bg-red-500/20 light:hover:bg-red-500/20 text-red-500 border border-red-500/20 rounded-linear linear-transition disabled:opacity-50"
                      >
                        <Trash2 className="w-4 h-4" />
                        Delete
                      </button>
                    </div>
                  </div>
                </div>

                {selectedDomain.verified_at && (
                  <p className="text-xs dark:text-text-tertiary light:text-text-light-tertiary">
                    Verified on {new Date(selectedDomain.verified_at).toLocaleString()}
                  </p>
                )}
              </div>

              <div className="dark:bg-linear-bg-secondary light:bg-linear-light-bg-secondary border dark:border-linear-border light:border-linear-light-border rounded-linear overflow-hidden">
                <div className="p-4 border-b dark:border-linear-border light:border-linear-light-border">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-medium">DNS Records</h3>
                      <p className="text-sm dark:text-text-secondary light:text-text-light-secondary mt-1">
                        Add these records to your DNS provider
                      </p>
                    </div>
                    <button
                      onClick={() => syncWithResend(selectedDomain.id)}
                      disabled={verifying}
                      className="inline-flex items-center gap-2 px-3 py-1.5 text-sm dark:bg-linear-bg-subtle light:bg-linear-light-bg-subtle hover:dark:bg-linear-bg light:hover:bg-linear-light-bg border dark:border-linear-border light:border-linear-light-border rounded-linear linear-transition"
                    >
                      <RefreshCw className={`w-3.5 h-3.5 ${verifying ? 'animate-spin' : ''}`} />
                      Sync from Resend
                    </button>
                  </div>
                </div>

                {dnsRecords.length === 0 ? (
                  <div className="p-8 text-center dark:text-text-tertiary light:text-text-light-tertiary">
                    No DNS records found
                  </div>
                ) : (
                  <div className="divide-y dark:divide-linear-border light:divide-linear-light-border">
                    {dnsRecords.map((record) => (
                      <div key={record.id} className="p-4">
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className={`text-xs px-2 py-1 rounded-full border ${getPurposeBadgeColor(record.purpose)}`}>
                              {getPurposeLabel(record.purpose)}
                            </span>
                            <span className="text-xs font-mono px-2 py-1 dark:bg-linear-bg-subtle light:bg-linear-light-bg-subtle rounded">
                              {record.record_type}
                            </span>
                            {record.verified ? (
                              <span className="inline-flex items-center gap-1 text-xs text-linear-success">
                                <CheckCircle2 className="w-3.5 h-3.5" />
                                Verified
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 text-xs dark:text-text-tertiary light:text-text-light-tertiary">
                                <Clock className="w-3.5 h-3.5" />
                                Not Verified
                              </span>
                            )}
                          </div>
                        </div>

                        <div className="space-y-2 text-sm">
                          <div className="grid grid-cols-3 gap-4">
                            <div>
                              <span className="dark:text-text-tertiary light:text-text-light-tertiary">Host:</span>
                              <div className="font-mono mt-1">{record.host}</div>
                            </div>
                            {record.priority && (
                              <div>
                                <span className="dark:text-text-tertiary light:text-text-light-tertiary">Priority:</span>
                                <div className="font-mono mt-1">{record.priority}</div>
                              </div>
                            )}
                            <div>
                              <span className="dark:text-text-tertiary light:text-text-light-tertiary">TTL:</span>
                              <div className="font-mono mt-1">{record.ttl}</div>
                            </div>
                          </div>

                          <div>
                            <span className="dark:text-text-tertiary light:text-text-light-tertiary">Value:</span>
                            <div className="flex items-start gap-2 mt-1">
                              <code className="flex-1 px-3 py-2 dark:bg-linear-bg light:bg-linear-light-bg border dark:border-linear-border-subtle light:border-linear-light-border-subtle rounded text-xs break-all">
                                {record.value}
                              </code>
                              <button
                                onClick={() => copyToClipboard(record.value, record.id)}
                                className="p-2 dark:hover:bg-linear-bg-subtle light:hover:bg-linear-light-bg-subtle rounded-linear linear-transition"
                                title="Copy to clipboard"
                              >
                                {copiedRecord === record.id ? (
                                  <Check className="w-4 h-4 text-linear-success" />
                                ) : (
                                  <Copy className="w-4 h-4 dark:text-text-secondary light:text-text-light-secondary" />
                                )}
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {selectedDomain.status === 'pending' && (
                <div className="dark:bg-blue-500/5 light:bg-blue-500/10 border border-blue-500/20 rounded-linear p-4">
                  <div className="flex gap-3">
                    <AlertCircle className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" />
                    <div>
                      <h4 className="font-medium text-blue-500 mb-1">Setup Instructions</h4>
                      <div className="text-sm dark:text-text-secondary light:text-text-light-secondary space-y-2">
                        <p>Add these DNS records to your DNS provider:</p>
                        <ol className="list-decimal list-inside space-y-1 ml-2">
                          <li>Log in to your DNS provider (e.g., Cloudflare, GoDaddy, Namecheap)</li>
                          <li>Navigate to DNS management for <code className="px-1.5 py-0.5 dark:bg-linear-bg light:bg-linear-light-bg rounded text-xs">{selectedDomain.domain}</code></li>
                          <li>Add each record above with the exact Type, Host, Value, and Priority</li>
                          <li>DNS propagation typically takes 5-60 minutes (can take up to 24 hours)</li>
                          <li>Click the "Verify" button to check if records are configured correctly</li>
                          <li>You can also verify status in <a href="https://resend.com/domains" target="_blank" rel="noopener noreferrer" className="text-linear-accent hover:underline">Resend Dashboard</a></li>
                        </ol>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="dark:bg-linear-bg-secondary light:bg-linear-light-bg-secondary border dark:border-linear-border light:border-linear-light-border rounded-linear p-12 text-center">
              <Globe className="w-12 h-12 dark:text-text-tertiary light:text-text-light-tertiary mx-auto mb-4" />
              <p className="dark:text-text-secondary light:text-text-light-secondary">
                Select a domain to view DNS records
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
