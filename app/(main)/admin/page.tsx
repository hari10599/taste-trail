'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { 
  Users, Building, FileText, Flag, TrendingUp, AlertTriangle,
  Star, MessageSquare, Eye, Clock, ShieldCheck, UserX
} from 'lucide-react'
import axios from 'axios'
import { formatDistanceToNow } from 'date-fns'

interface PlatformStats {
  users: {
    total: number
    verified: number
    influencers: number
    owners: number
    newThisMonth: number
  }
  restaurants: {
    total: number
    verified: number
    newThisMonth: number
  }
  reviews: {
    total: number
    newThisMonth: number
    averageRating: number
  }
  reports: {
    pending: number
    resolved: number
    total: number
  }
  moderation: {
    actionsThisMonth: number
    bannedUsers: number
    flaggedContent: number
  }
}

interface RecentActivity {
  id: string
  type: string
  description: string
  user?: {
    name: string
    role: string
  }
  createdAt: string
  status?: string
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<PlatformStats | null>(null)
  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchDashboardData()
  }, [])

  const fetchDashboardData = async () => {
    try {
      const token = localStorage.getItem('accessToken')
      const [statsResponse, activityResponse] = await Promise.all([
        axios.get('/api/admin/dashboard', {
          headers: { Authorization: `Bearer ${token}` }
        }),
        axios.get('/api/admin/activity', {
          headers: { Authorization: `Bearer ${token}` }
        })
      ])

      setStats(statsResponse.data)
      setRecentActivity(activityResponse.data.activities)
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error)
    } finally {
      setLoading(false)
    }
  }

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'user_registered': return <Users className="h-4 w-4 text-green-500" />
      case 'report_submitted': return <Flag className="h-4 w-4 text-yellow-500" />
      case 'user_banned': return <UserX className="h-4 w-4 text-red-500" />
      case 'content_flagged': return <AlertTriangle className="h-4 w-4 text-orange-500" />
      case 'restaurant_added': return <Building className="h-4 w-4 text-blue-500" />
      case 'review_posted': return <FileText className="h-4 w-4 text-purple-500" />
      default: return <Clock className="h-4 w-4 text-gray-500" />
    }
  }

  const getActivityStatusBadge = (type: string, status?: string) => {
    if (type === 'report_submitted') {
      switch (status) {
        case 'pending': return <Badge variant="outline" className="text-yellow-600">Pending</Badge>
        case 'resolved': return <Badge variant="outline" className="text-green-600">Resolved</Badge>
        case 'investigating': return <Badge variant="outline" className="text-blue-600">Investigating</Badge>
        default: return null
      }
    }
    return null
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/3 mb-6"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-32 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
        <p className="text-gray-600 mt-2">
          Platform overview and key metrics
        </p>
      </div>

      {/* Key Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Total Users */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.users.total.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              +{stats?.users.newThisMonth} this month
            </p>
            <div className="flex gap-2 mt-2 text-xs">
              <span className="text-blue-600">{stats?.users.influencers} influencers</span>
              <span className="text-green-600">{stats?.users.owners} owners</span>
            </div>
          </CardContent>
        </Card>

        {/* Total Restaurants */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Restaurants</CardTitle>
            <Building className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.restaurants.total.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              +{stats?.restaurants.newThisMonth} this month
            </p>
            <div className="text-xs text-green-600 mt-1">
              {stats?.restaurants.verified} verified
            </div>
          </CardContent>
        </Card>

        {/* Reviews */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Reviews</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.reviews.total.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              +{stats?.reviews.newThisMonth} this month
            </p>
            <div className="flex items-center gap-1 mt-1 text-xs">
              <Star className="h-3 w-3 fill-yellow-500 text-yellow-500" />
              <span>{stats?.reviews.averageRating.toFixed(1)} avg rating</span>
            </div>
          </CardContent>
        </Card>

        {/* Pending Reports */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Reports</CardTitle>
            <Flag className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{stats?.reports.pending}</div>
            <p className="text-xs text-muted-foreground">
              {stats?.reports.total} total reports
            </p>
            <div className="text-xs text-green-600 mt-1">
              {stats?.reports.resolved} resolved
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Secondary Stats */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Moderation Stats */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ShieldCheck className="h-5 w-5 text-red-500" />
              Moderation Activity
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Actions This Month</span>
              <span className="font-semibold">{stats?.moderation.actionsThisMonth}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Banned Users</span>
              <span className="font-semibold text-red-600">{stats?.moderation.bannedUsers}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Flagged Content</span>
              <span className="font-semibold text-orange-600">{stats?.moderation.flaggedContent}</span>
            </div>
          </CardContent>
        </Card>

        {/* User Breakdown */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5 text-blue-500" />
              User Breakdown
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Regular Users</span>
              <span className="font-semibold">
                {stats ? stats.users.total - stats.users.influencers - stats.users.owners : 0}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Influencers</span>
              <span className="font-semibold text-purple-600">{stats?.users.influencers}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Restaurant Owners</span>
              <span className="font-semibold text-green-600">{stats?.users.owners}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Verified Users</span>
              <span className="font-semibold text-blue-600">{stats?.users.verified}</span>
            </div>
          </CardContent>
        </Card>

        {/* Platform Health */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-green-500" />
              Platform Health
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Report Resolution Rate</span>
              <span className="font-semibold text-green-600">
                {stats ? Math.round((stats.reports.resolved / stats.reports.total) * 100) : 0}%
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Active Moderation</span>
              <Badge variant="outline" className="text-green-600">Healthy</Badge>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">User Growth</span>
              <Badge variant="outline" className="text-blue-600">Positive</Badge>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
          <CardDescription>Latest platform activities and events</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {recentActivity.length === 0 ? (
              <p className="text-gray-500 text-center py-4">No recent activity</p>
            ) : (
              recentActivity.map((activity) => (
                <div key={activity.id} className="flex items-start gap-3 p-4 border rounded-lg">
                  {getActivityIcon(activity.type)}
                  <div className="flex-1">
                    <p className="text-sm font-medium">{activity.description}</p>
                    {activity.user && (
                      <p className="text-xs text-gray-500">
                        by {activity.user.name} ({activity.user.role})
                      </p>
                    )}
                    <p className="text-xs text-gray-400 mt-1">
                      {formatDistanceToNow(new Date(activity.createdAt), { addSuffix: true })}
                    </p>
                  </div>
                  {getActivityStatusBadge(activity.type, activity.status)}
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}