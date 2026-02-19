import { InputHTMLAttributes, forwardRef } from 'react';
import { cn } from '../../lib/utils';

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
    error?: boolean;
}

const Input = forwardRef<HTMLInputElement, InputProps>(
    ({ className, type, error, ...props }, ref) => {
        return (
            <input
                type={type}
                className={cn(
                    'flex h-10 w-full rounded-[3px] border border-[#2a2a2a] bg-[#161616] px-3 py-2 text-sm text-[#d4d4d4] ring-offset-[#0d0d0d] file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-[#4a4a4a] focus-visible:outline-none focus-visible:border-[#8a00c4] disabled:cursor-not-allowed disabled:opacity-50 transition-colors',
                    error && 'border-[#f87171] focus-visible:border-[#f87171]',
                    className
                )}
                ref={ref}
                {...props}
            />
        );
    }
);
Input.displayName = 'Input';

export { Input };
