import { Component, DestroyRef, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { DataService } from '../../core/services/data.service';
import { FunctionsService } from '../../core/services/functions.service';
import { Debt } from '../../models/debt.model';

@Component({
  selector: 'app-debts',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <section class="page-header">
      <div>
        <h2>Борги</h2>
        <p>Розділяйте борги за напрямком та додавайте платежі.</p>
      </div>
      <button class="primary" (click)="openModal()">Додати платіж</button>
    </section>

    <div class="tabs">
      <button [class.active]="activeTab === 'owedToMe'" (click)="setTab('owedToMe')">Мені винні</button>
      <button [class.active]="activeTab === 'iOwe'" (click)="setTab('iOwe')">Я винен</button>
    </div>

    <div class="list">
      <div class="list-row" *ngFor="let debt of filteredDebts">
        <div>
          <strong>{{ debt.title }}</strong>
          <span>{{ debt.currency }} · {{ debt.status === 'paid' ? 'закрито' : 'активно' }}</span>
        </div>
        <div class="progress">
          <div class="progress-bar">
            <div class="progress-fill" [style.width.%]="progress(debt)"></div>
          </div>
          <span>{{ debt.paidAmount | number: '1.0-2' }} / {{ debt.totalAmount | number: '1.0-2' }}</span>
        </div>
      </div>
    </div>

    <div class="modal" *ngIf="isModalOpen">
      <div class="modal-backdrop" (click)="closeModal()"></div>
      <div class="modal-content">
        <h3>Додати платіж</h3>
        <form [formGroup]="form" (ngSubmit)="submit()">
          <div class="form-grid">
            <label>
              Борг
              <select formControlName="debtId">
                <option *ngFor="let debt of debts" [value]="debt.id">{{ debt.title }}</option>
              </select>
            </label>
            <label>
              Сума
              <input type="number" formControlName="amount" />
            </label>
            <label class="wide">
              Нотатка
              <input type="text" formControlName="note" />
            </label>
          </div>
          <div class="modal-actions">
            <button type="button" class="ghost" (click)="closeModal()">Скасувати</button>
            <button type="submit" class="primary" [disabled]="form.invalid || isSubmitting">Зберегти</button>
          </div>
        </form>
      </div>
    </div>
  `
})
export class DebtsComponent {
  activeTab: Debt['direction'] = 'owedToMe';
  debts: Debt[] = [];
  filteredDebts: Debt[] = [];
  isModalOpen = false;
  isSubmitting = false;
  private destroyRef = inject(DestroyRef);

  form = this.fb.group({
    debtId: ['', Validators.required],
    amount: [null as number | null, [Validators.required, Validators.min(0.01)]],
    note: ['']
  });

  constructor(private data: DataService, private functions: FunctionsService, private fb: FormBuilder) {
    this.data.debts$().pipe(takeUntilDestroyed(this.destroyRef)).subscribe((debts) => {
      this.debts = debts;
      this.filter();
    });
  }

  openModal(): void {
    this.isModalOpen = true;
  }

  closeModal(): void {
    this.isModalOpen = false;
    this.form.reset();
  }

  progress(debt: Debt): number {
    if (!debt.totalAmount) {
      return 0;
    }
    return Math.min(100, Math.round((debt.paidAmount / debt.totalAmount) * 100));
  }

  private filter(): void {
    this.filteredDebts = this.debts.filter((debt) => debt.direction === this.activeTab);
  }

  async submit(): Promise<void> {
    if (this.form.invalid) {
      return;
    }
    this.isSubmitting = true;
    try {
      await this.functions.addDebtPayment({
        debtId: this.form.value.debtId as string,
        amount: Number(this.form.value.amount),
        paidAt: Date.now(),
        note: this.form.value.note || undefined
      });
      this.closeModal();
    } finally {
      this.isSubmitting = false;
    }
  }

  setTab(value: Debt['direction']): void {
    this.activeTab = value;
    this.filter();
  }
}
