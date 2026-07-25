import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: string[];
}

export default function ProtectedRoute({ children, allowedRoles }: ProtectedRouteProps) {
  const { user, profile, loading } = useAuthStore();

  if (loading) {
    return (
      <div className="min-h-screen flex justify-center items-center bg-gov-light">
        <div className="flex flex-col items-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-gov-green"></div>
          <p className="text-sm font-bold text-gov-green">Memuat data SIPOPAY...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && profile && !allowedRoles.includes(profile.role)) {
    console.warn(`Akses ditolak: User dengan role "${profile.role}" mencoba mengakses halaman terproteksi.`);
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}
