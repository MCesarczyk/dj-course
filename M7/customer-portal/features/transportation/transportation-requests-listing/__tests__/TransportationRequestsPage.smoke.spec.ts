import { describe, it, expect, vi } from 'vitest'
import { mountSuspended } from '@nuxt/test-utils/runtime'
import TransportationRequestsPage from '../TransportationRequestsPage.vue'

vi.mock('~/features/transportation/transportation-requests-listing/transportation-requests-api', async () => {
  const { mockTransportationRequests } = await import('../transportation-request.mocks')
  return {
    useTransportationRequestsQuery: () => ({
      data: { value: mockTransportationRequests },
      isPending: { value: false },
      isError: { value: false },
      refetch: vi.fn(),
    }),
  }
})

describe('Transportation Requests — Filters', () => {
  it('shows Status filter label', async () => {
    const wrapper = await mountSuspended(TransportationRequestsPage)
    expect(wrapper.text()).toContain('Status')
  })

  it('shows Service Type filter label', async () => {
    const wrapper = await mountSuspended(TransportationRequestsPage)
    expect(wrapper.text()).toContain('Service Type')
  })

  it('shows Date Range filter label', async () => {
    const wrapper = await mountSuspended(TransportationRequestsPage)
    expect(wrapper.text()).toContain('Date Range')
  })

  it('shows Clear Filters button', async () => {
    const wrapper = await mountSuspended(TransportationRequestsPage)
    const buttons = wrapper.findAll('button')
    expect(buttons.some(b => b.text().includes('Clear Filters'))).toBe(true)
  })
})

describe('Transportation Requests — Table', () => {
  it('shows table heading', async () => {
    const wrapper = await mountSuspended(TransportationRequestsPage)
    expect(wrapper.find('h2').text()).toContain('Transportation Requests')
  })

  it('shows table description', async () => {
    const wrapper = await mountSuspended(TransportationRequestsPage)
    expect(wrapper.text()).toContain('Manage your road transportation requests across Europe')
  })

  it('shows New Transportation Request button', async () => {
    const wrapper = await mountSuspended(TransportationRequestsPage)
    const buttons = wrapper.findAll('button')
    expect(buttons.some(b => b.text().includes('New Transportation Request'))).toBe(true)
  })

  it('shows column header: Request', async () => {
    const wrapper = await mountSuspended(TransportationRequestsPage)
    const headers = wrapper.findAll('th')
    expect(headers.some(h => h.text().includes('Request'))).toBe(true)
  })

  it('shows column header: Route', async () => {
    const wrapper = await mountSuspended(TransportationRequestsPage)
    const headers = wrapper.findAll('th')
    expect(headers.some(h => h.text().includes('Route'))).toBe(true)
  })

  it('shows column header: Service Type', async () => {
    const wrapper = await mountSuspended(TransportationRequestsPage)
    const headers = wrapper.findAll('th')
    expect(headers.some(h => h.text().includes('Service Type'))).toBe(true)
  })

  it('shows column header: Status', async () => {
    const wrapper = await mountSuspended(TransportationRequestsPage)
    const headers = wrapper.findAll('th')
    expect(headers.some(h => h.text().includes('Status'))).toBe(true)
  })

  it('shows column header: Pickup Date', async () => {
    const wrapper = await mountSuspended(TransportationRequestsPage)
    const headers = wrapper.findAll('th')
    expect(headers.some(h => h.text().includes('Pickup Date'))).toBe(true)
  })

  it('renders request number TR-2024-001 from mock data', async () => {
    const wrapper = await mountSuspended(TransportationRequestsPage)
    expect(wrapper.text()).toContain('TR-2024-001')
  })

  it('renders route Warsaw → Berlin from mock data', async () => {
    const wrapper = await mountSuspended(TransportationRequestsPage)
    expect(wrapper.text()).toContain('Warsaw')
    expect(wrapper.text()).toContain('Berlin')
  })
})

describe('Transportation Requests — Row Actions', () => {
  it('shows View action for each row', async () => {
    const wrapper = await mountSuspended(TransportationRequestsPage)
    const buttons = wrapper.findAll('button')
    expect(buttons.some(b => b.text().includes('View'))).toBe(true)
  })

  it('shows Download PDF action for each row', async () => {
    const wrapper = await mountSuspended(TransportationRequestsPage)
    const buttons = wrapper.findAll('button')
    expect(buttons.some(b => b.text().includes('Download PDF'))).toBe(true)
  })

  it('shows Track action for rows with a tracking number', async () => {
    const wrapper = await mountSuspended(TransportationRequestsPage)
    const buttons = wrapper.findAll('button')
    expect(buttons.some(b => b.text().includes('Track'))).toBe(true)
  })
})
