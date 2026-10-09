// middleware.ts

import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import { checkIfSubscriptionExistsForClerkId } from '@/app/pricing/_services/subscription-service';
import { db } from '@/db/db';
import { users, userSlackWorkspaces } from '@/db/schema';
import { eq } from 'drizzle-orm';

// Define route matchers
const isProtectedRoute = createRouteMatcher([
  '/dashboard(.*)',
  '/settings(.*)',
]);
const isAuthPage = createRouteMatcher(['/login', '/signup', '/auth(.*)']);
const isPublicPage = createRouteMatcher([
  '/',
  '/pricing',
  '/api/webhooks(.*)',
  '/api/(.*)',
]);
const isSlackRelatedPage = createRouteMatcher([
  '/slack-connect',
  '/auth/slack/callback',
]);

const checkIfUserHasConnectedWorkspace = async (clerkId: string) => {
  const user = await db
    .select()
    .from(users)
    .where(eq(users.clerkId, clerkId))
    .limit(1);
  if (!user.length) return false;

  const workspace = await db
    .select()
    .from(userSlackWorkspaces)
    .where(eq(userSlackWorkspaces.userId, user[0].id))
    .limit(1);

  return workspace.length > 0;
};

export default clerkMiddleware(async (auth, req) => {
  const path = req.nextUrl.pathname;
  const { userId } = await auth();

  // Skip middleware for Slack callback to prevent redirect loops
  if (isSlackRelatedPage(req)) {
    return NextResponse.next();
  }

  // Handle public pages
  if (isPublicPage(req)) {
    // Special handling for homepage
    if (path === '/') {
      if (!userId) {
        return NextResponse.redirect(new URL('/login', req.url));
      }
      const hasSubscription = await checkIfSubscriptionExistsForClerkId(userId);
      return NextResponse.redirect(
        new URL(hasSubscription ? '/dashboard' : '/pricing', req.url),
      );
    }

    // Special handling for pricing page - redirect to dashboard if user has subscription
    if (path === '/pricing' && userId) {
      const hasSubscription = await checkIfSubscriptionExistsForClerkId(userId);
      if (hasSubscription) {
        return NextResponse.redirect(new URL('/dashboard', req.url));
      }
    }

    // For other public pages, proceed normally
    return NextResponse.next();
  }

  // Redirect unauthenticated users to login
  if (!userId) {
    if (!isAuthPage(req)) {
      return NextResponse.redirect(new URL('/login', req.url));
    }
    return NextResponse.next();
  }

  // Form hereon out, user is authenticated

  // Redirect authenticated users away from auth pages
  if (isAuthPage(req)) {
    return NextResponse.redirect(new URL('/dashboard', req.url));
  }

  // Check Slack connection status for all authenticated users
  const hasConnectedWorkspace = await checkIfUserHasConnectedWorkspace(userId);

  // Special handling for pricing page
  if (path === '/pricing') {
    if (!hasConnectedWorkspace) {
      return NextResponse.redirect(new URL('/slack-connect', req.url));
    }
    return NextResponse.next();
  }

  // If no Slack connection and not on Slack-related pages, redirect to slack-connect
  if (!hasConnectedWorkspace && !isSlackRelatedPage(req)) {
    return NextResponse.redirect(new URL('/slack-connect', req.url));
  }

  // Check subscription status for protected routes
  if (isProtectedRoute(req)) {
    const hasSubscription = await checkIfSubscriptionExistsForClerkId(userId);
    if (!hasSubscription) {
      return NextResponse.redirect(new URL('/pricing', req.url));
    }
  }

  return NextResponse.next();
});

export const config = {
  matcher: [
    // Skip Next.js internals and all static files, unless found in search params
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    // Always run for API routes
    '/(api|trpc)(.*)',
  ],
};
