import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { take } from 'rxjs';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { InputTextModule } from 'primeng/inputtext';
import { PasswordModule } from 'primeng/password';
import { AuthService } from '@core/services/auth.service';
import { NotificationService } from '@core/services/ui/notification.service';

@Component({
  selector: 'app-login-page',
  standalone: true,
  imports: [ReactiveFormsModule, ButtonModule, CardModule, InputTextModule, PasswordModule],
  template: `
    <div class="login-shell">
      <section class="login-shell__hero">
        <span class="login-shell__eyebrow">Angular + Gateway existente</span>
        <h1>Frontend administrativo para inventario hotelero</h1>
        <p>
          Esta base consume exclusivamente el gateway http://localhost:8080 y respeta los contratos,
          roles y restricciones reales del backend actual.
        </p>

        <div class="login-shell__bullets">
          <article>
            <i class="pi pi-shield"></i>
            <div>
              <strong>JWT centralizado</strong>
              <span>Interceptor, guard de autenticación y control por roles.</span>
            </div>
          </article>

          <article>
            <i class="pi pi-building"></i>
            <div>
              <strong>Dominio hotelero</strong>
              <span>Preparado para inventario, habitaciones, asignaciones y reportes.</span>
            </div>
          </article>

          <article>
            <i class="pi pi-tablet"></i>
            <div>
              <strong>Shell responsive</strong>
              <span>Sidebar colapsable, topbar y breadcrumbs listos para producción.</span>
            </div>
          </article>
        </div>
      </section>

      <p-card class="login-card">
        <ng-template pTemplate="header">
          <div class="login-card__header">
            <div>
              <span class="login-card__eyebrow">Acceso seguro</span>
              <h2>Iniciar sesión</h2>
            </div>
            <span class="login-card__status">Gateway: activo</span>
          </div>
        </ng-template>

        <form [formGroup]="form" (ngSubmit)="submit()" class="login-form">
          <label class="field">
            <span>Usuario</span>
            <input
              pInputText
              type="text"
              formControlName="username"
              placeholder="admin"
              autocomplete="username"
            />
            @if (form.controls.username.invalid && form.controls.username.touched) {
              <small>El usuario es obligatorio.</small>
            }
          </label>

          <label class="field">
            <span>Contraseña</span>
            <p-password
              formControlName="password"
              [feedback]="false"
              [toggleMask]="true"
              placeholder="Admin123"
              autocomplete="current-password"
              fluid
            />
            @if (form.controls.password.invalid && form.controls.password.touched) {
              <small>La contraseña es obligatoria.</small>
            }
          </label>

          <button
            pButton
            type="submit"
            label="Entrar al sistema"
            icon="pi pi-sign-in"
            [loading]="isSubmitting()"
            class="w-full"
          ></button>
        </form>

        <div class="login-accounts">
          <h3>Usuarios de prueba</h3>

          @for (account of demoAccounts; track account.username) {
            <button type="button" class="login-accounts__item" (click)="fillDemo(account.username, account.password)">
              <span>
                <strong>{{ account.username }}</strong>
                <small>{{ account.role }}</small>
              </span>
              <code>{{ account.password }}</code>
            </button>
          }
        </div>
      </p-card>
    </div>
  `,
  styles: `
    .login-shell {
      min-height: 100vh;
      display: grid;
      grid-template-columns: minmax(0, 1.2fr) minmax(22rem, 28rem);
      gap: 2rem;
      align-items: center;
      padding: clamp(1.25rem, 4vw, 3rem);
      background:
        radial-gradient(circle at top left, rgba(34, 197, 94, 0.14), transparent 26%),
        radial-gradient(circle at bottom right, rgba(14, 165, 233, 0.16), transparent 28%),
        linear-gradient(180deg, #f8fafc 0%, #ecfeff 100%);
    }

    .login-shell__hero {
      padding: clamp(1rem, 3vw, 2rem);
    }

    .login-shell__eyebrow,
    .login-card__eyebrow {
      display: inline-flex;
      padding: 0.3rem 0.7rem;
      border-radius: 999px;
      background: rgba(15, 118, 110, 0.1);
      color: #0f766e;
      font-size: 0.75rem;
      font-weight: 700;
      letter-spacing: 0.08em;
      text-transform: uppercase;
    }

    .login-shell__hero h1,
    .login-card h2 {
      margin: 1rem 0 0;
      color: #0f172a;
      line-height: 1.02;
    }

    .login-shell__hero h1 {
      font-size: clamp(2.5rem, 5vw, 4.4rem);
      max-width: 14ch;
    }

    .login-shell__hero p {
      margin: 1rem 0 0;
      max-width: 42rem;
      color: #475569;
      font-size: 1.05rem;
      line-height: 1.7;
    }

    .login-shell__bullets {
      display: grid;
      gap: 1rem;
      margin-top: 2rem;
      max-width: 38rem;
    }

    .login-shell__bullets article {
      display: flex;
      align-items: flex-start;
      gap: 1rem;
      padding: 1rem 1.1rem;
      border-radius: 1.4rem;
      background: rgba(255, 255, 255, 0.76);
      border: 1px solid rgba(148, 163, 184, 0.18);
      box-shadow: 0 18px 35px rgba(15, 23, 42, 0.06);
    }

    .login-shell__bullets i {
      width: 2.5rem;
      height: 2.5rem;
      display: grid;
      place-items: center;
      border-radius: 0.9rem;
      background: rgba(20, 184, 166, 0.12);
      color: #0f766e;
    }

    .login-shell__bullets strong,
    .login-accounts strong {
      display: block;
      color: #0f172a;
    }

    .login-shell__bullets span,
    .login-accounts small {
      color: #64748b;
    }

    .login-card {
      border-radius: 1.75rem;
      overflow: hidden;
      box-shadow: 0 30px 60px rgba(15, 23, 42, 0.12);
    }

    .login-card__header {
      display: flex;
      align-items: flex-start;
      justify-content: space-between;
      gap: 1rem;
      padding: 1.5rem 1.5rem 0;
    }

    .login-card__status {
      display: inline-flex;
      align-items: center;
      padding: 0.35rem 0.7rem;
      border-radius: 999px;
      background: rgba(34, 197, 94, 0.12);
      color: #15803d;
      font-size: 0.78rem;
      font-weight: 700;
    }

    .login-form {
      display: grid;
      gap: 1rem;
      padding-top: 1rem;
    }

    .field {
      display: grid;
      gap: 0.45rem;
    }

    .field span {
      color: #334155;
      font-size: 0.9rem;
      font-weight: 600;
    }

    .field small {
      color: #b91c1c;
    }

    .login-accounts {
      margin-top: 1.5rem;
      display: grid;
      gap: 0.75rem;
      padding-top: 1.25rem;
      border-top: 1px solid rgba(148, 163, 184, 0.14);
    }

    .login-accounts h3 {
      margin: 0;
      color: #0f172a;
      font-size: 1rem;
    }

    .login-accounts__item {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 1rem;
      padding: 0.9rem 1rem;
      border-radius: 1rem;
      border: 1px solid rgba(148, 163, 184, 0.18);
      background: rgba(248, 250, 252, 0.9);
      cursor: pointer;
      text-align: left;
    }

    .login-accounts__item code {
      color: #0f766e;
      font-weight: 700;
      font-size: 0.82rem;
    }

    @media (max-width: 1023px) {
      .login-shell {
        grid-template-columns: 1fr;
      }

      .login-shell__hero h1 {
        max-width: none;
      }
    }
  `
})
export class LoginPageComponent {
  private readonly fb = inject(FormBuilder);
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);
  private readonly notificationService = inject(NotificationService);

  protected readonly isSubmitting = signal(false);
  protected readonly demoAccounts = [
    { username: 'admin', password: 'Admin123', role: 'ADMIN' },
    { username: 'almacen', password: 'Almacen123', role: 'ALMACENISTA' },
    { username: 'recepcion', password: 'Recepcion123', role: 'RECEPCION' },
    { username: 'servicio', password: 'Servicio123', role: 'SERVICIO' }
  ] as const;

  protected readonly form = this.fb.nonNullable.group({
    username: ['', [Validators.required]],
    password: ['', [Validators.required]]
  });

  protected fillDemo(username: string, password: string): void {
    this.form.setValue({ username, password });
  }

  protected submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.isSubmitting.set(true);

    this.authService
      .login(this.form.getRawValue())
      .pipe(take(1))
      .subscribe({
        next: (session) => {
          this.notificationService.success(
            'Sesión iniciada',
            `Bienvenido, ${session.username}.`
          );
          this.isSubmitting.set(false);
          void this.router.navigate(['/dashboard']);
        },
        error: () => {
          this.isSubmitting.set(false);
        }
      });
  }
}
