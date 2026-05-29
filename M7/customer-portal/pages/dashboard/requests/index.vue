<template>
  <div>
    <!-- Page Header -->
    <div class="mb-8 flex items-center justify-between">
      <div>
        <h1 class="text-2xl font-bold text-gray-900 dark:text-white">
          Service Requests
        </h1>
        <p class="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Manage your transportation and warehousing requests
        </p>
      </div>
    </div>

    <!-- Tabs -->
    <Tabs
      :tabs="SERVICE_REQUESTS_TABS"
      :default-tab="activeTab"
      @tab-change="onTabChange"
    >
      <!-- Transportation Requests Tab Content -->
      <template #transportation>
        <TransportationRequestsListing />
      </template>

      <!-- Warehousing Requests Tab Content -->
      <template #warehousing>
        <WarehousingRequestsPage />
      </template>
    </Tabs>
  </div>
</template>

<script setup lang="ts">
import Tabs from '~/components/ui-library/tabs/Tabs.vue'
import TransportationRequestsListing from '~/features/transportation/transportation-requests-listing/TransportationRequestsPage.vue'
import WarehousingRequestsPage from '~/features/warehousing/warehousing-requests-listing/WarehousingRequestsPage.vue'
import { SERVICE_REQUESTS_TABS, useServiceRequestsTab } from '~/features/service-requests/use-service-requests-tab'

definePageMeta({
  layout: 'dashboard',
  middleware: 'auth'
})

const { activeTab, onTabChange } = useServiceRequestsTab()
</script>
