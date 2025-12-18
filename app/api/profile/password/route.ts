import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/db';
import crypto from 'crypto';
import { requireAuth, isErrorResponse } from '@/lib/api-auth';

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
    const accounts = await sql`SELECT password FROM "account" WHERE "userId" = ${user.id}`;

    if (accounts.length === 0 || !accounts[0].password) {
      return NextResponse.json(
        { error: 'Account not found or password not set' },
        { status: 404 }
      );
    }

    const account = accounts[0] as { password: string };

    // Verify current password
    const hashedCurrentPassword = hashPassword(currentPassword);
    if (account.password !== hashedCurrentPassword) {
      return NextResponse.json(
        { error: 'Current password is incorrect' },
        { status: 401 }
      );
    }

    // Update password
    const hashedNewPassword = hashPassword(newPassword);
    const updateResult = await sql`UPDATE "account" SET password = ${hashedNewPassword}, "updatedAt" = ${new Date()} WHERE "userId" = ${user.id}`;

    if (updateResult.count === 0) {
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
