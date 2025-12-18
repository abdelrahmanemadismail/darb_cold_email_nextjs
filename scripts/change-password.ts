/**
 * Script to change a user's password
 * Run with: npm run change-password
 */

// Load environment variables FIRST before any imports that use them
import { config } from "dotenv";
config({ path: '.env.local' });

import { auth } from "../lib/auth";
import { sql } from "../db";
import * as readline from "readline";
import crypto from "crypto";

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

function question(query: string): Promise<string> {
  return new Promise((resolve) => rl.question(query, resolve));
}

async function changePassword() {
  try {
    console.log('🔑 Change User Password\n');

    // Get user email
    const email = await question('Enter user email: ');
    if (!email.trim() || !email.includes('@')) {
      console.log('❌ Valid email is required');
      rl.close();
      process.exit(1);
    }

    // Check if user exists
    const users = await sql`SELECT id, name, email, role FROM "user" WHERE email = ${email.trim().toLowerCase()}`;

    if (users.length === 0) {
      console.log('❌ User not found');
      rl.close();
      process.exit(1);
    }

    const user = users[0] as { id: string; name: string; email: string; role: string };

    console.log(`\nFound user: ${user.name} (${user.email})\n`);

    // Get new password
    const password = await question('Enter new password (min 8 characters): ');
    if (!password || password.length < 8) {
      console.log('❌ Password must be at least 8 characters long');
      rl.close();
      process.exit(1);
    }

    const confirmPassword = await question('Confirm new password: ');
    if (password !== confirmPassword) {
      console.log('❌ Passwords do not match');
      rl.close();
      process.exit(1);
    }

    rl.close();

    console.log('\n⏳ Updating password...\n');

    // Delete existing account
    await sql`DELETE FROM "account" WHERE "userId" = ${user.id} AND "providerId" = ${'credential'}`;

    // Use better-auth to create new account with properly hashed password
    // We create a temporary user signup, then transfer the password hash
    const tempEmail = `temp_${crypto.randomBytes(8).toString('hex')}@temp.local`;
    const tempResult = await auth.api.signUpEmail({
      body: {
        name: "Temp User",
        email: tempEmail,
        password: password,
      },
    });

    if (!tempResult || !tempResult.user) {
      console.log('❌ Failed to hash password');
      process.exit(1);
    }

    // Get the hashed password from the temp account
    const tempAccounts = await sql`SELECT password FROM "account" WHERE "userId" = ${tempResult.user.id}`;

    if (tempAccounts.length === 0) {
      console.log('❌ Failed to retrieve hashed password');
      process.exit(1);
    }

    const tempAccount = tempAccounts[0] as { password: string };

    // Create new account with the hashed password for the actual user
    const accountId = crypto.randomBytes(16).toString('hex');
    const now = new Date();
    await sql`INSERT INTO "account" (id, "accountId", "providerId", "userId", password, "createdAt", "updatedAt") VALUES (${accountId}, ${user.email}, ${'credential'}, ${user.id}, ${tempAccount.password}, ${now}, ${now})`;

    // Clean up temp user
    await sql`DELETE FROM "account" WHERE "userId" = ${tempResult.user.id}`;
    await sql`DELETE FROM "user" WHERE id = ${tempResult.user.id}`;

    console.log('✅ Password updated successfully!\n');
    console.log(`User ${user.name} (${user.email}) can now login with the new password.\n`);

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error instanceof Error ? error.message : 'Unknown error');
    rl.close();
    process.exit(1);
  }
}

changePassword();
