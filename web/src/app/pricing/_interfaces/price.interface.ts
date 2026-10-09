import { QueryValueObject } from 'fauna';

export interface Price extends QueryValueObject {
  id: string;
  priceId: string;
  productId: string;
  active: boolean;
  description: string;
  unitAmount: number;
  currency: string;
  type: string;
  interval: string;
  intervalCount: number;
  trialPeriodDays: number;
  metadata?: any;
  createdAt: string;
  updatedAt: string;
}
