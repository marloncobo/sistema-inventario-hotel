import { Routes } from '@angular/router';
import { rolesForShellRoute } from '@core/constants/shell-route-roles';
import { authGuard } from '@core/guards/auth.guard';
import { guestGuard } from '@core/guards/guest.guard';
import { roleGuard } from '@core/guards/role.guard';
import { AppShellComponent } from '@layout/app-shell/app-shell.component';
import { DashboardPageComponent } from '@features/dashboard/pages/dashboard-page/dashboard-page.component';
import { NotFoundPageComponent } from '@features/errors/pages/not-found-page/not-found-page.component';

export const routes: Routes = [
  {
    path: 'login',
    canActivate: [guestGuard],
    loadComponent: () =>
      import('@features/auth/pages/login-page/login-page.component').then(
        (m) => m.LoginPageComponent
      ),
    data: {
      title: 'Acceso'
    }
  },
  {
    path: '',
    component: AppShellComponent,
    canActivate: [authGuard],
    children: [
      {
        path: '',
        pathMatch: 'full',
        redirectTo: 'dashboard'
      },
      {
        path: 'dashboard',
        canActivate: [roleGuard],
        component: DashboardPageComponent,
        data: {
          title: 'Dashboard',
          breadcrumb: 'Dashboard',
          roles: rolesForShellRoute('dashboard')
        }
      },
      {
        path: 'usuarios',
        canActivate: [roleGuard],
        loadComponent: () =>
          import('@features/users/pages/users-page/users-page.component').then(
            (m) => m.UsersPageComponent
          ),
        data: {
          title: 'Usuarios',
          breadcrumb: 'Usuarios',
          roles: rolesForShellRoute('usuarios'),
          summary: 'Gestion administrativa de usuarios, activacion de cuentas y revision de roles.',
          endpoint: 'GET /auth/users · POST /auth/users · PUT /auth/users/{id}',
          note: 'Asigna credenciales seguras y el perfil correcto para cada usuario.'
        }
      },
      {
        path: 'auditoria',
        canActivate: [roleGuard],
        loadComponent: () =>
          import('@features/audits/pages/audits-page/audits-page.component').then(
            (m) => m.AuditsPageComponent
          ),
        data: {
          title: 'Auditoría',
          breadcrumb: 'Auditoría',
          roles: rolesForShellRoute('auditoria'),
          summary: 'Consulta centralizada de bitácoras de autenticación, inventario y habitaciones.',
          endpoint:
            'GET /auth/audit · GET /inventory/api/inventory/audit · GET /rooms/api/rooms/audit',
          note: 'Puedes filtrar la consulta por acción, usuario y rango de fechas.'
        }
      },
      {
        path: 'catalogos',
        canActivate: [roleGuard],
        loadComponent: () =>
          import('@features/catalogs/pages/catalogs-page/catalogs-page.component').then(
            (m) => m.CatalogsPageComponent
          ),
        data: {
          title: 'Catálogos',
          breadcrumb: 'Catálogos',
          roles: rolesForShellRoute('catalogos'),
          summary: 'Catálogos maestros (admin) o gestión de proveedores (almacenista), según rol.',
          endpoint:
            'GET/POST/PUT /inventory/api/inventory/catalogs/categories|units|providers|areas',
          note: 'El almacenista solo opera la sección de proveedores; el resto del catálogo es administración.'
        }
      },
      {
        path: 'inventario',
        canActivate: [roleGuard],
        loadComponent: () =>
          import('@features/inventory/pages/inventory-page/inventory-page.component').then(
            (m) => m.InventoryPageComponent
          ),
        data: {
          title: 'Inventario',
          breadcrumb: 'Inventario',
          roles: rolesForShellRoute('inventario'),
          summary: 'Base para listado, detalle, creación, edición y operaciones sobre insumos.',
          endpoint:
            'GET /items · GET /items/{id} · POST /items · PUT /items/{id} · PATCH /items/{id}/deactivate · POST /items/{id}/entries · POST /items/{id}/returns',
          note: 'Las acciones disponibles dependen del rol autenticado.'
        }
      },
      {
        path: 'movimientos',
        canActivate: [roleGuard],
        loadComponent: () =>
          import('@features/movements/pages/movements-page/movements-page.component').then(
            (m) => m.MovementsPageComponent
          ),
        data: {
          title: 'Movimientos',
          breadcrumb: 'Movimientos',
          roles: rolesForShellRoute('movimientos'),
          summary: 'Historial trazable de entradas, salidas, devoluciones y anulaciones.',
          endpoint:
            'GET /inventory/api/inventory/movements · POST /inventory/api/inventory/movements/{id}/void',
          note: 'Puedes filtrar por tipo, origen, habitación, responsable, área y rango de fechas.'
        }
      },
      {
        path: 'alertas',
        canActivate: [roleGuard],
        loadComponent: () =>
          import('@features/alerts/pages/alerts-page/alerts-page.component').then(
            (m) => m.AlertsPageComponent
          ),
        data: {
          title: 'Alertas',
          breadcrumb: 'Alertas',
          roles: rolesForShellRoute('alertas'),
          summary: 'Seguimiento operativo del stock bajo y alertas abiertas del inventario.',
          endpoint:
            'GET /inventory/api/inventory/items/low-stock · GET /inventory/api/inventory/alerts/low-stock',
          note: 'Puedes alternar entre alertas abiertas o historial completo segun la necesidad de seguimiento.'
        }
      },
      {
        path: 'habitaciones',
        canActivate: [roleGuard],
        loadComponent: () =>
          import('@features/rooms/pages/rooms-page/rooms-page.component').then(
            (m) => m.RoomsPageComponent
          ),
        data: {
          title: 'Habitaciones',
          breadcrumb: 'Habitaciones',
          roles: rolesForShellRoute('habitaciones'),
          summary: 'Base del módulo de consulta y actualización operativa de habitaciones.',
          endpoint:
            'POST /rooms/api/rooms · GET /rooms/api/rooms · GET /rooms/api/rooms/{id} · PATCH /rooms/api/rooms/{id}/status',
          note: 'ADMIN puede crear habitaciones; RECEPCION puede cambiar estado; ALMACENISTA solo consulta.'
        }
      },
      {
        path: 'habitaciones/consulta',
        canActivate: [roleGuard],
        loadComponent: () =>
          import('@features/rooms/pages/room-lookup-page/room-lookup-page.component').then(
            (m) => m.RoomLookupPageComponent
          ),
        data: {
          title: 'Consulta habitación',
          breadcrumb: 'Consulta por número',
          roles: rolesForShellRoute('habitaciones/consulta'),
          summary: 'Validación de habitación por número según permisos del gateway.',
          endpoint: 'GET /rooms/api/rooms/number/{number}',
          note: 'Consulta por número disponible para todos los roles del sistema; en SERVICIO sustituye al listado general de habitaciones para obtener el id en asignaciones.'
        }
      },
      {
        path: 'asignaciones',
        canActivate: [roleGuard],
        loadComponent: () =>
          import('@features/assignments/pages/assignments-page/assignments-page.component').then(
            (m) => m.AssignmentsPageComponent
          ),
        data: {
          title: 'Asignaciones',
          breadcrumb: 'Asignaciones',
          roles: rolesForShellRoute('asignaciones'),
          summary: 'Entrega de insumos a habitaciones e historial de asignaciones.',
          endpoint:
            'POST /rooms/api/rooms/{roomId}/supplies/assign · GET /rooms/api/rooms/{roomId}/supplies · GET /rooms/api/rooms/supplies',
          note: 'RECEPCION no puede registrar asignaciones por permisos del backend.'
        }
      },
      {
        path: 'reportes',
        canActivate: [roleGuard],
        loadComponent: () =>
          import('@features/reports/pages/reports-page/reports-page.component').then(
            (m) => m.ReportsPageComponent
          ),
        data: {
          title: 'Reportes',
          breadcrumb: 'Reportes',
          roles: rolesForShellRoute('reportes'),
          summary: 'Consulta reportes de habitaciones e inventario según el rol.',
          endpoint:
            'GET /inventory/api/inventory/reports/* · GET /rooms/api/rooms/reports/* · endpoints /export?format=xlsx|csv|pdf',
          note: 'La exportacion queda reservada para administradores.'
        }
      },
      {
        path: 'forbidden',
        redirectTo: 'dashboard',
        pathMatch: 'full'
      },
      {
        path: '**',
        component: NotFoundPageComponent,
        data: {
          title: 'No encontrado',
          breadcrumb: '404'
        }
      }
    ]
  },
  {
    path: '**',
    redirectTo: 'login'
  }
];
