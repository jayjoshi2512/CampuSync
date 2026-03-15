// frontend/src/components/ProtectedRoute.tsx
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuthStore } from '@/store/authStore';

interface ProtectedRouteProps {
  allowedRoles: string[];
  redirectTo?: string;
}

export default function ProtectedRoute({ allowedRoles, redirectTo = '/' }: ProtectedRouteProps) {
  const { isAuthenticated, role } = useAuthStore();
  const location = useLocation();

  if (!isAuthenticated) {
    return <Navigate to={redirectTo} state={{ from: location }} replace />;
  }

  if (!allowedRoles.includes(role || '')) {
    return <Navigate to={redirectTo} replace />;
  }

  return <Outlet />;
}
