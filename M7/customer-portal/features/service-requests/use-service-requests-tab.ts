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
    route.query.tab === 'warehousing' ? 'warehousing' : 'transportation'
  )

  const onTabChange = (tabId: string) => {
    router.push({ path: '/dashboard/requests', query: { tab: tabId } })
  }

  return { activeTab, onTabChange }
}
