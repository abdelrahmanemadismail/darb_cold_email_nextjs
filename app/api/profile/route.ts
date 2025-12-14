import { NextRequest, NextResponse } from 'next/server';
import Database from 'better-sqlite3';
import { requireAuth, isErrorResponse } from '@/lib/api-auth';

const dbPath = process.env.NODE_ENV === 'production' ? './db.sqlite' : './db.sqlite';

export async function GET(request: NextRequest) {
  try {
    // Require authentication
    const authResult = await requireAuth(request);
    if (isErrorResponse(authResult)) {
      return authResult;
    }
    const { user } = authResult;

    // Get user profile from database
    const db = new Database(dbPath);
    const stmt = db.prepare('SELECT id, name, email, role, image, createdAt, updatedAt FROM user WHERE id = ?');
    const profile = stmt.get(user.id);
    db.close();

    if (!profile) {
      return NextResponse.json(
        { error: 'Profile not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ profile });
  } catch (error) {
    console.error('Error fetching profile:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    // Require authentication
    const authResult = await requireAuth(request);
    if (isErrorResponse(authResult)) {
      return authResult;
    }
    const { user } = authResult;

    const { name, email } = await request.json();

    // Validate input
    if (!name || name.trim().length === 0) {
      return NextResponse.json(
        { error: 'Name is required' },
        { status: 400 }
      );
    }

    if (!email || !email.includes('@')) {
      return NextResponse.json(
        { error: 'Valid email is required' },
        { status: 400 }
      );
    }

    // Check if email is already in use by another user
    const db = new Database(dbPath);
    const existingUser = db.prepare('SELECT id FROM user WHERE email = ? AND id != ?').get(email, user.id);

    if (existingUser) {
      db.close();
      return NextResponse.json(
        { error: 'Email is already in use' },
        { status: 400 }
      );
    }

    // Update user profile in database
    const stmt = db.prepare('UPDATE user SET name = ?, email = ?, updatedAt = ? WHERE id = ?');
    const result = stmt.run(name.trim(), email.trim(), Date.now(), user.id);

    if (result.changes === 0) {
      db.close();
      return NextResponse.json(
        { error: 'Profile not found' },
        { status: 404 }
      );
    }

    // Get updated profile
    const updatedStmt = db.prepare('SELECT id, name, email, role, image, createdAt, updatedAt FROM user WHERE id = ?');
    const updatedProfile = updatedStmt.get(user.id);
    db.close();

    return NextResponse.json({
      message: 'Profile updated successfully',
      profile: updatedProfile,
    });
  } catch (error) {
    console.error('Error updating profile:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
