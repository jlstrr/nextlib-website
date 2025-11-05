# Route Protection Middleware

This middleware system provides route protection for your React application, ensuring that users must be authenticated before accessing protected routes.

## Components

### 1. `AuthContext` (`src/context/AuthContext.tsx`)
- Manages authentication state across the application
- Provides `user`, `isAuthenticated`, `login`, and `logout` functions
- Automatically handles localStorage for persistent sessions

### 2. `RouteProtection` (`src/middleware/RouteProtection.tsx`)
- **`ProtectedRoute`**: Wraps routes that require authentication
- **`PublicRoute`**: Wraps public routes (redirects authenticated users away)

### 3. `Unauthorized` (`src/pages/OtherPage/Unauthorized.tsx`)
- Page shown when users try to access routes they don't have permission for

## How It Works

### Authentication Flow
1. User attempts to access a protected route (e.g., `/dashboard`)
2. `ProtectedRoute` checks if user is authenticated via `AuthContext`
3. If not authenticated → redirects to `/signin`
4. If authenticated → allows access to the route

### Public Route Flow
1. Authenticated user tries to access public route (e.g., `/signin`)
2. `PublicRoute` detects user is already authenticated
3. Redirects to `/dashboard` automatically

## Usage Examples

### Protecting Routes
```tsx
// Protect a single route
<Route path="/dashboard" element={
  <ProtectedRoute>
    <Dashboard />
  </ProtectedRoute>
} />

// Protect multiple routes with layout
<Route element={
  <ProtectedRoute>
    <AppLayout />
  </ProtectedRoute>
}>
  <Route path="/dashboard" element={<Dashboard />} />
  <Route path="/profile" element={<Profile />} />
  <Route path="/settings" element={<Settings />} />
</Route>
```

### Public Routes
```tsx
// Redirect authenticated users away from login
<Route path="/signin" element={
  <PublicRoute redirectTo="/dashboard">
    <SignIn />
  </PublicRoute>
} />
```

### Using Auth Context
```tsx
import { useAuth } from '../context/AuthContext';

function MyComponent() {
  const { user, isAuthenticated, login, logout } = useAuth();

  const handleLogin = async (email, password) => {
    // Your API call here
    const response = await loginAPI(email, password);
    
    // Use context to set authentication
    login(response.user, response.token);
  };

  const handleLogout = () => {
    logout(); // Automatically clears localStorage and redirects
  };

  return (
    <div>
      {isAuthenticated ? (
        <p>Welcome, {user.name}!</p>
      ) : (
        <p>Please log in</p>
      )}
    </div>
  );
}
```

## Integration with Existing Code

The middleware has been integrated with your existing authentication flow:

1. **SignInForm**: Updated to use `AuthContext.login()` instead of manual localStorage
2. **UserDropdown**: Updated to use `AuthContext.logout()` and display `user.name`
3. **App.tsx**: Wrapped with `AuthProvider` and routes configured with protection

## Storage Keys

The system uses these localStorage keys:
- `authToken` or `token`: JWT token (both supported for backward compatibility)
- `user`: JSON stringified user object
- `isLoggedIn`: Legacy flag (maintained for backward compatibility)
- `rememberedId`: For "Remember me" functionality

## Testing the Middleware

1. **Test Protected Routes**:
   - Navigate to `/dashboard` without being logged in
   - Should redirect to `/signin`

2. **Test Public Routes**:
   - Log in, then try to visit `/signin`
   - Should redirect to `/dashboard`

3. **Test Authentication Persistence**:
   - Log in and refresh the page
   - Should remain logged in

4. **Test Logout**:
   - Click logout in user dropdown
   - Should clear session and redirect to signin

## Demo Component

A demo component is available at `src/components/demo/AuthDemo.tsx` that shows:
- Current authentication status
- User information when logged in
- Test login/logout buttons
- Usage instructions

To use it, import and add it to any page:
```tsx
import AuthDemo from '../components/demo/AuthDemo';

// In your component
<AuthDemo />
```

## Customization

### Custom Redirect Paths
```tsx
// Custom redirect for protected routes
<ProtectedRoute redirectTo="/custom-login">
  <Dashboard />
</ProtectedRoute>

// Custom redirect for public routes
<PublicRoute redirectTo="/custom-dashboard">
  <SignIn />
</PublicRoute>
```

### Extending User Object
Update the User interface in `AuthContext.tsx`:
```tsx
interface User {
  id: string;
  email: string;
  name?: string;
  role?: string;
  permissions?: string[]; // Add custom fields
  avatar?: string;
}
```

## Security Notes

1. **Client-side Only**: This is client-side route protection only. Server-side API protection is still required.
2. **Token Validation**: Consider adding token expiration checks to the AuthContext.
3. **Secure Storage**: For production, consider using secure storage solutions for sensitive data.

## Error Handling

The middleware includes built-in error handling:
- Corrupted localStorage data is automatically cleared
- Failed authentication checks gracefully fall back to unauthenticated state
- Loading states prevent flash of unauthorized content