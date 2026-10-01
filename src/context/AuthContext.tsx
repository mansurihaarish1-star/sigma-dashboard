'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';

interface AuthContextType {
  isAuthenticated: boolean;
  adminName: string;
  adminEmail: string;
  login: (u: string, p: string) => boolean;
  logout: () => void;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType>({
  isAuthenticated: false,
  adminName: 'Sigma Admin',
  adminEmail: 'sigma@2627',
  login: () => false,
  logout: () => {},
  isLoading: true,
});

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [adminName, setAdminName] = useState<string>('Sigma Admin');
  const [adminEmail, setAdminEmail] = useState<string>('sigma@2627');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    try {
      const authState = localStorage.getItem('sigma_admin_logged_in');
      const savedName = localStorage.getItem('sigma_admin_name');
      const savedEmail = localStorage.getItem('sigma_admin_email');

      if (authState === 'true') {
        setIsAuthenticated(true);
        if (savedName) setAdminName(savedName);
        if (savedEmail) setAdminEmail(savedEmail);
      } else {
        setIsAuthenticated(false);
      }
    } catch {
      setIsAuthenticated(false);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Protected route redirection logic
  useEffect(() => {
    if (!isLoading) {
      if (!isAuthenticated && pathname !== '/login') {
        router.replace('/login');
      } else if (isAuthenticated && pathname === '/login') {
        router.replace('/');
      }
    }
  }, [isAuthenticated, isLoading, pathname, router]);

  const login = (u: string, p: string): boolean => {
    const userClean = u.trim().toLowerCase();
    const passClean = p.trim();

    // Required Admin Credentials:
    // Username: sigma@2627, Password: sigma123
    const isValidUser = userClean === 'sigma@2627' || userClean === 'admin@sigma.com';
    const isValidPass = passClean === 'sigma123';

    if (isValidUser && isValidPass) {
      setIsAuthenticated(true);
      setAdminName('Sigma Admin');
      setAdminEmail(userClean);
      localStorage.setItem('sigma_admin_logged_in', 'true');
      localStorage.setItem('sigma_admin_name', 'Sigma Admin');
      localStorage.setItem('sigma_admin_email', userClean);
      return true;
    }
    return false;
  };

  const logout = () => {
    setIsAuthenticated(false);
    localStorage.removeItem('sigma_admin_logged_in');
    localStorage.removeItem('sigma_admin_name');
    localStorage.removeItem('sigma_admin_email');
    router.push('/login');
  };

  return (
    <AuthContext.Provider value={{ isAuthenticated, adminName, adminEmail, login, logout, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
