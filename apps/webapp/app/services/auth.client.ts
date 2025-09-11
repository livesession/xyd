import type { User } from "~/types/user";

export class AuthService {
  private static instance: AuthService;

  private constructor() { }

  static getInstance(): AuthService {
    if (!AuthService.instance) {
      AuthService.instance = new AuthService();
    }
    return AuthService.instance;
  }

  // Initiate Google OAuth flow - redirects to server endpoint
  public initiateGoogleAuth(): void {
    // Submit the form to the server endpoint
    const form = document.createElement('form');
    form.method = 'POST';
    form.action = '/api/auth/google';
    document.body.appendChild(form);
    form.submit();
  }

  // Handle OAuth callback - no longer needed with server-side auth
  public async handleOAuthCallback(): Promise<User> {
    // This method is no longer used with server-side authentication
    // The server handles the OAuth callback and redirects
    throw new Error('OAuth callback is handled server-side');
  }

  // Get current user from server
  public async getCurrentUser(): Promise<User | null> {
    try {
      const response = await fetch('/api/auth/me', {
        credentials: 'include' // Include cookies for session
      });

      if (response.ok) {
        return await response.json();
      } else if (response.status === 401) {
        return null; // Not authenticated
      } else {
        throw new Error('Failed to get current user');
      }
    } catch (error) {
      console.error('Error getting current user:', error);
      return null;
    }
  }

  // Sign out
  public async signOut(): Promise<void> {
    try {
      const response = await fetch('/api/auth/signout', {
        method: 'POST',
        credentials: 'include'
      });

      if (!response.ok) {
        throw new Error('Failed to sign out');
      }
    } catch (error) {
      console.error('Error signing out:', error);
      throw error;
    }
  }

  // Check if we're in an OAuth callback - no longer needed
  public isOAuthCallback(): boolean {
    return false; // Server handles OAuth callbacks
  }
}

export const authService = AuthService.getInstance();
