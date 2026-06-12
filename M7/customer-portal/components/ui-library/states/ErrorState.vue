<template>
  <div class="card p-8 text-center">
    <div class="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-red-100 dark:bg-red-900 mb-4">
      <ExclamationTriangleIcon class="h-8 w-8 text-red-600 dark:text-red-400" />
    </div>
    <h3 class="text-lg font-medium text-gray-900 dark:text-white mb-2">{{ title }}</h3>
    <p class="text-gray-500 dark:text-gray-400 mb-4">{{ message }}</p>
    <button @click="emit('retry')" class="btn-primary">Try Again</button>
  </div>
</template>

<script setup lang="ts">
import { ExclamationTriangleIcon } from '@heroicons/vue/24/outline'

withDefaults(defineProps<{ title?: string; message?: string }>(), {
  title: 'Error',
  message: 'Something went wrong. Please try again.'
})

const emit = defineEmits<{ retry: [] }>()
</script>
