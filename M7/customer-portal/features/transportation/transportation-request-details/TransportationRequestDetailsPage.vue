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
      <TransportationRequestOverviewCard :request="request" />
      <TransportationRouteCard :request="request" />
      <TransportationCargoCard :request="request" />
      <RequestTimelineCard :items="request.progressUpdates" />
      <TransportationPricingCard :request="request" />
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
import TransportationRequestOverviewCard from './TransportationRequestOverviewCard.vue'
import TransportationRouteCard from './TransportationRouteCard.vue'
import TransportationCargoCard from './TransportationCargoCard.vue'
import TransportationPricingCard from './TransportationPricingCard.vue'
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