'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import axios from 'axios'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { StarRating } from '@/components/ui/star-rating'
import {
  Star, MessageSquare, ThumbsUp, TrendingUp, Calendar,
  Eye, EyeOff, Award, Filter, ChevronLeft, BarChart3,
  Users, Clock
} from 'lucide-react'
import Link from 'next/link'
import toast from 'react-hot-toast'
import { format } from 'date-fns'
import { Line, Bar, Pie } from 'react-chartjs-2'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js'

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
)

interface Analytics {
  overview: {
    totalReviews: number
    avgRating: number
    totalLikes: number
    totalComments: number
  }
  ratingDistribution: Record<string, number>
  reviewTrend: Array<{ date: string; count: number }>
  ratingTrend: Array<{ date: string; rating: number }>
  topReviewers: Array<{
    user: { name: string; avatar?: string; role: string }
    reviewCount: number
    avgRating: number
    totalLikes: number
  }>
  recentReviews: Array<{
    id: string
    rating: number
    title?: string
    content: string
    user: { name: string; avatar?: string; role: string }
    createdAt: string
    likes: number
    comments: number
    isPromoted: boolean
    isHidden: boolean
  }>
  sentiment: {
    positive: number
    neutral: number
    negative: number
  }
}

interface Review {
  id: string
  rating: number
  title?: string
  content: string
  user: {
    id: string
    name: string
    avatar?: string
    role: string
  }
  _count: {
    likes: number
    comments: number
  }
  createdAt: string
  isPromoted: boolean
  isHidden: boolean
}

export default function RestaurantManagement() {
  const params = useParams()
  const router = useRouter()
  const restaurantId = params.id as string

  const [loading, setLoading] = useState(true)
  const [analytics, setAnalytics] = useState<Analytics | null>(null)
  const [reviews, setReviews] = useState<Review[]>([])
  const [selectedTab, setSelectedTab] = useState('analytics')
  const [reviewFilter, setReviewFilter] = useState('all')
  const [reviewSort, setReviewSort] = useState('recent')
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)

  useEffect(() => {
    fetchAnalytics()
    fetchReviews()
  }, [restaurantId])

  useEffect(() => {
    fetchReviews()
  }, [reviewFilter, reviewSort, page])

  const fetchAnalytics = async () => {
    try {
      const token = localStorage.getItem('accessToken')
      const response = await axios.get(`/api/owner/restaurants/${restaurantId}/analytics`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
      setAnalytics(response.data.analytics)
    } catch (error) {
      toast.error('Failed to fetch analytics')
    }
  }

  const fetchReviews = async () => {
    try {
      setLoading(true)
      const token = localStorage.getItem('accessToken')
      const response = await axios.get(
        `/api/owner/restaurants/${restaurantId}/reviews?page=${page}&filter=${reviewFilter}&sort=${reviewSort}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      )
      setReviews(response.data.reviews)
      setTotalPages(response.data.pagination.pages)
    } catch (error) {
      toast.error('Failed to fetch reviews')
    } finally {
      setLoading(false)
    }
  }

  const handleReviewAction = async (reviewId: string, action: 'promote' | 'hide', value: boolean) => {
    try {
      const token = localStorage.getItem('accessToken')
      await axios.patch(
        `/api/owner/restaurants/${restaurantId}/reviews`,
        { reviewId, action, value },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      )
      toast.success(`Review ${action}d successfully`)
      fetchReviews()
    } catch (error) {
      toast.error(`Failed to ${action} review`)
    }
  }

  if (!analytics && loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/3"></div>
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6">
        <Link
          href="/owner"
          className="inline-flex items-center text-gray-600 hover:text-gray-900 mb-4"
        >
          <ChevronLeft className="h-4 w-4 mr-1" />
          Back to Dashboard
        </Link>
        <h1 className="text-3xl font-bold">Restaurant Management</h1>
      </div>

      <Tabs value={selectedTab} onValueChange={setSelectedTab}>
        <TabsList className="mb-6">
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
          <TabsTrigger value="reviews">Reviews</TabsTrigger>
        </TabsList>

        <TabsContent value="analytics" className="space-y-6">
          {analytics && (
            <>
              {/* Overview Cards */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-gray-600">Total Reviews</p>
                        <p className="text-2xl font-bold">{analytics.overview.totalReviews}</p>
                      </div>
                      <MessageSquare className="h-8 w-8 text-primary" />
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-gray-600">Average Rating</p>
                        <p className="text-2xl font-bold">{analytics.overview.avgRating.toFixed(1)}</p>
                      </div>
                      <Star className="h-8 w-8 text-primary" />
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-gray-600">Total Likes</p>
                        <p className="text-2xl font-bold">{analytics.overview.totalLikes}</p>
                      </div>
                      <ThumbsUp className="h-8 w-8 text-primary" />
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-gray-600">Engagement</p>
                        <p className="text-2xl font-bold">{analytics.overview.totalComments}</p>
                      </div>
                      <TrendingUp className="h-8 w-8 text-primary" />
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Charts */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Review Trend */}
                <Card>
                  <CardHeader>
                    <CardTitle>Review Trend</CardTitle>
                    <CardDescription>Number of reviews over time</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Line
                      data={{
                        labels: analytics.reviewTrend.map(d => format(new Date(d.date), 'MMM d')),
                        datasets: [{
                          label: 'Reviews',
                          data: analytics.reviewTrend.map(d => d.count),
                          borderColor: 'rgb(59, 130, 246)',
                          backgroundColor: 'rgba(59, 130, 246, 0.1)',
                          tension: 0.4,
                        }],
                      }}
                      options={{
                        responsive: true,
                        plugins: {
                          legend: { display: false },
                        },
                        scales: {
                          y: {
                            beginAtZero: true,
                            ticks: { stepSize: 1 },
                          },
                        },
                      }}
                    />
                  </CardContent>
                </Card>

                {/* Rating Distribution */}
                <Card>
                  <CardHeader>
                    <CardTitle>Rating Distribution</CardTitle>
                    <CardDescription>Breakdown of review ratings</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Bar
                      data={{
                        labels: ['5 Stars', '4 Stars', '3 Stars', '2 Stars', '1 Star'],
                        datasets: [{
                          label: 'Reviews',
                          data: [
                            analytics.ratingDistribution[5],
                            analytics.ratingDistribution[4],
                            analytics.ratingDistribution[3],
                            analytics.ratingDistribution[2],
                            analytics.ratingDistribution[1],
                          ],
                          backgroundColor: [
                            'rgba(34, 197, 94, 0.8)',
                            'rgba(59, 130, 246, 0.8)',
                            'rgba(251, 191, 36, 0.8)',
                            'rgba(251, 146, 60, 0.8)',
                            'rgba(239, 68, 68, 0.8)',
                          ],
                        }],
                      }}
                      options={{
                        responsive: true,
                        plugins: {
                          legend: { display: false },
                        },
                      }}
                    />
                  </CardContent>
                </Card>

                {/* Sentiment Analysis */}
                <Card>
                  <CardHeader>
                    <CardTitle>Sentiment Analysis</CardTitle>
                    <CardDescription>Overall review sentiment</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Pie
                      data={{
                        labels: ['Positive', 'Neutral', 'Negative'],
                        datasets: [{
                          data: [
                            analytics.sentiment.positive,
                            analytics.sentiment.neutral,
                            analytics.sentiment.negative,
                          ],
                          backgroundColor: [
                            'rgba(34, 197, 94, 0.8)',
                            'rgba(156, 163, 175, 0.8)',
                            'rgba(239, 68, 68, 0.8)',
                          ],
                        }],
                      }}
                      options={{
                        responsive: true,
                        plugins: {
                          legend: { position: 'bottom' },
                        },
                      }}
                    />
                  </CardContent>
                </Card>

                {/* Top Reviewers */}
                <Card>
                  <CardHeader>
                    <CardTitle>Top Reviewers</CardTitle>
                    <CardDescription>Most active reviewers</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {analytics.topReviewers.map((reviewer, index) => (
                        <div key={index} className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <img
                              src={reviewer.user.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${reviewer.user.name}`}
                              alt={reviewer.user.name}
                              className="w-10 h-10 rounded-full"
                            />
                            <div>
                              <p className="font-medium">{reviewer.user.name}</p>
                              <p className="text-sm text-gray-600">
                                {reviewer.reviewCount} reviews • {reviewer.avgRating.toFixed(1)} avg
                              </p>
                            </div>
                          </div>
                          {reviewer.user.role === 'INFLUENCER' && (
                            <Badge variant="secondary">Influencer</Badge>
                          )}
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Recent Reviews */}
              <Card>
                <CardHeader>
                  <CardTitle>Recent Reviews</CardTitle>
                  <CardDescription>Latest reviews for your restaurant</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {analytics.recentReviews.map((review) => (
                      <div key={review.id} className="border-b pb-4 last:border-0">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <StarRating value={review.rating} readonly size="sm" />
                              <span className="font-medium">{review.user.name}</span>
                              {review.user.role === 'INFLUENCER' && (
                                <Badge variant="secondary" className="text-xs">Influencer</Badge>
                              )}
                            </div>
                            {review.title && (
                              <h4 className="font-medium mb-1">{review.title}</h4>
                            )}
                            <p className="text-sm text-gray-600">{review.content}</p>
                            <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
                              <span>{format(new Date(review.createdAt), 'MMM d, yyyy')}</span>
                              <span>{review.likes} likes</span>
                              <span>{review.comments} comments</span>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            {review.isPromoted && (
                              <Badge variant="default">Promoted</Badge>
                            )}
                            {review.isHidden && (
                              <Badge variant="secondary">Hidden</Badge>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </>
          )}
        </TabsContent>

        <TabsContent value="reviews" className="space-y-6">
          {/* Filters */}
          <Card>
            <CardContent className="p-4">
              <div className="flex flex-wrap gap-4">
                <Select value={reviewFilter} onValueChange={setReviewFilter}>
                  <SelectTrigger className="w-48">
                    <SelectValue placeholder="Filter reviews" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Reviews</SelectItem>
                    <SelectItem value="promoted">Promoted</SelectItem>
                    <SelectItem value="hidden">Hidden</SelectItem>
                    <SelectItem value="verified">Verified Users</SelectItem>
                    <SelectItem value="high-rated">High Rated (4+)</SelectItem>
                    <SelectItem value="low-rated">Low Rated (2-)</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={reviewSort} onValueChange={setReviewSort}>
                  <SelectTrigger className="w-48">
                    <SelectValue placeholder="Sort by" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="recent">Most Recent</SelectItem>
                    <SelectItem value="rating-high">Highest Rated</SelectItem>
                    <SelectItem value="rating-low">Lowest Rated</SelectItem>
                    <SelectItem value="likes">Most Liked</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Reviews List */}
          <div className="space-y-4">
            {reviews.map((review) => (
              <Card key={review.id}>
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <img
                          src={review.user.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${review.user.name}`}
                          alt={review.user.name}
                          className="w-10 h-10 rounded-full"
                        />
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-medium">{review.user.name}</span>
                            {review.user.role === 'INFLUENCER' && (
                              <Badge variant="secondary">Influencer</Badge>
                            )}
                          </div>
                          <StarRating value={review.rating} readonly size="sm" />
                        </div>
                      </div>
                      {review.title && (
                        <h4 className="font-semibold mb-2">{review.title}</h4>
                      )}
                      <p className="text-gray-700 mb-3">{review.content}</p>
                      <div className="flex items-center gap-4 text-sm text-gray-500">
                        <span>{format(new Date(review.createdAt), 'MMM d, yyyy')}</span>
                        <span>{review._count.likes} likes</span>
                        <span>{review._count.comments} comments</span>
                      </div>
                    </div>
                    <div className="flex flex-col gap-2">
                      <Button
                        variant={review.isPromoted ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => handleReviewAction(review.id, 'promote', !review.isPromoted)}
                      >
                        <Award className="h-4 w-4 mr-1" />
                        {review.isPromoted ? 'Promoted' : 'Promote'}
                      </Button>
                      <Button
                        variant={review.isHidden ? 'destructive' : 'outline'}
                        size="sm"
                        onClick={() => handleReviewAction(review.id, 'hide', !review.isHidden)}
                      >
                        {review.isHidden ? (
                          <>
                            <Eye className="h-4 w-4 mr-1" />
                            Show
                          </>
                        ) : (
                          <>
                            <EyeOff className="h-4 w-4 mr-1" />
                            Hide
                          </>
                        )}
                      </Button>
                      <Link href={`/owner/reviews/${review.id}/respond`}>
                        <Button variant="outline" size="sm" className="w-full">
                          <MessageSquare className="h-4 w-4 mr-1" />
                          Respond
                        </Button>
                      </Link>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex justify-center gap-2">
              <Button
                variant="outline"
                disabled={page === 1}
                onClick={() => setPage(page - 1)}
              >
                Previous
              </Button>
              <span className="flex items-center px-4">
                Page {page} of {totalPages}
              </span>
              <Button
                variant="outline"
                disabled={page === totalPages}
                onClick={() => setPage(page + 1)}
              >
                Next
              </Button>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}