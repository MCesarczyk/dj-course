import jsPDF from 'jspdf';
import { buildFilename, PdfDocument } from '@deliveroo/pdf-core';

const LOGO_PATH = '/deliveroo-pdf-logo.png';
const FOOTER_LINES = [
  'Deliveroo Logistics | ul. Logistyczna 123, 00-001 Warsaw, Poland',
  'Phone: +48 123 456 789 | Email: contact@deliveroo.pl',
];

export interface TrackingEvent {
  id: number | string;
  status: string;
  location: string;
  timestamp: string;
  description: string;
}

export interface ShipmentInfo {
  id: string | number;
  origin: string;
  destination: string;
  driver: string;
  eta?: string;
  status?: string;
}

export async function generateShipmentRoutePDF(
  shipment: ShipmentInfo,
  events: TrackingEvent[],
): Promise<void> {
  const pdf = new PdfDocument();

  await pdf.addHeader({
    title: `Shipment Route - #${shipment.id}`,
    subtitle: 'Deliveroo Logistics',
    logoPath: LOGO_PATH,
  });

  pdf
    .setFooter({ lines: FOOTER_LINES })
    .addSection('Route Overview')
    .addField('From', shipment.origin)
    .addField('To', shipment.destination)
    .addField('Driver', shipment.driver);

  if (shipment.eta) pdf.addField('ETA', shipment.eta);
  if (shipment.status) pdf.addField('Status', shipment.status);

  pdf.addSection('Timeline');

  // Timeline events use custom SVG circles — rendered via addCustom
  events.forEach((event, index) => {
    const isLast = index === events.length - 1;
    pdf.addCustom((doc: jsPDF, yPos: number, marginLeft: number) => {
      if (yPos > doc.internal.pageSize.height - 40) {
        doc.addPage();
        yPos = 20;
      }
      const fillColor: [number, number, number] = isLast ? [33, 150, 243] : [34, 197, 94];
      doc.setFillColor(...fillColor);
      doc.circle(marginLeft + 5, yPos, 2, 'F');
      doc.setFontSize(10);
      doc.setFont('helvetica', 'bold');
      doc.text(event.status, marginLeft + 10, yPos);
      doc.setFont('helvetica', 'normal');
      doc.text(event.timestamp, 140, yPos);
      yPos += 4;
      doc.setFontSize(9);
      doc.text(event.location, marginLeft + 10, yPos);
      yPos += 4;
      doc.setTextColor(100, 100, 100);
      doc.text(event.description, marginLeft + 10, yPos);
      doc.setTextColor(0, 0, 0);
      return yPos + 10;
    });
  });

  pdf.save(buildFilename('Shipment', shipment.id, 'Route'));
}
