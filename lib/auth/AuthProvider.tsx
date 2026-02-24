import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';

import { getDefaultBaseUrl, normalizeBaseUrl } from '@/lib/config';
import { deleteItem, getItem, setItem } from '@/lib/storage';
import { ApiError, apiRequest } from '@/lib/api/http';
import type { LoginResponse, UserProfile } from '@/lib/api/types';

const STORAGE_KEYS = {
  access: 'auth.access',
  refresh: 'auth.refresh',
  baseUrl: 'api.baseUrl',
} as const;

type AuthContextValue = {
  loading: boolean;
  accessToken: string | null;
  refreshToken: string | null;
  profile: UserProfile | null;
  baseUrl: string;
  setBaseUrl: (url: string) => Promise<void>;

  login: (args: { phone: string; password: string }) => Promise<void>;
  logout: () => Promise<void>;
  refreshProfile: () => Promise<UserProfile | null>;

  requestOtp: () => Promise<void>;
  verifyOtp: (code: string) => Promise<void>;
  changePassword: (newPassword: string) => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [loading, setLoading] = useState(true);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [refreshToken, setRefreshToken] = useState<string | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [baseUrl, _setBaseUrl] = useState<string>(getDefaultBaseUrl());

  // Prevent parallel profile fetches on boot.
  const bootstrappedRef = useRef(false);

  useEffect(() => {
    if (bootstrappedRef.current) return;
    bootstrappedRef.current = true;

    (async () => {
      try {
        const storedBaseUrl = await getItem(STORAGE_KEYS.baseUrl);
        if (storedBaseUrl) _setBaseUrl(normalizeBaseUrl(storedBaseUrl));

        const a = await getItem(STORAGE_KEYS.access);
        const r = await getItem(STORAGE_KEYS.refresh);
        if (a) setAccessToken(a);
        if (r) setRefreshToken(r);

        if (a) {
          try {
            await fetchProfile({ token: a, currentBaseUrl: storedBaseUrl ?? baseUrl });
          } catch {
            // Stored token is stale or server unreachable — clear tokens so
            // AuthGate redirects to login instead of getting stuck.
            setAccessToken(null);
            setRefreshToken(null);
            setProfile(null);
            await deleteItem(STORAGE_KEYS.access);
            await deleteItem(STORAGE_KEYS.refresh);
          }
        }
      } finally {
        setLoading(false);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function fetchProfile(args: { token: string; currentBaseUrl?: string }) {
    const currentBaseUrl = args.currentBaseUrl ? normalizeBaseUrl(args.currentBaseUrl) : baseUrl;
    const p = await apiRequest<UserProfile>({
      baseUrl: currentBaseUrl,
      path: '/api/auth/profile/',
      method: 'GET',
      token: args.token,
    });
    setProfile(p);
    return p;
  }

  const logout = useCallback(async () => {
    setAccessToken(null);
    setRefreshToken(null);
    setProfile(null);
    await deleteItem(STORAGE_KEYS.access);
    await deleteItem(STORAGE_KEYS.refresh);
  }, []);

  const value = useMemo<AuthContextValue>(() => {
    return {
      loading,
      accessToken,
      refreshToken,
      profile,
      baseUrl,

      setBaseUrl: async (url: string) => {
        const normalized = normalizeBaseUrl(url);
        _setBaseUrl(normalized);
        try {
          await setItem(STORAGE_KEYS.baseUrl, normalized);
        } catch {
          // storage unavailable — URL won't persist across refresh
        }
      },

      login: async ({ phone, password }) => {
        const resp = await apiRequest<LoginResponse>({
          baseUrl,
          path: '/api/auth/login/',
          method: 'POST',
          body: { phone, password },
        });
        setAccessToken(resp.access);
        setRefreshToken(resp.refresh);

        // Persist tokens — best-effort; storage may fail on web/emulators
        // but tokens are already in React state so login can proceed.
        try {
          await setItem(STORAGE_KEYS.access, resp.access);
          await setItem(STORAGE_KEYS.refresh, resp.refresh);
        } catch {
          // storage unavailable — session won't survive refresh but login still works
        }

        await fetchProfile({ token: resp.access });
      },

      logout,

      refreshProfile: async () => {
        if (!accessToken) {
          setProfile(null);
          return null;
        }
        try {
          return await fetchProfile({ token: accessToken });
        } catch (e) {
          // If token expired/invalid, force logout.
          if (e instanceof ApiError && e.status === 401) {
            await logout();
            return null;
          }
          throw e;
        }
      },

      requestOtp: async () => {
        if (!accessToken) throw new Error('Not authenticated');
        await apiRequest<{ status: string; expires_in_seconds: number }>({
          baseUrl,
          path: '/api/auth/request-otp/',
          method: 'POST',
          token: accessToken,
          body: {},
        });
      },

      verifyOtp: async (code: string) => {
        if (!accessToken) throw new Error('Not authenticated');
        await apiRequest<{ status: string }>({
          baseUrl,
          path: '/api/auth/verify-otp/',
          method: 'POST',
          token: accessToken,
          body: { code },
        });
        await fetchProfile({ token: accessToken });
      },

      changePassword: async (newPassword: string) => {
        if (!accessToken) throw new Error('Not authenticated');
        await apiRequest<{ status: string }>({
          baseUrl,
          path: '/api/auth/change-password/',
          method: 'POST',
          token: accessToken,
          body: { new_password: newPassword },
        });
        await fetchProfile({ token: accessToken });
      },
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loading, accessToken, refreshToken, profile, baseUrl, logout]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

