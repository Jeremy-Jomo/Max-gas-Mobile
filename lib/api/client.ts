import { useCallback } from 'react';

import { apiRequest, ApiError } from '@/lib/api/http';
import { useAuth } from '@/lib/auth/AuthProvider';

export function useApi() {
  const { baseUrl, accessToken, logout } = useAuth();

  const request = useCallback(
    async <T,>(args: Omit<Parameters<typeof apiRequest<T>>[0], 'baseUrl' | 'token'> & { auth?: boolean }) => {
      try {
        return await apiRequest<T>({
          baseUrl,
          token: args.auth === false ? null : accessToken,
          ...args,
        });
      } catch (e) {
        if (e instanceof ApiError && e.status === 401) {
          await logout();
        }
        throw e;
      }
    },
    [accessToken, baseUrl, logout]
  );

  return { request };
}

