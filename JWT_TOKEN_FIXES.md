# JWT Token Management Fixes

## Problem Summary
The application was experiencing automatic logout loops due to JWT tokens expiring too quickly (1 day) and lack of proper token refresh mechanisms.

## Root Causes Identified
1. **Short Token Expiration**: Tokens were set to expire in 1 day (`expiresIn: '1d'`)
2. **No Token Refresh Logic**: No mechanism to refresh tokens before expiration
3. **Poor Error Handling**: Generic 401 responses triggered immediate logout
4. **No Token Validation**: Frontend didn't check token expiration before making requests

## Solutions Implemented

### 1. Extended Token Expiration Time
- **Files Modified**: `backend/src/routes/auth.js`, `backend/src/routes/googleAuth.js`
- **Change**: Extended JWT token expiration from `1d` to `7d` (7 days)
- **Impact**: Users stay logged in longer, reducing frequency of re-authentication

### 2. Added Token Refresh Endpoint
- **File Modified**: `backend/src/routes/auth.js`
- **New Route**: `POST /api/auth/refresh`
- **Functionality**: Allows users to get new tokens without re-authenticating
- **Security**: Only works if current token is still valid

### 3. Improved Frontend Token Management
- **File Modified**: `frontend/src/services/api.ts`
- **Features Added**:
  - Token expiration checking before requests
  - Automatic token refresh when tokens are about to expire (within 1 hour)
  - Better error handling for 401 responses
  - Request retry with new token after refresh

### 4. Enhanced UserContext
- **File Modified**: `frontend/src/contexts/UserContext.tsx`
- **Improvements**:
  - Token validation before session checks
  - Added `refreshToken` function
  - Better error handling during session validation

### 5. Token Utility Functions
- **New File**: `frontend/src/utils/tokenUtils.ts`
- **Functions**:
  - `isTokenExpired()`: Check if token is expired
  - `isTokenAboutToExpire()`: Check if token expires soon
  - `decodeToken()`: Safely decode JWT payload
  - `getTimeUntilExpiry()`: Get seconds until expiration
  - `formatTimeUntilExpiry()`: Human-readable time format
  - `isTokenValid()`: Comprehensive token validation

### 6. Enhanced Auth Middleware
- **File Modified**: `backend/src/middleware/authMiddleware.js`
- **Improvements**:
  - Better error logging with token expiration details
  - More specific error messages
  - Debug information for troubleshooting

## Token Lifecycle Flow

### Before Fix
1. User logs in → Token expires in 1 day
2. Token expires → User gets logged out immediately
3. User has to log in again → Cycle repeats

### After Fix
1. User logs in → Token expires in 7 days
2. Token about to expire (within 1 hour) → Automatic refresh
3. New token issued → User stays logged in seamlessly
4. If refresh fails → Graceful logout with clear error message

## Configuration Options

### Token Expiration Times
- **Login/Register**: 7 days
- **Google OAuth**: 7 days
- **Refresh Buffer**: 1 hour (tokens refreshed when < 1 hour remaining)

### Environment Variables
- `JWT_SECRET`: Secret key for JWT signing (required)
- `NODE_ENV`: Environment mode (affects logging verbosity)

## Testing the Fix

### Manual Testing
1. Log in to the application
2. Check browser console for token expiration logs
3. Wait for token to approach expiration (or modify token for testing)
4. Verify automatic refresh occurs without logout
5. Verify graceful logout if refresh fails

### Debug Information
The following debug logs will help monitor token behavior:
- `[DEBUG] Token about to expire, refreshing...`
- `[DEBUG] Token expired, removing from localStorage`
- `Token valid until: [timestamp]`
- `Time until expiry: [seconds] seconds`

## Security Considerations

### Token Security
- Tokens are stored in localStorage (consider httpOnly cookies for production)
- Refresh tokens have same expiration as access tokens
- Failed refresh attempts trigger immediate logout

### Best Practices
- Monitor token refresh patterns for anomalies
- Implement rate limiting on refresh endpoint
- Consider implementing refresh token rotation
- Add audit logging for authentication events

## Future Improvements

### Recommended Enhancements
1. **Refresh Token Rotation**: Use separate refresh tokens with longer expiration
2. **HttpOnly Cookies**: Store tokens in secure, httpOnly cookies
3. **Token Blacklisting**: Implement token revocation for logout
4. **Rate Limiting**: Add rate limiting to auth endpoints
5. **Audit Logging**: Log authentication events for security monitoring

### Monitoring
- Track token refresh frequency
- Monitor failed authentication attempts
- Alert on unusual authentication patterns
- Log token expiration events

## Rollback Plan

If issues arise, the following changes can be reverted:
1. Change `expiresIn: '7d'` back to `expiresIn: '1d'` in auth routes
2. Remove the refresh endpoint from `auth.js`
3. Simplify the API interceptors in `api.ts`
4. Remove token utility functions

However, this will restore the original logout loop issue. 