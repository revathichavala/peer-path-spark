import React, { createContext, useContext, ReactNode } from 'react';
import { useMongoAuth } from '@/hooks/useMongoAuth';
import { User } from '@/lib/mongodb-client';

interface MongoAuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  register: (name: string, email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  updateProfile: (data: Partial<User>) => Promise<{ success: boolean; error?: string }>;
  refreshAuth: () => Promise<void>;
}

const MongoAuthContext = createContext<MongoAuthContextType | undefined>(undefined);

export const useMongoAuthContext = () => {
  const context = useContext(MongoAuthContext);
  if (context === undefined) {
    throw new Error('useMongoAuthContext must be used within a MongoAuthProvider');
  }
  return context;
};

interface MongoAuthProviderProps {
  children: ReactNode;
}

export const MongoAuthProvider: React.FC<MongoAuthProviderProps> = ({ children }) => {
  const authState = useMongoAuth();

  return (
    <MongoAuthContext.Provider value={authState}>
      {children}
    </MongoAuthContext.Provider>
  );
};