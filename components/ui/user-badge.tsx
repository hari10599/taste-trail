'use client'

import { Badge } from '@/components/ui/badge'
import { Crown, Star, Building, Shield, ShieldCheck } from 'lucide-react'
import { cn } from '@/lib/utils'

interface UserBadgeProps {
  role: string
  size?: 'sm' | 'md' | 'lg'
  showIcon?: boolean
  className?: string
}

export function UserBadge({ role, size = 'md', showIcon = true, className }: UserBadgeProps) {
  const getBadgeConfig = (userRole: string) => {
    switch (userRole) {
      case 'USER':
        return {
          label: 'User',
          variant: 'secondary' as const,
          icon: null,
          className: 'bg-gray-100 text-gray-700 border-gray-200'
        }
      case 'INFLUENCER':
        return {
          label: 'Verified Influencer',
          variant: 'default' as const,
          icon: <Star className="h-3 w-3" />,
          className: 'bg-blue-100 text-blue-700 border-blue-200'
        }
      case 'OWNER':
        return {
          label: 'Restaurant Owner',
          variant: 'default' as const,
          icon: <Building className="h-3 w-3" />,
          className: 'bg-green-100 text-green-700 border-green-200'
        }
      case 'MODERATOR':
        return {
          label: 'Moderator',
          variant: 'default' as const,
          icon: <Shield className="h-3 w-3" />,
          className: 'bg-orange-100 text-orange-700 border-orange-200'
        }
      case 'ADMIN':
        return {
          label: 'Administrator',
          variant: 'default' as const,
          icon: <Crown className="h-3 w-3" />,
          className: 'bg-red-100 text-red-700 border-red-200'
        }
      default:
        return {
          label: 'User',
          variant: 'secondary' as const,
          icon: null,
          className: 'bg-gray-100 text-gray-700 border-gray-200'
        }
    }
  }

  const config = getBadgeConfig(role)
  
  const sizeClasses = {
    sm: 'text-xs px-1.5 py-0.5',
    md: 'text-xs px-2 py-1', 
    lg: 'text-sm px-3 py-1.5'
  }

  const iconSizeClasses = {
    sm: 'h-2.5 w-2.5',
    md: 'h-3 w-3',
    lg: 'h-3.5 w-3.5'
  }

  // Don't show badge for regular users unless specifically requested
  if (role === 'USER' && !className?.includes('show-user')) {
    return null
  }

  return (
    <Badge
      variant={config.variant}
      className={cn(
        'inline-flex items-center gap-1 font-medium border',
        config.className,
        sizeClasses[size],
        className
      )}
    >
      {showIcon && config.icon && (
        <span className={iconSizeClasses[size]}>
          {config.icon}
        </span>
      )}
      <span>{config.label}</span>
    </Badge>
  )
}

export function UserRoleIcon({ role, size = 'md', className }: { 
  role: string 
  size?: 'sm' | 'md' | 'lg'
  className?: string 
}) {
  const iconSizeClasses = {
    sm: 'h-3 w-3',
    md: 'h-4 w-4',
    lg: 'h-5 w-5'
  }

  const iconColorClasses = {
    INFLUENCER: 'text-blue-600',
    OWNER: 'text-green-600', 
    MODERATOR: 'text-orange-600',
    ADMIN: 'text-red-600',
    USER: 'text-gray-500'
  }

  const getIcon = (userRole: string) => {
    switch (userRole) {
      case 'INFLUENCER':
        return <Star className={cn(iconSizeClasses[size], iconColorClasses.INFLUENCER, className)} />
      case 'OWNER':
        return <Building className={cn(iconSizeClasses[size], iconColorClasses.OWNER, className)} />
      case 'MODERATOR':
        return <Shield className={cn(iconSizeClasses[size], iconColorClasses.MODERATOR, className)} />
      case 'ADMIN':
        return <Crown className={cn(iconSizeClasses[size], iconColorClasses.ADMIN, className)} />
      default:
        return null
    }
  }

  return getIcon(role)
}

// Helper function to get role display name
export function getRoleDisplayName(role: string): string {
  switch (role) {
    case 'USER':
      return 'User'
    case 'INFLUENCER':
      return 'Verified Influencer'
    case 'OWNER':
      return 'Restaurant Owner'
    case 'MODERATOR':
      return 'Moderator'
    case 'ADMIN':
      return 'Administrator'
    default:
      return 'User'
  }
}

// Helper function to get role description
export function getRoleDescription(role: string): string {
  switch (role) {
    case 'USER':
      return 'Community member'
    case 'INFLUENCER':
      return 'Verified food influencer with special features'
    case 'OWNER':
      return 'Restaurant owner with business tools'
    case 'MODERATOR':
      return 'Community moderator'
    case 'ADMIN':
      return 'Platform administrator'
    default:
      return 'Community member'
  }
}