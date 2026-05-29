<template>
  <div>
    <div class="mb-8 flex items-center justify-between">
      <div>
        <div class="flex items-center space-x-4 mb-2">
          <NuxtLink
            to="/dashboard/requests"
            class="text-success-600 hover:text-success-500 dark:text-success-400 flex items-center"
          >
            <ArrowLeftIcon class="w-5 h-5 mr-1" />
            Back to Requests
          </NuxtLink>
        </div>
        <h1 class="text-2xl font-bold text-gray-900 dark:text-white">
          Warehousing Request {{ requestId }}
        </h1>
        <p class="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Detailed view of your warehousing request
        </p>
      </div>
      <div class="flex space-x-3">
        <button class="btn-outline">
          <CubeIcon class="w-5 h-5 mr-2" />
          View Inventory
        </button>
        <button
          v-if="request"
          @click="downloadPDF"
          :disabled="pdfLoading"
          class="btn-primary"
        >
          <DocumentArrowDownIcon class="w-5 h-5 mr-2" />
          <span v-if="!pdfLoading">Download PDF</span>
          <span v-else>Generating PDF...</span>
        </button>
      </div>
    </div>

    <!-- Loading State -->
    <div v-if="isLoading" class="card p-8 text-center">
      <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
      <p class="text-gray-500 dark:text-gray-400">Loading request details...</p>
    </div>

    <!-- Error State -->
    <div v-else-if="isError" class="card p-8 text-center">
      <div class="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-red-100 dark:bg-red-900 mb-4">
        <ExclamationTriangleIcon class="h-8 w-8 text-red-600 dark:text-red-400" />
      </div>
      <h3 class="text-lg font-medium text-gray-900 dark:text-white mb-2">
        Error Loading Request
      </h3>
      <p class="text-gray-500 dark:text-gray-400 mb-4">
        There was a problem loading the warehousing request details.
      </p>
      <button 
        @click="() => refetch()" 
        class="btn-primary"
      >
        Try Again
      </button>
    </div>

    <div v-else-if="request" class="space-y-8">
      <!-- Request Overview -->
      <div class="card p-6">
        <div class="flex items-center justify-between mb-6">
          <h2 class="text-lg font-medium text-gray-900 dark:text-white">
            Request Overview
          </h2>
          <span
            :class="[
              'inline-flex items-center px-3 py-1 rounded-full text-sm font-medium',
              getStatusColor(request.status)
            ]"
          >
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

      <!-- Storage Requirements -->
      <div class="card p-6">
        <h3 class="text-lg font-medium text-gray-900 dark:text-white mb-6">
          Storage Requirements
        </h3>
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

      <!-- Cargo Information -->
      <div class="card p-6">
        <h3 class="text-lg font-medium text-gray-900 dark:text-white mb-6">
          Cargo Information
        </h3>
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

      <!-- Special Requirements -->
      <div class="card p-6">
        <h3 class="text-lg font-medium text-gray-900 dark:text-white mb-6">
          Special Requirements
        </h3>
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

      <!-- Services -->
      <div class="grid grid-cols-1 gap-8 lg:grid-cols-2">
        <!-- Handling Services -->
        <div class="card p-6">
          <h3 class="text-lg font-medium text-gray-900 dark:text-white mb-4">
            Handling Services
          </h3>
          <div class="space-y-2">
            <div
              v-for="service in request.handlingServices"
              :key="service"
              class="flex items-center"
            >
              <CheckIcon class="w-4 h-4 text-green-500 mr-2" />
              <span class="text-sm text-gray-900 dark:text-white">{{ formatEnum(service) }}</span>
            </div>
            <div v-if="request.handlingServices.length === 0" class="text-sm text-gray-500 dark:text-gray-400">
              No additional handling services requested
            </div>
          </div>
        </div>

        <!-- Value-Added Services -->
        <div class="card p-6">
          <h3 class="text-lg font-medium text-gray-900 dark:text-white mb-4">
            Value-Added Services
          </h3>
          <div class="space-y-2">
            <div
              v-for="service in request.valueAddedServices"
              :key="service"
              class="flex items-center"
            >
              <CheckIcon class="w-4 h-4 text-green-500 mr-2" />
              <span class="text-sm text-gray-900 dark:text-white">{{ formatEnum(service) }}</span>
            </div>
            <div v-if="request.valueAddedServices.length === 0" class="text-sm text-gray-500 dark:text-gray-400">
              No value-added services requested
            </div>
          </div>
        </div>
      </div>

      <!-- Timeline -->
      <div class="card p-6">
        <h3 class="text-lg font-medium text-gray-900 dark:text-white mb-6">
          Request Timeline
        </h3>
        <Timeline :items="request.progressUpdates" prefix="at" />
      </div>

      <!-- Pricing Information -->
      <div class="card p-6">
        <h3 class="text-lg font-medium text-gray-900 dark:text-white mb-6">
          Pricing Information
        </h3>
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
    </div>

    <div v-else-if="!isLoading" class="card p-8 text-center">
      <h3 class="text-lg font-medium text-gray-900 dark:text-white mb-2">
        Request Not Found
      </h3>
      <p class="text-gray-500 dark:text-gray-400 mb-4">
        The warehousing request you're looking for doesn't exist or you don't have permission to view it.
      </p>
      <NuxtLink
        to="/dashboard/requests"
        class="btn-primary"
      >
        Back to Requests
      </NuxtLink>
    </div>
  </div>
</template>

<script setup lang="ts">
import {
  ArrowLeftIcon,
  CubeIcon,
  DocumentArrowDownIcon,
  CheckIcon,
  ExclamationTriangleIcon
} from '@heroicons/vue/24/outline'
import { useWarehousingRequestDetails } from '~/features/warehousing/warehousing-request-details/warehousing-request-details-api'
import type { WarehousingRequest } from '~/features/warehousing/warehousing-request-details/warehousing-request-details.model'
import Timeline from '~/components/ui-library/timeline/Timeline.vue'
import { formatEnum } from '~/lib/utils/formatters'
import { getStatusColor } from '~/lib/utils/statusColors'

const route = useRoute()
const requestId = route.params.id as string
const pdfLoading = ref(false)

// Use TanStack Query composable
const { data: request, isLoading, isError, refetch } = useWarehousingRequestDetails(requestId)

const downloadPDF = async () => {
  if (!request.value) return
  
  // Only run on client side
  if (process.server) return
  
  pdfLoading.value = true
  
  try {
    // Dynamically import PDF generator only on client side
    const { PDFGenerator } = await import('~/lib/pdf/pdfGenerator')
    
    // Small delay to show loading state
    await new Promise(resolve => setTimeout(resolve, 500))
    
    await PDFGenerator.generateWarehousingRequestPDF(request.value)
  } catch (error) {
    console.error('Error generating PDF:', error)
    alert('Error generating PDF. Please try again.')
  } finally {
    pdfLoading.value = false
  }
}
</script>