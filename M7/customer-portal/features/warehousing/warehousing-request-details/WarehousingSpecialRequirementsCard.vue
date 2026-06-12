<template>
  <div class="card p-6">
    <h3 class="text-lg font-medium text-gray-900 dark:text-white mb-6">Special Requirements</h3>
    <div class="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
      <div>
        <dt class="text-sm font-medium text-gray-500 dark:text-gray-400">Temperature Control</dt>
        <dd class="mt-1 text-sm text-gray-900 dark:text-white">
          <span :class="request.requiresTemperatureControl ? 'text-green-600 dark:text-green-400' : 'text-gray-500 dark:text-gray-400'">
            {{ request.requiresTemperatureControl ? 'Required' : 'Not required' }}
          </span>
        </dd>
      </div>
      <div>
        <dt class="text-sm font-medium text-gray-500 dark:text-gray-400">Humidity Control</dt>
        <dd class="mt-1 text-sm text-gray-900 dark:text-white">
          <span :class="request.requiresHumidityControl ? 'text-green-600 dark:text-green-400' : 'text-gray-500 dark:text-gray-400'">
            {{ request.requiresHumidityControl ? 'Required' : 'Not required' }}
          </span>
        </dd>
      </div>
      <div>
        <dt class="text-sm font-medium text-gray-500 dark:text-gray-400">Special Handling</dt>
        <dd class="mt-1 text-sm text-gray-900 dark:text-white">
          <span :class="request.requiresSpecialHandling ? 'text-green-600 dark:text-green-400' : 'text-gray-500 dark:text-gray-400'">
            {{ request.requiresSpecialHandling ? 'Required' : 'Not required' }}
          </span>
        </dd>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { WarehousingRequest } from './warehousing-request-details.model'

defineProps<{ request: WarehousingRequest }>()
</script>
