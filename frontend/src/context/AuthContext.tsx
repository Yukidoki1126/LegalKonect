// src/context/AuthContext.tsx
import React, { createContext, useState, useContext, useEffect, ReactNode } from 'react';
import axios from 'axios';
import api from '../services/api';
import { cacheService } from '../services/cacheService';

interface Lawyer {
  id: number;
  status: 'pending' | 'approved' | 'suspended';
  first_name?: string;
  last_name?: string;
  bio?: string;
  license_number?: string;
  years_experience?: number;
  hourly_rate?: number;
  office_address?: string;
  office_latitude?: number | null;
  office_longitude?: number | null;
  office_phone?: string;
  office_hours?: string;
  profile_photo?: string | null;
  is_available?: boolean;
  specializations?: Array<{ id: number; name: string }>;
}

interface User {
  id: number;
  name: string;
  email: string;
  phone?: string;
  profile_picture?: string | null;
  profile_picture_url?: string | null;
  address?: string;
  city?: string;
  province?: string;
  latitude?: number;
  longitude?: number;
  role?: string;
  lawyer?: Lawyer;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<string>;
  register: (userData: RegisterData) => Promise<void>;
  logout: () => void;
  updateUser: (userData: Partial<User>) => void;
}

interface RegisterData {
  name: string;
  email: string;
  password: string;
  password_confirmation: string;
  phone?: string;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const storedToken = localStorage.getItem('token');
    const storedUser = localStorage.getItem('user');

    if (storedToken && storedUser) {
      setToken(storedToken);
      setUser(JSON.parse(storedUser));
      api.defaults.headers.common['Authorization'] = `Bearer ${storedToken}`;
    }
    setLoading(false);

    // Listen for storage changes from other tabs
    const handleStorageChange = (e: StorageEvent) => {
      // If token or user is removed in another tab, log out this tab too
      if (e.key === 'token' && e.newValue === null) {
        console.log('Storage event: Token removed in another tab, logging out...');
        setUser(null);
        setToken(null);
        delete api.defaults.headers.common['Authorization'];

        // Use a small delay to ensure state is updated before redirect
        setTimeout(() => {
          window.location.href = '/';
        }, 100);
      }
      // If user is removed in another tab
      else if (e.key === 'user' && e.newValue === null) {
        console.log('Storage event: User removed in another tab, logging out...');
        setUser(null);
        setToken(null);
        delete api.defaults.headers.common['Authorization'];

        setTimeout(() => {
          window.location.href = '/';
        }, 100);
      }
      // If token changes in another tab (someone else logged in), force logout
      else if (e.key === 'token' && e.newValue && e.oldValue && e.newValue !== e.oldValue) {
        console.log('Storage event: Different user logged in another tab, logging out this tab...');
        // Don't sync - instead force logout to prevent session confusion
        setUser(null);
        setToken(null);
        delete api.defaults.headers.common['Authorization'];

        setTimeout(() => {
          alert('Another user has logged in. You have been logged out.');
          window.location.href = '/';
        }, 100);
      }
      // If user changes in another tab, force logout
      else if (e.key === 'user' && e.newValue && e.oldValue) {
        const oldUser = e.oldValue ? JSON.parse(e.oldValue) : null;
        const newUser = e.newValue ? JSON.parse(e.newValue) : null;

        // If it's a different user (different email), force logout
        if (oldUser && newUser && oldUser.email !== newUser.email) {
          console.log('Storage event: Different user detected, logging out this tab...');
          setUser(null);
          setToken(null);
          delete api.defaults.headers.common['Authorization'];

          setTimeout(() => {
            alert('Another user has logged in. You have been logged out.');
            window.location.href = '/';
          }, 100);
        }
      }
    };

    window.addEventListener('storage', handleStorageChange);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);

  const login = async (email: string, password: string): Promise<string> => {
    try {
      const response = await api.post('/auth/login', { email, password });
      const { token: newToken, user: newUser, redirect } = response.data;

      // Check if user data exists in response
      if (!newUser) {
        throw new Error('Invalid response from server. Please try again.');
      }

      console.log('Login response:', { newUser, redirect, role: newUser.role });

      // Clear all cached data on login to ensure fresh profile data
      cacheService.clear();

      // Check if this is an admin or super admin login
      if (newUser.role === 'admin' || newUser.role === 'super_admin') {
        console.log('Admin detected, redirecting to /admin');
        // Store admin data in both sessionStorage and localStorage for compatibility
        sessionStorage.setItem('admin_token', newToken);
        sessionStorage.setItem('admin', JSON.stringify({
          id: newUser.id,
          name: newUser.name,
          email: newUser.email,
          role: newUser.role,
        }));
        // Also store in localStorage as backup for admin API calls
        localStorage.setItem('token', newToken);
        localStorage.setItem('user', JSON.stringify(newUser));
        
        // IMPORTANT: Set React state so app knows user is logged in
        setToken(newToken);
        setUser(newUser);
        api.defaults.headers.common['Authorization'] = `Bearer ${newToken}`;
        return redirect || '/admin';
      }

      console.log('Regular user login');
      // Regular user login
      setToken(newToken);
      setUser(newUser);
      localStorage.setItem('token', newToken);
      localStorage.setItem('user', JSON.stringify(newUser));
      api.defaults.headers.common['Authorization'] = `Bearer ${newToken}`;

      // Determine redirect path based on user type
      let redirectPath = redirect || '/lawyers'; // Use backend redirect or default

      if (newUser.lawyer) {
        if (newUser.lawyer.status === 'pending') {
          redirectPath = '/pending-approval';
        } else if (newUser.lawyer.status === 'approved') {
          redirectPath = redirect || '/lawyer/dashboard';
        }
      }

      // Fetch complete profile data in the background (non-blocking)
      // This will update the user data with full details after login
      setTimeout(async () => {
        try {
          const profileResponse = await api.get('/auth/profile');
          let completeUser = profileResponse.data.user || profileResponse.data;

          // If user is a lawyer, also fetch their lawyer profile data
          if (completeUser.lawyer) {
            try {
              const lawyerProfileResponse = await api.get('/lawyer/profile');
              const lawyerData = lawyerProfileResponse.data;

              // Merge lawyer profile data
              completeUser = {
                ...completeUser,
                lawyer: {
                  ...lawyerData,
                  ...completeUser.lawyer,
                }
              };
            } catch (lawyerError) {
              console.warn('Failed to fetch lawyer profile details:', lawyerError);
            }
          }

          // Update user with complete data
          setUser(completeUser);
          localStorage.setItem('user', JSON.stringify(completeUser));
        } catch (profileError) {
          console.warn('Failed to fetch complete profile in background:', profileError);
        }
      }, 100);

      return redirectPath;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        // Check for validation errors from Laravel
        const errorData = error.response?.data;
        
        if (errorData?.errors) {
          // Laravel validation errors
          const firstError = Object.values(errorData.errors)[0];
          const errorMessage = Array.isArray(firstError) ? firstError[0] : firstError;
          throw new Error(errorMessage as string);
        }
        
        // Regular error message
        throw new Error(errorData?.message || 'Login failed. Please check your credentials.');
      }
      throw error;
    }
  };

  const register = async (userData: RegisterData) => {
    try {
      const response = await api.post('/auth/register', userData);
      const { token: newToken, user: newUser } = response.data;

      setToken(newToken);
      setUser(newUser);

      localStorage.setItem('token', newToken);
      localStorage.setItem('user', JSON.stringify(newUser));

      api.defaults.headers.common['Authorization'] = `Bearer ${newToken}`;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        throw new Error(error.response?.data?.message || 'Registration failed');
      }
      throw error;
    }
  };

  const logout = () => {
    console.log('Logging out user...');
    // Clear storage and API header first
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    delete api.defaults.headers.common['Authorization'];
    
    // Clean up any page styles that might interfere with navigation
    document.body.style.opacity = '1';
    document.body.style.transition = '';
    
    // Redirect immediately BEFORE React state updates to avoid ProtectedRoute redirect
    window.location.href = '/';
  };

  const updateUser = (userData: Partial<User>) => {
    const updatedUser = { ...user, ...userData } as User;
    setUser(updatedUser);
    localStorage.setItem('user', JSON.stringify(updatedUser));
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        login,
        register,
        logout,
        updateUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};