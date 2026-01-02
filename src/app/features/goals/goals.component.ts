import { Component, DestroyRef, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators, AbstractControl, ValidationErrors } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { DataService } from '../../core/services/data.service';
import { FunctionsService } from '../../core/services/functions.service';
import { Goal } from '../../models/goal.model';

@Component({
  selector: 'app-goals',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <section class="page-header">
      <div>
        <h2>Цілі</h2>
        <p>Контролюйте прогрес і коригуйте накопичення.</p>
      </div>
      <button class="primary" (click)="openModal()">Поповнити / зняти</button>
    </section>

    <div class="grid">
      <div class="card" *ngFor="let goal of goals">
        <div class="card-head">
          <h3>{{ goal.title }}</h3>
          <span class="badge">{{ goal.currency }}</span>
        </div>
        <div class="progress">
          <div class="progress-bar">
            <div class="progress-fill" [style.width.%]="progress(goal)"></div>
          </div>
          <span>{{ goal.currentAmount | number: '1.0-2' }} / {{ goal.targetAmount | number: '1.0-2' }}</span>
        </div>
      </div>
    </div>

    <div class="modal" *ngIf="isModalOpen">
      <div class="modal-backdrop" (click)="closeModal()"></div>
      <div class="modal-content">
        <h3>Коригування цілі</h3>
        <form [formGroup]="form" (ngSubmit)="submit()">
          <div class="form-grid">
            <label>
              Ціль
              <select formControlName="goalId">
                <option *ngFor="let goal of goals" [value]="goal.id">{{ goal.title }}</option>
              </select>
            </label>
            <label>
              Сума ("-" для зняття)
              <input type="number" formControlName="delta" />
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
export class GoalsComponent {
  goals: Goal[] = [];
  isModalOpen = false;
  isSubmitting = false;
  private destroyRef = inject(DestroyRef);

  form = this.fb.group({
    goalId: ['', Validators.required],
    delta: [null as number | null, [Validators.required, nonZeroValidator]]
  });

  constructor(private data: DataService, private functions: FunctionsService, private fb: FormBuilder) {
    this.data.goals$().pipe(takeUntilDestroyed(this.destroyRef)).subscribe((goals) => {
      this.goals = goals;
    });
  }

  openModal(): void {
    this.isModalOpen = true;
  }

  closeModal(): void {
    this.isModalOpen = false;
    this.form.reset();
  }

  progress(goal: Goal): number {
    if (!goal.targetAmount) {
      return 0;
    }
    return Math.min(100, Math.round((goal.currentAmount / goal.targetAmount) * 100));
  }

  async submit(): Promise<void> {
    if (this.form.invalid) {
      return;
    }
    this.isSubmitting = true;
    try {
      await this.functions.adjustGoal({
        goalId: this.form.value.goalId as string,
        delta: Number(this.form.value.delta)
      });
      this.closeModal();
    } finally {
      this.isSubmitting = false;
    }
  }
}

function nonZeroValidator(control: AbstractControl): ValidationErrors | null {
  const value = Number(control.value);
  if (!Number.isFinite(value) || value === 0) {
    return { nonZero: true };
  }
  return null;
}
