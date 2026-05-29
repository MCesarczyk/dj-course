<template>
  <div class="card p-6">
    <div class="flex items-center justify-between mb-6">
      <h2 class="text-lg font-medium text-gray-900 dark:text-white">
        Tracking Details
      </h2>
      <span
        :class="[
          'inline-flex items-center px-3 py-1 rounded-full text-sm font-medium',
          getStatusColor(trackingData.status)
        ]"
      >
        {{ formatEnum(trackingData.status) }}
      </span>
    </div>
    
    <div class="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
      <div>
        <dt class="text-sm font-medium text-gray-500 dark:text-gray-400">Tracking Number</dt>
        <dd class="mt-1 text-sm text-gray-900 dark:text-white">{{ trackingData.trackingNumber }}</dd>
      </div>
      <div>
        <dt class="text-sm font-medium text-gray-500 dark:text-gray-400">Service Type</dt>
        <dd class="mt-1 text-sm text-gray-900 dark:text-white">{{ formatEnum(trackingData.serviceType) }}</dd>
      </div>
      <div>
        <dt class="text-sm font-medium text-gray-500 dark:text-gray-400">Origin</dt>
        <dd class="mt-1 text-sm text-gray-900 dark:text-white">{{ trackingData.origin }}</dd>
      </div>
      <div>
        <dt class="text-sm font-medium text-gray-500 dark:text-gray-400">Destination</dt>
        <dd class="mt-1 text-sm text-gray-900 dark:text-white">{{ trackingData.destination }}</dd>
      </div>
    </div>

    <!-- Delivery Information -->
    <div v-if="trackingData.estimatedDelivery || trackingData.actualDelivery" class="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
      <div class="grid grid-cols-1 gap-6 sm:grid-cols-2">
        <div v-if="trackingData.estimatedDelivery">
          <dt class="text-sm font-medium text-gray-500 dark:text-gray-400">Estimated Delivery</dt>
          <dd class="mt-1 text-sm text-gray-900 dark:text-white">{{ formatDateTime(trackingData.estimatedDelivery) }}</dd>
        </div>
        <div v-if="trackingData.actualDelivery">
          <dt class="text-sm font-medium text-gray-500 dark:text-gray-400">Actual Delivery</dt>
          <dd class="mt-1 text-sm text-green-600 dark:text-green-400 font-medium">{{ formatDateTime(trackingData.actualDelivery) }}</dd>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { TrackingData } from './tracking.model'
import { formatEnum, formatDateTime } from '~/lib/utils/formatters'
import { getStatusColor } from '~/lib/utils/statusColors'

interface Props {
  trackingData: TrackingData
}

defineProps<Props>()

</script>
