import { type TransportationRequestFilters } from './transportation-requests-filter'

export function useTransportationFilters() {
  const filters = reactive<TransportationRequestFilters>({
    status: '',
    serviceType: '',
    dateFrom: ''
  })

  const updateFilters = (newFilters: TransportationRequestFilters) => {
    Object.assign(filters, newFilters)
  }

  const clearFilters = () => {
    filters.status = ''
    filters.serviceType = ''
    filters.dateFrom = ''
  }

  return { filters, updateFilters, clearFilters }
}
