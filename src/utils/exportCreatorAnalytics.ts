import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

export interface CreatorExportParams {
  workspaceName: string;
  creatorName: string;
  creatorHandle?: string;
  generatedAt: Date;
  timeFilterLabel: string;
  statusFilterLabel: string;
  summary: {
    totalSpend: number;
    totalRevenue: number;
    avgRoi: number;
    activeCampaigns: number;
  };
  campaigns: Array<{
    name: string;
    status: string;
    adSets: number;
    spend: number;
    revenue: number;
    roi: number;
  }>;
  topCreatorRow?: {
    rank: number;
    name: string;
    handle?: string;
    platform?: string;
    revenue: number;
  };
  platforms: Array<{
    platform: string;
    creators: number;
    revenue: number;
    share: number;
  }>;
}

const formatCurrency = (value: number): string => {
  return `€ ${Math.round(value).toLocaleString('nl-NL')}`;
};

const formatPercentage = (value: number): string => {
  return `${Math.round(value)}%`;
};

const addHeader = (doc: jsPDF, workspaceName: string, creatorName: string, filterDesc: string, generatedDate: string, pageNumber: number): number => {
  const margin = 14;

  if (pageNumber === 1) {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(18);
    doc.setTextColor(28, 28, 28);
    doc.text(workspaceName, margin, 20);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(13);
    doc.setTextColor(28, 28, 28);
    doc.text('Creator Performance Report', margin, 28);

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

const addFooter = (doc: jsPDF, workspaceName: string, generatedDate: string) => {
  const pageHeight = doc.internal.pageSize.getHeight();
  const pageWidth = doc.internal.pageSize.getWidth();

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(136, 136, 136);

  const footerText = `NUUM • ${workspaceName} • Generated on ${generatedDate}`;
  const textWidth = doc.getTextWidth(footerText);
  const x = (pageWidth - textWidth) / 2;

  doc.text(footerText, x, pageHeight - 10);
};

const addKpiSection = (doc: jsPDF, summary: CreatorExportParams['summary'], startY: number): number => {
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
    { label: 'TOTAL SPEND', value: formatCurrency(summary.totalSpend) },
    { label: 'TOTAL REVENUE', value: formatCurrency(summary.totalRevenue) },
    { label: 'AVERAGE ROI', value: formatPercentage(summary.avgRoi) },
    { label: 'ACTIVE CAMPAIGNS', value: summary.activeCampaigns.toString() },
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
  const lines = doc.splitTextToSize(keyInsight || 'Not enough data for this creator yet.', maxWidth);

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

const addCampaignsTable = (doc: jsPDF, campaigns: CreatorExportParams['campaigns'], startY: number): number => {
  const margin = 14;

  const tableStartY = addSectionTitle(doc, 'Campaigns', startY, margin);

  if (campaigns.length === 0) {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.setTextColor(120, 120, 120);
    doc.text('No campaign data available.', margin, tableStartY + 5);
    return tableStartY + 15;
  }

  const tableData = campaigns.map(campaign => [
    campaign.name,
    campaign.status || 'draft',
    campaign.adSets.toString(),
    formatCurrency(campaign.spend),
    formatCurrency(campaign.revenue),
    formatPercentage(campaign.roi),
  ]);

  const totalSpend = campaigns.reduce((sum, c) => sum + c.spend, 0);
  const totalRevenue = campaigns.reduce((sum, c) => sum + c.revenue, 0);
  const totalRoi = totalSpend > 0 ? ((totalRevenue - totalSpend) / totalSpend) * 100 : 0;

  tableData.push([
    'Total',
    '',
    '',
    formatCurrency(totalSpend),
    formatCurrency(totalRevenue),
    formatPercentage(totalRoi),
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
    didParseCell: (data) => {
      if (data.row.index === tableData.length - 1) {
        data.cell.styles.fontStyle = 'bold';
        data.cell.styles.fillColor = [244, 245, 247];
      }
    },
    margin: { left: margin, right: margin },
  });

  return (doc as any).lastAutoTable.finalY + 12;
};

const addCreatorTable = (doc: jsPDF, topCreatorRow: CreatorExportParams['topCreatorRow'], startY: number): number => {
  const margin = 14;

  const tableStartY = addSectionTitle(doc, 'Creator', startY, margin);

  if (!topCreatorRow) {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.setTextColor(120, 120, 120);
    doc.text('No creator data available.', margin, tableStartY + 5);
    return tableStartY + 15;
  }

  const tableData = [[
    `#${topCreatorRow.rank}`,
    topCreatorRow.name,
    topCreatorRow.handle || 'N/A',
    topCreatorRow.platform || 'N/A',
    formatCurrency(topCreatorRow.revenue),
  ]];

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
    styles: {
      lineColor: [234, 234, 234],
      lineWidth: 0.1,
      cellPadding: 4,
    },
    margin: { left: margin, right: margin },
  });

  return (doc as any).lastAutoTable.finalY + 12;
};

const addPlatformsTable = (doc: jsPDF, platforms: CreatorExportParams['platforms'], startY: number): number => {
  const margin = 14;

  const tableStartY = addSectionTitle(doc, 'Platform Performance', startY, margin);

  if (platforms.length === 0) {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.setTextColor(120, 120, 120);
    doc.text('No platform data available.', margin, tableStartY + 5);
    return tableStartY + 15;
  }

  const tableData = platforms.map(platform => [
    platform.platform,
    platform.creators.toString(),
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

export const exportCreatorPerformancePdf = (params: CreatorExportParams): void => {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const now = params.generatedAt;
  const generatedDate = `Generated on ${now.toLocaleDateString('nl-NL', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  })} ${now.toLocaleTimeString('nl-NL', {
    hour: '2-digit',
    minute: '2-digit'
  })} • ${params.timeFilterLabel} • ${params.statusFilterLabel}`;

  const footerDate = now.toLocaleDateString('nl-NL', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  });

  const pageHeight = doc.internal.pageSize.getHeight();

  const creatorDisplay = params.creatorHandle
    ? `${params.creatorName} (@${params.creatorHandle})`
    : params.creatorName;

  const keyInsight = params.campaigns.length > 0
    ? `Creator ${params.creatorName} generated ${formatCurrency(params.summary.totalRevenue)} in revenue with an average ROI of ${Math.round(params.summary.avgRoi)}%. ${
        params.campaigns[0] ? `Top campaign: ${params.campaigns[0].name} (ROI ${formatPercentage(params.campaigns[0].roi)}).` : ''
      }`
    : `No campaign data available for ${params.creatorName} yet.`;

  let currentY = addHeader(doc, params.workspaceName, creatorDisplay, `${params.timeFilterLabel} • ${params.statusFilterLabel}`, generatedDate, 1);

  currentY = addKpiSection(doc, params.summary, currentY);

  currentY = addKeyInsightSection(doc, keyInsight, currentY);

  if (currentY > pageHeight - 60) {
    addFooter(doc, params.workspaceName, footerDate);
    doc.addPage();
    currentY = addHeader(doc, params.workspaceName, creatorDisplay, `${params.timeFilterLabel} • ${params.statusFilterLabel}`, generatedDate, 2);
  }

  currentY = addCampaignsTable(doc, params.campaigns, currentY);

  if (currentY > pageHeight - 60) {
    addFooter(doc, params.workspaceName, footerDate);
    doc.addPage();
    currentY = addHeader(doc, params.workspaceName, creatorDisplay, `${params.timeFilterLabel} • ${params.statusFilterLabel}`, generatedDate, doc.internal.pages.length - 1);
  }

  currentY = addCreatorTable(doc, params.topCreatorRow, currentY);

  if (currentY > pageHeight - 60) {
    addFooter(doc, params.workspaceName, footerDate);
    doc.addPage();
    currentY = addHeader(doc, params.workspaceName, creatorDisplay, `${params.timeFilterLabel} • ${params.statusFilterLabel}`, generatedDate, doc.internal.pages.length - 1);
  }

  currentY = addPlatformsTable(doc, params.platforms, currentY);

  addFooter(doc, params.workspaceName, footerDate);

  const dateStr = now.toISOString().split('T')[0];
  const creatorSlug = params.creatorName.toLowerCase().replace(/\s+/g, '-');
  const fileName = `nuum-creator-report-${creatorSlug}-${dateStr}.pdf`;

  doc.save(fileName);
};

export const exportCreatorPerformanceCsv = (params: CreatorExportParams): void => {
  const rows: string[][] = [];

  rows.push(['Creator Performance Report']);
  rows.push(['Creator', params.creatorName]);
  if (params.creatorHandle) {
    rows.push(['Handle', params.creatorHandle]);
  }
  rows.push(['Workspace', params.workspaceName]);
  rows.push(['Generated', params.generatedAt.toLocaleString('nl-NL')]);
  rows.push(['Time Filter', params.timeFilterLabel]);
  rows.push(['Status Filter', params.statusFilterLabel]);
  rows.push([]);

  rows.push(['Summary']);
  rows.push(['Total Spend', formatCurrency(params.summary.totalSpend)]);
  rows.push(['Total Revenue', formatCurrency(params.summary.totalRevenue)]);
  rows.push(['Average ROI', formatPercentage(params.summary.avgRoi)]);
  rows.push(['Active Campaigns', params.summary.activeCampaigns.toString()]);
  rows.push([]);

  rows.push(['Campaign', 'Status', 'Ad Sets', 'Spend (€)', 'Revenue (€)', 'ROI (%)']);
  params.campaigns.forEach(campaign => {
    rows.push([
      campaign.name,
      campaign.status,
      campaign.adSets.toString(),
      campaign.spend.toFixed(2),
      campaign.revenue.toFixed(2),
      campaign.roi.toFixed(2),
    ]);
  });
  rows.push([]);

  if (params.platforms.length > 0) {
    rows.push(['Platform Performance']);
    rows.push(['Platform', 'Creators', 'Revenue (€)', 'Share (%)']);
    params.platforms.forEach(platform => {
      rows.push([
        platform.platform,
        platform.creators.toString(),
        platform.revenue.toFixed(2),
        platform.share.toFixed(2),
      ]);
    });
  }

  const csvContent = rows.map(row =>
    row.map(cell => {
      const cellStr = cell.toString();
      if (cellStr.includes(',') || cellStr.includes('"') || cellStr.includes('\n')) {
        return `"${cellStr.replace(/"/g, '""')}"`;
      }
      return cellStr;
    }).join(',')
  ).join('\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;

  const dateStr = params.generatedAt.toISOString().split('T')[0];
  const creatorSlug = params.creatorName.toLowerCase().replace(/\s+/g, '-');
  link.download = `nuum-creator-report-${creatorSlug}-${dateStr}.csv`;

  link.click();
  URL.revokeObjectURL(url);
};
