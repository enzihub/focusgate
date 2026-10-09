import { eq } from 'drizzle-orm';
import { customers, InsertCustomer, SelectCustomer, users } from '@/db/schema';
import { db } from '@/db/db';
import { auth, currentUser } from '@clerk/nextjs/server';

/**
 * Retrieves an existing customer by email or creates a new one if none exists.
 * Ensures idempotency for customer records.
 *
 * @param {Object} params - Customer details
 * @param {string} params.email - Customer's email
 * @param {string} params.stripeCustomerId - Stripe Customer ID
 * @returns {Promise<SelectCustomer>} - The found or newly created customer
 */
export async function getOrCreateCustomer({
  email,
  stripeCustomerId,
}: {
  email: string;
  stripeCustomerId: string;
}): Promise<SelectCustomer> {
  try {
    // Attempt to find an existing customer by email
    const existingCustomer = await db
      .select()
      .from(customers)
      .where(eq(customers.email, email))
      .limit(1);

    if (existingCustomer.length > 0) {
      return existingCustomer[0];
    }

    // No existing customer found, create a new one
    try {
      const newCustomer = await db
        .insert(customers)
        .values({
          email,
          stripeCustomerId,
        } satisfies InsertCustomer)
        .returning();

      return newCustomer[0];
    } catch (error) {
      throw new Error(
        `Failed to create customer in database: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
    }
  } catch (error) {
    console.error('Error in getOrCreateCustomer:', error);
    throw error;
  }
}

/**
 * Fetches a customer by their email.
 *
 * @param {string} email - The email address of the customer
 * @returns {Promise<SelectCustomer | null>} - The customer object if found, otherwise null
 */
export async function getCustomerByEmail(
  email: string,
): Promise<SelectCustomer | null> {
  try {
    const customer = await db
      .select()
      .from(customers)
      .where(eq(customers.email, email))
      .limit(1);

    return customer[0] || null;
  } catch (error) {
    console.error('Error fetching customer by email:', error);
    return null;
  }
}

/**
 * Retrieves a Stripe Customer ID using the Clerk user ID.
 *
 * @param {string} clerkId - The Clerk user ID
 * @returns {Promise<string>} - The Stripe Customer ID
 * @throws {Error} - If no matching customer is found
 */
export const getCustomerIdByClerkId = async (
  clerkId: string,
): Promise<string> => {
  try {
    const customer = await db
      .select({
        stripeCustomerId: customers.stripeCustomerId,
      })
      .from(users)
      .innerJoin(customers, eq(users.id, customers.userId))
      .where(eq(users.clerkId, clerkId))
      .limit(1);

    if (!customer || customer.length === 0) {
      throw new Error('Customer not found');
    }

    return customer[0].stripeCustomerId;
  } catch (error) {
    console.error('Error getting customer ID:', error);
    throw error;
  }
};

/**
 * Upserts a customer by email: updates the record if it exists, otherwise creates a new one.
 * Ensures each user is correctly linked to a customer record.
 *
 * @param {Object} params - Customer details
 * @param {string} params.email - Customer's email
 * @param {string} params.stripeCustomerId - Stripe Customer ID
 * @returns {Promise<SelectCustomer>} - The updated or newly created customer
 * @throws {Error} - If user lookup fails or database operations encounter issues
 */
export async function upsertCustomer({
  email,
  stripeCustomerId,
}: {
  email: string;
  stripeCustomerId: string;
}): Promise<SelectCustomer> {
  try {
    // Fetch user by email
    const user = await db
      .select()
      .from(users)
      .where(eq(users.email, email))
      .limit(1);

    if (!user[0]) {
      throw new Error(`No user found with email: ${email}`);
    }

    const userId = user[0].id;

    // Check if customer already exists
    const existingCustomer = await db
      .select()
      .from(customers)
      .where(eq(customers.email, email))
      .limit(1);

    if (existingCustomer.length > 0) {
      // Update existing customer record
      const updatedCustomer = await db
        .update(customers)
        .set({
          stripeCustomerId,
          userId,
          updatedAt: new Date(),
        })
        .where(eq(customers.email, email))
        .returning();

      return updatedCustomer[0];
    }

    // No existing customer found, create a new one
    const newCustomer = await db
      .insert(customers)
      .values({
        email,
        stripeCustomerId,
        userId,
        createdAt: new Date(),
        updatedAt: new Date(),
      } satisfies InsertCustomer)
      .returning();

    return newCustomer[0];
  } catch (error) {
    console.error('Error in upsertCustomer:', error);
    throw new Error(
      `Failed to upsert customer: ${error instanceof Error ? error.message : 'Unknown error'}`,
    );
  }
}

export async function deleteCustomerById(stripeCustomerId: string) {
  try {
    await db
      .delete(customers)
      .where(eq(customers.stripeCustomerId, stripeCustomerId));

    return true;
  } catch (error) {
    console.error('Error deleting customer:', error);
    throw new Error(
      `Failed to delete customer: ${error instanceof Error ? error.message : 'Unknown error'}`,
    );
  }
}
