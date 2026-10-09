import { QueryValueObject } from 'fauna';

interface NewsletterQueue extends QueryValueObject {
  id: string;
  user_id: string;
  email: string;
  content: any;
  scheduled_send_time: string;
  status: string;
  attempt_count: number;
  last_attempt_time: string;
  created_at: string;
  updated_at: string;
}
