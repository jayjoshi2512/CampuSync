import React from 'react';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  padding?: 'none' | 'sm' | 'md' | 'lg';
  bordered?: boolean;
}

export default function Card({ 
  children, 
  className = '', 
  padding = 'md', 
  bordered = true 
}: CardProps) {
  const paddings = {
    none: 'p-0',
    sm: 'p-4',
    md: 'p-6',
    lg: 'p-8',
  };

  const borderStyles = bordered 
    ? 'border border-[var(--color-border-subtle)]' 
    : 'border-transparent shadow-none';

  return (
    <div className={`bg-[var(--color-bg-secondary)] rounded-xl ${borderStyles} ${paddings[padding]} ${className}`}>
      {children}
    </div>
  );
}
