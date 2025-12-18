import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/db';
import { isValidRole } from '@/lib/roles';
import { requirePermission, isErrorResponse } from '@/lib/api-auth';

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    // Await params (Next.js 15 requirement)
    const { userId } = await params;

    // Check permission to change user roles
    const auth = await requirePermission(request, 'user:changeRole');
    if (isErrorResponse(auth)) {
      return auth;
    }
    const { user } = auth;

    const { role } = await request.json();

    // Validate role
    if (!role || !isValidRole(role)) {
      return NextResponse.json(
        { error: 'Invalid role provided' },
        { status: 400 }
      );
    }

    // Prevent admin from changing their own role
    if (userId === user.id) {
      return NextResponse.json(
        { error: 'Cannot change your own role' },
        { status: 400 }
      );
    }

    // Update user role in database
    const updateResult = await sql`UPDATE "user" SET role = ${role}, "updatedAt" = ${new Date()} WHERE id = ${userId}`;

    if (updateResult.count === 0) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Get updated user
    const users = await sql`SELECT id, name, email, role FROM "user" WHERE id = ${userId}`;
    const updatedUser = users[0];

    return NextResponse.json({
      message: 'User role updated successfully',
      user: updatedUser,
    });
  } catch (error) {
    console.error('Error updating user role:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    // Await params (Next.js 15 requirement)
    const { userId } = await params;

    // Check permission to view user details
    const auth = await requirePermission(request, 'user:view');
    if (isErrorResponse(auth)) {
      return auth;
    }

    // Get user from database
    const users = await sql`SELECT id, name, email, role, "createdAt" FROM "user" WHERE id = ${userId}`;

    if (users.length === 0) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    const user = users[0];

    return NextResponse.json({ user });
  } catch (error) {
    console.error('Error fetching user:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    // Await params (Next.js 15 requirement)
    const { userId } = await params;

    // Check permission to delete users
    const auth = await requirePermission(request, 'user:delete');
    if (isErrorResponse(auth)) {
      return auth;
    }
    const { user } = auth;

    // Prevent admin from deleting themselves
    if (userId === user.id) {
      return NextResponse.json(
        { error: 'Cannot delete your own account' },
        { status: 400 }
      );
    }

    // Delete user from database (cascade will delete related records)
    const deleteResult = await sql`DELETE FROM "user" WHERE id = ${userId}`;

    if (deleteResult.count === 0) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      message: 'User deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting user:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
