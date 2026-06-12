import { buildFilename, PdfDocument } from '@deliveroo/pdf-core';

const LOGO_PATH = '/deliveroo-pdf-logo.png';
const FOOTER_LINES = [
  'Deliveroo Logistics | ul. Logistyczna 123, 00-001 Warsaw, Poland',
  'Phone: +48 123 456 789 | Email: contact@deliveroo.pl',
];

interface PaymentReceiptData {
  id: string | number;
  amount: string | number;
  status: string;
  method: string;
  invoice?: string;
  date: string;
}

export async function generateReceiptPDF(payment: PaymentReceiptData): Promise<void> {
  const pdf = new PdfDocument();

  await pdf.addHeader({
    title: 'Payment Receipt',
    subtitle: 'Deliveroo Logistics',
    logoPath: LOGO_PATH,
  });

  pdf
    .setFooter({ lines: FOOTER_LINES })
    .addSection('Payment Details')
    .addField('Payment ID', payment.id)
    .addField('Amount', payment.amount)
    .addField('Status', payment.status)
    .addField('Method', payment.method)
    .addField('Invoice', payment.invoice)
    .addField('Date', payment.date)
    .save(buildFilename('Receipt', payment.id));
}
