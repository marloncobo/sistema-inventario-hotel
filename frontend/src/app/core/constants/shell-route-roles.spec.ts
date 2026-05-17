import { SHELL_ROUTE_ROLES } from './shell-route-roles';

describe('SHELL_ROUTE_ROLES', () => {
  it('should expose the assistant route to all operational roles including recepcion', () => {
    expect([...SHELL_ROUTE_ROLES['asistente-ia']]).toEqual([
      'ADMIN',
      'ALMACENISTA',
      'RECEPCION',
      'SERVICIO'
    ]);
  });

  it('should restrict room assignments to admin and servicio only', () => {
    expect([...SHELL_ROUTE_ROLES.asignaciones]).toEqual(['ADMIN', 'SERVICIO']);
    expect(SHELL_ROUTE_ROLES.asignaciones.includes('ALMACENISTA' as never)).toBeFalse();
  });

  it('should allow recepcion to compare PAR without full inventory access', () => {
    expect(SHELL_ROUTE_ROLES['par-habitaciones'].includes('RECEPCION' as never)).toBeTrue();
    expect(SHELL_ROUTE_ROLES.inventario.includes('RECEPCION' as never)).toBeFalse();
  });
});
