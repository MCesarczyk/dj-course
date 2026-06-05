<template>
    <div>
        <ServiceRequestsHeader />

        <!-- Stats widget -->
        <ServiceRequestsStats />

        <!-- Tabs -->
        <Tabs
            :tabs="SERVICE_REQUESTS_TABS"
            :default-tab="activeTab"
            @tab-change="onTabChange"
        >
            <!-- Transportation Requests Tab Content -->
            <template #transportation>
                <TransportationRequestsView />
            </template>

            <!-- Warehousing Requests Tab Content -->
            <template #warehousing>
                <WarehousingRequestsView />
            </template>
        </Tabs>
    </div>
</template>

<script setup lang="ts">
import ServiceRequestsHeader from "~/features/service-requests/ServiceRequestsHeader.vue";
import ServiceRequestsStats from "~/features/service-requests/ServiceRequestsStats.vue";
import Tabs from "~/components/ui-library/tabs/Tabs.vue";
import {
    SERVICE_REQUESTS_TABS,
    useServiceRequestsTab,
} from "~/features/service-requests/use-service-requests-tab";
import TransportationRequestsView from "~/features/transportation/transportation-requests-listing/TransportationRequestsView.vue";
import WarehousingRequestsView from "~/features/warehousing/warehousing-requests-listing/WarehousingRequestsView.vue";

definePageMeta({
    layout: "dashboard",
    middleware: "auth",
});

const { activeTab, onTabChange } = useServiceRequestsTab();
</script>
