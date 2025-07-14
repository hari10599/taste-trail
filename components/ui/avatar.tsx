import * as React from 'react'
import { cn } from '@/lib/utils/cn'
import { User } from 'lucide-react'

interface AvatarProps extends React.HTMLAttributes<HTMLDivElement> {
  src?: string | null
  alt?: string
  fallback?: string
  size?: 'sm' | 'md' | 'lg' | 'xl'
}

const sizeClasses = {
  sm: 'h-8 w-8 text-xs',
  md: 'h-10 w-10 text-sm',
  lg: 'h-16 w-16 text-lg',
  xl: 'h-24 w-24 text-2xl',
}

export function Avatar({ 
  src, 
  alt, 
  fallback, 
  size = 'md', 
  className, 
  ...props 
}: AvatarProps) {
  const [error, setError] = React.useState(false)
  
  const initials = fallback
    ? fallback.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
    : ''
  
  return (
    <div
      className={cn(
        'relative overflow-hidden rounded-full bg-gray-100 flex items-center justify-center',
        sizeClasses[size],
        className
      )}
      {...props}
    >
      {src && !error ? (
        <img
          src={src}
          alt={alt}
          className="h-full w-full object-cover"
          onError={() => setError(true)}
        />
      ) : fallback ? (
        <span className="font-medium text-gray-600">{initials}</span>
      ) : (
        <User className="h-1/2 w-1/2 text-gray-400" />
      )}
    </div>
  )
}