<template>
  <div class="space-y-6">
    <!-- Filters -->
    <WarehousingRequestsFilters 
      :filters="filters"
      @update:filters="onFiltersUpdate"
    />

    <!-- Warehousing Requests Table -->
    <WarehousingRequestsTable 
      :filters="filters"
    />
  </div>
</template>

<script setup lang="ts">
import WarehousingRequestsFilters from './WarehousingRequestsFilters.vue'
import WarehousingRequestsTable from './WarehousingRequestsTable.vue'
import { useWarehousingFilters } from './use-warehousing-filters'

const { filters, updateFilters: onFiltersUpdate } = useWarehousingFilters()
</script> 