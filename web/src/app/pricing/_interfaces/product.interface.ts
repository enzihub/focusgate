import { QueryValueObject } from 'fauna';

export interface Product extends QueryValueObject {
  id: string;
  productId: string;
  active: boolean;
  name: string;
  description: string;
  image: string;
  metadata?: any;
  createdAt: string;
  updatedAt: string;
}
