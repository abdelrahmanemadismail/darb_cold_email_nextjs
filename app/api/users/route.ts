import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import Database from 'better-sqlite3';
import { isValidRole } from '@/lib/roles';
import { requirePermission, isErrorResponse } from '@/lib/api-auth';

const dbPath = process.env.NODE_ENV === 'production' ? './db.sqlite' : './db.sqlite';

export async function GET(request: NextRequest) {
  try {
    // Check permission to view users
    const auth = await requirePermission(request, 'user:view');
    if (isErrorResponse(auth)) {
      return auth;
    }

    // Get all users from database
    const db = new Database(dbPath);
    const stmt = db.prepare('SELECT id, name, email, role, createdAt FROM user ORDER BY createdAt DESC');
    const users = stmt.all();
    db.close();

    return NextResponse.json({ users });
  } catch (error) {
    console.error('Error fetching users:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    // Check permission to create users
    const authResult = await requirePermission(request, 'user:create');
    if (isErrorResponse(authResult)) {
      return authResult;
    }

    const { name, email, password, role } = await request.json();

    // Validate input
    if (!name || !email || !password) {
      return NextResponse.json(
        { error: 'Name, email, and password are required' },
        { status: 400 }
      );
    }

    if (!email.includes('@')) {
      return NextResponse.json(
        { error: 'Invalid email address' },
        { status: 400 }
      );
    }

    if (password.length < 8) {
      return NextResponse.json(
        { error: 'Password must be at least 8 characters long' },
        { status: 400 }
      );
    }

    // Validate role
    if (role && !isValidRole(role)) {
      return NextResponse.json(
        { error: 'Invalid role provided' },
        { status: 400 }
      );
    }

    const db = new Database(dbPath);

    // Check if email already exists
    const existingUser = db.prepare('SELECT id FROM user WHERE email = ?').get(email.trim().toLowerCase());
    if (existingUser) {
      db.close();
      return NextResponse.json(
        { error: 'A user with this email already exists' },
        { status: 409 }
      );
    }

    db.close();

    // Use better-auth's API to create the user with proper password hashing
    const createResult = await auth.api.signUpEmail({
      body: {
        name: name.trim(),
        email: email.trim().toLowerCase(),
        password: password,
      },
    });

    if (!createResult || !createResult.user) {
      return NextResponse.json(
        { error: 'Failed to create user' },
        { status: 500 }
      );
    }

    // Update user role if provided
    const userRole = role || 'viewer';
    const dbUpdate = new Database(dbPath);
    const updateStmt = dbUpdate.prepare('UPDATE user SET role = ? WHERE id = ?');
    updateStmt.run(userRole, createResult.user.id);

    // Get the updated user
    const createdUser = dbUpdate.prepare('SELECT id, name, email, role, createdAt FROM user WHERE id = ?').get(createResult.user.id);
    dbUpdate.close();

    return NextResponse.json({
      message: 'User created successfully',
      user: createdUser,
    }, { status: 201 });
  } catch (error) {
    console.error('Error creating user:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
