'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Star, X } from 'lucide-react'

interface FilterProps {
  onFilterChange: (filters: any) => void
  activeFilters: any
}

const categories = [
  'Italian', 'Chinese', 'Japanese', 'Indian', 'Mexican',
  'Thai', 'French', 'American', 'Mediterranean', 'Korean'
]

const priceRanges = [
  { value: 1, label: '$', description: 'Under $15' },
  { value: 2, label: '$$', description: '$15-30' },
  { value: 3, label: '$$$', description: '$31-60' },
  { value: 4, label: '$$$$', description: 'Over $60' },
]

export function RestaurantFilters({ onFilterChange, activeFilters }: FilterProps) {
  const handleCategoryToggle = (category: string) => {
    onFilterChange({
      ...activeFilters,
      category: activeFilters.category === category ? '' : category,
    })
  }
  
  const handlePriceToggle = (price: number) => {
    onFilterChange({
      ...activeFilters,
      priceRange: activeFilters.priceRange === price ? '' : price,
    })
  }
  
  const handleRatingChange = (rating: number) => {
    onFilterChange({
      ...activeFilters,
      minRating: activeFilters.minRating === rating ? 0 : rating,
    })
  }
  
  const clearFilters = () => {
    onFilterChange({
      category: '',
      priceRange: '',
      minRating: 0,
    })
  }
  
  const hasActiveFilters = activeFilters.category || activeFilters.priceRange || activeFilters.minRating > 0
  
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-lg">Filters</CardTitle>
        {hasActiveFilters && (
          <Button
            variant="ghost"
            size="sm"
            onClick={clearFilters}
            className="h-8 px-2 text-xs"
          >
            <X className="h-3 w-3 mr-1" />
            Clear
          </Button>
        )}
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Categories */}
        <div>
          <h3 className="font-medium text-sm mb-3">Cuisine</h3>
          <div className="space-y-2">
            {categories.map((category) => (
              <button
                key={category}
                onClick={() => handleCategoryToggle(category)}
                className={`block w-full text-left px-3 py-2 rounded-md text-sm transition-colors ${
                  activeFilters.category === category
                    ? 'bg-primary text-white'
                    : 'hover:bg-gray-100'
                }`}
              >
                {category}
              </button>
            ))}
          </div>
        </div>
        
        {/* Price Range */}
        <div>
          <h3 className="font-medium text-sm mb-3">Price Range</h3>
          <div className="grid grid-cols-2 gap-2">
            {priceRanges.map((range) => (
              <button
                key={range.value}
                onClick={() => handlePriceToggle(range.value)}
                className={`px-3 py-2 rounded-md text-sm transition-colors border ${
                  activeFilters.priceRange === range.value
                    ? 'bg-primary text-white border-primary'
                    : 'border-gray-300 hover:border-primary'
                }`}
              >
                <div className="font-semibold">{range.label}</div>
                <div className="text-xs opacity-75">{range.description}</div>
              </button>
            ))}
          </div>
        </div>
        
        {/* Minimum Rating */}
        <div>
          <h3 className="font-medium text-sm mb-3">Minimum Rating</h3>
          <div className="space-y-2">
            {[4, 3, 2].map((rating) => (
              <button
                key={rating}
                onClick={() => handleRatingChange(rating)}
                className={`flex items-center w-full px-3 py-2 rounded-md text-sm transition-colors ${
                  activeFilters.minRating === rating
                    ? 'bg-primary text-white'
                    : 'hover:bg-gray-100'
                }`}
              >
                <div className="flex items-center">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      className={`h-4 w-4 ${
                        i < rating
                          ? activeFilters.minRating === rating
                            ? 'fill-white text-white'
                            : 'fill-yellow-500 text-yellow-500'
                          : 'text-gray-300'
                      }`}
                    />
                  ))}
                  <span className="ml-2">& Up</span>
                </div>
              </button>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}