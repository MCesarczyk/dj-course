<template>
  <ServiceRequestsPage />
</template>

<script setup lang="ts">
import ServiceRequestsPage from '~/features/service-requests/ServiceRequestsPage.vue'

definePageMeta({
  layout: 'dashboard',
  middleware: 'auth'
})
</script>
