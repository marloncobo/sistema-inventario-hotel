import { SHELL_ROUTE_ROLES } from './shell-route-roles';

describe('SHELL_ROUTE_ROLES', () => {
  it('should expose the assistant route only to admin, almacenista and servicio', () => {
    const assistantRoles = [...SHELL_ROUTE_ROLES['asistente-ia']];

    expect(assistantRoles).toEqual([
      'ADMIN',
      'ALMACENISTA',
      'SERVICIO'
    ]);
    expect(assistantRoles.includes('RECEPCION' as never)).toBeFalse();
  });
});
