'use client';
import { Button } from '@/components/ui/custom-button';
import { useUser } from '@clerk/nextjs';
import { useState } from 'react';
import { sendNewsletterAction } from '../(newsletter)/_actions/newsletter';

export default function Dashboard() {
  const { user } = useUser();
  const [newsletterLoading, setNewsletterLoading] = useState(false);
  const [loading, setLoading] = useState(false);

  if (!user) {
    return (
      <div className='flex min-h-screen items-center justify-center'>
        <div className='h-12 w-12 animate-spin rounded-full border-b-2 border-t-2 border-blue-500'></div>
      </div>
    );
  }

  const handleDopamineClick = async () => {
    try {
      setLoading(true);
      const response = await sendNewsletterAction(
        user?.primaryEmailAddress?.emailAddress!,
      );
      alert(response.status);
    } catch (error) {
      console.error('Error:', error);
      alert('Failed to send dopamine hit. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className='w-full items-center md:px-32'>
      {/* Header */}
      <div className='mb-4 flex items-center gap-2'>
        <h1 className='text-2xl font-bold'> Hey, {user?.fullName || ''} 👋</h1>
      </div>


      {/* Confirmation Message */}
      <p className='mb-4 text-lg'>
        Thanks for joining FocusGate! Since you&apos;ve logged in via Slack, we
        now have everything we need to start delivering concise, executive-level
        summaries straight to your inbox. Starting tomorrow at 8 AM, you&apos;ll
        receive a tailored email summarizing your Slack activity into an
        actionable report—helping you stay on top of what truly matters.
      </p>

      {/* Email Info */}
      <p className='mb-4 text-lg'>
        Want even more insights? Upgrade to a daily summary for just $8/month
        and support our mission to simplify workplace communication.
      </p>
      <p className='text-lg'>
        Can&apos;t wait for your first summary? Click the button below to get an
        instant FocusGate report sent to your email.
      </p>

      {/* Dopamine Button */}
      <button
        onClick={handleDopamineClick}
        disabled={loading}
        className='my-5 gap-2.5 rounded-[32px] border border-solid border-blue-600 bg-blue-600 px-6 py-2 text-white shadow-[2px_3px_0px_rgba(0,0,0,1)] hover:text-black disabled:bg-blue-300 max-md:px-5'
      >
        {loading ? 'Sending...' : 'Send me FocusGate'}
      </button>

      {/* Contact Info */}
      <div className='flex items-center gap-2'>
        <p className='text-lg'>
          Have questions or ideas? We&apos;d love to hear from you. Reply to
          any FocusGate email and it reaches the team.
        </p>
        <span role='img' aria-label='heart' className='text-xl'>
          ❤️
        </span>
      </div>
    </div>
  );
}
