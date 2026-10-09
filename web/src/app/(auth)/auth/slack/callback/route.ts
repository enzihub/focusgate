// app/auth/slack/callback/route.ts
import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { db } from '@/db/db';
import { userSlackWorkspaces } from '@/db/schema';
import { getUserIdByClerkId } from '@/app/(user)/_services/user.service';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get('code');

  if (!code) {
    return NextResponse.redirect(
      `${process.env.SITE_URL}/auth/auth-code-error`,
    );
  }

  try {
    // Get the authenticated Clerk user ID
    const authResult = await auth();
    const clerkId = authResult?.userId;

    if (!clerkId) {
      console.error('No authenticated user found during Slack callback');
      return NextResponse.redirect(`${process.env.SITE_URL}/login`);
    }

    // Resolve the correct user ID using the provided function
    const userId = await getUserIdByClerkId(clerkId);
    if (!userId) {
      console.error('User ID not found for Clerk ID:', clerkId);
      return NextResponse.redirect(
        `${process.env.SITE_URL}/auth/auth-code-error`,
      );
    }

    // Exchange the code for Slack access token
    const response = await fetch('https://slack.com/api/oauth.v2.access', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        code,
        client_id: process.env.NEXT_PUBLIC_SLACK_CLIENT_ID!,
        client_secret: process.env.SLACK_CLIENT_SECRET!,
        redirect_uri: `${process.env.SITE_URL}/auth/slack/callback`,
      }),
    });

    const data = await response.json();

    if (!data.ok) {
      console.error('Slack OAuth error:', data.error);
      return NextResponse.redirect(
        `${process.env.SITE_URL}/auth/auth-code-error`,
      );
    }

    // Store or update the workspace information
    await db
      .insert(userSlackWorkspaces)
      .values({
        userId,
        workspaceId: data.team.id,
        workspaceName: data.team.name,
        userAccessToken: data.authed_user.access_token,
        botUserId: data.bot_user_id,
      })
      .onConflictDoUpdate({
        target: [userSlackWorkspaces.userId], // Only use userId as the conflict target
        set: {
          workspaceId: data.team.id, // Update workspaceId when changing workspaces
          workspaceName: data.team.name,
          userAccessToken: data.authed_user.access_token,
          botUserId: data.bot_user_id,
          updatedAt: new Date(),
        },
      });

    return NextResponse.redirect(`${process.env.SITE_URL}/dashboard`);
  } catch (error) {
    console.error('Error handling Slack callback:', error);
    return NextResponse.redirect(
      `${process.env.SITE_URL}/auth/auth-code-error`,
    );
  }
}
