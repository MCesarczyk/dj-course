import { describe, it, expect, vi } from 'vitest'
import { mountSuspended } from '@nuxt/test-utils/runtime'
import ServiceRequestsPage from '../ServiceRequestsPage.vue'

vi.mock('~/features/transportation/transportation-requests-listing/transportation-requests-api', async () => {
  const { mockTransportationRequests } = await import('~/features/transportation/transportation-requests-listing/transportation-request.mocks')
  return {
    useTransportationRequestsQuery: () => ({
      data: { value: mockTransportationRequests },
      isPending: { value: false },
      isError: { value: false },
      refetch: vi.fn(),
    }),
  }
})

vi.mock('~/features/warehousing/warehousing-requests-listing/warehousing-requests-api', async () => {
  const { mockWarehousingRequests } = await import('~/features/warehousing/warehousing-requests-listing/warehousing-requests.mocks')
  return {
    useWarehousingRequestsPaginated: () => ({
      data: { value: { data: mockWarehousingRequests, total: mockWarehousingRequests.length } },
      isLoading: { value: false },
      isError: { value: false },
      refetch: vi.fn(),
    }),
  }
})

describe('Service Requests Page', () => {
  it('shows the page heading', async () => {
    const wrapper = await mountSuspended(ServiceRequestsPage)
    expect(wrapper.find('h1').text()).toContain('Service Requests')
  })

  it('shows the page subtitle', async () => {
    const wrapper = await mountSuspended(ServiceRequestsPage)
    expect(wrapper.text()).toContain('Manage your transportation and warehousing requests')
  })

  it('shows Transportation Requests tab', async () => {
    const wrapper = await mountSuspended(ServiceRequestsPage)
    const tabButtons = wrapper.findAll('button')
    const transportationTab = tabButtons.find(b => b.text().includes('Transportation Requests'))
    expect(transportationTab).toBeTruthy()
  })

  it('shows Warehousing Requests tab', async () => {
    const wrapper = await mountSuspended(ServiceRequestsPage)
    const tabButtons = wrapper.findAll('button')
    const warehousingTab = tabButtons.find(b => b.text().includes('Warehousing Requests'))
    expect(warehousingTab).toBeTruthy()
  })

  it('shows transportation content by default', async () => {
    const wrapper = await mountSuspended(ServiceRequestsPage)
    expect(wrapper.text()).toContain('Transportation Requests')
  })
})
