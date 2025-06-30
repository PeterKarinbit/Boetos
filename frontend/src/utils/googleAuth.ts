interface GoogleTokenData {
  accessToken: string;
  expiresAt: number;
  tokenType: string;
  refreshToken?: string;
}

export const googleAuth = {
  // Store the token data in localStorage
  setToken(tokenData: Omit<GoogleTokenData, 'expiresAt'> & { expiresIn?: number }) {
    const expiresAt = Date.now() + (tokenData.expiresIn || 3600) * 1000;
    const data: GoogleTokenData = {
      accessToken: tokenData.accessToken,
      tokenType: tokenData.tokenType,
      refreshToken: tokenData.refreshToken,
      expiresAt,
    };
    localStorage.setItem('googleAuth', JSON.stringify(data));
  },

  // Get the stored token data
  getToken(): GoogleTokenData | null {
    const data = localStorage.getItem('googleAuth');
    if (!data) return null;
    try {
      return JSON.parse(data);
    } catch (error) {
      console.error('Failed to parse Google auth data', error);
      return null;
    }
  },

  // Check if the token is valid and not expired
  isAuthenticated(): boolean {
    const tokenData = googleAuth.getToken();
    return !!(tokenData && tokenData.expiresAt > Date.now());
  },

  // Get the access token if valid
  getAccessToken(): string | null {
    const tokenData = googleAuth.getToken();
    if (tokenData && tokenData.expiresAt > Date.now()) {
      return tokenData.accessToken;
    }
    return null;
  },

  // Clear the stored token
  clearToken(): void {
    localStorage.removeItem('googleAuth');
  },

  // Check if token is expired
  isTokenExpired(): boolean {
    const tokenData = googleAuth.getToken();
    return !tokenData || tokenData.expiresAt <= Date.now();
  },

  // Refresh the access token (you'll need to implement the actual refresh logic)
  async refreshToken(): Promise<boolean> {
    // This is a placeholder. In a real app, you would:
    // 1. Get the refresh token from storage
    // 2. Call your backend or Google's token endpoint
    // 3. Update the stored tokens
    // 4. Return true if successful, false otherwise
    // For now, we'll just clear the token and return false
    googleAuth.clearToken();
    return false;
  },

  // Get an authenticated fetch function
  async getAuthenticatedFetch(): Promise<typeof fetch> {
    let accessToken = googleAuth.getAccessToken();
    // If token is expired, try to refresh it
    if (!accessToken && googleAuth.isTokenExpired()) {
      const refreshed = await googleAuth.refreshToken();
      if (refreshed) {
        accessToken = googleAuth.getAccessToken();
      }
    }
    if (!accessToken) {
      throw new Error('Not authenticated with Google');
    }
    // Return a fetch function with the Authorization header set
    return (input: RequestInfo | URL, init?: RequestInit) => {
      const headers = new Headers(init?.headers);
      headers.set('Authorization', `Bearer ${accessToken}`);
      return fetch(input, {
        ...init,
        headers,
      });
    };
  },
};
