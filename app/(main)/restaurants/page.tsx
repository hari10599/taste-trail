'use client'

import { useState, useEffect } from 'react'
import { useDebounce } from '@/lib/hooks/useDebounce'
import { RestaurantCard } from '@/components/RestaurantCard'
import { RestaurantFilters } from '@/components/RestaurantFilters'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Search, Loader2, Grid3x3, List, Plus } from 'lucide-react'
import axios from 'axios'
import { CreateRestaurantModal } from '@/components/CreateRestaurantModal'

export default function RestaurantsPage() {
  const [restaurants, setRestaurants] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [showCreateModal, setShowCreateModal] = useState(false)
  
  const [filters, setFilters] = useState({
    search: '',
    category: '',
    priceRange: '',
    minRating: 0,
    sortBy: 'createdAt',
    sortOrder: 'desc',
  })
  
  const debouncedSearch = useDebounce(filters.search, 500)
  
  useEffect(() => {
    fetchRestaurants()
  }, [page, debouncedSearch, filters.category, filters.priceRange, filters.minRating, filters.sortBy, filters.sortOrder])
  
  const fetchRestaurants = async () => {
    setIsLoading(true)
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '12',
        search: debouncedSearch,
        category: filters.category,
        priceRange: filters.priceRange,
        minRating: filters.minRating.toString(),
        sortBy: filters.sortBy,
        sortOrder: filters.sortOrder,
      })
      
      const response = await axios.get(`/api/restaurants?${params}`)
      setRestaurants(response.data.restaurants)
      setTotalPages(response.data.pagination.totalPages)
    } catch (error) {
      console.error('Failed to fetch restaurants:', error)
    } finally {
      setIsLoading(false)
    }
  }
  
  const handleFilterChange = (newFilters: any) => {
    setFilters({ ...filters, ...newFilters })
    setPage(1)
  }
  
  const handleRestaurantCreated = (newRestaurant: any) => {
    setRestaurants([newRestaurant, ...restaurants])
    setShowCreateModal(false)
    fetchRestaurants() // Refresh the list
  }
  
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <div className="flex justify-between items-center mb-4">
          <h1 className="text-3xl font-bold text-gray-900">
            Discover Restaurants
          </h1>
          <Button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-2"
          >
            <Plus className="h-4 w-4" />
            Add Restaurant
          </Button>
        </div>
        
        {/* Search Bar */}
        <div className="flex gap-4 mb-6">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
            <Input
              type="text"
              placeholder="Search restaurants, cuisines..."
              className="pl-10"
              value={filters.search}
              onChange={(e) => handleFilterChange({ search: e.target.value })}
            />
          </div>
          
          <div className="flex gap-2">
            <Button
              variant={viewMode === 'grid' ? 'default' : 'outline'}
              size="icon"
              onClick={() => setViewMode('grid')}
            >
              <Grid3x3 className="h-4 w-4" />
            </Button>
            <Button
              variant={viewMode === 'list' ? 'default' : 'outline'}
              size="icon"
              onClick={() => setViewMode('list')}
            >
              <List className="h-4 w-4" />
            </Button>
          </div>
        </div>
        
        {/* Sort Options */}
        <div className="flex flex-wrap gap-2">
          <span className="text-sm text-gray-600">Sort by:</span>
          {[
            { value: 'createdAt', label: 'Newest', order: 'desc' },
            { value: 'rating', label: 'Top Rated', order: 'desc' },
            { value: 'reviews', label: 'Most Reviewed', order: 'desc' },
          ].map((option) => (
            <button
              key={option.value}
              onClick={() => handleFilterChange({ 
                sortBy: option.value, 
                sortOrder: option.order 
              })}
              className={`px-3 py-1 rounded-full text-sm transition-colors ${
                filters.sortBy === option.value
                  ? 'bg-primary text-white'
                  : 'bg-gray-100 hover:bg-gray-200'
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Filters Sidebar */}
        <div className="lg:col-span-1">
          <RestaurantFilters
            activeFilters={filters}
            onFilterChange={handleFilterChange}
          />
        </div>
        
        {/* Restaurant Grid */}
        <div className="lg:col-span-3">
          {isLoading ? (
            <div className="flex justify-center items-center h-64">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : restaurants.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-500">No restaurants found matching your criteria.</p>
            </div>
          ) : (
            <>
              <div className={`grid gap-6 ${
                viewMode === 'grid' 
                  ? 'grid-cols-1 md:grid-cols-2 xl:grid-cols-3' 
                  : 'grid-cols-1'
              }`}>
                {restaurants.map((restaurant) => (
                  <RestaurantCard key={restaurant.id} restaurant={restaurant} />
                ))}
              </div>
              
              {/* Pagination */}
              {totalPages > 1 && (
                <div className="mt-8 flex justify-center gap-2">
                  <Button
                    variant="outline"
                    onClick={() => setPage(page - 1)}
                    disabled={page === 1}
                  >
                    Previous
                  </Button>
                  
                  <div className="flex items-center gap-2">
                    {[...Array(Math.min(5, totalPages))].map((_, i) => {
                      const pageNum = i + 1
                      return (
                        <Button
                          key={pageNum}
                          variant={page === pageNum ? 'default' : 'outline'}
                          size="icon"
                          onClick={() => setPage(pageNum)}
                        >
                          {pageNum}
                        </Button>
                      )
                    })}
                    
                    {totalPages > 5 && (
                      <>
                        <span className="px-2">...</span>
                        <Button
                          variant={page === totalPages ? 'default' : 'outline'}
                          size="icon"
                          onClick={() => setPage(totalPages)}
                        >
                          {totalPages}
                        </Button>
                      </>
                    )}
                  </div>
                  
                  <Button
                    variant="outline"
                    onClick={() => setPage(page + 1)}
                    disabled={page === totalPages}
                  >
                    Next
                  </Button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
      
      {/* Create Restaurant Modal */}
      <CreateRestaurantModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onRestaurantCreated={handleRestaurantCreated}
      />
    </div>
  )
}