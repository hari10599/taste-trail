'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  Building, ArrowLeft, Save, Loader2, Star,
  MessageSquare, Eye, Heart, CheckCircle
} from 'lucide-react'
import axios from 'axios'
import toast from 'react-hot-toast'
import Link from 'next/link'
import { formatDistanceToNow } from 'date-fns'

interface RestaurantStats {
  totalReviews: number
  averageRating: number
  totalLikes: number
  recentReviews: any[]
  ratingDistribution: { [key: number]: number }
  monthlyReviews: { month: string; count: number }[]
}

export default function RestaurantManagementPage() {
  const params = useParams()
  const router = useRouter()
  const [restaurant, setRestaurant] = useState<any>(null)
  const [stats, setStats] = useState<RestaurantStats | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [activeTab, setActiveTab] = useState('overview')
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    address: '',
    phone: '',
    website: '',
    categories: [] as string[],
    priceRange: 1,
    coverImage: '',
    openingHours: {} as any
  })

  useEffect(() => {
    checkOwnership()
    fetchRestaurantData()
  }, [params.id])

  const checkOwnership = async () => {
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

      const user = response.data.user
      if (!user || (user.role !== 'OWNER' && user.role !== 'ADMIN')) {
        toast.error('Access denied. Owner privileges required.')
        router.push('/dashboard')
        return
      }
    } catch (error) {
      console.error('Ownership check failed:', error)
      toast.error('Failed to verify ownership')
      router.push('/login')
    }
  }

  const fetchRestaurantData = async () => {
    try {
      const token = localStorage.getItem('accessToken')
      const [restaurantResponse, statsResponse] = await Promise.all([
        axios.get(`/api/restaurants/${params.id}`, {
          headers: { Authorization: `Bearer ${token}` }
        }),
        axios.get(`/api/owner/restaurants/${params.id}/stats`, {
          headers: { Authorization: `Bearer ${token}` }
        })
      ])

      const restaurantData = restaurantResponse.data.restaurant
      
      // Verify ownership
      const meResponse = await axios.get('/api/auth/me', {
        headers: { Authorization: `Bearer ${token}` }
      })
      
      const currentUser = meResponse.data.user
      if (restaurantData.ownerId !== currentUser.id && currentUser.role !== 'ADMIN') {
        toast.error('You do not own this restaurant')
        router.push('/dashboard')
        return
      }

      setRestaurant(restaurantData)
      setStats(statsResponse.data)
      
      // Initialize form data
      setFormData({
        name: restaurantData.name,
        description: restaurantData.description,
        address: restaurantData.address,
        phone: restaurantData.phone || '',
        website: restaurantData.website || '',
        categories: restaurantData.categories,
        priceRange: restaurantData.priceRange,
        coverImage: restaurantData.coverImage || '',
        openingHours: restaurantData.openingHours || {}
      })
    } catch (error) {
      console.error('Failed to fetch restaurant data:', error)
      toast.error('Failed to load restaurant data')
    } finally {
      setIsLoading(false)
    }
  }

  const handleSaveChanges = async () => {
    setIsSaving(true)
    try {
      const token = localStorage.getItem('accessToken')
      await axios.put(`/api/owner/restaurants/${params.id}`, formData, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      })
      
      toast.success('Restaurant details updated successfully')
      fetchRestaurantData() // Refresh data
    } catch (error) {
      console.error('Failed to save changes:', error)
      toast.error('Failed to update restaurant details')
    } finally {
      setIsSaving(false)
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

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href={`/restaurants/${restaurant.id}`}>
              <Button variant="ghost" size="icon">
                <ArrowLeft className="h-5 w-5" />
              </Button>
            </Link>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Manage Restaurant</h1>
              <p className="text-gray-600">{restaurant.name}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {restaurant.verified && (
              <Badge variant="outline" className="text-green-600 border-green-600">
                <CheckCircle className="h-3 w-3 mr-1" />
                Verified
              </Badge>
            )}
            <Link href={`/restaurants/${restaurant.id}`}>
              <Button variant="outline">
                <Eye className="h-4 w-4 mr-2" />
                View Public Page
              </Button>
            </Link>
          </div>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="details">Details</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
          <TabsTrigger value="reviews">Reviews</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Average Rating</p>
                    <div className="flex items-center gap-2 mt-1">
                      <Star className="h-5 w-5 text-yellow-500 fill-yellow-500" />
                      <span className="text-2xl font-bold">{restaurant.averageRating.toFixed(1)}</span>
                    </div>
                  </div>
                  <Star className="h-8 w-8 text-gray-200" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Total Reviews</p>
                    <p className="text-2xl font-bold mt-1">{stats?.totalReviews || 0}</p>
                  </div>
                  <MessageSquare className="h-8 w-8 text-gray-200" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Total Likes</p>
                    <p className="text-2xl font-bold mt-1">{stats?.totalLikes || 0}</p>
                  </div>
                  <Heart className="h-8 w-8 text-gray-200" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Recent Reviews */}
          <Card>
            <CardHeader>
              <CardTitle>Recent Reviews</CardTitle>
            </CardHeader>
            <CardContent>
              {stats?.recentReviews && stats.recentReviews.length > 0 ? (
                <div className="space-y-4">
                  {stats.recentReviews.map((review) => (
                    <div key={review.id} className="border-b pb-4 last:border-0">
                      <div className="flex items-start justify-between">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-medium">{review.user.name}</span>
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
                          <p className="text-sm text-gray-600 mt-1">{review.content}</p>
                          <p className="text-xs text-gray-500 mt-1">
                            {formatDistanceToNow(new Date(review.createdAt), { addSuffix: true })}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 text-center py-4">No reviews yet</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Details Tab */}
        <TabsContent value="details" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Basic Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="name">Restaurant Name</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                />
              </div>

              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={4}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="phone">Phone Number</Label>
                  <Input
                    id="phone"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="+1 (555) 123-4567"
                  />
                </div>

                <div>
                  <Label htmlFor="website">Website</Label>
                  <Input
                    id="website"
                    value={formData.website}
                    onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                    placeholder="https://example.com"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="address">Address</Label>
                <Input
                  id="address"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                />
              </div>

              <div>
                <Label htmlFor="priceRange">Price Range</Label>
                <select
                  id="priceRange"
                  value={formData.priceRange}
                  onChange={(e) => setFormData({ ...formData, priceRange: parseInt(e.target.value) })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  <option value={1}>$ - Budget Friendly</option>
                  <option value={2}>$$ - Moderate</option>
                  <option value={3}>$$$ - Upscale</option>
                  <option value={4}>$$$$ - Fine Dining</option>
                </select>
              </div>

              <div className="pt-4">
                <Button onClick={handleSaveChanges} disabled={isSaving}>
                  {isSaving ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4 mr-2" />
                      Save Changes
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Analytics Tab */}
        <TabsContent value="analytics" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Rating Distribution</CardTitle>
            </CardHeader>
            <CardContent>
              {stats?.ratingDistribution && (
                <div className="space-y-3">
                  {[5, 4, 3, 2, 1].map((rating) => {
                    const count = stats.ratingDistribution[rating] || 0
                    const percentage = stats.totalReviews > 0 
                      ? (count / stats.totalReviews) * 100 
                      : 0
                    
                    return (
                      <div key={rating} className="flex items-center gap-3">
                        <div className="flex items-center gap-1 w-20">
                          <span className="text-sm">{rating}</span>
                          <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />
                        </div>
                        <div className="flex-1">
                          <div className="h-4 bg-gray-200 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-yellow-500"
                              style={{ width: `${percentage}%` }}
                            />
                          </div>
                        </div>
                        <span className="text-sm text-gray-600 w-12 text-right">
                          {count}
                        </span>
                      </div>
                    )
                  })}
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Monthly Review Trends</CardTitle>
            </CardHeader>
            <CardContent>
              {stats?.monthlyReviews && stats.monthlyReviews.length > 0 ? (
                <div className="space-y-2">
                  {stats.monthlyReviews.map((month) => (
                    <div key={month.month} className="flex items-center justify-between">
                      <span className="text-sm">{month.month}</span>
                      <span className="font-medium">{month.count} reviews</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 text-center py-4">No review data available</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Reviews Tab */}
        <TabsContent value="reviews" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>All Reviews</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-500 text-center py-8">
                Review management coming soon. View reviews on your{' '}
                <Link href={`/restaurants/${restaurant.id}`} className="text-primary hover:underline">
                  public page
                </Link>
                .
              </p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}