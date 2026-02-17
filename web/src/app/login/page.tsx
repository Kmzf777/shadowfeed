import { Suspense } from 'react';
import { LoginForm } from './LoginForm';
import { PublicOnlyGuard } from '../../components/PublicOnlyGuard';

export default function LoginPage() {
    return (
        <PublicOnlyGuard>
            <main className="min-h-screen bg-[#0a0a0a] flex items-center justify-center p-4 relative overflow-hidden">
                {/* Background Logo */}
                <div className="fixed inset-0 flex items-center justify-center z-0 pointer-events-none select-none">
                    <div className="relative h-[70vh] w-[70vh] opacity-20">
                        {/* Using standard img tag temporarily if Next.js Image causes issues, but adhering to previous pattern first */}
                        <img
                            src="/logo.png"
                            alt="Shadowfeed Logo"
                            className="object-contain h-full w-full"
                            draggable={false}
                        />
                    </div>
                </div>

                <div className="relative z-10 w-full max-w-md">
                    <Suspense fallback={<div className="text-white">Loading...</div>}>
                        <LoginForm />
                    </Suspense>
                </div>
            </main>
        </PublicOnlyGuard>
    );
}
