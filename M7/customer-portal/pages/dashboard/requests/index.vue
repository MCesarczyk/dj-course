<template>
    <div>
        <ServiceRequestsHeader />

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
import ServiceRequestsHeader from "~/features/service-requests/ServiceRequestsHeader.vue";
import Tabs from "~/components/ui-library/tabs/Tabs.vue";
import TransportationRequestsListing from "~/features/transportation/transportation-requests-listing/TransportationRequestsPage.vue";
import WarehousingRequestsPage from "~/features/warehousing/warehousing-requests-listing/WarehousingRequestsPage.vue";
import {
    SERVICE_REQUESTS_TABS,
    useServiceRequestsTab,
} from "~/features/service-requests/use-service-requests-tab";

definePageMeta({
    layout: "dashboard",
    middleware: "auth",
});

const { activeTab, onTabChange } = useServiceRequestsTab();
</script>
