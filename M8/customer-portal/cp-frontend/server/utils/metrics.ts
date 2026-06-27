/**
 * Custom application metrics (prom-client).
 *
 * @artmizu/nuxt-prometheus exposes /metrics by calling `register.metrics()` on
 * prom-client's DEFAULT registry. So any metric we create on that same default
 * registry automatically shows up on /metrics — no module integration needed.
 *
 * The module gives only per-path TIMINGS (page_*_time). It has no request
 * counter and no HTTP status dimension, so "seeing traffic / errors" needs these.
 */
import { Counter, Histogram, register } from 'prom-client'

/**
 * Guard against double-registration. In dev, Nuxt HMR re-evaluates modules and
 * `new Counter({name})` throws if the name is already registered. Reuse the
 * existing instance instead.
 */
function getOrCreate<T>(name: string, factory: () => T): T {
  const existing = register.getSingleMetric(name)
  return (existing as unknown as T) ?? factory()
}

export const httpRequestsTotal = getOrCreate('http_requests_total', () =>
  new Counter({
    name: 'http_requests_total',
    help: 'Total number of HTTP requests',
    labelNames: ['method', 'route', 'status'] as const
  })
)

export const httpRequestDurationSeconds = getOrCreate('http_request_duration_seconds', () =>
  new Histogram({
    name: 'http_request_duration_seconds',
    help: 'HTTP request duration in seconds',
    labelNames: ['method', 'route', 'status'] as const,
    buckets: [0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5]
  })
)

// Business metrics — count meaningful domain events, not just HTTP.
export const transportationRequestsCreatedTotal = getOrCreate('transportation_requests_created_total', () =>
  new Counter({
    name: 'transportation_requests_created_total',
    help: 'Total number of transportation requests successfully created'
  })
)

export const warehousingRequestsCreatedTotal = getOrCreate('warehousing_requests_created_total', () =>
  new Counter({
    name: 'warehousing_requests_created_total',
    help: 'Total number of warehousing requests successfully created'
  })
)

/**
 * Collapse a raw request path into a low-cardinality route label.
 * Without this, every ObjectId / tracking number becomes its own time series
 * and blows up Prometheus cardinality.
 */
export function normalizeRoute(path: string): string {
  const p = (path || '/').split('?')[0]
  // Dev asset noise (Vite/Nuxt) — bucket it all together
  if (p.startsWith('/_nuxt') || p.startsWith('/@') || p.startsWith('/__')) return '/_nuxt/*'
  const normalized = p
    .split('/')
    .filter(Boolean)
    .map((seg) => {
      if (/^[0-9a-fA-F]{24}$/.test(seg)) return ':id' // mongo ObjectId
      if (/^\d+$/.test(seg)) return ':id' // numeric id
      if (/^(TR|WH)-\d{4}-\d+$/i.test(seg)) return ':ref' // request numbers e.g. TR-2026-123456
      if (/^TRK\d+$/i.test(seg)) return ':ref' // tracking numbers e.g. TRK123456789
      return seg
    })
    .join('/')
  return '/' + normalized
}
