import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, UserPreferences } from '../types';
import { api } from '../api/client';

interface AuthContextType {
  user: User | null;
  preferences: UserPreferences | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (data: any) => Promise<void>;
  logout: () => void;
  updatePreferences: (prefs: Partial<UserPreferences>) => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [preferences, setPreferences] = useState<UserPreferences | null>(null);
  const [token, setToken] = useState<string | null>(localStorage.getItem('timeweave_token'));
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const fetchCurrentUser = async () => {
    try {
      if (!localStorage.getItem('timeweave_token')) {
        setIsLoading(false);
        return;
      }
      const data = await api.getMe();
      setUser(data.user);
      setPreferences(data.preferences);
    } catch (err) {
      console.error('Failed to load user session:', err);
      localStorage.removeItem('timeweave_token');
      setUser(null);
      setPreferences(null);
      setToken(null);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCurrentUser();
  }, []);

  const login = async (email: string, password: string) => {
    setIsLoading(true);
    try {
      const data = await api.login({ email, password });
      localStorage.setItem('timeweave_token', data.token);
      setToken(data.token);
      setUser(data.user);
      await fetchCurrentUser();
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (data: any) => {
    setIsLoading(true);
    try {
      const res = await api.register(data);
      localStorage.setItem('timeweave_token', res.token);
      setToken(res.token);
      setUser(res.user);
      await fetchCurrentUser();
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    localStorage.removeItem('timeweave_token');
    setToken(null);
    setUser(null);
    setPreferences(null);
    window.location.href = '/login';
  };

  const updatePreferences = async (newPrefs: Partial<UserPreferences>) => {
    const res = await api.updatePreferences(newPrefs);
    setPreferences(res.preferences);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        preferences,
        token,
        isAuthenticated: !!token && !!user,
        isLoading,
        login,
        register,
        logout,
        updatePreferences,
        refreshUser: fetchCurrentUser
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};
