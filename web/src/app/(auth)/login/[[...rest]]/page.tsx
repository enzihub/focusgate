'use client';
import { SignIn } from '@clerk/nextjs';
import { Loader2 } from 'lucide-react';

export default function LoginPage() {
  return (
    <div className='flex w-full flex-col'>
      <div className='flex flex-1 items-center justify-center px-4'>
        <SignIn
          appearance={{
            elements: {
              rootBox: 'mx-auto w-full max-w-md mt-8',
              card: 'backdrop-blur-md shadow-none border-none',
              headerTitle: 'text-black text-3xl font-bold',
              headerSubtitle: 'text-gray-800 text-lg',
              formButtonPrimary:
                'bg-blue-600 hover:bg-blue-700 py-2 border-none',
              formFieldLabel: 'text-gray-800',
              formFieldInput:
                ' border-gray-700 text-black placeholder-gray-400',
              dividerLine: 'bg-gray-700',
              dividerText: 'text-gray-800',
              formField: 'rounded-lg',
              footerActionLink: 'text-blue-600 hover:text-blue-500',
            },
          }}
          fallback={
            <div className='fixed inset-0 flex items-center justify-center'>
              <Loader2 className='h-10 w-10 animate-spin text-blue-500' />
            </div>
          }
        />
      </div>
    </div>
  );
}
