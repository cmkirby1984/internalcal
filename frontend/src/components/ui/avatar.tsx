'use client';

import { forwardRef, type HTMLAttributes } from 'react';
import { cn, getInitials, stringToColor } from '@/lib/utils';

export interface AvatarProps extends HTMLAttributes<HTMLDivElement> {
  src?: string | null;
  name?: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  status?: 'online' | 'offline' | 'busy' | 'away';
}

const Avatar = forwardRef<HTMLDivElement, AvatarProps>(
  ({ className, src, name = '', size = 'md', status, ...props }, ref) => {
    const sizes = {
      xs: 'w-6 h-6 text-xs',
      sm: 'w-8 h-8 text-xs',
      md: 'w-10 h-10 text-sm',
      lg: 'w-12 h-12 text-base',
      xl: 'w-16 h-16 text-lg',
    };

    const statusSizes = {
      xs: 'w-1.5 h-1.5 border',
      sm: 'w-2 h-2 border',
      md: 'w-2.5 h-2.5 border-2',
      lg: 'w-3 h-3 border-2',
      xl: 'w-4 h-4 border-2',
    };

    const statusColors = {
      online: 'bg-emerald-500',
      offline: 'bg-gray-400',
      busy: 'bg-red-500',
      away: 'bg-amber-500',
    };

    const initials = getInitials(name);
    const bgColor = stringToColor(name);

    return (
      <div ref={ref} className={cn('relative inline-flex', className)} {...props}>
        {src ? (
          <img
            src={src}
            alt={name}
            className={cn(
              'rounded-full object-cover',
              sizes[size]
            )}
          />
        ) : (
          <div
            className={cn(
              'rounded-full flex items-center justify-center font-semibold text-white',
              sizes[size]
            )}
            style={{ backgroundColor: bgColor }}
          >
            {initials}
          </div>
        )}
        
        {status && (
          <span
            className={cn(
              'absolute bottom-0 right-0 rounded-full border-white',
              statusSizes[size],
              statusColors[status]
            )}
          />
        )}
      </div>
    );
  }
);

Avatar.displayName = 'Avatar';

export { Avatar };

