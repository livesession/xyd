import { createContext, useContext, useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { authService } from '../services/auth.client';

interface User {
  id: string;
  email: string;
  name: string;
  picture?: string;
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  signIn: (user: User) => void;
  signOut: () => Promise<void>;
  initiateGoogleAuth: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const initializeAuth = async () => {
      try {
        // Try to get current user from server
        const currentUser = await authService.getCurrentUser();
        setUser(currentUser);
      } catch (error) {
        console.error('Error initializing auth:', error);
      } finally {
        setIsLoading(false);
      }
    };

    initializeAuth();
  }, []);

  const signIn = (userData: User) => {
    setUser(userData);
  };

  const signOut = async () => {
    try {
      // Clear user state immediately for better UX
      setUser(null);
      // Call the server to clear the session cookie
      await authService.signOut();
      // Navigate to signin page using React Router
      navigate('/signin');
    } catch (error) {
      console.error('Error signing out:', error);
      // Even if there's an error, clear the user state and navigate
      setUser(null);
      navigate('/signin');
    }
  };

  const initiateGoogleAuth = () => {
    try {
      authService.initiateGoogleAuth();
    } catch (error) {
      console.error('Error initiating Google auth:', error);
    }
  };

  const value: AuthContextType = {
    user,
    isLoading,
    isAuthenticated: !!user,
    signIn,
    signOut,
    initiateGoogleAuth,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
