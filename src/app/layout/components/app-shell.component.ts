import { Component } from "@angular/core";
import { RouterLink, RouterLinkActive, RouterOutlet } from "@angular/router";
import { AsyncPipe, NgIf } from "@angular/common";
import { AuthService } from "../../core/auth/auth.service";
import { LucideIconsModule } from "../../shared/lucide-icons.module";

@Component({
  selector: "app-shell",
  standalone: true,
  imports: [
    RouterOutlet,
    RouterLink,
    RouterLinkActive,
    AsyncPipe,
    NgIf,
    LucideIconsModule,
  ],
  template: `
    <div class="shell">
      <aside class="sidebar glass">
        <div class="sidebar-header">
          <div class="logo glow">PF</div>
          <div class="brand-text">
            <h1>Finance Hub</h1>
            <span>родинний контроль</span>
          </div>
        </div>
        <nav class="nav">
          <p class="nav-label">Навігація</p>
          <a
            class="nav-item"
            routerLink="/app/dashboard"
            routerLinkActive="active"
          >
            <lucide-icon name="Home" size="18"></lucide-icon>
            <div class="nav-copy">
              <span>Дашборд</span>
              <small>огляд</small>
            </div>
          </a>
          <a
            class="nav-item"
            routerLink="/app/transactions"
            routerLinkActive="active"
          >
            <lucide-icon name="CreditCard" size="18"></lucide-icon>
            <div class="nav-copy">
              <span>Транзакції</span>
              <small>рух коштів</small>
            </div>
          </a>
          <a class="nav-item" routerLink="/app/debts" routerLinkActive="active">
            <lucide-icon name="TrendingUp" size="18"></lucide-icon>
            <div class="nav-copy">
              <span>Борги</span>
              <small>контроль</small>
            </div>
          </a>
          <a class="nav-item" routerLink="/app/goals" routerLinkActive="active">
            <lucide-icon name="Target" size="18"></lucide-icon>
            <div class="nav-copy">
              <span>Цілі</span>
              <small>прогрес</small>
            </div>
          </a>
          <a
            class="nav-item"
            routerLink="/app/settings"
            routerLinkActive="active"
          >
            <lucide-icon name="Settings" size="18"></lucide-icon>
            <div class="nav-copy">
              <span>Налаштування</span>
              <small>доступи</small>
            </div>
          </a>
        </nav>
      </aside>
      <div class="content">
        <header class="topbar glass">
          <div class="topbar-title">Сімейний баланс</div>
          <div class="topbar-status" *ngIf="auth.user$ | async as user">
            <span class="topbar-pill">Ви увійшли</span>
            <div class="user">
              <div class="avatar">
                {{ (user.displayName || user.email || "U")[0] }}
              </div>
              <div class="user-meta">
                <span>{{ user.displayName || "Користувач" }}</span>
                <small>{{ user.email }}</small>
              </div>
            </div>
          </div>
        </header>
        <main class="page">
          <router-outlet />
        </main>
      </div>
    </div>
  `,
})
export class AppShellComponent {
  constructor(public auth: AuthService) {}
}
