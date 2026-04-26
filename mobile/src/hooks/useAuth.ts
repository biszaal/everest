import { useAuthStore } from '@/store/authStore';

export const useAuth = () => {
  const status = useAuthStore((s) => s.status);
  const user = useAuthStore((s) => s.user);
  const error = useAuthStore((s) => s.error);
  const bootstrap = useAuthStore((s) => s.bootstrap);
  const reset = useAuthStore((s) => s.reset);

  return { status, user, error, bootstrap, reset };
};
