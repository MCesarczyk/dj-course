<template>
  <div class="card p-6 mb-6 animate-fade-in">
    <!-- Header -->
    <div class="flex items-center gap-3 mb-6">
      <div class="w-10 h-10 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center shrink-0">
        <BoltIcon class="w-5 h-5 text-pink-500" />
      </div>
      <div>
        <h2 class="text-lg font-bold text-gray-900 dark:text-white leading-tight">Today's Progress</h2>
        <p class="text-sm text-gray-500 dark:text-gray-400">Activity</p>
      </div>
    </div>

    <!-- Circular progress rings -->
    <div class="flex justify-around gap-2 mb-6">
      <div v-for="ring in rings" :key="ring.label" class="flex flex-col items-center gap-1.5">
        <div class="relative w-24 h-24">
          <svg class="w-full h-full" viewBox="0 0 100 100">
            <!-- Background track -->
            <circle
              cx="50" cy="50" r="38"
              fill="none"
              stroke-width="8"
              class="stroke-gray-200 dark:stroke-gray-700"
            />
            <!-- Colored progress arc -->
            <circle
              cx="50" cy="50" r="38"
              fill="none"
              :stroke="ring.color"
              stroke-width="8"
              stroke-linecap="round"
              :stroke-dasharray="CIRCUMFERENCE"
              :stroke-dashoffset="getOffset(ring.progress)"
              transform="rotate(-90 50 50)"
              style="transition: stroke-dashoffset 0.8s cubic-bezier(0.4, 0, 0.2, 1)"
            />
          </svg>
          <!-- Center value -->
          <div class="absolute inset-0 flex flex-col items-center justify-center text-center">
            <span class="text-xl font-bold text-gray-900 dark:text-white leading-none">{{ ring.value }}</span>
            <span class="text-xs text-gray-500 dark:text-gray-400 leading-none mt-0.5">{{ ring.unit }}</span>
          </div>
        </div>
        <span class="text-xs font-semibold text-gray-600 dark:text-gray-300 text-center">{{ ring.label }}</span>
        <span class="text-xs font-bold" :style="{ color: ring.color }">{{ ring.progress }}%</span>
      </div>
    </div>

    <!-- Divider -->
    <div class="h-px bg-gray-200 dark:bg-gray-700 mb-4" />

    <!-- Status breakdown header -->
    <div class="flex items-center justify-between mb-3">
      <div class="flex items-center gap-2">
        <ViewfinderCircleIcon class="w-4 h-4 text-gray-400" />
        <span class="text-sm font-semibold text-gray-900 dark:text-white">Status Breakdown</span>
      </div>
    </div>

    <!-- Status items list -->
    <div class="space-y-2">
      <div
        v-for="item in statusItems"
        :key="item.label"
        class="flex items-center gap-3 p-3 rounded-xl bg-gray-50 dark:bg-gray-800/60"
      >
        <!-- Circle indicator -->
        <div
          :class="[
            'w-6 h-6 rounded-full flex items-center justify-center shrink-0 transition-colors',
            item.done
              ? 'bg-green-500'
              : 'border-2 border-gray-300 dark:border-gray-600',
          ]"
        >
          <CheckIcon v-if="item.done" class="w-3.5 h-3.5 text-white" />
        </div>
        <!-- Label -->
        <span
          :class="[
            'text-sm flex-1',
            item.done
              ? 'text-gray-400 dark:text-gray-500 line-through'
              : 'text-gray-700 dark:text-gray-200',
          ]"
        >
          {{ item.label }}
        </span>
        <!-- Count -->
        <span
          class="text-sm font-bold"
          :style="{ color: item.done ? '#22c55e' : item.color }"
        >
          {{ item.count }}
        </span>
      </div>
    </div>

    <!-- Footer link -->
    <div class="mt-4 pt-3 border-t border-gray-200 dark:border-gray-700 flex items-center gap-1.5 group cursor-pointer">
      <span class="text-sm text-gray-400 group-hover:text-gray-600 dark:group-hover:text-gray-300 transition-colors">
        View Activity Details
      </span>
      <ArrowTopRightOnSquareIcon class="w-3.5 h-3.5 text-gray-400 group-hover:text-gray-500 dark:group-hover:text-gray-300 transition-colors" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { BoltIcon, CheckIcon, ViewfinderCircleIcon, ArrowTopRightOnSquareIcon } from '@heroicons/vue/24/outline'
import { mockTransportationRequests } from '~/features/transportation/transportation-requests-listing/transportation-request.mocks'
import { mockWarehousingRequests } from '~/features/warehousing/warehousing-requests-listing/warehousing-requests.mocks'

// SVG ring geometry: r=38 → C = 2π × 38
const CIRCUMFERENCE = 2 * Math.PI * 38

function getOffset(progress: number): number {
  return CIRCUMFERENCE * (1 - Math.max(0, Math.min(100, progress)) / 100)
}

// ── Transportation stats ─────────────────────────────────────────────────────
const totalTransport = mockTransportationRequests.length
const activeTransport = mockTransportationRequests.filter(
  (r) => r.status === 'IN_TRANSIT' || r.status === 'PICKUP_SCHEDULED'
).length
const deliveredTransport = mockTransportationRequests.filter(
  (r) => r.status === 'DELIVERED'
).length

// ── Warehousing stats ────────────────────────────────────────────────────────
const totalWarehousing = mockWarehousingRequests.length
const activeWarehousing = mockWarehousingRequests.filter(
  (r) => ['APPROVED', 'PENDING_ARRIVAL', 'RECEIVED', 'STORED'].includes(r.status)
).length
const completedWarehousing = mockWarehousingRequests.filter(
  (r) => r.status === 'COMPLETED'
).length

// ── Combined on-track rate ───────────────────────────────────────────────────
const totalAll = totalTransport + totalWarehousing
const onTrackAll =
  mockTransportationRequests.filter(
    (r) => !['SUBMITTED', 'UNDER_REVIEW'].includes(r.status)
  ).length +
  mockWarehousingRequests.filter(
    (r) => !['SUBMITTED', 'UNDER_REVIEW'].includes(r.status)
  ).length

// ── Three progress rings ─────────────────────────────────────────────────────
const rings = [
  {
    label: 'Transport',
    value: String(activeTransport),
    unit: 'active',
    progress: Math.round((activeTransport / totalTransport) * 100),
    color: '#fb7185', // rose-400 — coral/hot-pink
  },
  {
    label: 'Warehousing',
    value: String(activeWarehousing),
    unit: 'items',
    progress: Math.round((activeWarehousing / totalWarehousing) * 100),
    color: '#4ade80', // green-400 — bright lime
  },
  {
    label: 'On Track',
    value: String(onTrackAll),
    unit: 'req.',
    progress: Math.round((onTrackAll / totalAll) * 100),
    color: '#60a5fa', // blue-400 — electric blue
  },
]

// ── Status items (goals-style list) ─────────────────────────────────────────
const inTransitCount = mockTransportationRequests.filter(
  (r) => r.status === 'IN_TRANSIT'
).length
const pendingReviewCount =
  mockTransportationRequests.filter((r) => r.status === 'SUBMITTED').length +
  mockWarehousingRequests.filter(
    (r) => r.status === 'SUBMITTED' || r.status === 'UNDER_REVIEW'
  ).length
const inWarehouseCount = mockWarehousingRequests.filter(
  (r) => r.status === 'STORED' || r.status === 'RECEIVED'
).length
const completedTotal = deliveredTransport + completedWarehousing

const statusItems = [
  {
    label: `Shipments In Transit`,
    count: inTransitCount,
    done: false,
    color: '#fb7185',
  },
  {
    label: 'Items In Warehouse',
    count: inWarehouseCount,
    done: false,
    color: '#4ade80',
  },
  {
    label: 'Requests Completed',
    count: completedTotal,
    done: true,
    color: '#22c55e',
  },
  {
    label: 'Awaiting Review',
    count: pendingReviewCount,
    done: false,
    color: '#fbbf24',
  },
]
</script>
