import { buildFilename, formatCurrency, formatDate, PdfDocument } from '@deliveroo/pdf-core';
import { BillingOverview, Invoice } from '../../features/billing-payments/billing.model';

const LOGO_PATH = '/assets/deliveroo-pdf-logo.png';
const FOOTER_LINES = [
  'Deliveroo Logistics | ul. Logistyczna 123, 00-001 Warsaw, Poland',
  'Phone: +48 123 456 789 | Email: contact@deliveroo.pl',
];

interface FinancialReportData {
  overview: BillingOverview;
  invoices: Invoice[];
  reportPeriod?: string;
}

export async function generateFinancialReportPDF(data: FinancialReportData): Promise<void> {
  const reportPeriod = data.reportPeriod ?? `As of ${formatDate(new Date())}`;
  const today = formatDate(new Date());

  const pdf = new PdfDocument();

  await pdf.addHeader({
    title: 'Financial Report',
    subtitle: `Deliveroo Logistics — ${reportPeriod}`,
    logoPath: LOGO_PATH,
  });

  pdf
    .setFooter({ lines: FOOTER_LINES })
    .addSection('Revenue Summary')
    .addField('Total Revenue', formatCurrency(data.overview.totalRevenue))
    .addField('Total Invoices', data.overview.totalInvoices)
    .addField('Paid Invoices', data.overview.paidInvoices)
    .addField('Overdue Invoices', data.overview.overdueInvoices)
    .addField('Average Invoice Value', formatCurrency(data.overview.averageInvoiceValue))
    .addSection('Payment Status')
    .addField('Pending Amount', formatCurrency(data.overview.pendingAmount))
    .addField('Overdue Amount', formatCurrency(data.overview.overdueAmount))
    .addField('Collection Rate', `${data.overview.collectionRate.toFixed(1)}%`);

  // Top contractors by revenue
  const contractorRevenue = new Map<string, { name: string; total: number; count: number }>();
  data.invoices.forEach((inv) => {
    const existing = contractorRevenue.get(inv.contractorId) ?? { name: inv.contractorName, total: 0, count: 0 };
    existing.total += inv.amount;
    existing.count += 1;
    contractorRevenue.set(inv.contractorId, existing);
  });

  const topContractors = Array.from(contractorRevenue.values())
    .sort((a, b) => b.total - a.total)
    .slice(0, 5);

  if (topContractors.length > 0) {
    pdf.addSection('Top 5 Contractors by Revenue').addTable({
      columns: [
        { header: 'Contractor', key: 'name', width: 90 },
        { header: 'Invoices', key: 'count', width: 30 },
        { header: 'Total Revenue', key: 'total', align: 'right' },
      ],
      rows: topContractors.map((c) => ({
        name: c.name,
        count: c.count,
        total: formatCurrency(c.total),
      })),
    });
  }

  const recentInvoices = [...data.invoices]
    .sort((a, b) => new Date(b.issueDate).getTime() - new Date(a.issueDate).getTime())
    .slice(0, 10);

  if (recentInvoices.length > 0) {
    pdf.addSection('Recent Invoices (Last 10)').addTable({
      columns: [
        { header: 'Invoice #', key: 'number', width: 35 },
        { header: 'Contractor', key: 'contractor', width: 55 },
        { header: 'Date', key: 'date', width: 35 },
        { header: 'Status', key: 'status', width: 35 },
        { header: 'Amount', key: 'amount', align: 'right' },
      ],
      rows: recentInvoices.map((inv) => ({
        number: inv.invoiceNumber,
        contractor: inv.contractorName.substring(0, 15),
        date: formatDate(inv.issueDate),
        status: inv.status.toUpperCase(),
        amount: formatCurrency(inv.amount),
      })),
    });
  }

  pdf
    .addSection('Report Summary')
    .addField('Report Generated', today)
    .addField('Total Accounts', contractorRevenue.size)
    .addField(
      'Notes',
      'This financial report provides a comprehensive overview of billing and payment activities. ' +
        'For detailed invoice information, please refer to individual invoice documents.',
    )
    .save(buildFilename('Financial_Report', today.replace(/\s+/g, '_')));
}
