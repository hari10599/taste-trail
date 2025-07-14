'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { TrendingUp, Star, MessageSquare } from 'lucide-react'
import axios from 'axios'

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

export function TrendingRestaurants() {
  const [restaurants, setRestaurants] = useState<TrendingRestaurant[]>([])
  const [isLoading, setIsLoading] = useState(true)
  
  useEffect(() => {
    fetchTrendingRestaurants()
  }, [])
  
  const fetchTrendingRestaurants = async () => {
    try {
      const response = await axios.get('/api/restaurants/trending')
      setRestaurants(response.data.restaurants)
    } catch (error) {
      console.error('Failed to fetch trending restaurants:', error)
    } finally {
      setIsLoading(false)
    }
  }
  
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Trending Restaurants
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="animate-pulse">
                <div className="h-12 bg-gray-200 rounded" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }
  
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TrendingUp className="h-5 w-5" />
          Trending Restaurants
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {restaurants.map((restaurant, index) => (
            <Link
              key={restaurant.id}
              href={`/restaurants/${restaurant.id}`}
              className="block hover:bg-gray-50 -mx-4 px-4 py-3 rounded-lg transition"
            >
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 w-12 h-12 rounded-lg overflow-hidden bg-gray-100">
                  {restaurant.coverImage ? (
                    <img
                      src={restaurant.coverImage}
                      alt={restaurant.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-400">
                      {index + 1}
                    </div>
                  )}
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h4 className="font-semibold truncate">{restaurant.name}</h4>
                    {restaurant.trend === 'up' && (
                      <TrendingUp className="h-4 w-4 text-green-500" />
                    )}
                  </div>
                  
                  <div className="flex items-center gap-3 text-sm text-gray-600 mt-1">
                    <div className="flex items-center gap-1">
                      <Star className="h-3 w-3 fill-yellow-500 text-yellow-500" />
                      {restaurant.averageRating.toFixed(1)}
                    </div>
                    <div className="flex items-center gap-1">
                      <MessageSquare className="h-3 w-3" />
                      {restaurant.reviewCount}
                    </div>
                    <Badge variant="secondary" className="text-xs">
                      +{restaurant.recentReviews} this week
                    </Badge>
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}