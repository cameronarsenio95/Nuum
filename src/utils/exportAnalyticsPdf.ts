import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import type { Database } from '../lib/database.types';

type Workspace = Database['public']['Tables']['workspaces']['Row'];
type Campaign = Database['public']['Tables']['campaigns']['Row'];

interface CampaignWithMetrics extends Campaign {
  total_ad_sets: number;
  active_ad_sets: number;
  total_spend: number;
  total_revenue: number;
  roi: number;
}

interface CreatorData {
  id: string;
  name: string;
  handle: string;
  platform: string;
  total_revenue: number;
}

interface PlatformData {
  platform: string;
  creator_count: number;
  revenue: number;
  share: number;
}

interface ExportPdfOptions {
  workspace: Workspace;
  filters: {
    timeRange: 'all' | '30d' | '7d';
    status: 'all' | 'active' | 'completed' | 'draft' | 'archived';
  };
  kpis: {
    totalSpend: number;
    totalRevenue: number;
    averageRoi: number;
    activeCampaigns: number;
  };
  campaigns: CampaignWithMetrics[];
  creators: CreatorData[];
  platforms: PlatformData[];
  keyInsight: string;
}

const formatCurrency = (value: number): string => {
  return `€ ${Math.round(value).toLocaleString('nl-NL')}`;
};

const formatPercentage = (value: number): string => {
  return `${Math.round(value)}%`;
};

const getFilterDescription = (timeRange: string, status: string): string => {
  const timeDesc =
    timeRange === '7d' ? 'Last 7 days' :
    timeRange === '30d' ? 'Last 30 days' :
    'All time';

  const statusDesc =
    status === 'active' ? 'Active campaigns' :
    status === 'completed' ? 'Completed campaigns' :
    status === 'draft' ? 'Draft campaigns' :
    status === 'archived' ? 'Archived campaigns' :
    'All statuses';

  return `${timeDesc} • ${statusDesc}`;
};

const addHeader = (doc: jsPDF, workspace: Workspace, filterDesc: string, pageNumber: number) => {
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 14;

  if (pageNumber === 1) {
    doc.setFontSize(24);
    doc.setTextColor(0, 0, 0);
    doc.text(workspace.name, margin, 20);

    doc.setFontSize(16);
    doc.setTextColor(60, 60, 60);
    doc.text('Campaign Performance Report', margin, 30);

    doc.setFontSize(10);
    doc.setTextColor(120, 120, 120);
    const now = new Date();
    const dateStr = `Generated on ${now.toLocaleDateString('nl-NL')} ${now.toLocaleTimeString('nl-NL', { hour: '2-digit', minute: '2-digit' })}`;
    doc.text(`${dateStr} • ${filterDesc}`, margin, 37);

    doc.setDrawColor(220, 220, 220);
    doc.line(margin, 40, pageWidth - margin, 40);

    return 45;
  }

  return margin;
};

const addFooter = (doc: jsPDF, workspace: Workspace, pageNumber: number) => {
  const pageHeight = doc.internal.pageSize.getHeight();
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 14;

  doc.setFontSize(8);
  doc.setTextColor(150, 150, 150);

  const now = new Date();
  const dateStr = now.toLocaleDateString('nl-NL', { year: 'numeric', month: '2-digit', day: '2-digit' });
  const footerText = `NUUM • ${workspace.name} • Generated on ${dateStr}`;

  doc.text(footerText, margin, pageHeight - 10);
  doc.text(`Page ${pageNumber}`, pageWidth - margin - 15, pageHeight - 10);
};

const addKpiSection = (doc: jsPDF, kpis: ExportPdfOptions['kpis'], startY: number): number => {
  const margin = 14;
  const pageWidth = doc.internal.pageSize.getWidth();
  const boxWidth = (pageWidth - margin * 2 - 10) / 4;

  doc.setFontSize(14);
  doc.setTextColor(0, 0, 0);
  doc.text('Summary', margin, startY);

  let currentY = startY + 8;

  doc.setDrawColor(220, 220, 220);
  doc.setFillColor(250, 250, 250);

  const kpiData = [
    { label: 'Total Costs', value: formatCurrency(kpis.totalSpend) },
    { label: 'Total Revenue', value: formatCurrency(kpis.totalRevenue) },
    { label: 'Average ROI', value: formatPercentage(kpis.averageRoi) },
    { label: 'Active Campaigns', value: kpis.activeCampaigns.toString() },
  ];

  kpiData.forEach((kpi, index) => {
    const x = margin + (boxWidth + 2.5) * index;

    doc.roundedRect(x, currentY, boxWidth, 20, 2, 2, 'FD');

    doc.setFontSize(9);
    doc.setTextColor(100, 100, 100);
    doc.text(kpi.label, x + 3, currentY + 6);

    doc.setFontSize(12);
    doc.setTextColor(0, 0, 0);
    doc.text(kpi.value, x + 3, currentY + 15);
  });

  return currentY + 25;
};

const addKeyInsightSection = (doc: jsPDF, keyInsight: string, startY: number): number => {
  const margin = 14;
  const pageWidth = doc.internal.pageSize.getWidth();

  doc.setFontSize(14);
  doc.setTextColor(0, 0, 0);
  doc.text('Key Insight', margin, startY);

  const currentY = startY + 8;

  doc.setDrawColor(220, 220, 220);
  doc.setFillColor(255, 250, 240);
  doc.roundedRect(margin, currentY, pageWidth - margin * 2, 18, 2, 2, 'FD');

  doc.setFontSize(10);
  doc.setTextColor(60, 60, 60);

  const maxWidth = pageWidth - margin * 2 - 6;
  const lines = doc.splitTextToSize(keyInsight || 'Not enough data for this filter selection yet.', maxWidth);

  doc.text(lines, margin + 3, currentY + 6);

  return currentY + 23;
};

const addCampaignsTable = (doc: jsPDF, campaigns: CampaignWithMetrics[], startY: number): number => {
  const margin = 14;

  doc.setFontSize(14);
  doc.setTextColor(0, 0, 0);
  doc.text('Campaigns', margin, startY);

  if (campaigns.length === 0) {
    doc.setFontSize(10);
    doc.setTextColor(120, 120, 120);
    doc.text('No data available for the current filters.', margin, startY + 10);
    return startY + 20;
  }

  const tableData = campaigns.map(campaign => [
    campaign.name,
    campaign.status || 'draft',
    `${campaign.total_ad_sets} (${campaign.active_ad_sets} active)`,
    formatCurrency(campaign.total_spend),
    formatCurrency(campaign.total_revenue),
    formatPercentage(campaign.roi),
  ]);

  autoTable(doc, {
    startY: startY + 5,
    head: [['Campaign', 'Status', 'Ad Sets', 'Spend', 'Revenue', 'ROI']],
    body: tableData,
    theme: 'grid',
    headStyles: {
      fillColor: [240, 240, 240],
      textColor: [60, 60, 60],
      fontStyle: 'bold',
      fontSize: 9,
    },
    bodyStyles: {
      fontSize: 9,
      textColor: [40, 40, 40],
    },
    alternateRowStyles: {
      fillColor: [250, 250, 250],
    },
    margin: { left: margin, right: margin },
  });

  return (doc as any).lastAutoTable.finalY + 10;
};

const addCreatorsTable = (doc: jsPDF, creators: CreatorData[], startY: number): number => {
  const margin = 14;

  doc.setFontSize(14);
  doc.setTextColor(0, 0, 0);
  doc.text('Top Creators', margin, startY);

  if (creators.length === 0) {
    doc.setFontSize(10);
    doc.setTextColor(120, 120, 120);
    doc.text('No data available for the current filters.', margin, startY + 10);
    return startY + 20;
  }

  const tableData = creators.map((creator, index) => [
    `#${index + 1}`,
    creator.name,
    creator.handle,
    creator.platform,
    formatCurrency(creator.total_revenue),
  ]);

  autoTable(doc, {
    startY: startY + 5,
    head: [['Rank', 'Name', 'Handle', 'Platform', 'Revenue']],
    body: tableData,
    theme: 'grid',
    headStyles: {
      fillColor: [240, 240, 240],
      textColor: [60, 60, 60],
      fontStyle: 'bold',
      fontSize: 9,
    },
    bodyStyles: {
      fontSize: 9,
      textColor: [40, 40, 40],
    },
    alternateRowStyles: {
      fillColor: [250, 250, 250],
    },
    margin: { left: margin, right: margin },
  });

  return (doc as any).lastAutoTable.finalY + 10;
};

const addPlatformsTable = (doc: jsPDF, platforms: PlatformData[], startY: number): number => {
  const margin = 14;

  doc.setFontSize(14);
  doc.setTextColor(0, 0, 0);
  doc.text('Platform Performance', margin, startY);

  if (platforms.length === 0) {
    doc.setFontSize(10);
    doc.setTextColor(120, 120, 120);
    doc.text('No data available for the current filters.', margin, startY + 10);
    return startY + 20;
  }

  const tableData = platforms.map(platform => [
    platform.platform,
    platform.creator_count.toString(),
    formatCurrency(platform.revenue),
    formatPercentage(platform.share),
  ]);

  autoTable(doc, {
    startY: startY + 5,
    head: [['Platform', 'Creators', 'Revenue', 'Share']],
    body: tableData,
    theme: 'grid',
    headStyles: {
      fillColor: [240, 240, 240],
      textColor: [60, 60, 60],
      fontStyle: 'bold',
      fontSize: 9,
    },
    bodyStyles: {
      fontSize: 9,
      textColor: [40, 40, 40],
    },
    alternateRowStyles: {
      fillColor: [250, 250, 250],
    },
    margin: { left: margin, right: margin },
  });

  return (doc as any).lastAutoTable.finalY + 10;
};

export const exportAnalyticsPdf = (options: ExportPdfOptions): void => {
  const { workspace, filters, kpis, campaigns, creators, platforms, keyInsight } = options;

  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const filterDesc = getFilterDescription(filters.timeRange, filters.status);

  let currentY = addHeader(doc, workspace, filterDesc, 1);

  currentY = addKpiSection(doc, kpis, currentY);

  currentY = addKeyInsightSection(doc, keyInsight, currentY);

  const pageHeight = doc.internal.pageSize.getHeight();

  if (currentY > pageHeight - 60) {
    addFooter(doc, workspace, 1);
    doc.addPage();
    currentY = addHeader(doc, workspace, filterDesc, 2);
  }

  currentY = addCampaignsTable(doc, campaigns, currentY);

  if (currentY > pageHeight - 60) {
    addFooter(doc, workspace, doc.internal.pages.length - 1);
    doc.addPage();
    currentY = addHeader(doc, workspace, filterDesc, doc.internal.pages.length - 1);
  }

  currentY = addCreatorsTable(doc, creators, currentY);

  if (currentY > pageHeight - 60) {
    addFooter(doc, workspace, doc.internal.pages.length - 1);
    doc.addPage();
    currentY = addHeader(doc, workspace, filterDesc, doc.internal.pages.length - 1);
  }

  currentY = addPlatformsTable(doc, platforms, currentY);

  addFooter(doc, workspace, doc.internal.pages.length - 1);

  const now = new Date();
  const dateStr = now.toISOString().split('T')[0];
  const workspaceName = workspace.name.toLowerCase().replace(/\s+/g, '-');
  const fileName = `nuum-campaign-report-${workspaceName}-${dateStr}.pdf`;

  doc.save(fileName);
};
