import { Component, DestroyRef, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators, AbstractControl, ValidationErrors } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { DataService } from '../../core/services/data.service';
import { FunctionsService } from '../../core/services/functions.service';
import { Currency } from '../../models/wallet.model';
import { TransactionOwner, TransactionType } from '../../models/transaction.model';

@Component({
  selector: 'app-transactions',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <section class="page-header">
      <div>
        <h2>Транзакції</h2>
        <p>Фільтруйте за періодом, валютою та виконавцем.</p>
      </div>
      <button class="primary" (click)="openModal()">Додати транзакцію</button>
    </section>

    <div class="filters">
      <label>
        Період
        <select>
          <option>Останні 7 днів</option>
          <option>Останні 30 днів</option>
          <option>Цей місяць</option>
          <option>Цей рік</option>
        </select>
      </label>
      <label>
        Хто
        <select>
          <option value="">Усі</option>
          <option value="me">Я</option>
          <option value="wife">Дружина</option>
        </select>
      </label>
      <label>
        Гаманець
        <select>
          <option value="">Усі</option>
          <option *ngFor="let wallet of wallets$ | async" [value]="wallet.id">{{ wallet.name }}</option>
        </select>
      </label>
      <label>
        Валюта
        <select>
          <option value="">Усі</option>
          <option value="UAH">UAH</option>
          <option value="USD">USD</option>
          <option value="EUR">EUR</option>
        </select>
      </label>
    </div>

    <div class="list">
      <div class="list-row" *ngFor="let transaction of transactions$ | async">
        <div>
          <strong>{{ transaction.type }}</strong>
          <span>{{ transaction.owner }}</span>
        </div>
        <div>
          <span>{{ transaction.currency }}</span>
          <strong>{{ transaction.amount | number: '1.0-2' }}</strong>
        </div>
        <div>{{ transaction.note || 'Без нотаток' }}</div>
      </div>
    </div>

    <div class="modal" *ngIf="isModalOpen">
      <div class="modal-backdrop" (click)="closeModal()"></div>
      <div class="modal-content">
        <h3>Нова транзакція</h3>
        <form [formGroup]="form" (ngSubmit)="submit()">
          <div class="form-grid">
            <label>
              Тип
              <select formControlName="type">
                <option value="expense">Витрата</option>
                <option value="income">Дохід</option>
                <option value="transfer">Переказ</option>
              </select>
            </label>
            <label>
              Хто
              <select formControlName="owner">
                <option value="me">Я</option>
                <option value="wife">Дружина</option>
              </select>
            </label>
            <label>
              Гаманець
              <select formControlName="walletId">
                <option *ngFor="let wallet of wallets$ | async" [value]="wallet.id">{{ wallet.name }}</option>
              </select>
            </label>
            <label>
              Цільовий гаманець
              <select formControlName="targetWalletId">
                <option value="">-</option>
                <option *ngFor="let wallet of wallets$ | async" [value]="wallet.id">{{ wallet.name }}</option>
              </select>
            </label>
            <label>
              Валюта
              <select formControlName="currency">
                <option value="UAH">UAH</option>
                <option value="USD">USD</option>
                <option value="EUR">EUR</option>
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
export class TransactionsComponent {
  wallets$ = this.data.wallets$();
  transactions$ = this.data.transactions$();
  isModalOpen = false;
  isSubmitting = false;
  private destroyRef = inject(DestroyRef);

  form = this.fb.group({
    type: ['expense' as TransactionType, Validators.required],
    owner: ['me' as TransactionOwner, Validators.required],
    walletId: ['', Validators.required],
    targetWalletId: [''],
    currency: ['UAH' as Currency, Validators.required],
    amount: [null as number | null, [Validators.required, Validators.min(0.01)]],
    note: ['']
  }, { validators: [transferTargetValidator] });

  constructor(private data: DataService, private functions: FunctionsService, private fb: FormBuilder) {
    this.form.get('type')?.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((type) => {
        const targetControl = this.form.get('targetWalletId');
        if (!targetControl) {
          return;
        }
        if (type === 'transfer') {
          targetControl.setValidators([Validators.required]);
        } else {
          targetControl.clearValidators();
          targetControl.setValue('');
        }
        targetControl.updateValueAndValidity({ emitEvent: false });
      });
  }

  openModal(): void {
    this.isModalOpen = true;
  }

  closeModal(): void {
    this.isModalOpen = false;
    this.form.reset({ type: 'expense', owner: 'me', currency: 'UAH', targetWalletId: '' });
  }

  async submit(): Promise<void> {
    if (this.form.invalid) {
      return;
    }
    this.isSubmitting = true;
    const payload = {
      ...this.form.value,
      amount: Number(this.form.value.amount),
      createdAt: Date.now()
    };
    try {
      await this.functions.createTransaction(payload as any);
      this.closeModal();
    } finally {
      this.isSubmitting = false;
    }
  }
}

function transferTargetValidator(control: AbstractControl): ValidationErrors | null {
  const group = control as { get: (name: string) => AbstractControl | null };
  const type = group.get('type')?.value as TransactionType | undefined;
  const walletId = group.get('walletId')?.value as string | undefined;
  const targetWalletId = group.get('targetWalletId')?.value as string | undefined;

  if (type !== 'transfer') {
    return null;
  }

  if (!targetWalletId || !walletId) {
    return { transferTargetRequired: true };
  }

  if (targetWalletId === walletId) {
    return { transferTargetSame: true };
  }

  return null;
}
