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
      <!-- Left Side: Hero Area (Image & Gold Overlay) -->
      <aside class="login-hero">
        <div class="hero-overlay"></div>
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
              <svg class="brand__logo" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
                <defs>
                  <linearGradient id="goldGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stop-color="#f5d061" />
                    <stop offset="45%" stop-color="#c8922d" />
                    <stop offset="55%" stop-color="#b8862d" />
                    <stop offset="100%" stop-color="#996515" />
                  </linearGradient>
                </defs>
                <path d="M78 50C78 65.464 65.464 78 50 78C34.536 78 22 65.464 22 50C22 34.536 34.536 22 50 22C51.5 22 53 22.2 54.4 22.5C46.8 26 42 34.5 42 43C42 54.6 51.4 64 63 64C69.5 64 75 59.5 77.5 53C77.8 52 78 51 78 50Z" fill="url(#goldGradient)"/>
              </svg>
              <div class="brand__text">
                <span class="brand__name">Lunara</span>
                <span class="brand__tagline">HOTEL MANAGEMENT</span>
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

    /* Left Side: Hero Area (Image & Gold Overlay) */
    .login-hero {
      position: relative;
      background: url('/images/warm-room.png') center/cover no-repeat;
      display: flex;
      align-items: flex-end;
      padding: 5rem;
    }

    .hero-overlay {
      position: absolute;
      inset: 0;
      /* Noticeable Golden/Yellowish Transparent Overlay */
      background: linear-gradient(135deg, rgba(200, 146, 45, 0.3) 0%, rgba(101, 73, 31, 0.4) 100%);
      backdrop-filter: brightness(0.95);
    }

    .hero-overlay::after {
      content: '';
      position: absolute;
      inset: 0;
      background: radial-gradient(circle at 30% 50%, rgba(245, 208, 97, 0.15), transparent 70%);
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
      padding: 3rem;
      display: grid;
      place-items: center;
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
      gap: 3.5rem;
    }

    .brand {
      display: flex;
      align-items: center;
      gap: 1rem;
    }

    .brand__logo {
      width: 3rem;
      height: 3rem;
    }

    .brand__text {
      display: flex;
      flex-direction: column;
    }

    .brand__name {
      font-family: 'Palatino Linotype', serif;
      font-size: 1.5rem;
      font-weight: 700;
      color: #4a3210;
      letter-spacing: -0.02em;
    }

    .brand__tagline {
      font-size: 0.65rem;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.2em;
      color: #c8922d;
    }

    .login-card__header h1 {
      font-family: 'Palatino Linotype', serif;
      font-size: 2.25rem;
      color: #3d2b1f;
      margin: 0 0 0.5rem;
    }

    .login-card__header p {
      color: #8b6b2f;
      font-size: 0.95rem;
    }

    .login-form {
      display: flex;
      flex-direction: column;
      gap: 1.75rem;
      margin-top: 2rem;
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
    }
  `
})
export class LoginPageComponent {
  private readonly fb = inject(FormBuilder);
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);
  private readonly notificationService = inject(NotificationService);

  protected readonly isSubmitting = signal(false);

  protected readonly form = this.fb.nonNullable.group({
    username: ['', [Validators.required]],
    password: ['', [Validators.required]]
  });

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
