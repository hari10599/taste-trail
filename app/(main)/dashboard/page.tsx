'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Avatar } from '@/components/ui/avatar'
import { SearchInput } from '@/components/ui/search-input'
import { StarRating } from '@/components/ui/star-rating'
import { 
  StatsCardSkeleton, 
  TrendingRestaurantSkeleton, 
  RecentReviewSkeleton 
} from '@/components/dashboard/loading-states'
import { 
  MapPin, Star, MessageSquare, Heart, TrendingUp, Users, Award,
  ArrowRight, ChefHat, Clock, DollarSign, ArrowUpRight, ArrowDownRight,
  Search, Filter
} from 'lucide-react'
import axios from 'axios'
import Link from 'next/link'
import { formatDistanceToNow } from 'date-fns'

interface TrendingRestaurant {
  id: string
  name: string
  coverImage?: string
  categories: string[]
  averageRating: number
  reviewCount: number
  recentReviews: number
  trend: 'up' | 'down' | 'stable'
}

interface RecentReview {
  id: string
  rating: number
  title?: string
  content: string
  createdAt: string
  user: {
    id: string
    name: string
    avatar?: string
    role: string
  }
  restaurant: {
    id: string
    name: string
    coverImage?: string
  }
  _count: {
    likes: number
    comments: number
  }
}

export default function DashboardPage() {
  const [user, setUser] = useState<any>(null)
  const [stats, setStats] = useState({
    totalReviews: 0,
    totalLikes: 0,
    totalComments: 0,
  })
  const [trendingRestaurants, setTrendingRestaurants] = useState<TrendingRestaurant[]>([])
  const [recentReviews, setRecentReviews] = useState<RecentReview[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchDashboardData()
  }, [])

  const fetchDashboardData = async () => {
    try {
      setLoading(true)
      const token = localStorage.getItem('accessToken')
      
      // Fetch user data
      const userResponse = await axios.get('/api/auth/me', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
      setUser(userResponse.data.user)
      
      // Set stats from user data
      if (userResponse.data.user._count) {
        setStats({
          totalReviews: userResponse.data.user._count.reviews || 0,
          totalLikes: userResponse.data.user._count.likes || 0,
          totalComments: userResponse.data.user._count.comments || 0,
        })
      }

      // Fetch trending restaurants
      try {
        const trendingResponse = await axios.get('/api/restaurants/trending')
        setTrendingRestaurants(trendingResponse.data.restaurants || [])
      } catch (error) {
        console.error('Failed to fetch trending restaurants:', error)
      }

      // Fetch recent reviews
      try {
        const reviewsResponse = await axios.get('/api/reviews?limit=5&sortBy=createdAt')
        setRecentReviews(reviewsResponse.data.reviews || [])
      } catch (error) {
        console.error('Failed to fetch recent reviews:', error)
      }
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error)
    } finally {
      setLoading(false)
    }
  }

  const getTrendIcon = (trend: string) => {
    if (trend === 'up') return <ArrowUpRight className="h-4 w-4 text-green-500" />
    if (trend === 'down') return <ArrowDownRight className="h-4 w-4 text-red-500" />
    return <TrendingUp className="h-4 w-4 text-gray-400" />
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header with Search */}
      <div className="mb-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              Welcome back, {user?.name || 'Food Lover'}!
            </h1>
            <p className="text-gray-600 mt-2">
              Here's what's happening with your food journey
            </p>
          </div>
          <div className="flex items-center gap-4">
            <SearchInput 
              placeholder="Search restaurants, cuisines..." 
              className="hidden sm:block"
            />
            <Button
              variant="outline"
              size="icon"
              className="sm:hidden"
              onClick={() => {/* Mobile search modal */}}
            >
              <Search className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {loading ? (
          <>
            <StatsCardSkeleton />
            <StatsCardSkeleton />
            <StatsCardSkeleton />
          </>
        ) : (
          <>
            <Card className="hover:shadow-lg transition-all hover:-translate-y-1">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">
                  Total Reviews
                </CardTitle>
                <Star className="h-4 w-4 text-primary" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.totalReviews}</div>
                <p className="text-xs text-gray-500">
                  Share your dining experiences
                </p>
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg transition-all hover:-translate-y-1">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">
                  Total Likes
                </CardTitle>
                <Heart className="h-4 w-4 text-primary" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.totalLikes}</div>
                <p className="text-xs text-gray-500">
                  Reviews you've appreciated
                </p>
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg transition-all hover:-translate-y-1">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">
                  Total Comments
                </CardTitle>
                <MessageSquare className="h-4 w-4 text-primary" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.totalComments}</div>
                <p className="text-xs text-gray-500">
                  Conversations started
                </p>
              </CardContent>
            </Card>
          </>
        )}
      </div>


      {/* Trending Restaurants */}
      <Card className="mb-8">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-primary" />
              Trending Restaurants
            </CardTitle>
            <Link href="/restaurants?sort=trending">
              <Button variant="ghost" size="sm">
                View All
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {loading ? (
              <>
                <TrendingRestaurantSkeleton />
                <TrendingRestaurantSkeleton />
                <TrendingRestaurantSkeleton />
                <TrendingRestaurantSkeleton />
                <TrendingRestaurantSkeleton />
                <TrendingRestaurantSkeleton />
              </>
            ) : trendingRestaurants.length > 0 ? (
              trendingRestaurants.slice(0, 6).map((restaurant) => (
                <Link key={restaurant.id} href={`/restaurants/${restaurant.id}`}>
                  <Card className="hover:shadow-lg transition-all hover:-translate-y-1 h-full">
                    <div className="aspect-[16/10] relative overflow-hidden">
                      {restaurant.coverImage ? (
                        <img
                          src={restaurant.coverImage}
                          alt={restaurant.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center">
                          <ChefHat className="h-12 w-12 text-gray-400" />
                        </div>
                      )}
                      <div className="absolute top-2 right-2 bg-white/90 backdrop-blur rounded-full p-1">
                        {getTrendIcon(restaurant.trend)}
                      </div>
                    </div>
                    <CardContent className="p-4">
                      <h3 className="font-semibold text-lg mb-1">{restaurant.name}</h3>
                      <div className="flex flex-wrap gap-1 mb-2">
                        {restaurant.categories.slice(0, 2).map((category) => (
                          <Badge key={category} variant="secondary" className="text-xs">
                            {category}
                          </Badge>
                        ))}
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <div className="flex items-center gap-1">
                          <Star className="h-4 w-4 fill-yellow-500 text-yellow-500" />
                          <span className="font-medium">{restaurant.averageRating.toFixed(1)}</span>
                          <span className="text-gray-500">({restaurant.reviewCount})</span>
                        </div>
                        <span className="text-xs text-gray-500">
                          {restaurant.recentReviews} new reviews
                        </span>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))
            ) : (
              <div className="col-span-full text-center py-8 text-gray-500">
                No trending restaurants at the moment
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Recent Reviews */}
      <Card className="mb-8">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-primary" />
              Recent Reviews
            </CardTitle>
            <Link href="/timeline">
              <Button variant="ghost" size="sm">
                View Timeline
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {loading ? (
              <>
                <RecentReviewSkeleton />
                <RecentReviewSkeleton />
                <RecentReviewSkeleton />
              </>
            ) : recentReviews.length > 0 ? (
              recentReviews.map((review) => (
                <Card key={review.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      <Avatar
                        src={review.user.avatar}
                        alt={review.user.name}
                        fallback={review.user.name}
                      />
                      <div className="flex-1">
                        <div className="flex items-start justify-between mb-2">
                          <div>
                            <p className="font-semibold">{review.user.name}</p>
                            <Link 
                              href={`/restaurants/${review.restaurant.id}`}
                              className="text-sm text-primary hover:underline"
                            >
                              {review.restaurant.name}
                            </Link>
                          </div>
                          <div className="flex items-center gap-2">
                            <StarRating value={review.rating} readonly size="sm" />
                            <span className="text-xs text-gray-500">
                              {formatDistanceToNow(new Date(review.createdAt), { addSuffix: true })}
                            </span>
                          </div>
                        </div>
                        {review.title && (
                          <h4 className="font-medium mb-1">{review.title}</h4>
                        )}
                        <p className="text-gray-700 line-clamp-2">{review.content}</p>
                        <div className="flex items-center gap-4 mt-3 text-sm text-gray-500">
                          <button className="flex items-center gap-1 hover:text-primary transition">
                            <Heart className="h-4 w-4" />
                            {review._count.likes}
                          </button>
                          <button className="flex items-center gap-1 hover:text-primary transition">
                            <MessageSquare className="h-4 w-4" />
                            {review._count.comments}
                          </button>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            ) : (
              <div className="text-center py-8 text-gray-500">
                <MessageSquare className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                <p>No reviews yet. Be the first to share your experience!</p>
                <Link href="/reviews/new">
                  <Button variant="outline" size="sm" className="mt-4">
                    Write a Review
                  </Button>
                </Link>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Personalized Recommendations */}
      {user && (
        <Card className="mb-8">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Heart className="h-5 w-5 text-primary" />
                Recommended For You
              </CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <TrendingRestaurantSkeleton />
                <TrendingRestaurantSkeleton />
                <TrendingRestaurantSkeleton />
              </div>
            ) : (
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {/* Sample recommendations - would be based on user preferences */}
                  {trendingRestaurants.slice(0, 3).map((restaurant) => (
                    <Link key={`rec-${restaurant.id}`} href={`/restaurants/${restaurant.id}`}>
                      <Card className="hover:shadow-md transition-shadow h-full">
                        <div className="aspect-[16/10] relative overflow-hidden">
                          {restaurant.coverImage ? (
                            <img
                              src={restaurant.coverImage}
                              alt={restaurant.name}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full bg-gradient-to-br from-primary/10 to-secondary/10 flex items-center justify-center">
                              <ChefHat className="h-12 w-12 text-gray-400" />
                            </div>
                          )}
                          <div className="absolute top-2 left-2 bg-primary text-white px-2 py-1 rounded-full text-xs font-medium">
                            Recommended
                          </div>
                        </div>
                        <CardContent className="p-4">
                          <h3 className="font-semibold text-lg mb-1">{restaurant.name}</h3>
                          <div className="flex flex-wrap gap-1 mb-2">
                            {restaurant.categories.slice(0, 2).map((category) => (
                              <Badge key={category} variant="secondary" className="text-xs">
                                {category}
                              </Badge>
                            ))}
                          </div>
                          <div className="flex items-center justify-between text-sm">
                            <div className="flex items-center gap-1">
                              <Star className="h-4 w-4 fill-yellow-500 text-yellow-500" />
                              <span className="font-medium">{restaurant.averageRating.toFixed(1)}</span>
                              <span className="text-gray-500">({restaurant.reviewCount})</span>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </Link>
                  ))}
                </div>
                {trendingRestaurants.length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    <Heart className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                    <p>Tell us about your preferences to get personalized recommendations!</p>
                    <Link href="/restaurants">
                      <Button variant="outline" size="sm" className="mt-4">
                        Explore Restaurants
                      </Button>
                    </Link>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Quick Actions */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Link href="/restaurants">
              <Button className="w-full" variant="outline">
                <MapPin className="mr-2 h-4 w-4" />
                Find Restaurants
              </Button>
            </Link>
            <Link href="/reviews/new">
              <Button className="w-full" variant="outline">
                <Star className="mr-2 h-4 w-4" />
                Write a Review
              </Button>
            </Link>
            <Link href="/timeline">
              <Button className="w-full" variant="outline">
                <TrendingUp className="mr-2 h-4 w-4" />
                View Timeline
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>

      {/* Role-specific content */}
      {user?.role === 'INFLUENCER' && (
        <Card className="bg-gradient-to-r from-primary/10 to-secondary/10 border-primary/20">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Award className="mr-2 h-5 w-5 text-primary" />
              Influencer Dashboard
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-700 mb-4">
              As a verified influencer, you have access to special features and analytics.
            </p>
            <Button variant="secondary">
              View Influencer Stats
            </Button>
          </CardContent>
        </Card>
      )}

      {user?.role === 'OWNER' && (
        <Card className="bg-gradient-to-r from-green-50 to-emerald-50 border-green-200">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Users className="mr-2 h-5 w-5 text-green-600" />
              Restaurant Owner Dashboard
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-700 mb-4">
              Manage your restaurants and respond to customer reviews.
            </p>
            <Link href="/owner">
              <Button className="bg-green-600 hover:bg-green-700">
                Manage Restaurants
              </Button>
            </Link>
          </CardContent>
        </Card>
      )}
    </div>
  )
}