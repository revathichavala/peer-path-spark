import { useState, useEffect, useCallback } from 'react';
import { mongoClient, User } from '@/lib/mongodb-client';
import { realtimeClient } from '@/lib/realtime-client';

interface AuthState {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
}

export const useMongoAuth = () => {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    isLoading: true,
    isAuthenticated: false,
  });

  // Initialize auth state
  useEffect(() => {
    checkAuthStatus();
  }, []);

  const checkAuthStatus = async () => {
    const token = localStorage.getItem('mongo_access_token');
    
    if (!token) {
      setAuthState({
        user: null,
        isLoading: false,
        isAuthenticated: false,
      });
      return;
    }

    mongoClient.setAuthToken(token);
    
    try {
      const response = await mongoClient.getCurrentUser();
      
      if (response.success && response.data) {
        setAuthState({
          user: response.data,
          isLoading: false,
          isAuthenticated: true,
        });
        
        // Connect to realtime if not already connected
        if (!realtimeClient.isConnected()) {
          realtimeClient.connect(token);
        }
      } else {
        // Token is invalid, clear it
        localStorage.removeItem('mongo_access_token');
        localStorage.removeItem('mongo_refresh_token');
        mongoClient.clearAuthToken();
        
        setAuthState({
          user: null,
          isLoading: false,
          isAuthenticated: false,
        });
      }
    } catch (error) {
      console.error('Auth check failed:', error);
      setAuthState({
        user: null,
        isLoading: false,
        isAuthenticated: false,
      });
    }
  };

  const login = useCallback(async (email: string, password: string) => {
    setAuthState(prev => ({ ...prev, isLoading: true }));
    
    try {
      const response = await mongoClient.login(email, password);
      
      if (response.success && response.data) {
        const { user, access_token, refresh_token } = response.data;
        
        // Store tokens
        localStorage.setItem('mongo_access_token', access_token);
        localStorage.setItem('mongo_refresh_token', refresh_token);
        
        // Set auth token for client
        mongoClient.setAuthToken(access_token);
        
        // Connect to realtime
        realtimeClient.connect(access_token);
        
        setAuthState({
          user,
          isLoading: false,
          isAuthenticated: true,
        });
        
        return { success: true };
      } else {
        setAuthState({
          user: null,
          isLoading: false,
          isAuthenticated: false,
        });
        
        return { 
          success: false, 
          error: response.error || 'Login failed' 
        };
      }
    } catch (error) {
      setAuthState({
        user: null,
        isLoading: false,
        isAuthenticated: false,
      });
      
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Login failed' 
      };
    }
  }, []);

  const register = useCallback(async (name: string, email: string, password: string) => {
    setAuthState(prev => ({ ...prev, isLoading: true }));
    
    try {
      const response = await mongoClient.register(name, email, password);
      
      if (response.success && response.data) {
        const { user, access_token, refresh_token } = response.data;
        
        // Store tokens
        localStorage.setItem('mongo_access_token', access_token);
        localStorage.setItem('mongo_refresh_token', refresh_token);
        
        // Set auth token for client
        mongoClient.setAuthToken(access_token);
        
        // Connect to realtime
        realtimeClient.connect(access_token);
        
        setAuthState({
          user,
          isLoading: false,
          isAuthenticated: true,
        });
        
        return { success: true };
      } else {
        setAuthState({
          user: null,
          isLoading: false,
          isAuthenticated: false,
        });
        
        return { 
          success: false, 
          error: response.error || 'Registration failed' 
        };
      }
    } catch (error) {
      setAuthState({
        user: null,
        isLoading: false,
        isAuthenticated: false,
      });
      
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Registration failed' 
      };
    }
  }, []);

  const logout = useCallback(async () => {
    try {
      await mongoClient.logout();
    } catch (error) {
      console.error('Logout request failed:', error);
    }
    
    // Clear local storage and state regardless of API response
    localStorage.removeItem('mongo_access_token');
    localStorage.removeItem('mongo_refresh_token');
    mongoClient.clearAuthToken();
    realtimeClient.disconnect();
    
    setAuthState({
      user: null,
      isLoading: false,
      isAuthenticated: false,
    });
  }, []);

  const updateProfile = useCallback(async (data: Partial<User>) => {
    if (!authState.isAuthenticated) {
      return { success: false, error: 'Not authenticated' };
    }

    try {
      const response = await mongoClient.updateProfile(data);
      
      if (response.success && response.data) {
        setAuthState(prev => ({
          ...prev,
          user: response.data!,
        }));
        
        return { success: true };
      } else {
        return { 
          success: false, 
          error: response.error || 'Update failed' 
        };
      }
    } catch (error) {
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Update failed' 
      };
    }
  }, [authState.isAuthenticated]);

  return {
    user: authState.user,
    isLoading: authState.isLoading,
    isAuthenticated: authState.isAuthenticated,
    login,
    register,
    logout,
    updateProfile,
    refreshAuth: checkAuthStatus,
  };
};