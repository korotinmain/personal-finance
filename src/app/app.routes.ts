import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';
import { accessGuard } from './core/guards/access.guard';
import { LoginComponent } from './features/login/login.component';
import { AppShellComponent } from './layout/components/app-shell.component';
import { DashboardComponent } from './features/dashboard/dashboard.component';
import { TransactionsComponent } from './features/transactions/transactions.component';
import { DebtsComponent } from './features/debts/debts.component';
import { GoalsComponent } from './features/goals/goals.component';
import { SettingsComponent } from './features/settings/settings.component';
import { loginRedirectGuard } from './core/guards/login-redirect.guard';

export const appRoutes: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'login' },
  { path: 'login', component: LoginComponent, canActivate: [loginRedirectGuard] },
  {
    path: 'app',
    component: AppShellComponent,
    canActivate: [authGuard, accessGuard],
    children: [
      { path: '', pathMatch: 'full', redirectTo: 'dashboard' },
      { path: 'dashboard', component: DashboardComponent },
      { path: 'transactions', component: TransactionsComponent },
      { path: 'debts', component: DebtsComponent },
      { path: 'goals', component: GoalsComponent },
      { path: 'settings', component: SettingsComponent }
    ]
  },
  { path: '**', redirectTo: 'login' }
];
