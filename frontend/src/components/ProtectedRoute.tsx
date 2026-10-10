import { ReactNode, useEffect, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { authApi, User } from '../api/auth';

import { AppContext, resolveAppContext } from '../utils/resolver';

interface ProtectedRouteProps {
  children: ReactNode;
  requireAdmin?: boolean; // Means SUPERADMIN
  requireManagement?: boolean; // Means ADMIN or SUPERADMIN
  requireOperator?: boolean; // Means OPERATOR or ADMIN or SUPERADMIN
  requireCourier?: boolean; // Means COURIER or ADMIN or SUPERADMIN
}

export const ProtectedRoute = ({ 
  children, 
  requireAdmin = false, 
  requireManagement = false,
  requireOperator = false,
  requireCourier = false
}: ProtectedRouteProps) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const location = useLocation();
  const token = localStorage.getItem('token');
  const appContext = resolveAppContext();

  useEffect(() => {
    if (!token) {
      setLoading(false);
      return;
    }

    authApi.getMe()
      .then(setUser)
      .catch(() => {
        localStorage.removeItem('token');
        setUser(null);
      })
      .finally(() => setLoading(false));
  }, [token]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!token || !user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  const isSuperadmin = user.is_superuser || user.roles.some(r => r.name === 'SUPERADMIN');
  const isAdmin = user.roles.some(r => r.name === 'ADMIN');
  const isOperator = user.roles.some(r => r.name === 'OPERATOR');
  const isCourier = user.roles.some(r => r.name === 'COURIER');
  
  const hasManagementAccess = isSuperadmin || isAdmin;

  // Context-Role Validation (Requirement 4: Explicit boundaries)
  if (appContext === AppContext.SUPERADMIN && !isSuperadmin) {
    return <Navigate to="/login" replace />;
  }

  if (appContext === AppContext.ADMIN && !hasManagementAccess) {
    return <Navigate to="/login" replace />;
  }

  if (appContext === AppContext.OPERATOR && !isOperator && !hasManagementAccess) {
    return <Navigate to="/login" replace />;
  }

  if (appContext === AppContext.COURIER && !isCourier) {
    // Only COURIER role allowed on courier domain as per Step 6 Req 4
    return <Navigate to="/login" replace />;
  }

  if (requireAdmin && !isSuperadmin) {
    return <Navigate to="/" replace />;
  }

  if (requireManagement && !hasManagementAccess) {
    return <Navigate to="/" replace />;
  }

  if (requireOperator && !isOperator && !hasManagementAccess) {
    return <Navigate to="/" replace />;
  }

  if (requireCourier && !isCourier) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
};
