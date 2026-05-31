import { buildFilename, formatCurrency, PdfDocument } from '@deliveroo/pdf-core';

const LOGO_PATH = '/deliveroo-pdf-logo.png';
const FOOTER_LINES = [
  'Deliveroo Logistics | ul. Logistyczna 123, 00-001 Warsaw, Poland',
  'Phone: +48 123 456 789 | Email: contact@deliveroo.pl',
];

interface MetricsData {
  totalShipments: number;
  onTimeDelivery: number;
  totalCost: number;
  storageVolume: number;
}

interface RoutePerformanceData {
  route: string;
  shipments: number;
  onTimePercentage: number;
  avgCost: number;
  totalRevenue: number;
}

interface ReportsData {
  dateRange: { from: string; to: string };
  metrics: MetricsData;
  routePerformance: RoutePerformanceData[];
}

export async function generateReportsPDF(reportsData: ReportsData): Promise<void> {
  const { dateRange, metrics, routePerformance } = reportsData;

  const pdf = new PdfDocument();

  await pdf.addHeader({
    title: 'Logistics Report',
    subtitle: 'Deliveroo Logistics',
    logoPath: LOGO_PATH,
  });

  pdf
    .setFooter({ lines: FOOTER_LINES })
    .addSection('Report Period')
    .addField('From', dateRange.from)
    .addField('To', dateRange.to)
    .addSection('Key Metrics')
    .addField('Total Shipments', metrics.totalShipments)
    .addField('On-Time Delivery', `${metrics.onTimeDelivery}%`)
    .addField('Total Cost', formatCurrency(metrics.totalCost, 'EUR'))
    .addField('Storage Volume', `${metrics.storageVolume} m³`)
    .addSection('Route Performance')
    .addTable({
      columns: [
        { header: 'Route', key: 'route', width: 60 },
        { header: 'Shipments', key: 'shipments', width: 30 },
        { header: 'On-Time %', key: 'onTime', width: 30 },
        { header: 'Avg Cost', key: 'avgCost', width: 30 },
        { header: 'Revenue', key: 'revenue', align: 'right' },
      ],
      rows: routePerformance.map((r) => ({
        route: r.route,
        shipments: r.shipments,
        onTime: `${r.onTimePercentage}%`,
        avgCost: formatCurrency(r.avgCost, 'EUR'),
        revenue: formatCurrency(r.totalRevenue, 'EUR'),
      })),
    })
    .save(
      buildFilename(
        'Logistics_Report',
        dateRange.from.replace(/-/g, ''),
        dateRange.to.replace(/-/g, ''),
      ),
    );
}
