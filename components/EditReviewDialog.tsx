'use client'

import { useState } from 'react'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { StarRating } from '@/components/ui/star-rating'
import { Loader2, Calendar, DollarSign, X, Upload } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { updateReviewSchema, UpdateReviewInput } from '@/lib/validations/review'
import axios from 'axios'
import toast from 'react-hot-toast'
import { format } from 'date-fns'

interface EditReviewDialogProps {
  review: {
    id: string
    rating: number
    title?: string | null
    content: string
    visitDate: string
    pricePerPerson?: number | null
    images: string[]
  }
  isOpen: boolean
  onClose: () => void
  onSuccess: (updatedReview: any) => void
}

export function EditReviewDialog({ review, isOpen, onClose, onSuccess }: EditReviewDialogProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [rating, setRating] = useState(review.rating)
  const [images, setImages] = useState<string[]>(review.images || [])
  const [isUploading, setIsUploading] = useState(false)
  
  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
  } = useForm<UpdateReviewInput>({
    resolver: zodResolver(updateReviewSchema),
    defaultValues: {
      rating: review.rating,
      title: review.title || '',
      content: review.content,
      visitDate: format(new Date(review.visitDate), 'yyyy-MM-dd'),
      pricePerPerson: review.pricePerPerson || undefined,
      images: review.images || [],
    },
  })
  
  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files
    if (!files || files.length === 0) return
    
    setIsUploading(true)
    try {
      const uploadPromises = Array.from(files).map(async (file) => {
        const formData = new FormData()
        formData.append('file', file)
        formData.append('type', 'review')
        
        const response = await axios.post('/api/upload', formData, {
          headers: {
            'Content-Type': 'multipart/form-data',
            Authorization: `Bearer ${localStorage.getItem('accessToken')}`,
          },
        })
        
        return response.data.url
      })
      
      const uploadedUrls = await Promise.all(uploadPromises)
      const newImages = [...images, ...uploadedUrls].slice(0, 10)
      setImages(newImages)
      setValue('images', newImages)
    } catch (error) {
      toast.error('Failed to upload images')
    } finally {
      setIsUploading(false)
    }
  }
  
  const removeImage = (index: number) => {
    const newImages = images.filter((_, i) => i !== index)
    setImages(newImages)
    setValue('images', newImages)
  }
  
  const onSubmit = async (data: UpdateReviewInput) => {
    setIsLoading(true)
    try {
      const response = await axios.put(`/api/reviews/${review.id}`, {
        ...data,
        rating,
        images,
      }, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('accessToken')}`,
        },
      })
      
      toast.success('Review updated successfully!')
      onSuccess(response.data.review)
      onClose()
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to update review')
    } finally {
      setIsLoading(false)
    }
  }
  
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Review</DialogTitle>
          <DialogDescription>
            Update your review details
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {/* Rating */}
          <div>
            <Label>Rating *</Label>
            <StarRating 
              value={rating} 
              onChange={(value) => {
                setRating(value)
                setValue('rating', value)
              }}
            />
            {errors.rating && (
              <p className="text-sm text-red-500 mt-1">{errors.rating.message}</p>
            )}
          </div>
          
          {/* Title */}
          <div>
            <Label htmlFor="title">Title</Label>
            <Input
              id="title"
              placeholder="Summarize your experience"
              {...register('title')}
            />
            {errors.title && (
              <p className="text-sm text-red-500 mt-1">{errors.title.message}</p>
            )}
          </div>
          
          {/* Content */}
          <div>
            <Label htmlFor="content">Review *</Label>
            <Textarea
              id="content"
              placeholder="Share your experience..."
              rows={6}
              {...register('content')}
            />
            <p className="text-xs text-gray-500 mt-1">
              Minimum 20 characters
            </p>
            {errors.content && (
              <p className="text-sm text-red-500 mt-1">{errors.content.message}</p>
            )}
          </div>
          
          {/* Visit Date */}
          <div>
            <Label htmlFor="visitDate">Visit Date *</Label>
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                id="visitDate"
                type="date"
                className="pl-10"
                max={new Date().toISOString().split('T')[0]}
                {...register('visitDate')}
              />
            </div>
            {errors.visitDate && (
              <p className="text-sm text-red-500 mt-1">{errors.visitDate.message}</p>
            )}
          </div>
          
          {/* Price per Person */}
          <div>
            <Label htmlFor="pricePerPerson">Price per Person</Label>
            <div className="relative">
              <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                id="pricePerPerson"
                type="number"
                placeholder="0"
                className="pl-10"
                {...register('pricePerPerson', { valueAsNumber: true })}
              />
            </div>
            {errors.pricePerPerson && (
              <p className="text-sm text-red-500 mt-1">{errors.pricePerPerson.message}</p>
            )}
          </div>
          
          {/* Images */}
          <div>
            <Label>Photos</Label>
            <div className="space-y-4">
              {images.length > 0 && (
                <div className="grid grid-cols-3 gap-2">
                  {images.map((image, index) => (
                    <div key={index} className="relative aspect-square">
                      <img
                        src={image}
                        alt={`Review image ${index + 1}`}
                        className="w-full h-full object-cover rounded-lg"
                      />
                      <button
                        type="button"
                        onClick={() => removeImage(index)}
                        className="absolute top-2 right-2 p-1 bg-black/50 text-white rounded-full hover:bg-black/70 transition"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
              
              {images.length < 10 && (
                <div>
                  <input
                    type="file"
                    id="images"
                    accept="image/*"
                    multiple
                    onChange={handleImageUpload}
                    className="hidden"
                    disabled={isUploading}
                  />
                  <label
                    htmlFor="images"
                    className="flex items-center gap-2 px-4 py-2 border border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-gray-400 transition"
                  >
                    {isUploading ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Upload className="h-4 w-4" />
                    )}
                    {isUploading ? 'Uploading...' : 'Upload Photos'}
                  </label>
                  <p className="text-xs text-gray-500 mt-1">
                    Max 10 photos
                  </p>
                </div>
              )}
            </div>
          </div>
          
          {/* Actions */}
          <div className="flex justify-end gap-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isLoading || isUploading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Updating...
                </>
              ) : (
                'Update Review'
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}