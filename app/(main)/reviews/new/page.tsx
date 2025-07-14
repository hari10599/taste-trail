'use client'

import { Suspense } from 'react'
import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { createReviewSchema, type CreateReviewInput } from '@/lib/validations/review'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { StarRating } from '@/components/ui/star-rating'
import { 
  Search, MapPin, Calendar, DollarSign, Image as ImageIcon, 
  Loader2, X, ChevronLeft 
} from 'lucide-react'
import toast from 'react-hot-toast'
import axios from 'axios'
import Link from 'next/link'
import { ImageUpload } from '@/components/ui/image-upload'
import { uploadImage } from '@/lib/imagekit-client'

function NewReviewContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const restaurantId = searchParams.get('restaurant')
  
  const [isLoading, setIsLoading] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<any[]>([])
  const [selectedRestaurant, setSelectedRestaurant] = useState<any>(null)
  const [isSearching, setIsSearching] = useState(false)
  const [uploadingImages, setUploadingImages] = useState(false)
  const [uploadedImageUrls, setUploadedImageUrls] = useState<string[]>([])
  
  const form = useForm<CreateReviewInput>({
    resolver: zodResolver(createReviewSchema),
    defaultValues: {
      rating: 0,
      title: '',
      content: '',
      visitDate: new Date().toISOString().split('T')[0],
      pricePerPerson: undefined,
      dishes: [],
      images: [],
    },
  })
  
  // Load restaurant if ID is provided
  useEffect(() => {
    if (restaurantId) {
      loadRestaurant(restaurantId)
    }
  }, [restaurantId])
  
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
  
  const handleImageChange = async (files: File[]) => {
    if (files.length === 0) {
      setUploadedImageUrls([])
      form.setValue('images', [])
      return
    }

    setUploadingImages(true)
    try {
      const uploadPromises = files.map(file => uploadImage(file, 'reviews'))
      const urls = await Promise.all(uploadPromises)
      
      setUploadedImageUrls(urls)
      form.setValue('images', urls)
    } catch (error) {
      console.error('Failed to upload images:', error)
      toast.error('Failed to upload images')
    } finally {
      setUploadingImages(false)
    }
  }
  
  const onSubmit = async (data: CreateReviewInput) => {
    if (!selectedRestaurant) {
      toast.error('Please select a restaurant')
      return
    }
    
    setIsLoading(true)
    try {
      const token = localStorage.getItem('accessToken')
      
      const reviewData = {
        ...data,
        restaurantId: selectedRestaurant.id,
        images: uploadedImageUrls,
      }
      
      const response = await axios.post('/api/reviews', reviewData, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
      
      toast.success('Review posted successfully!')
      router.push(`/restaurants/${selectedRestaurant.id}`)
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to post review')
    } finally {
      setIsLoading(false)
    }
  }
  
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
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Restaurant Selection */}
            {!selectedRestaurant ? (
              <div className="space-y-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <Input
                    placeholder="Search for a restaurant..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
                
                {isSearching && (
                  <div className="text-center py-4">
                    <Loader2 className="h-6 w-6 animate-spin mx-auto" />
                  </div>
                )}
                
                {searchResults.length > 0 && (
                  <div className="border rounded-lg divide-y">
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
              </div>
            ) : (
              <div className="bg-gray-50 p-4 rounded-lg flex items-center justify-between">
                <div>
                  <div className="font-medium">{selectedRestaurant.name}</div>
                  <div className="text-sm text-gray-600 flex items-center gap-1 mt-1">
                    <MapPin className="h-3 w-3" />
                    {selectedRestaurant.address}
                  </div>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setSelectedRestaurant(null)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            )}
            
            {/* Rating */}
            <div>
              <label className="block text-sm font-medium mb-2">Rating *</label>
              <StarRating
                value={form.watch('rating')}
                onChange={(rating) => form.setValue('rating', rating)}
                size="lg"
              />
              {form.formState.errors.rating && (
                <p className="text-red-500 text-sm mt-1">
                  {form.formState.errors.rating.message}
                </p>
              )}
            </div>
            
            {/* Title */}
            <div>
              <label className="block text-sm font-medium mb-2">Title</label>
              <Input
                {...form.register('title')}
                placeholder="Summarize your experience"
              />
              {form.formState.errors.title && (
                <p className="text-red-500 text-sm mt-1">
                  {form.formState.errors.title.message}
                </p>
              )}
            </div>
            
            {/* Review Content */}
            <div>
              <label className="block text-sm font-medium mb-2">Review *</label>
              <textarea
                {...form.register('content')}
                className="w-full px-3 py-2 border rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-primary"
                rows={6}
                placeholder="Tell us about your experience..."
              />
              {form.formState.errors.content && (
                <p className="text-red-500 text-sm mt-1">
                  {form.formState.errors.content.message}
                </p>
              )}
            </div>
            
            {/* Visit Date */}
            <div>
              <label className="block text-sm font-medium mb-2">Visit Date *</label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  {...form.register('visitDate')}
                  type="date"
                  className="pl-10"
                  max={new Date().toISOString().split('T')[0]}
                />
              </div>
              {form.formState.errors.visitDate && (
                <p className="text-red-500 text-sm mt-1">
                  {form.formState.errors.visitDate.message}
                </p>
              )}
            </div>
            
            {/* Price per Person */}
            <div>
              <label className="block text-sm font-medium mb-2">Price per Person</label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  {...form.register('pricePerPerson', { valueAsNumber: true })}
                  type="number"
                  className="pl-10"
                  placeholder="0"
                  min="0"
                />
              </div>
              {form.formState.errors.pricePerPerson && (
                <p className="text-red-500 text-sm mt-1">
                  {form.formState.errors.pricePerPerson.message}
                </p>
              )}
            </div>
            
            {/* Dishes */}
            <div>
              <label className="block text-sm font-medium mb-2">Dishes Tried</label>
              <Input
                placeholder="Enter dish names separated by commas"
                onChange={(e) => {
                  const dishes = e.target.value
                    .split(',')
                    .map(d => d.trim())
                    .filter(d => d.length > 0)
                  form.setValue('dishes', dishes)
                }}
              />
              {form.formState.errors.dishes && (
                <p className="text-red-500 text-sm mt-1">
                  {form.formState.errors.dishes.message}
                </p>
              )}
            </div>
            
            {/* Images */}
            <div>
              <label className="block text-sm font-medium mb-2">
                <ImageIcon className="inline h-4 w-4 mr-1" />
                Photos
              </label>
              <ImageUpload
                onChange={handleImageChange}
                maxFiles={10}
                disabled={uploadingImages}
              />
              {uploadingImages && (
                <p className="text-sm text-gray-600 mt-2">Uploading images...</p>
              )}
              {uploadedImageUrls.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-2">
                  {uploadedImageUrls.map((url, index) => (
                    <img
                      key={index}
                      src={url}
                      alt={`Upload ${index + 1}`}
                      className="h-20 w-20 object-cover rounded"
                    />
                  ))}
                </div>
              )}
            </div>
            
            {/* Submit Button */}
            <div className="flex gap-4">
              <Button
                type="submit"
                disabled={isLoading || !selectedRestaurant || form.watch('rating') === 0 || uploadingImages}
                className="flex-1"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Posting...
                  </>
                ) : (
                  'Post Review'
                )}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => router.push('/dashboard')}
              >
                Cancel
              </Button>
            </div>
          </form>
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