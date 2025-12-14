/**
 * Role-based access control utilities
 */

export type UserRole = 'admin' | 'editor' | 'viewer';

export const ROLES = {
  ADMIN: 'admin' as const,
  EDITOR: 'editor' as const,
  VIEWER: 'viewer' as const,
} as const;

export const ROLE_HIERARCHY = {
  admin: 3,
  editor: 2,
  viewer: 1,
} as const;

export const ROLE_LABELS = {
  admin: 'Admin',
  editor: 'Editor',
  viewer: 'Viewer',
} as const;

export const ROLE_DESCRIPTIONS = {
  admin: 'Full access to all features including user management and settings',
  editor: 'Can create, edit, and manage campaigns, scripts, and data',
  viewer: 'Read-only access to view data and analytics',
} as const;

/**
 * Permissions for each feature/action
 */
export const PERMISSIONS = {
  // Campaign permissions
  'campaign:view': ['admin', 'editor', 'viewer'],
  'campaign:create': ['admin', 'editor'],
  'campaign:edit': ['admin', 'editor'],
  'campaign:delete': ['admin', 'editor'],
  'campaign:start': ['admin', 'editor'],
  'campaign:stop': ['admin', 'editor'],

  // Script permissions
  'script:view': ['admin', 'editor', 'viewer'],
  'script:create': ['admin', 'editor'],
  'script:edit': ['admin', 'editor'],
  'script:delete': ['admin'],
  'script:run': ['admin', 'editor'],

  // Data permissions
  'data:view': ['admin', 'editor', 'viewer'],
  'data:create': ['admin', 'editor'],
  'data:edit': ['admin', 'editor'],
  'data:delete': ['admin', 'editor'],
  'data:import': ['admin', 'editor'],
  'data:export': ['admin', 'editor', 'viewer'],

  // Analytics permissions
  'analytics:view': ['admin', 'editor', 'viewer'],

  // Profile permissions
  'profile:view': ['admin', 'editor', 'viewer'], // View own profile
  'profile:edit': ['admin', 'editor', 'viewer'], // Edit own profile
  'profile:changePassword': ['admin', 'editor', 'viewer'], // Change own password

  // Settings permissions
  'settings:view': ['admin', 'editor', 'viewer'],
  'settings:edit': ['admin'],

  // User management permissions
  'user:view': ['admin'],
  'user:create': ['admin'],
  'user:edit': ['admin'],
  'user:delete': ['admin'],
  'user:changeRole': ['admin'],
} as const;

export type Permission = keyof typeof PERMISSIONS;

/**
 * Check if a role has a specific permission
 */
export function hasPermission(role: UserRole | undefined, permission: Permission): boolean {
  if (!role) return false;
  const allowedRoles = PERMISSIONS[permission] as readonly string[];
  return allowedRoles?.includes(role) ?? false;
}

/**
 * Check if a role is at least as high as another role
 */
export function hasRoleLevel(userRole: UserRole | undefined, requiredRole: UserRole): boolean {
  if (!userRole) return false;
  return ROLE_HIERARCHY[userRole] >= ROLE_HIERARCHY[requiredRole];
}

/**
 * Check if a role is higher than another role
 */
export function isHigherRole(userRole: UserRole | undefined, targetRole: UserRole): boolean {
  if (!userRole) return false;
  return ROLE_HIERARCHY[userRole] > ROLE_HIERARCHY[targetRole];
}

/**
 * Get all roles that are lower than the given role
 */
export function getLowerRoles(role: UserRole): UserRole[] {
  const level = ROLE_HIERARCHY[role];
  return Object.entries(ROLE_HIERARCHY)
    .filter(([, roleLevel]) => roleLevel < level)
    .map(([roleName]) => roleName as UserRole);
}

/**
 * Get all available roles
 */
export function getAllRoles(): UserRole[] {
  return Object.keys(ROLE_HIERARCHY) as UserRole[];
}

/**
 * Check if a value is a valid role
 */
export function isValidRole(role: string): role is UserRole {
  return role in ROLE_HIERARCHY;
}

/**
 * Get all permissions for a specific role
 */
export function getRolePermissions(role: UserRole): Permission[] {
  return Object.entries(PERMISSIONS)
    .filter(([, allowedRoles]) => (allowedRoles as readonly string[]).includes(role))
    .map(([permission]) => permission as Permission);
}

/**
 * Check if user can perform action on their own resource vs others'
 */
export function canAccessOwnResource(userRole: UserRole | undefined, resourceOwnerId: string, currentUserId: string): boolean {
  if (!userRole) return false;
  // Admins can access anything
  if (userRole === 'admin') return true;
  // Others can only access their own resources
  return resourceOwnerId === currentUserId;
}
