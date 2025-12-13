import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User } from '../types/user';
import { getLoggedInUser } from '../api/users';

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (userData: User, token: string) => void;
  logout: () => void;
  updateUser: (userData: User) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Check for existing authentication on app load
  useEffect(() => {
    const checkExistingAuth = async () => {
      setIsLoading(true);
      try {
        const profile = await getLoggedInUser();
        const profileData = (profile && profile.data) ? profile.data : profile;
        if (profileData) {
          setUser(profileData as User);
          return;
        }
        setUser(null);
      } catch {
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    };

    checkExistingAuth();
  }, []);

  const login = (userData: User, token: string) => {
    localStorage.setItem('authToken', token);
    localStorage.setItem('token', token); // Store both for backward compatibility
    localStorage.setItem('user', JSON.stringify(userData));
    setUser(userData);
  };

  const logout = () => {
    localStorage.removeItem('authToken');
    localStorage.removeItem('token'); // Remove both for backward compatibility
    localStorage.removeItem('user');
    setUser(null);
  };

  const updateUser = (userData: User) => {
    localStorage.setItem('user', JSON.stringify(userData));
    setUser(userData);
  };

  const value: AuthContextType = {
    user,
    isAuthenticated: !!user,
    isLoading,
    login,
    logout,
    updateUser,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export default AuthContext;