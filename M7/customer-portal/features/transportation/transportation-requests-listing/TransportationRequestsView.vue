<template>
  <div>

    <!-- Filters -->
    <TransportationRequestsFilters
      :filters="filters"
      @update:filters="updateFilters"
      @clear-filters="clearFilters"
    />

    <!-- Data Table -->
    <TransportationRequestsDataTable :filters="filters" />
  </div>
</template>

<script setup lang="ts">
import TransportationRequestsFilters from './TransportationRequestsFilters.vue'
import TransportationRequestsDataTable from './TransportationRequestsDataTable.vue'
import { useTransportationFilters } from './use-transportation-filters'

const { filters, updateFilters, clearFilters } = useTransportationFilters()
</script>
