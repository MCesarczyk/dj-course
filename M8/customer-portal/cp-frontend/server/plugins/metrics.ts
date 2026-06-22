/**
 * Nitro plugin — records an HTTP metric for every request.
 *
 * Hooks into the Nitro request lifecycle:
 *   - `request`        → stamp a start time on the event context
 *   - `afterResponse`  → normal responses (200, returned 404, ...)
 *   - `error`          → thrown errors via createError() (4xx/5xx) — afterResponse
 *                        does NOT fire for these, so without this hook we'd miss
 *                        exactly the errors we most want on the dashboard.
 *
 * Labels: method, normalized route, status code → enables RPS, latency
 * percentiles and error-rate panels per endpoint in Grafana.
 */
import { httpRequestsTotal, httpRequestDurationSeconds, normalizeRoute } from '~/server/utils/metrics'

export default defineNitroPlugin((nitroApp) => {
  // Shared recording logic. `statusOverride` is used by the error hook, where
  // the response status may not yet be readable from the response object.
  function record(event: any, statusOverride?: number) {
    if (!event || event.context._metricCounted) return // dedupe: count each request once
    const route = normalizeRoute(event.path || '')

    // Don't measure the metrics endpoint itself — it would inflate its own numbers.
    if (route === '/metrics') return

    const method = (event.method || event.node?.req?.method || 'GET').toUpperCase()
    const status = String(statusOverride || event.node?.res?.statusCode || 0)

    httpRequestsTotal.inc({ method, route, status })

    const start = event.context._metricStart as bigint | undefined
    if (start) {
      const durationSec = Number(process.hrtime.bigint() - start) / 1e9
      httpRequestDurationSeconds.observe({ method, route, status }, durationSec)
    }
    event.context._metricCounted = true
  }

  nitroApp.hooks.hook('request', (event) => {
    event.context._metricStart = process.hrtime.bigint()
  })

  nitroApp.hooks.hook('afterResponse', (event) => {
    record(event)
  })

  nitroApp.hooks.hook('error', (error: any, ctx: any) => {
    record(ctx?.event, error?.statusCode || 500)
  })
})
