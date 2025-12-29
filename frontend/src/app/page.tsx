'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { LoadingScreen } from '@/components/ui/Loading';

export default function HomePage() {
  const router = useRouter();

  useEffect(() => {
    // Check auth status and redirect
    const checkAuth = async () => {
      // TODO: Check Supabase session
      const isAuthenticated = false; // placeholder

      if (isAuthenticated) {
        router.replace('/dashboard');
      } else {
        router.replace('/login');
      }
    };

    checkAuth();
  }, [router]);

  return <LoadingScreen message="Iniciando YOUMOVE..." />;
}
