import type { CreateDocumentRequest } from '@models/inventory.model';

/** Validaciones alineadas con DocumentService.create (inventory-service). */
export function validateCreateDocument(payload: CreateDocumentRequest): string | null {
  const type = payload.type.trim().toUpperCase();

  if (type === 'CONTEO') {
    return 'Los conteos físicos se crean en el módulo Conteos (Iniciar conteo), no como documento genérico.';
  }

  if ((type === 'ORDEN_COMPRA' || type === 'RECEPCION') && !payload.providerName?.trim()) {
    return 'La orden de compra/recepción requiere proveedor';
  }

  if (type === 'TRANSFERENCIA') {
    if (!payload.fromLocationId || !payload.toLocationId) {
      return 'La transferencia requiere ubicación origen y destino';
    }
    if (payload.fromLocationId === payload.toLocationId) {
      return 'La ubicación origen y destino deben ser distintas';
    }
  }

  if ((type === 'AJUSTE' || type === 'RECEPCION') && !payload.toLocationId) {
    return 'El documento debe indicar la ubicación destino';
  }

  if (!payload.lines.length) {
    return 'Agrega al menos una línea al documento';
  }

  for (const line of payload.lines) {
    if (line.quantityExpected == null || line.quantityExpected <= 0) {
      return 'Cada línea debe tener cantidad positiva';
    }
  }

  return null;
}
