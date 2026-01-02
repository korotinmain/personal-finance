export type DebtDirection = 'owedToMe' | 'iOwe';
export type DebtStatus = 'active' | 'paid';

export interface Debt {
  id: string;
  title: string;
  direction: DebtDirection;
  totalAmount: number;
  paidAmount: number;
  currency: 'UAH' | 'USD' | 'EUR';
  status: DebtStatus;
  createdAt: number;
}

export interface DebtPayment {
  id: string;
  debtId: string;
  amount: number;
  paidAt: number;
  note?: string;
}
