'use client';

export type AwarenessLevel =
    | 'unaware'
    | 'problem_aware'
    | 'solution_aware'
    | 'brand_aware'
    | 'most_aware';

interface AwarenessOption {
    value: AwarenessLevel;
    emoji: string;
    label: string;
    description: string;
}

const AWARENESS_OPTIONS: AwarenessOption[] = [
    {
        value: 'unaware',
        emoji: '🌑',
        label: 'Inconsciente',
        description: 'Não sabe que tem um problema. Precisa ser educado antes de tudo.',
    },
    {
        value: 'problem_aware',
        emoji: '🌒',
        label: 'Consciente do Problema',
        description: 'Sabe que sofre, mas não conhece soluções. Responde a conteúdo que valida a dor.',
    },
    {
        value: 'solution_aware',
        emoji: '🌓',
        label: 'Consciente da Solução',
        description: 'Conhece soluções que existem, mas não te conhece. Quer comparar e entender.',
    },
    {
        value: 'brand_aware',
        emoji: '🌔',
        label: 'Consciente da Marca',
        description: 'Já te conhece, mas ainda não comprou. Precisa de prova, confiança e empurrão.',
    },
    {
        value: 'most_aware',
        emoji: '🌕',
        label: 'Totalmente Consciente',
        description: 'Já quer comprar. Está esperando a oferta certa e o momento ideal.',
    },
];

interface AwarenessSelectorProps {
    value: AwarenessLevel;
    onChange: (value: AwarenessLevel) => void;
}

export function AwarenessSelector({ value, onChange }: AwarenessSelectorProps) {
    return (
        <div className="flex flex-col gap-3">
            {AWARENESS_OPTIONS.map((option) => {
                const isSelected = value === option.value;
                return (
                    <button
                        key={option.value}
                        type="button"
                        onClick={() => onChange(option.value)}
                        className={`w-full text-left p-4 rounded-[3px] border-2 transition-all flex items-start gap-4 ${isSelected
                                ? 'border-[#8a00c4] bg-[#8a00c4]/10'
                                : 'border-white/[0.1] bg-[#161616] hover:border-white/[0.25] hover:bg-[#1c1c1c]'
                            }`}
                    >
                        <span className="text-2xl flex-shrink-0 mt-0.5">{option.emoji}</span>
                        <div>
                            <div
                                className={`font-['DM_Sans'] font-semibold text-sm mb-0.5 ${isSelected ? 'text-[#b44cff]' : 'text-white'
                                    }`}
                            >
                                {option.label}
                            </div>
                            <div className="font-['DM_Sans'] text-white/50 text-xs leading-relaxed">
                                {option.description}
                            </div>
                        </div>
                        {isSelected && (
                            <div className="ml-auto flex-shrink-0 mt-0.5">
                                <div className="w-5 h-5 rounded-full bg-[#8a00c4] flex items-center justify-center">
                                    <svg
                                        className="w-3 h-3 text-white"
                                        fill="none"
                                        viewBox="0 0 24 24"
                                        stroke="currentColor"
                                        strokeWidth={3}
                                    >
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                    </svg>
                                </div>
                            </div>
                        )}
                    </button>
                );
            })}
        </div>
    );
}
