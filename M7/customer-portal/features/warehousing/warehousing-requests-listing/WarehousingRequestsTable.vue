<template>
  <DataTable
    title="Warehousing Requests"
    description="Warehousing requests for storage and handling services"
    :data="warehousingQuery.data.value?.data || []"
    :columns="columns"
    :loading="warehousingQuery.isLoading.value"
    :error="warehousingQuery.isError.value"
    :header-actions="headerActions"
    :row-actions="rowActions"
    :pagination="paginationData"
    loading-text="Loading warehousing requests..."
    error-title="Error Loading Warehousing Requests"
    error-message="There was a problem loading your warehousing requests."
    empty-title="No Warehousing Requests"
    empty-message="No warehousing requests found matching your criteria."
    :empty-icon="BuildingStorefrontIcon"
    @retry="warehousingQuery.refetch"
    @previous-page="emit('previousPage')"
    @next-page="emit('nextPage')"
    @go-to-page="(page: number) => emit('goToPage', page)"
  >
    <!-- Request ID -->
    <template #cell-id="{ value }">
      <div class="text-sm font-medium text-gray-900 dark:text-white">
        {{ value }}
      </div>
    </template>
    
    <!-- Details with sub-details -->
    <template #cell-details="{ item, value }">
      <div>
        <div class="text-sm text-gray-900 dark:text-white">
          {{ value }}
        </div>
        <div class="text-sm text-gray-500 dark:text-gray-400">
          {{ item.subDetails }}
        </div>
      </div>
    </template>
    
    <!-- Status badge -->
    <template #cell-status="{ value }">
      <StorageStatusBadge :status="value" />
    </template>

    <!-- Priority badge -->
    <template #cell-priority="{ value }">
      <PriorityBadge :priority="value" />
    </template>

    <!-- Storage Type badge -->
    <template #cell-storageType="{ value }">
      <StorageTypeBadge :storageType="value" />
    </template>

    <!-- Volume -->
    <template #cell-volume="{ value }">
      <span class="text-sm text-gray-900 dark:text-white">
        {{ value }} m³
      </span>
    </template>
    
    <!-- Formatted date -->
    <template #cell-date="{ value }">
      <span class="text-sm text-gray-900 dark:text-white">
        {{ formatDate(value) }}
      </span>
    </template>
  </DataTable>
</template>

<script setup lang="ts">
import { BuildingStorefrontIcon, EyeIcon, CubeIcon, DocumentArrowDownIcon } from '@heroicons/vue/24/outline'
import DataTable from '~/components/ui-library/datatable/DataTable.vue'
import { useWarehousingRequestsPaginated } from './warehousing-requests-api'
import { formatDate } from '~/lib/utils/formatters'
import type { WarehousingRequestsFilters, WarehousingRequestItem } from './warehousing-requests.model'
import { useWarehousingListingPdf } from './use-warehousing-listing-pdf'
import StorageStatusBadge from '~/components/badges/StorageStatusBadge.vue'
import PriorityBadge from '~/components/badges/PriorityBadge.vue'
import StorageTypeBadge from '~/components/badges/StorageTypeBadge.vue'

interface Props {
  filters: WarehousingRequestsFilters
  currentPage: number
  itemsPerPage: number
}

const props = defineProps<Props>()

const emit = defineEmits<{
  previousPage: []
  nextPage: []
  goToPage: [page: number]
}>()

// Use the API composable
const warehousingQuery = useWarehousingRequestsPaginated(
  computed(() => props.filters),
  toRef(props, 'currentPage'),
  props.itemsPerPage
)

// Column definitions
const columns = [
  {
    key: 'id',
    label: 'Request ID'
  },
  {
    key: 'details',
    label: 'Storage Type & Cargo'
  },
  {
    key: 'status',
    label: 'Status'
  },
  {
    key: 'priority',
    label: 'Priority'
  },
  {
    key: 'storageType',
    label: 'Storage Type'
  },
  {
    key: 'volume',
    label: 'Volume'
  },
  {
    key: 'date',
    label: 'Date Created'
  }
]

// Header actions
const headerActions = [
  {
    label: 'New Warehousing Request',
    handler: async () => {
      await navigateTo('/dashboard/warehousing/new')
    },
    variant: 'primary' as const
  }
]

const { downloadPDF } = useWarehousingListingPdf()

// Row actions
const rowActions = [
  {
    label: 'View Details',
    handler: (item: any) => {
      navigateTo(`/dashboard/requests/warehousing/${item.id}`)
    },
    icon: EyeIcon
  },
  {
    label: 'Download PDF',
    handler: (item: WarehousingRequestItem) => {
      downloadPDF(item)
    },
    icon: DocumentArrowDownIcon
  },
  {
    label: 'View Inventory',
    handler: (_item: any) => {},
    icon: CubeIcon,
    condition: (item: any) => ['STORED', 'RECEIVED'].includes(item.status)
  }
]

// Computed values for pagination
const totalPages = computed(() => {
  const data = warehousingQuery.data.value
  return data ? Math.ceil(data.total / props.itemsPerPage) : 0
})

const startIndex = computed(() => (props.currentPage - 1) * props.itemsPerPage)
const endIndex = computed(() => startIndex.value + props.itemsPerPage)

const visiblePages = computed(() => {
  const pages = []
  const start = Math.max(1, props.currentPage - 2)
  const end = Math.min(totalPages.value, props.currentPage + 2)

  for (let i = start; i <= end; i++) {
    pages.push(i)
  }

  return pages
})

const paginationData = computed(() => ({
  currentPage: props.currentPage,
  totalPages: totalPages.value,
  total: warehousingQuery.data.value?.total || 0,
  startIndex: startIndex.value,
  endIndex: endIndex.value,
  visiblePages: visiblePages.value
}))
</script> 