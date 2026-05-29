<template>
  <div class="card p-6">
    <h3 class="text-lg font-medium text-gray-900 dark:text-white mb-6">Cargo Information</h3>
    <div class="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
      <div class="sm:col-span-2 lg:col-span-3">
        <dt class="text-sm font-medium text-gray-500 dark:text-gray-400">Description</dt>
        <dd class="mt-1 text-sm text-gray-900 dark:text-white">{{ request.cargo.description }}</dd>
      </div>
      <div>
        <dt class="text-sm font-medium text-gray-500 dark:text-gray-400">Cargo Type</dt>
        <dd class="mt-1 text-sm text-gray-900 dark:text-white">{{ formatEnum(request.cargo.cargoType) }}</dd>
      </div>
      <div>
        <dt class="text-sm font-medium text-gray-500 dark:text-gray-400">Packaging</dt>
        <dd class="mt-1 text-sm text-gray-900 dark:text-white">{{ formatEnum(request.cargo.packaging) }}</dd>
      </div>
      <div>
        <dt class="text-sm font-medium text-gray-500 dark:text-gray-400">Quantity</dt>
        <dd class="mt-1 text-sm text-gray-900 dark:text-white">{{ request.cargo.quantity }} {{ request.cargo.unitType }}</dd>
      </div>
      <div>
        <dt class="text-sm font-medium text-gray-500 dark:text-gray-400">Value</dt>
        <dd class="mt-1 text-sm text-gray-900 dark:text-white">€{{ request.cargo.value?.toLocaleString() || 'Not specified' }}</dd>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { WarehousingRequest } from './warehousing-request-details.model'
import { formatEnum } from '~/lib/utils/formatters'

defineProps<{ request: WarehousingRequest }>()
</script>
