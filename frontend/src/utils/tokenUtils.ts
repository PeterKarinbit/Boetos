// Token utility functions for JWT management

export interface TokenPayload {
  userId: string;
  iat: number;
  exp: number;
}

/**
 * Decode JWT token without verification
 */
export const decodeToken = (token: string): TokenPayload | null => {
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    return payload;
  } catch {
    return null;
  }
};

/**
 * Check if JWT token is expired
 */
export const isTokenExpired = (token: string): boolean => {
  const payload = decodeToken(token);
  if (!payload) return true;
  
  const currentTime = Date.now() / 1000;
  return payload.exp < currentTime;
};

/**
 * Check if token is about to expire (within specified time)
 */
export const isTokenAboutToExpire = (token: string, bufferMinutes: number = 60): boolean => {
  const payload = decodeToken(token);
  if (!payload) return true;
  
  const currentTime = Date.now() / 1000;
  const bufferSeconds = bufferMinutes * 60;
  return payload.exp < (currentTime + bufferSeconds);
};

/**
 * Get token expiration time in milliseconds
 */
export const getTokenExpirationTime = (token: string): number | null => {
  const payload = decodeToken(token);
  if (!payload) return null;
  
  return payload.exp * 1000; // Convert to milliseconds
};

/**
 * Get time until token expires in seconds
 */
export const getTimeUntilExpiry = (token: string): number | null => {
  const payload = decodeToken(token);
  if (!payload) return null;
  
  const currentTime = Date.now() / 1000;
  return Math.max(0, payload.exp - currentTime);
};

/**
 * Format time until expiry as human readable string
 */
export const formatTimeUntilExpiry = (token: string): string | null => {
  const seconds = getTimeUntilExpiry(token);
  if (seconds === null) return null;
  
  if (seconds < 60) {
    return `${Math.floor(seconds)} seconds`;
  } else if (seconds < 3600) {
    return `${Math.floor(seconds / 60)} minutes`;
  } else if (seconds < 86400) {
    return `${Math.floor(seconds / 3600)} hours`;
  } else {
    return `${Math.floor(seconds / 86400)} days`;
  }
};

/**
 * Check if token is valid (not expired and properly formatted)
 */
export const isTokenValid = (token: string): boolean => {
  if (!token || typeof token !== 'string') return false;
  
  const parts = token.split('.');
  if (parts.length !== 3) return false;
  
  return !isTokenExpired(token);
}; 