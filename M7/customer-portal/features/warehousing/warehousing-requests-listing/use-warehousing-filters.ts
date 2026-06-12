import type { WarehousingRequestsFilters } from './warehousing-requests.model'

export function useWarehousingFilters() {
  const filters = reactive<WarehousingRequestsFilters>({
    status: '',
    priority: '',
    storageType: '',
    securityLevel: '',
    dateFrom: '',
    dateTo: ''
  })

  const updateFilters = (newFilters: WarehousingRequestsFilters) => {
    Object.assign(filters, newFilters)
  }

  const clearFilters = () => {
    filters.status = ''
    filters.priority = ''
    filters.storageType = ''
    filters.securityLevel = ''
    filters.dateFrom = ''
    filters.dateTo = ''
  }

  return { filters, updateFilters, clearFilters }
}
