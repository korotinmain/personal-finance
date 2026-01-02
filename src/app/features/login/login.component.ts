import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { AuthService } from '../../core/auth/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="login-split">
      <section class="login-hero">
        <div class="login-hero-overlay"></div>
        <div class="login-hero-content">
          <div class="brand">
            <div class="logo">PF</div>
            <div class="brand-text">
              <h1>Personal Finance</h1>
              <span>Сімейна платформа</span>
            </div>
          </div>
          <h2>Швидко. Надійно. Прибутково.</h2>
          <p>Спільний контроль витрат, боргів і цілей в одному місці.</p>
        </div>
      </section>
      <section class="login-panel">
        <div class="login-card">
          <h3>Вхід</h3>
          <p>Доступ лише для 2 email у whitelist.</p>

          <div class="social-row">
            <button class="social-button" (click)="signIn()">
              <span class="social-icon google"></span>
              Google
            </button>
          </div>

          <div class="divider">
            <span>або</span>
          </div>

          <div class="form-grid single">
            <label>
              Email
              <input type="text" placeholder="name@example.com" disabled />
            </label>
            <label>
              Пароль
              <input type="password" placeholder="••••••••" disabled />
            </label>
          </div>

          <button class="primary wide" (click)="signIn()">Увійти</button>
          <div class="helper">
            <span>Потрібен доступ? Напишіть адміністратору.</span>
          </div>
          <div class="alert" *ngIf="blocked">Доступ заблокований. Перевірте whitelist.</div>
        </div>
      </section>
    </div>
  `
})
export class LoginComponent {
  blocked = false;

  constructor(private auth: AuthService, private route: ActivatedRoute, private router: Router) {
    this.blocked = this.route.snapshot.queryParamMap.get('blocked') === '1';
  }

  async signIn(): Promise<void> {
    await this.auth.signInWithGoogle();
    void this.router.navigateByUrl('/app/dashboard');
  }
}
