'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Checkbox } from '@/components/ui/checkbox'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  Bell, Send, TrendingUp, Users, MessageSquare, 
  BarChart3, Wifi, Clock, Megaphone, AlertCircle,
  CheckCircle, XCircle, Activity
} from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import axios from 'axios'
import toast from 'react-hot-toast'

interface NotificationStats {
  notifications: {
    total: number
    today: number
    yesterday: number
    weekly: number
    monthly: number
    unread: number
    byType: Record<string, number>
  }
  users: {
    total: number
    withNotifications: number
    avgNotificationsPerUser: number
  }
  realTime: {
    activeConnections: number
  }
  recent: Array<{
    id: string
    title: string
    message: string
    createdAt: string
    from?: {
      name: string
      role: string
    }
  }>
}

export default function AdminNotificationsPage() {
  const [stats, setStats] = useState<NotificationStats | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSending, setIsSending] = useState(false)
  
  // Announcement form
  const [title, setTitle] = useState('')
  const [message, setMessage] = useState('')
  const [targetRoles, setTargetRoles] = useState<string[]>([])
  const [targetVerified, setTargetVerified] = useState<boolean | null>(null)

  useEffect(() => {
    fetchStats()
    // Refresh stats every 30 seconds
    const interval = setInterval(fetchStats, 30000)
    return () => clearInterval(interval)
  }, [])

  const fetchStats = async () => {
    try {
      const token = localStorage.getItem('accessToken')
      const response = await axios.get('/api/admin/notifications', {
        headers: { Authorization: `Bearer ${token}` }
      })
      setStats(response.data.stats)
    } catch (error) {
      console.error('Failed to fetch notification stats:', error)
      toast.error('Failed to load notification statistics')
    } finally {
      setIsLoading(false)
    }
  }

  const sendAnnouncement = async () => {
    if (!title.trim() || !message.trim()) {
      toast.error('Please provide both title and message')
      return
    }

    try {
      setIsSending(true)
      const token = localStorage.getItem('accessToken')
      
      const userFilter: any = {}
      if (targetRoles.length > 0) {
        userFilter.roles = targetRoles
      }
      if (targetVerified !== null) {
        userFilter.verified = targetVerified
      }

      await axios.post('/api/admin/notifications', {
        title,
        message,
        userFilter: Object.keys(userFilter).length > 0 ? userFilter : undefined
      }, {
        headers: { Authorization: `Bearer ${token}` }
      })

      toast.success('System announcement sent successfully')
      setTitle('')
      setMessage('')
      setTargetRoles([])
      setTargetVerified(null)
      
      // Refresh stats to see the new announcement
      fetchStats()
    } catch (error) {
      console.error('Failed to send announcement:', error)
      toast.error('Failed to send announcement')
    } finally {
      setIsSending(false)
    }
  }

  const handleRoleToggle = (role: string) => {
    setTargetRoles(prev => 
      prev.includes(role) 
        ? prev.filter(r => r !== role)
        : [...prev, role]
    )
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-32 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">Notification Management</h1>
        <p className="text-gray-600 mt-2">
          Monitor notification analytics and send system announcements.
        </p>
      </div>

      {/* Stats Overview */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Notifications</CardTitle>
              <Bell className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.notifications.total.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">
                {stats.notifications.today} sent today
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Users</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.users.withNotifications.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">
                {((stats.users.withNotifications / stats.users.total) * 100).toFixed(1)}% of all users
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Real-time Connections</CardTitle>
              <Wifi className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.realTime.activeConnections}</div>
              <p className="text-xs text-muted-foreground">
                Active SSE connections
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Unread Notifications</CardTitle>
              <AlertCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.notifications.unread.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">
                {((stats.notifications.unread / stats.notifications.total) * 100).toFixed(1)}% unread
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      <Tabs defaultValue="analytics" className="space-y-6">
        <TabsList>
          <TabsTrigger value="analytics" className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            Analytics
          </TabsTrigger>
          <TabsTrigger value="announcements" className="flex items-center gap-2">
            <Megaphone className="h-4 w-4" />
            Announcements
          </TabsTrigger>
        </TabsList>

        {/* Analytics Tab */}
        <TabsContent value="analytics" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Notification Types */}
            <Card>
              <CardHeader>
                <CardTitle>Notifications by Type</CardTitle>
                <CardDescription>
                  Distribution of notification types sent
                </CardDescription>
              </CardHeader>
              <CardContent>
                {stats && (
                  <div className="space-y-3">
                    {Object.entries(stats.notifications.byType)
                      .sort(([,a], [,b]) => b - a)
                      .map(([type, count]) => (
                        <div key={type} className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <div className={`w-3 h-3 rounded-full ${
                              type === 'like' ? 'bg-red-500' :
                              type === 'comment' ? 'bg-blue-500' :
                              type === 'new_review' ? 'bg-green-500' :
                              type === 'system_announcement' ? 'bg-orange-500' :
                              'bg-gray-500'
                            }`} />
                            <span className="text-sm capitalize">
                              {type.replace('_', ' ')}
                            </span>
                          </div>
                          <Badge variant="outline">{count}</Badge>
                        </div>
                      ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Recent Activity */}
            <Card>
              <CardHeader>
                <CardTitle>Recent Activity</CardTitle>
                <CardDescription>
                  Latest notification trends
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Today</span>
                    <div className="flex items-center gap-2">
                      <Badge variant={stats?.notifications.today ? 'default' : 'secondary'}>
                        {stats?.notifications.today || 0}
                      </Badge>
                      <TrendingUp className="h-4 w-4 text-green-500" />
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Yesterday</span>
                    <Badge variant="outline">
                      {stats?.notifications.yesterday || 0}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">This Week</span>
                    <Badge variant="outline">
                      {stats?.notifications.weekly || 0}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">This Month</span>
                    <Badge variant="outline">
                      {stats?.notifications.monthly || 0}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Avg per User</span>
                    <Badge variant="outline">
                      {stats?.users.avgNotificationsPerUser || 0}
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Recent System Announcements */}
          <Card>
            <CardHeader>
              <CardTitle>Recent System Announcements</CardTitle>
              <CardDescription>
                Latest announcements sent to users
              </CardDescription>
            </CardHeader>
            <CardContent>
              {stats?.recent.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <Megaphone className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                  <p>No system announcements yet</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {stats?.recent.map((announcement) => (
                    <div key={announcement.id} className="flex items-start gap-3 p-4 border rounded-lg">
                      <Megaphone className="h-5 w-5 text-orange-500 mt-0.5" />
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium">{announcement.title}</h4>
                        <p className="text-sm text-gray-600 mt-1">{announcement.message}</p>
                        <div className="flex items-center gap-2 mt-2 text-xs text-gray-500">
                          <Clock className="h-3 w-3" />
                          {formatDistanceToNow(new Date(announcement.createdAt), { addSuffix: true })}
                          {announcement.from && (
                            <>
                              <span>•</span>
                              <span>by {announcement.from.name}</span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Announcements Tab */}
        <TabsContent value="announcements" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Send System Announcement</CardTitle>
              <CardDescription>
                Send important messages to all users or specific groups.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div>
                  <Label htmlFor="title">Title</Label>
                  <Input
                    id="title"
                    placeholder="Announcement title..."
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    maxLength={100}
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    {title.length}/100 characters
                  </p>
                </div>

                <div>
                  <Label htmlFor="message">Message</Label>
                  <Textarea
                    id="message"
                    placeholder="Write your announcement message here..."
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    rows={4}
                    maxLength={500}
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    {message.length}/500 characters
                  </p>
                </div>

                <div>
                  <Label>Target Audience (Optional)</Label>
                  <div className="space-y-3 mt-2">
                    <div>
                      <Label className="text-sm font-normal">User Roles</Label>
                      <div className="flex flex-wrap gap-2 mt-1">
                        {['USER', 'INFLUENCER', 'OWNER', 'MODERATOR', 'ADMIN'].map((role) => (
                          <div key={role} className="flex items-center space-x-2">
                            <Checkbox
                              id={role}
                              checked={targetRoles.includes(role)}
                              onCheckedChange={() => handleRoleToggle(role)}
                            />
                            <Label htmlFor={role} className="text-sm font-normal capitalize">
                              {role.toLowerCase()}
                            </Label>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div>
                      <Label className="text-sm font-normal">Verification Status</Label>
                      <div className="flex gap-4 mt-1">
                        <div className="flex items-center space-x-2">
                          <Checkbox
                            id="verified"
                            checked={targetVerified === true}
                            onCheckedChange={(checked) => 
                              setTargetVerified(checked ? true : null)
                            }
                          />
                          <Label htmlFor="verified" className="text-sm font-normal">
                            Verified users only
                          </Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Checkbox
                            id="unverified"
                            checked={targetVerified === false}
                            onCheckedChange={(checked) => 
                              setTargetVerified(checked ? false : null)
                            }
                          />
                          <Label htmlFor="unverified" className="text-sm font-normal">
                            Unverified users only
                          </Label>
                        </div>
                      </div>
                    </div>
                  </div>
                  <p className="text-xs text-gray-500 mt-2">
                    Leave filters empty to send to all users
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  onClick={sendAnnouncement}
                  disabled={isSending || !title.trim() || !message.trim()}
                  className="flex items-center gap-2"
                >
                  {isSending ? (
                    <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <Send className="h-4 w-4" />
                  )}
                  {isSending ? 'Sending...' : 'Send Announcement'}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    setTitle('')
                    setMessage('')
                    setTargetRoles([])
                    setTargetVerified(null)
                  }}
                  disabled={isSending}
                >
                  Clear
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}