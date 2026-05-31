import { buildFilename, formatCurrency, formatDate, PdfDocument } from '@deliveroo/pdf-core';

const LOGO_PATH = '/deliveroo-pdf-logo.png';
const FOOTER_LINES = [
  'Deliveroo Logistics | ul. Logistyczna 123, 00-001 Warsaw, Poland',
  'Phone: +48 123 456 789 | Email: contact@deliveroo.pl',
];

interface TransportationRequestData {
  id: string;
  requestNumber: string;
  status: string;
  priority: string;
  pickupLocation: {
    address: { street: string; city: string; postalCode: string; country: string };
    contactPerson: string;
    contactPhone: string;
    contactEmail: string;
  };
  deliveryLocation: {
    address: { street: string; city: string; postalCode: string; country: string };
    contactPerson: string;
    contactPhone: string;
    contactEmail: string;
  };
  cargo: {
    description: string;
    cargoType: string;
    weight: number;
    dimensions: { length: number; width: number; height: number; unit: string };
    value: number;
    currency: string;
    packaging: string;
    quantity: number;
    unitType: string;
  };
  serviceType: string;
  vehicleRequirements?: { vehicleType: string; capacity: number };
  requestedPickupDate: Date | string;
  requestedDeliveryDate: Date | string;
  specialInstructions?: string;
  requiresInsurance: boolean;
  requiresCustomsClearance: boolean;
  estimatedCost?: number;
  finalCost?: number;
  currency: string;
  trackingNumber?: string;
  createdAt: Date | string;
}

interface WarehousingRequestData {
  id: string;
  requestNumber: string;
  status: string;
  priority: string;
  storageType: string;
  estimatedVolume: number;
  estimatedWeight: number;
  cargo: {
    description: string;
    cargoType: string;
    weight: number;
    dimensions: { length: number; width: number; height: number; unit: string };
    value: number;
    currency: string;
    packaging: string;
    quantity: number;
    unitType: string;
  };
  estimatedStorageDuration: { value: number; unit: string };
  plannedStartDate: Date | string;
  plannedEndDate?: Date | string;
  handlingServices: string[];
  valueAddedServices: string[];
  securityLevel: string;
  requiresTemperatureControl: boolean;
  requiresHumidityControl: boolean;
  requiresSpecialHandling: boolean;
  specialInstructions?: string;
  estimatedCost?: number;
  finalCost?: number;
  currency: string;
  billingType: string;
  storageLocation?: string;
  createdAt: Date | string;
}

export const PDFGenerator = {
  async generateTransportationRequestPDF(request: TransportationRequestData): Promise<void> {
    const pdf = new PdfDocument();

    await pdf.addHeader({
      title: 'Transportation Request',
      subtitle: 'Deliveroo Logistics',
      logoPath: LOGO_PATH,
    });

    const pickup = request.pickupLocation;
    const delivery = request.deliveryLocation;
    const cargo = request.cargo;

    pdf
      .setFooter({ lines: FOOTER_LINES })
      .addSection('Request Information')
      .addField('Request Number', request.requestNumber)
      .addField('Status', request.status)
      .addField('Priority', request.priority)
      .addField('Created', formatDate(request.createdAt))
      .addSection('Pickup Location')
      .addField('Address', `${pickup.address.street}, ${pickup.address.city}, ${pickup.address.postalCode}, ${pickup.address.country}`)
      .addField('Contact Person', pickup.contactPerson)
      .addField('Phone', pickup.contactPhone)
      .addField('Email', pickup.contactEmail)
      .addSection('Delivery Location')
      .addField('Address', `${delivery.address.street}, ${delivery.address.city}, ${delivery.address.postalCode}, ${delivery.address.country}`)
      .addField('Contact Person', delivery.contactPerson)
      .addField('Phone', delivery.contactPhone)
      .addField('Email', delivery.contactEmail)
      .addSection('Cargo Information')
      .addField('Description', cargo.description)
      .addField('Cargo Type', cargo.cargoType)
      .addField('Weight', `${cargo.weight} kg`)
      .addField('Dimensions', `${cargo.dimensions.length} × ${cargo.dimensions.width} × ${cargo.dimensions.height} ${cargo.dimensions.unit}`)
      .addField('Quantity', `${cargo.quantity} ${cargo.unitType}`)
      .addField('Value', formatCurrency(cargo.value, cargo.currency))
      .addField('Packaging', cargo.packaging)
      .addSection('Service Details')
      .addField('Service Type', request.serviceType)
      .addField('Requested Pickup Date', formatDate(request.requestedPickupDate))
      .addField('Requested Delivery Date', formatDate(request.requestedDeliveryDate))
      .addField('Requires Insurance', request.requiresInsurance ? 'Yes' : 'No')
      .addField('Requires Customs Clearance', request.requiresCustomsClearance ? 'Yes' : 'No');

    if (request.vehicleRequirements) pdf.addField('Vehicle Type', request.vehicleRequirements.vehicleType);
    if (request.specialInstructions) pdf.addField('Special Instructions', request.specialInstructions);
    if (request.trackingNumber) pdf.addField('Tracking Number', request.trackingNumber);

    pdf.addSection('Pricing');
    if (request.estimatedCost) pdf.addField('Estimated Cost', formatCurrency(request.estimatedCost, request.currency));
    if (request.finalCost) pdf.addField('Final Cost', formatCurrency(request.finalCost, request.currency));

    pdf.save(buildFilename('Transportation_Request', request.requestNumber));
  },

  async generateWarehousingRequestPDF(request: WarehousingRequestData): Promise<void> {
    const pdf = new PdfDocument();

    await pdf.addHeader({
      title: 'Warehousing Request',
      subtitle: 'Deliveroo Logistics',
      logoPath: LOGO_PATH,
    });

    const cargo = request.cargo;

    pdf
      .setFooter({ lines: FOOTER_LINES })
      .addSection('Request Information')
      .addField('Request Number', request.requestNumber)
      .addField('Status', request.status)
      .addField('Priority', request.priority)
      .addField('Created', formatDate(request.createdAt))
      .addSection('Storage Information')
      .addField('Storage Type', request.storageType)
      .addField('Estimated Volume', `${request.estimatedVolume} m³`)
      .addField('Estimated Weight', `${request.estimatedWeight} kg`)
      .addField('Security Level', request.securityLevel)
      .addField('Planned Start Date', formatDate(request.plannedStartDate))
      .addField('Storage Duration', `${request.estimatedStorageDuration.value} ${request.estimatedStorageDuration.unit}`)
      .addField('Billing Type', request.billingType);

    if (request.plannedEndDate) pdf.addField('Planned End Date', formatDate(request.plannedEndDate));
    if (request.storageLocation) pdf.addField('Storage Location', request.storageLocation);

    pdf
      .addSection('Cargo Information')
      .addField('Description', cargo.description)
      .addField('Cargo Type', cargo.cargoType)
      .addField('Weight', `${cargo.weight} kg`)
      .addField('Dimensions', `${cargo.dimensions.length} × ${cargo.dimensions.width} × ${cargo.dimensions.height} ${cargo.dimensions.unit}`)
      .addField('Quantity', `${cargo.quantity} ${cargo.unitType}`)
      .addField('Value', formatCurrency(cargo.value, cargo.currency))
      .addField('Packaging', cargo.packaging)
      .addSection('Service Requirements');

    if (request.handlingServices?.length) {
      pdf.addField('Handling Services', request.handlingServices.join(', '));
    }
    if (request.valueAddedServices?.length) {
      pdf.addField('Value Added Services', request.valueAddedServices.join(', '));
    }

    pdf
      .addField('Requires Temperature Control', request.requiresTemperatureControl ? 'Yes' : 'No')
      .addField('Requires Humidity Control', request.requiresHumidityControl ? 'Yes' : 'No')
      .addField('Requires Special Handling', request.requiresSpecialHandling ? 'Yes' : 'No');

    if (request.specialInstructions) pdf.addField('Special Instructions', request.specialInstructions);

    pdf.addSection('Pricing');
    if (request.estimatedCost) pdf.addField('Estimated Cost', formatCurrency(request.estimatedCost, request.currency));
    if (request.finalCost) pdf.addField('Final Cost', formatCurrency(request.finalCost, request.currency));

    pdf.save(buildFilename('Warehousing_Request', request.requestNumber));
  },
};
