// use only for local development (outside of Docker; see .env.local file)
// require('dotenv').config();

// Initialize tracing before importing any other modules (!)
import { initTelemetry } from './instrumentation';
const sdk = initTelemetry();

import path from 'path';
import express, { Request, Response, NextFunction } from 'express';
import bodyParser from 'body-parser';

import { pool } from './database';
import logger from './logger';
import { assertEnvVars } from './env';
import { isBlacklistedPath } from './url-blacklist';
import { HTTPRequestTotalCounter } from './metrics';
import productRouter from './router';
import miscRouter from './router-misc';

assertEnvVars(
  'PORT',
  'NODE_ENV',
  'SERVICE_NAME',
  'DATABASE_URL',
  'OTEL_EXPORTER_OTLP_METRICS_ENDPOINT',
  'OTEL_EXPORTER_OTLP_LOGS_ENDPOINT',
  'OTEL_EXPORTER_OTLP_TRACES_ENDPOINT',
);

const port = process.env.PORT;

const app = express();

// Body parser MUST be first to parse request body
app.use(bodyParser.json());

// Middleware to log all requests
app.use((req: Request, res: Response, next: NextFunction) => {
  if (isBlacklistedPath(req.path)) return next();
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    // Structured logging: message + all relevant data as attributes
    logger.info('HTTP Request', {
      http: {
        method: req.method,
        url: req.originalUrl,
        status_code: res.statusCode,
        duration_ms: duration,
      },
      user: {
        id: (req as any).user?.id || 'anonymous',
      },
      user_agent: req.get('User-Agent'),
      // Add route info if available
      route: req.route?.path || req.path,
    });
  });
  next();
});

// HTTP request counter middleware gets executed after all routes
app.use((req: Request, res: Response, next: NextFunction) => {
  res.on('finish', () => {
    if (isBlacklistedPath(req.path)) return;
    HTTPRequestTotalCounter.add(1, {
      method: req.method,
      path: req.path,
      status: res.statusCode
    });
  });
  next();
});

// ── Troubleshooting (Zadanie 8): load shedding (concurrency limit) ─────────────
// BUG: podczas stress testu "massive" w dashboardzie NIE pojawiały się błędy.
// Przyczyna: przy przeciążeniu serwer NIE zwracał błędów HTTP 5xx — żądania wisiały
// (kolejkując się po połączenie z pulą pg / blokując event-loop) aż KLIENT rezygnował
// (ECONNRESET/ETIMEDOUT po stronie klienta). Takie awarie połączeniowe NIE tworzą
// metryki http_server_duration z kodem 5xx, więc panele błędów (filtr
// http_status_code=~"5..") nie miały czego pokazać — mimo że system był przeciążony.
//
// FIX: load shedding na podstawie liczby równoczesnych żądań (sprawdzenie SYNCHRONICZNE
// na wejściu — działa nawet gdy event-loop jest pod presją, w przeciwieństwie do timera).
// Gdy w obróbce jest > MAX_INFLIGHT żądań, nadmiar jest natychmiast odrzucany kodem 503.
// 503 to prawidłowy błąd serwera — instrumentacja zapisuje go z http_status_code=503 =>
// przeciążenie staje się WIDOCZNE w Grafanie zamiast cichego degradowania się.
const MAX_INFLIGHT_REQUESTS = 5; // ~powyżej puli pg (3); nadmiar równoczesnych żądań => shed
let inFlightRequests = 0;
app.use((req: Request, res: Response, next: NextFunction) => {
  if (isBlacklistedPath(req.path)) return next();

  if (inFlightRequests >= MAX_INFLIGHT_REQUESTS) {
    logger.warn('Load shedding - too many concurrent requests', {
      in_flight: inFlightRequests,
      limit: MAX_INFLIGHT_REQUESTS,
      http: { method: req.method, path: req.path },
    });
    return res.status(503).json({ error: 'Service overloaded, try again later' });
  }

  inFlightRequests++;
  let released = false;
  const release = () => { if (released) return; released = true; inFlightRequests--; };
  res.on('finish', release);
  res.on('close', release);
  next();
});

// Serve static files (public is at project root, __dirname is dist/ when compiled)
app.use(express.static(path.join(__dirname, '..', 'public')));

// Mount routers
app.use(productRouter);
app.use(miscRouter);

// Error logging middleware MUST be last to catch all errors
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  logger.error('Request processing error', {
    error: {
      message: err.message,
      stack: err.stack,
      name: err.name,
    },
    http: {
      method: req.method,
      url: req.originalUrl,
      path: req.path,
    }
  });
  res.status(500).json({ error: 'Internal Server Error', details: err.message });
});

// Start the server
app.listen(port, () => {
  const formattedTime = new Date().toISOString();
  logger.info(`Server started on port ${port} at ${formattedTime}`, { 
    port: Number(port),
    env: process.env.NODE_ENV,
    service: process.env.SERVICE_NAME,
    timestamp: formattedTime
  });
});

// Graceful shutdown
process.on('SIGTERM', async () => {
  logger.info('Graceful shutdown initiated', { signal: 'SIGTERM' });
  
  try {
    await pool.end();
    logger.info('Database connection pool closed successfully');
  } catch (err: any) {
    logger.error('Failed to close database connection pool', { 
      error: {
        message: err.message,
        stack: err.stack,
      }
    });
  }
  
  sdk.shutdown()
    .then(() => logger.info('Tracing terminated successfully'))
    .catch((error: any) => logger.error('Failed to terminate tracing', { 
      error: {
        message: error.message,
        stack: error.stack,
      }
    }))
    .finally(() => {
      logger.info('HTTP server closed');
      process.exit(0);
    });
});
