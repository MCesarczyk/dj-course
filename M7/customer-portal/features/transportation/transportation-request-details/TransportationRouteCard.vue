<template>
  <div class="card p-6">
    <h3 class="text-lg font-medium text-gray-900 dark:text-white mb-6">Route Information</h3>
    <div class="grid grid-cols-1 gap-8 md:grid-cols-2">
      <div>
        <h4 class="text-md font-medium text-gray-900 dark:text-white mb-4 flex items-center">
          <div class="w-3 h-3 bg-green-500 rounded-full mr-2"></div>
          Pickup Location
        </h4>
        <div class="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
          <div class="space-y-2 text-sm">
            <p class="font-medium text-gray-900 dark:text-white">{{ request.pickupLocation.address.street }}</p>
            <p class="text-gray-600 dark:text-gray-300">{{ request.pickupLocation.address.city }}, {{ request.pickupLocation.address.country }}</p>
            <div class="border-t border-gray-200 dark:border-gray-600 pt-2 mt-2">
              <p class="text-gray-600 dark:text-gray-300">Contact: {{ request.pickupLocation.contactPerson }}</p>
              <p class="text-gray-600 dark:text-gray-300">Phone: {{ request.pickupLocation.contactPhone }}</p>
            </div>
          </div>
        </div>
      </div>
      <div>
        <h4 class="text-md font-medium text-gray-900 dark:text-white mb-4 flex items-center">
          <div class="w-3 h-3 bg-red-500 rounded-full mr-2"></div>
          Delivery Location
        </h4>
        <div class="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
          <div class="space-y-2 text-sm">
            <p class="font-medium text-gray-900 dark:text-white">{{ request.deliveryLocation.address.street }}</p>
            <p class="text-gray-600 dark:text-gray-300">{{ request.deliveryLocation.address.city }}, {{ request.deliveryLocation.address.country }}</p>
            <div class="border-t border-gray-200 dark:border-gray-600 pt-2 mt-2">
              <p class="text-gray-600 dark:text-gray-300">Contact: {{ request.deliveryLocation.contactPerson }}</p>
              <p class="text-gray-600 dark:text-gray-300">Phone: {{ request.deliveryLocation.contactPhone }}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { TransportationRequest } from './transportation-request-details.model'

defineProps<{ request: TransportationRequest }>()
</script>
