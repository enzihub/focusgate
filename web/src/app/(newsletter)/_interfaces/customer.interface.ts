import { QueryValueObject } from 'fauna';

export interface Customer extends QueryValueObject {
  userId: string;
  email: string;
  stripeCustomerId: string;
}
