import { create } from 'zustand';
import { authService } from '@/services/auth';
import type { AuthUser } from '@/types';

type Status = 'loading' | 'authed' | 'error';

interface AuthState {
  status: Status;
  user: AuthUser | null;
  error: string | null;
  bootstrap: () => Promise<void>;
  reset: () => Promise<void>;
}

let unsubscribe: (() => void) | null = null;

const sessionUserToAuthUser = (user: { id: string; email?: string | null } | undefined): AuthUser | null =>
  user ? { userId: user.id, email: user.email ?? '' } : null;

export const useAuthStore = create<AuthState>((set) => ({
  status: 'loading',
  user: null,
  error: null,

  bootstrap: async () => {
    try {
      const { data } = await authService.getSession();
      if (data.session?.user) {
        set({ status: 'authed', user: sessionUserToAuthUser(data.session.user), error: null });
      } else {
        await authService.signInAnonymously();
        const { data: fresh } = await authService.getSession();
        if (!fresh.session?.user) throw new Error('Anonymous sign-in did not yield a session');
        set({ status: 'authed', user: sessionUserToAuthUser(fresh.session.user), error: null });
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Could not start session';
      set({ status: 'error', user: null, error: msg });
    }

    unsubscribe?.();
    unsubscribe = authService.onAuthStateChange((user) => {
      if (user) set({ status: 'authed', user, error: null });
    });
  },

  reset: async () => {
    await authService.signOut();
    set({ status: 'loading', user: null });
    try {
      await authService.signInAnonymously();
      const { data } = await authService.getSession();
      set({ status: 'authed', user: sessionUserToAuthUser(data.session?.user), error: null });
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Reset failed';
      set({ status: 'error', user: null, error: msg });
    }
  },
}));
