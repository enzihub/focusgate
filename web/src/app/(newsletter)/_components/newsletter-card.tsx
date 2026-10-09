// newsletter-card.tsx

'use client';

import { Clock } from 'lucide-react';
import { getUserTimezone } from '@/shared/services/timezone';
import { Skeleton } from '@/components/ui/skeleton';
import { useEffect, useState } from 'react';
import { useAuth, useUser } from '@clerk/nextjs';
import {
  getUserMessagePref,
  updateUserMessageSubscriptionStatus,
  upsertUserMessagePref,
} from '@/app/(newsletter)/_services/newsletter.service';
import { getNextOccurrence } from '@/app/(newsletter)/_utils/date-utils';
import { usePrefHourState } from '@/app/stores/userPrefHourState';

interface NewsletterCardProps {
  prefs: any;
  setPrefs: (prefs: any) => void;
}

export function NewsletterCard({ prefs, setPrefs }: NewsletterCardProps) {
  const { user } = useUser();
  const { getToken } = useAuth();
  const [timezone] = useState(getUserTimezone());
  const [nextEmailTime, setNextEmailTime] = useState<string>('');
  const [updating, setUpdating] = useState(false);
  const [isSubscribed, setIsSubscribed] = useState(true);
  const [toggleLoading, setToggleLoading] = useState(false);
  const { preferredHour, setPreferredHour } = usePrefHourState();

  const AUTHORIZED_EMAILS =
    process.env.NEXT_PUBLIC_AUTHORIZED_EMAILS?.split(',') || [];
  const handleToggleSubscription = async () => {
    setToggleLoading(true);
    try {
      const updatedPrefs = await updateUserMessageSubscriptionStatus(
        user?.primaryEmailAddress?.emailAddress!,
        !isSubscribed,
      );

      if (updatedPrefs) {
        setIsSubscribed(!isSubscribed);
        setPrefs(updatedPrefs);

        // Using Alert component from shadcn/ui for better UX
        const message = isSubscribed
          ? 'Successfully unsubscribed from the newsletter!'
          : 'Successfully subscribed to the newsletter!';

        alert(message);
      }
    } catch (error) {
      console.error('Error toggling subscription:', error);

      alert('Failed to toggle subscription. Please try again.');
    } finally {
      setToggleLoading(false);
    }
  };

  const handleSend = async () => {
    try {
      //await requestNewsletter(user);
      alert('Newsletter requested successfully. Check your email shortly!');
    } catch (error) {
      console.error('Error:', error);
      alert('Failed to send newsletter. Please try again.');
    }
  };

  const handleUpdatePreferences = async () => {
    setUpdating(true);
    try {
      // Format the preferred hour directly in HH:mm format
      const timeString = `${preferredHour.toString().padStart(2, '0')}:00`;

      const prefResult = await upsertUserMessagePref(
        user?.id!,
        user?.primaryEmailAddress?.emailAddress!,
        prefs.phone,
        timeString, // Store the local time as "HH:mm"
        timezone,
        prefs.description,
      );

      if (prefResult) {
        const nextEmail = getNextOccurrence(preferredHour, timezone);
        setNextEmailTime(nextEmail);
        alert(
          `Perfect! 🎉 Your next curated recommendations will arrive on ${nextEmail}`,
        );
      }
    } catch (error) {
      console.error('Error updating preferences:', error);
      alert('Failed to update preferences. Please try again.');
    } finally {
      setUpdating(false);
    }
  };
  const hours = Array.from({ length: 24 }, (_, i) => {
    const hour = i;
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const hour12 = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
    return {
      value: hour,
      label: `${hour12}:00 ${ampm}`,
    };
  });

  return (
    <div className='rounded-xl border border-gray-100 bg-white p-6 shadow-sm'>
      <div className='mb-4 flex items-center justify-between'>
        <div className='flex items-center gap-3'>
          <Clock className='h-5 w-5 text-blue-600' />
          <h2 className='text-lg font-medium'>Newsletter ✉️</h2>
        </div>
        <button
          onClick={handleToggleSubscription}
          disabled={toggleLoading}
          className={`rounded-lg px-4 py-1.5 text-sm font-medium transition duration-200 ${isSubscribed ? 'bg-red-50 text-red-600 hover:bg-red-100' : 'bg-blue-50 text-blue-600 hover:bg-blue-100'}`}
        >
          {toggleLoading ? '...' : isSubscribed ? 'Unsubscribe' : 'Subscribe'}
        </button>
      </div>

      {isSubscribed && (
        <div className='space-y-4'>
          <div className='flex flex-wrap items-center gap-3 text-gray-700'>
            <span className='text-base'>I want my newsletter at</span>
            {toggleLoading ? (
              <Skeleton className='h-9 w-24' />
            ) : (
              <select
                value={preferredHour}
                onChange={(e) => setPreferredHour(parseInt(e.target.value))}
                className='rounded-lg border border-gray-200 bg-white px-3 py-1.5 shadow-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500'
              >
                {hours.map(({ value, label }) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            )}
            <span className='text-sm text-gray-500'>({timezone})</span>
          </div>

          {nextEmailTime && (
            <div className='rounded-lg bg-blue-50 p-3 text-sm text-blue-700'>
              Perfect! 🎉 Your next curated recommendations will arrive on{' '}
              {nextEmailTime}
            </div>
          )}

          <button
            onClick={handleUpdatePreferences}
            disabled={updating}
            className='w-full rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition duration-200 hover:bg-blue-700 disabled:bg-blue-300'
          >
            {updating ? 'Saving...' : 'Save My Preference'}
          </button>

          {AUTHORIZED_EMAILS.includes(
            user?.primaryEmailAddress?.emailAddress!,
          ) && (
            <button
              onClick={handleSend}
              className='flex w-full items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm font-medium text-blue-600 transition duration-200 hover:bg-blue-50'
            >
              Send me Newsletter Now! ✨
            </button>
          )}
        </div>
      )}

      {!isSubscribed && (
        <p className='text-sm text-gray-500'>
          Subscribe to receive curated recommendations in your inbox at your
          preferred time.
        </p>
      )}
    </div>
  );
}
