import Stripe from 'stripe';

import { getEnvVar } from '@/shared/utils/get-env-var';
import { getOrCreateUser } from '@/app/(user)/_services/user.service';
import { stripeAdmin } from '@/app/pricing/_utils/stripe-admin';
import {
  deleteCustomerById,
  upsertCustomer,
} from '@/app/pricing/_services/customer-service';
import {
  deleteSubscriptionById,
  upsertUserSubscription,
} from '@/app/pricing/_services/subscription-service';

const relevantEvents = new Set([
  'customer.created',
  'customer.deleted',
  'customer.subscription.created',
  'customer.subscription.updated',
  'customer.subscription.deleted',
  'checkout.session.completed',
]);

export async function POST(req: Request) {
  const body = await req.text();
  const sig = req.headers.get('stripe-signature') as string;
  const webhookSecret = getEnvVar(
    process.env.STRIPE_WEBHOOK_SECRET,
    'STRIPE_WEBHOOK_SECRET',
  );

  let event: Stripe.Event;

  try {
    if (!sig || !webhookSecret) return;
    event = stripeAdmin.webhooks.constructEvent(body, sig, webhookSecret);
  } catch (error) {
    return Response.json(`Webhook Error: ${(error as any).message}`, {
      status: 400,
    });
  }

  if (relevantEvents.has(event.type)) {
    try {
      switch (event.type) {
        case 'customer.created':
          const newCustomer = event.data.object as Stripe.Customer;
          if (newCustomer.email) {
            await getOrCreateUser(newCustomer.email);
            await upsertCustomer({
              email: newCustomer.email,
              stripeCustomerId: newCustomer.id,
            });
          }
          break;

        case 'customer.deleted':
          const deletedCustomer = event.data.object as Stripe.Customer;
          await deleteCustomerById(deletedCustomer.id);
          break;

        case 'customer.subscription.created':
        case 'customer.subscription.updated':
          const subscription = event.data.object as Stripe.Subscription;
          const customerResponse = await stripeAdmin.customers.retrieve(
            subscription.customer as string,
          );

          if (
            customerResponse &&
            !('deleted' in customerResponse) &&
            customerResponse.email
          ) {
            await upsertUserSubscription({
              email: customerResponse.email,
              subscriptionId: subscription.id,
              customerId: customerResponse.id,
              isCreateAction: event.type === 'customer.subscription.created',
            });
          }
          break;

        case 'customer.subscription.deleted':
          const deletedSubscription = event.data.object as Stripe.Subscription;
          await deleteSubscriptionById(deletedSubscription.id);
          break;

        case 'checkout.session.completed':
          // Removed redundant subscription upsert - this is already handled
          // by the 'customer.subscription.created' event that Stripe triggers
          break;
      }
    } catch (error) {
      console.error(error);
      return Response.json(
        'Webhook handler failed. View your nextjs function logs.',
        {
          status: 400,
        },
      );
    }
  }
  return Response.json({ received: true });
}
