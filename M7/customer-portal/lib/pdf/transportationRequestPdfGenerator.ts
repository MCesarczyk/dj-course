import { buildFilename, formatCurrency, formatDate, PdfDocument } from '@deliveroo/pdf-core';

const LOGO_PATH = '/deliveroo-pdf-logo.png';
const FOOTER_LINES = [
  'Deliveroo Logistics | ul. Logistyczna 123, 00-001 Warsaw, Poland',
  'Phone: +48 123 456 789 | Email: contact@deliveroo.pl',
];

interface TransportationRequestFormData {
  serviceType: string;
  pickupLocation: {
    address: { street: string; city: string; country: string };
    contactPerson: string;
    contactPhone: string;
    contactEmail?: string;
    loadingType?: string;
  };
  deliveryLocation: {
    address: { street: string; city: string; country: string };
    contactPerson: string;
    contactPhone: string;
    contactEmail?: string;
    loadingType?: string;
  };
  cargo: {
    description: string;
    cargoType: string;
    weight: number;
    packaging: string;
    quantity: number;
    unitType: string;
    value: number;
    currency: string;
    fragile?: boolean;
    stackable?: boolean;
  };
  requestedPickupDate: string | Date;
  requestedDeliveryDate?: string | Date;
  specialInstructions?: string;
  requiresInsurance: boolean;
  requiresCustomsClearance: boolean;
  priority: string;
  currency: string;
}

interface TransportationRequestPdfOptions {
  requestNumber?: string;
  createdAt?: Date | string;
}

function titleCase(s: string): string {
  return s.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase());
}

export async function generateTransportationRequestPDF(
  formData: TransportationRequestFormData,
  options: TransportationRequestPdfOptions = {},
): Promise<void> {
  const pdf = new PdfDocument();

  await pdf.addHeader({
    title: 'Transportation Request',
    subtitle: 'Deliveroo Logistics',
    logoPath: LOGO_PATH,
  });

  pdf.setFooter({ lines: FOOTER_LINES }).addSection('Request Information');

  if (options.requestNumber) pdf.addField('Request Number', options.requestNumber);
  if (options.createdAt) pdf.addField('Created At', formatDate(options.createdAt));

  pdf
    .addField('Service Type', titleCase(formData.serviceType))
    .addField('Priority', titleCase(formData.priority))
    .addSection('Pickup Location')
    .addField(
      'Address',
      `${formData.pickupLocation.address.street}, ${formData.pickupLocation.address.city}, ${formData.pickupLocation.address.country}`,
    )
    .addField('Contact Person', formData.pickupLocation.contactPerson)
    .addField('Phone', formData.pickupLocation.contactPhone)
    .addField('Requested Pickup Date', formatDate(formData.requestedPickupDate));

  if (formData.pickupLocation.contactEmail) pdf.addField('Email', formData.pickupLocation.contactEmail);
  if (formData.pickupLocation.loadingType) pdf.addField('Loading Type', titleCase(formData.pickupLocation.loadingType));

  pdf
    .addSection('Delivery Location')
    .addField(
      'Address',
      `${formData.deliveryLocation.address.street}, ${formData.deliveryLocation.address.city}, ${formData.deliveryLocation.address.country}`,
    )
    .addField('Contact Person', formData.deliveryLocation.contactPerson)
    .addField('Phone', formData.deliveryLocation.contactPhone);

  if (formData.requestedDeliveryDate) pdf.addField('Requested Delivery Date', formatDate(formData.requestedDeliveryDate));
  if (formData.deliveryLocation.contactEmail) pdf.addField('Email', formData.deliveryLocation.contactEmail);
  if (formData.deliveryLocation.loadingType) pdf.addField('Unloading Type', titleCase(formData.deliveryLocation.loadingType));

  pdf
    .addSection('Cargo Information')
    .addField('Description', formData.cargo.description)
    .addField('Cargo Type', titleCase(formData.cargo.cargoType))
    .addField('Weight', `${formData.cargo.weight} kg`)
    .addField('Packaging', titleCase(formData.cargo.packaging))
    .addField('Quantity', `${formData.cargo.quantity} ${formData.cargo.unitType}`);

  if (formData.cargo.value > 0) pdf.addField('Estimated Value', formatCurrency(formData.cargo.value, formData.cargo.currency || 'EUR'));
  if (formData.cargo.fragile !== undefined) pdf.addField('Fragile', formData.cargo.fragile ? 'Yes' : 'No');
  if (formData.cargo.stackable !== undefined) pdf.addField('Stackable', formData.cargo.stackable ? 'Yes' : 'No');

  pdf
    .addSection('Service Requirements')
    .addField('Requires Insurance', formData.requiresInsurance ? 'Yes' : 'No')
    .addField('Requires Customs Clearance', formData.requiresCustomsClearance ? 'Yes' : 'No');

  if (formData.specialInstructions) pdf.addField('Special Instructions', formData.specialInstructions);

  const filename = options.requestNumber
    ? buildFilename('Transportation_Request', options.requestNumber)
    : buildFilename('Transportation_Request', new Date().toISOString().split('T')[0]);

  pdf.save(filename);
}
