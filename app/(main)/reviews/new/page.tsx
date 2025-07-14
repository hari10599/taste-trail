'use client'

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
import { uploadImage } from '@/lib/imagekit'

export default function NewReviewPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const restaurantId = searchParams.get('restaurant')
  
  const [isLoading, setIsLoading] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<any[]>([])
  const [selectedRestaurant, setSelectedRestaurant] = useState<any>(null)
  const [uploadedImages, setUploadedImages] = useState<string[]>([])
  
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<CreateReviewInput>({
    resolver: zodResolver(createReviewSchema),
    defaultValues: {
      rating: 0,
      visitDate: new Date().toISOString().split('T')[0],
      images: [],
    },
  })
  
  const rating = watch('rating')
  
  useEffect(() => {
    if (restaurantId) {
      fetchRestaurant(restaurantId)
    }
  }, [restaurantId])
  
  const fetchRestaurant = async (id: string) => {
    try {
      const response = await axios.get(`/api/restaurants/${id}`)
      setSelectedRestaurant(response.data.restaurant)
      setValue('restaurantId', id)
    } catch (error) {
      console.error('Failed to fetch restaurant:', error)
    }
  }
  
  const searchRestaurants = async (query: string) => {
    if (query.length < 2) {
      setSearchResults([])
      return
    }
    
    try {
      const response = await axios.get(`/api/restaurants/search?q=${query}`)
      setSearchResults(response.data.results)
    } catch (error) {
      console.error('Failed to search restaurants:', error)
    }
  }
  
  const handleRestaurantSelect = (restaurant: any) => {
    setSelectedRestaurant(restaurant)
    setValue('restaurantId', restaurant.id)
    setSearchQuery('')
    setSearchResults([])
  }
  
  const handleImageUpload = async (files: File[]) => {
    try {
      const token = localStorage.getItem('accessToken')
      if (!token) {
        throw new Error('Please login to upload images')
      }
      
      const uploadPromises = files.map(async (file) => {
        const fileName = `review-${Date.now()}-${Math.random().toString(36).substring(7)}`
        const result = await uploadImage({
          file,
          fileName,
          folder: '/reviews',
          tags: ['review', 'user-upload'],
          transformation: {
            width: 800,
            height: 600,
            crop: 'maintain_ratio',
            format: 'webp',
            quality: 85
          }
        })
        return result.url
      })
      
      const newImageUrls = await Promise.all(uploadPromises)
      const updatedImages = [...uploadedImages, ...newImageUrls].slice(0, 10)
      setUploadedImages(updatedImages)
      setValue('images', updatedImages)
      
      toast.success(`${files.length} image(s) uploaded successfully`)
    } catch (error) {
      console.error('Image upload failed:', error)
      toast.error('Failed to upload images. Please try again.')
      throw error
    }
  }
  
  const removeImage = (index: number) => {
    const updatedImages = uploadedImages.filter((_, i) => i !== index)
    setUploadedImages(updatedImages)
    setValue('images', updatedImages)
  }
  
  const onSubmit = async (data: CreateReviewInput) => {
    setIsLoading(true)
    try {
      const token = localStorage.getItem('accessToken')
      const response = await axios.post('/api/reviews', data, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
      
      toast.success('Review posted successfully!')
      router.push(`/restaurants/${data.restaurantId}`)
    } catch (error: any) {
      console.error('Failed to create review:', error)
      toast.error(error.response?.data?.error || 'Failed to post review')
    } finally {
      setIsLoading(false)
    }
  }
  
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-6">
        <Link href="/restaurants" className="inline-flex items-center text-gray-600 hover:text-primary mb-4">
          <ChevronLeft className="h-4 w-4 mr-1" />
          Back to Restaurants
        </Link>
        <h1 className="text-3xl font-bold text-gray-900">Write a Review</h1>
      </div>
      
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Restaurant Selection */}
        <Card>
          <CardHeader>
            <CardTitle>Select Restaurant</CardTitle>
            <CardDescription>
              Choose the restaurant you want to review
            </CardDescription>
          </CardHeader>
          <CardContent>
            {!selectedRestaurant ? (
              <div className="space-y-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                  <input
                    type="text"
                    placeholder="Search for a restaurant..."
                    className="w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                    value={searchQuery}
                    onChange={(e) => {
                      setSearchQuery(e.target.value)
                      searchRestaurants(e.target.value)
                    }}
                  />
                </div>
                
                {searchResults.length > 0 && (
                  <div className="border rounded-lg divide-y max-h-60 overflow-y-auto">
                    {searchResults.map((restaurant) => (
                      <button
                        key={restaurant.id}
                        type="button"
                        onClick={() => handleRestaurantSelect(restaurant)}
                        className="w-full p-3 text-left hover:bg-gray-50 flex items-center gap-3"
                      >
                        {restaurant.coverImage && (
                          <img
                            src={restaurant.coverImage}
                            alt={restaurant.name}
                            className="w-12 h-12 rounded object-cover"
                          />
                        )}
                        <div className="flex-1">
                          <div className="font-medium">{restaurant.name}</div>
                          <div className="text-sm text-gray-500 flex items-center gap-1">
                            <MapPin className="h-3 w-3" />
                            {restaurant.address}
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-3">
                  {selectedRestaurant.coverImage && (
                    <img
                      src={selectedRestaurant.coverImage}
                      alt={selectedRestaurant.name}
                      className="w-16 h-16 rounded-lg object-cover"
                    />
                  )}
                  <div>
                    <div className="font-semibold">{selectedRestaurant.name}</div>
                    <div className="text-sm text-gray-500">{selectedRestaurant.address}</div>
                  </div>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setSelectedRestaurant(null)
                    setValue('restaurantId', '')
                  }}
                >
                  Change
                </Button>
              </div>
            )}
            {errors.restaurantId && (
              <p className="text-sm text-red-500 mt-2">{errors.restaurantId.message}</p>
            )}
          </CardContent>
        </Card>
        
        {/* Rating & Visit Details */}
        <Card>
          <CardHeader>
            <CardTitle>Your Experience</CardTitle>
            <CardDescription>
              Rate your overall experience
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium text-gray-700 mb-2 block">
                Overall Rating
              </label>
              <StarRating
                value={rating}
                onChange={(value) => setValue('rating', value)}
                size="lg"
              />
              {errors.rating && (
                <p className="text-sm text-red-500 mt-1">{errors.rating.message}</p>
              )}
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-700 mb-1 block">
                  <Calendar className="inline h-4 w-4 mr-1" />
                  Visit Date
                </label>
                <Input
                  type="date"
                  {...register('visitDate')}
                  max={new Date().toISOString().split('T')[0]}
                />
                {errors.visitDate && (
                  <p className="text-sm text-red-500 mt-1">{errors.visitDate.message}</p>
                )}
              </div>
              
              <div>
                <label className="text-sm font-medium text-gray-700 mb-1 block">
                  <DollarSign className="inline h-4 w-4 mr-1" />
                  Price per Person (optional)
                </label>
                <Input
                  type="number"
                  placeholder="0"
                  {...register('pricePerPerson', { valueAsNumber: true })}
                />
                {errors.pricePerPerson && (
                  <p className="text-sm text-red-500 mt-1">{errors.pricePerPerson.message}</p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
        
        {/* Review Content */}
        <Card>
          <CardHeader>
            <CardTitle>Your Review</CardTitle>
            <CardDescription>
              Share your experience with others
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Input
              label="Title (optional)"
              placeholder="Summarize your experience"
              {...register('title')}
              error={errors.title?.message}
            />
            
            <div>
              <label className="text-sm font-medium text-gray-700 mb-1 block">
                Review
              </label>
              <textarea
                className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary min-h-[150px]"
                placeholder="Tell us about your experience... (minimum 50 characters)"
                {...register('content')}
              />
              {errors.content && (
                <p className="text-sm text-red-500 mt-1">{errors.content.message}</p>
              )}
            </div>
            
            {/* Image Upload */}
            <div>
              <label className="text-sm font-medium text-gray-700 mb-2 block">
                Photos (optional)
              </label>
              <ImageUpload
                onUpload={handleImageUpload}
                onRemove={removeImage}
                existingImages={uploadedImages}
                maxFiles={10}
                placeholder="Drag and drop photos here, or click to select files"
              />
            </div>
          </CardContent>
        </Card>
        
        {/* Submit */}
        <div className="flex justify-end gap-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.back()}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            disabled={isLoading || !selectedRestaurant || rating === 0}
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Posting...
              </>
            ) : (
              'Post Review'
            )}
          </Button>
        </div>
      </form>
    </div>
  )
}