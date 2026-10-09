import { NextResponse } from 'next/server';
import { type NextRequest } from 'next/server';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2024-12-18.acacia',
});

interface RequestBody {
  priceId: string;
  email: string;
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const { priceId, email }: RequestBody = await request.json();

    const session = await stripe.checkout.sessions.create({
      customer_email: email,
      mode: 'subscription',
      payment_method_collection: 'if_required',
      payment_method_types: ['card'],
      billing_address_collection: 'auto',
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      allow_promotion_codes: true,
      // success_url: `${request.headers.get('origin')}/success?session_id={CHECKOUT_SESSION_ID}`,
      success_url: `${request.headers.get('origin')}/dashboard`,
      cancel_url: `${request.headers.get('origin')}/pricing`,
      ui_mode: 'hosted',
      subscription_data: {
        trial_period_days: 7,
      },
    });

    return NextResponse.json({ sessionId: session.id });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: 'Error creating checkout session' },
      { status: 500 },
    );
  }
}
