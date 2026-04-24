/**
 * Build de producción (`ng build` / Cloud Run del SPA).
 * Las peticiones van siempre al API Gateway; inventory y rooms se exponen detrás de él.
 *
 * CORS: lo aplica el gateway (`security.cors.allowed-origin-patterns` / `CORS_ALLOWED_ORIGIN_PATTERNS`);
 * incluye ahí el origen del frontend (p. ej. `https://tu-frontend-*.run.app`).
 */
export const environment = {
  production: true,
  appName: 'Hotel Inventory Hub',
  apiBaseUrl: 'https://gateway-service-112685788555.us-central1.run.app',
  storageKey: 'hotel-inventory-session',
  /** Orígenes de microservicios (solo referencia; el cliente HTTP usa `apiBaseUrl`). */
  serviceOrigins: {
    gateway: 'https://gateway-service-112685788555.us-central1.run.app',
    inventory: 'https://inventory-service-112685788555.us-central1.run.app',
    rooms: 'https://rooms-service-112685788555.us-central1.run.app'
  }
} as const;
