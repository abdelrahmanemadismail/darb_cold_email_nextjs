import { NextRequest, NextResponse } from 'next/server';
import Database from 'better-sqlite3';
import { isValidRole } from '@/lib/roles';
import { requirePermission, isErrorResponse } from '@/lib/api-auth';

const dbPath = process.env.NODE_ENV === 'production' ? './db.sqlite' : './db.sqlite';

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
    const db = new Database(dbPath);
    const stmt = db.prepare('UPDATE user SET role = ?, updatedAt = ? WHERE id = ?');
    const result = stmt.run(role, Date.now(), userId);

    if (result.changes === 0) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Get updated user
    const userStmt = db.prepare('SELECT id, name, email, role FROM user WHERE id = ?');
    const updatedUser = userStmt.get(userId);

    db.close();

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
    const db = new Database(dbPath);
    const stmt = db.prepare('SELECT id, name, email, role, createdAt FROM user WHERE id = ?');
    const user = stmt.get(userId);
    db.close();

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

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
    const db = new Database(dbPath);
    const stmt = db.prepare('DELETE FROM user WHERE id = ?');
    const result = stmt.run(userId);
    db.close();

    if (result.changes === 0) {
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
