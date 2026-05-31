import { buildFilename, formatCurrency, formatDate, formatDateTime, PdfDocument } from '@deliveroo/pdf-core';
import { CargoDocument, CargoEvent, CargoLocationHistory } from '../../features/cargo-management/cargo.model';
import { InventoryItem } from '../../features/inventory/inventory.model';

const LOGO_PATH = '/assets/deliveroo-pdf-logo.png';
const FOOTER_LINES = [
  'Deliveroo Logistics | ul. Logistyczna 123, 00-001 Warsaw, Poland',
  'Phone: +48 123 456 789 | Email: contact@deliveroo.pl',
];

interface CargoReportData extends InventoryItem {
  events?: CargoEvent[];
  locationHistory?: CargoLocationHistory[];
  documents?: CargoDocument[];
}

export async function generateCargoReportPDF(cargoData: CargoReportData): Promise<void> {
  const reportDate = formatDate(new Date());

  const pdf = new PdfDocument();

  await pdf.addHeader({
    title: `Cargo Report - ${cargoData.sku}`,
    subtitle: `Deliveroo Logistics — Report Date: ${reportDate}`,
    logoPath: LOGO_PATH,
  });

  pdf
    .setFooter({ lines: FOOTER_LINES })
    .addSection('Basic Information')
    .addField('SKU', cargoData.sku)
    .addField('Name', cargoData.name)
    .addField('Description', cargoData.description)
    .addField('Category', cargoData.category)
    .addField('Status', cargoData.status.toUpperCase())
    .addSection('Quantity & Storage')
    .addField('Quantity', `${cargoData.quantity} ${cargoData.unit}`)
    .addField('Location', cargoData.location)
    .addField('Zone', `${cargoData.zoneName} (Zone ID: ${cargoData.zoneId})`)
    .addField('Shelf Location', `${cargoData.shelfLocation} (Shelf ID: ${cargoData.shelfId})`)
    .addSection('Physical Attributes')
    .addField('Weight', `${cargoData.weight} kg`)
    .addField('Volume', `${cargoData.volume} m³`)
    .addField('Value', formatCurrency(cargoData.value, cargoData.currency))
    .addSection('Additional Details')
    .addField('Last Updated', formatDateTime(cargoData.lastUpdated));

  if (cargoData.batchNumber) pdf.addField('Batch Number', cargoData.batchNumber);
  if (cargoData.serialNumber) pdf.addField('Serial Number', cargoData.serialNumber);
  if (cargoData.expiryDate) pdf.addField('Expiry Date', formatDate(cargoData.expiryDate));

  if (cargoData.contractorId && cargoData.contractorName) {
    pdf
      .addSection('Contractor Information')
      .addField('Contractor Name', cargoData.contractorName)
      .addField('Contractor ID', cargoData.contractorId);
  }

  if (cargoData.events?.length) {
    pdf.addSection('Event Timeline').addTable({
      columns: [
        { header: 'Type', key: 'type', width: 30 },
        { header: 'Title', key: 'title', width: 60 },
        { header: 'Employee', key: 'employee', width: 45 },
        { header: 'Date', key: 'date' },
      ],
      rows: cargoData.events.map((e) => ({
        type: e.type.substring(0, 12),
        title: e.title.substring(0, 25),
        employee: e.employee.substring(0, 18),
        date: formatDateTime(e.timestamp),
      })),
    });
  }

  if (cargoData.locationHistory?.length) {
    pdf.addSection('Location History').addTable({
      columns: [
        { header: 'Location', key: 'location', width: 60 },
        { header: 'Details', key: 'details', width: 55 },
        { header: 'Date', key: 'date', width: 35 },
        { header: 'Duration', key: 'duration' },
      ],
      rows: cargoData.locationHistory.map((h) => ({
        location: h.location.substring(0, 20),
        details: h.details.substring(0, 18),
        date: formatDate(h.movedDate),
        duration: h.duration,
      })),
    });
  }

  if (cargoData.documents?.length) {
    pdf.addSection('Documentation').addTable({
      columns: [
        { header: 'Document Name', key: 'name', width: 90 },
        { header: 'Type', key: 'type', width: 30 },
        { header: 'Size', key: 'size', width: 25 },
        { header: 'Upload Date', key: 'date' },
      ],
      rows: cargoData.documents.map((d) => ({
        name: d.name.substring(0, 30),
        type: d.type,
        size: d.size,
        date: formatDate(d.uploadDate),
      })),
    });
  }

  pdf
    .addSection('Report Summary')
    .addField('Report Generated', formatDateTime(new Date()))
    .addField('Report Type', 'Comprehensive Cargo Report')
    .addField(
      'Notes',
      'This cargo report provides a comprehensive overview of the cargo item including its current status, ' +
        'location, physical attributes, and historical data.',
    )
    .save(buildFilename('Cargo_Report', cargoData.sku, reportDate.replace(/\s+/g, '_')));
}
