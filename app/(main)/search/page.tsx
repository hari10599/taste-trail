'use client'

import { useState, useEffect, useCallback, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { StarRating } from '@/components/ui/star-rating'
import { Avatar } from '@/components/ui/avatar'
import {
  Search, MapPin, Star, MessageSquare, Heart, User,
  Building, Clock, Filter, X, Loader2
} from 'lucide-react'
import axios from 'axios'
import Link from 'next/link'
import { debounce } from 'lodash'
import { format } from 'date-fns'

interface SearchResults {
  restaurants: any[]
  reviews: any[]
  users: any[]
}

interface Suggestion {
  type: string
  id?: string
  value: string
  label: string
}

function SearchContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const initialQuery = searchParams.get('q') || ''

  const [query, setQuery] = useState(initialQuery)
  const [searchType, setSearchType] = useState('all')
  const [results, setResults] = useState<SearchResults>({
    restaurants: [],
    reviews: [],
    users: [],
  })
  const [suggestions, setSuggestions] = useState<Suggestion[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [recentSearches, setRecentSearches] = useState<string[]>([])

  useEffect(() => {
    // Load recent searches from localStorage
    const saved = localStorage.getItem('recentSearches')
    if (saved) {
      setRecentSearches(JSON.parse(saved))
    }

    // Perform search if query exists
    if (initialQuery) {
      performSearch(initialQuery)
    }
  }, [])

  const performSearch = async (searchQuery: string) => {
    if (!searchQuery.trim()) return

    setIsSearching(true)
    try {
      const response = await axios.get('/api/search', {
        params: {
          q: searchQuery,
          type: searchType,
        },
      })
      setResults(response.data)

      // Update recent searches
      const newRecentSearches = [
        searchQuery,
        ...recentSearches.filter(s => s !== searchQuery),
      ].slice(0, 5)
      setRecentSearches(newRecentSearches)
      localStorage.setItem('recentSearches', JSON.stringify(newRecentSearches))

      // Update URL
      router.push(`/search?q=${encodeURIComponent(searchQuery)}`)
    } catch (error) {
      console.error('Search error:', error)
    } finally {
      setIsSearching(false)
    }
  }

  const fetchSuggestions = useCallback(
    debounce(async (searchQuery: string) => {
      if (searchQuery.length < 2) {
        setSuggestions([])
        return
      }

      try {
        const response = await axios.post('/api/search', {
          query: searchQuery,
          type: searchType,
        })
        setSuggestions(response.data.suggestions)
      } catch (error) {
        console.error('Autocomplete error:', error)
      }
    }, 300),
    [searchType]
  )

  const handleInputChange = (value: string) => {
    setQuery(value)
    setShowSuggestions(true)
    fetchSuggestions(value)
  }

  const handleSearch = (e?: React.FormEvent) => {
    e?.preventDefault()
    setShowSuggestions(false)
    performSearch(query)
  }

  const handleSuggestionClick = (suggestion: Suggestion) => {
    setQuery(suggestion.value)
    setShowSuggestions(false)
    performSearch(suggestion.value)
  }

  const clearRecentSearches = () => {
    setRecentSearches([])
    localStorage.removeItem('recentSearches')
  }

  const totalResults =
    results.restaurants.length + results.reviews.length + results.users.length

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        {/* Search Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-6">Search Taste Trail</h1>
          
          {/* Search Form */}
          <form onSubmit={handleSearch} className="relative">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
              <Input
                type="text"
                value={query}
                onChange={(e) => handleInputChange(e.target.value)}
                onFocus={() => setShowSuggestions(true)}
                placeholder="Search restaurants, reviews, users..."
                className="pl-10 pr-20 py-6 text-lg"
              />
              <Button
                type="submit"
                disabled={isSearching || !query.trim()}
                className="absolute right-2 top-1/2 transform -translate-y-1/2"
              >
                {isSearching ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  'Search'
                )}
              </Button>
            </div>

            {/* Autocomplete Suggestions */}
            {showSuggestions && (suggestions.length > 0 || recentSearches.length > 0) && (
              <Card className="absolute top-full mt-2 w-full z-50">
                <CardContent className="p-0">
                  {suggestions.length > 0 ? (
                    <ul className="divide-y">
                      {suggestions.map((suggestion, index) => (
                        <li key={index}>
                          <button
                            type="button"
                            onClick={() => handleSuggestionClick(suggestion)}
                            className="w-full px-4 py-3 text-left hover:bg-gray-50 transition flex items-center gap-3"
                          >
                            {suggestion.type === 'restaurant' && <Building className="h-4 w-4 text-gray-400" />}
                            {suggestion.type === 'category' && <Filter className="h-4 w-4 text-gray-400" />}
                            {suggestion.type === 'location' && <MapPin className="h-4 w-4 text-gray-400" />}
                            <span>{suggestion.label}</span>
                          </button>
                        </li>
                      ))}
                    </ul>
                  ) : query.length < 2 && recentSearches.length > 0 && (
                    <div className="p-4">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-gray-600">Recent Searches</span>
                        <button
                          type="button"
                          onClick={clearRecentSearches}
                          className="text-xs text-gray-400 hover:text-gray-600"
                        >
                          Clear
                        </button>
                      </div>
                      <ul className="space-y-2">
                        {recentSearches.map((search, index) => (
                          <li key={index}>
                            <button
                              type="button"
                              onClick={() => {
                                setQuery(search)
                                setShowSuggestions(false)
                                performSearch(search)
                              }}
                              className="flex items-center gap-2 text-sm text-gray-600 hover:text-primary"
                            >
                              <Clock className="h-3 w-3" />
                              {search}
                            </button>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </form>

          {/* Search Type Tabs */}
          <Tabs value={searchType} onValueChange={setSearchType} className="mt-6">
            <TabsList>
              <TabsTrigger value="all">All</TabsTrigger>
              <TabsTrigger value="restaurants">Restaurants</TabsTrigger>
              <TabsTrigger value="reviews">Reviews</TabsTrigger>
              <TabsTrigger value="users">Users</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        {/* Search Results */}
        {query && !isSearching && (
          <div className="space-y-6">
            {totalResults === 0 ? (
              <Card>
                <CardContent className="text-center py-12">
                  <Search className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500">No results found for "{query}"</p>
                  <p className="text-sm text-gray-400 mt-2">
                    Try adjusting your search terms or filters
                  </p>
                </CardContent>
              </Card>
            ) : (
              <>
                {/* Results Summary */}
                <p className="text-gray-600">
                  Found {totalResults} result{totalResults !== 1 ? 's' : ''} for "{query}"
                </p>

                {/* Restaurants Results */}
                {results.restaurants.length > 0 && (searchType === 'all' || searchType === 'restaurants') && (
                  <div>
                    <h2 className="text-xl font-semibold mb-4">Restaurants</h2>
                    <div className="grid gap-4">
                      {results.restaurants.map((restaurant) => (
                        <Link key={restaurant.id} href={`/restaurants/${restaurant.id}`}>
                          <Card className="hover:shadow-lg transition cursor-pointer">
                            <CardContent className="p-6">
                              <div className="flex items-start justify-between">
                                <div className="flex-1">
                                  <h3 className="font-semibold text-lg mb-1">{restaurant.name}</h3>
                                  <p className="text-gray-600 text-sm mb-2">{restaurant.description}</p>
                                  <div className="flex items-center gap-4 text-sm text-gray-500">
                                    <span className="flex items-center gap-1">
                                      <MapPin className="h-3 w-3" />
                                      {restaurant.address}
                                    </span>
                                    <span className="flex items-center gap-1">
                                      <Star className="h-3 w-3 fill-yellow-500 text-yellow-500" />
                                      {restaurant.avgRating} ({restaurant._count.reviews})
                                    </span>
                                  </div>
                                  <div className="flex gap-2 mt-2">
                                    {restaurant.categories.slice(0, 3).map((cat: string) => (
                                      <Badge key={cat} variant="secondary" className="text-xs">
                                        {cat}
                                      </Badge>
                                    ))}
                                  </div>
                                </div>
                                {restaurant.coverImage && (
                                  <img
                                    src={restaurant.coverImage}
                                    alt={restaurant.name}
                                    className="w-24 h-24 rounded-lg object-cover ml-4"
                                  />
                                )}
                              </div>
                            </CardContent>
                          </Card>
                        </Link>
                      ))}
                    </div>
                  </div>
                )}

                {/* Reviews Results */}
                {results.reviews.length > 0 && (searchType === 'all' || searchType === 'reviews') && (
                  <div>
                    <h2 className="text-xl font-semibold mb-4">Reviews</h2>
                    <div className="grid gap-4">
                      {results.reviews.map((review) => (
                        <Card key={review.id}>
                          <CardContent className="p-6">
                            <div className="flex items-start gap-3 mb-4">
                              <Avatar
                                src={review.user.avatar}
                                alt={review.user.name}
                                fallback={review.user.name}
                              />
                              <div className="flex-1">
                                <div className="flex items-center gap-2">
                                  <span className="font-medium">{review.user.name}</span>
                                  {review.user.role === 'INFLUENCER' && (
                                    <Badge variant="secondary" className="text-xs">Influencer</Badge>
                                  )}
                                  <span className="text-gray-400">•</span>
                                  <Link
                                    href={`/restaurants/${review.restaurant.id}`}
                                    className="text-primary hover:underline"
                                  >
                                    {review.restaurant.name}
                                  </Link>
                                </div>
                                <div className="flex items-center gap-2 mt-1">
                                  <StarRating value={review.rating} readonly size="sm" />
                                  <span className="text-sm text-gray-500">
                                    {format(new Date(review.createdAt), 'MMM d, yyyy')}
                                  </span>
                                </div>
                              </div>
                            </div>
                            {review.title && (
                              <h4 className="font-medium mb-2">{review.title}</h4>
                            )}
                            <p className="text-gray-700 line-clamp-3">{review.content}</p>
                            <div className="flex items-center gap-4 mt-4 text-sm text-gray-500">
                              <span className="flex items-center gap-1">
                                <Heart className="h-4 w-4" />
                                {review._count.likes}
                              </span>
                              <span className="flex items-center gap-1">
                                <MessageSquare className="h-4 w-4" />
                                {review._count.comments}
                              </span>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </div>
                )}

                {/* Users Results */}
                {results.users.length > 0 && (searchType === 'all' || searchType === 'users') && (
                  <div>
                    <h2 className="text-xl font-semibold mb-4">Users</h2>
                    <div className="grid gap-4">
                      {results.users.map((user) => (
                        <Link key={user.id} href={`/profile/${user.id}`}>
                          <Card className="hover:shadow-lg transition cursor-pointer">
                            <CardContent className="p-6">
                              <div className="flex items-center gap-4">
                                <Avatar
                                  src={user.avatar}
                                  alt={user.name}
                                  fallback={user.name}
                                  className="w-16 h-16"
                                />
                                <div className="flex-1">
                                  <div className="flex items-center gap-2">
                                    <h3 className="font-semibold">{user.name}</h3>
                                    {user.role === 'INFLUENCER' && (
                                      <Badge variant="secondary">Influencer</Badge>
                                    )}
                                  </div>
                                  {user.bio && (
                                    <p className="text-sm text-gray-600 mt-1">{user.bio}</p>
                                  )}
                                  <p className="text-sm text-gray-500 mt-2">
                                    {user._count.reviews} review{user._count.reviews !== 1 ? 's' : ''}
                                  </p>
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        </Link>
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {/* Empty State for no query */}
        {!query && !isSearching && (
          <Card>
            <CardContent className="text-center py-12">
              <Search className="h-12 w-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">Enter a search term to find restaurants, reviews, or users</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}

export default function SearchPage() {
  return (
    <Suspense fallback={
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/3 mb-6"></div>
            <div className="h-12 bg-gray-200 rounded mb-4"></div>
            <div className="h-64 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    }>
      <SearchContent />
    </Suspense>
  )
}