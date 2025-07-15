'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { UserPlus, UserCheck, Loader2 } from 'lucide-react'
import axios from 'axios'
import toast from 'react-hot-toast'

interface FollowButtonProps {
  userId: string
  className?: string
  size?: 'sm' | 'default' | 'lg'
  variant?: 'default' | 'outline' | 'ghost'
  showIcon?: boolean
  onFollowChange?: (isFollowing: boolean, counts: { followers: number; following: number }) => void
}

export function FollowButton({
  userId,
  className = '',
  size = 'default',
  variant = 'outline',
  showIcon = true,
  onFollowChange
}: FollowButtonProps) {
  const [isFollowing, setIsFollowing] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [isChecking, setIsChecking] = useState(true)

  useEffect(() => {
    checkFollowStatus()
  }, [userId])

  const checkFollowStatus = async () => {
    try {
      const token = localStorage.getItem('accessToken')
      if (!token) {
        setIsChecking(false)
        return
      }

      const response = await axios.get(`/api/users/${userId}/follow`, {
        headers: { Authorization: `Bearer ${token}` }
      })

      setIsFollowing(response.data.isFollowing)
      if (onFollowChange) {
        onFollowChange(response.data.isFollowing, response.data.counts)
      }
    } catch (error) {
      console.error('Failed to check follow status:', error)
    } finally {
      setIsChecking(false)
    }
  }

  const handleFollowToggle = async () => {
    const token = localStorage.getItem('accessToken')
    if (!token) {
      toast(
        <div>
          <p>Please sign in to follow users</p>
          <div className="flex gap-2 mt-2">
            <Button size="sm" onClick={() => window.location.href = '/login'}>
              Sign In
            </Button>
            <Button size="sm" variant="outline" onClick={() => toast.dismiss()}>
              Cancel
            </Button>
          </div>
        </div>,
        { duration: 5000 }
      )
      return
    }

    setIsLoading(true)
    try {
      if (isFollowing) {
        // Unfollow
        const response = await axios.delete(`/api/users/${userId}/follow`, {
          headers: { Authorization: `Bearer ${token}` }
        })
        setIsFollowing(false)
        toast.success('Unfollowed successfully')
        if (onFollowChange) {
          onFollowChange(false, response.data.counts)
        }
      } else {
        // Follow
        const response = await axios.post(`/api/users/${userId}/follow`, {}, {
          headers: { Authorization: `Bearer ${token}` }
        })
        setIsFollowing(true)
        toast.success('Following successfully')
        if (onFollowChange) {
          onFollowChange(true, response.data.counts)
        }
      }
    } catch (error: any) {
      console.error('Follow toggle error:', error)
      toast.error(error.response?.data?.error || 'Failed to update follow status')
    } finally {
      setIsLoading(false)
    }
  }

  if (isChecking) {
    return (
      <Button
        size={size}
        variant={variant}
        className={className}
        disabled
      >
        <Loader2 className="h-4 w-4 animate-spin" />
      </Button>
    )
  }

  return (
    <Button
      size={size}
      variant={isFollowing ? 'default' : variant}
      className={className}
      onClick={handleFollowToggle}
      disabled={isLoading}
    >
      {isLoading ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : (
        <>
          {showIcon && (
            isFollowing ? (
              <UserCheck className="h-4 w-4 mr-2" />
            ) : (
              <UserPlus className="h-4 w-4 mr-2" />
            )
          )}
          {isFollowing ? 'Following' : 'Follow'}
        </>
      )}
    </Button>
  )
}