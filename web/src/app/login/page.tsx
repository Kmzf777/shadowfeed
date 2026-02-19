import { Suspense } from 'react';
import { LoginForm } from './LoginForm';
import { PublicOnlyGuard } from '../../components/PublicOnlyGuard';

export default function LoginPage() {
    return (
        <PublicOnlyGuard>
            <main className="min-h-screen bg-[#0a0a0a] flex items-center justify-center p-4 relative z-[1]">
                <div className="w-full max-w-md">
                    <Suspense fallback={<div className="text-white">Loading...</div>}>
                        <LoginForm />
                    </Suspense>
                </div>
            </main>
        </PublicOnlyGuard>
    );
}
