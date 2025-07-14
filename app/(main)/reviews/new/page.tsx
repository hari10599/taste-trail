'use client'

import { Suspense } from 'react'
import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ReviewForm } from './ReviewForm'
import { 
  Search, MapPin, DollarSign, 
  Loader2, ChevronLeft, Star 
} from 'lucide-react'
import toast from 'react-hot-toast'
import axios from 'axios'
import Link from 'next/link'

function NewReviewContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const restaurantId = searchParams.get('restaurant')
  
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<any[]>([])
  const [selectedRestaurant, setSelectedRestaurant] = useState<any>(null)
  const [isSearching, setIsSearching] = useState(false)
  const [allRestaurants, setAllRestaurants] = useState<any[]>([])
  const [showDropdown, setShowDropdown] = useState(false)
  
  // Load restaurant if ID is provided
  useEffect(() => {
    if (restaurantId) {
      loadRestaurant(restaurantId)
    }
    fetchAllRestaurants()
  }, [restaurantId])

  const fetchAllRestaurants = async () => {
    try {
      const response = await axios.get('/api/restaurants?limit=100')
      setAllRestaurants(response.data.restaurants)
    } catch (error) {
      console.error('Failed to fetch restaurants:', error)
    }
  }
  
  const loadRestaurant = async (id: string) => {
    try {
      const response = await axios.get(`/api/restaurants/${id}`)
      setSelectedRestaurant(response.data.restaurant)
    } catch (error) {
      toast.error('Failed to load restaurant')
    }
  }
  
  // Search for restaurants
  const searchRestaurants = async () => {
    if (!searchQuery.trim()) {
      setSearchResults([])
      return
    }
    
    setIsSearching(true)
    try {
      const response = await axios.get('/api/restaurants/search', {
        params: { q: searchQuery },
      })
      setSearchResults(response.data.restaurants || [])
    } catch (error) {
      toast.error('Failed to search restaurants')
    } finally {
      setIsSearching(false)
    }
  }
  
  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      searchRestaurants()
    }, 300)
    
    return () => clearTimeout(timer)
  }, [searchQuery])
  
  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <Link 
        href="/dashboard" 
        className="inline-flex items-center text-gray-600 hover:text-gray-900 mb-6"
      >
        <ChevronLeft className="h-4 w-4 mr-1" />
        Back to Dashboard
      </Link>
      
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">Write a Review</CardTitle>
          <CardDescription>
            Share your dining experience with the community
          </CardDescription>
        </CardHeader>
        <CardContent>
          {!selectedRestaurant ? (
            // Restaurant Selection
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Select Restaurant *</label>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                    <Input
                      placeholder="Search for a restaurant..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setShowDropdown(!showDropdown)}
                  >
                    Browse All
                  </Button>
                </div>
              </div>
              
              {isSearching && (
                <div className="text-center py-4">
                  <Loader2 className="h-6 w-6 animate-spin mx-auto" />
                </div>
              )}
              
              {/* Search Results */}
              {searchResults.length > 0 && !showDropdown && (
                <div className="border rounded-lg divide-y max-h-64 overflow-y-auto">
                  {searchResults.map((restaurant) => (
                    <button
                      key={restaurant.id}
                      type="button"
                      onClick={() => {
                        setSelectedRestaurant(restaurant)
                        setSearchQuery('')
                        setSearchResults([])
                      }}
                      className="w-full p-4 text-left hover:bg-gray-50 transition"
                    >
                      <div className="font-medium">{restaurant.name}</div>
                      <div className="text-sm text-gray-600 flex items-center gap-4 mt-1">
                        <span className="flex items-center gap-1">
                          <MapPin className="h-3 w-3" />
                          {restaurant.address}
                        </span>
                        <span className="flex items-center gap-1">
                          <DollarSign className="h-3 w-3" />
                          {'$'.repeat(restaurant.priceRange)}
                        </span>
                      </div>
                    </button>
                  ))}
                </div>
              )}
              
              {/* All Restaurants Dropdown */}
              {showDropdown && (
                <div className="border rounded-lg divide-y max-h-64 overflow-y-auto">
                  {allRestaurants.length === 0 ? (
                    <div className="p-4 text-center text-gray-500">
                      Loading restaurants...
                    </div>
                  ) : (
                    allRestaurants.map((restaurant) => (
                      <button
                        key={restaurant.id}
                        type="button"
                        onClick={() => {
                          setSelectedRestaurant(restaurant)
                          setShowDropdown(false)
                        }}
                        className="w-full p-4 text-left hover:bg-gray-50 transition"
                      >
                        <div className="font-medium">{restaurant.name}</div>
                        <div className="text-sm text-gray-600 flex items-center gap-4 mt-1">
                          <span className="flex items-center gap-1">
                            <MapPin className="h-3 w-3" />
                            {restaurant.address}
                          </span>
                          <span className="flex items-center gap-1">
                            <DollarSign className="h-3 w-3" />
                            {'$'.repeat(restaurant.priceRange)}
                          </span>
                          <span className="flex items-center gap-1">
                            <Star className="h-3 w-3 text-yellow-500" />
                            {restaurant.avgRating > 0 ? restaurant.avgRating.toFixed(1) : 'No rating'}
                          </span>
                        </div>
                      </button>
                    ))
                  )}
                </div>
              )}
            </div>
          ) : (
            // Review Form
            <ReviewForm 
              selectedRestaurant={selectedRestaurant} 
              onCancel={() => setSelectedRestaurant(null)}
            />
          )}
        </CardContent>
      </Card>
    </div>
  )
}

export default function NewReviewPage() {
  return (
    <Suspense fallback={
      <div className="max-w-4xl mx-auto px-4 py-8">
        <Card>
          <CardContent className="p-8">
            <div className="flex items-center justify-center">
              <Loader2 className="h-8 w-8 animate-spin" />
            </div>
          </CardContent>
        </Card>
      </div>
    }>
      <NewReviewContent />
    </Suspense>
  )
}