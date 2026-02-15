import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';

/**
 * Hook para proteger rotas que exigem setup completo
 * Redireciona para /setup se o usuário está logado mas não completou o setup
 */
export function useSetupProtection() {
  const router = useRouter();
  const { user, userProfile, loading } = useAuth();

  useEffect(() => {
    // Aguardar carregamento
    if (loading) return;

    // Se está logado e setup não está completo, redirecionar para /setup
    if (user && userProfile && !userProfile.setup_completed) {
      console.log('[SETUP-PROTECTION] User setup incomplete, redirecting to /setup');
      router.push('/setup');
    }
  }, [user, userProfile, loading, router]);

  return {
    loading,
    isSetupComplete: userProfile?.setup_completed ?? false,
    shouldRedirect: user && userProfile && !userProfile.setup_completed,
  };
}
