<template>
  <div class="card p-8 text-center">
    <h3 class="text-lg font-medium text-gray-900 dark:text-white mb-2">{{ title }}</h3>
    <p class="text-gray-500 dark:text-gray-400 mb-4">{{ message }}</p>
    <NuxtLink :to="backTo" class="btn-primary">{{ backLabel }}</NuxtLink>
  </div>
</template>

<script setup lang="ts">
withDefaults(defineProps<{
  title?: string
  message?: string
  backTo?: string
  backLabel?: string
}>(), {
  title: 'Not Found',
  message: 'The item you are looking for could not be found.',
  backTo: '/',
  backLabel: 'Go Back'
})
</script>
