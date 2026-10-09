import { Webhook } from 'svix';
import { headers } from 'next/headers';
import { WebhookEvent } from '@clerk/nextjs/server';
import { createUserMessagePref } from '@/app/(newsletter)/_services/newsletter.service';
import { upsertUser } from '@/app/(user)/_services/user.service';
import { UpsertUserInput } from '@/db/schema';

const transformWebhookData = (webhookData: any): UpsertUserInput => {
  return {
    clerkId: webhookData.id, // Use Clerk's ID as clerkId
    fullName: `${webhookData.first_name} ${webhookData.last_name}`,
    primaryEmailAddress: {
      emailAddress: webhookData.email_addresses[0].email_address,
    },
    imageUrl: webhookData.image_url,
  };
};

export async function POST(req: Request) {
  const SIGNING_SECRET = process.env.SIGNING_SECRET;

  if (!SIGNING_SECRET) {
    throw new Error(
      'Error: Please add SIGNING_SECRET from Clerk Dashboard to .env or .env.local',
    );
  }

  // Create new Svix instance with secret
  const wh = new Webhook(SIGNING_SECRET);

  // Get headers
  const headerPayload = await headers();
  const svix_id = headerPayload.get('svix-id');
  const svix_timestamp = headerPayload.get('svix-timestamp');
  const svix_signature = headerPayload.get('svix-signature');

  // If there are no headers, error out
  if (!svix_id || !svix_timestamp || !svix_signature) {
    return new Response('Error: Missing Svix headers', {
      status: 400,
    });
  }

  // Get body
  const payload = await req.json();
  const body = JSON.stringify(payload);

  let evt: WebhookEvent;

  // Verify payload with headers
  try {
    evt = wh.verify(body, {
      'svix-id': svix_id,
      'svix-timestamp': svix_timestamp,
      'svix-signature': svix_signature,
    }) as WebhookEvent;
  } catch (err) {
    console.error('Error: Could not verify webhook:', err);
    return new Response('Error: Verification error', {
      status: 400,
    });
  }

  // Do something with payload
  // For this guide, log payload to console
  // const { id } = evt.data
  // const eventType = evt.type
  // console.log(`Received webhook with ID ${id} and event type of ${eventType}`)
  // console.log('Webhook payload:', body)
  //
  // await createTweetPref(
  //   user?.id!,
  //   user?.primaryEmailAddress?.emailAddress!,
  //   '',
  //   timezone,
  // );
  //
  // await upsertUser(user!);

  // Handle the webhook and update database
  if (evt.type === 'user.created') {
    const webhookData = evt.data;

    // Transform webhook data to match User interface
    const user = {
      id: webhookData.id,
      primaryEmailAddress: {
        emailAddress: webhookData.email_addresses[0].email_address,
      },
      fullName: `${webhookData.first_name} ${webhookData.last_name}`,
      imageUrl: webhookData.image_url,
    };

    try {
      // Get user's timezone based on their IP address
      // const timezone = await getUserTZ(evt.data.cl);
      const timezone = '';

      // Create the user's brief preferences (7 AM by default)
      await createUserMessagePref(
        user.primaryEmailAddress.emailAddress,
        '', // Empty phone as it's not provided in the initial signup
        timezone || 'UTC', // Fallback to UTC if timezone detection fails
        '07:00',
      );

      // Upsert the user row
      const webhookUser = transformWebhookData(webhookData);
      await upsertUser(webhookUser);

      return new Response('Webhook processed successfully', {
        status: 200,
      });
    } catch (error) {
      console.error('Error processing webhook:', error);
      return new Response('Error processing webhook', {
        status: 500,
      });
    }
  }

  return new Response('Webhook received', { status: 200 });
}
