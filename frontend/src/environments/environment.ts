export const environment = {
  production: false,
  appName: 'Hotel Inventory Hub',
  apiBaseUrl: 'http://localhost:8080',
  storageKey: 'hotel-inventory-session',
  /** Local: mismo host que el gateway; en producción ver `environment.production.ts`. */
  serviceOrigins: {
    gateway: 'http://localhost:8080',
    inventory: 'http://localhost:8080',
    rooms: 'http://localhost:8080'
  }
} as const;
