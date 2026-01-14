'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { isAuthenticated, getCurrentUser } from '@/utils/auth';
import { hasPermission } from '@/utils/permissions';
import LoadingSpinner from './LoadingSpinner';

export default function ProtectedRoute({ 
  children, 
  requiredPermission = null,
  requiredRole = null,
  fallback = null 
}) {
  const router = useRouter();
  const user = getCurrentUser();

  useEffect(() => {
    if (!isAuthenticated()) {
      router.push('/login');
    }
  }, [router]);

  if (!isAuthenticated()) {
    return <LoadingSpinner fullScreen />;
  }

  if (requiredRole && user?.role !== requiredRole) {
    if (fallback) return fallback;
    router.push('/dashboard');
    return <LoadingSpinner fullScreen />;
  }

  if (requiredPermission && !hasPermission(user, requiredPermission)) {
    if (fallback) return fallback;
    return (
      <div className="container-fluid px-3 py-4">
        <div className="card">
          <div className="card-body text-center py-5">
            <h5 className="text-danger mb-3">Access Denied</h5>
            <p className="text-muted">
              You don't have permission to access this page.
            </p>
            <button 
              className="btn btn-primary"
              onClick={() => router.push('/dashboard')}
            >
              Go to Dashboard
            </button>
          </div>
        </div>
      </div>
    );
  }

  return children;
}

