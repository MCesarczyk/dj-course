import { buildFilename, formatCurrency, formatDate, PdfDocument } from '@deliveroo/pdf-core';

const LOGO_PATH = '/deliveroo-pdf-logo.png';
const FOOTER_LINES = [
  'Deliveroo Logistics | ul. Logistyczna 123, 00-001 Warsaw, Poland',
  'Phone: +48 123 456 789 | Email: contact@deliveroo.pl',
];

interface WarehousingRequestFormData {
  storageType: string;
  securityLevel: string;
  estimatedVolume: number;
  estimatedWeight: number;
  estimatedStorageDuration: { value: number; unit: 'days' | 'weeks' | 'months' | 'years' };
  plannedStartDate: string | Date;
  plannedEndDate?: string | Date;
  handlingServices: string[];
  valueAddedServices: string[];
  requiresTemperatureControl: boolean;
  requiresHumidityControl: boolean;
  requiresSpecialHandling: boolean;
  specialInstructions?: string;
  billingType: string;
  cargo: {
    description: string;
    cargoType: string;
    packaging: string;
    quantity: number;
    unitType: string;
    value: number;
    currency: string;
  };
  priority: string;
}

interface WarehousingRequestPdfOptions {
  requestNumber?: string;
  createdAt?: Date | string;
  storageLocation?: string;
}

function titleCase(s: string): string {
  return s.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase());
}

export async function generateWarehousingRequestPDF(
  formData: WarehousingRequestFormData,
  options: WarehousingRequestPdfOptions = {},
): Promise<void> {
  const pdf = new PdfDocument();

  await pdf.addHeader({
    title: 'Warehousing Request',
    subtitle: 'Deliveroo Logistics',
    logoPath: LOGO_PATH,
  });

  pdf.setFooter({ lines: FOOTER_LINES }).addSection('Request Information');

  if (options.requestNumber) pdf.addField('Request Number', options.requestNumber);
  if (options.createdAt) pdf.addField('Created At', formatDate(options.createdAt));

  pdf.addField('Storage Type', titleCase(formData.storageType)).addField('Priority', titleCase(formData.priority));

  pdf
    .addSection('Storage Information')
    .addField('Estimated Volume', `${formData.estimatedVolume} m³`)
    .addField('Estimated Weight', `${formData.estimatedWeight} kg`)
    .addField('Security Level', formData.securityLevel ? titleCase(formData.securityLevel) : 'Not specified')
    .addField('Planned Start Date', formatDate(formData.plannedStartDate));

  if (formData.plannedEndDate) pdf.addField('Planned End Date', formatDate(formData.plannedEndDate));
  if (options.storageLocation) pdf.addField('Storage Location', options.storageLocation);

  pdf
    .addField(
      'Storage Duration',
      `${formData.estimatedStorageDuration.value} ${formData.estimatedStorageDuration.unit}`,
    )
    .addField('Billing Type', formData.billingType ? titleCase(formData.billingType) : 'Not specified');

  pdf
    .addSection('Cargo Information')
    .addField('Description', formData.cargo?.description ?? 'No description provided')
    .addField('Cargo Type', formData.cargo?.cargoType ? titleCase(formData.cargo.cargoType) : 'Not specified')
    .addField('Packaging', formData.cargo?.packaging ? titleCase(formData.cargo.packaging) : 'Not specified')
    .addField('Quantity', `${formData.cargo?.quantity ?? 0} ${formData.cargo?.unitType ?? ''}`);

  if (formData.cargo?.value > 0) {
    pdf.addField('Estimated Value', formatCurrency(formData.cargo.value, formData.cargo.currency || 'EUR'));
  }

  pdf.addSection('Service Requirements');

  if (formData.handlingServices?.length) {
    pdf.addField('Handling Services', formData.handlingServices.map(titleCase).join(', '));
  }
  if (formData.valueAddedServices?.length) {
    pdf.addField('Value Added Services', formData.valueAddedServices.map(titleCase).join(', '));
  }

  pdf
    .addField('Requires Temperature Control', formData.requiresTemperatureControl ? 'Yes' : 'No')
    .addField('Requires Humidity Control', formData.requiresHumidityControl ? 'Yes' : 'No')
    .addField('Requires Special Handling', formData.requiresSpecialHandling ? 'Yes' : 'No');

  if (formData.specialInstructions) pdf.addField('Special Instructions', formData.specialInstructions);

  const filename = options.requestNumber
    ? buildFilename('Warehousing_Request', options.requestNumber)
    : buildFilename('Warehousing_Request', new Date().toISOString().split('T')[0]);

  pdf.save(filename);
}
