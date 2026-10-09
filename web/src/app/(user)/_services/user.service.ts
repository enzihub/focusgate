'use server';

import { db } from '@/db/db';
import { SelectUser, users, InsertUser, UpsertUserInput } from '@/db/schema';
import { eq } from 'drizzle-orm';

export async function upsertUser(user: UpsertUserInput): Promise<SelectUser> {
  try {
    if (!user.primaryEmailAddress?.emailAddress) {
      throw new Error('Email address is required');
    }

    // First try to find existing user
    const existingUser = await db
      .select()
      .from(users)
      .where(eq(users.email, user.primaryEmailAddress.emailAddress))
      .limit(1);

    const userData = {
      clerkId: user.clerkId,
      fullName: user.fullName || null,
      email: user.primaryEmailAddress.emailAddress,
      avatarUrl: user.imageUrl || null,
      updatedAt: new Date(),
    } satisfies Partial<InsertUser>;

    if (existingUser.length === 0) {
      // Insert new user
      const newUser = await db
        .insert(users)
        .values({
          ...userData,
          createdAt: new Date(),
        })
        .returning();

      return newUser[0];
    } else {
      // Update existing user
      const updatedUser = await db
        .update(users)
        .set(userData)
        .where(eq(users.email, user.primaryEmailAddress.emailAddress))
        .returning();

      return updatedUser[0];
    }
  } catch (error) {
    throw new Error(
      `Failed to upsert User: ${error instanceof Error ? error.message : 'Unknown error'}`,
    );
  }
}

export async function getUserIdByClerkId(
  clerkId: string,
): Promise<string | null> {
  try {
    // Query the database to find a user by clerkId
    const user = await db
      .select()
      .from(users)
      .where(eq(users.clerkId, clerkId))
      .limit(1);
    // If a user is found, return the userId
    if (user.length > 0) {
      return user[0].id; // Return the userId (UUID)
    }
    // If no user is found, return null
    return null;
  } catch (error: any) {
    throw new Error(`Failed to get userId by clerkId: ${error.message}`);
  }
}

export async function getUserByClerkId(
  clerkId: string,
): Promise<SelectUser | null> {
  try {
    // Query the database to find a user by clerkId
    const user = await db
      .select()
      .from(users)
      .where(eq(users.clerkId, clerkId))
      .limit(1);
    // If a user is found, return the user
    if (user.length > 0) {
      return user[0];
    }
    // If no user is found, return null
    return null;
  } catch (error: any) {
    throw new Error(`Failed to get user by clerkId: ${error.message}`);
  }
}

export async function getOrCreateUser(email: string): Promise<SelectUser> {
  try {
    // First try to find existing user
    const existingUser = await db
      .select()
      .from(users)
      .where(eq(users.email, email))
      .limit(1);

    if (existingUser.length > 0) {
      return existingUser[0];
    }

    // If not found, create a new user
    const newUser = await db
      .insert(users)
      .values({
        email,
      })
      .returning();

    return newUser[0];
  } catch (error: any) {
    throw new Error(`Failed to get/create user: ${error.message}`);
  }
}

// export async function upsertUser(user: any) {
//   try {
//     const { data: userData } = await faunaClient.query(fql`
//       let users = Collection("Users")
//       let existingDoc = users.firstWhere(.email == ${user.primaryEmailAddress?.emailAddress!})

//       if (existingDoc == null) {
//         users.create({
//           userId: ${user.id},
//           fullName: ${user.fullName},
//           email: ${user.primaryEmailAddress?.emailAddress!},
//           avatarUrl: ${user.imageUrl},
//           createdAt: Time.now(),
//           updatedAt: Time.now()
//         })
//       } else {
//         existingDoc!.update({
//         userId: ${user.id},
//           fullName: ${user.fullName},
//           email: ${user.primaryEmailAddress?.emailAddress!},
//           avatarUrl: ${user.imageUrl},
//           updatedAt: Time.now()
//         })
//       }
//     `);

//     return docTo<UserI>(userData);
//   } catch (error: any) {
//     throw new Error(`Failed to upsert User: ${error.message}`);
//   }
// }
