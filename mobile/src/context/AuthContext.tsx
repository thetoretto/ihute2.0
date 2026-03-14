import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import type { User } from '../types';
import {
  isApiConfigured,
  login as apiLogin,
  register as apiRegister,
  registerMinimal as apiRegisterMinimal,
  updateUserProfile,
  getProfileComplete,
  getMe,
  sendOtp as apiSendOtp,
  verifyOtp as apiVerifyOtp,
  createUserAfterOtp,
  getStoredAuthToken,
  setStoredAuthToken,
  clearStoredAuthToken,
  setOnUnauthorized,
} from '../services/api';

function isAuthResponse(r: unknown): r is { token: string; user: User } {
  return !!r && typeof r === 'object' && 'token' in r && typeof (r as { token: unknown }).token === 'string' && 'user' in r;
}

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
    avatarUri?: string;
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
        if (!isApiConfigured()) return;
        const token = await getStoredAuthToken();
        if (token) {
          try {
            const me = await getMe();
            if (mounted) setUser(me);
            const complete = await getProfileComplete(me.id);
            if (mounted) setProfileCompleteByUserId((prev) => ({ ...prev, [me.id]: complete }));
          } catch {
            if (mounted) setUser(null);
          }
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
    const result = await apiLogin(email, password);
    if (isAuthResponse(result)) {
      await setStoredAuthToken(result.token);
      setUser(result.user);
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
        const result = await apiRegister(data);
        if (isAuthResponse(result)) {
          await setStoredAuthToken(result.token);
          setUser(result.user);
        }
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
        const result = await apiRegisterMinimal(data);
        if (isAuthResponse(result)) {
          await setStoredAuthToken(result.token);
          setUser(result.user);
        }
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
      const result = await createUserAfterOtp(
        isEmail ? { email: phoneOrEmail.trim() } : { phone: phoneOrEmail.trim() }
      );
      if (isAuthResponse(result)) {
        await setStoredAuthToken(result.token);
        setUser(result.user);
      }
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
      avatarUri?: string;
    }) => {
      if (!user) return;
      const updated = await updateUserProfile(user.id, data);
      setUser(updated);
      setProfileCompleteByUserId((prev) => ({ ...prev, [user.id]: true }));
    },
    [user]
  );

  const logout = useCallback(() => {
    setUser(null);
    void clearStoredAuthToken();
  }, []);

  useEffect(() => {
    setOnUnauthorized(() => logout);
    return () => setOnUnauthorized(null);
  }, [logout]);

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
