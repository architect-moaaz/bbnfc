# Role-Based Login Credentials

This document contains test user credentials for different roles in the NFC Business Card Platform.

## Test User Accounts

### 1. Regular User (Standard Access)
- **Email:** `user@test.com`
- **Password:** `password123`
- **Role:** `user`
- **Access:**
  - Standard user dashboard
  - Create/edit own profiles
  - View own analytics
  - Manage own cards

### 2. Admin User (Admin Access)
- **Email:** `admin@test.com`
- **Password:** `password123`
- **Role:** `admin`
- **Access:**
  - Admin dashboard
  - Manage all users
  - Manage all profiles
  - System-wide analytics
  - Template management

### 3. Organization Admin (Organization Management)
- **Email:** `orgadmin@test.com`
- **Password:** `password123`
- **Role:** `org_admin`
- **Access:**
  - Organization dashboard
  - Manage organization settings
  - Team member management
  - Organization analytics
  - Branding customization

### 4. Super Admin (Full Access)
- **Email:** `superadmin@test.com`
- **Password:** `password123`
- **Role:** `super_admin`
- **Access:**
  - Full system access
  - All admin capabilities
  - Organization management
  - System configuration

## How Role-Based Login Works

1. **Login Process:**
   - Users log in with their email and password at `/login`
   - Backend validates credentials and returns user data with role
   - Frontend stores JWT token and user information

2. **Role-Based Redirect:**
   - After login, users are automatically redirected based on their role:
     - `super_admin` & `admin` → `/admin` (Admin Dashboard)
     - `org_admin` → `/organization` (Organization Dashboard)
     - `user` → `/dashboard` (User Dashboard)

3. **Protected Routes:**
   - Routes are protected based on user authentication
   - Admin routes require `requireAdmin` flag
   - Organization routes are accessible to org_admin and higher

## Creating Additional Test Users

Run the following command to regenerate test users:

```bash
cd backend
node scripts/createTestUsers.js
```

This will:
- Delete existing test users with the above emails
- Create fresh test users with all roles
- Display login credentials

## Role Permissions Matrix

| Feature | User | Org Admin | Admin | Super Admin |
|---------|------|-----------|-------|-------------|
| Own Profiles | ✅ | ✅ | ✅ | ✅ |
| Own Analytics | ✅ | ✅ | ✅ | ✅ |
| Organization Dashboard | ❌ | ✅ | ✅ | ✅ |
| Team Management | ❌ | ✅ | ✅ | ✅ |
| All Users Management | ❌ | ❌ | ✅ | ✅ |
| System Analytics | ❌ | ❌ | ✅ | ✅ |
| Template Management | ❌ | ❌ | ✅ | ✅ |
| System Config | ❌ | ❌ | ❌ | ✅ |

## Notes

- All test users have email verification enabled (`isEmailVerified: true`)
- Password is the same for all test accounts: `password123`
- Roles are defined in the User model: `user`, `admin`, `org_admin`, `super_admin`
- Organization roles are separate: `member`, `admin`, `owner`
