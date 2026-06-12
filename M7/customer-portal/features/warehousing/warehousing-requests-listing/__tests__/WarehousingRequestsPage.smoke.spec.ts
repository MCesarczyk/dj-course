import { describe, it, expect, vi } from 'vitest'
import { mountSuspended } from '@nuxt/test-utils/runtime'
import WarehousingRequestsPage from '../WarehousingRequestsPage.vue'

vi.mock('~/features/warehousing/warehousing-requests-listing/warehousing-requests-api', async () => {
  const { mockWarehousingRequests } = await import('../warehousing-requests.mocks')
  return {
    useWarehousingRequestsPaginated: () => ({
      data: { value: { data: mockWarehousingRequests, total: mockWarehousingRequests.length } },
      isLoading: { value: false },
      isError: { value: false },
      refetch: vi.fn(),
    }),
  }
})

describe('Warehousing Requests — Filters', () => {
  it('shows Status filter label', async () => {
    const wrapper = await mountSuspended(WarehousingRequestsPage)
    expect(wrapper.text()).toContain('Status')
  })

  it('shows Priority filter label', async () => {
    const wrapper = await mountSuspended(WarehousingRequestsPage)
    expect(wrapper.text()).toContain('Priority')
  })

  it('shows Storage Type filter label', async () => {
    const wrapper = await mountSuspended(WarehousingRequestsPage)
    expect(wrapper.text()).toContain('Storage Type')
  })

  it('shows Security Level filter label', async () => {
    const wrapper = await mountSuspended(WarehousingRequestsPage)
    expect(wrapper.text()).toContain('Security Level')
  })

  it('shows Date From filter label', async () => {
    const wrapper = await mountSuspended(WarehousingRequestsPage)
    expect(wrapper.text()).toContain('Date From')
  })

  it('shows Date To filter label', async () => {
    const wrapper = await mountSuspended(WarehousingRequestsPage)
    expect(wrapper.text()).toContain('Date To')
  })

  it('shows Clear Filters button', async () => {
    const wrapper = await mountSuspended(WarehousingRequestsPage)
    const buttons = wrapper.findAll('button')
    expect(buttons.some(b => b.text().includes('Clear Filters'))).toBe(true)
  })
})

describe('Warehousing Requests — Table', () => {
  it('shows table heading', async () => {
    const wrapper = await mountSuspended(WarehousingRequestsPage)
    expect(wrapper.find('h2').text()).toContain('Warehousing Requests')
  })

  it('shows New Warehousing Request button', async () => {
    const wrapper = await mountSuspended(WarehousingRequestsPage)
    const buttons = wrapper.findAll('button')
    expect(buttons.some(b => b.text().includes('New Warehousing Request'))).toBe(true)
  })

  it('shows column header: Request ID', async () => {
    const wrapper = await mountSuspended(WarehousingRequestsPage)
    const headers = wrapper.findAll('th')
    expect(headers.some(h => h.text().includes('Request ID'))).toBe(true)
  })

  it('shows column header: Storage Type & Cargo', async () => {
    const wrapper = await mountSuspended(WarehousingRequestsPage)
    const headers = wrapper.findAll('th')
    expect(headers.some(h => h.text().includes('Storage Type & Cargo'))).toBe(true)
  })

  it('shows column header: Status', async () => {
    const wrapper = await mountSuspended(WarehousingRequestsPage)
    const headers = wrapper.findAll('th')
    expect(headers.some(h => h.text().includes('Status'))).toBe(true)
  })

  it('shows column header: Priority', async () => {
    const wrapper = await mountSuspended(WarehousingRequestsPage)
    const headers = wrapper.findAll('th')
    expect(headers.some(h => h.text().includes('Priority'))).toBe(true)
  })

  it('shows column header: Volume', async () => {
    const wrapper = await mountSuspended(WarehousingRequestsPage)
    const headers = wrapper.findAll('th')
    expect(headers.some(h => h.text().includes('Volume'))).toBe(true)
  })

  it('shows column header: Date Created', async () => {
    const wrapper = await mountSuspended(WarehousingRequestsPage)
    const headers = wrapper.findAll('th')
    expect(headers.some(h => h.text().includes('Date Created'))).toBe(true)
  })

  it('renders request ID WH-2024-005 from mock data', async () => {
    const wrapper = await mountSuspended(WarehousingRequestsPage)
    expect(wrapper.text()).toContain('WH-2024-005')
  })

  it('renders cargo details from mock data', async () => {
    const wrapper = await mountSuspended(WarehousingRequestsPage)
    expect(wrapper.text()).toContain('Hazardous Storage')
  })
})

describe('Warehousing Requests — Row Actions', () => {
  it('shows View Details action', async () => {
    const wrapper = await mountSuspended(WarehousingRequestsPage)
    const buttons = wrapper.findAll('button')
    expect(buttons.some(b => b.text().includes('View Details'))).toBe(true)
  })

  it('shows Download PDF action', async () => {
    const wrapper = await mountSuspended(WarehousingRequestsPage)
    const buttons = wrapper.findAll('button')
    expect(buttons.some(b => b.text().includes('Download PDF'))).toBe(true)
  })

  it('shows View Inventory only for STORED and RECEIVED items', async () => {
    const wrapper = await mountSuspended(WarehousingRequestsPage)
    const rows = wrapper.findAll('tbody tr')

    // WH-2024-012 (STORED) and WH-2024-011 (RECEIVED) should have View Inventory
    // WH-2024-005 (SUBMITTED) should not
    const storedOrReceivedRows = rows.filter(row =>
      row.text().includes('WH-2024-011') || row.text().includes('WH-2024-012')
    )
    const submittedRow = rows.find(row => row.text().includes('WH-2024-005'))

    storedOrReceivedRows.forEach(row => {
      expect(row.text()).toContain('View Inventory')
    })
    expect(submittedRow?.text()).not.toContain('View Inventory')
  })
})
