'use client';

import { useState, useEffect } from 'react';
import { Settings, Cpu, Zap, Sparkles } from 'lucide-react';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3333';

function getAdminToken(): string {
    if (typeof document === 'undefined') return '';
    const match = document.cookie.match(/(?:^|;)\s*sf-admin-token=([^;]+)/);
    return match ? decodeURIComponent(match[1]) : '';
}

export function LlmSelector() {
    const [provider, setProvider] = useState<'openai' | 'groq' | 'gemini'>('openai');
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        fetch(`${API_BASE}/api/forge-shadowfeed/config`, {
            headers: { 'x-sf-admin-token': getAdminToken() },
        })
            .then((res) => res.json())
            .then((data) => {
                if (data && data.llmProvider) {
                    setProvider(data.llmProvider);
                }
            })
            .catch(console.error)
            .finally(() => setLoading(false));
    }, []);

    async function handleToggle(newProvider: 'openai' | 'groq' | 'gemini') {
        if (newProvider === provider) return;
        setSaving(true);
        try {
            const res = await fetch(`${API_BASE}/api/forge-shadowfeed/config`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'x-sf-admin-token': getAdminToken(),
                },
                body: JSON.stringify({ llmProvider: newProvider }),
            });
            if (res.ok) {
                setProvider(newProvider);
            }
        } catch (e) {
            console.error(e);
        } finally {
            setSaving(false);
        }
    }

    if (loading) return null;

    return (
        <div className="flex items-center gap-2 px-3 py-1.5 bg-[#161616] border border-[#2a2a2a] rounded-[3px]">
            <Settings size={12} className="text-[#808080]" />
            <span className="text-xs font-mono text-[#808080] uppercase mr-2">Engine:</span>

            <div className="flex bg-[#0d0d0d] p-0.5 rounded-[2px] border border-[#1e1e1e]">
                <button
                    onClick={() => handleToggle('openai')}
                    disabled={saving}
                    className={`flex items-center gap-1.5 px-2 py-1 text-[10px] font-mono rounded-[2px] transition-colors ${provider === 'openai'
                            ? 'bg-[#8a00c4]/20 text-[#c084fc]'
                            : 'text-[#4a4a4a] hover:text-[#808080]'
                        }`}
                >
                    <Cpu size={10} />
                    GPT-4.1-Mini
                </button>
                <button
                    onClick={() => handleToggle('groq')}
                    disabled={saving}
                    className={`flex items-center gap-1.5 px-2 py-1 text-[10px] font-mono rounded-[2px] transition-colors ${provider === 'groq'
                            ? 'bg-[#8a00c4]/20 text-[#c084fc]'
                            : 'text-[#4a4a4a] hover:text-[#808080]'
                        }`}
                >
                    <Zap size={10} />
                    LLaMa 3.1
                </button>
                <button
                    onClick={() => handleToggle('gemini')}
                    disabled={saving}
                    className={`flex items-center gap-1.5 px-2 py-1 text-[10px] font-mono rounded-[2px] transition-colors ${provider === 'gemini'
                            ? 'bg-[#8a00c4]/20 text-[#c084fc]'
                            : 'text-[#4a4a4a] hover:text-[#808080]'
                        }`}
                >
                    <Sparkles size={10} />
                    Gemini 2.5
                </button>
            </div>
        </div>
    );
}
