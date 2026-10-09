'use client';

import React from 'react';
import { useUser } from '@clerk/nextjs';
import { getUserIdByClerkId } from '@/app/(user)/_services/user.service';

export default function SlackConnect() {
  const { user } = useUser();
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL;

  // Combine both bot and user scopes
  const scopes = encodeURIComponent(
    'channels:read,groups:read,mpim:read,im:read,chat:write',
  );
  const userScopes = encodeURIComponent(
    'channels:history,groups:history,mpim:history,im:history,channels:read,groups:read,mpim:read,im:read,users:read',
  );
  const redirectUri = encodeURIComponent(`${siteUrl}/auth/slack/callback`);
  const clientId = process.env.NEXT_PUBLIC_SLACK_CLIENT_ID;

  if (!clientId) {
    console.error('Slack Client ID is not set.');
    return null;
  }

  // Add state parameter with userId
  const state = encodeURIComponent(JSON.stringify({ userId: user?.id }));

  const slackAuthUrl = `https://slack.com/oauth/v2/authorize?client_id=${clientId}&scope=${scopes}&user_scope=${userScopes}&redirect_uri=${redirectUri}&state=${state}`;

  return (
    <div className='flex flex-col items-center justify-center'>
      <div className='flex w-fit justify-center'>
        <a
          href={slackAuthUrl}
          className='inline-flex h-14 w-[276px] items-center justify-center rounded-full bg-[#4A154B] font-sans text-lg font-semibold text-white no-underline'
        >
          <svg
            xmlns='http://www.w3.org/2000/svg'
            className='mr-3 h-6 w-6'
            viewBox='0 0 122.8 122.8'
          >
            <path
              d='M25.8 77.6c0 7.1-5.8 12.9-12.9 12.9S0 84.7 0 77.6s5.8-12.9 12.9-12.9h12.9v12.9zm6.5 0c0-7.1 5.8-12.9 12.9-12.9s12.9 5.8 12.9 12.9v32.3c0 7.1-5.8 12.9-12.9 12.9s-12.9-5.8-12.9-12.9V77.6z'
              fill='#e01e5a'
            />
            <path
              d='M45.2 25.8c-7.1 0-12.9-5.8-12.9-12.9S38.1 0 45.2 0s12.9 5.8 12.9 12.9v12.9H45.2zm0 6.5c7.1 0 12.9 5.8 12.9 12.9s-5.8 12.9-12.9 12.9H12.9C5.8 58.1 0 52.3 0 45.2s5.8-12.9 12.9-12.9h32.3z'
              fill='#36c5f0'
            />
            <path
              d='M97 45.2c0-7.1 5.8-12.9 12.9-12.9s12.9 5.8 12.9 12.9-5.8 12.9-12.9 12.9H97V45.2zm-6.5 0c0 7.1-5.8 12.9-12.9 12.9s-12.9-5.8-12.9-12.9V12.9C64.7 5.8 70.5 0 77.6 0s12.9 5.8 12.9 12.9v32.3z'
              fill='#2eb67d'
            />
            <path
              d='M77.6 97c7.1 0 12.9 5.8 12.9 12.9s-5.8 12.9-12.9 12.9-12.9-5.8-12.9-12.9V97h12.9zm0-6.5c-7.1 0-12.9-5.8-12.9-12.9s5.8-12.9 12.9-12.9h32.3c7.1 0 12.9 5.8 12.9 12.9s-5.8 12.9-12.9 12.9H77.6z'
              fill='#ecb22e'
            />
          </svg>
          Add to Slack
        </a>
      </div>
    </div>
  );
}
