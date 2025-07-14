'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import axios from 'axios'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Building, Star, MessageSquare, ThumbsUp, TrendingUp,
  Clock, MapPin, DollarSign, Plus, ChevronRight
} from 'lucide-react'
import Link from 'next/link'
import toast from 'react-hot-toast'

interface Restaurant {
  id: string
  name: string
  address: string
  priceRange: number
  coverImage?: string
  avgRating: number
  totalReviews: number
  _count: {
    reviews: number
  }
}

export default function OwnerDashboard() {
  const router = useRouter()
  const [restaurants, setRestaurants] = useState<Restaurant[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedTab, setSelectedTab] = useState('overview')

  useEffect(() => {
    fetchRestaurants()
  }, [])

  const fetchRestaurants = async () => {
    try {
      const token = localStorage.getItem('accessToken')
      const response = await axios.get('/api/owner/restaurants', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
      setRestaurants(response.data.restaurants)
    } catch (error: any) {
      if (error.response?.status === 403) {
        toast.error('You need to be a verified owner to access this page')
        router.push('/profile')
      } else {
        toast.error('Failed to fetch restaurants')
      }
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/3"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-48 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  if (restaurants.length === 0) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card className="max-w-2xl mx-auto">
          <CardContent className="text-center py-12">
            <Building className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h2 className="text-2xl font-semibold mb-2">No Restaurants Yet</h2>
            <p className="text-gray-600 mb-6">
              Claim your restaurant to start managing reviews and analytics.
            </p>
            <Button onClick={() => router.push('/restaurants')}>
              Browse Restaurants
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Owner Dashboard</h1>
        <p className="text-gray-600">Manage your restaurants and track performance</p>
      </div>

      <Tabs value={selectedTab} onValueChange={setSelectedTab}>
        <TabsList className="mb-6">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="restaurants">My Restaurants</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {/* Summary Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Total Restaurants</p>
                    <p className="text-2xl font-bold">{restaurants.length}</p>
                  </div>
                  <Building className="h-8 w-8 text-primary" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Total Reviews</p>
                    <p className="text-2xl font-bold">
                      {restaurants.reduce((sum, r) => sum + r.totalReviews, 0)}
                    </p>
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
                    <p className="text-2xl font-bold">
                      {restaurants.length > 0
                        ? (
                            restaurants.reduce((sum, r) => sum + r.avgRating, 0) /
                            restaurants.length
                          ).toFixed(1)
                        : '0.0'}
                    </p>
                  </div>
                  <Star className="h-8 w-8 text-primary" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Growth</p>
                    <p className="text-2xl font-bold text-green-600">+12%</p>
                  </div>
                  <TrendingUp className="h-8 w-8 text-green-600" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Button
                variant="outline"
                className="justify-start"
                onClick={() => router.push('/restaurants')}
              >
                <Plus className="h-4 w-4 mr-2" />
                Claim New Restaurant
              </Button>
              <Button
                variant="outline"
                className="justify-start"
                onClick={() => setSelectedTab('restaurants')}
              >
                <MessageSquare className="h-4 w-4 mr-2" />
                Manage Reviews
              </Button>
              <Button
                variant="outline"
                className="justify-start"
                onClick={() => router.push('/profile')}
              >
                <Building className="h-4 w-4 mr-2" />
                Update Profile
              </Button>
            </CardContent>
          </Card>

          {/* Recent Activity */}
          <Card>
            <CardHeader>
              <CardTitle>Recent Activity</CardTitle>
              <CardDescription>Latest reviews across your restaurants</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600">No recent activity</p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="restaurants" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {restaurants.map((restaurant) => (
              <Card key={restaurant.id} className="overflow-hidden hover:shadow-lg transition">
                {restaurant.coverImage && (
                  <img
                    src={restaurant.coverImage}
                    alt={restaurant.name}
                    className="w-full h-48 object-cover"
                  />
                )}
                <CardContent className="p-6">
                  <h3 className="font-semibold text-lg mb-2">{restaurant.name}</h3>
                  <div className="space-y-2 text-sm text-gray-600 mb-4">
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4" />
                      <span className="truncate">{restaurant.address}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <DollarSign className="h-4 w-4" />
                      <span>{'$'.repeat(restaurant.priceRange)}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Star className="h-4 w-4" />
                      <span>
                        {restaurant.avgRating.toFixed(1)} ({restaurant.totalReviews} reviews)
                      </span>
                    </div>
                  </div>
                  <Link href={`/owner/restaurants/${restaurant.id}`}>
                    <Button className="w-full">
                      Manage
                      <ChevronRight className="h-4 w-4 ml-2" />
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}