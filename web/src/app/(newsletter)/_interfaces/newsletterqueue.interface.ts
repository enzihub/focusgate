import { QueryValueObject } from 'fauna';

export interface UserNewsletter extends QueryValueObject {
  id: string | null;
  user_id: string;
  email: string | null;
  timezone: string | null;
  prefTime: number | null;
  isSubscribed: boolean | null;
  createdAt: string;
  updatedAt: string;
}
