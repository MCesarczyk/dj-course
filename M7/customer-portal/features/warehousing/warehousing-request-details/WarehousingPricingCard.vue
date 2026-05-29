<template>
  <div class="card p-6">
    <h3 class="text-lg font-medium text-gray-900 dark:text-white mb-6">Pricing Information</h3>
    <div class="grid grid-cols-1 gap-6 sm:grid-cols-4">
      <div>
        <dt class="text-sm font-medium text-gray-500 dark:text-gray-400">Estimated Cost</dt>
        <dd class="mt-1 text-lg font-semibold text-gray-900 dark:text-white">
          <span v-if="request.estimatedCost">€{{ request.estimatedCost.toLocaleString() }}</span>
          <span v-else>Pending quote</span>
        </dd>
      </div>
      <div>
        <dt class="text-sm font-medium text-gray-500 dark:text-gray-400">Final Cost</dt>
        <dd class="mt-1 text-lg font-semibold text-gray-900 dark:text-white">
          <span v-if="request.finalCost">€{{ request.finalCost.toLocaleString() }}</span>
          <span v-else>Not finalized</span>
        </dd>
      </div>
      <div>
        <dt class="text-sm font-medium text-gray-500 dark:text-gray-400">Billing Type</dt>
        <dd class="mt-1 text-lg font-semibold text-gray-900 dark:text-white">{{ formatEnum(request.billingType) }}</dd>
      </div>
      <div>
        <dt class="text-sm font-medium text-gray-500 dark:text-gray-400">Currency</dt>
        <dd class="mt-1 text-lg font-semibold text-gray-900 dark:text-white">{{ request.currency }}</dd>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { WarehousingRequest } from './warehousing-request-details.model'
import { formatEnum } from '~/lib/utils/formatters'

defineProps<{ request: WarehousingRequest }>()
</script>
