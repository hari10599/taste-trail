'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { createReviewSchema, type CreateReviewInput } from '@/lib/validations/review'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { StarRating } from '@/components/ui/star-rating'
import { 
  Calendar, DollarSign, Image as ImageIcon, 
  Loader2, X, Star 
} from 'lucide-react'
import toast from 'react-hot-toast'
import axios from 'axios'
import { ImageUpload } from '@/components/ui/image-upload'
import { uploadImage } from '@/lib/imagekit-client'

interface ReviewFormProps {
  selectedRestaurant: any
  onCancel: () => void
}

export function ReviewForm({ selectedRestaurant, onCancel }: ReviewFormProps) {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [uploadingImages, setUploadingImages] = useState(false)
  const [uploadedImageUrls, setUploadedImageUrls] = useState<string[]>([])
  
  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isValid }
  } = useForm<CreateReviewInput>({
    resolver: zodResolver(createReviewSchema),
    mode: 'onChange',
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
  
  const handleImageChange = async (files: File[]) => {
    if (files.length === 0) {
      setUploadedImageUrls([])
      setValue('images', [])
      return
    }

    setUploadingImages(true)
    try {
      const uploadPromises = files.map(file => uploadImage(file, 'reviews'))
      const urls = await Promise.all(uploadPromises)
      
      setUploadedImageUrls(urls)
      setValue('images', urls)
    } catch (error) {
      console.error('Failed to upload images:', error)
      toast.error('Failed to upload images')
    } finally {
      setUploadingImages(false)
    }
  }
  
  const onSubmit = async (data: CreateReviewInput) => {
    setIsLoading(true)
    try {
      const token = localStorage.getItem('accessToken')
      
      if (!token) {
        toast.error('Please log in to post a review')
        router.push('/login')
        return
      }
      
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
      console.error('Review submission error:', error)
      if (error.response?.data?.details) {
        const validationErrors = error.response.data.details;
        const errorMessage = validationErrors.map((err: any) => err.message).join(', ');
        toast.error(errorMessage);
      } else {
        toast.error(error.response?.data?.error || 'Failed to post review')
      }
    } finally {
      setIsLoading(false)
    }
  }

  const rating = watch('rating')
  const content = watch('content')
  const contentLength = content?.length || 0
  const isFormValid = rating > 0 && contentLength >= 50 && !uploadingImages

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {/* Selected Restaurant */}
      <div className="bg-gray-50 p-4 rounded-lg flex items-center justify-between">
        <div>
          <div className="font-medium">{selectedRestaurant.name}</div>
          <div className="text-sm text-gray-600">{selectedRestaurant.address}</div>
        </div>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={onCancel}
        >
          <X className="h-4 w-4" />
        </Button>
      </div>
      
      {/* Rating */}
      <div>
        <label className="block text-sm font-medium mb-2">Rating *</label>
        <StarRating
          value={rating}
          onChange={(value) => setValue('rating', value)}
          size="lg"
        />
        {errors.rating && (
          <p className="text-red-500 text-sm mt-1">{errors.rating.message}</p>
        )}
      </div>
      
      {/* Title */}
      <div>
        <label className="block text-sm font-medium mb-2">Title</label>
        <Input
          {...register('title')}
          placeholder="Summarize your experience"
        />
        {errors.title && (
          <p className="text-red-500 text-sm mt-1">{errors.title.message}</p>
        )}
      </div>
      
      {/* Review Content */}
      <div>
        <label className="block text-sm font-medium mb-2">Review * (min 50 characters)</label>
        <textarea
          {...register('content')}
          className="w-full px-3 py-2 border rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-primary"
          rows={6}
          placeholder="Tell us about your experience... (minimum 50 characters)"
        />
        <div className="flex items-center justify-between mt-1">
          <div>
            {errors.content && (
              <p className="text-red-500 text-sm">{errors.content.message}</p>
            )}
          </div>
          <p className="text-sm text-gray-500">{contentLength} / 50 min</p>
        </div>
      </div>
      
      {/* Visit Date */}
      <div>
        <label className="block text-sm font-medium mb-2">Visit Date *</label>
        <div className="relative">
          <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            {...register('visitDate')}
            type="date"
            className="pl-10"
            max={new Date().toISOString().split('T')[0]}
          />
        </div>
        {errors.visitDate && (
          <p className="text-red-500 text-sm mt-1">{errors.visitDate.message}</p>
        )}
      </div>
      
      {/* Price per Person */}
      <div>
        <label className="block text-sm font-medium mb-2">Price per Person</label>
        <div className="relative">
          <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            {...register('pricePerPerson', { 
              valueAsNumber: true,
              setValueAs: (v) => v === '' ? undefined : Number(v)
            })}
            type="number"
            className="pl-10"
            placeholder="0"
            min="0"
          />
        </div>
        {errors.pricePerPerson && (
          <p className="text-red-500 text-sm mt-1">{errors.pricePerPerson.message}</p>
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
            setValue('dishes', dishes)
          }}
        />
        {errors.dishes && (
          <p className="text-red-500 text-sm mt-1">{errors.dishes.message}</p>
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
          disabled={!isFormValid || isLoading}
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
      
      {/* Form Requirements */}
      <div className="mt-4 p-4 bg-blue-50 rounded-lg">
        <p className="text-sm text-blue-800 font-medium mb-1">Required fields to post review:</p>
        <ul className="text-sm text-blue-700 space-y-1">
          <li className="flex items-center gap-2">
            {selectedRestaurant ? '✓' : '○'} Select a restaurant
          </li>
          <li className="flex items-center gap-2">
            {rating > 0 ? '✓' : '○'} Add a rating (1-5 stars)
          </li>
          <li className="flex items-center gap-2">
            {contentLength >= 50 ? '✓' : '○'} Write your review (min 50 characters)
          </li>
        </ul>
      </div>
    </form>
  )
}