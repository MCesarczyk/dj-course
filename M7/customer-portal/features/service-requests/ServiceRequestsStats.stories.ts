import type { Meta, StoryObj } from '@storybook/vue3'
import ServiceRequestsStats from './ServiceRequestsStats.vue'
import {
  mockServiceRequestsStatsDefault,
  mockServiceRequestsStatsHighActivity,
  mockServiceRequestsStatsAllComplete,
  mockServiceRequestsStatsLowActivity,
} from './service-requests-stats.mocks'

const meta: Meta<typeof ServiceRequestsStats> = {
  title: 'Service Requests/Stats Widget',
  component: ServiceRequestsStats,
  tags: ['autodocs'],
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component:
          'Activity summary widget for the Service Requests page. Displays three circular progress rings (Transport, Warehousing, On Track) and a status breakdown list inspired by the Apple activity ring design.',
      },
    },
  },
  argTypes: {
    rings: {
      control: { type: 'object' },
      description: 'Three progress ring descriptors — label, value, unit, progress (0–100), color hex',
    },
    statusItems: {
      control: { type: 'object' },
      description: 'Status breakdown list items — label, count, done flag, accent color hex',
    },
  },
}

export default meta
type Story = StoryObj<typeof ServiceRequestsStats>

export const Default: Story = {
  args: {
    rings: mockServiceRequestsStatsDefault.rings,
    statusItems: mockServiceRequestsStatsDefault.statusItems,
  },
}

export const HighActivity: Story = {
  parameters: {
    docs: {
      description: {
        story: 'Peak operation — large volumes in transit and in warehouse, most requests on track.',
      },
    },
  },
  args: {
    rings: mockServiceRequestsStatsHighActivity.rings,
    statusItems: mockServiceRequestsStatsHighActivity.statusItems,
  },
}

export const AllComplete: Story = {
  parameters: {
    docs: {
      description: {
        story: 'All requests fulfilled — no active shipments or storage, every status item marked done.',
      },
    },
  },
  args: {
    rings: mockServiceRequestsStatsAllComplete.rings,
    statusItems: mockServiceRequestsStatsAllComplete.statusItems,
  },
}

export const LowActivity: Story = {
  parameters: {
    docs: {
      description: {
        story: 'Quiet period — low transit and warehouse utilisation, most requests awaiting review.',
      },
    },
  },
  args: {
    rings: mockServiceRequestsStatsLowActivity.rings,
    statusItems: mockServiceRequestsStatsLowActivity.statusItems,
  },
}
