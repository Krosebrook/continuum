'use client';

import { useEffect, useRef } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/lib/hooks/useAuth';
import { LoadingSpinner } from './LoadingSpinner';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requireAuth?: boolean;
}

export function ProtectedRoute({ children, requireAuth = true }: ProtectedRouteProps) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const hasRedirected = useRef(false);

  useEffect(() => {
    if (!loading && requireAuth && !user && !hasRedirected.current) {
      // Not authenticated, redirect to login
      hasRedirected.current = true;
      router.push(`/login?redirect=${encodeURIComponent(pathname)}`);
    }
  }, [user, loading, requireAuth, router, pathname]);

  // Show loading state while auth is being checked
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <LoadingSpinner />
          <p className="mt-4 text-sm text-gray-500">Loading...</p>
        </div>
      </div>
    );
  }

  // Don't render protected content if user is not authenticated
  if (requireAuth && !user) {
    return null;
  }

  return <>{children}</>;
}

export default ProtectedRoute;
