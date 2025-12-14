/**
 * Script to change a user's password
 * Run with: npm run change-password
 */

import { auth } from "../lib/auth";
import Database from "better-sqlite3";
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

    const db = new Database('./db.sqlite');

    // Get user email
    const email = await question('Enter user email: ');
    if (!email.trim() || !email.includes('@')) {
      console.log('❌ Valid email is required');
      db.close();
      rl.close();
      process.exit(1);
    }

    // Check if user exists
    const user = db.prepare('SELECT id, name, email, role FROM user WHERE email = ?').get(email.trim().toLowerCase()) as { id: string; name: string; email: string; role: string } | undefined;

    if (!user) {
      console.log('❌ User not found');
      db.close();
      rl.close();
      process.exit(1);
    }

    console.log(`\nFound user: ${user.name} (${user.email})\n`);

    // Get new password
    const password = await question('Enter new password (min 8 characters): ');
    if (!password || password.length < 8) {
      console.log('❌ Password must be at least 8 characters long');
      db.close();
      rl.close();
      process.exit(1);
    }

    const confirmPassword = await question('Confirm new password: ');
    if (password !== confirmPassword) {
      console.log('❌ Passwords do not match');
      db.close();
      rl.close();
      process.exit(1);
    }

    rl.close();

    console.log('\n⏳ Updating password...\n');

    // Delete existing account
    const deleteStmt = db.prepare(`DELETE FROM account WHERE userId = ? AND providerId = 'credential'`);
    deleteStmt.run(user.id);
    db.close();

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
    const dbUpdate = new Database('./db.sqlite');
    const tempAccount = dbUpdate.prepare('SELECT password FROM account WHERE userId = ?').get(tempResult.user.id) as { password: string } | undefined;

    if (!tempAccount) {
      console.log('❌ Failed to retrieve hashed password');
      dbUpdate.close();
      process.exit(1);
    }

    // Create new account with the hashed password for the actual user
    const accountId = crypto.randomBytes(16).toString('hex');
    const now = Date.now();
    const insertAccount = dbUpdate.prepare(`
      INSERT INTO account (id, accountId, providerId, userId, password, createdAt, updatedAt)
      VALUES (?, ?, 'credential', ?, ?, ?, ?)
    `);
    insertAccount.run(accountId, user.email, user.id, tempAccount.password, now, now);

    // Clean up temp user
    dbUpdate.prepare('DELETE FROM account WHERE userId = ?').run(tempResult.user.id);
    dbUpdate.prepare('DELETE FROM user WHERE id = ?').run(tempResult.user.id);

    dbUpdate.close();

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
