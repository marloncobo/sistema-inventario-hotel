import { CommonModule } from '@angular/common';
import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { take } from 'rxjs';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { MultiSelectModule } from 'primeng/multiselect';
import { PasswordModule } from 'primeng/password';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { ToggleSwitchModule } from 'primeng/toggleswitch';
import { UsersApiService } from '@core/services/api/users-api.service';
import { NotificationService } from '@core/services/ui/notification.service';
import { extractApiFieldErrors } from '@models/api-error.model';
import type { AppUser } from '@models/app-user.model';
import { ROLE_LABELS, type AppRole } from '@models/role.model';
import { PageHeaderComponent } from '@shared/components/page-header/page-header.component';
import { applyServerValidationErrors } from '@shared/utils/form-errors.util';

@Component({
  selector: 'app-users-page',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    ButtonModule,
    DialogModule,
    InputTextModule,
    MultiSelectModule,
    PageHeaderComponent,
    PasswordModule,
    TableModule,
    TagModule,
    ToggleSwitchModule
  ],
  template: `
    <div class="space-y-8">
      <app-page-header
        eyebrow="Administracion"
        title="Usuarios"
        subtitle="Administra usuarios, roles y estados de acceso."
      >
        <div header-actions>
          <button pButton type="button" icon="pi pi-plus" label="Nuevo usuario" (click)="openCreate()"></button>
        </div>
      </app-page-header>

      <section class="summary-grid">
        <article class="summary-card">
          <span>Total usuarios</span>
          <strong>{{ users().length }}</strong>
          <small>Registros visibles en el sistema</small>
        </article>

        <article class="summary-card">
          <span>Usuarios activos</span>
          <strong>{{ activeCount() }}</strong>
          <small>Disponibles para iniciar sesion</small>
        </article>

        <article class="summary-card">
          <span>Roles configurados</span>
          <strong>{{ distinctRoles().length }}</strong>
          <small>{{ distinctRoles().join(', ') || 'Sin roles' }}</small>
        </article>
      </section>

      <section class="surface-card space-y-8">
        <div class="app-toolbar">
        <div>
          <h3 class="m-0">Listado de usuarios</h3>
          <small class="text-slate-500">Crea, edita y consulta usuarios.</small>
        </div>

          <div class="app-toolbar__actions">
            <button
              pButton
              type="button"
              icon="pi pi-refresh"
              label="Recargar"
              severity="secondary"
              variant="outlined"
              [loading]="loading()"
              (click)="loadUsers()"
            ></button>
          </div>
        </div>

        <p-table [value]="users()" [loading]="loading()" [paginator]="true" [rows]="8" responsiveLayout="scroll">
          <ng-template pTemplate="header">
            <tr>
              <th>Usuario</th>
              <th>Roles</th>
              <th>Estado</th>
              <th class="text-right">Acciones</th>
            </tr>
          </ng-template>

          <ng-template pTemplate="body" let-user>
            <tr>
              <td>
                <strong>{{ user.username }}</strong>
              </td>
              <td>
                <div class="flex flex-wrap gap-2">
                  @for (role of user.roles; track role) {
                    <p-tag [value]="roleLabel(role)" severity="info"></p-tag>
                  }
                </div>
              </td>
              <td>
                <p-tag [value]="user.active ? 'Activo' : 'Inactivo'" [severity]="user.active ? 'success' : 'danger'"></p-tag>
              </td>
              <td class="text-right">
                <button
                  pButton
                  type="button"
                  icon="pi pi-pen-to-square"
                  label="Editar"
                  size="small"
                  severity="secondary"
                  variant="outlined"
                  (click)="openEdit(user)"
                ></button>
              </td>
            </tr>
          </ng-template>
        </p-table>
      </section>
    </div>

    <p-dialog
      [(visible)]="dialogVisible"
      [modal]="true"
      [draggable]="false"
      [style]="{ width: 'min(46rem, 96vw)' }"
      [header]="editingUser() ? 'Editar usuario' : 'Crear usuario'"
      (onHide)="resetForm()"
    >
      <form [formGroup]="form" class="space-y-8" (ngSubmit)="submit()">
        <div class="form-grid">
          <label class="field">
            <span>Usuario</span>
            <input pInputText type="text" formControlName="username" />
            @if (showControlError('username')) {
              <small>{{ controlError('username') }}</small>
            }
          </label>

          <label class="field">
            <span>Contrasena {{ editingUser() ? '(opcional)' : '' }}</span>
            <p-password formControlName="password" [feedback]="false" [toggleMask]="true" fluid />
            @if (showControlError('password')) {
              <small>{{ controlError('password') }}</small>
            }
          </label>
        </div>

        <div class="form-grid">
          <label class="field">
            <span>Roles</span>
            <p-multiselect
              formControlName="roles"
              [options]="roleOptions"
              optionLabel="label"
              optionValue="value"
              display="chip"
              placeholder="Selecciona roles"
            />
            @if (showControlError('roles')) {
              <small>{{ controlError('roles') }}</small>
            }
          </label>

          <label class="field">
            <span>Activo</span>
            <p-toggleswitch formControlName="active"></p-toggleswitch>
          </label>
        </div>

        <div class="flex justify-end gap-3">
          <button
            pButton
            type="button"
            label="Cancelar"
            severity="secondary"
            variant="text"
            (click)="dialogVisible = false"
          ></button>
          <button
            pButton
            type="submit"
            [label]="editingUser() ? 'Guardar cambios' : 'Crear usuario'"
            [loading]="saving()"
          ></button>
        </div>
      </form>
    </p-dialog>
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
  protected dialogVisible = false;

  protected readonly roleOptions = (Object.keys(ROLE_LABELS) as AppRole[]).map((value) => ({
    value,
    label: ROLE_LABELS[value]
  }));

  protected readonly activeCount = computed(
    () => this.users().filter((user) => user.active).length
  );
  protected readonly distinctRoles = computed(() =>
    Array.from(new Set(this.users().flatMap((user) => user.roles)))
  );

  protected readonly form = this.fb.nonNullable.group({
    username: ['', [Validators.required]],
    password: ['', [Validators.minLength(8)]],
    roles: [[] as AppRole[], [Validators.required]],
    active: [true]
  });

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
          this.loading.set(false);
        },
        error: () => {
          this.loading.set(false);
        }
      });
  }

  protected openCreate(): void {
    this.editingUser.set(null);
    this.form.reset({
      username: '',
      password: '',
      roles: ['RECEPCION'],
      active: true
    });
    this.dialogVisible = true;
  }

  protected openEdit(user: AppUser): void {
    this.editingUser.set(user);
    this.form.reset({
      username: user.username,
      password: '',
      roles: [...user.roles],
      active: user.active
    });
    this.dialogVisible = true;
  }

  protected submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const raw = this.form.getRawValue();
    const payload = {
      username: raw.username.trim(),
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
        this.saving.set(false);
        this.dialogVisible = false;
        this.resetForm();
        this.notificationService.success(
          'Usuarios',
          this.editingUser() ? 'Usuario actualizado.' : 'Usuario creado.'
        );
        this.loadUsers();
      },
      error: (error) => {
        this.saving.set(false);
        applyServerValidationErrors(this.form, extractApiFieldErrors(error.error));
      }
    });
  }

  protected resetForm(): void {
    this.editingUser.set(null);
    this.form.reset({
      username: '',
      password: '',
      roles: [],
      active: true
    });
  }

  protected roleLabel(role: AppRole): string {
    return ROLE_LABELS[role];
  }

  protected showControlError(controlName: 'username' | 'password' | 'roles'): boolean {
    const control = this.form.controls[controlName];
    return control.invalid && control.touched;
  }

  protected controlError(controlName: 'username' | 'password' | 'roles'): string {
    const control = this.form.controls[controlName];

    if (control.errors?.['server']) {
      return control.errors['server'] as string;
    }

    if (control.errors?.['required']) {
      return 'Este campo es obligatorio.';
    }

    if (control.errors?.['minlength']) {
      return 'Debe tener al menos 8 caracteres.';
    }

    return 'Valor invalido.';
  }
}
