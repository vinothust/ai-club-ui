import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { AppUser } from '@/types';
import { authService } from '@/services/auth.service';

interface AuthContextType {
  user: AppUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<string | null>;
  windowsLogin: () => Promise<string | null>;
  logout: () => Promise<void>;
  updateUser: (user: AppUser) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AppUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // On mount: restore session from stored token
  useEffect(() => {
    const restoreSession = async () => {
      try {
        authService.initializeAuth();
        if (authService.isAuthenticated()) {
          const response = await authService.getCurrentUser();
          if (response.success && response.data) {
            setUser(response.data);
          } else {
            authService.logout().catch(() => {});
          }
        }
      } catch {
        try { await authService.logout(); } catch { /* ignore */ }
      } finally {
        setIsLoading(false);
      }
    };
    restoreSession();
  }, []);

  const login = useCallback(async (email: string, password: string): Promise<string | null> => {
    try {
      setError(null);
      const response = await authService.login({ email, password });
      if (response.success && response.data?.user) {
        setUser(response.data.user);
        return null;
      }
      return response.message || 'Login failed. Please try again.';
    } catch (err: any) {
      const message = err?.message || 'Login failed. Please try again.';
      setError(message);
      return message;
    }
  }, []);

  const windowsLogin = useCallback(async (): Promise<string | null> => {
    try {
      setError(null);
      const response = await authService.windowsLogin();
      if (response.success && response.data?.user) {
        setUser(response.data.user);
        return null;
      }
      return response.message || 'Windows authentication failed.';
    } catch (err: any) {
      const message = err?.message || 'Windows authentication failed.';
      setError(message);
      return message;
    }
  }, []);

  const logout = useCallback(async () => {
    try {
      await authService.logout();
    } catch {
      // Even if API call fails, clear local state
    } finally {
      setUser(null);
    }
  }, []);

  const updateUser = useCallback((updatedUser: AppUser) => {
    setUser(updatedUser);
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
        error,
        login,
        windowsLogin,
        logout,
        updateUser,
      }}
    >
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
