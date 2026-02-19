import { ButtonHTMLAttributes, forwardRef } from 'react';
import { cn } from '../../lib/utils';
import { Loader2 } from 'lucide-react';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
    size?: 'sm' | 'md' | 'lg' | 'icon';
    isLoading?: boolean;
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
    ({ className, variant = 'primary', size = 'md', isLoading, children, disabled, ...props }, ref) => {
        return (
            <button
                ref={ref}
                disabled={disabled || isLoading}
                className={cn(
                    'inline-flex items-center justify-center rounded-[3px] font-mono text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#8a00c4] disabled:pointer-events-none disabled:opacity-50 select-none',
                    {
                        // Variants
                        'bg-[#8a00c4] text-white hover:bg-[#9d00de] shadow-[0_0_20px_rgba(138,0,196,0.25)] border border-transparent': variant === 'primary',
                        'bg-[#1c1c1c] text-[#d4d4d4] hover:bg-[#242424] border border-[#2a2a2a]': variant === 'secondary',
                        'bg-transparent border border-[#2a2a2a] text-[#d4d4d4] hover:border-[#8a00c4] hover:text-[#c084fc]': variant === 'outline',
                        'bg-transparent hover:bg-[#1c1c1c] text-[#808080] hover:text-[#d4d4d4]': variant === 'ghost',
                        'bg-[#1a0707] text-[#f87171] border border-[#4a1a1a] hover:bg-[#2a0a0a]': variant === 'danger',

                        // Sizes
                        'h-8 px-3 text-xs': size === 'sm',
                        'h-10 px-4 py-2': size === 'md',
                        'h-12 px-6 text-base': size === 'lg',
                        'h-10 w-10 p-0': size === 'icon',
                    },
                    className
                )}
                {...props}
            >
                {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                {children}
            </button>
        );
    }
);
Button.displayName = 'Button';

export { Button };
