import type { WarehousingRequestItem } from './warehousing-requests.model'

export function useWarehousingListingPdf() {
  const downloadPDF = async (item: WarehousingRequestItem) => {
    if (process.server) return
    try {
      const { getWarehousingRequestDetails } = await import('~/features/warehousing/warehousing-request-details/warehousing-request-details-api')
      const fullRequest = await getWarehousingRequestDetails(item.id)
      const { generateWarehousingRequestPDF } = await import('~/lib/pdf/warehousingRequestPdfGenerator')
      const formData = {
        storageType: String(fullRequest.storageType || ''),
        securityLevel: String(fullRequest.securityLevel || ''),
        estimatedVolume: fullRequest.estimatedVolume || 0,
        estimatedWeight: fullRequest.estimatedWeight || 0,
        estimatedStorageDuration: {
          value: fullRequest.estimatedStorageDuration?.value || 0,
          unit: (fullRequest.estimatedStorageDuration?.unit || 'months') as 'days' | 'weeks' | 'months' | 'years'
        },
        plannedStartDate: fullRequest.plannedStartDate instanceof Date
          ? fullRequest.plannedStartDate
          : new Date(fullRequest.plannedStartDate),
        plannedEndDate: fullRequest.plannedEndDate
          ? (fullRequest.plannedEndDate instanceof Date
            ? fullRequest.plannedEndDate
            : new Date(fullRequest.plannedEndDate))
          : undefined,
        handlingServices: (fullRequest.handlingServices || []).map(s => String(s)),
        valueAddedServices: (fullRequest.valueAddedServices || []).map(s => String(s)),
        requiresTemperatureControl: fullRequest.requiresTemperatureControl || false,
        requiresHumidityControl: fullRequest.requiresHumidityControl || false,
        requiresSpecialHandling: fullRequest.requiresSpecialHandling || false,
        specialInstructions: fullRequest.specialInstructions || undefined,
        billingType: String(fullRequest.billingType || ''),
        cargo: {
          description: fullRequest.cargo?.description || '',
          cargoType: String(fullRequest.cargo?.cargoType || ''),
          packaging: String(fullRequest.cargo?.packaging || ''),
          quantity: fullRequest.cargo?.quantity || 0,
          unitType: fullRequest.cargo?.unitType || '',
          value: fullRequest.cargo?.value || 0,
          currency: fullRequest.cargo?.currency || 'EUR'
        },
        priority: String(fullRequest.priority || '')
      }
      await generateWarehousingRequestPDF(formData, {
        requestNumber: fullRequest.requestNumber,
        createdAt: fullRequest.createdAt instanceof Date
          ? fullRequest.createdAt
          : new Date(fullRequest.createdAt),
        storageLocation: fullRequest.storageLocation || undefined
      })
    } catch (error) {
      console.error('Error generating PDF:', error)
      console.error('Error details:', error instanceof Error ? error.message : error)
      alert(`Error generating PDF: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  return { downloadPDF }
}
