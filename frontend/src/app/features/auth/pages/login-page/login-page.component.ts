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
        <span class="login-shell__eyebrow">Hotel Lunara</span>
        <h1>Gestión elegante para la operación del hotel</h1>
        <p>
          Controla inventario, habitaciones, usuarios y asignaciones desde una experiencia más
          cálida, clara y enfocada en el trabajo diario del equipo Lunara.
        </p>

        <div class="login-shell__bullets">
          <article>
            <i class="pi pi-shield"></i>
            <div>
              <strong>Acceso seguro</strong>
              <span>Roles definidos para cada área del hotel.</span>
            </div>
          </article>

          <article>
            <i class="pi pi-building"></i>
            <div>
              <strong>Operación hotelera</strong>
              <span>Inventario, habitaciones, servicio y reportes en un mismo lugar.</span>
            </div>
          </article>

          <article>
            <i class="pi pi-star"></i>
            <div>
              <strong>Experiencia cuidada</strong>
              <span>Una interfaz más amable para recepción, almacén y servicio.</span>
            </div>
          </article>
        </div>
      </section>

      <p-card class="login-card">
        <ng-template pTemplate="header">
          <div class="login-card__header">
            <div>
              <span class="login-card__eyebrow">Bienvenido</span>
              <h2>Iniciar sesión</h2>
            </div>
            <span class="login-card__status">Lunara en línea</span>
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
          <h3>Accesos disponibles</h3>

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
        radial-gradient(circle at top left, rgba(251, 191, 36, 0.24), transparent 26%),
        radial-gradient(circle at bottom right, rgba(217, 119, 6, 0.16), transparent 28%),
        linear-gradient(180deg, #fffaf0 0%, #fff2cc 100%);
    }

    .login-shell__hero {
      padding: clamp(1rem, 3vw, 2rem);
    }

    .login-shell__eyebrow,
    .login-card__eyebrow {
      display: inline-flex;
      padding: 0.3rem 0.7rem;
      border-radius: 999px;
      background: rgba(245, 158, 11, 0.14);
      color: #9a670d;
      font-size: 0.75rem;
      font-weight: 700;
      letter-spacing: 0.08em;
      text-transform: uppercase;
    }

    .login-shell__hero h1,
    .login-card h2 {
      margin: 1rem 0 0;
      color: #4a3210;
      line-height: 1.02;
      font-family: 'Palatino Linotype', 'Book Antiqua', Georgia, serif;
    }

    .login-shell__hero h1 {
      font-size: clamp(2.5rem, 5vw, 4.4rem);
      max-width: 14ch;
    }

    .login-shell__hero p {
      margin: 1rem 0 0;
      max-width: 42rem;
      color: #7a6130;
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
      background: rgba(255, 251, 239, 0.82);
      border: 1px solid rgba(191, 140, 37, 0.18);
      box-shadow: 0 18px 35px rgba(101, 67, 33, 0.08);
    }

    .login-shell__bullets i {
      width: 2.5rem;
      height: 2.5rem;
      display: grid;
      place-items: center;
      border-radius: 0.9rem;
      background: rgba(245, 158, 11, 0.12);
      color: #9a670d;
    }

    .login-shell__bullets strong,
    .login-accounts strong {
      display: block;
      color: #4a3210;
    }

    .login-shell__bullets span,
    .login-accounts small {
      color: #8b6b2f;
    }

    .login-card {
      border-radius: 1.75rem;
      overflow: hidden;
      box-shadow: 0 30px 60px rgba(101, 67, 33, 0.14);
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
      background: rgba(245, 158, 11, 0.12);
      color: #9a670d;
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
      color: #6b4f1d;
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
      border-top: 1px solid rgba(191, 140, 37, 0.14);
    }

    .login-accounts h3 {
      margin: 0;
      color: #4a3210;
      font-size: 1rem;
    }

    .login-accounts__item {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 1rem;
      padding: 0.9rem 1rem;
      border-radius: 1rem;
      border: 1px solid rgba(191, 140, 37, 0.18);
      background: rgba(255, 249, 233, 0.92);
      cursor: pointer;
      text-align: left;
    }

    .login-accounts__item code {
      color: #8a5a12;
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
          this.notificationService.success('Sesión iniciada', `Bienvenido, ${session.username}.`);
          this.isSubmitting.set(false);
          void this.router.navigate(['/dashboard']);
        },
        error: () => {
          this.isSubmitting.set(false);
        }
      });
  }
}
