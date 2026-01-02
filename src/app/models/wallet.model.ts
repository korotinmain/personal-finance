export type WalletType = 'fop' | 'card' | 'cash';
export type Currency = 'UAH' | 'USD' | 'EUR';

export interface Wallet {
  id: string;
  name: string;
  type: WalletType;
  balances: Record<Currency, number>;
}
