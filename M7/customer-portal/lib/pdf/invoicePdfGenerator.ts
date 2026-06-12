import { buildFilename, formatCurrency, formatDate, PdfDocument } from '@deliveroo/pdf-core';

const LOGO_PATH = '/deliveroo-pdf-logo.png';
const FOOTER_LINES = [
  'Deliveroo Logistics | ul. Logistyczna 123, 00-001 Warsaw, Poland',
  'Phone: +48 123 456 789 | Email: contact@deliveroo.pl',
];

interface InvoiceData {
  id: string;
  number: string;
  description: string;
  date: Date;
  amount: number;
  status: 'Paid' | 'Unpaid' | 'Overdue';
  dueDate: Date;
}

export async function generateInvoicePDF(invoice: InvoiceData): Promise<void> {
  const pdf = new PdfDocument();

  await pdf.addHeader({
    title: 'Invoice',
    subtitle: 'Deliveroo Logistics',
    logoPath: LOGO_PATH,
  });

  pdf
    .setFooter({ lines: FOOTER_LINES })
    .addSection('Invoice Details')
    .addField('Invoice Number', invoice.number)
    .addField('Invoice ID', invoice.id)
    .addField('Description', invoice.description)
    .addField('Amount', formatCurrency(invoice.amount))
    .addField('Status', invoice.status)
    .addField('Invoice Date', formatDate(invoice.date))
    .addField('Due Date', formatDate(invoice.dueDate))
    .save(buildFilename('Invoice', invoice.number));
}
