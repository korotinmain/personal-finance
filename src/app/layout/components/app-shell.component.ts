import { Component } from "@angular/core";
import { RouterLink, RouterLinkActive, RouterOutlet } from "@angular/router";
import { AsyncPipe, NgIf } from "@angular/common";
import { AuthService } from "../../core/auth/auth.service";
import { ThemeService } from "../../core/services/theme.service";

@Component({
  selector: "app-shell",
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive, AsyncPipe, NgIf],
  template: `
    <div class="shell">
      <aside class="sidebar">
        <div class="sidebar-header">
          <div class="logo glow">PF</div>
          <div class="brand-text">
            <h1>Фінанси</h1>
            <span>спільний простір</span>
          </div>
        </div>
        <nav class="nav">
          <a
            class="nav-item"
            routerLink="/app/dashboard"
            routerLinkActive="active"
          >
            <span>Дашборд</span>
          </a>
          <a
            class="nav-item"
            routerLink="/app/transactions"
            routerLinkActive="active"
          >
            <span>Транзакції</span>
          </a>
          <a class="nav-item" routerLink="/app/debts" routerLinkActive="active">
            <span>Борги</span>
          </a>
          <a class="nav-item" routerLink="/app/goals" routerLinkActive="active">
            <span>Цілі</span>
          </a>
          <a
            class="nav-item"
            routerLink="/app/settings"
            routerLinkActive="active"
          >
            <span>Налаштування</span>
          </a>
        </nav>
        <div class="sidebar-footer">
          <button class="ghost" (click)="toggleTheme()">
            {{ themeLabel }}
          </button>
          <button class="ghost" (click)="signOut()">Вийти</button>
        </div>
      </aside>
      <div class="content">
        <header class="topbar glass">
          <div class="topbar-left">
            <div class="topbar-title">Сімейний баланс</div>
          </div>
          <div class="user" *ngIf="auth.user$ | async as user">
            <div class="avatar">
              {{ (user.displayName || user.email || "U")[0] }}
            </div>
            <div class="user-meta">
              <span>{{ user.displayName || "Користувач" }}</span>
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
  themeLabel = "Темна тема";

  constructor(public auth: AuthService, private theme: ThemeService) {
    const current = this.theme.getTheme();
    this.theme.applyTheme(current);
    this.themeLabel = current === "light" ? "Темна тема" : "Світла тема";
  }

  toggleTheme(): void {
    const next = this.theme.toggleTheme();
    this.themeLabel = next === "light" ? "Темна тема" : "Світла тема";
  }

  signOut(): void {
    void this.auth.signOut();
  }
}
