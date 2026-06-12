import { buildFilename, formatCurrency, formatDate, PdfDocument } from '@deliveroo/pdf-core';
import { Invoice } from '../../features/billing-payments/billing.model';

const LOGO_PATH = '/assets/deliveroo-pdf-logo.png';
const FOOTER_LINES = [
  'Deliveroo Logistics | ul. Logistyczna 123, 00-001 Warsaw, Poland',
  'Phone: +48 123 456 789 | Email: contact@deliveroo.pl',
];

interface InvoiceData extends Invoice {
  companyInfo?: {
    name: string;
    address: string;
    city: string;
    phone: string;
    email: string;
  };
  contractorInfo?: {
    address: string;
    city: string;
    email: string;
  };
  taxRate?: number;
  paymentTerms?: string;
  notes?: string;
}

export async function generateInvoicePDF(invoiceData: InvoiceData): Promise<void> {
  const pdf = new PdfDocument();

  await pdf.addHeader({
    title: `Invoice - ${invoiceData.invoiceNumber}`,
    subtitle: 'Deliveroo Logistics',
    logoPath: LOGO_PATH,
  });

  const company = invoiceData.companyInfo ?? {
    name: 'Warehouse Management System',
    address: '123 Industrial Blvd',
    city: 'Chicago, IL 60601',
    phone: '+1-555-0100',
    email: 'billing@wms.com',
  };

  const contractor = invoiceData.contractorInfo ?? {
    address: '123 Business Ave',
    city: 'Business City, BC 12345',
    email: `contact@${invoiceData.contractorName.toLowerCase().replace(/\s+/g, '')}.com`,
  };

  const taxRate = invoiceData.taxRate ?? 0.085;
  const subtotal = invoiceData.items.reduce((s, i) => s + i.totalPrice, 0);
  const tax = subtotal * taxRate;
  const total = subtotal + tax;

  pdf
    .setFooter({ lines: FOOTER_LINES })
    .addSection('Invoice Information')
    .addField('Invoice Number', invoiceData.invoiceNumber)
    .addField('Status', invoiceData.status.toUpperCase())
    .addField('Issue Date', formatDate(invoiceData.issueDate))
    .addField('Due Date', formatDate(invoiceData.dueDate))
    .addSection('From')
    .addField('Company', company.name)
    .addField('Address', company.address)
    .addField('City', company.city)
    .addField('Phone', company.phone)
    .addField('Email', company.email)
    .addSection('Bill To')
    .addField('Contractor', invoiceData.contractorName)
    .addField('Contractor ID', invoiceData.contractorId)
    .addField('Address', contractor.address)
    .addField('City', contractor.city)
    .addField('Email', contractor.email)
    .addSection('Invoice Items')
    .addTable({
      columns: [
        { header: 'Description', key: 'description', width: 90 },
        { header: 'Qty', key: 'quantity', width: 20, align: 'right' },
        { header: 'Unit Price', key: 'unitPrice', width: 35, align: 'right' },
        { header: 'Total', key: 'total', align: 'right' },
      ],
      rows: invoiceData.items.map((item) => ({
        description: item.description,
        quantity: item.quantity,
        unitPrice: formatCurrency(item.unitPrice),
        total: formatCurrency(item.totalPrice),
      })),
    })
    .addSection('Summary')
    .addField('Subtotal', formatCurrency(subtotal))
    .addField('Tax', `${formatCurrency(tax)} (${(taxRate * 100).toFixed(1)}%)`)
    .addField('Total Amount', formatCurrency(total))
    .addSection('Payment Information')
    .addField('Payment Terms', invoiceData.paymentTerms ?? 'Net 30 days')
    .addField('Payment Methods', 'Bank Transfer: Account #123-456-789 or Check: Payable to "WMS Inc."')
    .addSection('Notes')
    .addField(
      'Additional Information',
      invoiceData.notes ??
        'Thank you for your business! Please remit payment within 30 days. ' +
          'For questions, contact billing@wms.com.',
    )
    .save(buildFilename('Invoice', invoiceData.invoiceNumber));
}
