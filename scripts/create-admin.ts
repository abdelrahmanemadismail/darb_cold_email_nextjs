/**
 * Script to create a new admin user
 * Run with: npm run create-admin
 */

import { auth } from "../lib/auth";
import Database from "better-sqlite3";
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
    const db = new Database('./db.sqlite');
    const existingUser = db.prepare('SELECT id FROM user WHERE email = ?').get(email.trim().toLowerCase());

    if (existingUser) {
      console.log('❌ A user with this email already exists');
      db.close();
      process.exit(1);
    }
    db.close();

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
    const dbUpdate = new Database('./db.sqlite');
    const updateStmt = dbUpdate.prepare('UPDATE user SET role = ? WHERE id = ?');
    updateStmt.run('admin', result.user.id);
    dbUpdate.close();

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
