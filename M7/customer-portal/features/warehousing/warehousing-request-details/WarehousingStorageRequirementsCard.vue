<template>
  <div class="card p-6">
    <h3 class="text-lg font-medium text-gray-900 dark:text-white mb-6">Storage Requirements</h3>
    <div class="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
      <div>
        <dt class="text-sm font-medium text-gray-500 dark:text-gray-400">Estimated Volume</dt>
        <dd class="mt-1 text-lg font-semibold text-gray-900 dark:text-white">{{ request.estimatedVolume }} m³</dd>
      </div>
      <div>
        <dt class="text-sm font-medium text-gray-500 dark:text-gray-400">Estimated Weight</dt>
        <dd class="mt-1 text-lg font-semibold text-gray-900 dark:text-white">{{ request.estimatedWeight }} kg</dd>
      </div>
      <div>
        <dt class="text-sm font-medium text-gray-500 dark:text-gray-400">Storage Duration</dt>
        <dd class="mt-1 text-lg font-semibold text-gray-900 dark:text-white">
          {{ request.estimatedStorageDuration.value }} {{ request.estimatedStorageDuration.unit }}
        </dd>
      </div>
      <div>
        <dt class="text-sm font-medium text-gray-500 dark:text-gray-400">Security Level</dt>
        <dd class="mt-1 text-lg font-semibold text-gray-900 dark:text-white">{{ formatEnum(request.securityLevel) }}</dd>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { WarehousingRequest } from './warehousing-request-details.model'
import { formatEnum } from '~/lib/utils/formatters'

defineProps<{ request: WarehousingRequest }>()
</script>
