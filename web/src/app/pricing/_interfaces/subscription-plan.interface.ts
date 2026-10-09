export interface SubscriptionPlan {
  id: string;
  name: string;
  description: string;
  price: number;
  interval: string;
  price_id: string;
}

export interface SubscriptionPlanResponse {
  plans: SubscriptionPlan[];
}
