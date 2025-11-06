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

const addHeader = (doc: jsPDF, workspace: Workspace, filterDesc: string, generatedDate: string, pageNumber: number): number => {
  const margin = 14;

  if (pageNumber === 1) {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(18);
    doc.setTextColor(28, 28, 28);
    doc.text(workspace.name, margin, 20);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(13);
    doc.setTextColor(28, 28, 28);
    doc.text('Campaign Performance Report', margin, 28);

    doc.setFontSize(9);
    doc.setTextColor(102, 102, 102);
    doc.text(generatedDate, margin, 34);

    doc.setDrawColor(234, 234, 234);
    doc.setLineWidth(0.5);
    const pageWidth = doc.internal.pageSize.getWidth();
    doc.line(margin, 38, pageWidth - margin, 38);

    return 45;
  }

  return margin;
};

const addFooter = (doc: jsPDF, workspace: Workspace, generatedDate: string) => {
  const pageHeight = doc.internal.pageSize.getHeight();
  const pageWidth = doc.internal.pageSize.getWidth();

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(136, 136, 136);

  const footerText = `NUUM • ${workspace.name} • Generated on ${generatedDate}`;
  const textWidth = doc.getTextWidth(footerText);
  const x = (pageWidth - textWidth) / 2;

  doc.text(footerText, x, pageHeight - 10);
};

const addKpiSection = (doc: jsPDF, kpis: ExportPdfOptions['kpis'], startY: number): number => {
  const margin = 14;
  const pageWidth = doc.internal.pageSize.getWidth();

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.setTextColor(28, 28, 28);
  doc.text('Summary', margin, startY);

  doc.setDrawColor(42, 83, 208);
  doc.setLineWidth(0.5);
  doc.line(margin, startY + 1, margin + 22, startY + 1);

  let currentY = startY + 8;

  const boxWidth = (pageWidth - margin * 2 - 7.5) / 4;
  const boxHeight = 22;

  const kpiData = [
    { label: 'TOTAL COSTS', value: formatCurrency(kpis.totalSpend) },
    { label: 'TOTAL REVENUE', value: formatCurrency(kpis.totalRevenue) },
    { label: 'AVERAGE ROI', value: formatPercentage(kpis.averageRoi) },
    { label: 'ACTIVE CAMPAIGNS', value: kpis.activeCampaigns.toString() },
  ];

  doc.setDrawColor(234, 234, 234);
  doc.setLineWidth(0.3);

  kpiData.forEach((kpi, index) => {
    const x = margin + (boxWidth + 2.5) * index;

    doc.setFillColor(255, 255, 255);
    doc.roundedRect(x, currentY, boxWidth, boxHeight, 2, 2, 'FD');

    doc.setDrawColor(234, 234, 234);
    doc.setLineWidth(0.3);
    doc.roundedRect(x, currentY, boxWidth, boxHeight, 2, 2, 'S');

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    doc.setTextColor(136, 136, 136);
    doc.text(kpi.label, x + 4, currentY + 7);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(14);
    doc.setTextColor(28, 28, 28);
    doc.text(kpi.value, x + 4, currentY + 16);
  });

  return currentY + boxHeight + 12;
};

const addKeyInsightSection = (doc: jsPDF, keyInsight: string, startY: number): number => {
  const margin = 14;
  const pageWidth = doc.internal.pageSize.getWidth();

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.setTextColor(28, 28, 28);
  doc.text('Key Insight', margin, startY);

  doc.setDrawColor(42, 83, 208);
  doc.setLineWidth(0.5);
  doc.line(margin, startY + 1, margin + 24, startY + 1);

  const currentY = startY + 8;

  doc.setFillColor(248, 249, 251);
  const boxHeight = 18;
  doc.roundedRect(margin, currentY, pageWidth - margin * 2, boxHeight, 2, 2, 'F');

  doc.setDrawColor(42, 83, 208);
  doc.setLineWidth(1);
  doc.line(margin, currentY, margin, currentY + boxHeight);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.setTextColor(28, 28, 28);

  const maxWidth = pageWidth - margin * 2 - 10;
  const lines = doc.splitTextToSize(keyInsight || 'Not enough data for this filter selection yet.', maxWidth);

  doc.text(lines, margin + 6, currentY + 7);

  return currentY + boxHeight + 12;
};

const addSectionTitle = (doc: jsPDF, title: string, y: number, margin: number): number => {
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.setTextColor(28, 28, 28);
  doc.text(title, margin, y);

  doc.setDrawColor(42, 83, 208);
  doc.setLineWidth(0.5);
  const titleWidth = doc.getTextWidth(title);
  doc.line(margin, y + 1, margin + titleWidth, y + 1);

  return y + 6;
};

const addCampaignsTable = (doc: jsPDF, campaigns: CampaignWithMetrics[], startY: number): number => {
  const margin = 14;

  const tableStartY = addSectionTitle(doc, 'Campaigns', startY, margin);

  if (campaigns.length === 0) {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.setTextColor(120, 120, 120);
    doc.text('No data available for the current filters.', margin, tableStartY + 5);
    return tableStartY + 15;
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
    startY: tableStartY,
    head: [['Campaign', 'Status', 'Ad Sets', 'Spend', 'Revenue', 'ROI']],
    body: tableData,
    theme: 'grid',
    headStyles: {
      fillColor: [244, 245, 247],
      textColor: [28, 28, 28],
      fontStyle: 'bold',
      fontSize: 9,
      halign: 'left',
    },
    bodyStyles: {
      fillColor: [255, 255, 255],
      textColor: [28, 28, 28],
      fontSize: 9,
      halign: 'left',
    },
    alternateRowStyles: {
      fillColor: [250, 250, 250],
    },
    styles: {
      lineColor: [234, 234, 234],
      lineWidth: 0.1,
      cellPadding: 4,
    },
    margin: { left: margin, right: margin },
  });

  return (doc as any).lastAutoTable.finalY + 12;
};

const addCreatorsTable = (doc: jsPDF, creators: CreatorData[], startY: number): number => {
  const margin = 14;

  const tableStartY = addSectionTitle(doc, 'Top Creators', startY, margin);

  if (creators.length === 0) {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.setTextColor(120, 120, 120);
    doc.text('No data available for the current filters.', margin, tableStartY + 5);
    return tableStartY + 15;
  }

  const tableData = creators.map((creator, index) => [
    `#${index + 1}`,
    creator.name,
    creator.handle,
    creator.platform,
    formatCurrency(creator.total_revenue),
  ]);

  autoTable(doc, {
    startY: tableStartY,
    head: [['Rank', 'Name', 'Handle', 'Platform', 'Revenue']],
    body: tableData,
    theme: 'grid',
    headStyles: {
      fillColor: [244, 245, 247],
      textColor: [28, 28, 28],
      fontStyle: 'bold',
      fontSize: 9,
      halign: 'left',
    },
    bodyStyles: {
      fillColor: [255, 255, 255],
      textColor: [28, 28, 28],
      fontSize: 9,
      halign: 'left',
    },
    alternateRowStyles: {
      fillColor: [250, 250, 250],
    },
    styles: {
      lineColor: [234, 234, 234],
      lineWidth: 0.1,
      cellPadding: 4,
    },
    margin: { left: margin, right: margin },
  });

  return (doc as any).lastAutoTable.finalY + 12;
};

const addPlatformsTable = (doc: jsPDF, platforms: PlatformData[], startY: number): number => {
  const margin = 14;

  const tableStartY = addSectionTitle(doc, 'Platform Performance', startY, margin);

  if (platforms.length === 0) {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.setTextColor(120, 120, 120);
    doc.text('No data available for the current filters.', margin, tableStartY + 5);
    return tableStartY + 15;
  }

  const tableData = platforms.map(platform => [
    platform.platform,
    platform.creator_count.toString(),
    formatCurrency(platform.revenue),
    formatPercentage(platform.share),
  ]);

  autoTable(doc, {
    startY: tableStartY,
    head: [['Platform', 'Creators', 'Revenue', 'Share']],
    body: tableData,
    theme: 'grid',
    headStyles: {
      fillColor: [244, 245, 247],
      textColor: [28, 28, 28],
      fontStyle: 'bold',
      fontSize: 9,
      halign: 'left',
    },
    bodyStyles: {
      fillColor: [255, 255, 255],
      textColor: [28, 28, 28],
      fontSize: 9,
      halign: 'left',
    },
    alternateRowStyles: {
      fillColor: [250, 250, 250],
    },
    styles: {
      lineColor: [234, 234, 234],
      lineWidth: 0.1,
      cellPadding: 4,
    },
    margin: { left: margin, right: margin },
  });

  return (doc as any).lastAutoTable.finalY + 12;
};

export const exportAnalyticsPdf = (options: ExportPdfOptions): void => {
  const { workspace, filters, kpis, campaigns, creators, platforms, keyInsight } = options;

  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const filterDesc = getFilterDescription(filters.timeRange, filters.status);
  const now = new Date();
  const generatedDate = `Generated on ${now.toLocaleDateString('nl-NL', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  })} ${now.toLocaleTimeString('nl-NL', {
    hour: '2-digit',
    minute: '2-digit'
  })} • ${filterDesc}`;
  const footerDate = now.toLocaleDateString('nl-NL', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  });

  const pageHeight = doc.internal.pageSize.getHeight();

  let currentY = addHeader(doc, workspace, filterDesc, generatedDate, 1);

  currentY = addKpiSection(doc, kpis, currentY);

  currentY = addKeyInsightSection(doc, keyInsight, currentY);

  if (currentY > pageHeight - 60) {
    addFooter(doc, workspace, footerDate);
    doc.addPage();
    currentY = addHeader(doc, workspace, filterDesc, generatedDate, 2);
  }

  currentY = addCampaignsTable(doc, campaigns, currentY);

  if (currentY > pageHeight - 60) {
    addFooter(doc, workspace, footerDate);
    doc.addPage();
    currentY = addHeader(doc, workspace, filterDesc, generatedDate, doc.internal.pages.length - 1);
  }

  currentY = addCreatorsTable(doc, creators, currentY);

  if (currentY > pageHeight - 60) {
    addFooter(doc, workspace, footerDate);
    doc.addPage();
    currentY = addHeader(doc, workspace, filterDesc, generatedDate, doc.internal.pages.length - 1);
  }

  currentY = addPlatformsTable(doc, platforms, currentY);

  addFooter(doc, workspace, footerDate);

  const dateStr = now.toISOString().split('T')[0];
  const workspaceName = workspace.name.toLowerCase().replace(/\s+/g, '-');
  const fileName = `nuum-campaign-report-${workspaceName}-${dateStr}.pdf`;

  doc.save(fileName);
};
