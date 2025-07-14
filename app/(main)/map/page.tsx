'use client'

import { useState, useEffect } from 'react'
import dynamic from 'next/dynamic'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { MapPin, List, Grid, Filter, Loader2 } from 'lucide-react'
import Link from 'next/link'
import axios from 'axios'

// Dynamically import the map component to avoid SSR issues
const RestaurantMap = dynamic(
  () => import('@/components/ui/restaurant-map').then(mod => mod.RestaurantMap),
  { 
    ssr: false,
    loading: () => (
      <div className="h-[600px] rounded-lg bg-gray-100 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
      </div>
    )
  }
)

interface Restaurant {
  id: string
  name: string
  address: string
  latitude: number
  longitude: number
  categories: string[]
  priceRange: number
  coverImage?: string
  avgRating: number
  reviewCount: number
  distance?: number
}

export default function MapPage() {
  const [restaurants, setRestaurants] = useState<Restaurant[]>([])
  const [loading, setLoading] = useState(true)
  const [viewMode, setViewMode] = useState<'map' | 'list'>('map')
  const [selectedRestaurant, setSelectedRestaurant] = useState<Restaurant | null>(null)

  useEffect(() => {
    fetchInitialRestaurants()
  }, [])

  const fetchInitialRestaurants = async () => {
    try {
      // Fetch restaurants from San Francisco area by default
      const response = await axios.get('/api/restaurants/nearby?lat=37.7749&lng=-122.4194&radius=50&limit=100')
      setRestaurants(response.data.restaurants)
    } catch (error) {
      console.error('Failed to fetch restaurants:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleRestaurantClick = (restaurant: Restaurant) => {
    setSelectedRestaurant(restaurant)
    setViewMode('list')
  }

  const getPriceDisplay = (priceRange: number) => {
    return '$'.repeat(priceRange)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-gray-600">Loading restaurants...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <MapPin className="h-6 w-6 text-primary" />
              <h1 className="text-2xl font-bold text-gray-900">Restaurant Map</h1>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant={viewMode === 'map' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setViewMode('map')}
              >
                <MapPin className="h-4 w-4 mr-1" />
                Map
              </Button>
              <Button
                variant={viewMode === 'list' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setViewMode('list')}
              >
                <List className="h-4 w-4 mr-1" />
                List
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {viewMode === 'map' ? (
          <div className="space-y-6">
            {/* Map Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                      <MapPin className="h-4 w-4 text-primary" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold">{restaurants.length}</p>
                      <p className="text-sm text-gray-600">Restaurants Found</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-yellow-100 rounded-full flex items-center justify-center">
                      <span className="text-yellow-600 font-bold">★</span>
                    </div>
                    <div>
                      <p className="text-2xl font-bold">
                        {restaurants.length > 0 
                          ? (restaurants.reduce((sum, r) => sum + r.avgRating, 0) / restaurants.length).toFixed(1)
                          : '0.0'
                        }
                      </p>
                      <p className="text-sm text-gray-600">Average Rating</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                      <span className="text-green-600 font-bold">$</span>
                    </div>
                    <div>
                      <p className="text-2xl font-bold">
                        {restaurants.length > 0 
                          ? getPriceDisplay(Math.round(restaurants.reduce((sum, r) => sum + r.priceRange, 0) / restaurants.length))
                          : '$'
                        }
                      </p>
                      <p className="text-sm text-gray-600">Average Price</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Interactive Map */}
            <Card>
              <CardContent className="p-0">
                <RestaurantMap
                  restaurants={restaurants}
                  height="600px"
                  showSearch={true}
                  showFilters={true}
                  onRestaurantClick={handleRestaurantClick}
                />
              </CardContent>
            </Card>

            {/* Instructions */}
            <Card>
              <CardContent className="p-6">
                <h3 className="font-semibold mb-3">How to use the map:</h3>
                <ul className="space-y-2 text-sm text-gray-600">
                  <li>• Click "Find Me" to locate nearby restaurants</li>
                  <li>• Use the filters to narrow down your search</li>
                  <li>• Click on any marker to see restaurant details</li>
                  <li>• Use the navigation controls to zoom and pan</li>
                  <li>• Switch to list view to see all restaurants</li>
                </ul>
              </CardContent>
            </Card>
          </div>
        ) : (
          <div className="space-y-6">
            {/* List Header */}
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold">
                {restaurants.length} restaurants found
              </h2>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setViewMode('map')}
              >
                <MapPin className="h-4 w-4 mr-1" />
                Back to Map
              </Button>
            </div>

            {/* Restaurant List */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {restaurants.map((restaurant) => (
                <Card key={restaurant.id} className="hover:shadow-lg transition-shadow">
                  <CardContent className="p-0">
                    {restaurant.coverImage && (
                      <img
                        src={restaurant.coverImage}
                        alt={restaurant.name}
                        className="w-full h-48 object-cover rounded-t-lg"
                      />
                    )}
                    <div className="p-4">
                      <div className="flex items-start justify-between mb-2">
                        <h3 className="font-semibold text-lg">{restaurant.name}</h3>
                        <span className="text-sm font-medium text-primary">
                          {restaurant.avgRating > 0 ? `${restaurant.avgRating.toFixed(1)}★` : 'No rating'}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 mb-2">{restaurant.address}</p>
                      <div className="flex items-center gap-2 mb-3">
                        <span className="text-sm font-medium">{getPriceDisplay(restaurant.priceRange)}</span>
                        <span className="text-gray-300">•</span>
                        <span className="text-sm text-gray-600">{restaurant.categories[0]}</span>
                        {restaurant.distance && (
                          <>
                            <span className="text-gray-300">•</span>
                            <span className="text-sm text-gray-600">{restaurant.distance.toFixed(1)} km</span>
                          </>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="flex flex-wrap gap-1 flex-1">
                          {restaurant.categories.slice(0, 2).map((category) => (
                            <span
                              key={category}
                              className="px-2 py-1 bg-gray-100 text-xs rounded-full"
                            >
                              {category}
                            </span>
                          ))}
                        </div>
                        <Link href={`/restaurants/${restaurant.id}`}>
                          <Button size="sm">View</Button>
                        </Link>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {restaurants.length === 0 && (
              <Card>
                <CardContent className="p-12 text-center">
                  <MapPin className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No restaurants found</h3>
                  <p className="text-gray-600">Try adjusting your search criteria or location.</p>
                </CardContent>
              </Card>
            )}
          </div>
        )}
      </div>
    </div>
  )
}