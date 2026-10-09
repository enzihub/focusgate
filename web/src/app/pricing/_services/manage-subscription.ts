/**
 * This function facilitates redirecting a user to the Stripe Customer Portal.
 */

import { SelectSubscription } from '@/db/schema';

export async function redirectToStripeCustomerPortal() {
  try {
    const response = await fetch('/api/create-portal-session', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    const { url } = await response.json();

    // Redirect to the portal URL
    if (url) {
      return (window.location.href = url);
    }
  } catch (error) {
    console.error('Error redirecting to customer portal:', error);
    throw error;
  }
}

/**
 * Fetches the user's subscription status.
 */

export async function fetchSubscription(): Promise<SelectSubscription | null> {
  try {
    const response = await fetch('/api/subscription');

    if (!response.ok) {
      throw new Error('Failed to fetch subscription');
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching subscription:', error);
    return null;
  }
}
