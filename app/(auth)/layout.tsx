import { Suspense } from 'react';
import { LoadingPage } from '@/components/LoadingSpinner';

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <Suspense fallback={<LoadingPage />}>
      {children}
    </Suspense>
  );
}
