import React, { forwardRef } from 'react';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  fullWidth?: boolean;
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className = '', variant = 'primary', size = 'md', fullWidth = false, children, ...props }, ref) => {
    let baseStyles = "inline-flex items-center justify-center font-medium transition-all duration-200 rounded-lg outline-none focus:ring-2 focus:ring-offset-2";
    
    // Size styles
    const sizes = {
      sm: "px-3 py-1.5 text-xs",
      md: "px-4 py-2 text-sm",
      lg: "px-6 py-3 text-base"
    };

    // Variant styles (mapped cleanly to typical app themes)
    const variants = {
      primary: "bg-blue-600 hover:bg-blue-700 text-white border border-transparent shadow-sm focus:ring-blue-500",
      secondary: "bg-[var(--color-bg-tertiary)] hover:bg-[var(--color-bg-secondary)] text-[var(--color-text-primary)] border border-[var(--color-border-default)] focus:ring-gray-400",
      outline: "bg-transparent hover:bg-[var(--color-bg-tertiary)] text-[var(--color-text-primary)] border border-[var(--color-border-strong)] focus:ring-gray-400",
      ghost: "bg-transparent hover:bg-white/10 text-[var(--color-text-primary)] border-transparent focus:ring-gray-400"
    };

    const widthStyle = fullWidth ? "w-full" : "";

    return (
      <button
        ref={ref}
        className={`${baseStyles} ${sizes[size]} ${variants[variant]} ${widthStyle} ${className}`}
        {...props}
      >
        {children}
      </button>
    );
  }
);

Button.displayName = 'Button';

export default Button;
