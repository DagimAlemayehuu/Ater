import React from 'react';
import Link from 'next/link';
import { ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';

interface IndustrialButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  href?: string;
  size?: 'sm' | 'md' | 'lg' | 'icon';
  children: React.ReactNode;
  icon?: boolean;
}

export function IndustrialButton({ 
  href, 
  size = 'md',
  children, 
  icon = true,
  className,
  ...props 
}: IndustrialButtonProps) {
  const content = (
    <>
      <span className={cn("relative z-10", size === 'icon' && "flex items-center justify-center")}>
        {children}
      </span>
      {icon && size !== 'icon' && (
        <ChevronRight className="ml-2 size-4 group-hover:translate-x-1 transition-transform relative z-10" />
      )}
    </>
  );

  const baseClasses = cn(
    "industrial-btn group",
    size === 'sm' && "h-10 px-6 text-[10px]",
    size === 'md' && "h-14 px-10",
    size === 'lg' && "h-20 px-16 text-[13px]",
    size === 'icon' && "h-10 w-10 p-0",
    className
  );

  if (href) {
    return (
      <Link href={href} className={baseClasses}>
        {content}
      </Link>
    );
  }

  return (
    <button className={baseClasses} {...props}>
      {content}
    </button>
  );
}
