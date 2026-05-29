import { useRoute, useRouter } from 'vue-router'

interface ServiceRequestsTab {
  id: string
  name: string
  icon?: any
}

type ServiceRequestsTabId = 'transportation' | 'warehousing'

export const SERVICE_REQUESTS_TABS: ServiceRequestsTab[] = [
  { id: 'transportation', name: 'Transportation Requests' },
  { id: 'warehousing', name: 'Warehousing Requests' }
]

export function useServiceRequestsTab() {
  const route = useRoute()
  const router = useRouter()

  const activeTab = computed<ServiceRequestsTabId>(() =>
    route.path.includes('/warehousing') ? 'warehousing' : 'transportation'
  )

  const onTabChange = (tabId: string) => {
    const tab = tabId as ServiceRequestsTabId
    router.push(tab === 'warehousing'
      ? '/dashboard/requests/warehousing'
      : '/dashboard/requests/transportation'
    )
  }

  return { activeTab, onTabChange }
}
