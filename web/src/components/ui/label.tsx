import { LabelHTMLAttributes, forwardRef } from 'react';
import { cn } from '../../lib/utils';

export interface LabelProps extends LabelHTMLAttributes<HTMLLabelElement> {
    prompt?: boolean;
}

const Label = forwardRef<HTMLLabelElement, LabelProps>(
    ({ className, prompt, children, ...props }, ref) => {
        return (
            <label
                ref={ref}
                className={cn(
                    'text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 block mb-2 text-[#808080]',
                    prompt && 'sf-label--prompt', // Uses globals.css utility
                    className
                )}
                {...props}
            >
                {children}
            </label>
        );
    }
);
Label.displayName = 'Label';

export { Label };
