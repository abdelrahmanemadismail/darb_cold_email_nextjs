# User Profile and Account Settings

Two new pages have been added for user-specific profile and account management.

## Pages Overview

### 1. Profile Page (`/dashboard/profile`)
A read-only view of the user's profile with edit capabilities:

**Features:**
- View profile picture and basic information
- Edit name and email
- Display user role with badge
- Show account creation date
- Account activity statistics (campaigns, scripts, contacts)

**Access:** All authenticated users

### 2. Account Settings Page (`/dashboard/account`)
Comprehensive account management interface with multiple tabs:

**Tabs:**

#### Profile Tab
- Upload/change profile picture
- Update name and email
- Real-time form validation

#### Security Tab
- Change password with validation
  - Minimum 8 characters required
  - Current password verification
- Two-factor authentication setup (placeholder for future implementation)

#### Notifications Tab
- Email notification preferences:
  - Campaign updates
  - Script completion notifications
  - Weekly summary emails
- Toggle preferences on/off

#### Appearance Tab
- Theme selection (Light/Dark mode)
- Interface customization options:
  - Compact mode toggle
  - Animation preferences

**Access:** All authenticated users

## Navigation

Access these pages from the user dropdown menu in the top bar:
1. Click on your avatar/name in the top right
2. Select "Profile" or "Account Settings"

## API Endpoints

### Profile Management

#### Get Profile
```
GET /api/profile
Returns current user's profile information
```

#### Update Profile
```
PATCH /api/profile
Body: { "name": "string", "email": "string" }
Updates user's name and email
```

#### Change Password
```
POST /api/profile/password
Body: { "currentPassword": "string", "newPassword": "string" }
Changes user's password with verification
```

## Features

### Profile Page
✓ View personal information
✓ Edit profile inline
✓ Role badge display
✓ Activity statistics
✓ Responsive design

### Account Settings
✓ Multi-tab interface
✓ Profile picture upload (UI ready, backend TBD)
✓ Real-time form validation
✓ Password change with security checks
✓ Notification preferences
✓ Theme switching
✓ Success/error messages
✓ Loading states

## Security

- All endpoints require authentication
- Users can only modify their own profile
- Email uniqueness is enforced
- Password requirements:
  - Minimum 8 characters
  - Current password verification required
- Passwords are hashed using SHA-256

## Future Enhancements

1. **Profile Picture Upload**
   - Implement file upload to cloud storage
   - Image cropping/resizing
   - Format validation

2. **Two-Factor Authentication**
   - TOTP setup and verification
   - Backup codes generation
   - Recovery options

3. **Notification System**
   - Actual email sending integration
   - In-app notification preferences
   - Push notification support

4. **Activity Tracking**
   - Real campaign statistics
   - Script execution history
   - Data collection metrics

5. **Session Management**
   - View active sessions
   - Remote logout capability
   - Device tracking

## Usage Examples

### Accessing Profile Page
```typescript
// From TopBar dropdown or direct navigation
router.push('/dashboard/profile');
```

### Accessing Account Settings
```typescript
// From TopBar dropdown or direct navigation
router.push('/dashboard/account');
```

### Updating Profile Programmatically
```typescript
const response = await fetch('/api/profile', {
  method: 'PATCH',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    name: 'New Name',
    email: 'new@email.com'
  })
});
```

### Changing Password
```typescript
const response = await fetch('/api/profile/password', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    currentPassword: 'current123',
    newPassword: 'newSecure456'
  })
});
```

## Error Handling

Both pages include comprehensive error handling:
- Network errors are caught and displayed
- Validation errors show specific messages
- Loading states prevent duplicate submissions
- Success messages confirm operations

## Responsive Design

Both pages are fully responsive:
- Mobile-friendly layouts
- Adaptive grid systems
- Touch-optimized controls
- Proper spacing on all screen sizes
