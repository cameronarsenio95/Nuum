import { useState, useEffect } from 'react';
import { Globe, RefreshCw, CheckCircle2, XCircle, Clock, Copy, Check, AlertCircle } from 'lucide-react';
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
      const { data, error } = await supabase
        .from('email_domains')
        .select(`
          *,
          workspace:workspaces(name)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setDomains(data || []);
      if (data && data.length > 0 && !selectedDomain) {
        setSelectedDomain(data[0]);
      }
    } catch (error) {
      console.error('Error loading domains:', error);
      showToast('Failed to load domains', 'error');
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
          status: 'verified',
          verified_at: new Date().toISOString()
        })
        .eq('id', domainId);

      if (error) throw error;

      await supabase
        .from('dns_records')
        .update({ verified: true })
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

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-2xl font-medium mb-2">DNS Management</h2>
        <p className="dark:text-text-secondary light:text-text-light-secondary">
          Manage email domains and DNS records for all workspaces
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1">
          <div className="dark:bg-linear-bg-secondary light:bg-linear-light-bg-secondary border dark:border-linear-border light:border-linear-light-border rounded-linear overflow-hidden">
            <div className="p-4 border-b dark:border-linear-border light:border-linear-light-border">
              <h3 className="font-medium">Email Domains</h3>
            </div>
            <div className="divide-y dark:divide-linear-border light:divide-linear-light-border">
              {domains.length === 0 ? (
                <div className="p-4 text-center dark:text-text-tertiary light:text-text-light-tertiary">
                  No domains configured
                </div>
              ) : (
                domains.map((domain) => (
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
                  <h3 className="font-medium">DNS Records</h3>
                  <p className="text-sm dark:text-text-secondary light:text-text-light-secondary mt-1">
                    Add these records to your DNS provider (Bolt.new)
                  </p>
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
                          <div className="flex items-center gap-2">
                            <span className={`text-xs px-2 py-1 rounded-full border ${getPurposeBadgeColor(record.purpose)}`}>
                              {getPurposeLabel(record.purpose)}
                            </span>
                            <span className="text-xs font-mono px-2 py-1 dark:bg-linear-bg-subtle light:bg-linear-light-bg-subtle rounded">
                              {record.record_type}
                            </span>
                            {record.verified && (
                              <span className="inline-flex items-center gap-1 text-xs text-linear-success">
                                <CheckCircle2 className="w-3.5 h-3.5" />
                                Verified
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
                        <p>Add these DNS records to Bolt.new:</p>
                        <ol className="list-decimal list-inside space-y-1 ml-2">
                          <li>Log in to Bolt.new and go to your domain settings for {selectedDomain.domain}</li>
                          <li>Find the DNS management or DNS records section</li>
                          <li>Add each record shown above using the Type, Host, Value, and Priority fields</li>
                          <li>Wait 5-60 minutes for DNS propagation</li>
                          <li>Click "Verify" button to check if records are configured correctly</li>
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
