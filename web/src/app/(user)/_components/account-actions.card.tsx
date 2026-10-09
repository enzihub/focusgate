// account-actions-card.tsx
import { Settings, ChevronDown, ChevronUp, LogOut } from 'lucide-react';
import { useState } from 'react';
import { SignOutButton, useUser } from '@clerk/nextjs';

export function AccountActionsCard() {
  const { user } = useUser();
  const [showMoreDetails, setShowMoreDetails] = useState(false);

  const handleSignOut = async () => {
    window.location.href = '/';
  };

  return (
    <div className='rounded-xl p-6'>
      <div className='mb-4 flex items-center gap-3'>
        <Settings className='h-5 w-5 text-[#BF8811]' />
        <h2 className='text-lg font-medium text-white/90'>Account Actions</h2>
      </div>

      <div className='space-y-3'>
        <button
          onClick={() => setShowMoreDetails(!showMoreDetails)}
          className='flex w-full items-center justify-between rounded-lg px-4 py-2 text-sm text-white/60'
        >
          Account Details
          {showMoreDetails ? (
            <ChevronUp className='h-4 w-4' />
          ) : (
            <ChevronDown className='h-4 w-4' />
          )}
        </button>

        {showMoreDetails && (
          <div className='space-y-2 rounded-lg bg-gray-900 p-3'>
            <p className='text-sm'>
              <span className='text-white/90'>ID:</span>{' '}
              <span className='rounded-sm px-2 py-0.5 font-mono text-white/60'>
                {user?.id}
              </span>
            </p>
          </div>
        )}

        <SignOutButton>
          <button className='flex w-full items-center justify-center gap-2 rounded-lg px-4 py-4 text-sm font-medium text-[#17999B] transition duration-200'>
            <LogOut className='h-4 w-4' />
            Sign Out
          </button>
        </SignOutButton>
      </div>
    </div>
  );
}
