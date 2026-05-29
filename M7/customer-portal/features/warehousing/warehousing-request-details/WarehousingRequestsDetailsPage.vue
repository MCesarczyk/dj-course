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

    <LoadingState v-if="isLoading" message="Loading request details..." />

    <ErrorState
      v-else-if="isError"
      title="Error Loading Request"
      message="There was a problem loading the warehousing request details."
      @retry="refetch"
    />

    <div v-else-if="request" class="space-y-8">
      <WarehousingRequestOverviewCard :request="request" />
      <WarehousingStorageRequirementsCard :request="request" />
      <WarehousingCargoCard :request="request" />
      <WarehousingSpecialRequirementsCard :request="request" />
      <WarehousingServicesCard :request="request" />
      <RequestTimelineCard :items="request.progressUpdates" prefix="at" />
      <WarehousingPricingCard :request="request" />
    </div>

    <NotFoundState
      v-else-if="!isLoading"
      title="Request Not Found"
      message="The warehousing request you're looking for doesn't exist or you don't have permission to view it."
      back-to="/dashboard/requests"
      back-label="Back to Requests"
    />
  </div>
</template>

<script setup lang="ts">
import {
  ArrowLeftIcon,
  CubeIcon,
  DocumentArrowDownIcon
} from '@heroicons/vue/24/outline'
import { useWarehousingRequestDetails } from '~/features/warehousing/warehousing-request-details/warehousing-request-details-api'
import type { WarehousingRequest } from '~/features/warehousing/warehousing-request-details/warehousing-request-details.model'
import LoadingState from '~/components/ui-library/states/LoadingState.vue'
import ErrorState from '~/components/ui-library/states/ErrorState.vue'
import NotFoundState from '~/components/ui-library/states/NotFoundState.vue'
import RequestTimelineCard from '~/components/ui-library/timeline/RequestTimelineCard.vue'
import WarehousingRequestOverviewCard from './WarehousingRequestOverviewCard.vue'
import WarehousingStorageRequirementsCard from './WarehousingStorageRequirementsCard.vue'
import WarehousingCargoCard from './WarehousingCargoCard.vue'
import WarehousingSpecialRequirementsCard from './WarehousingSpecialRequirementsCard.vue'
import WarehousingServicesCard from './WarehousingServicesCard.vue'
import WarehousingPricingCard from './WarehousingPricingCard.vue'
import { useWarehousingRequestPdf } from './use-warehousing-request-pdf'

const route = useRoute()
const requestId = route.params.id as string

// Use TanStack Query composable
const { data: request, isLoading, isError, refetch } = useWarehousingRequestDetails(requestId)

const { isLoading: pdfLoading, download: downloadPDF } = useWarehousingRequestPdf(request)
</script>