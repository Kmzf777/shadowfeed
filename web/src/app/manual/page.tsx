'use client';

import { ManualNewsForm } from './ManualNewsForm';
import { SetupRequiredGuard } from '../../components/SetupRequiredGuard';

export default function ManualNewsPage() {
    return (
        <SetupRequiredGuard>
            <main className="min-h-screen bg-gray-50 p-8">
                <div className="max-w-7xl mx-auto">
                    <header className="mb-8">
                        <div className="flex items-center gap-3 mb-1">
                            <a
                                href="/"
                                className="text-gray-400 hover:text-gray-600 transition text-sm"
                            >
                                &larr; Voltar
                            </a>
                        </div>
                        <h1 className="text-3xl font-bold text-gray-900">Criar Noticia Manual</h1>
                        <p className="text-gray-500 mt-1">
                            Cole uma URL de blog, Reddit ou Twitter para gerar um post automaticamente.
                        </p>
                    </header>

                    <ManualNewsForm />
                </div>
            </main>
        </SetupRequiredGuard>
    );
}
