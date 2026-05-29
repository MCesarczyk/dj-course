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
          Transportation Request {{ requestId }}
        </h1>
        <p class="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Detailed view of your transportation request
        </p>
      </div>
      <div class="flex space-x-3">
        <button
          v-if="request?.trackingNumber"
          @click="trackShipment"
          class="btn-outline"
        >
          <MapIcon class="w-5 h-5 mr-2" />
          Track Shipment
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

    <LoadingState v-if="isLoading" message="Loading request details..." />

    <ErrorState
      v-else-if="isError"
      title="Error Loading Request"
      message="There was a problem loading the transportation request details."
      @retry="refetch"
    />

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
            <dt class="text-sm font-medium text-gray-500 dark:text-gray-400">Service Type</dt>
            <dd class="mt-1 text-sm text-gray-900 dark:text-white">{{ formatEnum(request.serviceType) }}</dd>
          </div>
          <div>
            <dt class="text-sm font-medium text-gray-500 dark:text-gray-400">Priority</dt>
            <dd class="mt-1 text-sm text-gray-900 dark:text-white">{{ formatEnum(request.priority) }}</dd>
          </div>
          <div>
            <dt class="text-sm font-medium text-gray-500 dark:text-gray-400">Tracking Number</dt>
            <dd class="mt-1 text-sm text-gray-900 dark:text-white">{{ request.trackingNumber || 'Not assigned' }}</dd>
          </div>
        </div>
      </div>

      <!-- Route Information -->
      <div class="card p-6">
        <h3 class="text-lg font-medium text-gray-900 dark:text-white mb-6">
          Route Information
        </h3>
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

      <!-- Cargo Information -->
      <div class="card p-6">
        <h3 class="text-lg font-medium text-gray-900 dark:text-white mb-6">
          Cargo Information
        </h3>
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

      <!-- Timeline -->
      <RequestTimelineCard :items="request.progressUpdates" />

      <!-- Pricing Information -->
      <div class="card p-6">
        <h3 class="text-lg font-medium text-gray-900 dark:text-white mb-6">
          Pricing Information
        </h3>
        <div class="grid grid-cols-1 gap-6 sm:grid-cols-3">
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
            <dt class="text-sm font-medium text-gray-500 dark:text-gray-400">Currency</dt>
            <dd class="mt-1 text-lg font-semibold text-gray-900 dark:text-white">{{ request.currency }}</dd>
          </div>
        </div>
      </div>
    </div>

    <NotFoundState
      v-else-if="!isLoading"
      title="Request Not Found"
      message="The transportation request you're looking for doesn't exist or you don't have permission to view it."
      back-to="/dashboard/requests"
      back-label="Back to Requests"
    />
  </div>
</template>

<script setup lang="ts">
import {
  ArrowLeftIcon,
  MapIcon,
  DocumentArrowDownIcon
} from '@heroicons/vue/24/outline'
import { useTransportationRequestDetails } from '~/features/transportation/transportation-request-details/transportation-request-details-api'
import type { TransportationRequest } from '~/features/transportation/transportation-request-details/transportation-request-details.model'
import LoadingState from '~/components/ui-library/states/LoadingState.vue'
import ErrorState from '~/components/ui-library/states/ErrorState.vue'
import NotFoundState from '~/components/ui-library/states/NotFoundState.vue'
import RequestTimelineCard from '~/components/ui-library/timeline/RequestTimelineCard.vue'
import { formatEnum } from '~/lib/utils/formatters'
import { getStatusColor } from '~/lib/utils/statusColors'
import { useTransportationRequestPdf } from './use-transportation-request-pdf'

const route = useRoute()
const requestId = route.params.id as string

// Use TanStack Query composable
const { data: request, isLoading, isError, refetch } = useTransportationRequestDetails(requestId)

const { isLoading: pdfLoading, download: downloadPDF } = useTransportationRequestPdf(request)

const trackShipment = () => {
  if (request.value?.trackingNumber) {
    navigateTo(`/dashboard/tracking?number=${request.value.trackingNumber}`)
  }
}
</script>