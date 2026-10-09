// account-actions-card.tsx
import { Settings, ChevronDown, ChevronUp, LogOut } from 'lucide-react';
import { useState } from 'react';

export function AccountActionsCard({ user }: { user: any }) {
  const [showMoreDetails, setShowMoreDetails] = useState(false);
  //   const supabase = createClient();

  const handleSignOut = async () => {
    // await supabase.auth.signOut();
    window.location.href = '/';
  };

  return (
    <div className='rounded-xl border border-gray-100 bg-white p-6 shadow-sm'>
      {/* <div className='flex items-center gap-3 mb-4'>
        <Settings className='w-5 h-5 text-blue-600' />
        <h2 className='text-lg font-medium'>Account Actions</h2>
      </div> */}

      <div className='space-y-3'>
        {/* <button
          onClick={() => setShowMoreDetails(!showMoreDetails)}
          className='w-full flex items-center justify-between py-2 px-4 bg-gray-50 rounded-lg text-sm text-gray-600 hover:bg-gray-100'
        >
          Account Details
          {showMoreDetails ? <ChevronUp className='w-4 h-4' /> : <ChevronDown className='w-4 h-4' />}
        </button>

        {showMoreDetails && (
          <div className='p-3 bg-gray-50 rounded-lg space-y-2'>
            <p className='text-sm'>
              <span className='text-gray-500'>ID:</span> <span className='font-mono bg-white px-2 py-0.5 rounded'>{user.id}</span>
            </p>
            {user.role && (
              <p className='text-sm'>
                <span className='text-gray-500'>Role:</span> <span className='bg-white px-2 py-0.5 rounded'>{user.role}</span>
              </p>
            )}
          </div>
        )} */}

        <button
          onClick={handleSignOut}
          className='flex w-full items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm font-medium text-red-600 transition duration-200 hover:bg-red-50'
        >
          <LogOut className='h-4 w-4' />
          Sign Out
        </button>
      </div>
    </div>
  );
}
