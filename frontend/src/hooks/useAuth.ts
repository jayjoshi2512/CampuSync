// frontend/src/hooks/useAuth.ts
import { useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/store/authStore';

export function useAuth(requiredRole?: string) {
  const { isAuthenticated, role, actor, clearAuth } = useAuthStore();
  const navigate = useNavigate();

  useEffect(() => {
    if (requiredRole && (!isAuthenticated || role !== requiredRole)) {
      navigate(requiredRole === 'super_admin' ? '/super-admin' : '/login', { replace: true });
    }
  }, [isAuthenticated, role, requiredRole, navigate]);

  const logout = useCallback(() => {
    clearAuth();
    navigate('/');
  }, [clearAuth, navigate]);

  const isDemo = useAuthStore((s) => s.token?.startsWith('demo_'));

  return { isAuthenticated, role, actor, logout, isDemo };
}
