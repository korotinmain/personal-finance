export type GoalStatus = 'active' | 'completed';

export interface Goal {
  id: string;
  title: string;
  targetAmount: number;
  currentAmount: number;
  currency: 'UAH' | 'USD' | 'EUR';
  status: GoalStatus;
  createdAt: number;
}
