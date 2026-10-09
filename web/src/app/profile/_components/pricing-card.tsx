// pricing-card.tsx

'use client';

import { useState } from 'react';
import { CheckCircle2 } from 'lucide-react';

export interface Price {
  id: string;
  unit_amount: number | null;
  interval: 'month' | 'year' | null;
  product_id: string;
  active: boolean;
  currency: string;
  type: 'one_time' | 'recurring';
  interval_count?: number;
  description?: string | null;
  metadata?: Record<string, string>;
}

export function PricingCard({
  price,
  createCheckoutAction,
}: {
  price: Price;
  createCheckoutAction?: ({ price }: { price: Price }) => void;
}) {
  const isFree = price.unit_amount === 0;
  const isPopular = !isFree && price.interval === 'year';
  const priceAmount = (price.unit_amount || 0) / 100;

  return (
    <div
      className={`relative flex h-full flex-col overflow-visible rounded-xl border bg-white transition-all duration-200 hover:border-blue-500/50 hover:shadow-lg ${isPopular ? 'border-blue-500 shadow-md' : 'border-gray-200'} `}
    >
      {isPopular && (
        <div className='absolute -top-4 left-1/2 z-10 -translate-x-1/2'>
          <span className='whitespace-nowrap rounded-full bg-blue-500 px-4 py-1 text-sm font-medium text-white shadow-sm'>
            Most Popular
          </span>
        </div>
      )}
      <div className='flex flex-1 flex-col p-6'>
        {/* Header */}
        <div className='mb-8 text-center'>
          <h3 className='text-lg font-semibold text-gray-900'>
            {isFree ? 'Free' : 'Paid'}
          </h3>
          <div className='mt-4 flex items-baseline justify-center gap-x-2'>
            <span className='text-4xl font-bold text-gray-900'>
              ${priceAmount}
            </span>
            {!isFree && (
              <span className='text-sm text-gray-500'>/{price.interval}</span>
            )}
          </div>
        </div>

        {/* Description */}
        <div className='py-8 text-center text-sm text-gray-500'>
          {isFree ? (
            <div>Perfect for getting started with FocusGate</div>
          ) : (
            <div>Get access to all FocusGate premium features</div>
          )}
        </div>

        {/* Features List */}
        <div className='flex-1'>
          <ul className='mb-8 space-y-4'>
            {isFree ? (
              <li className='flex items-start gap-3 text-sm text-gray-600'>
                <CheckCircle2 className='mt-0.5 h-4 w-4 flex-shrink-0 text-blue-500' />
                Basic features
              </li>
            ) : (
              <li className='flex items-start gap-3 text-sm text-gray-600'>
                <CheckCircle2 className='mt-0.5 h-4 w-4 flex-shrink-0 text-blue-500' />
                All premium features
              </li>
            )}
          </ul>
        </div>

        {/* CTA Button */}
        <div className='mt-auto'>
          {createCheckoutAction && (
            <button
              onClick={() => createCheckoutAction({ price })}
              className={`w-full rounded-lg px-4 py-2.5 font-medium transition-colors ${isPopular ? 'bg-blue-500 text-white hover:bg-blue-600' : 'border border-gray-200 bg-white text-gray-900 hover:border-blue-500'} `}
            >
              {isFree ? 'Get started for free' : 'Upgrade now'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
