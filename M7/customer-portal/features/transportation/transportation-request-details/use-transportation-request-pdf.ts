import type { Ref } from 'vue'
import type { TransportationRequest } from './transportation-request-details.model'

export function useTransportationRequestPdf(request: Ref<TransportationRequest | undefined>) {
  const isLoading = ref(false)

  const download = async () => {
    if (!request.value || process.server) return
    isLoading.value = true
    try {
      const { PDFGenerator } = await import('~/lib/pdf/pdfGenerator')
      await new Promise(resolve => setTimeout(resolve, 500))
      await PDFGenerator.generateTransportationRequestPDF(request.value)
    } catch (error) {
      console.error('Error generating PDF:', error)
      alert('Error generating PDF. Please try again.')
    } finally {
      isLoading.value = false
    }
  }

  return { isLoading, download }
}
