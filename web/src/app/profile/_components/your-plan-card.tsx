'use client';
import Link from 'next/link';
import { CreditCard, Star } from 'lucide-react';
import { Card } from './card';
import { PricingCard } from './pricing-card';
import { redirectToStripeCustomerPortal } from '@/app/pricing/_services/manage-subscription';
import { useState } from 'react';

interface SubscriptionCardProps {
  subscription: any;
  //   userProduct?: ProductWithPrices;
  //   userPrice?: Price;
}

export function YourPlanCard({ subscription }: SubscriptionCardProps) {
  const [loading, setLoading] = useState(false);

  const handleRedirectToPortal = async () => {
    setLoading(true);
    try {
      return await redirectToStripeCustomerPortal();
    } catch (error) {
      console.error('Error getting portal URL:', error);
      setLoading(false);
    } finally {
      setLoading(false);
    }
  };
  return (
    <Card
      icon={<CreditCard className='h-5 w-5 text-blue-600' />}
      title='Your Plan 🌟'
      footer={
        subscription ? (
          <button
            onClick={handleRedirectToPortal}
            className='inline-flex rounded-lg bg-blue-600 px-6 py-2.5 text-sm font-medium text-white transition duration-200 hover:bg-blue-700'
          >
            Manage subscription
          </button>
        ) : (
          <button
            onClick={() => {
              window.location.href =
                process.env.NEXT_PUBLIC_STRIPE_PAYMENT_LINK1!;
            }}
            className='inline-flex rounded-lg bg-gradient-to-r from-blue-500 to-blue-600 px-6 py-2.5 text-sm font-medium text-white transition duration-200 hover:from-blue-600 hover:to-blue-700'
          >
            Start a subscription ✨
          </button>
        )
      }
    >
      {/* TODO : Implement the user current pricing plan */}

      {/* {userProduct && userPrice ? (
        <div className='space-y-6'>
          <PricingCard price={userPrice} />
        </div>
      ) : (
        <div className='text-center py-8'>
          <Star className='w-12 h-12 text-gray-300 mx-auto mb-4' />
          <p className='text-gray-600 mb-2'>No active subscription</p>
          <p className='text-sm text-gray-500'>Choose a plan to unlock all features</p>
        </div>
      )} */}
    </Card>
  );
}
