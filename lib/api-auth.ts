/**
 * API Authentication and Authorization utilities
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { hasPermission, type Permission, type UserRole } from '@/lib/roles';
import type { ExtendedUser } from '@/types/auth';
import type { Session } from 'better-auth/types';

export interface AuthenticatedRequest {
  user: ExtendedUser;
  session: Session;
}

/**
 * Get authenticated user from request
 * Returns user if authenticated, or null if not
 */
export async function getAuthenticatedUser(
  request: NextRequest
): Promise<{ user: ExtendedUser; session: Session } | null> {
  try {
    const sessionData = await auth.api.getSession({ headers: request.headers });

    if (!sessionData?.user) {
      return null;
    }

    return {
      user: sessionData.user as ExtendedUser,
      session: sessionData.session
    };
  } catch (error) {
    console.error('Error getting authenticated user:', error);
    return null;
  }
}

/**
 * Require authentication
 * Returns user if authenticated, or error response
 */
export async function requireAuth(
  request: NextRequest
): Promise<{ user: ExtendedUser; session: Session } | NextResponse> {
  const auth = await getAuthenticatedUser(request);

  if (!auth) {
    return NextResponse.json(
      { error: 'Unauthorized: Authentication required' },
      { status: 401 }
    );
  }

  return auth;
}

/**
 * Require permission
 * Returns user if authorized, or error response
 */
export async function requirePermission(
  request: NextRequest,
  permission: Permission
): Promise<{ user: ExtendedUser; session: Session } | NextResponse> {
  const auth = await requireAuth(request);

  if (auth instanceof NextResponse) {
    return auth;
  }

  if (!hasPermission(auth.user.role, permission)) {
    const action = permission.replace(':', ' ');
    const userRole = auth.user.role || 'none';
    return NextResponse.json(
      {
        error: `Forbidden: You don't have permission to ${action}`,
        details: `Your role (${userRole}) does not allow this action`,
        requiredPermission: permission
      },
      { status: 403 }
    );
  }

  return auth;
}

/**
 * Require specific role
 * Returns user if has role, or error response
 */
export async function requireRole(
  request: NextRequest,
  role: UserRole
): Promise<{ user: ExtendedUser; session: Session } | NextResponse> {
  const auth = await requireAuth(request);

  if (auth instanceof NextResponse) {
    return auth;
  }

  if (auth.user.role !== role) {
    return NextResponse.json(
      { error: `Forbidden: ${role} role required` },
      { status: 403 }
    );
  }

  return auth;
}

/**
 * Check if response is an error
 */
export function isErrorResponse(result: unknown): result is NextResponse {
  return result instanceof NextResponse;
}

/**
 * Require admin role (convenience function)
 * Returns user if admin, or error response
 */
export async function requireAdmin(
  request: NextRequest
): Promise<{ user: ExtendedUser; session: Session } | NextResponse> {
  return requireRole(request, 'admin');
}

/**
 * Check if user can access their own resource
 * Returns true if user can access (admin or owns resource)
 */
export function canAccessResource(
  user: ExtendedUser,
  resourceOwnerId: string
): boolean {
  return user.role === 'admin' || user.id === resourceOwnerId;
}
