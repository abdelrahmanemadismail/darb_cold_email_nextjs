/**
 * Custom hook for checking user permissions
 */
import { useSession } from '@/lib/auth-client';
import { hasPermission, hasRoleLevel, type Permission, type UserRole } from '@/lib/roles';
import type { ExtendedUser } from '@/types/auth';

export function usePermissions() {
  const { data: session } = useSession();
  const userRole = (session?.user as ExtendedUser | undefined)?.role;

  /**
   * Check if the current user has a specific permission
   */
  const can = (permission: Permission): boolean => {
    return hasPermission(userRole, permission);
  };

  /**
   * Check if the current user has at least the specified role level
   */
  const hasRole = (requiredRole: UserRole): boolean => {
    return hasRoleLevel(userRole, requiredRole);
  };

  /**
   * Check if the current user is an admin
   */
  const isAdmin = (): boolean => {
    return userRole === 'admin';
  };

  /**
   * Check if the current user is an editor or higher
   */
  const isEditor = (): boolean => {
    return hasRole('editor');
  };

  /**
   * Check if the current user is a viewer or higher
   */
  const isViewer = (): boolean => {
    return hasRole('viewer');
  };

  /**
   * Check if user is authenticated
   */
  const isAuthenticated = (): boolean => {
    return !!userRole;
  };

  return {
    role: userRole,
    can,
    hasRole,
    isAdmin,
    isEditor,
    isViewer,
    isAuthenticated,
  };
}
