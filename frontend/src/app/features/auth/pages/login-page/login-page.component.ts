import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { take } from 'rxjs';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { PasswordModule } from 'primeng/password';
import { AuthService } from '@core/services/auth.service';
import { NotificationService } from '@core/services/ui/notification.service';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-login-page',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, ButtonModule, InputTextModule, PasswordModule],
  template: `
    <div class="login-container">
      <!-- Left Side: Hero Area -->
      <aside class="login-hero">
        <div class="hero-content">
          <div class="hero-quote">
            <blockquote>
              "Donde la elegancia se encuentra con la eficiencia operativa."
            </blockquote>
            <cite>&mdash; Administración Hotelera</cite>
          </div>
        </div>
      </aside>

      <!-- Right Side: Form Area -->
      <main class="login-main">
        <div class="login-main__content">
          <header class="login-header">
            <div class="brand">
              <div class="brand__sparkle brand__sparkle--left" aria-hidden="true">
                <svg viewBox="0 0 24 24" fill="currentColor">
                  <path d="M9.937 15.5A2 2 0 0 0 8.5 14.063l-6.135-1.582a.5.5 0 0 1 0-.962L8.5 9.937A2 2 0 0 0 9.937 8.5l1.582-6.135a.5.5 0 0 1 .962 0L14.063 8.5A2 2 0 0 0 15.5 9.937l6.135 1.582a.5.5 0 0 1 0 .962L15.5 14.063a2 2 0 0 0-1.437 1.437l-1.582 6.135a.5.5 0 0 1-.962 0z"/>
                </svg>
              </div>
              <div class="brand__sparkle brand__sparkle--left-small" aria-hidden="true">
                <svg viewBox="0 0 24 24" fill="currentColor">
                  <path d="M9.937 15.5A2 2 0 0 0 8.5 14.063l-6.135-1.582a.5.5 0 0 1 0-.962L8.5 9.937A2 2 0 0 0 9.937 8.5l1.582-6.135a.5.5 0 0 1 .962 0L14.063 8.5A2 2 0 0 0 15.5 9.937l6.135 1.582a.5.5 0 0 1 0 .962L15.5 14.063a2 2 0 0 0-1.437 1.437l-1.582 6.135a.5.5 0 0 1-.962 0z"/>
                </svg>
              </div>
              <img
                class="brand__image"
                src="/images/lunara-login-logo-cropped.png"
                alt="Logo de Lunara"
              />
              <div class="brand__sparkle brand__sparkle--right" aria-hidden="true">
                <svg viewBox="0 0 24 24" fill="currentColor">
                  <path d="M9.937 15.5A2 2 0 0 0 8.5 14.063l-6.135-1.582a.5.5 0 0 1 0-.962L8.5 9.937A2 2 0 0 0 9.937 8.5l1.582-6.135a.5.5 0 0 1 .962 0L14.063 8.5A2 2 0 0 0 15.5 9.937l6.135 1.582a.5.5 0 0 1 0 .962L15.5 14.063a2 2 0 0 0-1.437 1.437l-1.582 6.135a.5.5 0 0 1-.962 0z"/>
                </svg>
              </div>
            </div>
          </header>

          <section class="login-section">
            <div class="login-card">
              <div class="login-card__header">
                <h1>Bienvenido</h1>
                <p>Ingrese sus credenciales para acceder al sistema.</p>
              </div>

              <form [formGroup]="form" (ngSubmit)="submit()" class="login-form">
                @if (submitError(); as error) {
                  <article class="validation-banner validation-banner--danger">
                    <strong>
                      <i class="pi pi-exclamation-triangle" aria-hidden="true"></i>
                      No fue posible iniciar sesion
                    </strong>
                    <p>{{ error }}</p>
                  </article>
                }

                <div class="field">
                  <label for="username">Usuario</label>
                  <div class="input-wrapper">
                    <i class="pi pi-user"></i>
                    <input
                      pInputText
                      id="username"
                      type="text"
                      formControlName="username"
                      placeholder="Nombre de usuario"
                      autocomplete="username"
                    />
                  </div>
                  @if (form.controls.username.invalid && form.controls.username.touched) {
                    <small class="error-text">El usuario es obligatorio.</small>
                  }
                </div>

                <div class="field">
                  <label for="password">Contraseña</label>
                  <div class="input-wrapper">
                    <i class="pi pi-lock"></i>
                    <p-password
                      id="password"
                      formControlName="password"
                      [feedback]="false"
                      [toggleMask]="true"
                      placeholder="••••••••"
                      autocomplete="current-password"
                      fluid
                    />
                  </div>
                  @if (form.controls.password.invalid && form.controls.password.touched) {
                    <small class="error-text">La contraseña es obligatoria.</small>
                  }
                </div>

                <button
                  pButton
                  type="submit"
                  label="Acceder al Portal"
                  [loading]="isSubmitting()"
                  class="submit-button"
                ></button>
              </form>
            </div>
          </section>

          <footer class="login-footer">
            <p>&copy; 2026 Hotel Lunara &bull; Reservados todos los derechos</p>
          </footer>
        </div>
      </main>
    </div>
  `,
  styles: `
    :host {
      display: block;
      height: 100vh;
      overflow: hidden;
    }

    .login-container {
      display: grid;
      grid-template-columns: 1fr minmax(400px, 40%);
      height: 100%;
      background: #fff;
    }

    /* Left Side: Hero Area */
    .login-hero {
      position: relative;
      background: url('/images/login-hero-room.png') center/cover no-repeat;
      display: flex;
      align-items: flex-end;
      padding: 5rem;
    }

    .hero-content {
      position: relative;
      z-index: 10;
      max-width: 600px;
    }

    .hero-quote blockquote {
      font-family: 'Palatino Linotype', serif;
      font-size: 3rem;
      line-height: 1.1;
      color: white;
      margin: 0 0 1.5rem;
      text-shadow: 0 10px 30px rgba(0,0,0,0.3);
    }

    .hero-quote cite {
      color: rgba(255, 255, 255, 0.75);
      font-style: normal;
      font-weight: 500;
      font-size: 1.2rem;
      letter-spacing: 0.05em;
    }

    /* Right Section Styles */
    .login-main {
      padding: 2.5rem 3rem 2rem;
      display: grid;
      justify-items: center;
      align-items: center;
      background: linear-gradient(135deg, #ffffff 0%, #fffbf2 100%);
      position: relative;
      z-index: 10;
      box-shadow: -20px 0 50px rgba(0,0,0,0.05);
    }

    .login-main__content {
      width: 100%;
      max-width: 400px;
      display: flex;
      flex-direction: column;
      gap: 1.1rem;
      transform: translateY(0.15rem);
    }

    .login-header {
      display: flex;
      justify-content: center;
      margin-bottom: 0.35rem;
    }

    .brand {
      position: relative;
      display: grid;
      place-items: center;
      width: min(14.2rem, 100%);
    }

    .brand__image {
      display: block;
      width: 100%;
      height: auto;
      background: transparent;
      border-radius: 0;
      box-shadow: none;
      filter: drop-shadow(0 18px 38px rgba(200, 146, 45, 0.34));
    }

    .brand__sparkle {
      position: absolute;
      width: 1.5rem;
      height: 1.5rem;
      color: #c8922d;
      filter: drop-shadow(0 0 10px rgba(200, 146, 45, 0.45));
      animation: sparkle-twinkle 4s infinite ease-in-out;
      z-index: 5;
    }

    @keyframes sparkle-twinkle {
      0%, 100% {
        transform: scale(1) rotate(0deg);
        opacity: 0.8;
      }
      50% {
        transform: scale(1.2) rotate(15deg);
        opacity: 1;
        filter: drop-shadow(0 0 15px rgba(200, 146, 45, 0.65));
      }
    }

    .brand__sparkle--left {
      top: -0.2rem;
      left: -1.8rem;
    }

    .brand__sparkle--left-small {
      top: 1.8rem;
      left: -2.3rem;
      width: 0.9rem;
      height: 0.9rem;
      animation-delay: -1.5s;
      opacity: 0.7;
    }

    .brand__sparkle--right {
      top: 1.6rem;
      right: -1.8rem;
      width: 1.3rem;
      height: 1.3rem;
      animation-delay: -0.8s;
    }

    .login-card__header {
      padding-top: 1.25rem;
    }

    .login-card__header h1 {
      font-family: 'Palatino Linotype', serif;
      font-size: 2.25rem;
      color: #3d2b1f;
      margin: 0 0 0.5rem;
      text-align: center;
    }

    .login-card__header p {
      margin: 0;
      color: #8b6b2f;
      font-size: 0.95rem;
      text-align: center;
    }

    .login-form {
      display: flex;
      flex-direction: column;
      gap: 1.75rem;
      margin-top: 1.35rem;
    }

    .field {
      display: flex;
      flex-direction: column;
      gap: 0.6rem;
    }

    .field label {
      font-size: 0.82rem;
      font-weight: 700;
      color: #4a3210;
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }

    .input-wrapper {
      position: relative;
      display: flex;
      align-items: center;
    }

    .input-wrapper p-password {
      width: 100%;
      display: block;
    }

    .input-wrapper i {
      position: absolute;
      left: 1.25rem;
      color: #c8922d;
      font-size: 0.9rem;
      z-index: 10;
    }

    .input-wrapper input,
    .input-wrapper ::ng-deep .p-password input {
      width: 100% !important;
      padding: 1rem 1.25rem 1rem 3rem !important;
      border-radius: 1rem !important;
      border: 1px solid rgba(200, 146, 45, 0.2) !important;
      background: white !important;
      font-size: 1rem !important;
      transition: all 0.3s ease !important;
      box-shadow: 0 4px 12px rgba(0,0,0,0.02) !important;
    }

    /* Autofill fix to remove gray/blue background */
    .input-wrapper input:-webkit-autofill,
    .input-wrapper input:-webkit-autofill:hover,
    .input-wrapper input:-webkit-autofill:focus,
    .input-wrapper input:-webkit-autofill:active,
    .input-wrapper ::ng-deep .p-password input:-webkit-autofill {
      -webkit-box-shadow: 0 0 0 30px white inset !important;
      -webkit-text-fill-color: #4a3210 !important;
      transition: background-color 5000s ease-in-out 0s;
    }

    .input-wrapper ::ng-deep .p-password {
      width: 100%;
    }

    .input-wrapper input:focus,
    .input-wrapper ::ng-deep .p-password input:focus {
      border-color: #c8922d !important;
      box-shadow: 0 8px 24px rgba(200, 146, 45, 0.1) !important;
      outline: none !important;
    }

    .error-text {
      color: #dc2626;
      font-size: 0.75rem;
      font-weight: 500;
      margin-top: 0.25rem;
    }

    .submit-button {
      background: linear-gradient(135deg, #c8922d 0%, #a67c25 100%) !important;
      border: none !important;
      padding: 1.2rem !important;
      border-radius: 1rem !important;
      font-weight: 700 !important;
      letter-spacing: 0.02em !important;
      box-shadow: 0 10px 25px rgba(200, 146, 45, 0.3) !important;
      margin-top: 1rem;
      transition: all 0.3s ease !important;
      color: white !important;
    }

    .submit-button:hover {
      transform: translateY(-2px);
      box-shadow: 0 15px 35px rgba(200, 146, 45, 0.4) !important;
    }

    .login-footer {
      font-size: 0.75rem;
      color: #9a8a70;
      text-align: center;
    }

    @media (max-width: 1024px) {
      .login-container {
        grid-template-columns: 1fr;
      }
      .login-hero {
        display: none;
      }
      .login-main {
        padding: 2rem;
      }

      .login-main__content {
        transform: none;
      }

      .login-header {
        margin-bottom: 0.15rem;
      }

      .brand__sparkle--left {
        left: -1.4rem;
        top: -0.1rem;
      }

      .brand__sparkle--left-small {
        left: -1.8rem;
        top: 1.5rem;
      }

      .brand__sparkle--right {
        right: -1.3rem;
        top: 1.4rem;
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
  protected readonly submitError = signal<string | null>(null);

  protected readonly form = this.fb.nonNullable.group({
    username: ['', [Validators.required]],
    password: ['', [Validators.required]]
  });

  protected submit(): void {
    this.submitError.set(null);

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
        error: (error: unknown) => {
          this.submitError.set(
            error instanceof Error ? error.message : 'Verifica el usuario y la contraseÃ±a.'
          );
          this.isSubmitting.set(false);
        }
      });
  }
}
