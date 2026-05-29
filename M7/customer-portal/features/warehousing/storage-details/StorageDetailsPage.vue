<template>
  <div>
    <div class="mb-6 flex items-center justify-between">
      <div>
        <NuxtLink to="/dashboard/warehousing" class="text-success-600 hover:text-success-500 dark:text-success-400 flex items-center">
          <ArrowLeftIcon class="w-5 h-5 mr-1" />
          Back to Storage
        </NuxtLink>
        <h1 class="text-2xl font-bold text-gray-900 dark:text-white mt-4">Storage Item {{ id }}</h1>
        <p class="text-sm text-gray-500 dark:text-gray-400">Detailed view of storage item</p>
      </div>
    </div>

    <LoadingState v-if="isLoading" message="Loading item details..." />

    <ErrorState
      v-else-if="isError"
      title="Error Loading Item"
      message="There was a problem loading the storage item details."
      @retry="refetch"
    />

    <div v-else class="space-y-6">
      <div class="card p-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <div>
          <dt class="text-sm font-medium text-gray-500 dark:text-gray-400">Cargo Type</dt>
          <dd class="mt-1 text-sm text-gray-900 dark:text-white">{{ item.cargoType }}</dd>
        </div>
        <div>
          <dt class="text-sm font-medium text-gray-500 dark:text-gray-400">Quantity</dt>
          <dd class="mt-1 text-sm text-gray-900 dark:text-white">{{ item.quantity }} {{ item.unitType }}</dd>
        </div>
        <div>
          <dt class="text-sm font-medium text-gray-500 dark:text-gray-400">Location</dt>
          <dd class="mt-1 text-sm text-gray-900 dark:text-white">{{ item.storageLocation }}</dd>
        </div>
        <div>
          <dt class="text-sm font-medium text-gray-500 dark:text-gray-400">Status</dt>
          <dd class="mt-1 text-sm text-gray-900 dark:text-white">
            <span :class="['inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium', getStatusColor(item.status)]">
              {{ formatEnum(item.status) }}
            </span>
          </dd>
        </div>
        <div>
          <dt class="text-sm font-medium text-gray-500 dark:text-gray-400">Arrival Date</dt>
          <dd class="mt-1 text-sm text-gray-900 dark:text-white">{{ formatDate(item.arrivalDate) }}</dd>
        </div>
        <div v-if="item.departureDate">
          <dt class="text-sm font-medium text-gray-500 dark:text-gray-400">Departure Date</dt>
          <dd class="mt-1 text-sm text-gray-900 dark:text-white">{{ formatDate(item.departureDate) }}</dd>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useRoute, navigateTo } from '#app'
import { ArrowLeftIcon } from '@heroicons/vue/24/outline'
import LoadingState from '~/components/ui-library/states/LoadingState.vue'
import ErrorState from '~/components/ui-library/states/ErrorState.vue'
import { useStorageItemDetails } from './storage-details-api'
import type { StorageItem } from '~/features/warehousing/storage-listing/storage-listing.model'
import { formatEnum, formatDate } from '~/lib/utils/formatters'
import { getStatusColor } from '~/lib/utils/statusColors'

const route = useRoute()
const id = route.params.id as string
const { data: item, isLoading, isError, refetch } = useStorageItemDetails(id) as unknown as { data: Ref<StorageItem>; isLoading: Ref<boolean>; isError: Ref<boolean>; refetch: () => void }

</script>
