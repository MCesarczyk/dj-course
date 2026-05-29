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
      :current-page="currentPage"
      :items-per-page="itemsPerPage"
      @previous-page="previousPage"
      @next-page="nextPage"
      @go-to-page="goToPage"
    />
  </div>
</template>

<script setup lang="ts">
import WarehousingRequestsFilters from './WarehousingRequestsFilters.vue'
import WarehousingRequestsTable from './WarehousingRequestsTable.vue'
import { useWarehousingFilters } from './use-warehousing-filters'
import { useWarehousingPagination } from './use-warehousing-pagination'

const { filters, updateFilters: onFiltersUpdate } = useWarehousingFilters()
const { currentPage, itemsPerPage, previousPage, nextPage, goToPage, resetPage } = useWarehousingPagination()

watch(filters, () => resetPage(), { deep: true })
</script> 