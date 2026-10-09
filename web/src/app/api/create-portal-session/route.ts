import { currentUser } from '@clerk/nextjs/server';
import { type NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { getCustomerByEmail } from '@/app/pricing/_services/customer-service';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2024-12-18.acacia',
});

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    // Get the customer ID from the database based on the authenticated user id from clerk
    const user = await currentUser();
    const customer = await getCustomerByEmail(
      user?.primaryEmailAddress?.emailAddress!,
    );

    const session = await stripe.billingPortal.sessions.create({
      customer: customer?.stripeCustomerId!,
      return_url: `${request.headers.get('origin')}/dashboard`,
    });

    return NextResponse.json({ url: session.url });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: 'Error creating portal session' },
      { status: 500 },
    );
  }
}
