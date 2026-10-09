import React from 'react';
import ReactMarkdown from 'react-markdown';

const markdownComponents = {
  h1: ({ children }: any) => (
    <h1 className='mb-8 text-center text-3xl font-medium tracking-tight text-gray-100 md:text-4xl'>
      {children}
    </h1>
  ),
  h2: ({ children }: any) => (
    <h2 className='mb-4 border-b border-gray-700 pb-2 text-xl font-medium tracking-tight text-gray-200 md:text-2xl'>
      {children}
    </h2>
  ),
  h3: ({ children }: any) => (
    <h3 className='mb-3 text-lg font-medium tracking-tight text-gray-300 md:text-xl'>
      {children}
    </h3>
  ),
  p: ({ children }: any) => (
    <p className='mb-6 text-sm leading-relaxed text-gray-400 md:text-base'>
      {children}
    </p>
  ),
  ul: ({ children }: any) => (
    <ul className='mb-6 ml-4 list-outside list-disc text-sm text-gray-400 md:text-base'>
      {children}
    </ul>
  ),
  ol: ({ children }: any) => (
    <ol className='mb-6 ml-4 list-outside list-decimal text-sm text-gray-400 md:text-base'>
      {children}
    </ol>
  ),
  li: ({ children }: any) => <li className='mb-2'>{children}</li>,
  hr: () => <hr className='my-8 border-gray-700' />,
};

export default function PrivacyPolicy() {
  const markdownContent = `
# Privacy Policy

This page is a placeholder that ships with the open-source FocusGate code.

If you run FocusGate for other people, replace this text with your own privacy policy before you go live.

## Data FocusGate handles

- **Account data:** name and email from your sign-in provider (Clerk).
- **Slack data:** the user OAuth token for the workspace the user connects, and the messages from the last 24 hours in channels that token can read. Messages are sent to the AI provider to write the summary and are not stored by FocusGate.
- **Preferences:** time zone and preferred delivery time.
- **Billing:** Stripe customer and subscription ids, if you turn billing on.

## Third parties

Clerk (sign-in), Slack (data source), Google Gemini (summaries), Mailtrap (email), Stripe (billing) and Postgres hosting. Each one processes data under its own terms.

## Contact

Set \`NEXT_PUBLIC_SUPPORT_EMAIL\` so users know how to reach you.
`;

  return (
    <div className='w-full bg-black'>
      <div className='mx-auto max-w-3xl px-4 md:px-6'>
        <div className='mb-16 mt-16 rounded-lg'>
          <div className='scrollbar-thin scrollbar-thumb-gray-700 hover:scrollbar-thumb-gray-600 scrollbar-track-transparent overflow-y-auto px-6 py-8 md:px-8'>
            <div className='prose prose-invert max-w-none'>
              <ReactMarkdown components={markdownComponents}>
                {markdownContent}
              </ReactMarkdown>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
