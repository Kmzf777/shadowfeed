'use client';

import { useEffect, useState, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { loadStripe } from '@stripe/stripe-js';
import {
    EmbeddedCheckoutProvider,
    EmbeddedCheckout,
} from '@stripe/react-stripe-js';
import { X, Loader2 } from 'lucide-react';
import Image from 'next/image';

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || 'pk_test_51T1WJ9PAzHYKGabao41V2Wwb030S5X0nWvoJpNIZDqbQ1XBf3ZTjVgpPvrOYHTP0vDJZrRMUXQttmAwDwh7rHKRiqr00VfGP34fn');

interface CheckoutModalProps {
    isOpen: boolean;
    onClose: () => void;
    clientSecret: string | null;
}

export function CheckoutModal({ isOpen, onClose, clientSecret }: CheckoutModalProps) {
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
        return () => setMounted(false);
    }, []);

    // Lock body scroll when modal is open
    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'unset';
        }
        return () => {
            document.body.style.overflow = 'unset';
        };
    }, [isOpen]);

    useEffect(() => {
        // No debug logs here
    }, [clientSecret]);

    const options = useMemo(() => {
        if (!clientSecret) return null;
        return {
            clientSecret,
            onComplete: onClose,
        };
    }, [clientSecret, onClose]);

    if (!mounted || !isOpen || !clientSecret || !options) return null;

    return createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-200">

            {/* Modal Container */}
            <div className="relative w-full max-w-4xl h-[85vh] bg-[#0a0a0a] border border-white/10 rounded-xl shadow-[0_0_50px_rgba(138,0,196,0.2)] flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">

                {/* Header */}
                <div className="relative flex flex-col items-center justify-center p-6 border-b border-white/10 bg-[#0a0a0a] z-10 shrink-0">
                    <button
                        onClick={onClose}
                        className="absolute right-4 top-4 p-2 text-white/50 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
                    >
                        <X className="w-5 h-5" />
                    </button>

                    <div className="relative w-32 h-8 mb-4">
                        <Image
                            src="/logo.png"
                            alt="Shadowfeed"
                            fill
                            className="object-contain"
                            priority
                        />
                    </div>

                    <h3 className="text-lg font-bold font-['Sora'] text-white">Complete Subscription</h3>
                </div>

                {/* Stripe Checkout Body */}
                <div className="flex-1 w-full bg-[#0a0a0a] relative flex flex-col overflow-y-auto">
                    <EmbeddedCheckoutProvider
                        stripe={stripePromise}
                        options={options}
                    >
                        <EmbeddedCheckout className="w-full" />
                    </EmbeddedCheckoutProvider>
                </div>
            </div>
        </div>,
        document.body
    );
}
