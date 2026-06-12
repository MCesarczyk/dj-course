<template>
  <div>
    <div class="mb-8 flex items-center justify-between">
      <div>
        <div class="flex items-center space-x-4 mb-2">
          <NuxtLink
            :to="`/dashboard/requests?tab=${type}`"
            class="text-success-600 hover:text-success-500 dark:text-success-400 flex items-center"
          >
            <ArrowLeftIcon class="w-5 h-5 mr-1" />
            Back to Requests
          </NuxtLink>
        </div>
        <h1 class="text-2xl font-bold text-gray-900 dark:text-white">
          {{ requestLabel }} Request {{ requestId }}
        </h1>
        <p class="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Detailed view of your {{ requestLabel.toLowerCase() }} request
        </p>
      </div>
      <div class="flex space-x-3">
        <button
          v-if="isTransportation && transportationRequest?.trackingNumber"
          @click="trackShipment"
          class="btn-outline"
        >
          <MapIcon class="w-5 h-5 mr-2" />
          Track Shipment
        </button>
        <button v-if="isWarehousing" class="btn-outline">
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

    <LoadingState v-if="isLoading" message="Loading request details..." />

    <ErrorState
      v-else-if="isError"
      title="Error Loading Request"
      :message="`There was a problem loading the ${requestLabel.toLowerCase()} request details.`"
      @retry="refetch"
    />

    <div v-else-if="isTransportation && transportationRequest" class="space-y-8">
      <TransportationRequestOverviewCard :request="transportationRequest" />
      <TransportationRouteCard :request="transportationRequest" />
      <TransportationCargoCard :request="transportationRequest" />
      <RequestTimelineCard :items="transportationRequest.progressUpdates" />
      <TransportationPricingCard :request="transportationRequest" />
    </div>

    <div v-else-if="isWarehousing && warehousingRequest" class="space-y-8">
      <WarehousingRequestOverviewCard :request="warehousingRequest" />
      <WarehousingStorageRequirementsCard :request="warehousingRequest" />
      <WarehousingCargoCard :request="warehousingRequest" />
      <WarehousingSpecialRequirementsCard :request="warehousingRequest" />
      <WarehousingServicesCard :request="warehousingRequest" />
      <RequestTimelineCard :items="warehousingRequest.progressUpdates" prefix="at" />
      <WarehousingPricingCard :request="warehousingRequest" />
    </div>

    <NotFoundState
      v-else-if="!isLoading"
      title="Request Not Found"
      :message="`The ${requestLabel.toLowerCase()} request you're looking for doesn't exist or you don't have permission to view it.`"
      back-to="/dashboard/requests"
      back-label="Back to Requests"
    />
  </div>
</template>

<script setup lang="ts">
import {
  ArrowLeftIcon,
  MapIcon,
  CubeIcon,
  DocumentArrowDownIcon
} from '@heroicons/vue/24/outline'
import { useTransportationRequestDetails } from '~/features/transportation/transportation-request-details/transportation-request-details-api'
import { useWarehousingRequestDetails } from '~/features/warehousing/warehousing-request-details/warehousing-request-details-api'
import LoadingState from '~/components/ui-library/states/LoadingState.vue'
import ErrorState from '~/components/ui-library/states/ErrorState.vue'
import NotFoundState from '~/components/ui-library/states/NotFoundState.vue'
import RequestTimelineCard from '~/components/ui-library/timeline/RequestTimelineCard.vue'
import TransportationRequestOverviewCard from '~/features/transportation/transportation-request-details/TransportationRequestOverviewCard.vue'
import TransportationRouteCard from '~/features/transportation/transportation-request-details/TransportationRouteCard.vue'
import TransportationCargoCard from '~/features/transportation/transportation-request-details/TransportationCargoCard.vue'
import TransportationPricingCard from '~/features/transportation/transportation-request-details/TransportationPricingCard.vue'
import WarehousingRequestOverviewCard from '~/features/warehousing/warehousing-request-details/WarehousingRequestOverviewCard.vue'
import WarehousingStorageRequirementsCard from '~/features/warehousing/warehousing-request-details/WarehousingStorageRequirementsCard.vue'
import WarehousingCargoCard from '~/features/warehousing/warehousing-request-details/WarehousingCargoCard.vue'
import WarehousingSpecialRequirementsCard from '~/features/warehousing/warehousing-request-details/WarehousingSpecialRequirementsCard.vue'
import WarehousingServicesCard from '~/features/warehousing/warehousing-request-details/WarehousingServicesCard.vue'
import WarehousingPricingCard from '~/features/warehousing/warehousing-request-details/WarehousingPricingCard.vue'
import { useTransportationRequestPdf } from '~/features/transportation/transportation-request-details/use-transportation-request-pdf'
import { useWarehousingRequestPdf } from '~/features/warehousing/warehousing-request-details/use-warehousing-request-pdf'

definePageMeta({
  layout: 'dashboard',
  middleware: 'auth'
})

const route = useRoute()
const requestId = route.params.id as string
const type = route.params.type as 'transportation' | 'warehousing'
const isTransportation = type === 'transportation'
const isWarehousing = type === 'warehousing'
const requestLabel = isTransportation ? 'Transportation' : 'Warehousing'

const { data: transportationRequest, isLoading: tLoading, isError: tError, refetch: tRefetch } =
  useTransportationRequestDetails(isTransportation ? requestId : '')
const { data: warehousingRequest, isLoading: wLoading, isError: wError, refetch: wRefetch } =
  useWarehousingRequestDetails(isWarehousing ? requestId : '')

const isLoading = computed(() => isTransportation ? tLoading.value : wLoading.value)
const isError = computed(() => isTransportation ? tError.value : wError.value)
const refetch = () => { isTransportation ? tRefetch() : wRefetch() }
const request = computed(() => isTransportation ? transportationRequest.value : warehousingRequest.value)

const { isLoading: tPdfLoading, download: downloadTransportationPDF } = useTransportationRequestPdf(transportationRequest)
const { isLoading: wPdfLoading, download: downloadWarehousingPDF } = useWarehousingRequestPdf(warehousingRequest)

const pdfLoading = computed(() => isTransportation ? tPdfLoading.value : wPdfLoading.value)
const downloadPDF = () => { isTransportation ? downloadTransportationPDF() : downloadWarehousingPDF() }

const trackShipment = () => {
  if (transportationRequest.value?.trackingNumber) {
    navigateTo(`/dashboard/tracking?number=${transportationRequest.value.trackingNumber}`)
  }
}
</script>
