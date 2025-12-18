import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/db';
import { requireAuth, isErrorResponse } from '@/lib/api-auth';

export async function GET(request: NextRequest) {
  try {
    // Require authentication
    const authResult = await requireAuth(request);
    if (isErrorResponse(authResult)) {
      return authResult;
    }
    const { user } = authResult;

    // Get user profile from database
    const profiles = await sql`SELECT id, name, email, role, image, "createdAt", "updatedAt" FROM "user" WHERE id = ${user.id}`;

    if (profiles.length === 0) {
      return NextResponse.json(
        { error: 'Profile not found' },
        { status: 404 }
      );
    }

    const profile = profiles[0];

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
    const existingUsers = await sql`SELECT id FROM "user" WHERE email = ${email} AND id != ${user.id}`;

    if (existingUsers.length > 0) {
      return NextResponse.json(
        { error: 'Email is already in use' },
        { status: 400 }
      );
    }

    // Update user profile in database
    const updateResult = await sql`UPDATE "user" SET name = ${name.trim()}, email = ${email.trim()}, "updatedAt" = ${new Date()} WHERE id = ${user.id}`;

    if (updateResult.count === 0) {
      return NextResponse.json(
        { error: 'Profile not found' },
        { status: 404 }
      );
    }

    // Get updated profile
    const updatedProfiles = await sql`SELECT id, name, email, role, image, "createdAt", "updatedAt" FROM "user" WHERE id = ${user.id}`;
    const updatedProfile = updatedProfiles[0];

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
