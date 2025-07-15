'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Avatar } from '@/components/ui/avatar'
import { UserBadge } from '@/components/ui/user-badge'
import { FollowButton } from '@/components/FollowButton'
import { ReviewCard } from '@/components/ReviewCard'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  MapPin, Calendar, Star, Users, MessageSquare, 
  Building, Loader2, ChefHat, Award
} from 'lucide-react'
import axios from 'axios'
import toast from 'react-hot-toast'
import { formatDistanceToNow } from 'date-fns'

interface UserProfile {
  id: string
  name: string
  email: string
  avatar?: string
  bio?: string
  role: string
  verified: boolean
  createdAt: string
  profile?: {
    location?: string
    dietaryPrefs?: string[]
    cuisinePreferences?: string[]
  }
  _count: {
    reviews: number
    followers: number
    following: number
    restaurants?: number
  }
}

interface Review {
  id: string
  rating: number
  title?: string
  content: string
  images: string[]
  visitDate: string
  pricePerPerson?: number
  createdAt: string
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

export default function UserProfilePage() {
  const params = useParams()
  const userId = params.id as string
  
  const [user, setUser] = useState<UserProfile | null>(null)
  const [currentUser, setCurrentUser] = useState<any>(null)
  const [reviews, setReviews] = useState<Review[]>([])
  const [followers, setFollowers] = useState<any[]>([])
  const [following, setFollowing] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('reviews')
  const [followCounts, setFollowCounts] = useState({ followers: 0, following: 0 })
  const [likedReviews, setLikedReviews] = useState<Set<string>>(new Set())
  const [reviewsPage, setReviewsPage] = useState(1)
  const [hasMoreReviews, setHasMoreReviews] = useState(true)
  const [isLoadingMore, setIsLoadingMore] = useState(false)

  useEffect(() => {
    checkAuth()
    fetchUserProfile()
  }, [userId])

  useEffect(() => {
    if (activeTab === 'reviews') {
      fetchUserReviews()
    } else if (activeTab === 'followers') {
      fetchFollowers()
    } else if (activeTab === 'following') {
      fetchFollowing()
    }
  }, [activeTab])

  const checkAuth = async () => {
    try {
      const token = localStorage.getItem('accessToken')
      if (!token) return

      const response = await axios.get('/api/auth/me', {
        headers: { Authorization: `Bearer ${token}` }
      })
      setCurrentUser(response.data.user)
    } catch (error) {
      console.error('Auth check failed:', error)
    }
  }

  const fetchUserProfile = async () => {
    try {
      const response = await axios.get(`/api/users/${userId}`)
      setUser(response.data.user)
      setFollowCounts({
        followers: response.data.user._count.followers,
        following: response.data.user._count.following
      })
    } catch (error) {
      console.error('Failed to fetch user profile:', error)
      toast.error('Failed to load user profile')
    } finally {
      setIsLoading(false)
    }
  }

  const fetchUserReviews = async (loadMore = false) => {
    try {
      if (loadMore) {
        setIsLoadingMore(true)
      }
      
      const token = localStorage.getItem('accessToken')
      const headers = token ? { Authorization: `Bearer ${token}` } : {}
      const page = loadMore ? reviewsPage + 1 : 1
      
      const response = await axios.get(`/api/reviews?userId=${userId}&page=${page}&limit=10`, { headers })
      
      if (loadMore) {
        setReviews(prev => [...prev, ...response.data.reviews])
        setReviewsPage(page)
      } else {
        setReviews(response.data.reviews)
        setReviewsPage(1)
      }
      
      setHasMoreReviews(response.data.pagination.page < response.data.pagination.totalPages)
      
      // Extract liked review IDs
      if (response.data.likedReviewIds) {
        setLikedReviews(new Set(response.data.likedReviewIds))
      }
    } catch (error) {
      console.error('Failed to fetch reviews:', error)
    } finally {
      setIsLoadingMore(false)
    }
  }

  const fetchFollowers = async () => {
    try {
      const response = await axios.get(`/api/users/${userId}/followers`)
      setFollowers(response.data.followers)
    } catch (error) {
      console.error('Failed to fetch followers:', error)
    }
  }

  const fetchFollowing = async () => {
    try {
      const response = await axios.get(`/api/users/${userId}/following`)
      setFollowing(response.data.following)
    } catch (error) {
      console.error('Failed to fetch following:', error)
    }
  }

  const handleLike = async (reviewId: string) => {
    if (!currentUser) {
      toast.error('Please sign in to like reviews')
      return
    }

    try {
      const token = localStorage.getItem('accessToken')
      const isLiked = likedReviews.has(reviewId)
      
      if (isLiked) {
        await axios.delete(`/api/reviews/${reviewId}/like`, {
          headers: { Authorization: `Bearer ${token}` }
        })
        setLikedReviews(prev => {
          const newSet = new Set(prev)
          newSet.delete(reviewId)
          return newSet
        })
      } else {
        await axios.post(`/api/reviews/${reviewId}/like`, {}, {
          headers: { Authorization: `Bearer ${token}` }
        })
        setLikedReviews(prev => new Set(prev).add(reviewId))
      }
      
      // Update review counts
      setReviews(reviews.map(review => {
        if (review.id === reviewId) {
          return {
            ...review,
            _count: {
              ...review._count,
              likes: isLiked ? review._count.likes - 1 : review._count.likes + 1
            }
          }
        }
        return review
      }))
    } catch (error) {
      console.error('Failed to like review:', error)
      toast.error('Failed to update like')
    }
  }

  const handleShare = async (review: Review) => {
    const url = `${window.location.origin}/restaurants/${review.restaurant.id}#review-${review.id}`
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: `Review of ${review.restaurant.name}`,
          text: review.content.substring(0, 100) + '...',
          url,
        })
      } catch (error) {
        console.error('Error sharing:', error)
      }
    } else {
      navigator.clipboard.writeText(url)
      toast.success('Link copied to clipboard!')
    }
  }

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  if (!user) {
    return (
      <div className="text-center py-12">
        <h2 className="text-2xl font-bold mb-2">User not found</h2>
        <p className="text-gray-600">The user you're looking for doesn't exist.</p>
      </div>
    )
  }

  const isOwnProfile = currentUser?.id === user.id

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      {/* User Header */}
      <Card className="mb-8">
        <CardContent className="p-8">
          <div className="flex items-start gap-6">
            <Avatar
              src={user.avatar}
              alt={user.name}
              fallback={user.name}
              size="xl"
              className="w-24 h-24"
            />
            
            <div className="flex-1">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <div className="flex items-center gap-3 mb-2">
                    <h1 className="text-2xl font-bold">{user.name}</h1>
                    <UserBadge role={user.role} />
                    {user.verified && (
                      <Badge variant="secondary" className="gap-1">
                        <Award className="h-3 w-3" />
                        Verified
                      </Badge>
                    )}
                  </div>
                  
                  {user.bio && (
                    <p className="text-gray-600 mb-3">{user.bio}</p>
                  )}
                  
                  <div className="flex items-center gap-4 text-sm text-gray-500">
                    {user.profile?.location && (
                      <div className="flex items-center gap-1">
                        <MapPin className="h-4 w-4" />
                        {user.profile.location}
                      </div>
                    )}
                    <div className="flex items-center gap-1">
                      <Calendar className="h-4 w-4" />
                      Joined {formatDistanceToNow(new Date(user.createdAt), { addSuffix: true })}
                    </div>
                  </div>
                </div>
                
                {!isOwnProfile && (
                  <FollowButton
                    userId={user.id}
                    onFollowChange={(_, counts) => setFollowCounts(counts)}
                  />
                )}
              </div>
              
              {/* Stats */}
              <div className="flex items-center gap-6">
                <div className="text-center">
                  <div className="text-2xl font-bold">{user._count.reviews}</div>
                  <div className="text-sm text-gray-500">Reviews</div>
                </div>
                <div className="text-center cursor-pointer" onClick={() => setActiveTab('followers')}>
                  <div className="text-2xl font-bold">{followCounts.followers}</div>
                  <div className="text-sm text-gray-500">Followers</div>
                </div>
                <div className="text-center cursor-pointer" onClick={() => setActiveTab('following')}>
                  <div className="text-2xl font-bold">{followCounts.following}</div>
                  <div className="text-sm text-gray-500">Following</div>
                </div>
                {user.role === 'OWNER' && user._count.restaurants !== undefined && (
                  <div className="text-center">
                    <div className="text-2xl font-bold">{user._count.restaurants}</div>
                    <div className="text-sm text-gray-500">Restaurants</div>
                  </div>
                )}
              </div>
              
              {/* Dietary Preferences */}
              {user.profile?.dietaryPrefs && user.profile.dietaryPrefs.length > 0 && (
                <div className="mt-4">
                  <div className="flex items-center gap-2 flex-wrap">
                    <ChefHat className="h-4 w-4 text-gray-500" />
                    {user.profile.dietaryPrefs.map((pref) => (
                      <Badge key={pref} variant="outline" className="text-xs">
                        {pref}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="w-full">
          <TabsTrigger value="reviews" className="flex-1">
            <MessageSquare className="h-4 w-4 mr-2" />
            Reviews ({user._count.reviews})
          </TabsTrigger>
          <TabsTrigger value="followers" className="flex-1">
            <Users className="h-4 w-4 mr-2" />
            Followers ({followCounts.followers})
          </TabsTrigger>
          <TabsTrigger value="following" className="flex-1">
            <Users className="h-4 w-4 mr-2" />
            Following ({followCounts.following})
          </TabsTrigger>
        </TabsList>

        {/* Reviews Tab */}
        <TabsContent value="reviews" className="mt-6">
          {reviews.length === 0 ? (
            <Card>
              <CardContent className="text-center py-12">
                <MessageSquare className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500">No reviews yet</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-6">
              {reviews.map((review) => (
                <ReviewCard
                  key={review.id}
                  review={{
                    ...review,
                    user: {
                      id: user.id,
                      name: user.name,
                      avatar: user.avatar || null,
                      role: user.role
                    }
                  }}
                  currentUserId={currentUser?.id}
                  isLiked={likedReviews.has(review.id)}
                  onLike={() => handleLike(review.id)}
                  onShare={() => handleShare(review)}
                />
              ))}
              
              {hasMoreReviews && (
                <div className="flex justify-center mt-6">
                  <Button
                    variant="outline"
                    onClick={() => fetchUserReviews(true)}
                    disabled={isLoadingMore}
                  >
                    {isLoadingMore ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                        Loading...
                      </>
                    ) : (
                      'Load More Reviews'
                    )}
                  </Button>
                </div>
              )}
            </div>
          )}
        </TabsContent>

        {/* Followers Tab */}
        <TabsContent value="followers" className="mt-6">
          {followers.length === 0 ? (
            <Card>
              <CardContent className="text-center py-12">
                <Users className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500">No followers yet</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4">
              {followers.map((follower) => (
                <Card key={follower.id}>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Avatar
                          src={follower.avatar}
                          alt={follower.name}
                          fallback={follower.name}
                          size="md"
                        />
                        <div>
                          <div className="flex items-center gap-2">
                            <a href={`/users/${follower.id}`} className="font-semibold hover:underline">
                              {follower.name}
                            </a>
                            <UserBadge role={follower.role} size="sm" />
                          </div>
                          <div className="text-sm text-gray-500">
                            {follower._count.reviews} reviews · {follower._count.followers} followers
                          </div>
                        </div>
                      </div>
                      {currentUser && currentUser.id !== follower.id && (
                        <FollowButton userId={follower.id} size="sm" />
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* Following Tab */}
        <TabsContent value="following" className="mt-6">
          {following.length === 0 ? (
            <Card>
              <CardContent className="text-center py-12">
                <Users className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500">Not following anyone yet</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4">
              {following.map((user) => (
                <Card key={user.id}>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Avatar
                          src={user.avatar}
                          alt={user.name}
                          fallback={user.name}
                          size="md"
                        />
                        <div>
                          <div className="flex items-center gap-2">
                            <a href={`/users/${user.id}`} className="font-semibold hover:underline">
                              {user.name}
                            </a>
                            <UserBadge role={user.role} size="sm" />
                          </div>
                          <div className="text-sm text-gray-500">
                            {user._count.reviews} reviews · {user._count.followers} followers
                          </div>
                        </div>
                      </div>
                      {currentUser && currentUser.id !== user.id && (
                        <FollowButton userId={user.id} size="sm" />
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}