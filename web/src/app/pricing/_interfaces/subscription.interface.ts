import { QueryValueObject } from 'fauna';
import { Price } from '@/app/pricing/_interfaces/price.interface';
import { Product } from '@/app/pricing/_interfaces/product.interface';

export interface Subscription extends QueryValueObject {
  id: string;
  subscriptionId: string;
  userId: string;
  email: string;
  status: string;
  metadata: any;
  priceId: string;
  quantity: number;
  cancelAtPeriodEnd: boolean;
  currentPeriodStart: number;
  currentPeriodEnd: number;
  endedAt: number;
  cancelAt: number;
  canceledAt: number;
  trialStart: number;
  trialEnd: number;
  subscriptionCreatedAt: number;
  subscriptionEndedAt: number;
  createdAt: string;
  updatedAt: string;
  price: Price;
  product: Product;
}
