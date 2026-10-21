'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth';
import { Skeleton } from '@/components/ui/skeleton';

export default function IndexPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;
    router.replace(user ? '/home' : '/login');
  }, [user, loading, router]);

  return (
    <div className="flex justify-center p-10" role="status" aria-label="Carregando">
      <Skeleton className="h-6 w-32" />
    </div>
  );
}
