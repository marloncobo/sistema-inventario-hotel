import { ROUTES_BY_ROLE, SHELL_ROUTE_ROLES } from './role-nav-access';

describe('role-nav-access', () => {
  it('should not expose par-habitaciones to recepcion (PAR va en consulta habitación)', () => {
    expect(ROUTES_BY_ROLE.RECEPCION.includes('par-habitaciones')).toBeFalse();
    expect(SHELL_ROUTE_ROLES['par-habitaciones'].includes('RECEPCION')).toBeFalse();
  });

  it('should restrict assignments to admin and servicio', () => {
    expect([...SHELL_ROUTE_ROLES.asignaciones]).toEqual(['ADMIN', 'SERVICIO']);
  });

  it('should give recepcion habitaciones and reportes only among operational modules', () => {
    const routes = [...ROUTES_BY_ROLE.RECEPCION];
    expect(routes).toContain('dashboard');
    expect(routes).toContain('habitaciones');
    expect(routes).toContain('habitaciones/consulta');
    expect(routes).toContain('reportes');
    expect(routes).toContain('asistente-ia');
    expect(routes).not.toContain('par-habitaciones');
    expect(routes).not.toContain('inventario');
    expect(routes.length).toBe(5);
  });
});
