import { supabase } from '@/services/supabase';
import type { AuthUser } from '@/types';

export const authService = {
  getSession: () => supabase.auth.getSession(),

  onAuthStateChange: (cb: (user: AuthUser | null) => void) => {
    const { data } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session?.user) return cb(null);
      cb({ userId: session.user.id, email: session.user.email ?? '' });
    });
    return () => data.subscription.unsubscribe();
  },

  signInAnonymously: async (): Promise<void> => {
    const { error } = await supabase.auth.signInAnonymously();
    if (error) throw error;
  },

  signOut: async (): Promise<void> => {
    await supabase.auth.signOut();
  },
};
