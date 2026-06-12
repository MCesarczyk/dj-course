<template>
  <div class="card p-6">
    <h3 class="text-lg font-medium text-gray-900 dark:text-white mb-6">Cargo Information</h3>
    <div class="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
      <div>
        <dt class="text-sm font-medium text-gray-500 dark:text-gray-400">Description</dt>
        <dd class="mt-1 text-sm text-gray-900 dark:text-white">{{ request.cargo.description }}</dd>
      </div>
      <div>
        <dt class="text-sm font-medium text-gray-500 dark:text-gray-400">Weight</dt>
        <dd class="mt-1 text-sm text-gray-900 dark:text-white">{{ request.cargo.weight }} kg</dd>
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
      <div>
        <dt class="text-sm font-medium text-gray-500 dark:text-gray-400">Special Handling</dt>
        <dd class="mt-1 text-sm text-gray-900 dark:text-white">
          <div class="flex flex-wrap gap-2">
            <span v-if="request.cargo.fragile" class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200">
              Fragile
            </span>
            <span v-if="request.requiresInsurance" class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
              Insured
            </span>
            <span v-if="!request.cargo.fragile && !request.requiresInsurance" class="text-gray-500 dark:text-gray-400">
              None
            </span>
          </div>
        </dd>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { TransportationRequest } from './transportation-request-details.model'
import { formatEnum } from '~/lib/utils/formatters'

defineProps<{ request: TransportationRequest }>()
</script>
