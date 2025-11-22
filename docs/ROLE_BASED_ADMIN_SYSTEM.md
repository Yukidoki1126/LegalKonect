# Role-Based Admin System Documentation

## Overview

LegalKonect now uses a unified role-based authentication system instead of separate user and admin tables. This provides better flexibility, easier user management, and cleaner code.

## User Roles

### Available Roles

| Role | Constant | Description | Access Level |
|------|----------|-------------|--------------|
| **Super Admin** | `ROLE_SUPER_ADMIN` | Full system control | Can manage admins, all features |
| **Admin** | `ROLE_ADMIN` | Manage users and lawyers | Can manage lawyers, users, view analytics |
| **Lawyer** | `ROLE_LAWYER` | Legal professional | Access to lawyer features (cases, appointments) |
| **Client** | `ROLE_CLIENT` | Regular user | Book appointments, view cases |

### Role Hierarchy

```
Super Admin (highest)
    ↓
  Admin
    ↓
 Lawyer
    ↓
 Client (lowest)
```

## Database Changes

### Users Table - New Columns

```sql
role ENUM('client', 'lawyer', 'admin', 'super_admin') DEFAULT 'client'
last_login_at TIMESTAMP NULL
```

### Migration Summary

1. **Add role column** - Added `role` enum field to users table
2. **Migrate admins** - Moved existing admins to users table with `super_admin` role
3. **Update lawyers** - Set role to `lawyer` for all users with lawyer profiles

## Default Credentials

After running migrations and seeders:

```
Email: admin@legalkonect.com
Password: admin123
Role: super_admin
```

**⚠️ IMPORTANT: Change this password immediately after first login!**

## Usage Examples

### Backend (PHP/Laravel)

#### User Model Methods

```php
// Check roles
$user->isSuperAdmin();  // Returns true if super admin
$user->isAdmin();       // Returns true if admin or super admin
$user->isClient();      // Returns true if client
$user->isLawyer();      // Returns true if lawyer (checks lawyer relationship)

// Check specific role
$user->hasRole('admin');  // Check for exact role match

// Check multiple roles
$user->hasAnyRole(['admin', 'super_admin']);

// Permission checks
$user->canManageLawyers();  // Admin and Super Admin
$user->canManageAdmins();   // Super Admin only
$user->canManageUsers();    // Admin and Super Admin
$user->canViewAnalytics();  // Admin and Super Admin
```

#### Middleware Usage

```php
// routes/api.php

// Single role
Route::middleware(['auth:sanctum', 'role:super_admin'])->group(function() {
    Route::post('/admin/create', [AdminController::class, 'store']);
});

// Multiple roles (any of them)
Route::middleware(['auth:sanctum', 'role:admin,super_admin'])->group(function() {
    Route::get('/lawyers/verify', [LawyerController::class, 'verify']);
    Route::get('/analytics', [AnalyticsController::class, 'index']);
});

// Using specific middleware
Route::middleware(['auth:sanctum', 'superadmin'])->group(function() {
    // Only super admins
});

Route::middleware(['auth:sanctum', 'isadmin'])->group(function() {
    // Admins and super admins
});
```

#### Controller Examples

```php
class LawyerController extends Controller
{
    public function verify(Request $request)
    {
        // Only admins and super admins can access this
        if (!$request->user()->canManageLawyers()) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        // Verify lawyer logic...
    }

    public function delete(Request $request, $id)
    {
        // Only super admins can delete lawyers
        if (!$request->user()->isSuperAdmin()) {
            return response()->json(['message' => 'Only super admins can delete lawyers'], 403);
        }

        // Delete logic...
    }
}
```

### Frontend (React/TypeScript)

#### User Interface

```typescript
interface User {
  id: number;
  name: string;
  email: string;
  role: 'client' | 'lawyer' | 'admin' | 'super_admin';
  last_login_at?: string;
}
```

#### Role Checks in Components

```tsx
import { useAuth } from '../context/AuthContext';

function AdminPanel() {
  const { user } = useAuth();

  // Check if user is admin or super admin
  const isAdmin = ['admin', 'super_admin'].includes(user?.role || '');
  const isSuperAdmin = user?.role === 'super_admin';

  if (!isAdmin) {
    return <div>Unauthorized</div>;
  }

  return (
    <div>
      <h1>Admin Panel</h1>

      {/* Only super admins can see this */}
      {isSuperAdmin && (
        <button>Manage Admins</button>
      )}

      {/* All admins can see this */}
      <button>Manage Lawyers</button>
      <button>View Analytics</button>
    </div>
  );
}
```

#### Protected Routes

```tsx
// components/ProtectedRoute.tsx
interface ProtectedRouteProps {
  allowedRoles: string[];
  children: React.ReactNode;
}

function ProtectedRoute({ allowedRoles, children }: ProtectedRouteProps) {
  const { user } = useAuth();

  if (!user || !allowedRoles.includes(user.role)) {
    return <Navigate to="/unauthorized" />;
  }

  return <>{children}</>;
}

// App.tsx
<Route path="/admin/*" element={
  <ProtectedRoute allowedRoles={['admin', 'super_admin']}>
    <AdminDashboard />
  </ProtectedRoute>
} />

<Route path="/admin/users" element={
  <ProtectedRoute allowedRoles={['super_admin']}>
    <ManageAdmins />
  </ProtectedRoute>
} />
```

## Permission Matrix

| Feature | Super Admin | Admin | Lawyer | Client |
|---------|:-----------:|:-----:|:------:|:------:|
| **User Management** |
| Create/Edit/Delete Admins | ✅ | ❌ | ❌ | ❌ |
| View All Users | ✅ | ✅ | ❌ | ❌ |
| Suspend Users | ✅ | ✅ | ❌ | ❌ |
| Delete Users | ✅ | ❌ | ❌ | ❌ |
| **Lawyer Management** |
| Approve Lawyers | ✅ | ✅ | ❌ | ❌ |
| Verify Lawyers | ✅ | ✅ | ❌ | ❌ |
| Suspend Lawyers | ✅ | ✅ | ❌ | ❌ |
| Delete Lawyers | ✅ | ❌ | ❌ | ❌ |
| **Analytics** |
| View System Analytics | ✅ | ✅ | ❌ | ❌ |
| Export Reports | ✅ | ✅ | ❌ | ❌ |
| **Cases & Appointments** |
| Manage Own Cases | ✅ | ✅ | ✅ | ✅ |
| View All Cases | ✅ | ✅ | ❌ | ❌ |
| Create Cases | ✅ | ✅ | ✅ | ❌ |
| **Reviews & Ratings** |
| Moderate Reviews | ✅ | ✅ | ❌ | ❌ |
| Delete Reviews | ✅ | ✅ | ❌ | ❌ |
| **System Settings** |
| Modify System Settings | ✅ | ❌ | ❌ | ❌ |
| View Logs | ✅ | ✅ | ❌ | ❌ |

## Migrating from Old Admin System

### Backend Changes Needed

1. **Update Admin Controllers** - Replace `Admin` model with `User` model + role checks
2. **Update Routes** - Use new role-based middleware
3. **Update Authentication** - Login returns user with role instead of separate admin

### Example Migration

**Before:**
```php
// Old admin-only route
Route::middleware('auth:admin')->group(function() {
    Route::get('/lawyers', [AdminController::class, 'lawyers']);
});

// Old controller
class AdminController extends Controller
{
    public function lawyers()
    {
        $admin = Auth::guard('admin')->user();
        // ...
    }
}
```

**After:**
```php
// New role-based route
Route::middleware(['auth:sanctum', 'isadmin'])->group(function() {
    Route::get('/lawyers', [LawyerController::class, 'index']);
});

// New controller
class LawyerController extends Controller
{
    public function index(Request $request)
    {
        $user = $request->user(); // Works for all authenticated users

        if (!$user->canManageLawyers()) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        // ...
    }
}
```

## Creating New Roles (Future)

To add new roles (e.g., `moderator`, `support`):

### 1. Update Migration

```php
// database/migrations/XXXX_add_new_roles.php
Schema::table('users', function (Blueprint $table) {
    DB::statement("ALTER TABLE users MODIFY COLUMN role ENUM('client', 'lawyer', 'admin', 'super_admin', 'moderator', 'support') DEFAULT 'client'");
});
```

### 2. Update User Model

```php
// app/Models/User.php
const ROLE_MODERATOR = 'moderator';
const ROLE_SUPPORT = 'support';

public function isModerator(): bool
{
    return $this->role === self::ROLE_MODERATOR;
}

public function canModerateContent(): bool
{
    return in_array($this->role, [self::ROLE_MODERATOR, self::ROLE_ADMIN, self::ROLE_SUPER_ADMIN]);
}
```

### 3. Create Middleware (Optional)

```php
// app/Http/Middleware/IsModerator.php
public function handle(Request $request, Closure $next): Response
{
    if (!$request->user() || !$request->user()->isModerator()) {
        return response()->json(['message' => 'Moderator access required'], 403);
    }
    return $next($request);
}
```

## Best Practices

### 1. Always Check Permissions in Controllers

Don't rely solely on middleware - add permission checks in controllers too:

```php
public function destroy(Request $request, $id)
{
    // Double-check permission even if route has middleware
    if (!$request->user()->isSuperAdmin()) {
        abort(403, 'Only super admins can delete users');
    }

    // Delete logic...
}
```

### 2. Use Helper Methods

Prefer semantic helper methods over raw role checks:

```php
// ✅ Good
if ($user->canManageLawyers()) {
    // ...
}

// ❌ Avoid
if (in_array($user->role, ['admin', 'super_admin'])) {
    // ...
}
```

### 3. Frontend Role Checks

Always verify permissions on backend even if frontend hides UI:

```tsx
// Frontend hides button
{canManageLawyers && <button>Approve</button>}

// Backend still checks
public function approve(Request $request, $id)
{
    if (!$request->user()->canManageLawyers()) {
        abort(403);
    }
    // ...
}
```

### 4. Audit Logging

Log important admin actions:

```php
use Illuminate\Support\Facades\Log;

public function approveLawyer(Request $request, $id)
{
    $lawyer = Lawyer::findOrFail($id);
    $lawyer->update(['is_approved' => true]);

    // Log the action
    Log::info('Lawyer approved', [
        'lawyer_id' => $id,
        'admin_id' => $request->user()->id,
        'admin_role' => $request->user()->role,
    ]);

    return response()->json(['message' => 'Lawyer approved']);
}
```

## Security Considerations

### 1. Never Trust Client-Side Role Checks

Always validate on the backend:

```php
// ❌ Never do this
public function deleteUser(Request $request, $id)
{
    // Dangerous - trusts request data
    if ($request->role === 'super_admin') {
        User::destroy($id);
    }
}

// ✅ Always do this
public function deleteUser(Request $request, $id)
{
    if (!$request->user()->isSuperAdmin()) {
        abort(403);
    }
    User::destroy($id);
}
```

### 2. Prevent Privilege Escalation

Don't allow users to set their own roles:

```php
// ❌ Dangerous
$user->update($request->all()); // User could send 'role' => 'super_admin'

// ✅ Safe
$user->update($request->only(['name', 'email', 'phone']));

// ✅ Or use validation
$validated = $request->validate([
    'name' => 'required',
    'email' => 'required|email',
    // Don't allow 'role' in validation
]);
```

### 3. Role Assignment Only by Super Admin

```php
public function updateUserRole(Request $request, $id)
{
    // Only super admins can change roles
    if (!$request->user()->isSuperAdmin()) {
        abort(403, 'Only super admins can modify user roles');
    }

    $user = User::findOrFail($id);

    // Don't allow changing super admin role (except by another super admin)
    if ($user->isSuperAdmin() && !$request->user()->isSuperAdmin()) {
        abort(403, 'Cannot modify super admin roles');
    }

    $user->update(['role' => $request->role]);
}
```

## Troubleshooting

### Issue: Migration fails with "role column already exists"

**Solution:** The migration already ran. Check:
```bash
php artisan migrate:status
```

### Issue: User still using old Admin model

**Solution:** Update imports:
```php
// Before
use App\Models\Admin;

// After
use App\Models\User;
```

### Issue: Middleware returns 403 for admin

**Solution:** Check user role in database:
```sql
SELECT id, name, email, role FROM users WHERE email = 'admin@example.com';
```

### Issue: Super admin can't log in

**Solution:** Run the seeder:
```bash
php artisan db:seed --class=SuperAdminSeeder
```

## Support & Maintenance

- **Created:** 2025-11-16
- **Laravel Version:** 11.x
- **Database:** SQL Server
- **Last Updated:** 2025-11-16

For questions or issues, check the migration files and User model for implementation details.
