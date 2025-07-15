'use client'

import { useState, useEffect, useRef } from 'react'
import { Bell, Wifi, WifiOff } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Avatar } from '@/components/ui/avatar'
import { UserBadge } from '@/components/ui/user-badge'
import { formatDistanceToNow } from 'date-fns'
import axios from 'axios'
import Link from 'next/link'
import toast from 'react-hot-toast'

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
  const [isConnected, setIsConnected] = useState(false)
  const [connectionStatus, setConnectionStatus] = useState<'connecting' | 'connected' | 'disconnected' | 'error'>('disconnected')
  const [initialConnectionMade, setInitialConnectionMade] = useState(false)
  const [lastFetchTime, setLastFetchTime] = useState(0)
  const [connectionAttempts, setConnectionAttempts] = useState(0)
  
  const eventSourceRef = useRef<EventSource | null>(null)
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null)
  const reconnectAttempts = useRef(0)
  const maxReconnectAttempts = 5
  const isPolling = useRef(false)
  
  useEffect(() => {
    const token = localStorage.getItem('accessToken')
    if (token) {
      // Only fetch notifications once on mount
      fetchNotifications()
      // Set up SSE connection which will handle real-time updates
      setupSSEConnection()
      
      // Set up token refresh interval (every 10 minutes)
      const tokenRefreshInterval = setInterval(() => {
        refreshAccessToken()
      }, 10 * 60 * 1000) // 10 minutes
      
      // Handle page visibility changes
      const handleVisibilityChange = () => {
        if (document.visibilityState === 'visible') {
          console.log('Page became visible, checking SSE connection')
          // If no connection, try to reconnect
          if (!eventSourceRef.current || eventSourceRef.current.readyState === EventSource.CLOSED) {
            console.log('Reconnecting SSE due to page visibility')
            setupSSEConnection()
          }
        } else {
          console.log('Page became hidden')
        }
      }
      
      document.addEventListener('visibilitychange', handleVisibilityChange)
      
      return () => {
        cleanup()
        clearInterval(tokenRefreshInterval)
        document.removeEventListener('visibilitychange', handleVisibilityChange)
      }
    }
    
    return () => {
      cleanup()
    }
  }, [])

  // Initialize unread count from login response
  useEffect(() => {
    const initializeFromLogin = () => {
      const loginData = sessionStorage.getItem('loginNotificationData')
      if (loginData) {
        try {
          const { unreadNotificationCount } = JSON.parse(loginData)
          if (unreadNotificationCount !== undefined) {
            setUnreadCount(unreadNotificationCount)
          }
          sessionStorage.removeItem('loginNotificationData')
        } catch (error) {
          console.error('Failed to parse login notification data:', error)
        }
      }
    }

    initializeFromLogin()
    // Listen for storage events in case login happens in another tab
    window.addEventListener('storage', initializeFromLogin)
    return () => window.removeEventListener('storage', initializeFromLogin)
  }, [])
  
  const cleanup = () => {
    console.log('🧹 Cleaning up NotificationBell connections')
    if (eventSourceRef.current) {
      console.log('Closing SSE connection')
      eventSourceRef.current.close()
      eventSourceRef.current = null
    }
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current)
      reconnectTimeoutRef.current = null
    }
    if (pollingIntervalRef.current) {
      clearInterval(pollingIntervalRef.current)
      pollingIntervalRef.current = null
    }
    isPolling.current = false
  }
  
  const refreshAccessToken = async () => {
    try {
      console.log('Refreshing access token...')
      const response = await axios.post('/api/auth/refresh', {}, {
        withCredentials: true
      })
      
      if (response.data.accessToken) {
        localStorage.setItem('accessToken', response.data.accessToken)
        console.log('Access token refreshed successfully')
        
        // Reconnect SSE with new token
        if (eventSourceRef.current) {
          cleanup()
        }
        setupSSEConnection()
        
        return Promise.resolve()
      }
    } catch (error) {
      console.error('Failed to refresh token:', error)
      return Promise.reject(error)
    }
  }
  
  const setupSSEConnection = () => {
    const token = localStorage.getItem('accessToken')
    if (!token) {
      console.warn('No access token found, cannot establish SSE connection')
      return
    }
    
    // Cleanup existing connection first
    if (eventSourceRef.current) {
      eventSourceRef.current.close()
      eventSourceRef.current = null
    }
    
    try {
      setConnectionStatus('connecting')
      setConnectionAttempts(prev => prev + 1)
      console.log(`Setting up SSE connection (attempt ${connectionAttempts + 1})`)
      
      const eventSource = new EventSource(`/api/notifications/stream?token=${token}`)
      eventSourceRef.current = eventSource
      
      eventSource.onopen = () => {
        console.log('SSE connection established successfully')
        setConnectionStatus('connected')
        setIsConnected(true)
        reconnectAttempts.current = 0
        setConnectionAttempts(0)
        
        // Stop polling if it was active
        if (pollingIntervalRef.current) {
          clearInterval(pollingIntervalRef.current)
          pollingIntervalRef.current = null
          isPolling.current = false
          console.log('Stopped polling due to SSE connection')
        }
        
        // Log connection success for debugging
        console.log('✅ SSE connection ready for real-time notifications')
      }
      
      eventSource.onmessage = (event) => {
        try {
          // Handle ping messages (server health checks)
          if (event.data.trim() === '') {
            // This is a ping message, just ignore it
            return
          }
          
          const data = JSON.parse(event.data)
          console.log('Raw SSE message received:', event.data)
          handleSSEMessage(data)
        } catch (error) {
          console.error('Failed to parse SSE message:', error, 'Raw data:', event.data)
        }
      }
      
      eventSource.onerror = (error) => {
        console.error('SSE connection error:', error, 'ReadyState:', eventSource.readyState)
        eventSource.close() // Always close the connection on error
        setConnectionStatus('error')
        setIsConnected(false)
        eventSourceRef.current = null
        
        // If we get an immediate error (readyState CLOSED), it's likely an auth error
        if (eventSource.readyState === EventSource.CLOSED && reconnectAttempts.current === 0) {
          console.log('SSE authentication error detected - attempting token refresh')
          // Try to refresh token first
          refreshAccessToken().then(() => {
            console.log('Token refreshed successfully, reconnecting SSE')
            // After token refresh, try to reconnect
            setTimeout(() => setupSSEConnection(), 1000)
          }).catch((refreshError) => {
            console.error('Token refresh failed:', refreshError)
            console.log('Falling back to polling mode')
            setConnectionStatus('disconnected')
            startPolling()
          })
          return
        }
        
        // Attempt to reconnect with exponential backoff
        if (reconnectAttempts.current < maxReconnectAttempts) {
          const delay = Math.min(1000 * Math.pow(2, reconnectAttempts.current), 30000)
          console.log(`Reconnecting SSE in ${delay}ms (attempt ${reconnectAttempts.current + 1}/${maxReconnectAttempts})`)
          reconnectTimeoutRef.current = setTimeout(() => {
            reconnectAttempts.current++
            setupSSEConnection()
          }, delay)
        } else {
          console.log('Max reconnection attempts reached, falling back to polling')
          setConnectionStatus('disconnected')
          startPolling()
        }
      }
    } catch (error) {
      // Failed to setup SSE connection
      setConnectionStatus('error')
      startPolling()
    }
  }
  
  const startPolling = () => {
    // Prevent multiple polling instances
    if (isPolling.current) {
      console.log('Polling already active, skipping...')
      return
    }
    
    // Clear any existing interval just in case
    if (pollingIntervalRef.current) {
      clearInterval(pollingIntervalRef.current)
    }
    
    console.log('Starting fallback polling mode...')
    isPolling.current = true
    
    // Initial fetch
    fetchNotifications()
    
    // Set up polling every 30 seconds
    pollingIntervalRef.current = setInterval(() => {
      console.log('Polling for notifications...')
      fetchNotifications()
    }, 30000)
  }
  
  const handleSSEMessage = (data: any) => {
    console.log('Received SSE message:', data.type, data)
    
    switch (data.type) {
      case 'connected':
        console.log('SSE connection confirmed')
        setInitialConnectionMade(true)
        break
        
      case 'notification':
        console.log('New notification received:', data.payload)
        // Add new notification to the list
        setNotifications(prev => {
          // Avoid duplicates by checking if notification already exists
          const exists = prev.some(n => n.id === data.payload.id)
          if (exists) {
            console.log('Duplicate notification ignored:', data.payload.id)
            return prev
          }
          return [data.payload, ...prev.slice(0, 9)] // Keep only 10 most recent
        })
        
        // Increment unread count for unread notifications
        if (!data.payload.read) {
          console.log('Incrementing unread count for new notification')
          setUnreadCount(prev => prev + 1)
        }
        
        // Show toast for important notifications (only after initial connection)
        if (initialConnectionMade && ['like', 'comment', 'reply', 'new_review', 'influencer_application_received', 'restaurant_claim_received'].includes(data.payload.type)) {
          toast.success(data.payload.title, {
            duration: 4000,
            icon: getNotificationIcon(data.payload.type)
          })
        }
        break
        
      case 'unread_count_update':
        console.log('Updating unread count:', data.unreadCount)
        setUnreadCount(data.unreadCount)
        break
        
      default:
        console.log('Unknown SSE message type:', data.type)
    }
  }
  
  const fetchNotifications = async () => {
    // Prevent rapid consecutive calls (minimum 1 second between calls)
    const now = Date.now()
    if (now - lastFetchTime < 1000) {
      console.log('Skipping fetch - too soon since last fetch')
      return
    }
    
    try {
      const token = localStorage.getItem('accessToken')
      if (!token) {
        console.log('No token available for fetch')
        return
      }
      
      setLastFetchTime(now)
      console.log('Fetching notifications...')
      
      const response = await axios.get('/api/notifications?limit=10', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
      
      console.log('Notifications fetched:', response.data.notifications.length, 'unread:', response.data.unreadCount)
      setNotifications(response.data.notifications)
      setUnreadCount(response.data.unreadCount)
    } catch (error: any) {
      console.error('Failed to fetch notifications:', error)
      // Don't show error for auth issues, just fail silently for notifications
      if (error.response?.status === 401) {
        console.log('Auth error during fetch, attempting token refresh')
        // Try to refresh token and retry
        refreshAccessToken().catch(() => {
          console.log('Token refresh failed during fetch')
        })
      }
    }
  }
  
  const markAsRead = async (notificationIds?: string[]) => {
    try {
      const token = localStorage.getItem('accessToken')
      await axios.put(
        '/api/notifications',
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
      // Failed to mark notifications as read
      toast.error('Failed to mark notifications as read')
    }
  }
  
  const getConnectionStatusIcon = () => {
    switch (connectionStatus) {
      case 'connected':
        return <Wifi className="h-3 w-3 text-green-500" />
      case 'connecting':
        return <div className="h-3 w-3 bg-yellow-500 rounded-full animate-pulse" />
      case 'disconnected':
      case 'error':
        return <WifiOff className="h-3 w-3 text-red-500" />
      default:
        return null
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
    
    // Handle admin notifications
    switch (notification.type) {
      case 'restaurant_claim_received':
        return '/admin/restaurant-claims'
      case 'influencer_application_received':
        return '/admin/influencer-applications'
      default:
        return '#'
    }
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
      case 'influencer_application_received':
        return '📝'
      case 'influencer_approved':
        return '✅'
      case 'influencer_rejected':
        return '❌'
      case 'restaurant_claim_received':
        return '🏪'
      case 'restaurant_claim_approved':
        return '✅'
      case 'restaurant_claim_rejected':
        return '❌'
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
        {/* Connection status indicator */}
        <span className={`absolute -bottom-1 -right-1 h-2 w-2 rounded-full ${
          connectionStatus === 'connected' ? 'bg-green-500' :
          connectionStatus === 'connecting' ? 'bg-yellow-500 animate-pulse' :
          connectionStatus === 'error' ? 'bg-red-500 animate-pulse' :
          'bg-gray-400'
        }`} title={`Connection status: ${connectionStatus}${connectionAttempts > 0 ? ` (${connectionAttempts} attempts)` : ''}`} />
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
                <div className="flex items-center gap-2">
                  <CardTitle className="text-lg">Notifications</CardTitle>
                  {getConnectionStatusIcon()}
                </div>
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
              <div className="text-xs text-gray-500 mt-1">
                {connectionStatus === 'connected' && (
                  <span className="text-green-600 flex items-center gap-1">
                    <span className="h-1.5 w-1.5 bg-green-500 rounded-full"></span>
                    Real-time notifications active
                  </span>
                )}
                {connectionStatus === 'connecting' && (
                  <span className="text-yellow-600 flex items-center gap-1">
                    <span className="h-1.5 w-1.5 bg-yellow-500 rounded-full animate-pulse"></span>
                    Connecting to live updates... (attempt {connectionAttempts})
                  </span>
                )}
                {connectionStatus === 'disconnected' && (
                  <span className="text-gray-600 flex items-center gap-1">
                    <span className="h-1.5 w-1.5 bg-gray-400 rounded-full"></span>
                    Using backup sync mode
                  </span>
                )}
                {connectionStatus === 'error' && (
                  <span className="text-red-600 flex items-center gap-1">
                    <span className="h-1.5 w-1.5 bg-red-500 rounded-full animate-pulse"></span>
                    Retrying connection... (attempt {connectionAttempts})
                  </span>
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
                  {notifications.map((notification) => {
                    const isAdminNotification = ['restaurant_claim_received', 'influencer_application_received'].includes(notification.type)
                    return (
                    <Link
                      key={notification.id}
                      href={getNotificationLink(notification)}
                      onClick={() => handleNotificationClick(notification)}
                      className={`block p-4 hover:bg-gray-50 transition ${
                        !notification.read 
                          ? (isAdminNotification ? 'bg-orange-50 border-l-4 border-orange-400' : 'bg-blue-50') 
                          : ''
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
                              <div className="flex items-center gap-2 mb-1">
                                <p className="font-semibold text-sm">{notification.title}</p>
                                {notification.from && (
                                  <UserBadge role={notification.from.role} size="sm" />
                                )}
                              </div>
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
                    )
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  )
}