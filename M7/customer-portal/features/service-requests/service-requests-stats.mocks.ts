import type { StatRing, StatusItem } from './types'

export const mockServiceRequestsStatsDefault: { rings: StatRing[]; statusItems: StatusItem[] } = {
  rings: [
    { label: 'Transport',   value: '4',  unit: 'active', progress: 67, color: '#fb7185' },
    { label: 'Warehousing', value: '4',  unit: 'items',  progress: 50, color: '#4ade80' },
    { label: 'On Track',    value: '11', unit: 'req.',   progress: 79, color: '#60a5fa' },
  ],
  statusItems: [
    { label: 'Shipments In Transit', count: 3, done: false, color: '#fb7185' },
    { label: 'Items In Warehouse',   count: 2, done: false, color: '#4ade80' },
    { label: 'Requests Completed',   count: 3, done: true,  color: '#22c55e' },
    { label: 'Awaiting Review',      count: 3, done: false, color: '#fbbf24' },
  ],
}

export const mockServiceRequestsStatsHighActivity: { rings: StatRing[]; statusItems: StatusItem[] } = {
  rings: [
    { label: 'Transport',   value: '12', unit: 'active', progress: 92, color: '#fb7185' },
    { label: 'Warehousing', value: '18', unit: 'items',  progress: 87, color: '#4ade80' },
    { label: 'On Track',    value: '28', unit: 'req.',   progress: 95, color: '#60a5fa' },
  ],
  statusItems: [
    { label: 'Shipments In Transit', count: 12, done: false, color: '#fb7185' },
    { label: 'Items In Warehouse',   count: 18, done: false, color: '#4ade80' },
    { label: 'Requests Completed',   count: 8,  done: true,  color: '#22c55e' },
    { label: 'Awaiting Review',      count: 2,  done: false, color: '#fbbf24' },
  ],
}

export const mockServiceRequestsStatsAllComplete: { rings: StatRing[]; statusItems: StatusItem[] } = {
  rings: [
    { label: 'Transport',   value: '0',  unit: 'active', progress: 0,   color: '#fb7185' },
    { label: 'Warehousing', value: '0',  unit: 'items',  progress: 0,   color: '#4ade80' },
    { label: 'On Track',    value: '20', unit: 'req.',   progress: 100, color: '#60a5fa' },
  ],
  statusItems: [
    { label: 'Shipments In Transit', count: 0,  done: true, color: '#fb7185' },
    { label: 'Items In Warehouse',   count: 0,  done: true, color: '#4ade80' },
    { label: 'Requests Completed',   count: 20, done: true, color: '#22c55e' },
    { label: 'Awaiting Review',      count: 0,  done: true, color: '#fbbf24' },
  ],
}

export const mockServiceRequestsStatsLowActivity: { rings: StatRing[]; statusItems: StatusItem[] } = {
  rings: [
    { label: 'Transport',   value: '1', unit: 'active', progress: 20, color: '#fb7185' },
    { label: 'Warehousing', value: '2', unit: 'items',  progress: 25, color: '#4ade80' },
    { label: 'On Track',    value: '3', unit: 'req.',   progress: 30, color: '#60a5fa' },
  ],
  statusItems: [
    { label: 'Shipments In Transit', count: 1, done: false, color: '#fb7185' },
    { label: 'Items In Warehouse',   count: 2, done: false, color: '#4ade80' },
    { label: 'Requests Completed',   count: 0, done: false, color: '#22c55e' },
    { label: 'Awaiting Review',      count: 7, done: false, color: '#fbbf24' },
  ],
}
