'use client'

import { useState, useEffect } from 'react'
import { Bell } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Avatar } from '@/components/ui/avatar'
import { formatDistanceToNow } from 'date-fns'
import axios from 'axios'
import Link from 'next/link'

interface Notification {
  id: string
  type: string
  title: string
  message: string
  read: boolean
  createdAt: string
  from?: {
    id: string
    name: string
    avatar?: string | null
  }
  review?: {
    id: string
    restaurant: {
      id: string
      name: string
    }
  }
}

export function NotificationBell() {
  const [isOpen, setIsOpen] = useState(false)
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [isLoading, setIsLoading] = useState(false)
  
  useEffect(() => {
    fetchNotifications()
    // Poll for new notifications every 30 seconds
    const interval = setInterval(fetchNotifications, 30000)
    return () => clearInterval(interval)
  }, [])
  
  const fetchNotifications = async () => {
    try {
      const token = localStorage.getItem('accessToken')
      if (!token) return
      
      const response = await axios.get('/api/notifications?limit=10', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
      
      setNotifications(response.data.notifications)
      setUnreadCount(response.data.unreadCount)
    } catch (error: any) {
      console.error('Failed to fetch notifications:', error)
      // Don't show error for auth issues, just fail silently for notifications
      if (error.response?.status !== 401) {
        console.error('Notification fetch error:', error)
      }
    }
  }
  
  const markAsRead = async (notificationIds?: string[]) => {
    try {
      const token = localStorage.getItem('accessToken')
      await axios.put(
        '/api/notifications/read',
        { notificationIds },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      )
      
      if (notificationIds) {
        setNotifications(notifications.map(n => 
          notificationIds.includes(n.id) ? { ...n, read: true } : n
        ))
        setUnreadCount(Math.max(0, unreadCount - notificationIds.length))
      } else {
        setNotifications(notifications.map(n => ({ ...n, read: true })))
        setUnreadCount(0)
      }
    } catch (error) {
      console.error('Failed to mark notifications as read:', error)
    }
  }
  
  const handleNotificationClick = (notification: Notification) => {
    if (!notification.read) {
      markAsRead([notification.id])
    }
    setIsOpen(false)
  }
  
  const getNotificationLink = (notification: Notification) => {
    if (notification.review) {
      return `/restaurants/${notification.review.restaurant.id}#review-${notification.review.id}`
    }
    return '#'
  }
  
  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'like':
        return '❤️'
      case 'comment':
      case 'reply':
        return '💬'
      case 'follow':
        return '👥'
      case 'welcome':
        return '👋'
      default:
        return '🔔'
    }
  }
  
  return (
    <div className="relative">
      <Button
        variant="ghost"
        size="icon"
        onClick={() => setIsOpen(!isOpen)}
        className="relative"
      >
        <Bell className="h-5 w-5" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-red-500 text-white text-xs flex items-center justify-center">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </Button>
      
      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-10"
            onClick={() => setIsOpen(false)}
          />
          <Card className="absolute right-0 mt-2 w-96 max-h-[600px] overflow-hidden z-20 shadow-lg">
            <CardHeader className="border-b">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">Notifications</CardTitle>
                {unreadCount > 0 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => markAsRead()}
                  >
                    Mark all as read
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent className="p-0 overflow-y-auto max-h-[500px]">
              {notifications.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  No notifications yet
                </div>
              ) : (
                <div className="divide-y">
                  {notifications.map((notification) => (
                    <Link
                      key={notification.id}
                      href={getNotificationLink(notification)}
                      onClick={() => handleNotificationClick(notification)}
                      className={`block p-4 hover:bg-gray-50 transition ${
                        !notification.read ? 'bg-blue-50' : ''
                      }`}
                    >
                      <div className="flex gap-3">
                        <div className="flex-shrink-0 text-2xl">
                          {getNotificationIcon(notification.type)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start gap-2">
                            {notification.from && (
                              <Avatar
                                src={notification.from.avatar}
                                alt={notification.from.name}
                                fallback={notification.from.name}
                                size="sm"
                              />
                            )}
                            <div className="flex-1">
                              <p className="font-semibold text-sm">{notification.title}</p>
                              <p className="text-sm text-gray-600 mt-1">{notification.message}</p>
                              <p className="text-xs text-gray-500 mt-1">
                                {formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true })}
                              </p>
                            </div>
                          </div>
                          {!notification.read && (
                            <div className="absolute top-4 right-4">
                              <div className="h-2 w-2 bg-blue-500 rounded-full" />
                            </div>
                          )}
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  )
}