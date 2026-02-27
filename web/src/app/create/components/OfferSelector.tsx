'use client';

import { Package, Check, ShoppingBag, MessageCircle, Link as LinkIcon, Mail, Phone } from 'lucide-react';

export interface Offer {
    name: string;
    type: string;
    main_benefit: string;
    price_range: string;
    purchase_method: string;
    cta_keyword: string;
    is_primary: boolean;
}

interface OfferSelectorProps {
    offers: Offer[];
    selectedIndex: number | null;
    onSelect: (index: number) => void;
}

const METHOD_ICONS: Record<string, typeof MessageCircle> = {
    direct_message: MessageCircle,
    link_bio: LinkIcon,
    checkout: ShoppingBag,
    whatsapp: Phone,
    email: Mail,
};

const METHOD_LABELS: Record<string, string> = {
    direct_message: 'DM',
    link_bio: 'Link na bio',
    checkout: 'Checkout',
    whatsapp: 'WhatsApp',
    email: 'E-mail',
};

export function OfferSelector({ offers, selectedIndex, onSelect }: OfferSelectorProps) {
    if (!offers || offers.length === 0) {
        return (
            <div className="bg-[#161616] border border-[#1e1e1e] rounded p-4 text-center">
                <Package size={24} className="mx-auto text-[#4a4a4a] mb-2" />
                <p className="text-[#808080] text-xs font-mono">No offers configured</p>
                <p className="text-[#4a4a4a] text-[10px] font-mono mt-1">Add offers in your profile setup to use Product Mode</p>
            </div>
        );
    }

    return (
        <div className="space-y-2">
            <label className="text-[#808080] text-xs font-mono uppercase mb-1 block">Select Offer</label>
            {offers.map((offer, idx) => {
                const isSelected = selectedIndex === idx;
                const MethodIcon = METHOD_ICONS[offer.purchase_method] || ShoppingBag;
                return (
                    <div
                        key={idx}
                        onClick={() => onSelect(idx)}
                        className={`p-3 border rounded cursor-pointer transition-all ${isSelected
                            ? 'bg-[#8a00c4]/10 border-[#8a00c4] shadow-[0_0_10px_rgba(138,0,196,0.15)]'
                            : 'bg-[#0a0a0a] border-[#1e1e1e] hover:border-[#2a2a2a]'
                            }`}
                    >
                        <div className="flex items-start gap-3">
                            <div className={`w-5 h-5 rounded border flex items-center justify-center flex-shrink-0 mt-0.5 ${isSelected ? 'bg-[#8a00c4] border-[#8a00c4]' : 'bg-[#161616] border-[#2a2a2a]'}`}>
                                {isSelected && <Check size={12} className="text-white" />}
                            </div>
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2">
                                    <h4 className="text-[#d4d4d4] font-bold text-sm truncate">{offer.name}</h4>
                                    {offer.is_primary && (
                                        <span className="text-[8px] bg-[#8a00c4]/20 text-[#c084fc] px-1.5 py-0.5 rounded font-mono uppercase flex-shrink-0">Primary</span>
                                    )}
                                </div>
                                <p className="text-[#808080] text-xs mt-0.5 truncate">{offer.main_benefit}</p>
                                <div className="flex items-center gap-3 mt-2">
                                    <span className="text-[10px] bg-[#161616] border border-[#2a2a2a] px-1.5 py-0.5 rounded text-[#4a4a4a] uppercase">{offer.type}</span>
                                    <span className="text-[10px] text-[#4a4a4a] flex items-center gap-1">
                                        <MethodIcon size={10} />
                                        {METHOD_LABELS[offer.purchase_method] || offer.purchase_method}
                                    </span>
                                    {offer.cta_keyword && (
                                        <span className="text-[10px] text-[#8a00c4] font-mono font-bold">#{offer.cta_keyword.toUpperCase()}</span>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                );
            })}
        </div>
    );
}
