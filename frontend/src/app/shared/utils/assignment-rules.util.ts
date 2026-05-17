import type { SupplyItem } from '@models/inventory.model';

/** Reglas alineadas con RoomService.validateAssignmentCategory (rooms-service). */
export function validateAssignmentItemCategory(
  assignmentType: string,
  item: SupplyItem
): string | null {
  if (!item.active) {
    return `El insumo ${item.name} está inactivo`;
  }

  const category = (item.category ?? '').trim().toUpperCase();
  const type = assignmentType.trim().toUpperCase();

  if (type === 'MINIBAR' && category !== 'MINIBAR') {
    return 'Solo se pueden reponer productos de categoría MINIBAR en minibar';
  }

  if (type === 'KIT_ASEO' && !['ASEO', 'AMENIDADES'].includes(category)) {
    return 'Solo se pueden entregar insumos de aseo o amenidades en kits de aseo';
  }

  if (type === 'SERVICIO_HABITACION' && category === 'MANTENIMIENTO') {
    return 'El servicio a la habitación no permite esta categoría de insumo';
  }

  return null;
}

export function itemsForAssignmentType(items: SupplyItem[], assignmentType: string): SupplyItem[] {
  const type = assignmentType.trim().toUpperCase();
  return items.filter((item) => {
    if (!item.active) {
      return false;
    }
    const category = (item.category ?? '').trim().toUpperCase();
    if (type === 'MINIBAR') {
      return category === 'MINIBAR';
    }
    if (type === 'KIT_ASEO') {
      return ['ASEO', 'AMENIDADES'].includes(category);
    }
    return true;
  });
}
