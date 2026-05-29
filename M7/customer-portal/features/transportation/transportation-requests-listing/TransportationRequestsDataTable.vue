<template>
  <DataTable
    title="Transportation Requests"
    description="Manage your road transportation requests across Europe"
    :data="query.data.value || []"
    :columns="columns"
    :headerActions="headerActions"
    :loading="query.isPending.value"
    :error="query.isError.value"
    :loadingText="'Loading transportation requests...'"
    :errorTitle="'Error Loading Requests'"
    :errorMessage="'There was a problem loading your transportation requests.'"
    :rowActions="rowActions"
    @retry="query.refetch"
  >
    <template #cell-request="{ item }">
      <div class="text-sm font-medium text-gray-900 dark:text-white">
        {{ item.requestNumber }}
      </div>
      <div class="text-sm text-gray-500 dark:text-gray-400">
        {{ item.trackingNumber || 'Not assigned' }}
      </div>
    </template>
    <template #cell-route="{ item }">
      <div class="text-sm text-gray-900 dark:text-white">
        {{ item.pickupLocation.address.city }} → {{ item.deliveryLocation.address.city }}
      </div>
      <div class="text-sm text-gray-500 dark:text-gray-400">
        {{ item.pickupLocation.address.country }} → {{ item.deliveryLocation.address.country }}
      </div>
    </template>
    <template #cell-serviceType="{ item }">
      <TransportationServiceBadge :serviceType="item.serviceType" />
    </template>
    <template #cell-status="{ item }">
      <TransportationStatusBadge :status="item.status" />
    </template>
    <template #cell-requestedPickupDate="{ item }">
      <span class="text-sm text-gray-900 dark:text-white">
        {{ formatDate(item.requestedPickupDate) }}
      </span>
    </template>
  </DataTable>
</template>

<script setup lang="ts">
import { onMounted } from 'vue'
import { 
  EyeIcon, 
  MapPinIcon,
  DocumentArrowDownIcon
} from '@heroicons/vue/24/outline'
import type { TransportationRequest } from './transportation-request.model'
import DataTable from '~/components/ui-library/datatable/DataTable.vue'
import TransportationServiceBadge from '~/components/badges/TransportationServiceBadge.vue'
import TransportationStatusBadge from '~/components/badges/TransportationStatusBadge.vue'
import { type PartialTransportationRequestFilters } from './transportation-requests-filter'
import { useTransportationRequestsQuery } from './transportation-requests-api'
import { formatDate } from '~/lib/utils/formatters'
import { useTransportationListingPdf } from './use-transportation-listing-pdf'

interface Props {
  filters?: PartialTransportationRequestFilters
}

const props = withDefaults(defineProps<Props>(), {
  filters: () => ({})
})

// Use TanStack Query
const query = useTransportationRequestsQuery(toRef(props, 'filters'))

// Refetch on mount to ensure we have the latest data (especially after creating a new request)
onMounted(() => {
  query.refetch()
})

// Router
const router = useRouter()

// Navigation functions
const trackShipment = (trackingNumber: string) => {
  router.push(`/dashboard/tracking?number=${trackingNumber}`)
}

// Header actions
const headerActions = [
  {
    label: 'New Transportation Request',
    handler: () => {
      router.push('/dashboard/transportation/new').catch(() => {})
    },
    variant: 'primary' as const
  }
]

// Table configuration
const columns = [
  {
    key: 'request',
    label: 'Request'
  },
  {
    key: 'route',
    label: 'Route'
  },
  {
    key: 'serviceType',
    label: 'Service Type'
  },
  {
    key: 'status',
    label: 'Status'
  },
  {
    key: 'requestedPickupDate',
    label: 'Pickup Date'
  }
]

const { downloadPDF } = useTransportationListingPdf()

const rowActions = [
  {
    label: 'View',
    icon: EyeIcon,
    handler: (item: TransportationRequest) => {
      navigateTo(`/dashboard/requests/transportation/${item.id}`)
    }
  },
  {
    label: 'Download PDF',
    icon: DocumentArrowDownIcon,
    handler: (item: TransportationRequest) => {
      downloadPDF(item)
    }
  },
  {
    label: 'Track',
    icon: MapPinIcon,
    handler: (item: TransportationRequest) => {
      if (item.trackingNumber) {
        trackShipment(item.trackingNumber)
      }
    },
    condition: (item: TransportationRequest) => !!item.trackingNumber
  }
]
</script>
