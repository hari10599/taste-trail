'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Avatar } from '@/components/ui/avatar'
import { UserBadge } from '@/components/ui/user-badge'
import { 
  Star, MapPin, Phone, Globe, Clock, DollarSign, 
  Wifi, Car, Trees, Music, Users, Loader2, 
  MessageSquare, Heart, Share2, Building
} from 'lucide-react'
import axios from 'axios'
import toast from 'react-hot-toast'
import Link from 'next/link'
import { ReviewCard } from '@/components/ReviewCard'
import { CommentSection } from '@/components/CommentSection'

const amenityIcons: { [key: string]: any } = {
  'WiFi': Wifi,
  'Parking': Car,
  'Outdoor Seating': Trees,
  'Live Music': Music,
  'Private Dining': Users,
}

export default function RestaurantDetailPage() {
  const params = useParams()
  const [restaurant, setRestaurant] = useState<any>(null)
  const [recentReviews, setRecentReviews] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [selectedImageIndex, setSelectedImageIndex] = useState(0)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [user, setUser] = useState<any>(null)
  const [expandedComments, setExpandedComments] = useState<Set<string>>(new Set())
  const [likedReviews, setLikedReviews] = useState<Set<string>>(new Set())
  
  useEffect(() => {
    checkAuth()
    fetchRestaurant()
  }, [params.id])

  useEffect(() => {
    if (user && recentReviews.length > 0) {
      fetchRestaurant() // Refetch to get like status
    }
  }, [user])
  
  const checkAuth = async () => {
    const token = localStorage.getItem('accessToken')
    setIsAuthenticated(!!token)
    
    if (token) {
      try {
        const response = await axios.get('/api/auth/me', {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        })
        setUser(response.data.user)
      } catch (error) {
        console.error('Failed to fetch user:', error)
      }
    }
  }
  
  const fetchRestaurant = async () => {
    try {
      const response = await axios.get(`/api/restaurants/${params.id}`)
      setRestaurant(response.data.restaurant)
      setRecentReviews(response.data.recentReviews)
      
      // Cache liked reviews if user is authenticated
      if (user) {
        const likedIds = new Set<string>()
        const token = localStorage.getItem('accessToken')
        if (token) {
          const likePromises = response.data.recentReviews.map((review: any) => 
            axios.get(`/api/reviews/${review.id}/likes`, {
              headers: { Authorization: `Bearer ${token}` },
            }).then(res => {
              if (res.data.isLiked) {
                likedIds.add(review.id)
              }
            }).catch(() => {})
          )
          await Promise.all(likePromises)
          setLikedReviews(likedIds)
        }
      }
    } catch (error) {
      console.error('Failed to fetch restaurant:', error)
      toast.error('Failed to load restaurant details')
    } finally {
      setIsLoading(false)
    }
  }

  const handleClaimRestaurant = async () => {
    if (!isAuthenticated) {
      toast.error('Please sign in to claim this restaurant')
      return
    }

    if (confirm('Are you sure you want to claim ownership of this restaurant?')) {
      try {
        const token = localStorage.getItem('accessToken')
        const response = await axios.post(
          '/api/owner/restaurants',
          { restaurantId: restaurant.id },
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        )
        toast.success('Restaurant claimed successfully!')
        // Refresh the page to update the restaurant data
        fetchRestaurant()
        checkAuth() // Update user role
      } catch (error: any) {
        toast.error(error.response?.data?.error || 'Failed to claim restaurant')
      }
    }
  }

  const handleLike = async (reviewId: string) => {
    if (!isAuthenticated) {
      toast(
        <div>
          <p>Please sign in to like reviews</p>
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
    
    try {
      const token = localStorage.getItem('accessToken')
      
      if (likedReviews.has(reviewId)) {
        await axios.delete(`/api/reviews/${reviewId}/like`, {
          headers: { Authorization: `Bearer ${token}` },
        })
        setLikedReviews(new Set([...likedReviews].filter(id => id !== reviewId)))
      } else {
        await axios.post(`/api/reviews/${reviewId}/like`, {}, {
          headers: { Authorization: `Bearer ${token}` },
        })
        setLikedReviews(new Set([...likedReviews, reviewId]))
      }
      
      // Update review like count in state
      setRecentReviews(recentReviews.map(review => 
        review.id === reviewId
          ? { 
              ...review, 
              _count: { 
                ...review._count, 
                likes: review._count.likes + (likedReviews.has(reviewId) ? -1 : 1) 
              } 
            }
          : review
      ))
    } catch (error: any) {
      console.error('Failed to like review:', error)
      if (error.response?.status === 401) {
        toast.error('Please login to like reviews')
      } else {
        toast.error('Failed to update like')
      }
    }
  }
  
  const handleComment = (reviewId: string) => {
    if (!isAuthenticated) {
      toast(
        <div>
          <p>Please sign in to comment on reviews</p>
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
    
    setExpandedComments(new Set(
      expandedComments.has(reviewId)
        ? [...expandedComments].filter(id => id !== reviewId)
        : [...expandedComments, reviewId]
    ))
  }

  const handleShare = async (review: any) => {
    const url = `${window.location.origin}/restaurants/${restaurant.id}#review-${review.id}`
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: `Review of ${restaurant.name}`,
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
  
  if (!restaurant) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">Restaurant not found.</p>
      </div>
    )
  }
  
  const priceIndicator = '$'.repeat(restaurant.priceRange)
  const allImages = [restaurant.coverImage, ...restaurant.images].filter(Boolean)
  
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4 mb-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              {restaurant.name}
            </h1>
            <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600">
              <div className="flex items-center">
                <MapPin className="h-4 w-4 mr-1" />
                {restaurant.address}
              </div>
              <div className="font-semibold">{priceIndicator}</div>
              <div className="flex items-center">
                <Star className="h-4 w-4 text-yellow-500 fill-yellow-500 mr-1" />
                <span className="font-semibold">{restaurant.averageRating.toFixed(1)}</span>
                <span className="ml-1">({restaurant._count.reviews} reviews)</span>
              </div>
            </div>
          </div>
          
          <div className="flex gap-2">
            {isAuthenticated ? (
              <Link href={`/reviews/new?restaurant=${restaurant.id}`}>
                <Button>Write a Review</Button>
              </Link>
            ) : (
              <Link href={`/login?redirect=/reviews/new?restaurant=${restaurant.id}`}>
                <Button>Write a Review</Button>
              </Link>
            )}
            {!restaurant.ownerId && user && user.role !== 'OWNER' && (
              <Button 
                variant="outline" 
                onClick={handleClaimRestaurant}
              >
                <Building className="h-4 w-4 mr-2" />
                Claim Restaurant
              </Button>
            )}
            {restaurant.ownerId === user?.id && (
              <Link href={`/owner/restaurants/${restaurant.id}`}>
                <Button variant="outline">
                  <Building className="h-4 w-4 mr-2" />
                  Manage
                </Button>
              </Link>
            )}
            <Button 
              variant="outline" 
              size="icon"
              onClick={async () => {
                const url = `${window.location.origin}/restaurants/${restaurant.id}`
                if (navigator.share) {
                  try {
                    await navigator.share({
                      title: restaurant.name,
                      text: restaurant.description,
                      url,
                    })
                  } catch (error) {
                    console.error('Error sharing:', error)
                  }
                } else {
                  navigator.clipboard.writeText(url)
                  toast.success('Link copied to clipboard!')
                }
              }}
            >
              <Share2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
        
        {/* Categories */}
        <div className="flex flex-wrap gap-2 mb-4">
          {restaurant.categories.map((category: string) => (
            <Badge key={category} variant="secondary">
              {category}
            </Badge>
          ))}
        </div>
        
        {/* Description */}
        <p className="text-gray-700">{restaurant.description}</p>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-8">
          {/* Image Gallery */}
          {allImages.length > 0 && (
            <div>
              <div className="aspect-video relative overflow-hidden rounded-lg bg-gray-100 mb-4">
                <img
                  src={allImages[selectedImageIndex]}
                  alt={restaurant.name}
                  className="w-full h-full object-cover"
                />
              </div>
              
              {allImages.length > 1 && (
                <div className="grid grid-cols-4 gap-2">
                  {allImages.slice(0, 4).map((image, index) => (
                    <button
                      key={index}
                      onClick={() => setSelectedImageIndex(index)}
                      className={`aspect-video relative overflow-hidden rounded-lg bg-gray-100 ${
                        selectedImageIndex === index ? 'ring-2 ring-primary' : ''
                      }`}
                    >
                      <img
                        src={image}
                        alt={`${restaurant.name} ${index + 1}`}
                        className="w-full h-full object-cover"
                      />
                      {index === 3 && allImages.length > 4 && (
                        <div className="absolute inset-0 bg-black/50 flex items-center justify-center text-white font-semibold">
                          +{allImages.length - 4}
                        </div>
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
          
          {/* Recent Reviews */}
          <div>
            <h2 className="text-xl font-semibold mb-4">Recent Reviews</h2>
            {recentReviews.length === 0 ? (
              <Card>
                <CardContent className="text-center py-8">
                  <p className="text-gray-500">No reviews yet. Be the first to review!</p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-6">
                {recentReviews.map((review) => (
                  <div key={review.id}>
                    <ReviewCard
                      review={review}
                      currentUserId={user?.id}
                      isLiked={likedReviews.has(review.id)}
                      onLike={() => handleLike(review.id)}
                      onComment={() => handleComment(review.id)}
                      onShare={() => handleShare(review)}
                      showRestaurant={false}
                    />
                    
                    {expandedComments.has(review.id) && (
                      <Card className="mt-4 border-t-0 rounded-t-none">
                        <CardContent className="pt-6">
                          <CommentSection
                            reviewId={review.id}
                            currentUserId={user?.id}
                          />
                        </CardContent>
                      </Card>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
        
        {/* Sidebar */}
        <div className="space-y-6">
          {/* Contact & Hours */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {restaurant.phone && (
                <div className="flex items-center gap-3">
                  <Phone className="h-4 w-4 text-gray-400" />
                  <a href={`tel:${restaurant.phone}`} className="text-primary hover:underline">
                    {restaurant.phone}
                  </a>
                </div>
              )}
              
              {restaurant.website && (
                <div className="flex items-center gap-3">
                  <Globe className="h-4 w-4 text-gray-400" />
                  <a 
                    href={restaurant.website} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-primary hover:underline truncate"
                  >
                    {restaurant.website}
                  </a>
                </div>
              )}
              
              <div className="space-y-2">
                <div className="flex items-center gap-3">
                  <Clock className="h-4 w-4 text-gray-400" />
                  <span className="font-medium">Hours</span>
                </div>
                <div className="ml-7 space-y-1 text-sm">
                  {Object.entries(restaurant.openingHours).map(([day, hours]: [string, any]) => (
                    <div key={day} className="flex justify-between">
                      <span className="capitalize">{day}</span>
                      <span className="text-gray-600">
                        {hours.open} - {hours.close}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
          
          {/* Amenities */}
          {restaurant.amenities.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Amenities</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {restaurant.amenities.map((amenity: string) => {
                    const Icon = amenityIcons[amenity] || DollarSign
                    return (
                      <div key={amenity} className="flex items-center gap-3">
                        <Icon className="h-4 w-4 text-gray-400" />
                        <span className="text-sm">{amenity}</span>
                      </div>
                    )
                  })}
                </div>
              </CardContent>
            </Card>
          )}
          
          {/* Owner Info */}
          {restaurant.owner && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Managed By</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-3">
                  <Avatar
                    src={restaurant.owner.avatar}
                    alt={restaurant.owner.name}
                    fallback={restaurant.owner.name}
                  />
                  <div>
                    <p className="font-medium">{restaurant.owner.name}</p>
                    <UserBadge role="OWNER" size="sm" />
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}