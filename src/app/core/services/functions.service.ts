import { Injectable } from '@angular/core';
import { Functions, httpsCallable } from '@angular/fire/functions';
import { Transaction } from '../../models/transaction.model';

@Injectable({ providedIn: 'root' })
export class FunctionsService {
  constructor(private functions: Functions) {}

  createTransaction(payload: Omit<Transaction, 'id'>): Promise<void> {
    const callable = httpsCallable(this.functions, 'createTransaction');
    return callable(payload).then(() => undefined);
  }

  updateTransaction(payload: Transaction): Promise<void> {
    const callable = httpsCallable(this.functions, 'updateTransaction');
    return callable(payload).then(() => undefined);
  }

  deleteTransaction(payload: { id: string }): Promise<void> {
    const callable = httpsCallable(this.functions, 'deleteTransaction');
    return callable(payload).then(() => undefined);
  }

  addDebtPayment(payload: { debtId: string; amount: number; paidAt: number; note?: string }): Promise<void> {
    const callable = httpsCallable(this.functions, 'addDebtPayment');
    return callable(payload).then(() => undefined);
  }

  adjustGoal(payload: { goalId: string; delta: number }): Promise<void> {
    const callable = httpsCallable(this.functions, 'adjustGoal');
    return callable(payload).then(() => undefined);
  }
}
