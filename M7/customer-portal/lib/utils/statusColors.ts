const STATUS_COLORS: Record<string, string> = {
  // Pending / awaiting action → yellow
  SUBMITTED:        'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
  UNDER_REVIEW:     'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
  PENDING_ARRIVAL:  'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
  AWAITING_PAYMENT: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
  PENDING:          'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',

  // Approved / active processing → blue
  APPROVED:    'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
  IN_PROGRESS: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
  SCHEDULED:   'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
  PICKED_UP:   'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
  DISPATCHED:  'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',

  // Scheduled logistics events → orange
  PICKUP_SCHEDULED: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200',

  // Last-mile delivery → indigo
  OUT_FOR_DELIVERY: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200',

  // In motion / in facility → purple
  IN_TRANSIT: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
  RECEIVED:   'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',

  // Successfully placed → green
  DELIVERED:  'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
  STORED:     'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
  IN_STORAGE: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',

  // Fully closed out → emerald
  COMPLETED: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200',
  PAID:      'bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200',

  // Terminated → red
  REMOVED: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
}

export function getStatusColor(status: string): string {
  return STATUS_COLORS[status] ?? 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200'
}
