import { Component, DestroyRef, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators, AbstractControl, ValidationErrors } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { map } from 'rxjs';
import { DataService } from '../../core/services/data.service';
import { Goal } from '../../models/goal.model';

@Component({
  selector: 'app-goals',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './goals.component.html',
  styleUrls: ['./goals.component.scss']
})
export class GoalsComponent {
  goals$ = this.data.goals$();
  summary$ = this.goals$.pipe(map((goals) => this.buildSummary(goals)));
  goalsSnapshot: Goal[] = [];
  currencies = ['UAH', 'USD', 'EUR'] as const;
  isGoalModalOpen = false;
  isAdjustModalOpen = false;
  isSubmitting = false;
  editingGoalId: string | null = null;
  private destroyRef = inject(DestroyRef);

  goalForm = this.fb.group({
    title: ['', [Validators.required, Validators.maxLength(60)]],
    targetAmount: [null as number | null, [Validators.required, Validators.min(1)]],
    currentAmount: [0, [Validators.required, Validators.min(0)]],
    currency: ['UAH', Validators.required]
  });

  adjustForm = this.fb.group({
    goalId: ['', Validators.required],
    delta: [null as number | null, [Validators.required, nonZeroValidator]]
  });

  constructor(private data: DataService, private fb: FormBuilder) {
    this.goals$.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((goals) => {
      this.goalsSnapshot = goals;
    });
  }

  openCreateModal(): void {
    this.editingGoalId = null;
    this.goalForm.reset({
      title: '',
      targetAmount: null,
      currentAmount: 0,
      currency: 'UAH'
    });
    this.isGoalModalOpen = true;
  }

  openEditModal(goal: Goal): void {
    this.editingGoalId = goal.id;
    this.goalForm.reset({
      title: goal.title,
      targetAmount: goal.targetAmount,
      currentAmount: goal.currentAmount,
      currency: goal.currency
    });
    this.isGoalModalOpen = true;
  }

  closeGoalModal(): void {
    this.isGoalModalOpen = false;
    this.goalForm.reset();
  }

  openAdjustModal(goal?: Goal): void {
    this.adjustForm.reset({
      goalId: goal?.id ?? '',
      delta: null
    });
    this.isAdjustModalOpen = true;
  }

  closeAdjustModal(): void {
    this.isAdjustModalOpen = false;
    this.adjustForm.reset();
  }

  progress(goal: Goal): number {
    if (!goal.targetAmount) {
      return 0;
    }
    return Math.min(100, Math.round((goal.currentAmount / goal.targetAmount) * 100));
  }

  isCompleted(goal: Goal): boolean {
    return goal.targetAmount > 0 && goal.currentAmount >= goal.targetAmount;
  }

  statusLabel(goal: Goal): string {
    return this.isCompleted(goal) ? 'Завершена' : 'Активна';
  }

  async submitGoal(): Promise<void> {
    if (this.goalForm.invalid) {
      return;
    }
    this.isSubmitting = true;
    const values = this.goalForm.getRawValue();
    const currentAmount = Number(values.currentAmount ?? 0);
    const targetAmount = Number(values.targetAmount ?? 0);
    const status = currentAmount >= targetAmount ? 'completed' : 'active';
    try {
      if (this.editingGoalId) {
        const existing = this.goalsSnapshot.find((goal) => goal.id === this.editingGoalId);
        await this.data.updateGoal(this.editingGoalId, {
          title: String(values.title ?? ''),
          targetAmount,
          currentAmount,
          currency: values.currency as Goal['currency'],
          status: status,
          createdAt: existing?.createdAt ?? Date.now()
        });
      } else {
        await this.data.createGoal({
          title: String(values.title ?? ''),
          targetAmount,
          currentAmount,
          currency: values.currency as Goal['currency'],
          status: status,
          createdAt: Date.now()
        });
      }
      this.closeGoalModal();
    } finally {
      this.isSubmitting = false;
    }
  }

  async submitAdjust(): Promise<void> {
    if (this.adjustForm.invalid) {
      return;
    }
    this.isSubmitting = true;
    try {
      const goalId = this.adjustForm.value.goalId as string;
      const delta = Number(this.adjustForm.value.delta);
      const goal = this.goalsSnapshot.find((item) => item.id === goalId);
      if (!goal) {
        return;
      }
      const nextAmount = Math.max(0, goal.currentAmount + delta);
      const status = nextAmount >= goal.targetAmount ? 'completed' : 'active';
      await this.data.updateGoal(goalId, {
        currentAmount: nextAmount,
        status
      });
      this.closeAdjustModal();
    } finally {
      this.isSubmitting = false;
    }
  }

  async deleteGoal(goal: Goal): Promise<void> {
    if (!confirm(`Видалити ціль "${goal.title}"?`)) {
      return;
    }
    this.isSubmitting = true;
    try {
      await this.data.deleteGoal(goal.id);
    } finally {
      this.isSubmitting = false;
    }
  }

  private buildSummary(goals: Goal[]): {
    totalSaved: number;
    totalTarget: number;
    active: number;
    completed: number;
    progress: number;
  } {
    const totalSaved = goals.reduce((sum, goal) => sum + goal.currentAmount, 0);
    const totalTarget = goals.reduce((sum, goal) => sum + goal.targetAmount, 0);
    const completed = goals.filter((goal) => goal.currentAmount >= goal.targetAmount).length;
    const active = Math.max(0, goals.length - completed);
    const progress = totalTarget > 0 ? Math.min(100, (totalSaved / totalTarget) * 100) : 0;
    return { totalSaved, totalTarget, active, completed, progress };
  }
}

function nonZeroValidator(control: AbstractControl): ValidationErrors | null {
  const value = Number(control.value);
  if (!Number.isFinite(value) || value === 0) {
    return { nonZero: true };
  }
  return null;
}
