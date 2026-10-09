import Stripe from 'stripe';
import { SubscriptionPlanResponse } from '@/app/pricing/_interfaces/subscription-plan.interface';
import { NextResponse } from 'next/server';

// Initialize Stripe with the secret key from environment variables
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string);

/**
 * Handles the GET request to fetch subscription plans.
 *
 * This function retrieves active recurring subscription plans from Stripe,
 * filters out inactive products, and formats the data into a structured response.
 *
 * @returns {Promise<NextResponse>} JSON response containing subscription plans or an error message.
 */

export async function GET() {
  try {
    // Fetch recurring active prices from Stripe and expand associated product details
    const prices = await stripe.prices.list({
      expand: ['data.product'],
      active: true,
      type: 'recurring',
    });

    // Filter and transform the retrieved data into the required subscription plan format
    const plans = prices.data
      .filter((price) => (price.product as Stripe.Product).active)
      .map((price) => ({
        id: price.id,
        name: (price.product as Stripe.Product).name,
        description: (price.product as Stripe.Product).description || '',
        price: price.unit_amount || 0,
        interval: price.recurring?.interval || 'monthly',
        price_id: price.id,
      }));

    // Structure the response payload
    const response: SubscriptionPlanResponse = { plans };
    return NextResponse.json(response);
  } catch (error) {
    // Log the error and return an appropriate error response
    console.error('Error fetching subscription plans:', error);
    return NextResponse.json(
      { error: 'Error fetching subscription plans' },
      { status: 500 },
    );
  }
}
