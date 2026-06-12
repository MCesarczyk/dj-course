<template>
  <div class="card p-6">
    <h3 class="text-lg font-medium text-gray-900 dark:text-white mb-6">
      Request Timeline
    </h3>
    <Timeline :items="items" :prefix="prefix" />
  </div>
</template>

<script setup lang="ts">
import Timeline from './Timeline.vue'

interface TimelineItem {
  id: string
  timestamp: Date
  status: string
  location?: string
  description: string
  estimatedTime?: Date | string
  actualTime?: Date | string
}

withDefaults(defineProps<{ items: TimelineItem[]; prefix?: string }>(), {
  prefix: undefined
})
</script>
