import type { TransportationRequest } from './transportation-request.model'

export function useTransportationListingPdf() {
  const downloadPDF = async (item: TransportationRequest) => {
    if (process.server) return
    try {
      const { generateTransportationRequestPDF } = await import('~/lib/pdf/transportationRequestPdfGenerator')
      const formData = {
        serviceType: item.serviceType,
        pickupLocation: {
          address: {
            street: item.pickupLocation.address.street || '',
            city: item.pickupLocation.address.city || '',
            country: item.pickupLocation.address.country || ''
          },
          contactPerson: item.pickupLocation.contactPerson || '',
          contactPhone: item.pickupLocation.contactPhone || '',
          contactEmail: item.pickupLocation.contactEmail || '',
          loadingType: item.pickupLocation.loadingType || 'DOCK'
        },
        deliveryLocation: {
          address: {
            street: item.deliveryLocation.address.street || '',
            city: item.deliveryLocation.address.city || '',
            country: item.deliveryLocation.address.country || ''
          },
          contactPerson: item.deliveryLocation.contactPerson || '',
          contactPhone: item.deliveryLocation.contactPhone || '',
          contactEmail: item.deliveryLocation.contactEmail || '',
          loadingType: item.deliveryLocation.loadingType || 'DOCK'
        },
        cargo: {
          description: item.cargo.description || '',
          cargoType: item.cargo.cargoType || 'GENERAL_CARGO',
          weight: item.cargo.weight || 0,
          packaging: item.cargo.packaging || 'PALLETS',
          quantity: item.cargo.quantity || 1,
          unitType: item.cargo.unitType || 'units',
          value: item.cargo.value || 0,
          currency: item.cargo.currency || 'EUR',
          fragile: item.cargo.fragile || false,
          stackable: item.cargo.stackable || true
        },
        requestedPickupDate: item.requestedPickupDate,
        requestedDeliveryDate: item.requestedDeliveryDate,
        specialInstructions: item.specialInstructions,
        requiresInsurance: item.requiresInsurance,
        requiresCustomsClearance: item.requiresCustomsClearance,
        priority: item.priority,
        currency: item.currency || 'EUR'
      }
      await generateTransportationRequestPDF(formData, {
        requestNumber: item.requestNumber,
        createdAt: item.createdAt
      })
    } catch (error) {
      console.error('Error generating PDF:', error)
      alert('Error generating PDF. Please try again.')
    }
  }

  return { downloadPDF }
}
