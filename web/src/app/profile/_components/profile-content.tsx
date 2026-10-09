'use client';
import { useEffect, useState } from 'react';
import { ProfileDetailsCard } from '@/app/(user)/_components/profile-details-card';
import { getUserMessagePref } from '@/app/(newsletter)/_services/newsletter.service';
import { useUser } from '@clerk/nextjs';
import { NewsletterCard } from '@/app/(newsletter)/_components/newsletter-card';
import { YourPlanCard } from './your-plan-card';
import { AccountActionsCard } from './account-action-card';
import { usePrefHourState } from '@/app/stores/userPrefHourState';
import { getUserTimezone } from '@/shared/services/timezone';
import { Loader2 } from 'lucide-react';
import { usePrefState } from '@/app/stores/userPrefState';

interface UserPreferences {
  timezone: string | null;
  email: string;
  createdAt: Date;
  updatedAt: Date;
  userId: string;
  description: string | null;
  phone: string | null;
  prefTime: string | null;
  isSubscribed: boolean | null;
}

interface InitializedData {
  preferences: UserPreferences | null;
  timezone: string | null;
  preferredHour: number | null;
}

export default function ProfileContent({
  subscription,
}: {
  subscription: any;
}) {
  const { user, isLoaded: isUserLoaded } = useUser();
  const { preferredHour, setPreferredHour } = usePrefHourState();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [initializedData, setInitializedData] = useState<InitializedData>({
    preferences: null,
    timezone: null,
    preferredHour: null,
  });

  useEffect(() => {
    const initializeUserData = async () => {
      if (!isUserLoaded || !user?.primaryEmailAddress?.emailAddress) {
        return;
      }

      try {
        setIsLoading(true);
        setError(null);

        // Get user timezone first
        const userTimezone = getUserTimezone();

        // Fetch user preferences
        const userPref = await getUserMessagePref(
          user.primaryEmailAddress.emailAddress,
        );

        let finalPreferredHour: number | null = null;

        // Only set preferredHour if we have valid preferences
        if (userPref?.prefTime) {
          const hour = parseInt(userPref.prefTime.split(':')[0]);
          if (!isNaN(hour)) {
            finalPreferredHour = hour;
          }
        }

        // Update all state at once
        setInitializedData({
          preferences: userPref,
          timezone: userTimezone,
          preferredHour: finalPreferredHour,
        });

        // Only set the preferred hour in global state if we have a value
        if (finalPreferredHour !== null) {
          setPreferredHour(finalPreferredHour);
        } else if (!userPref?.prefTime) {
          // Only set default if there's no prefTime at all
          setPreferredHour(7);
        }
      } catch (err) {
        console.error('Failed to initialize user data:', err);
        setError('Failed to load user preferences');
      } finally {
        setIsLoading(false);
      }
    };

    initializeUserData();
  }, [isUserLoaded, user, setPreferredHour]);

  // Show loading state until everything is ready
  if (
    isLoading ||
    !isUserLoaded ||
    (initializedData.preferredHour === null && !error)
  ) {
    return (
      <div className='flex min-h-[90vh] items-center justify-center'>
        <Loader2 className='h-10 w-10 animate-spin text-blue-500' />
      </div>
    );
  }

  // Show error state if needed
  if (error) {
    return (
      <div className='flex min-h-screen items-center justify-center text-red-500'>
        {error}
      </div>
    );
  }

  return (
    <section className='w-full'>
      <div className='w-full'>
        <div className='mx-auto max-w-5xl px-4'>
          <div className='mb-16 space-y-4 text-center'>
            <span className='inline-block rounded-full bg-gray-100 px-5 py-2 text-sm font-medium text-gray-900'>
              Profile
            </span>
            <h1 className='text-5xl font-bold tracking-tight text-gray-900'>
              Hey, {user?.fullName || ''} 👋
            </h1>
            <p className='text-lg text-gray-500'>Great to see you again!</p>
          </div>
          <div className='grid gap-4 md:grid-cols-2'>
            <ProfileDetailsCard user={user} />
            <NewsletterCard
              prefs={initializedData.preferences || {}}
              setPrefs={(newPrefs: UserPreferences) =>
                setInitializedData((prev) => ({
                  ...prev,
                  preferences: newPrefs,
                }))
              }
            />
            <div className='md:col-span-2'>
              <YourPlanCard subscription={subscription} />
            </div>
            <div className='md:col-span-2'>
              <AccountActionsCard user={user} />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
