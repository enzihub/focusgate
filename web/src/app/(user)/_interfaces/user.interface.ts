import { QueryValueObject } from 'fauna';

export interface UserI extends QueryValueObject {
  userId: string;
  fullName: string;
  email: string;
  avatarUrl: string;
  billingAddress?: any;
  paymentMethod?: any;
  createdAt: string;
  updatedAt: string;
}
