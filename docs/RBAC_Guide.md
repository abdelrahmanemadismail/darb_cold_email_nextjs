# Role-Based Access Control (RBAC) System

This application implements a comprehensive role-based access control system with three roles: **Admin**, **Editor**, and **Viewer**.

## Roles Overview

### Admin
- **Full system access**
- Can manage users and roles
- Can modify all settings
- Can create, edit, and delete all content
- Can run and manage scripts
- Access to all analytics and data

### Editor
- **Content management access**
- Can create and edit campaigns
- Can create, edit, and run scripts
- Can manage data (create, edit, import/export)
- View analytics
- **Cannot** manage users or modify system settings

### Viewer
- **Read-only access**
- Can view campaigns, scripts, and data
- Can view analytics
- Can export data
- **Cannot** create, edit, or delete content
- **Cannot** run scripts or manage settings

## Implementation Guide

### 1. Using the `usePermissions` Hook

```tsx
import { usePermissions } from '@/hooks/usePermissions';

function MyComponent() {
  const { can, hasRole, isAdmin, isEditor, isViewer, isAuthenticated, role } = usePermissions();

  // Check specific permission
  if (can('campaign:create')) {
    // Show create button
  }

  // Check role level
  if (hasRole('editor')) {
    // User is editor or admin
  }

  // Quick role checks
  if (isAdmin()) {
    // Admin-only content
  }

  if (isEditor()) {
    // Editor or admin content
  }

  if (isViewer()) {
    // Any authenticated user
  }

  if (isAuthenticated()) {
    // User is logged in
  }

  return <div>Current role: {role}</div>;
}
```

### 2. Using the `PermissionGuard` Component

```tsx
import { PermissionGuard } from '@/components/shared/PermissionGuard';

function MyPage() {
  return (
    <div>
      {/* Permission-based rendering */}
      <PermissionGuard permission="campaign:create">
        <Button>Create Campaign</Button>
      </PermissionGuard>

      {/* Role-based rendering */}
      <PermissionGuard role="admin">
        <SettingsPanel />
      </PermissionGuard>

      {/* With fallback */}
      <PermissionGuard
        permission="campaign:edit"
        fallback={<p>You don't have permission to edit</p>}
      >
        <EditForm />
      </PermissionGuard>
    </div>
  );
}
```

### 3. Using Role Badge

```tsx
import { RoleBadge } from '@/components/shared/RoleBadge';

function UserCard({ user }) {
  return (
    <div>
      <h3>{user.name}</h3>
      <RoleBadge role={user.role} showIcon />
    </div>
  );
}
```

### 4. Permission Utilities

```typescript
import {
  hasPermission,
  hasRoleLevel,
  getRolePermissions,
  canAccessOwnResource
} from '@/lib/roles';

// Check if a role has permission
if (hasPermission('editor', 'campaign:create')) {
  // Allow action
}

// Check role hierarchy
if (hasRoleLevel('editor', 'viewer')) {
  // Editor has at least viewer level
}

// Get all permissions for a role
const editorPermissions = getRolePermissions('editor');

// Check resource ownership
if (canAccessOwnResource(userRole, resourceOwnerId, currentUserId)) {
  // User can access this resource
}
```

## Available Permissions

### Campaign Permissions
- `campaign:view` - View campaigns (all roles)
- `campaign:create` - Create campaigns (admin, editor)
- `campaign:edit` - Edit campaigns (admin, editor)
- `campaign:delete` - Delete campaigns (admin, editor)
- `campaign:start` - Start campaigns (admin, editor)
- `campaign:stop` - Stop campaigns (admin, editor)

### Script Permissions
- `script:view` - View scripts (all roles)
- `script:create` - Create scripts (admin, editor)
- `script:edit` - Edit scripts (admin, editor)
- `script:delete` - Delete scripts (admin only)
- `script:run` - Run scripts (admin, editor)

### Data Permissions
- `data:view` - View data (all roles)
- `data:create` - Create data (admin, editor)
- `data:edit` - Edit data (admin, editor)
- `data:delete` - Delete data (admin, editor)
- `data:import` - Import data (admin, editor)
- `data:export` - Export data (all roles)

### Analytics Permissions
- `analytics:view` - View analytics (all roles)

### Profile Permissions
- `profile:view` - View own profile (all roles)
- `profile:edit` - Edit own profile (all roles)
- `profile:changePassword` - Change own password (all roles)

### Settings Permissions
- `settings:view` - View settings (all roles)
- `settings:edit` - Edit settings (admin only)

### User Management Permissions
- `user:view` - View users (admin only)
- `user:create` - Create users (admin only)
- `user:edit` - Edit users (admin only)
- `user:delete` - Delete users (admin only)
- `user:changeRole` - Change user roles (admin only)

## API Routes

### Get All Users (Admin Only)
```
GET /api/users
```

### Get User by ID (Admin Only)
```
GET /api/users/[userId]
```

### Update User Role (Admin Only)
```
PATCH /api/users/[userId]
Body: { "role": "editor" }
```

## Proxy-Based Route Protection

The application uses a proxy configuration ([proxy.ts](../proxy.ts)) for route protection:

### Route Protection Levels

1. **Public Routes** (no authentication required):
   - `/login` - Login page only
   - ❌ `/register` - Registration disabled (admin creates users)

2. **Protected Routes** (authentication required):
   - All `/dashboard/*` routes
   - Automatically redirects to login with return URL

3. **Admin-Only Routes** (admin role required):
   - `/dashboard/settings` - Settings & user management
   - Non-admins are redirected to dashboard with error

### User Registration Policy

**Public registration is disabled.** Only administrators can create new user accounts:

- Admins create users via Settings page (`/dashboard/settings`)
- Or via API: `POST /api/users` (admin permission required)
- Or via CLI script: `node scripts/create-admin.mjs`

### How It Works

```typescript
// proxy.ts automatically:
// 1. Checks session cookie for authentication
// 2. Redirects unauthenticated users to login
// 3. Validates admin role via better-auth for admin routes
// 4. Redirects non-admins from admin-only routes
// 5. Prevents access to auth pages when logged in
```

### Adding Protected Routes

To protect a new route pattern, update the proxy configuration:

```typescript
// In proxy.ts
const publicPaths = ['/login']; // Only login is public
const adminOnlyRoutes = ['/dashboard/settings', '/admin'];
```

## Managing Users and Roles

### Creating New Users

**Public registration is disabled.** Administrators can create new users in three ways:

#### 1. Via Settings Page (Recommended)
1. Navigate to **Dashboard → Settings**
2. Go to the **Users & Roles** tab
3. Click **Add User**
4. Fill in name, email, password, and assign a role
5. User can immediately log in with their credentials

#### 2. Via API
```bash
POST /api/users
Authorization: Admin only
Body: { "name": "...", "email": "...", "password": "...", "role": "..." }
```

#### 3. Via CLI Script
```bash
node scripts/create-admin.mjs
```

### Changing User Roles

Administrators can update user roles from the Settings page:

1. Navigate to **Dashboard → Settings**
2. Go to the **Users & Roles** tab
3. Click **Edit Role** next to a user
4. Select the new role from the dropdown
5. The change takes effect immediately

**Note:** Admins cannot change their own role to prevent lockout.

## Database Schema

The user table includes a `role` field:

```sql
CREATE TABLE user (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  role TEXT DEFAULT 'viewer',
  ...
);
```

Default role for new users is **viewer**.

## Security Best Practices

1. **Always check permissions server-side** - Client-side checks are for UX only
2. **Verify role in API routes** - Use `session.user.role` to check permissions
3. **Log role changes** - Track who changes roles and when
4. **Regular audits** - Review user roles periodically
5. **Principle of least privilege** - Grant minimum necessary permissions

## Example: Protected API Route

### Basic Permission Check
```typescript
import { requirePermission, isErrorResponse } from '@/lib/api-auth';

export async function POST(request: NextRequest) {
  // Require specific permission
  const auth = await requirePermission(request, 'campaign:create');
  if (isErrorResponse(auth)) {
    return auth; // Returns 401 or 403 with detailed error
  }

  const { user } = auth;
  // Process request...
}
```

### Admin-Only Route
```typescript
import { requireAdmin, isErrorResponse } from '@/lib/api-auth';

export async function POST(request: NextRequest) {
  const auth = await requireAdmin(request);
  if (isErrorResponse(auth)) {
    return auth;
  }

  // Admin-only logic...
}
```

### Resource Ownership Check
```typescript
import { requireAuth, isErrorResponse, canAccessResource } from '@/lib/api-auth';

export async function GET(request: NextRequest, { params }) {
  const auth = await requireAuth(request);
  if (isErrorResponse(auth)) {
    return auth;
  }

  const { user } = auth;
  const resourceOwnerId = params.userId;

  if (!canAccessResource(user, resourceOwnerId)) {
    return NextResponse.json(
      { error: 'Forbidden: Cannot access other users\' resources' },
      { status: 403 }
    );
  }

  // Process request...
}
```

## Troubleshooting

### Role not updating in UI
- Clear browser cache and cookies
- Sign out and sign in again
- Check if database was updated correctly

### Permission denied errors
- Verify the user has the correct role assigned
- Check if the permission is defined in `PERMISSIONS` object
- Ensure API routes are checking permissions correctly

### Settings page not accessible
- Only admins can access the Settings page
- Check user role in database: `SELECT role FROM user WHERE email = 'your@email.com'`
- Update role if needed: `UPDATE user SET role = 'admin' WHERE email = 'your@email.com'`
