import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-settings',
  standalone: true,
  imports: [CommonModule],
  template: `
    <section class="page-header">
      <div>
        <h2>Налаштування</h2>
        <p>Доступ, синхронізація та загальні параметри.</p>
      </div>
    </section>

    <div class="card wide">
      <h3>Whitelist доступу</h3>
      <p>Доступ мають лише ці email:</p>
      <ul>
        <li *ngFor="let email of whitelist">{{ email }}</li>
      </ul>
    </div>

    <div class="card wide">
      <h3>Cloud Functions</h3>
      <p>Оновлення балансів і статусів відбувається лише через серверні функції.</p>
      <div class="chips">
        <span>create/update/delete transaction</span>
        <span>addDebtPayment</span>
        <span>adjustGoal</span>
      </div>
    </div>
  `
})
export class SettingsComponent {
  whitelist = environment.access.whitelist;
}
