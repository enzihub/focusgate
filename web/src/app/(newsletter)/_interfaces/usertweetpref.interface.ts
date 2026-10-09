import { QueryValueObject } from 'fauna';

export interface UserTweetPref extends QueryValueObject {
  id: string | null;
  user_id: string;
  email: string | null;
  timezone: string | null;
  phone: string | null;
  createdAt: string;
  updatedAt: string;
}
