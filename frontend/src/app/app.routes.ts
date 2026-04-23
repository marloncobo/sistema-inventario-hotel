import { Routes } from '@angular/router';
import { authGuard } from '@core/guards/auth.guard';
import { guestGuard } from '@core/guards/guest.guard';
import { roleGuard } from '@core/guards/role.guard';
import { AppShellComponent } from '@layout/app-shell/app-shell.component';
import { DashboardPageComponent } from '@features/dashboard/pages/dashboard-page/dashboard-page.component';
import { ForbiddenPageComponent } from '@features/errors/pages/forbidden-page/forbidden-page.component';
import { NotFoundPageComponent } from '@features/errors/pages/not-found-page/not-found-page.component';

const allRoles = ['ADMIN', 'ALMACENISTA', 'RECEPCION', 'SERVICIO'] as const;

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
          roles: [...allRoles]
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
          roles: ['ADMIN'],
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
          roles: ['ADMIN'],
          summary: 'Consulta centralizada de bitácoras de autenticación, inventario y habitaciones.',
          endpoint:
            'GET /auth/audit · GET /inventory/api/inventory/audit · GET /rooms/api/rooms/audit',
          note: 'Puedes filtrar la consulta por accion, usuario y rango de fechas.'
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
          roles: ['ADMIN', 'ALMACENISTA'],
          summary: 'Catálogos maestros para categorías, unidades, proveedores y áreas.',
          endpoint:
            'GET/POST/PUT /inventory/api/inventory/catalogs/categories|units|providers|areas',
          note: 'El perfil ALMACENISTA administra proveedores; las demas secciones quedan reservadas para administracion.'
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
          roles: ['ADMIN', 'ALMACENISTA', 'SERVICIO'],
          summary: 'Base para listado, detalle, creación, edición y operaciones sobre insumos.',
          endpoint:
            'GET /items · GET /items/{id} · POST /items · PUT /items/{id} · PATCH /items/{id}/deactivate · POST /items/{id}/entries · POST /items/{id}/returns',
          note: 'Las salidas y devoluciones deben registrarse desde el flujo operativo correspondiente.'
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
          roles: ['ADMIN', 'ALMACENISTA'],
          summary: 'Historial trazable de entradas, salidas, devoluciones y anulaciones.',
          endpoint:
            'GET /inventory/api/inventory/movements · POST /inventory/api/inventory/movements/{id}/void',
          note: 'Puedes filtrar por tipo, origen, habitacion, responsable, area y rango de fechas.'
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
          roles: ['ADMIN', 'ALMACENISTA'],
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
          roles: ['ADMIN', 'ALMACENISTA', 'RECEPCION'],
          summary: 'Base del módulo de consulta, alta y actualización de estado operativo de habitaciones.',
          endpoint:
            'POST /rooms/api/rooms · GET /rooms/api/rooms · GET /rooms/api/rooms/{id} · PATCH /rooms/api/rooms/{id}/status',
          note: 'La disponibilidad y los estados operativos se validan automaticamente para mantener consistencia.'
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
          roles: ['ADMIN', 'ALMACENISTA', 'RECEPCION', 'SERVICIO'],
          summary: 'Base de la entrega de insumos a habitaciones y del historial de asignaciones.',
          endpoint:
            'POST /rooms/api/rooms/{roomId}/supplies/assign · GET /rooms/api/rooms/{roomId}/supplies · GET /rooms/api/rooms/supplies',
          note: 'El personal de servicio puede registrar entregas segun los permisos y el flujo operativo disponible.'
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
          roles: ['ADMIN', 'RECEPCION'],
          summary: 'Consulta reportes de inventario y habitaciones con opciones de exportacion.',
          endpoint:
            'GET /inventory/api/inventory/reports/* · GET /rooms/api/rooms/reports/* · endpoints /export?format=xlsx|csv|pdf',
          note: 'La exportacion de reportes de habitaciones esta disponible solo para administradores.'
        }
      },
      {
        path: 'forbidden',
        component: ForbiddenPageComponent,
        data: {
          title: 'Acceso restringido',
          breadcrumb: 'Sin acceso'
        }
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
