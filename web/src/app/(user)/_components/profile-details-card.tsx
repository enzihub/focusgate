// profile-card.tsx
import { User } from 'lucide-react';
import { formatDate } from '@/app/(newsletter)/_utils/date-utils';
import { useUser } from '@clerk/nextjs';

export function ProfileDetailsCard({ user }: { user: any }) {
  return (
    <div className='rounded-xl bg-white p-6'>
      <div className='mb-4 flex items-center gap-3'>
        <User className='h-5 w-5 text-[#BF8811]' />
        <h2 className='font-medium'>Profile Details</h2>
      </div>

      <div className='space-y-4'>
        <div className='flex items-center gap-4'>
          <img
            src={user?.imageUrl || '/images/logo.png'}
            alt={user?.fullName || 'Profile'}
            className='h-14 w-14 rounded-full'
          />
          <div>
            <p className='text-sm'>Email</p>
            <p className='font-semibold'>
              {user?.primaryEmailAddress?.emailAddress}
            </p>
          </div>
        </div>

        <div className='grid grid-cols-2 gap-3'>
          <div className='rounded-lg p-3'>
            <p className='text-sm'>Status</p>
            <p className='font-medium'>
              {user?.hasVerifiedEmailAddress ? '✅ Verified' : '⏳ Pending'}
            </p>
          </div>
          <div className='rounded-lg px-6 py-3'>
            <p className='text-sm'>Member Since</p>
            <p className='font-medium'>
              {formatDate(user?.createdAt?.toDateString()!)}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
