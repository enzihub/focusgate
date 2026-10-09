// newsletter.service.ts

'use server';

import { eq } from 'drizzle-orm';
import { db } from '@/db/db';
import { SelectUserPref, userPrefs, InsertUserPref } from '@/db/schema';
import { getOrCreateUser } from '@/app/(user)/_services/user.service';

export async function createUserMessagePref(
  email: string,
  phone: string,
  timezone: string,
  prefTime: string,
): Promise<SelectUserPref> {
  try {
    // First, ensure we have a user with a proper UUID
    const user = await getOrCreateUser(email);

    // Check if preference exists
    const existingPref = await db
      .select()
      .from(userPrefs)
      .where(eq(userPrefs.email, user.email))
      .limit(1);

    if (existingPref.length > 0) {
      return existingPref[0];
    }

    // Create new preference
    const newPref = await db
      .insert(userPrefs)
      .values({
        userId: user.id,
        email,
        timezone,
        phone,
        prefTime,
        createdAt: new Date(),
        updatedAt: new Date(),
      } satisfies InsertUserPref)
      .returning();

    return newPref[0];
  } catch (error) {
    throw new Error(
      `Failed to create brief preference: ${error instanceof Error ? error.message : 'Unknown error'}`,
    );
  }
}
export async function updateUserMessageSubscriptionStatus(
  email: string,
  isSubscribed: boolean,
): Promise<any> {
  try {
    const updatedPrefs = await db
      .update(userPrefs)
      .set({
        isSubscribed,
        updatedAt: new Date(),
      })
      .where(eq(userPrefs.email, email))
      .returning();

    return updatedPrefs[0]; // Return the updated preferences
  } catch (error) {
    throw new Error(
      `Failed to update subscription status: ${error instanceof Error ? error.message : 'Unknown error'}`,
    );
  }
}

export async function getUserMessagePref(
  email: string,
): Promise<SelectUserPref | null> {
  try {
    const pref = await db
      .select()
      .from(userPrefs)
      .where(eq(userPrefs.email, email))
      .limit(1);

    return pref[0] || null;
  } catch (error) {
    return null;
  }
}

export async function upsertUserMessagePref(
  userId: string,
  email: string,
  phone: string,
  prefTime: string,
  timezone: string,
  description?: string,
): Promise<SelectUserPref> {
  try {
    const existingPref = await db
      .select()
      .from(userPrefs)
      .where(eq(userPrefs.email, email))
      .limit(1);

    if (existingPref.length > 0) {
      // Update existing preference
      const updatedPref = await db
        .update(userPrefs)
        .set({
          phone,
          prefTime,
          description,
          timezone,
          updatedAt: new Date(),
        })
        .where(eq(userPrefs.email, email))
        .returning();

      return updatedPref[0];
    } else {
      // Create new preference
      const newPref = await db
        .insert(userPrefs)
        .values({
          email,
          timezone,
          phone,
          prefTime,
          description,
          createdAt: new Date(),
          updatedAt: new Date(),
        } satisfies InsertUserPref)
        .returning();

      return newPref[0];
    }
  } catch (error) {
    throw new Error(
      `Failed to upsert brief preference: ${error instanceof Error ? error.message : 'Unknown error'}`,
    );
  }
}
