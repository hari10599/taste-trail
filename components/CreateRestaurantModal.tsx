'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Loader2, X, Plus } from 'lucide-react'
import toast from 'react-hot-toast'
import axios from 'axios'

const restaurantSchema = z.object({
  name: z.string().min(1, 'Restaurant name is required'),
  description: z.string().min(10, 'Description must be at least 10 characters'),
  address: z.string().min(1, 'Address is required'),
  phone: z.string().optional(),
  website: z.string().url().optional().or(z.literal('')),
  email: z.string().email().optional().or(z.literal('')),
  priceRange: z.number().min(1).max(4),
})

type RestaurantFormData = z.infer<typeof restaurantSchema>

interface CreateRestaurantModalProps {
  isOpen: boolean
  onClose: () => void
  onRestaurantCreated: (restaurant: any) => void
}

const CUISINE_OPTIONS = [
  'American', 'Italian', 'Chinese', 'Japanese', 'Mexican', 'Thai', 'Indian', 
  'French', 'Greek', 'Mediterranean', 'Korean', 'Vietnamese', 'Spanish', 
  'Middle Eastern', 'Seafood', 'Steakhouse', 'Pizza', 'Burger', 'Sushi', 
  'BBQ', 'Cafe', 'Bakery', 'Dessert', 'Fast Food', 'Fine Dining'
]

export function CreateRestaurantModal({ isOpen, onClose, onRestaurantCreated }: CreateRestaurantModalProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [categories, setCategories] = useState<string[]>([])
  const [newCategory, setNewCategory] = useState('')

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors },
  } = useForm<RestaurantFormData>({
    resolver: zodResolver(restaurantSchema),
    defaultValues: {
      priceRange: 2,
    },
  })

  const priceRange = watch('priceRange')

  const addCategory = (category: string) => {
    if (category && !categories.includes(category)) {
      setCategories([...categories, category])
    }
    setNewCategory('')
  }

  const removeCategory = (category: string) => {
    setCategories(categories.filter(c => c !== category))
  }

  const onSubmit = async (data: RestaurantFormData) => {
    setIsLoading(true)
    try {
      const token = localStorage.getItem('accessToken')
      
      const response = await axios.post('/api/restaurants', {
        ...data,
        categories,
        latitude: 0, // Default values - could be enhanced with geocoding
        longitude: 0,
      }, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
      
      toast.success('Restaurant created successfully!')
      onRestaurantCreated(response.data.restaurant)
      reset()
      setCategories([])
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to create restaurant')
    } finally {
      setIsLoading(false)
    }
  }

  const handleClose = () => {
    reset()
    setCategories([])
    onClose()
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add New Restaurant</DialogTitle>
          <DialogDescription>
            Create a new restaurant listing for the community
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Basic Information */}
          <div className="space-y-4">
            <div>
              <Label htmlFor="name">Restaurant Name *</Label>
              <Input
                id="name"
                placeholder="e.g., The Golden Spoon"
                {...register('name')}
                className={errors.name ? 'border-red-500' : ''}
              />
              {errors.name && (
                <p className="text-sm text-red-500 mt-1">{errors.name.message}</p>
              )}
            </div>

            <div>
              <Label htmlFor="description">Description *</Label>
              <Textarea
                id="description"
                placeholder="Describe the restaurant's atmosphere, specialty dishes, or unique features..."
                rows={3}
                {...register('description')}
                className={errors.description ? 'border-red-500' : ''}
              />
              {errors.description && (
                <p className="text-sm text-red-500 mt-1">{errors.description.message}</p>
              )}
            </div>

            <div>
              <Label htmlFor="address">Address *</Label>
              <Input
                id="address"
                placeholder="123 Main St, City, State 12345"
                {...register('address')}
                className={errors.address ? 'border-red-500' : ''}
              />
              {errors.address && (
                <p className="text-sm text-red-500 mt-1">{errors.address.message}</p>
              )}
            </div>
          </div>

          {/* Contact Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="phone">Phone Number</Label>
              <Input
                id="phone"
                placeholder="(555) 123-4567"
                {...register('phone')}
              />
            </div>

            <div>
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="contact@restaurant.com"
                {...register('email')}
                className={errors.email ? 'border-red-500' : ''}
              />
              {errors.email && (
                <p className="text-sm text-red-500 mt-1">{errors.email.message}</p>
              )}
            </div>
          </div>

          <div>
            <Label htmlFor="website">Website</Label>
            <Input
              id="website"
              placeholder="https://restaurant.com"
              {...register('website')}
              className={errors.website ? 'border-red-500' : ''}
            />
            {errors.website && (
              <p className="text-sm text-red-500 mt-1">{errors.website.message}</p>
            )}
          </div>

          {/* Price Range */}
          <div>
            <Label>Price Range *</Label>
            <Select
              value={priceRange?.toString()}
              onValueChange={(value) => setValue('priceRange', parseInt(value))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select price range" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1">$ - Budget friendly</SelectItem>
                <SelectItem value="2">$$ - Moderate</SelectItem>
                <SelectItem value="3">$$$ - Expensive</SelectItem>
                <SelectItem value="4">$$$$ - Very expensive</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Categories */}
          <div>
            <Label>Cuisine Categories</Label>
            <div className="space-y-2">
              <div className="flex gap-2">
                <Select
                  value={newCategory}
                  onValueChange={setNewCategory}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select cuisine type" />
                  </SelectTrigger>
                  <SelectContent>
                    {CUISINE_OPTIONS.map((cuisine) => (
                      <SelectItem key={cuisine} value={cuisine}>
                        {cuisine}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={() => addCategory(newCategory)}
                  disabled={!newCategory || categories.includes(newCategory)}
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
              
              {categories.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {categories.map((category) => (
                    <Badge key={category} variant="secondary" className="flex items-center gap-1">
                      {category}
                      <button
                        type="button"
                        onClick={() => removeCategory(category)}
                        className="ml-1 hover:bg-gray-300 rounded-full p-0.5"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating...
                </>
              ) : (
                'Create Restaurant'
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}