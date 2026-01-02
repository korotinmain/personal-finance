import { Injectable } from '@angular/core';
import {
  Firestore,
  collection,
  collectionData,
  doc,
  docData,
  query,
  orderBy
} from '@angular/fire/firestore';
import { Observable } from 'rxjs';
import { Wallet } from '../../models/wallet.model';
import { Transaction } from '../../models/transaction.model';
import { Debt, DebtPayment } from '../../models/debt.model';
import { Goal } from '../../models/goal.model';

@Injectable({ providedIn: 'root' })
export class DataService {
  constructor(private firestore: Firestore) {}

  wallets$(): Observable<Wallet[]> {
    const ref = collection(this.firestore, 'wallets');
    return collectionData(ref, { idField: 'id' }) as Observable<Wallet[]>;
  }

  transactions$(): Observable<Transaction[]> {
    const ref = query(collection(this.firestore, 'transactions'), orderBy('createdAt', 'desc'));
    return collectionData(ref, { idField: 'id' }) as Observable<Transaction[]>;
  }

  debts$(): Observable<Debt[]> {
    const ref = query(collection(this.firestore, 'debts'), orderBy('createdAt', 'desc'));
    return collectionData(ref, { idField: 'id' }) as Observable<Debt[]>;
  }

  debtPayments$(debtId: string): Observable<DebtPayment[]> {
    const ref = query(collection(this.firestore, `debts/${debtId}/payments`), orderBy('paidAt', 'desc'));
    return collectionData(ref, { idField: 'id' }) as Observable<DebtPayment[]>;
  }

  goals$(): Observable<Goal[]> {
    const ref = query(collection(this.firestore, 'goals'), orderBy('createdAt', 'desc'));
    return collectionData(ref, { idField: 'id' }) as Observable<Goal[]>;
  }

  goal$(goalId: string): Observable<Goal> {
    const ref = doc(this.firestore, `goals/${goalId}`);
    return docData(ref, { idField: 'id' }) as Observable<Goal>;
  }
}
