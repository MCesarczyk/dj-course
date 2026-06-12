<template>
  <div class="card p-6">
    <div class="flex items-center justify-between mb-6">
      <h2 class="text-lg font-medium text-gray-900 dark:text-white">Request Overview</h2>
      <span :class="['inline-flex items-center px-3 py-1 rounded-full text-sm font-medium', getStatusColor(request.status)]">
        {{ formatEnum(request.status) }}
      </span>
    </div>
    <div class="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
      <div>
        <dt class="text-sm font-medium text-gray-500 dark:text-gray-400">Request Number</dt>
        <dd class="mt-1 text-sm text-gray-900 dark:text-white">{{ request.requestNumber }}</dd>
      </div>
      <div>
        <dt class="text-sm font-medium text-gray-500 dark:text-gray-400">Storage Type</dt>
        <dd class="mt-1 text-sm text-gray-900 dark:text-white">{{ formatEnum(request.storageType) }}</dd>
      </div>
      <div>
        <dt class="text-sm font-medium text-gray-500 dark:text-gray-400">Priority</dt>
        <dd class="mt-1 text-sm text-gray-900 dark:text-white">{{ formatEnum(request.priority) }}</dd>
      </div>
      <div>
        <dt class="text-sm font-medium text-gray-500 dark:text-gray-400">Storage Location</dt>
        <dd class="mt-1 text-sm text-gray-900 dark:text-white">{{ request.storageLocation || 'Not assigned' }}</dd>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { WarehousingRequest } from './warehousing-request-details.model'
import { formatEnum } from '~/lib/utils/formatters'
import { getStatusColor } from '~/lib/utils/statusColors'

defineProps<{ request: WarehousingRequest }>()
</script>
