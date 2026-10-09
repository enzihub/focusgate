import { SubscriptionPlanResponse } from '@/app/pricing/_interfaces/subscription-plan.interface';
import { loadStripe } from '@stripe/stripe-js';
import Stripe from 'stripe';

/**
 * Fetches available subscription plans from the backend API which interfaces with Stripe.
 * This is used to display pricing options to users in the UI.
 *
 * @returns {Promise<SubscriptionPlanResponse>} Promise resolving to subscription plan data
 * @throws {Error} When network request fails or server returns error
 *
 * @example
 * const plans = await getPricingPlans();
 * console.log('Available plans:', plans);
 */

export async function getPricingPlans(): Promise<SubscriptionPlanResponse> {
  try {
    // Fetch pricing data from backend API endpoint
    const response = await fetch('/api/pricing');
    if (!response.ok) {
      throw new Error('Failed to fetch pricing plans');
    }
    return response.json();
  } catch (error) {
    console.error('Error fetching pricing plans from stripe', error);
    throw new Error(
      'Failed to fetch pricing plans. Please check your network connection and try again.',
    );
  }
}

/**
 * Initiates Stripe checkout process for a selected subscription plan.
 *
 * Flow:
 * 1. Loads Stripe.js with publishable key
 * 2. Creates Stripe checkout session through backend API
 * 3. Redirects user to Stripe-hosted checkout page
 *
 * @param {string} priceId - Stripe price ID for the selected subscription plan
 * @param {string} email - User's email to prefill in Stripe checkout
 * @throws {Error} When Stripe initialization fails or checkout redirection fails
 *
 * @example
 * await subscribeToPrice('price_123abc', 'user@example.com');
 */

export async function subscribeToPrice(priceId: string, email: string) {
  const stripePromise = await loadStripe(
    process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!,
  );
  const stripe = await stripePromise;

  try {
    // Create Stripe checkout session through backend API
    const { sessionId } = await fetch('/api/create-checkout-session', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ priceId, email }), // Send plan and user details
    }).then((res) => res.json());

    if (!sessionId) {
      throw new Error('Failed to create checkout session');
    }

    // Redirect user to Stripe's hosted checkout page
    const result = await stripe?.redirectToCheckout({ sessionId });

    // Handle potential redirection errors (e.g., network issues, closed modal)
    if (result?.error) {
      console.error('Stripe checkout error:', result.error);
      throw result.error;
    }
  } catch (error) {
    console.error('Subscription process failed:', error);
    throw new Error('Failed to start checkout process. Please try again.');
  }
}

/**
 * Retrieves a price object from Stripe using a given price ID.
 *
 * @param {string} priceId - The ID of the price in Stripe.
 * @returns {Promise<Stripe.Response<Stripe.Price>>} - The Stripe price object.
 * @throws {Error} - If retrieval from Stripe fails.
 */
export async function getPriceFromStripeById(
  priceId: string,
): Promise<Stripe.Response<Stripe.Price>> {
  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string);
  try {
    // Fetch the price object from Stripe
    const stripePrice = await stripe.prices.retrieve(priceId);

    return stripePrice;
  } catch (error) {
    // Throw an error with detailed message in case of failure
    throw new Error(`Failed to get price from Stripe: ${error}`);
  }
}
