'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth';

export default function IndexPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;
    router.replace(user ? '/home' : '/login');
  }, [user, loading, router]);

  return (
    <div style={{ padding: 40, textAlign: 'center' }} className="muted">
      Carregando…
    </div>
  );
}
