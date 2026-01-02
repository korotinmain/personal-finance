import { Currency } from './wallet.model';

export type TransactionType = 'expense' | 'income' | 'transfer';
export type TransactionOwner = 'me' | 'wife';

export interface Transaction {
  id: string;
  type: TransactionType;
  owner: TransactionOwner;
  walletId: string;
  targetWalletId?: string;
  amount: number;
  currency: Currency;
  category?: string;
  note?: string;
  createdAt: number;
}
