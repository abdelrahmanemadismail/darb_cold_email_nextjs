/**
 * Permission Guard Component
 * Renders children only if user has the required permission
 */
import { ReactNode } from 'react';
import { usePermissions } from '@/hooks/usePermissions';
import { type Permission, type UserRole } from '@/lib/roles';

interface PermissionGuardProps {
  children: ReactNode;
  permission?: Permission;
  role?: UserRole;
  fallback?: ReactNode;
}

export function PermissionGuard({
  children,
  permission,
  role,
  fallback = null
}: PermissionGuardProps) {
  const { can, hasRole } = usePermissions();

  // Check permission if provided
  if (permission && !can(permission)) {
    return <>{fallback}</>;
  }

  // Check role if provided
  if (role && !hasRole(role)) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
}

/**
 * Hook to conditionally render based on permissions
 */
export function usePermissionGuard() {
  const { can, hasRole } = usePermissions();

  const canRender = (permission?: Permission, role?: UserRole): boolean => {
    if (permission && !can(permission)) {
      return false;
    }
    if (role && !hasRole(role)) {
      return false;
    }
    return true;
  };

  return { canRender };
}
