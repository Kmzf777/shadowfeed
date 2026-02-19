'use client';

export interface Offer {
    name: string;
    type: string;
    main_benefit: string;
    price_range: string;
    purchase_method: string;
    cta_keyword: string;
    is_primary: boolean;
}

interface OfferCardProps {
    offer: Offer;
    index: number;
    onChange: (index: number, field: keyof Offer, value: string | boolean) => void;
    onRemove: (index: number) => void;
    canRemove: boolean;
}

const OFFER_TYPES = [
    'Curso online',
    'Mentoria',
    'Consultoria',
    'Produto físico',
    'Software / SaaS',
    'Serviço freelance',
    'E-book / Infoproduto',
    'Comunidade / Membership',
    'Evento / Workshop',
    'Outro',
];

const PRICE_RANGES = [
    { value: 'free', label: 'Gratuito' },
    { value: 'low', label: 'Até R$ 200' },
    { value: 'mid', label: 'R$ 200 – R$ 1.000' },
    { value: 'high', label: 'R$ 1.000 – R$ 5.000' },
    { value: 'premium', label: 'Acima de R$ 5.000' },
];

const PURCHASE_METHODS = [
    { value: 'direct_message', label: 'Direct / DM' },
    { value: 'link_bio', label: 'Link na bio' },
    { value: 'checkout', label: 'Checkout direto' },
    { value: 'whatsapp', label: 'WhatsApp' },
    { value: 'email', label: 'E-mail' },
];

const inputClass =
    "w-full px-4 py-3 rounded-[3px] bg-[#0f0f0f] text-white border border-white/[0.12] focus:border-[#8a00c4] focus:ring-2 focus:ring-[#8a00c4]/20 outline-none transition font-['DM_Sans'] text-sm placeholder:text-white/[0.35]";

const labelClass = "font-['DM_Sans'] font-semibold text-white/80 text-xs mb-1.5 block";

export function OfferCard({ offer, index, onChange, onRemove, canRemove }: OfferCardProps) {
    return (
        <div className="rounded-[3px] border border-white/[0.12] bg-[#161616] p-5 flex flex-col gap-4 relative">
            {/* Header */}
            <div className="flex items-center justify-between mb-1">
                <span className="font-['Sora'] font-semibold text-white text-sm">
                    Oferta {index + 1}
                </span>
                <div className="flex items-center gap-3">
                    <label className="flex items-center gap-2 cursor-pointer">
                        <input
                            type="checkbox"
                            checked={offer.is_primary}
                            onChange={(e) => onChange(index, 'is_primary', e.target.checked)}
                            className="w-4 h-4 accent-[#8a00c4] cursor-pointer"
                        />
                        <span className="font-['DM_Sans'] text-white/50 text-xs">Principal</span>
                    </label>
                    {canRemove && (
                        <button
                            type="button"
                            onClick={() => onRemove(index)}
                            className="text-white/30 hover:text-red-400 transition"
                            title="Remover oferta"
                        >
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    )}
                </div>
            </div>

            {/* Name */}
            <div>
                <label className={labelClass}>Nome da oferta *</label>
                <input
                    type="text"
                    value={offer.name}
                    onChange={(e) => onChange(index, 'name', e.target.value)}
                    placeholder="Ex: Mentoria 1:1 Aceleração de Carreira"
                    className={inputClass}
                    maxLength={120}
                />
            </div>

            {/* Type */}
            <div>
                <label className={labelClass}>Tipo de oferta *</label>
                <select
                    value={offer.type}
                    onChange={(e) => onChange(index, 'type', e.target.value)}
                    className={`${inputClass} cursor-pointer`}
                >
                    <option value="">Selecione o tipo</option>
                    {OFFER_TYPES.map((t) => (
                        <option key={t} value={t}>
                            {t}
                        </option>
                    ))}
                </select>
            </div>

            {/* Main Benefit */}
            <div>
                <label className={labelClass}>Benefício principal *</label>
                <input
                    type="text"
                    value={offer.main_benefit}
                    onChange={(e) => onChange(index, 'main_benefit', e.target.value)}
                    placeholder="Ex: Dobrar o faturamento em 90 dias"
                    className={inputClass}
                    maxLength={160}
                />
            </div>

            {/* Price Range */}
            <div>
                <label className={labelClass}>Faixa de preço</label>
                <div className="flex flex-wrap gap-2">
                    {PRICE_RANGES.map((pr) => (
                        <button
                            key={pr.value}
                            type="button"
                            onClick={() => onChange(index, 'price_range', pr.value)}
                            className={`px-3 py-1.5 rounded-[3px] text-xs font-['DM_Sans'] font-medium border transition ${offer.price_range === pr.value
                                    ? 'border-[#8a00c4] bg-[#8a00c4]/15 text-[#b44cff]'
                                    : 'border-white/[0.12] bg-transparent text-white/60 hover:border-white/30'
                                }`}
                        >
                            {pr.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* Purchase Method */}
            <div>
                <label className={labelClass}>Método de compra</label>
                <div className="flex flex-wrap gap-2">
                    {PURCHASE_METHODS.map((pm) => (
                        <button
                            key={pm.value}
                            type="button"
                            onClick={() => onChange(index, 'purchase_method', pm.value)}
                            className={`px-3 py-1.5 rounded-[3px] text-xs font-['DM_Sans'] font-medium border transition ${offer.purchase_method === pm.value
                                    ? 'border-[#8a00c4] bg-[#8a00c4]/15 text-[#b44cff]'
                                    : 'border-white/[0.12] bg-transparent text-white/60 hover:border-white/30'
                                }`}
                        >
                            {pm.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* CTA Keyword */}
            <div>
                <label className={labelClass}>Palavra-chave de CTA</label>
                <input
                    type="text"
                    value={offer.cta_keyword}
                    onChange={(e) => onChange(index, 'cta_keyword', e.target.value.replace(/\s/g, ''))}
                    placeholder="Ex: MENTORIA"
                    className={`${inputClass} uppercase`}
                    maxLength={30}
                />
                {offer.cta_keyword && (
                    <div className="mt-2 px-4 py-2 rounded-[3px] bg-[#8a00c4]/10 border border-[#8a00c4]/30">
                        <span className="font-['DM_Sans'] text-white/50 text-xs">Preview: </span>
                        <span className="font-['DM_Sans'] text-[#b44cff] text-xs font-semibold">
                            &quot;Comenta {offer.cta_keyword.toUpperCase()} que te mando no direct 📩&quot;
                        </span>
                    </div>
                )}
            </div>
        </div>
    );
}
