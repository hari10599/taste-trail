'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  Bell, Settings, Heart, MessageCircle, UserPlus, 
  MessageSquare, Megaphone, Mail, Smartphone, Trash2,
  Check, Filter, Search
} from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Avatar } from '@/components/ui/avatar'
import { UserBadge } from '@/components/ui/user-badge'
import { formatDistanceToNow } from 'date-fns'
import axios from 'axios'
import toast from 'react-hot-toast'
import Link from 'next/link'

interface NotificationPreferences {
  id: string
  emailEnabled: boolean
  pushEnabled: boolean
  reviewLikes: boolean
  reviewComments: boolean
  newFollowers: boolean
  ownerResponses: boolean
  systemUpdates: boolean
}

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
    avatar?: string
    role: string
  }
  review?: {
    id: string
    title?: string
    restaurant: {
      id: string
      name: string
    }
  }
  comment?: {
    id: string
    content: string
  }
}

export default function NotificationsPage() {
  const [preferences, setPreferences] = useState<NotificationPreferences | null>(null)
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [typeFilter, setTypeFilter] = useState('all')
  const [readFilter, setReadFilter] = useState('all')
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [unreadCount, setUnreadCount] = useState(0)

  useEffect(() => {
    fetchPreferences()
    fetchNotifications()
  }, [page, typeFilter, readFilter])

  useEffect(() => {
    const delayedSearch = setTimeout(() => {
      setPage(1)
      fetchNotifications()
    }, 500)

    return () => clearTimeout(delayedSearch)
  }, [searchTerm])

  const fetchPreferences = async () => {
    try {
      const token = localStorage.getItem('accessToken')
      const response = await axios.get('/api/notifications/preferences', {
        headers: { Authorization: `Bearer ${token}` }
      })
      setPreferences(response.data.preferences)
    } catch (error) {
      console.error('Failed to fetch preferences:', error)
      toast.error('Failed to load notification preferences')
    }
  }

  const fetchNotifications = async () => {
    try {
      setIsLoading(true)
      const token = localStorage.getItem('accessToken')
      
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '20',
        ...(searchTerm && { search: searchTerm }),
        ...(typeFilter !== 'all' && { type: typeFilter }),
        ...(readFilter !== 'all' && { unread: (readFilter === 'unread').toString() })
      })

      const response = await axios.get(`/api/notifications?${params}`, {
        headers: { Authorization: `Bearer ${token}` }
      })

      setNotifications(response.data.notifications)
      setTotalPages(response.data.pagination.totalPages)
      setUnreadCount(response.data.unreadCount)
    } catch (error) {
      console.error('Failed to fetch notifications:', error)
      toast.error('Failed to load notifications')
    } finally {
      setIsLoading(false)
    }
  }

  const updatePreferences = async (newPreferences: Partial<NotificationPreferences>) => {
    if (!preferences) return

    try {
      setIsSaving(true)
      const token = localStorage.getItem('accessToken')
      
      const updatedPreferences = { ...preferences, ...newPreferences }
      
      await axios.put('/api/notifications/preferences', updatedPreferences, {
        headers: { Authorization: `Bearer ${token}` }
      })

      setPreferences(updatedPreferences)
      toast.success('Preferences updated successfully')
    } catch (error) {
      console.error('Failed to update preferences:', error)
      toast.error('Failed to update preferences')
    } finally {
      setIsSaving(false)
    }
  }

  const markAsRead = async (notificationIds?: string[]) => {
    try {
      const token = localStorage.getItem('accessToken')
      
      await axios.put('/api/notifications', {
        notificationIds
      }, {
        headers: { Authorization: `Bearer ${token}` }
      })

      if (notificationIds) {
        setNotifications(notifications.map(n => 
          notificationIds.includes(n.id) ? { ...n, read: true } : n
        ))
        setUnreadCount(Math.max(0, unreadCount - notificationIds.length))
      } else {
        setNotifications(notifications.map(n => ({ ...n, read: true })))
        setUnreadCount(0)
      }

      toast.success('Notifications marked as read')
    } catch (error) {
      console.error('Failed to mark as read:', error)
      toast.error('Failed to mark notifications as read')
    }
  }

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'like': return <Heart className="h-4 w-4 text-red-500" />
      case 'comment': 
      case 'reply': return <MessageCircle className="h-4 w-4 text-blue-500" />
      case 'new_review': return <MessageSquare className="h-4 w-4 text-green-500" />
      case 'owner_response': return <MessageSquare className="h-4 w-4 text-purple-500" />
      case 'follow': return <UserPlus className="h-4 w-4 text-indigo-500" />
      case 'influencer_approved':
      case 'influencer_rejected':
      case 'system_announcement': return <Megaphone className="h-4 w-4 text-orange-500" />
      default: return <Bell className="h-4 w-4 text-gray-500" />
    }
  }

  const getNotificationLink = (notification: Notification) => {
    if (notification.review) {
      return `/restaurants/${notification.review.restaurant.id}#review-${notification.review.id}`
    }
    return '#'
  }

  const PreferenceSwitch = ({ 
    label, 
    description, 
    value, 
    onChange, 
    icon 
  }: {
    label: string
    description: string
    value: boolean
    onChange: (value: boolean) => void
    icon: React.ReactNode
  }) => (
    <div className="flex items-center justify-between py-4 border-b">
      <div className="flex items-start gap-3">
        <div className="mt-1">{icon}</div>
        <div>
          <h4 className="font-medium">{label}</h4>
          <p className="text-sm text-gray-600">{description}</p>
        </div>
      </div>
      <Switch
        checked={value}
        onCheckedChange={onChange}
        disabled={isSaving}
      />
    </div>
  )

  if (isLoading && !notifications.length) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/3"></div>
          <div className="h-32 bg-gray-200 rounded"></div>
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <Bell className="h-8 w-8 text-primary" />
          <h1 className="text-3xl font-bold">Notifications</h1>
          {unreadCount > 0 && (
            <Badge variant="destructive">{unreadCount} unread</Badge>
          )}
        </div>
        <p className="text-gray-600">
          Manage your notifications and communication preferences.
        </p>
      </div>

      <Tabs defaultValue="notifications" className="space-y-6">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="notifications" className="flex items-center gap-2">
            <Bell className="h-4 w-4" />
            Notifications
          </TabsTrigger>
          <TabsTrigger value="preferences" className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            Preferences
          </TabsTrigger>
        </TabsList>

        {/* Notifications Tab */}
        <TabsContent value="notifications" className="space-y-6">
          {/* Filters */}
          <Card>
            <CardHeader className="pb-4">
              <CardTitle className="text-base">Filter Notifications</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-wrap gap-4">
                <div className="flex-1 min-w-64">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                    <Input
                      placeholder="Search notifications..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
                
                <Select value={typeFilter} onValueChange={setTypeFilter}>
                  <SelectTrigger className="w-40">
                    <SelectValue placeholder="All types" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    <SelectItem value="like">Likes</SelectItem>
                    <SelectItem value="comment">Comments</SelectItem>
                    <SelectItem value="reply">Replies</SelectItem>
                    <SelectItem value="new_review">New Reviews</SelectItem>
                    <SelectItem value="system_announcement">System</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={readFilter} onValueChange={setReadFilter}>
                  <SelectTrigger className="w-32">
                    <SelectValue placeholder="All" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All</SelectItem>
                    <SelectItem value="unread">Unread</SelectItem>
                    <SelectItem value="read">Read</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => markAsRead()}
                  disabled={unreadCount === 0}
                >
                  <Check className="h-4 w-4 mr-2" />
                  Mark All Read
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setSearchTerm('')
                    setTypeFilter('all')
                    setReadFilter('all')
                    setPage(1)
                  }}
                >
                  <Filter className="h-4 w-4 mr-2" />
                  Clear Filters
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Notifications List */}
          <Card>
            <CardHeader>
              <CardTitle>Your Notifications</CardTitle>
              <CardDescription>
                {notifications.length > 0 
                  ? `Showing ${notifications.length} notifications`
                  : 'No notifications found'
                }
              </CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              {notifications.length === 0 ? (
                <div className="text-center py-12">
                  <Bell className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500 mb-2">No notifications found</p>
                  <p className="text-sm text-gray-400">
                    Try adjusting your filters or check back later
                  </p>
                </div>
              ) : (
                <div className="divide-y">
                  {notifications.map((notification) => (
                    <div
                      key={notification.id}
                      className={`p-4 hover:bg-gray-50 transition ${
                        !notification.read ? 'bg-blue-50 border-l-4 border-l-blue-500' : ''
                      }`}
                    >
                      <div className="flex gap-3">
                        <div className="flex-shrink-0 mt-1">
                          {getNotificationIcon(notification.type)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2">
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
                                <div className="flex items-center gap-2 mt-2">
                                  <p className="text-xs text-gray-500">
                                    {formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true })}
                                  </p>
                                  {notification.type && (
                                    <Badge variant="outline" className="text-xs">
                                      {notification.type.replace('_', ' ')}
                                    </Badge>
                                  )}
                                </div>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              {!notification.read && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => markAsRead([notification.id])}
                                  className="h-8 w-8 p-0"
                                >
                                  <Check className="h-4 w-4" />
                                </Button>
                              )}
                              {getNotificationLink(notification) !== '#' && (
                                <Link href={getNotificationLink(notification)}>
                                  <Button variant="outline" size="sm">
                                    View
                                  </Button>
                                </Link>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex justify-center gap-2 p-4 border-t">
                  <Button
                    variant="outline"
                    onClick={() => setPage(p => Math.max(1, p - 1))}
                    disabled={page === 1}
                  >
                    Previous
                  </Button>
                  <span className="flex items-center px-4 text-sm text-gray-600">
                    Page {page} of {totalPages}
                  </span>
                  <Button
                    variant="outline"
                    onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                    disabled={page === totalPages}
                  >
                    Next
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Preferences Tab */}
        <TabsContent value="preferences" className="space-y-6">
          {/* General Settings */}
          <Card>
            <CardHeader>
              <CardTitle>General Settings</CardTitle>
              <CardDescription>
                Configure how you receive notifications across different channels.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {preferences && (
                <div className="space-y-1">
                  <PreferenceSwitch
                    label="Email Notifications"
                    description="Receive notifications via email"
                    value={preferences.emailEnabled}
                    onChange={(value) => updatePreferences({ emailEnabled: value })}
                    icon={<Mail className="h-4 w-4 text-blue-500" />}
                  />
                  <PreferenceSwitch
                    label="Push Notifications"
                    description="Receive push notifications in your browser"
                    value={preferences.pushEnabled}
                    onChange={(value) => updatePreferences({ pushEnabled: value })}
                    icon={<Smartphone className="h-4 w-4 text-green-500" />}
                  />
                </div>
              )}
            </CardContent>
          </Card>

          {/* Activity Settings */}
          <Card>
            <CardHeader>
              <CardTitle>Activity Notifications</CardTitle>
              <CardDescription>
                Choose which activities you want to be notified about.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {preferences && (
                <div className="space-y-1">
                  <PreferenceSwitch
                    label="Review Likes"
                    description="When someone likes your review"
                    value={preferences.reviewLikes}
                    onChange={(value) => updatePreferences({ reviewLikes: value })}
                    icon={<Heart className="h-4 w-4 text-red-500" />}
                  />
                  <PreferenceSwitch
                    label="Review Comments"
                    description="When someone comments on your review"
                    value={preferences.reviewComments}
                    onChange={(value) => updatePreferences({ reviewComments: value })}
                    icon={<MessageCircle className="h-4 w-4 text-blue-500" />}
                  />
                  <PreferenceSwitch
                    label="New Followers"
                    description="When someone follows you"
                    value={preferences.newFollowers}
                    onChange={(value) => updatePreferences({ newFollowers: value })}
                    icon={<UserPlus className="h-4 w-4 text-indigo-500" />}
                  />
                  <PreferenceSwitch
                    label="Owner Responses"
                    description="When a restaurant owner responds to your review"
                    value={preferences.ownerResponses}
                    onChange={(value) => updatePreferences({ ownerResponses: value })}
                    icon={<MessageSquare className="h-4 w-4 text-purple-500" />}
                  />
                  <PreferenceSwitch
                    label="System Updates"
                    description="Important updates and announcements from Taste Trail"
                    value={preferences.systemUpdates}
                    onChange={(value) => updatePreferences({ systemUpdates: value })}
                    icon={<Megaphone className="h-4 w-4 text-orange-500" />}
                  />
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}