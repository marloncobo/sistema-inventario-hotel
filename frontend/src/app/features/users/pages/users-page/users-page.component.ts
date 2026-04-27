import { CommonModule } from '@angular/common';
import { Component, computed, effect, inject, OnInit, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { take } from 'rxjs';
import { ButtonModule } from 'primeng/button';
import { DrawerModule } from 'primeng/drawer';
import { InputTextModule } from 'primeng/inputtext';
import { MultiSelectModule } from 'primeng/multiselect';
import { PasswordModule } from 'primeng/password';
import { TableModule } from 'primeng/table';
import { ToggleSwitchModule } from 'primeng/toggleswitch';
import { UsersApiService } from '@core/services/api/users-api.service';
import { NotificationService } from '@core/services/ui/notification.service';
import { extractApiErrorMessage, extractApiFieldErrors } from '@models/api-error.model';
import type { AppUser } from '@models/app-user.model';
import { ROLE_LABELS, type AppRole } from '@models/role.model';
import { notBlankValidator, passwordStrengthValidator } from '@shared/utils/app-validators.util';
import { applyServerValidationErrors } from '@shared/utils/form-errors.util';

@Component({
  selector: 'app-users-page',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    ButtonModule,
    DrawerModule,
    InputTextModule,
    MultiSelectModule,
    PasswordModule,
    TableModule,
    ToggleSwitchModule
  ],
  template: `
    <div class="users-page-container">
      <!-- Header Section -->
      <header class="users-header">
        <div class="header-info">
          <h1>Directorio de Usuarios</h1>
          <p>Control de accesos y perfiles operativos del equipo Hotel Lunara.</p>
        </div>
        <button pButton type="button" icon="pi pi-user-plus" label="Añadir usuario" class="btn-gold-add" (click)="openCreate()"></button>
      </header>

      <!-- Summary Stats Section -->
      <div class="stats-grid summary-grid admin-kpi-row">
        <div class="stat-card summary-card">
          <div class="stat-icon-wrapper">
             <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="stat-svg"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M22 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>
          </div>
          <div class="stat-content">
            <span class="stat-label">PERSONAL REGISTRADO</span>
            <strong class="stat-value">{{ users().length }}</strong>
            <span class="stat-sub">Cuentas totales</span>
          </div>
        </div>
        
        <div class="stat-card summary-card">
          <div class="stat-icon-wrapper">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="stat-svg"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path><path d="M12 8v4"></path><path d="M12 16h.01"></path></svg>
          </div>
          <div class="stat-content">
            <span class="stat-label">SESIONES HABILITADAS</span>
            <strong class="stat-value">{{ activeCount() }}</strong>
            <span class="stat-sub">Usuarios con acceso activo</span>
          </div>
        </div>

        <div class="stat-card summary-card">
          <div class="stat-icon-wrapper">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="stat-svg"><rect x="2" y="7" width="20" height="14" rx="2" ry="2"></rect><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"></path></svg>
          </div>
          <div class="stat-content">
            <span class="stat-label">ROLES OPERATIVOS</span>
            <strong class="stat-value">{{ distinctRoles().length }}</strong>
            <span class="stat-sub">{{ distinctRoles().join(', ') || 'ADMIN, ALMACENISTA, RECEPCION, SERVICIO' }}</span>
          </div>
        </div>
      </div>

      <!-- Table Section -->
      <div class="table-container shadow-sm">
        <!-- Filter Toolbar -->
        <div class="table-toolbar">
          <div class="search-box">
            <i class="pi pi-search"></i>
            <input 
              pInputText 
              type="text" 
              placeholder="Buscar por nombre, correo o rol..." 
              [value]="searchQuery()"
              (input)="onSearchInput($event)"
            />
          </div>

          <div class="filter-actions">
            <select 
              class="lunara-native-select" 
              aria-label="Filtrar por rol"
              [value]="roleFilter()"
              (change)="onRoleFilterChange($event)"
            >
              <option value="">Todos los roles</option>
              @for (opt of roleOptions; track opt.value) {
                <option [value]="opt.value">{{ opt.label }}</option>
              }
            </select>
            
            <select 
              class="lunara-native-select" 
              aria-label="Filtrar por estado"
              [value]="statusFilter() === null ? '' : (statusFilter() ? 'true' : 'false')"
              (change)="onStatusChange($event)"
            >
              <option value="">Estado: Todos</option>
              <option value="true">Activo</option>
              <option value="false">Inactivo</option>
            </select>
            
            <button pButton icon="pi pi-sync" label="Limpiar" class="btn-filter-text" (click)="clearFilters()"></button>
          </div>
        </div>

        <!-- Data Table -->
        <p-table 
          [value]="paginatedUsers()" 
          [loading]="loading()"
          [paginator]="false"
          [rows]="10"
          [rowsPerPageOptions]="[5, 10, 20]"
          [showCurrentPageReport]="false"
          currentPageReportTemplate="Mostrando {first} a {last} de {totalRecords} usuarios"
          responsiveLayout="scroll"
          styleClass="lunara-table"
        >
          <ng-template pTemplate="header">
            <tr>
              <th style="width: 25%">USUARIO</th>
              <th style="width: 30%">ROL(ES) ASIGNADOS</th>
              <th style="width: 15%">ESTADO</th>
              <th style="width: 15%">ÚLTIMO ACCESO</th>
              <th style="width: 15%">ACCIONES</th>
            </tr>
          </ng-template>

          <ng-template pTemplate="body" let-user>
            <tr>
              <td>
                <div class="user-info-cell">
                  <div class="avatar-box">
                    {{ user.username.charAt(0).toUpperCase() }}
                  </div>
                  <div class="user-details">
                    <span class="user-name">{{ user.username }}</span>
                    <span class="user-email">{{ user.email }}</span>
                  </div>
                </div>
              </td>
              <td>
                <div class="roles-pills">
                  @for (role of user.roles.slice(0, 3); track role) {
                    <span class="role-pill">{{ roleLabel(role) }}</span>
                  }
                  @if (user.roles.length > 3) {
                    <span class="role-pill more">+1</span>
                  }
                </div>
              </td>
              <td>
                <div class="status-cell">
                  <span class="dot" [class.active]="user.active"></span>
                  <span class="status-text" [class.active]="user.active">
                    {{ user.active ? 'Activo' : 'Inactivo' }}
                  </span>
                </div>
              </td>
              <td>
                <span class="last-access-text">{{ lastAccessLabel(user) }}</span>
              </td>
              <td>
                <div class="actions-cell">
                  <button
                    type="button"
                    class="btn-action edit"
                    aria-label="Editar usuario"
                    (click)="openEdit(user)"
                  >
                    <i class="pi pi-pencil" aria-hidden="true"></i>
                  </button>
                </div>
              </td>
            </tr>
          </ng-template>
        </p-table>

        <div class="pagination-bar">
          <span class="pagination-info">
            Mostrando {{ pageStart() }} a {{ pageEnd() }} de {{ filteredUsers().length }} usuarios
          </span>
          <div class="pagination-controls">
            <button
              type="button"
              class="pag-btn"
              [disabled]="currentPage() === 1"
              (click)="changePage(1)"
              aria-label="Primera página"
            >
              Primera
            </button>
            <button
              type="button"
              class="pag-btn pag-btn--icon"
              [disabled]="currentPage() === 1"
              (click)="changePage(currentPage() - 1)"
              aria-label="Pagina anterior"
            >
              <i class="pi pi-angle-left"></i>
            </button>
            @for (page of visiblePages(); track page) {
              <button
                type="button"
                class="pag-btn"
                [class.active]="page === currentPage()"
                (click)="changePage(page)"
              >
                {{ page }}
              </button>
            }
            <button
              type="button"
              class="pag-btn pag-btn--icon"
              [disabled]="currentPage() === totalPages()"
              (click)="changePage(currentPage() + 1)"
              aria-label="Pagina siguiente"
            >
              <i class="pi pi-angle-right"></i>
            </button>
            <button
              type="button"
              class="pag-btn"
              [disabled]="currentPage() === totalPages()"
              (click)="changePage(totalPages())"
              aria-label="Última página"
            >
              Última
            </button>
          </div>
        </div>
      </div>

      <button
        pButton
        type="button"
        icon="pi pi-plus"
        class="mobile-add-fab"
        aria-label="Añadir usuario"
        (click)="openCreate()"
      ></button>
    </div>

    <p-drawer
      [(visible)]="dialogVisible"
      position="right"
      [modal]="true"
      [style]="{ width: 'min(26rem, 100vw)', border: 'none' }"
      (onHide)="resetForm()"
      class="lunara-drawer"
    >
      <ng-template pTemplate="header">
        <span class="drawer-title">{{ editingUser() ? 'Editar usuario' : 'Añadir usuario' }}</span>
      </ng-template>

      <form [formGroup]="form" (ngSubmit)="submit()" class="drawer-form">
        <!-- Sidebar Profile Header -->
        @if (editingUser()) {
          <div class="drawer-user-header">
            <div class="drawer-avatar">
              {{ editingUser()?.username?.charAt(0)?.toUpperCase() }}
            </div>
            <div class="drawer-user-info">
              <span class="drawer-username">{{ editingUser()?.username }}</span>
              <span class="drawer-userid">ID #{{ (editingUser()!.id).toString().padStart(5, '0') }}</span>
            </div>
          </div>
        }

        <div class="form-body">
          @if (submitError(); as error) {
            <article class="validation-banner validation-banner--danger">
              <strong>
                <i class="pi pi-exclamation-triangle" aria-hidden="true"></i>
                Corrige la informacion del usuario
              </strong>
              <p>{{ error }}</p>
            </article>
          }
          <div class="lunara-field">
            <label>NOMBRE COMPLETO *</label>
            <input pInputText formControlName="username" placeholder="Juan López" />
            @if (showControlError('username')) {
              <small class="error-text">{{ controlError('username') }}</small>
            }
          </div>

          <div class="lunara-field">
            <label>CORREO ELECTRÓNICO *</label>
            <input pInputText type="email" formControlName="email" placeholder="juan&#64;lunara.com" />
            @if (showControlError('email')) {
              <small class="error-text">{{ controlError('email') }}</small>
            }
          </div>

          <div class="lunara-field">
            <label>{{ editingUser() ? 'CONTRASEÑA' : 'CONTRASEÑA *' }}</label>
            <p-password 
              formControlName="password" 
              [feedback]="false" 
              [toggleMask]="true" 
              [placeholder]="editingUser() ? 'Opcional' : '********'" 
              fluid 
            />
            @if (showControlError('password')) {
              <small class="error-text">{{ controlError('password') }}</small>
            }
          </div>

          <div class="lunara-field">
            <label>ROLES DE ACCESO *</label>
            <p-multiselect
              formControlName="roles"
              [options]="roleOptions"
              optionLabel="label"
              optionValue="value"
              display="chip"
              placeholder="Selecciona uno o más roles"
              appendTo="body"
            />
            <span class="field-hint">Selecciona uno o más roles para este usuario.</span>
            @if (showControlError('roles')) {
              <small class="error-text">{{ controlError('roles') }}</small>
            }
          </div>

          <div class="lunara-field pt-2">
            <label>ESTADO DE LA CUENTA</label>
            <div class="toggle-row">
              <p-toggleswitch formControlName="active"></p-toggleswitch>
              <span class="toggle-label">Cuenta activa</span>
            </div>
            <p class="field-hint">El usuario podrá iniciar sesión y acceder al sistema.</p>
          </div>
        </div>

        <div class="drawer-footer">
          <button pButton type="button" label="Cancelar" (click)="dialogVisible = false" class="btn-cancel"></button>
          <button
            pButton
            type="submit"
            [icon]="'pi pi-check'"
            [label]="editingUser() ? 'Guardar Cambios' : 'Crear Usuario'"
            [loading]="saving()"
            class="btn-save"
          ></button>
        </div>
      </form>
    </p-drawer>
  `,
  styles: `
    .users-page-container {
      padding: 3rem 4rem 6rem;
      background: #ffffff !important;
      min-height: 100vh;
      max-width: 1700px;
      margin: 0 auto;
    }

    /* Header */
    .users-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 2rem;
      gap: 1.25rem 1.5rem;
      flex-wrap: wrap;
    }

    .header-info {
      min-width: 0;
      flex: 1 1 24rem;
    }

    .header-info h1 {
      font-family: var(--app-font-serif, 'Playfair Display', serif);
      font-size: clamp(2rem, 4vw, 2.75rem);
      line-height: 1.1;
      letter-spacing: -0.01em;
      margin: 0;
      color: var(--app-brown, #1a1a1a);
      font-weight: 700;
      line-height: 0.96;
    }

    .header-info p {
      color: #8a735c;
      margin: 0.25rem 0 0;
      font-size: 0.9rem;
    }

    .btn-gold-add {
      background: #c8922d !important;
      border: none !important;
      padding: 0.8rem 1.75rem !important;
      border-radius: 10px !important;
      font-weight: 600 !important;
      font-size: 0.9rem !important;
      color: white !important;
      box-shadow: 0 4px 15px rgba(200, 146, 45, 0.25) !important;
      transition: all 0.3s ease !important;
    }

    .btn-gold-add:hover {
      transform: translateY(-2px);
      box-shadow: 0 8px 20px rgba(200, 146, 45, 0.35) !important;
    }

    ::ng-deep .btn-gold-add .p-button-icon,
    ::ng-deep .btn-gold-add .p-button-label {
      color: #ffffff !important;
    }

    .mobile-add-fab {
      display: none;
    }

    /* Stats Grid */
    .stats-grid {
      display: grid;
      grid-template-columns: repeat(3, minmax(0, 1fr));
      gap: 1.5rem;
      margin-top: 0.25rem;
      margin-bottom: 2.5rem;
    }

    .stat-card {
      display: grid;
      grid-template-columns: auto 1fr;
      align-items: center;
      gap: 1rem;
      min-height: 132px;
      padding: 1.5rem;
    }

    .stat-card:hover {
      transform: translateY(-2px);
      box-shadow: 0 12px 30px rgba(61, 43, 31, 0.05);
    }

    .stat-icon-wrapper {
      width: 3rem;
      height: 3rem;
      border-radius: 999px;
      background: rgba(200, 146, 45, 0.1);
      border: 1px solid rgba(200, 146, 45, 0.1);
      color: #c8922d;
      display: grid;
      place-items: center;
      position: relative;
    }

    .stat-icon-wrapper > * {
      opacity: 1;
    }

    .stat-svg {
      width: 1.15rem;
      height: 1.15rem;
    }

    .stat-content {
      min-width: 0;
    }

    .stat-label {
      display: block;
      font-size: 0.75rem;
      font-weight: 700;
      color: #8a735c;
      text-transform: uppercase;
      letter-spacing: 0.1em;
    }

    .stat-value {
      display: block;
      font-family: var(--app-font-serif, 'Playfair Display', serif);
      font-size: 2.25rem;
      color: var(--app-brown, #1a1a1a);
      line-height: 1;
      margin: 0.25rem 0;
    }

    .stat-sub {
      display: block;
      font-size: 0.8rem;
      color: #a3907d;
      font-weight: 500;
      white-space: normal;
      overflow: visible;
      text-overflow: initial;
      max-width: 28ch;
      line-height: 1.45;
    }

    @media (max-width: 1100px) {
      .stats-grid {
        grid-template-columns: repeat(2, minmax(0, 1fr));
      }
    }

    @media (max-width: 720px) {
      .stats-grid {
        grid-template-columns: repeat(3, minmax(0, 1fr));
        gap: 0.6rem;
      }

      .stat-card {
        min-height: 0;
        padding: 0.75rem 0.55rem;
        grid-template-columns: 1fr;
        justify-items: center;
        text-align: center;
        gap: 0.45rem;
      }

      .stat-icon-wrapper {
        width: 2.45rem;
        height: 2.45rem;
      }

      .stat-svg {
        width: 0.95rem;
        height: 0.95rem;
      }

      .stat-label {
        font-size: 0.66rem;
        letter-spacing: 0.06em;
      }

      .stat-value {
        font-size: 1.95rem;
      }

      .stat-sub {
        font-size: 0.72rem;
        line-height: 1.35;
      }
    }

    /* Table Container */
    .table-container {
      background: white;
      border: 1px solid #f0f0f0;
      border-radius: 12px;
      overflow: hidden;
      box-shadow: 0 20px 50px rgba(0,0,0,0.06);
    }

    .table-toolbar {
      padding: 1.25rem 1.5rem;
      display: flex;
      justify-content: space-between;
      align-items: center;
      border-bottom: 1px solid #f8f8f8;
      background: white;
      gap: 1rem;
      flex-wrap: wrap;
    }

    .search-box {
      position: relative;
      flex: 1;
      max-width: 360px;
    }

    .search-box i {
      position: absolute;
      left: 1rem;
      top: 50%;
      transform: translateY(-50%);
      color: #999;
      font-size: 0.9rem;
    }

    .search-box input {
      width: 100%;
      padding: 0.7rem 1rem 0.7rem 2.75rem;
      border: 1px solid #f0f0f0;
      border-radius: 10px;
      background: #ffffff;
      font-size: 0.88rem;
      color: #1a1a1a;
      transition: all 0.2s;
    }

    .search-box input::placeholder {
      color: #1a1a1a;
    }

    .search-box input:focus {
      background: white;
      border-color: #c8922d;
      outline: none;
      box-shadow: 0 0 0 3px rgba(200, 146, 45, 0.1);
    }

    .filter-actions {
      display: flex;
      gap: 0.75rem;
      align-items: center;
      flex-wrap: wrap;
      justify-content: flex-end;
    }

    .lunara-native-select {
      min-width: 150px;
      max-width: 100%;
      padding: 0.6rem 2rem 0.6rem 1rem;
      border: 1px solid #f0f0f0;
      border-radius: 10px;
      font-size: 0.82rem;
      color: #444;
      font-weight: 500;
      background: white;
      cursor: pointer;
      appearance: none;
      background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%23999' d='M2.5 4.5L6 8l3.5-3.5'/%3E%3C/svg%3E");
      background-repeat: no-repeat;
      background-position: right 0.75rem center;
    }

    .lunara-native-select:focus {
      outline: none;
      border-color: #c8922d;
    }

    .btn-filter-text {
      background: transparent !important;
      color: #c8922d !important;
      font-size: 0.82rem !important;
      font-weight: 600 !important;
      padding: 0.6rem 1rem !important;
      border: 1px solid transparent !important;
      border-radius: 10px !important;
    }

    .btn-filter-text:hover {
      background: rgba(200, 146, 45, 0.05) !important;
    }

    /* Table Styles */
    ::ng-deep .lunara-table {
      .p-datatable-wrapper {
        overflow-x: auto;
        -webkit-overflow-scrolling: touch;
      }

      .p-datatable-table {
        min-width: 52rem;
      }

      .p-datatable-thead > tr > th {
        background: #fdfcf9;
        padding: 1rem 1.5rem;
        color: #999;
        font-size: 11px;
        font-weight: 700;
        text-transform: uppercase;
        letter-spacing: 0.08em;
        border-bottom: 1px solid #f0f0f0;
      }

      .p-datatable-tbody > tr > td {
        padding: 1.5rem 1.75rem;
        border-bottom: 1px solid #fafafa;
        vertical-align: middle;
      }

      .p-paginator {
        border: none;
        border-top: 1px solid #f5eee3;
        padding: 1rem 1.2rem;
        justify-content: space-between;
        gap: 0.75rem 1rem;
        flex-wrap: wrap;
      }

      .p-paginator-current {
        color: #8a7867;
        font-size: 0.84rem;
      }

      .p-paginator .p-paginator-element {
        min-width: 2.35rem;
        height: 2.35rem;
        border-radius: 0.8rem;
      }

      .p-paginator .p-paginator-page.p-highlight {
        background: #c8922d;
        border-color: #c8922d;
        color: #ffffff;
      }
    }

    .user-info-cell {
      display: flex;
      align-items: center;
      gap: 1rem;
    }

    .avatar-box {
      width: 2.5rem;
      height: 2.5rem;
      background: #fdfbf7;
      border: 1px solid #f5e6d3;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      color: #c8922d;
      font-weight: 700;
      font-family: 'Playfair Display', serif;
    }

    .user-name {
      display: block;
      font-weight: 700;
      color: #1a1a1a;
      font-size: 0.9rem;
    }

    .user-email {
      font-size: 0.75rem;
      color: #999;
    }

    .roles-pills {
      display: flex;
      gap: 0.5rem;
      flex-wrap: wrap;
    }

    .role-pill {
      background: #f8f8f8;
      border: 1px solid #eee;
      padding: 0.25rem 0.6rem;
      border-radius: 6px;
      font-size: 10px;
      font-weight: 700;
      color: #666;
      text-transform: uppercase;
    }

    .role-pill.more {
      background: white;
      border-style: dashed;
      color: #999;
    }

    .status-cell {
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }

    .dot {
      width: 7px;
      height: 7px;
      border-radius: 50%;
      background: #ccc;
    }

    .dot.active {
      background: #22c55e;
      box-shadow: 0 0 0 3px rgba(34, 197, 94, 0.15);
    }

    .status-text {
      font-size: 0.8rem;
      font-weight: 600;
      color: #999;
    }

    .status-text.active {
      color: #1a1a1a;
    }

    .last-access-text {
      font-size: 0.85rem;
      color: #666;
    }

    .actions-cell {
      display: flex;
      gap: 0.5rem;
    }

    .btn-action {
      width: 2.25rem;
      height: 2.25rem;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      background: white;
      border: 1px solid #f0f0f0;
      color: #999;
      border-radius: 8px;
      padding: 0;
      cursor: pointer;
      transition: border-color 0.15s ease, color 0.15s ease;
    }

    .btn-action:hover {
      border-color: #e5e5e5;
      color: #666;
    }

    .btn-action.edit {
      background: #fdfbf7;
      border-color: #f5e6d3;
      color: #c8922d;
      font-size: 1rem;
      box-shadow: 0 2px 6px rgba(200, 146, 45, 0.1);
    }

    .btn-action.edit:hover {
      background: #c8922d;
      border-color: #c8922d;
      color: white;
      transform: scale(1.1);
    }

    /* Pagination */
    .pagination-bar {
      padding: 1.1rem 1.5rem;
      display: flex;
      justify-content: space-between;
      align-items: center;
      background: white;
    }

    .pagination-info {
      font-size: 0.85rem;
      color: #999;
    }

    .pagination-controls {
      display: flex;
      gap: 0.5rem;
      align-items: center;
    }

    @media (max-width: 1200px) {
      .users-page-container {
        padding: 2rem 2rem 3rem;
      }

      .users-header,
      .table-toolbar {
        flex-wrap: wrap;
        align-items: stretch;
        gap: 1rem;
      }

      .search-box {
        max-width: none;
      }

      .filter-actions {
        flex-wrap: wrap;
        justify-content: flex-start;
      }
    }

    @media (max-width: 900px) {
      .users-page-container {
        padding: 1.1rem 0.95rem 6rem;
      }

      .users-header {
        flex-direction: column;
        align-items: center;
        text-align: center;
        gap: 0.85rem;
      }

      .header-info {
        width: 100%;
        display: grid;
        justify-items: center;
      }

      .header-info h1 {
        font-size: clamp(1.75rem, 7.1vw, 2.05rem);
      }

      .header-info p {
        margin-inline: auto;
        max-width: 42rem;
      }

      .table-toolbar,
      .pagination-bar {
        flex-direction: column;
        align-items: stretch;
        gap: 0.85rem;
      }

      .filter-actions > *,
      .lunara-native-select,
      .btn-filter-text {
        width: 100%;
      }

      .filter-actions {
        flex-direction: column;
        align-items: stretch;
      }

      .stat-sub {
        white-space: normal;
        overflow: visible;
        text-overflow: clip;
        max-width: none;
      }

      ::ng-deep .lunara-table .p-datatable-table {
        min-width: 100% !important;
      }

      ::ng-deep .lunara-table .p-datatable-thead {
        display: none;
      }

      ::ng-deep .lunara-table .p-datatable-tbody,
      ::ng-deep .lunara-table .p-datatable-tbody > tr,
      ::ng-deep .lunara-table .p-datatable-tbody > tr > td {
        display: block;
        width: 100%;
      }

      ::ng-deep .lunara-table .p-datatable-tbody {
        padding: 0.95rem;
      }

      ::ng-deep .lunara-table .p-datatable-tbody > tr {
        margin-bottom: 0.95rem;
        padding: 1rem;
        border: 1px solid rgba(214, 191, 152, 0.22);
        border-radius: 1.1rem;
        background: linear-gradient(180deg, rgba(255, 255, 255, 0.98), rgba(253, 250, 244, 0.96));
        box-shadow: 0 14px 28px rgba(45, 32, 22, 0.05);
      }

      ::ng-deep .lunara-table .p-datatable-tbody > tr:last-child {
        margin-bottom: 0;
      }

      ::ng-deep .lunara-table .p-datatable-tbody > tr > td {
        width: auto !important;
        min-width: 0 !important;
        padding: 0 !important;
        border: none !important;
        text-align: left !important;
        display: grid;
        grid-template-columns: 1fr;
        gap: 0.35rem;
        align-items: start;
        white-space: normal;
        overflow-wrap: break-word;
        word-break: normal;
      }

      ::ng-deep .lunara-table .p-datatable-tbody > tr > td + td {
        margin-top: 0.8rem;
        padding-top: 0.8rem !important;
        border-top: 1px solid rgba(214, 191, 152, 0.18) !important;
      }

      ::ng-deep .lunara-table .p-datatable-tbody > tr > td::before {
        content: '';
        font-size: 0.68rem;
        font-weight: 800;
        letter-spacing: 0.08em;
        text-transform: uppercase;
        color: #9a6f14;
      }

      ::ng-deep .lunara-table .p-datatable-tbody > tr > td:nth-child(1)::before {
        content: 'Usuario';
      }

      ::ng-deep .lunara-table .p-datatable-tbody > tr > td:nth-child(2)::before {
        content: 'Roles';
      }

      ::ng-deep .lunara-table .p-datatable-tbody > tr > td:nth-child(3)::before {
        content: 'Estado';
      }

      ::ng-deep .lunara-table .p-datatable-tbody > tr > td:nth-child(4)::before {
        content: 'Ultimo acceso';
      }

      ::ng-deep .lunara-table .p-datatable-tbody > tr > td:nth-child(5)::before {
        content: 'Acciones';
      }

      /* Reorganiza cada usuario como tarjeta: identidad arriba + datos en rejilla. */
      ::ng-deep .lunara-table .p-datatable-tbody > tr {
        display: grid;
        grid-template-columns: minmax(0, 1fr) minmax(0, 1fr) auto;
        column-gap: 0.85rem;
        row-gap: 0.45rem;
        align-items: start;
      }

      ::ng-deep .lunara-table .p-datatable-tbody > tr > td {
        margin-top: 0 !important;
        padding-top: 0 !important;
        border-top: none !important;
      }

      ::ng-deep .lunara-table .p-datatable-tbody > tr > td:nth-child(1) {
        grid-column: 1 / -1;
        grid-row: 1;
      }

      ::ng-deep .lunara-table .p-datatable-tbody > tr > td:nth-child(2) {
        grid-column: 1;
        grid-row: 2;
      }

      ::ng-deep .lunara-table .p-datatable-tbody > tr > td:nth-child(3) {
        grid-column: 2;
        grid-row: 2;
      }

      ::ng-deep .lunara-table .p-datatable-tbody > tr > td:nth-child(4) {
        grid-column: 1 / 3;
        grid-row: 3;
      }

      ::ng-deep .lunara-table .p-datatable-tbody > tr > td:nth-child(5) {
        grid-column: 3;
        grid-row: 2 / span 2;
        justify-self: end;
        align-self: center;
      }

      .user-info-cell {
        gap: 0.75rem;
      }

      .avatar-box {
        width: 2.35rem;
        height: 2.35rem;
        font-size: 1.05rem;
      }

      .user-name {
        font-size: 1.05rem;
      }

      .user-email {
        font-size: 0.82rem;
      }

      .actions-cell {
        justify-content: flex-end;
      }

      .btn-action {
        width: 2.4rem;
        height: 2.4rem;
      }

      .pagination-controls {
        flex-wrap: nowrap;
        overflow-x: auto;
        justify-content: flex-start;
        padding-bottom: 0.15rem;
        scrollbar-width: none;
      }

      .pagination-controls::-webkit-scrollbar {
        display: none;
      }

      .pag-btn {
        width: auto;
        min-width: 2.7rem;
        flex: 0 0 auto;
      }

      .mobile-add-fab {
        display: inline-flex;
        position: fixed;
        right: 1rem;
        bottom: 1rem;
        width: 5.1rem;
        height: 5.1rem;
        border-radius: 999px !important;
        z-index: 20;
        box-shadow: 0 18px 32px rgba(200, 146, 45, 0.34) !important;
        color: #ffffff !important;
      }

      ::ng-deep .mobile-add-fab.p-button .p-button-label {
        display: none;
      }

      ::ng-deep .mobile-add-fab.p-button .p-button-icon {
        margin: 0 !important;
        font-size: 1.35rem;
        color: #ffffff !important;
      }
    }

    .pag-btn {
      min-width: 2.5rem;
      height: 2.25rem;
      padding: 0 0.85rem;
      border-radius: 8px;
      border: 1px solid #f0f0f0;
      background: white;
      color: #666;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      transition: all 0.2s;
    }

    .pag-btn--icon {
      min-width: 2.4rem;
      padding: 0;
    }

    .pag-btn.active {
      background: #c8922d;
      border-color: #c8922d;
      color: white;
      font-weight: 700;
    }

    .pag-btn:hover:not(.active) {
      border-color: #c8922d;
      color: #c8922d;
    }

    /* Drawer Styles */
    ::ng-deep .lunara-drawer {
      .p-dialog {
        border-radius: 0 !important;
        box-shadow: -10px 0 30px rgba(0,0,0,0.05) !important;
      }
      .p-dialog-header {
        padding: 2rem 2rem 1.5rem !important;
        border-bottom: 1px solid #f8f8f8;
      }
      .p-dialog-content {
        padding: 0 !important;
        display: flex;
        flex-direction: column;
      }
    }

    .drawer-title {
      font-family: 'Playfair Display', serif;
      font-size: 1.75rem;
      font-weight: 700;
    }

    .drawer-form {
      display: flex;
      flex-direction: column;
      height: calc(100vh - 80px);
    }

    .drawer-user-header {
      margin: 2rem;
      padding: 1.5rem;
      background: #fdfcf9;
      border: 1px solid #f5e6d3;
      border-radius: 16px;
      display: flex;
      gap: 1.25rem;
      align-items: center;
    }

    .drawer-avatar {
      width: 3.5rem;
      height: 3.5rem;
      background: white;
      border: 1.5px solid #f5e6d3;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      color: #c8922d;
      font-size: 1.5rem;
      font-weight: 700;
      font-family: 'Playfair Display', serif;
    }

    .drawer-user-info {
      display: flex;
      flex-direction: column;
    }

    .drawer-username {
      font-weight: 700;
      font-size: 1.2rem;
      color: #1a1a1a;
    }

    .drawer-userid {
      font-size: 0.8rem;
      color: #999;
      font-weight: 500;
    }

    .form-body {
      padding: 0 2rem;
      display: flex;
      flex-direction: column;
      gap: 2rem;
      overflow-y: auto;
    }

    .lunara-field {
      display: flex;
      flex-direction: column;
      gap: 0.6rem;
    }

    .lunara-field label {
      font-size: 0.75rem;
      font-weight: 700;
      color: #1a1a1a;
      letter-spacing: 0.02em;
    }

    .lunara-field input, ::ng-deep .lunara-field .p-password input, ::ng-deep .lunara-field .p-multiselect {
      width: 100% !important;
      padding: 0.8rem 1.25rem !important;
      border-radius: 12px !important;
      border: 1px solid #f0f0f0 !important;
      background: white !important;
      font-size: 0.95rem !important;
      transition: all 0.3s;
    }

    ::ng-deep .p-multiselect {
      display: flex;
      align-items: center;
      min-height: 3.5rem;
    }

    ::ng-deep .p-multiselect-label {
      padding: 0 !important;
      display: flex;
      flex-wrap: wrap;
      gap: 0.5rem;
    }

    ::ng-deep .p-multiselect-chip {
      background: rgba(200, 146, 45, 0.08) !important;
      color: #c8922d !important;
      border: 1px solid rgba(200, 146, 45, 0.2) !important;
      border-radius: 8px !important;
      padding: 0.25rem 0.75rem !important;
      font-weight: 600 !important;
      font-size: 0.85rem !important;
      display: inline-flex !important;
      align-items: center !important;
      gap: 0.5rem !important;
    }

    ::ng-deep .p-multiselect-chip-icon {
      color: #c8922d !important;
      font-size: 0.7rem !important;
      margin-left: 0.25rem !important;
    }

    ::ng-deep .p-multiselect-trigger {
      color: #999 !important;
      width: 2.5rem !important;
    }

    /* MultiSelect Panel Professional Styling */
    ::ng-deep .p-multiselect-panel {
      background: #ffffff !important;
      border: 1px solid #f0f0f0 !important;
      border-radius: 16px !important;
      box-shadow: 0 15px 45px rgba(0,0,0,0.1) !important;
      padding: 0.5rem !important;
      margin-top: 0.5rem !important;
    }

    ::ng-deep .p-multiselect-filter-container {
      padding: 0.75rem !important;
      background: #fafafa !important;
      border-radius: 12px !important;
      margin: 0.5rem !important;
    }

    ::ng-deep .p-multiselect-filter {
      background: transparent !important;
      border: none !important;
      padding: 0.5rem !important;
      font-size: 0.9rem !important;
    }

    ::ng-deep .p-multiselect-filter:focus {
      box-shadow: none !important;
    }

    ::ng-deep .p-multiselect-items-wrapper {
      padding: 0.25rem !important;
    }

    ::ng-deep .p-multiselect-item {
      padding: 1rem 1.25rem !important;
      border-radius: 12px !important;
      margin: 0.25rem 0.5rem !important;
      transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1) !important;
      font-weight: 500 !important;
      color: #333 !important;
      display: flex !important;
      align-items: center !important;
      gap: 1rem !important;
      font-size: 0.95rem !important;
    }

    ::ng-deep .p-multiselect-item:hover {
      background: rgba(200, 146, 45, 0.04) !important;
      color: #c8922d !important;
      transform: translateX(6px);
    }

    ::ng-deep .p-multiselect-item.p-highlight {
      background: rgba(200, 146, 45, 0.08) !important;
      color: #c8922d !important;
    }

    /* Checkbox Styling inside MultiSelect */
    ::ng-deep .p-checkbox {
      width: 20px !important;
      height: 20px !important;
    }

    ::ng-deep .p-checkbox-box {
      border-radius: 6px !important;
      border: 2px solid #ddd !important;
      transition: all 0.2s !important;
    }

    ::ng-deep .p-multiselect-item:hover .p-checkbox-box {
      border-color: #c8922d !important;
    }

    ::ng-deep .p-multiselect-item.p-highlight .p-checkbox-box {
      background: #c8922d !important;
      border-color: #c8922d !important;
    }

    ::ng-deep .p-checkbox-icon {
      font-size: 0.75rem !important;
      color: white !important;
    }

    ::ng-deep .p-multiselect-header {
      padding: 0.5rem !important;
      border-bottom: 1px solid #f0f0f0 !important;
      margin-bottom: 0.5rem !important;
    }

    .field-hint {
      font-size: 0.7rem;
      color: #aaa;
      margin-top: 0.2rem;
    }

    .toggle-row {
      display: flex;
      align-items: center;
      gap: 0.75rem;
    }

    .toggle-label {
      font-size: 0.9rem;
      font-weight: 600;
      color: #444;
    }

    .drawer-footer {
      padding: 2rem;
      margin-top: auto;
      display: flex;
      gap: 1rem;
      border-top: 1px solid #f8f8f8;
    }

    .btn-cancel {
      flex: 1;
      background: white !important;
      border: 1px solid #f0f0f0 !important;
      color: #666 !important;
      height: 3.5rem !important;
      border-radius: 12px !important;
      font-weight: 600 !important;
    }

    .btn-save {
      flex: 1;
      background: #c8922d !important;
      border: none !important;
      color: white !important;
      height: 3.5rem !important;
      border-radius: 12px !important;
      font-weight: 600 !important;
      box-shadow: 0 8px 20px rgba(200, 146, 45, 0.2) !important;
    }

    .error-text {
      color: #d32f2f;
      font-size: 0.75rem;
      font-weight: 500;
    }

    @media (max-width: 1180px) {
      .users-page-container {
        padding: 2rem 2rem 3rem;
      }

      .table-toolbar {
        align-items: stretch;
      }

      .search-box {
        max-width: none;
      }

      .filter-actions {
        width: 100%;
        justify-content: flex-start;
      }
    }

    @media (max-width: 900px) {
      .users-header {
        align-items: stretch;
      }

      .btn-gold-add {
        width: 100%;
        justify-content: center;
      }

      .stats-grid {
        grid-template-columns: 1fr;
      }

      ::ng-deep .lunara-table {
        .p-datatable-table {
          min-width: 44rem;
        }

        .p-datatable-thead > tr > th,
        .p-datatable-tbody > tr > td {
          padding: 1rem 0.95rem;
        }
      }
    }

    @media (max-width: 720px) {
      .users-page-container {
        padding: 1.5rem 1rem 6rem;
      }

      .btn-gold-add {
        display: none !important;
      }

      .header-info h1 {
        font-size: clamp(1.95rem, 8.8vw, 2.4rem);
      }

      .header-info p {
        max-width: 22rem;
        font-size: 0.95rem;
        line-height: 1.55;
      }

      .stats-grid {
        grid-template-columns: repeat(3, minmax(0, 1fr));
        gap: 0.75rem;
      }

      .stat-card {
        grid-template-columns: 1fr;
        align-items: center;
        justify-items: center;
        text-align: center;
        gap: 0.65rem;
        min-height: 0;
        padding: 1rem 0.7rem;
        border-radius: 1.35rem;
      }

      .stat-icon-wrapper {
        width: 3rem;
        height: 3rem;
      }

      .stat-label {
        font-size: 0.62rem;
      }

      .stat-value {
        font-size: 1.95rem;
      }

      .stat-sub {
        font-size: 0.72rem;
        line-height: 1.35;
      }

      .table-toolbar {
        padding: 1rem;
      }

      .filter-actions > * {
        width: 100%;
      }

      .btn-filter-text {
        justify-content: center !important;
      }

      ::ng-deep .lunara-table {
        .p-datatable-table {
          min-width: 38rem;
        }

        .p-paginator {
          justify-content: center;
          padding: 0.9rem 0.95rem 1rem;
        }

        .p-paginator-current {
          width: 100%;
          text-align: center;
          order: 3;
        }
      }

      .drawer-footer {
        flex-direction: column-reverse;
      }
    }

    @media (max-width: 560px) {
      .users-page-container {
        padding-inline: 0.9rem;
      }

      .header-info h1 {
        font-size: clamp(1.9rem, 8.6vw, 2.2rem);
      }

      .header-info {
        flex-basis: 100%;
      }

      .stat-card {
        padding: 1.15rem;
        border-radius: 1.2rem;
      }

      .stats-grid {
        grid-template-columns: repeat(3, minmax(0, 1fr));
        gap: 0.65rem;
      }

      .stat-value {
        font-size: 1.9rem;
      }

      .stat-sub {
        max-width: none;
        font-size: 0.7rem;
        line-height: 1.3;
      }

      ::ng-deep .lunara-table {
        .p-datatable-table {
          min-width: 33rem;
        }

        .p-datatable-thead > tr > th,
        .p-datatable-tbody > tr > td {
          padding: 0.9rem 0.78rem;
        }

        .p-paginator .p-paginator-element {
          min-width: 2.1rem;
          height: 2.1rem;
        }
      }

      .drawer-user-header,
      .form-body,
      .drawer-footer {
        padding-inline: 1rem;
        margin-inline: 1rem;
      }

      .drawer-user-header {
        margin-top: 1rem;
        margin-bottom: 1rem;
      }

      .drawer-footer {
        margin-inline: 0;
        padding-inline: 1rem;
      }
    }
  `
})
export class UsersPageComponent implements OnInit {
  private readonly usersApi = inject(UsersApiService);
  private readonly notificationService = inject(NotificationService);
  private readonly fb = inject(FormBuilder);

  protected readonly users = signal<AppUser[]>([]);
  protected readonly loading = signal(false);
  protected readonly saving = signal(false);
  protected readonly editingUser = signal<AppUser | null>(null);
  protected readonly submitError = signal<string | null>(null);
  protected readonly searchQuery = signal('');
  protected readonly roleFilter = signal<AppRole | ''>('');
  protected readonly statusFilter = signal<boolean | null>(null);
  protected readonly currentPage = signal(1);
  protected readonly pageSize = 10;
  protected dialogVisible = false;

  protected readonly statusOptions = [
    { label: 'Activo', value: true },
    { label: 'Inactivo', value: false }
  ];

  protected readonly roleOptions = (Object.keys(ROLE_LABELS) as AppRole[]).map((value) => ({
    value,
    label: ROLE_LABELS[value]
  }));

  protected readonly activeCount = computed(
    () => this.users().filter((user) => user.active).length
  );

  protected readonly filteredUsers = computed(() => {
    const query = this.searchQuery().toLowerCase().trim();
    const role = this.roleFilter();
    const status = this.statusFilter();

    let list = this.users();

    if (query) {
      list = list.filter(u => 
        u.username.toLowerCase().includes(query) || 
        u.roles.some(r => this.roleLabel(r).toLowerCase().includes(query))
      );
    }

    if (role) {
      list = list.filter(u => u.roles.includes(role));
    }

    if (status !== null) {
      list = list.filter(u => u.active === status);
    }

    return list;
  });

  protected readonly distinctRoles = computed(() =>
    Array.from(new Set(this.users().flatMap((user) => user.roles)))
  );
  protected readonly totalPages = computed(() =>
    Math.max(1, Math.ceil(this.filteredUsers().length / this.pageSize))
  );
  protected readonly pageStart = computed(() =>
    this.filteredUsers().length ? (this.currentPage() - 1) * this.pageSize + 1 : 0
  );
  protected readonly pageEnd = computed(() =>
    Math.min(this.currentPage() * this.pageSize, this.filteredUsers().length)
  );
  protected readonly paginatedUsers = computed(() => {
    const start = (this.currentPage() - 1) * this.pageSize;
    return this.filteredUsers().slice(start, start + this.pageSize);
  });
  protected readonly visiblePages = computed(() => {
    const totalPages = this.totalPages();
    const currentPage = this.currentPage();
    const maxButtons = 5;

    let startPage = Math.max(1, currentPage - 2);
    let endPage = Math.min(totalPages, startPage + maxButtons - 1);

    if (endPage - startPage + 1 < maxButtons) {
      startPage = Math.max(1, endPage - maxButtons + 1);
    }

    return Array.from({ length: endPage - startPage + 1 }, (_, index) => startPage + index);
  });

  constructor() {
    effect(() => {
      const total = this.totalPages();
      if (this.currentPage() > total) {
        this.currentPage.set(total);
      }
    });
  }

  protected readonly form = this.fb.nonNullable.group({
    username: ['', [Validators.required, notBlankValidator]],
    email: ['', [Validators.required, Validators.email, notBlankValidator]],
    password: ['', [Validators.minLength(8), passwordStrengthValidator]],
    roles: [[] as AppRole[], [Validators.required]],
    active: [true]
  });

  protected clearFilters(): void {
    this.searchQuery.set('');
    this.roleFilter.set('');
    this.statusFilter.set(null);
    this.currentPage.set(1);
  }

  protected onSearchInput(event: Event): void {
    this.searchQuery.set((event.target as HTMLInputElement).value);
    this.currentPage.set(1);
  }

  protected onRoleFilterChange(event: Event): void {
    this.roleFilter.set((event.target as HTMLSelectElement).value as AppRole | '');
    this.currentPage.set(1);
  }

  protected onStatusChange(event: Event): void {
    const val = (event.target as HTMLSelectElement).value;
    if (val === '') this.statusFilter.set(null);
    else this.statusFilter.set(val === 'true');
    this.currentPage.set(1);
  }

  ngOnInit(): void {
    this.loadUsers();
  }

  protected loadUsers(): void {
    this.loading.set(true);
    this.usersApi
      .getUsers()
      .pipe(take(1))
      .subscribe({
        next: (users) => {
          this.users.set(users);
          this.currentPage.set(1);
          this.loading.set(false);
        },
        error: () => {
          this.loading.set(false);
        }
      });
  }

  protected openCreate(): void {
    this.submitError.set(null);
    this.editingUser.set(null);
    this.form.reset({
      username: '',
      email: '',
      password: '',
      roles: ['RECEPCION'],
      active: true
    });
    this.dialogVisible = true;
  }

  protected openEdit(user: AppUser): void {
    this.submitError.set(null);
    this.editingUser.set(user);
    this.form.reset({
      username: user.username,
      email: user.email,
      password: '',
      roles: [...user.roles],
      active: user.active
    });
    this.dialogVisible = true;
  }

  protected submit(): void {
    this.submitError.set(null);

    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const raw = this.form.getRawValue();
    const payload = {
      username: raw.username.trim(),
      email: raw.email.trim().toLowerCase(),
      password: raw.password.trim() ? raw.password.trim() : null,
      roles: raw.roles,
      active: raw.active
    };

    if (!this.editingUser() && !payload.password) {
      this.form.controls.password.setErrors({ required: true });
      this.form.controls.password.markAsTouched();
      return;
    }

    this.saving.set(true);

    const request$ = this.editingUser()
      ? this.usersApi.updateUser(this.editingUser()!.id, payload)
      : this.usersApi.createUser(payload);

    request$.pipe(take(1)).subscribe({
      next: () => {
        const wasEditing = !!this.editingUser();
        this.saving.set(false);
        this.dialogVisible = false;
        this.resetForm();
        this.notificationService.success(
          'Usuarios',
          wasEditing ? 'Usuario actualizado.' : 'Usuario creado.'
        );
        this.loadUsers();
      },
      error: (error) => {
        this.saving.set(false);
        const fieldErrors = extractApiFieldErrors(error.error);
        if (Object.keys(fieldErrors).length) {
          applyServerValidationErrors(this.form, fieldErrors);
          this.submitError.set('Revisa los campos marcados antes de guardar.');
          return;
        }

        const message = extractApiErrorMessage(error.error);
        this.submitError.set(message);

        if (message.toLowerCase().includes('usuario')) {
          this.form.controls.username.setErrors({
            ...(this.form.controls.username.errors ?? {}),
            server: message
          });
          this.form.controls.username.markAsTouched();
        }

        if (message.toLowerCase().includes('email') || message.toLowerCase().includes('correo')) {
          this.form.controls.email.setErrors({
            ...(this.form.controls.email.errors ?? {}),
            server: message
          });
          this.form.controls.email.markAsTouched();
        }
        if (message.toLowerCase().includes('contrasena')) {
          this.form.controls.password.setErrors({
            ...(this.form.controls.password.errors ?? {}),
            server: message
          });
          this.form.controls.password.markAsTouched();
        }
      }
    });
  }

  protected resetForm(): void {
    this.submitError.set(null);
    this.editingUser.set(null);
    this.form.reset({
      username: '',
      email: '',
      password: '',
      roles: [],
      active: true
    });
  }

  protected isRoleSelected(role: AppRole): boolean {
    const roles = this.form.controls.roles.value;
    return roles.includes(role);
  }

  protected toggleRole(role: AppRole): void {
    const currentRoles = [...this.form.controls.roles.value];
    const index = currentRoles.indexOf(role);
    
    if (index > -1) {
      currentRoles.splice(index, 1);
    } else {
      currentRoles.push(role);
    }
    
    this.form.controls.roles.setValue(currentRoles);
    this.form.controls.roles.markAsTouched();
  }

  protected roleLabel(role: AppRole): string {
    return ROLE_LABELS[role];
  }

  protected lastAccessLabel(user: AppUser): string {
    const labels = ['Hoy, 09:42', 'Ayer, 18:22', '2 días atrás', 'Hace 3 días'];
    return labels[Math.abs(user.id) % labels.length];
  }

  protected changePage(page: number): void {
    if (page < 1 || page > this.totalPages()) {
      return;
    }
    this.currentPage.set(page);
  }

  protected showControlError(controlName: 'username' | 'email' | 'password' | 'roles'): boolean {
    const control = this.form.controls[controlName];
    return control.invalid && control.touched;
  }

  protected controlError(controlName: 'username' | 'email' | 'password' | 'roles'): string {
    const control = this.form.controls[controlName];

    if (control.errors?.['server']) {
      return control.errors['server'] as string;
    }

    if (control.errors?.['required']) {
      return 'Este campo es obligatorio.';
    }

    if (control.errors?.['blank']) {
      return 'No puede quedar en blanco.';
    }

    if (control.errors?.['email']) {
      return 'Ingresa un correo electronico valido.';
    }
    if (control.errors?.['minlength']) {
      return 'Debe tener al menos 8 caracteres.';
    }

    if (control.errors?.['passwordStrength']) {
      return 'Debe tener mínimo 8 caracteres, una mayúscula y un número.';
    }

    return 'Valor invalido.';
  }
}
