import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import type { User } from '../types';
import {
  login as apiLogin,
  register as apiRegister,
  registerMinimal as apiRegisterMinimal,
  updateUserProfile,
  getUser,
  getProfileComplete,
  sendOtp as apiSendOtp,
  verifyOtp as apiVerifyOtp,
  createUserAfterOtp,
} from '../services/api';
import { getMockStore, updateMockStore } from '../services/api';

interface AuthContextValue {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  /** True when user has completed profile. Required to use main app. */
  isProfileComplete: boolean;
  sendOtp: (phoneOrEmail: string) => Promise<void>;
  verifyOtpAndRegister: (phoneOrEmail: string, code: string) => Promise<void>;
  login: (email: string, password: string) => Promise<void>;
  register: (data: {
    name: string;
    email: string;
    phone: string;
    password: string;
    role: 'passenger' | 'driver' | 'agency';
  }) => Promise<void>;
  registerMinimal: (data: {
    name: string;
    phone: string;
    email?: string;
    role: 'passenger' | 'driver' | 'agency';
  }) => Promise<void>;
  updateProfile: (data: {
    name?: string;
    role?: 'passenger' | 'driver' | 'agency';
    email?: string;
    phone?: string;
    password?: string;
  }) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profileCompleteByUserId, setProfileCompleteByUserId] = useState<Record<string, boolean>>({});
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    const restoreSession = async () => {
      try {
        const store = await getMockStore();
        if (store.authUserId) {
          const existing = await getUser(store.authUserId);
          if (mounted) setUser(existing);
          const complete = await getProfileComplete(store.authUserId);
          if (mounted) setProfileCompleteByUserId((prev) => ({ ...prev, [store.authUserId]: complete }));
        } else if (store.profileCompleteByUserId && mounted) {
          setProfileCompleteByUserId(store.profileCompleteByUserId);
        }
      } finally {
        if (mounted) {
          setIsLoading(false);
        }
      }
    };
    void restoreSession();
    return () => {
      mounted = false;
    };
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    setIsLoading(true);
    try {
      const u = await apiLogin(email, password);
      setUser(u);
      await updateMockStore({ authUserId: u.id });
    } finally {
      setIsLoading(false);
    }
  }, []);

  const register = useCallback(
    async (data: {
      name: string;
      email: string;
      phone: string;
      password: string;
      role: 'passenger' | 'driver' | 'agency';
    }) => {
      setIsLoading(true);
      try {
        const u = await apiRegister(data);
        setUser(u);
        await updateMockStore({ authUserId: u.id });
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  const registerMinimal = useCallback(
    async (data: {
      name: string;
      phone: string;
      email?: string;
      role: 'passenger' | 'driver' | 'agency';
    }) => {
      setIsLoading(true);
      try {
        const u = await apiRegisterMinimal(data);
        setUser(u);
        await updateMockStore({ authUserId: u.id });
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  const sendOtp = useCallback(async (phoneOrEmail: string) => {
    await apiSendOtp(phoneOrEmail);
  }, []);

  const verifyOtpAndRegister = useCallback(async (phoneOrEmail: string, code: string) => {
    setIsLoading(true);
    try {
      const ok = await apiVerifyOtp(phoneOrEmail, code);
      if (!ok) throw new Error('Invalid or expired code.');
      const isEmail = phoneOrEmail.trim().includes('@');
      const u = await createUserAfterOtp(
        isEmail ? { email: phoneOrEmail.trim() } : { phone: phoneOrEmail.trim() }
      );
      setUser(u);
      await updateMockStore({ authUserId: u.id });
    } finally {
      setIsLoading(false);
    }
  }, []);

  const updateProfile = useCallback(
    async (data: {
      name?: string;
      role?: 'passenger' | 'driver' | 'agency';
      email?: string;
      phone?: string;
      password?: string;
    }) => {
      if (!user) return;
      const updated = await updateUserProfile(user.id, data);
      setUser(updated);
      setProfileCompleteByUserId((prev) => ({ ...prev, [user.id]: true }));
      const store = await getMockStore();
      await updateMockStore({
        profileCompleteByUserId: {
          ...store.profileCompleteByUserId,
          [user.id]: true,
        },
      });
    },
    [user]
  );

  const logout = useCallback(() => {
    setUser(null);
    void updateMockStore({ authUserId: null });
  }, []);

  const isProfileComplete =
    !!user &&
    (profileCompleteByUserId[user.id] === true ||
      (profileCompleteByUserId[user.id] === undefined && !user.email.startsWith('phone-')));

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isAuthenticated: !!user,
        isProfileComplete,
        sendOtp,
        verifyOtpAndRegister,
        login,
        register,
        registerMinimal,
        updateProfile,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
