export const environment = {
  production: true,
  appName: 'Hotel Inventory Hub',
  apiBaseUrl: '',
  storageKey: 'hotel-inventory-session',
  serviceOrigins: {
    gateway: '',
    inventory: '',
    rooms: ''
  }
} as const;
