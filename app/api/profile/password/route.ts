import { NextRequest, NextResponse } from 'next/server';
import Database from 'better-sqlite3';
import crypto from 'crypto';
import { requireAuth, isErrorResponse } from '@/lib/api-auth';

const dbPath = process.env.NODE_ENV === 'production' ? './db.sqlite' : './db.sqlite';

function hashPassword(password: string): string {
  return crypto.createHash('sha256').update(password).digest('hex');
}

export async function POST(request: NextRequest) {
  try {
    // Require authentication
    const authResult = await requireAuth(request);
    if (isErrorResponse(authResult)) {
      return authResult;
    }
    const { user } = authResult;

    const { currentPassword, newPassword } = await request.json();

    // Validate input
    if (!currentPassword || !newPassword) {
      return NextResponse.json(
        { error: 'Current and new password are required' },
        { status: 400 }
      );
    }

    if (newPassword.length < 8) {
      return NextResponse.json(
        { error: 'New password must be at least 8 characters long' },
        { status: 400 }
      );
    }

    // Get user's current password from database
    const db = new Database(dbPath);
    const accountStmt = db.prepare('SELECT password FROM account WHERE userId = ?');
    const account = accountStmt.get(user.id) as { password: string } | undefined;

    if (!account || !account.password) {
      db.close();
      return NextResponse.json(
        { error: 'Account not found or password not set' },
        { status: 404 }
      );
    }

    // Verify current password
    const hashedCurrentPassword = hashPassword(currentPassword);
    if (account.password !== hashedCurrentPassword) {
      db.close();
      return NextResponse.json(
        { error: 'Current password is incorrect' },
        { status: 401 }
      );
    }

    // Update password
    const hashedNewPassword = hashPassword(newPassword);
    const updateStmt = db.prepare('UPDATE account SET password = ?, updatedAt = ? WHERE userId = ?');
    const result = updateStmt.run(hashedNewPassword, Date.now(), user.id);

    db.close();

    if (result.changes === 0) {
      return NextResponse.json(
        { error: 'Failed to update password' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      message: 'Password changed successfully',
    });
  } catch (error) {
    console.error('Error changing password:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
