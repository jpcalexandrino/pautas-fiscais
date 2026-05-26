import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react';
import { useNavigate } from "@tanstack/react-router"

export interface User {
  id: string | number;
  email: string;
  name?: string;
  [key: string]: any;
}

export interface AuthContextType {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  sessionStartTime: Date | null;
  forcePasswordChange: boolean;
  login: (email: string, password: string) => Promise<User>;
  logout: () => void;
  changePassword: (currentPassword: string, newPassword: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);
const API_URL = `${import.meta.env.VITE_API_URL}/auth`;

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(() => localStorage.getItem('token'));
  const [isLoading, setIsLoading] = useState(true);
  const [sessionStartTime, setSessionStartTime] = useState<Date | null>(null);
  const [forcePasswordChange, setForcePasswordChange] = useState<boolean>(() => localStorage.getItem('forcePasswordChange') === 'true');

  const navigate = useNavigate()

  const logout = useCallback(() => {
    localStorage.removeItem('token');
    localStorage.removeItem('forcePasswordChange');
    setToken(null);
    setUser(null);
    setSessionStartTime(null);
    setForcePasswordChange(false);
    navigate({ to: "/login" })
  }, []);

  const verifyToken = useCallback(async (currentToken: string) => {
    try {
      const response = await fetch(`${API_URL}/me`, {
        headers: { Authorization: `Bearer ${currentToken}` },
      });
      if (response.ok) {
        const userData = await response.json();
        setUser(userData);
        setSessionStartTime(new Date());
      } else {
        // Token expired or invalid
        logout();
      }
    } catch {
      logout();
    } finally {
      setIsLoading(false);
    }
  }, [logout]);

  // On mount, verify stored token
  useEffect(() => {
    if (token) {
      verifyToken(token);
    } else {
      setIsLoading(false);
    }
  }, [token, verifyToken]);

  const login = useCallback(async (email: string, password: string): Promise<User> => {
    const response = await fetch(`${API_URL}/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Falha no login');
    }

    localStorage.setItem('token', data.token);
    setToken(data.token);
    setUser(data.user);
    setSessionStartTime(new Date());

    if (data.forcePasswordChange) {
      localStorage.setItem('forcePasswordChange', 'true');
      setForcePasswordChange(true);
    } else {
      localStorage.removeItem('forcePasswordChange');
      setForcePasswordChange(false);
    }

    return data.user;
  }, []);

  const changePassword = useCallback(async (currentPassword: string, newPassword: string) => {
    const response = await fetch(`${API_URL}/change-password`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ currentPassword, newPassword }),
    });

    if (!response.ok) {
      const data = await response.json();
      throw new Error(data.error || 'Falha ao alterar senha');
    }

    setForcePasswordChange(false);
    localStorage.removeItem('forcePasswordChange');
  }, [token]);

  const value: AuthContextType = {
    user,
    token,
    isAuthenticated: !!user,
    isLoading,
    sessionStartTime,
    forcePasswordChange,
    login,
    logout,
    changePassword,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth deve ser usado dentro de um AuthProvider');
  }
  return context;
}

export default AuthContext;
