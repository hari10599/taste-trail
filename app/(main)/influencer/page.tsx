'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  Star, MessageSquare, Heart, TrendingUp, Eye, Users,
  Calendar, Award, Loader2, CheckCircle, Clock,
  BarChart3, Target, Trophy, Zap
} from 'lucide-react'
import axios from 'axios'
import toast from 'react-hot-toast'
import Link from 'next/link'
import { formatDistanceToNow } from 'date-fns'

interface InfluencerStats {
  totalReviews: number
  averageRating: number
  totalLikes: number
  totalViews: number
  engagementRate: number
  recentReviews: any[]
  topReviews: any[]
  monthlyStats: { month: string; reviews: number; likes: number }[]
  categoryDistribution: { category: string; count: number }[]
}

export default function InfluencerDashboard() {
  const router = useRouter()
  const [stats, setStats] = useState<InfluencerStats | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('overview')
  const [user, setUser] = useState<any>(null)

  useEffect(() => {
    checkInfluencerAccess()
    fetchInfluencerStats()
  }, [])

  const checkInfluencerAccess = async () => {
    try {
      const token = localStorage.getItem('accessToken')
      if (!token) {
        router.push('/login')
        return
      }

      const response = await axios.get('/api/auth/me', {
        headers: {
          Authorization: `Bearer ${token}`
        }
      })

      const userData = response.data.user
      if (userData.role !== 'INFLUENCER') {
        toast.error('Access denied. Influencer privileges required.')
        router.push('/dashboard')
        return
      }
      
      setUser(userData)
    } catch (error) {
      console.error('Access check failed:', error)
      toast.error('Failed to verify access')
      router.push('/login')
    }
  }

  const fetchInfluencerStats = async () => {
    try {
      const token = localStorage.getItem('accessToken')
      const response = await axios.get('/api/influencer/stats', {
        headers: {
          Authorization: `Bearer ${token}`
        }
      })
      
      setStats(response.data)
    } catch (error) {
      console.error('Failed to fetch stats:', error)
      toast.error('Failed to load statistics')
    } finally {
      setIsLoading(false)
    }
  }

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  if (!stats) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">Failed to load dashboard data.</p>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Influencer Dashboard</h1>
            <p className="text-gray-600 mt-1">Track your impact and engagement</p>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-purple-600 border-purple-600">
              <Award className="h-3 w-3 mr-1" />
              Verified Influencer
            </Badge>
            <Link href="/reviews/new">
              <Button>
                <MessageSquare className="h-4 w-4 mr-2" />
                Write Review
              </Button>
            </Link>
          </div>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="reviews">My Reviews</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
          <TabsTrigger value="insights">Insights</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          {/* Key Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Total Reviews</p>
                    <p className="text-2xl font-bold mt-1">{stats.totalReviews}</p>
                    <p className="text-xs text-green-600 mt-1">+12% this month</p>
                  </div>
                  <MessageSquare className="h-8 w-8 text-purple-500" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Average Rating</p>
                    <div className="flex items-center gap-2 mt-1">
                      <Star className="h-5 w-5 text-yellow-500 fill-yellow-500" />
                      <span className="text-2xl font-bold">{stats.averageRating.toFixed(1)}</span>
                    </div>
                  </div>
                  <Star className="h-8 w-8 text-yellow-500" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Total Engagement</p>
                    <p className="text-2xl font-bold mt-1">{stats.totalLikes}</p>
                    <p className="text-xs text-gray-500 mt-1">Likes received</p>
                  </div>
                  <Heart className="h-8 w-8 text-red-500" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Engagement Rate</p>
                    <p className="text-2xl font-bold mt-1">{stats.engagementRate}%</p>
                    <p className="text-xs text-blue-600 mt-1">Above average</p>
                  </div>
                  <TrendingUp className="h-8 w-8 text-blue-500" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Recent Activity */}
          <Card>
            <CardHeader>
              <CardTitle>Recent Reviews</CardTitle>
            </CardHeader>
            <CardContent>
              {stats.recentReviews && stats.recentReviews.length > 0 ? (
                <div className="space-y-4">
                  {stats.recentReviews.map((review) => (
                    <div key={review.id} className="flex items-start justify-between border-b pb-4 last:border-0">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <Link href={`/restaurants/${review.restaurant.id}`} className="font-medium hover:underline">
                            {review.restaurant.name}
                          </Link>
                          <div className="flex items-center">
                            {[...Array(5)].map((_, i) => (
                              <Star
                                key={i}
                                className={`h-4 w-4 ${
                                  i < review.rating
                                    ? 'text-yellow-500 fill-yellow-500'
                                    : 'text-gray-300'
                                }`}
                              />
                            ))}
                          </div>
                        </div>
                        <p className="text-sm text-gray-600 line-clamp-2">{review.content}</p>
                        <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                          <span>{formatDistanceToNow(new Date(review.createdAt), { addSuffix: true })}</span>
                          <span className="flex items-center gap-1">
                            <Heart className="h-3 w-3" />
                            {review._count.likes} likes
                          </span>
                          <span className="flex items-center gap-1">
                            <MessageSquare className="h-3 w-3" />
                            {review._count.comments} comments
                          </span>
                        </div>
                      </div>
                      <Link href={`/reviews/${review.id}`}>
                        <Button variant="ghost" size="sm">
                          <Eye className="h-4 w-4" />
                        </Button>
                      </Link>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 text-center py-4">No reviews yet</p>
              )}
            </CardContent>
          </Card>

          {/* Top Performing Reviews */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Trophy className="h-5 w-5 text-yellow-500" />
                Top Performing Reviews
              </CardTitle>
            </CardHeader>
            <CardContent>
              {stats.topReviews && stats.topReviews.length > 0 ? (
                <div className="space-y-4">
                  {stats.topReviews.map((review, index) => (
                    <div key={review.id} className="flex items-center gap-4">
                      <div className="flex-shrink-0 w-8 h-8 bg-yellow-100 rounded-full flex items-center justify-center text-sm font-bold text-yellow-700">
                        {index + 1}
                      </div>
                      <div className="flex-1">
                        <Link href={`/restaurants/${review.restaurant.id}`} className="font-medium text-sm hover:underline">
                          {review.restaurant.name}
                        </Link>
                        <div className="flex items-center gap-3 text-xs text-gray-500 mt-1">
                          <span className="flex items-center gap-1">
                            <Heart className="h-3 w-3 text-red-500" />
                            {review._count.likes}
                          </span>
                          <span className="flex items-center gap-1">
                            <MessageSquare className="h-3 w-3 text-blue-500" />
                            {review._count.comments}
                          </span>
                          <span className="flex items-center gap-1">
                            <Eye className="h-3 w-3 text-gray-500" />
                            {review.views || 0}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 text-center py-4">No top reviews yet</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Reviews Tab */}
        <TabsContent value="reviews" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>My Reviews</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-500 text-center py-8">
                View and manage all your reviews. Coming soon.
              </p>
              <div className="text-center">
                <Link href="/profile/reviews">
                  <Button variant="outline">View All Reviews</Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Analytics Tab */}
        <TabsContent value="analytics" className="space-y-6">
          {/* Monthly Trends */}
          <Card>
            <CardHeader>
              <CardTitle>Monthly Performance</CardTitle>
            </CardHeader>
            <CardContent>
              {stats.monthlyStats && stats.monthlyStats.length > 0 ? (
                <div className="space-y-4">
                  {stats.monthlyStats.map((month) => (
                    <div key={month.month} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <span className="font-medium">{month.month}</span>
                      <div className="flex items-center gap-6">
                        <span className="text-sm">
                          <MessageSquare className="h-4 w-4 inline mr-1" />
                          {month.reviews} reviews
                        </span>
                        <span className="text-sm">
                          <Heart className="h-4 w-4 inline mr-1 text-red-500" />
                          {month.likes} likes
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 text-center py-4">No data available</p>
              )}
            </CardContent>
          </Card>

          {/* Category Distribution */}
          <Card>
            <CardHeader>
              <CardTitle>Reviews by Category</CardTitle>
            </CardHeader>
            <CardContent>
              {stats.categoryDistribution && stats.categoryDistribution.length > 0 ? (
                <div className="space-y-3">
                  {stats.categoryDistribution.map((category) => {
                    const percentage = stats.totalReviews > 0 
                      ? (category.count / stats.totalReviews) * 100 
                      : 0
                    
                    return (
                      <div key={category.category} className="space-y-1">
                        <div className="flex items-center justify-between text-sm">
                          <span>{category.category}</span>
                          <span className="text-gray-600">{category.count} reviews</span>
                        </div>
                        <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-purple-500"
                            style={{ width: `${percentage}%` }}
                          />
                        </div>
                      </div>
                    )
                  })}
                </div>
              ) : (
                <p className="text-gray-500 text-center py-4">No category data available</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Insights Tab */}
        <TabsContent value="insights" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="h-5 w-5 text-blue-500" />
                  Performance Goals
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm">Monthly Reviews</span>
                      <span className="text-sm font-medium">8 / 10</span>
                    </div>
                    <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                      <div className="h-full bg-blue-500" style={{ width: '80%' }} />
                    </div>
                  </div>
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm">Engagement Rate</span>
                      <span className="text-sm font-medium">15% / 20%</span>
                    </div>
                    <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                      <div className="h-full bg-green-500" style={{ width: '75%' }} />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Zap className="h-5 w-5 text-yellow-500" />
                  Quick Actions
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <Link href="/reviews/new" className="block">
                    <Button variant="outline" className="w-full justify-start">
                      <MessageSquare className="h-4 w-4 mr-2" />
                      Write a Review
                    </Button>
                  </Link>
                  <Link href="/restaurants" className="block">
                    <Button variant="outline" className="w-full justify-start">
                      <Star className="h-4 w-4 mr-2" />
                      Discover Restaurants
                    </Button>
                  </Link>
                  <Link href="/profile" className="block">
                    <Button variant="outline" className="w-full justify-start">
                      <Users className="h-4 w-4 mr-2" />
                      Update Profile
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Tips for Success</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-medium text-sm">Write Detailed Reviews</p>
                    <p className="text-xs text-gray-600">Include photos and specific details about your experience</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-medium text-sm">Engage with Comments</p>
                    <p className="text-xs text-gray-600">Respond to user comments on your reviews</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-medium text-sm">Stay Consistent</p>
                    <p className="text-xs text-gray-600">Regular reviews help maintain your influencer status</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}