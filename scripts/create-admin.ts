/**
 * Script to create a new admin user
 * Run with: npm run create-admin
 */

// Load environment variables FIRST before any imports that use them
import { config } from "dotenv";
config({ path: '.env.local' });

import { auth } from "../lib/auth";
import { sql } from "../db";
import * as readline from "readline";

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

function question(query: string): Promise<string> {
  return new Promise((resolve) => rl.question(query, resolve));
}

async function createAdminUser() {
  try {
    console.log('🔧 Create New Admin User\n');

    // Get user details
    const name = await question('Enter name: ');
    if (!name.trim()) {
      console.log('❌ Name is required');
      rl.close();
      process.exit(1);
    }

    const email = await question('Enter email: ');
    if (!email.trim() || !email.includes('@')) {
      console.log('❌ Valid email is required');
      rl.close();
      process.exit(1);
    }

    const password = await question('Enter password (min 8 characters): ');
    if (!password || password.length < 8) {
      console.log('❌ Password must be at least 8 characters long');
      rl.close();
      process.exit(1);
    }

    const confirmPassword = await question('Confirm password: ');
    if (password !== confirmPassword) {
      console.log('❌ Passwords do not match');
      rl.close();
      process.exit(1);
    }

    rl.close();

    // Check if user already exists
    const existingUsers = await sql`SELECT id FROM "user" WHERE email = ${email.trim().toLowerCase()}`;

    if (existingUsers.length > 0) {
      console.log('❌ A user with this email already exists');
      process.exit(1);
    }

    console.log('\n⏳ Creating admin user...\n');

    // Use better-auth API to create the user
    const result = await auth.api.signUpEmail({
      body: {
        name: name.trim(),
        email: email.trim().toLowerCase(),
        password: password,
      },
    });

    if (!result || !result.user) {
      throw new Error('Failed to create user');
    }

    // Update user role to admin
    await sql`UPDATE "user" SET role = ${'admin'} WHERE id = ${result.user.id}`;

    console.log(`✅ Successfully created admin user!\n`);
    console.log(`User Details:`);
    console.log(`  Name: ${name.trim()}`);
    console.log(`  Email: ${email.trim().toLowerCase()}`);
    console.log(`  Role: admin\n`);
    console.log('The user can now:');
    console.log('  • Login with the provided credentials');
    console.log('  • Access the Settings page');
    console.log('  • Manage other users and their roles');
    console.log('  • Have full system access\n');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error instanceof Error ? error.message : 'Unknown error');
    rl.close();
    process.exit(1);
  }
}

createAdminUser();
