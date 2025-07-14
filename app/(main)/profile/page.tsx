'use client'

import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { updateProfileSchema, type UpdateProfileInput } from '@/lib/auth/validation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Avatar } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Camera, Loader2, MapPin, Phone, Mail, Award, Heart, MessageSquare, Utensils } from 'lucide-react'
import toast from 'react-hot-toast'
import axios from 'axios'

const dietaryOptions = [
  'Vegetarian',
  'Vegan',
  'Gluten-Free',
  'Dairy-Free',
  'Nut-Free',
  'Halal',
  'Kosher',
  'Pescatarian',
]

const roleLabels = {
  USER: 'Food Enthusiast',
  INFLUENCER: 'Food Influencer',
  OWNER: 'Restaurant Owner',
  ADMIN: 'Administrator',
  MODERATOR: 'Moderator',
}

const roleBadgeVariants = {
  USER: 'outline' as const,
  INFLUENCER: 'secondary' as const,
  OWNER: 'success' as const,
  ADMIN: 'error' as const,
  MODERATOR: 'warning' as const,
}

export default function ProfilePage() {
  const [user, setUser] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isUpdating, setIsUpdating] = useState(false)
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false)

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<UpdateProfileInput>({
    resolver: zodResolver(updateProfileSchema),
  })

  const dietaryPrefs = watch('dietaryPrefs') || []

  useEffect(() => {
    fetchProfile()
  }, [])

  const fetchProfile = async () => {
    try {
      const token = localStorage.getItem('accessToken')
      const response = await axios.get('/api/users/profile', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
      
      const userData = response.data.user
      setUser(userData)
      
      // Set form values
      setValue('name', userData.name)
      setValue('bio', userData.bio || '')
      setValue('location', userData.profile?.location || '')
      setValue('phone', userData.profile?.phone || '')
      setValue('dietaryPrefs', userData.profile?.dietaryPrefs || [])
    } catch (error) {
      console.error('Failed to fetch profile:', error)
      toast.error('Failed to load profile')
    } finally {
      setIsLoading(false)
    }
  }

  const onSubmit = async (data: UpdateProfileInput) => {
    setIsUpdating(true)
    try {
      const token = localStorage.getItem('accessToken')
      const response = await axios.put('/api/users/profile', data, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
      
      setUser(response.data.user)
      toast.success('Profile updated successfully')
    } catch (error) {
      console.error('Failed to update profile:', error)
      toast.error('Failed to update profile')
    } finally {
      setIsUpdating(false)
    }
  }

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setIsUploadingAvatar(true)
    const formData = new FormData()
    formData.append('avatar', file)

    try {
      const token = localStorage.getItem('accessToken')
      const response = await axios.post('/api/users/avatar', formData, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'multipart/form-data',
        },
      })
      
      setUser((prev: any) => ({ ...prev, avatar: response.data.avatarUrl }))
      toast.success('Avatar updated successfully')
    } catch (error: any) {
      console.error('Failed to upload avatar:', error)
      toast.error(error.response?.data?.error || 'Failed to upload avatar')
    } finally {
      setIsUploadingAvatar(false)
    }
  }

  const toggleDietaryPref = (pref: string) => {
    const current = dietaryPrefs || []
    if (current.includes(pref)) {
      setValue('dietaryPrefs', current.filter(p => p !== pref))
    } else {
      setValue('dietaryPrefs', [...current, pref])
    }
  }

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">My Profile</h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Profile Overview */}
        <div className="md:col-span-1">
          <Card>
            <CardContent className="pt-6">
              <div className="flex flex-col items-center">
                <div className="relative">
                  <Avatar
                    src={user?.avatar}
                    alt={user?.name}
                    fallback={user?.name}
                    size="xl"
                  />
                  <label className="absolute bottom-0 right-0 bg-primary text-white p-2 rounded-full cursor-pointer hover:bg-primary/90 transition">
                    <Camera className="h-4 w-4" />
                    <input
                      type="file"
                      className="hidden"
                      accept="image/*"
                      onChange={handleAvatarUpload}
                      disabled={isUploadingAvatar}
                    />
                  </label>
                </div>
                
                <h2 className="mt-4 text-xl font-semibold">{user?.name}</h2>
                <Badge variant={roleBadgeVariants[user?.role as keyof typeof roleBadgeVariants]}>
                  {roleLabels[user?.role as keyof typeof roleLabels]}
                </Badge>
                
                <div className="mt-4 text-sm text-gray-600 space-y-2">
                  <div className="flex items-center">
                    <Mail className="h-4 w-4 mr-2" />
                    {user?.email}
                  </div>
                  {user?.profile?.location && (
                    <div className="flex items-center">
                      <MapPin className="h-4 w-4 mr-2" />
                      {user.profile.location}
                    </div>
                  )}
                  {user?.profile?.phone && (
                    <div className="flex items-center">
                      <Phone className="h-4 w-4 mr-2" />
                      {user.profile.phone}
                    </div>
                  )}
                </div>
                
                {/* Stats */}
                <div className="mt-6 w-full grid grid-cols-3 gap-4 text-center">
                  <div>
                    <div className="text-2xl font-bold text-primary">{user?._count?.reviews || 0}</div>
                    <div className="text-xs text-gray-600">Reviews</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-primary">{user?._count?.likes || 0}</div>
                    <div className="text-xs text-gray-600">Likes</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-primary">{user?._count?.comments || 0}</div>
                    <div className="text-xs text-gray-600">Comments</div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Edit Profile Form */}
        <div className="md:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Edit Profile</CardTitle>
              <CardDescription>
                Update your profile information and preferences
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                <Input
                  label="Name"
                  error={errors.name?.message}
                  {...register('name')}
                />
                
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">
                    Bio
                  </label>
                  <textarea
                    className="flex min-h-[80px] w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm ring-offset-white placeholder:text-gray-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    placeholder="Tell us about yourself..."
                    {...register('bio')}
                  />
                  {errors.bio && (
                    <p className="text-sm text-red-500">{errors.bio.message}</p>
                  )}
                </div>
                
                <Input
                  label="Location"
                  placeholder="San Francisco, CA"
                  error={errors.location?.message}
                  {...register('location')}
                />
                
                <Input
                  label="Phone"
                  placeholder="+1 (555) 123-4567"
                  error={errors.phone?.message}
                  {...register('phone')}
                />
                
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">
                    Dietary Preferences
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {dietaryOptions.map((option) => (
                      <button
                        key={option}
                        type="button"
                        onClick={() => toggleDietaryPref(option)}
                        className={cn(
                          'px-3 py-1.5 text-sm rounded-full border transition-all',
                          dietaryPrefs?.includes(option)
                            ? 'bg-primary text-white border-primary'
                            : 'bg-white text-gray-700 border-gray-300 hover:border-primary'
                        )}
                      >
                        {option}
                      </button>
                    ))}
                  </div>
                </div>
                
                <Button
                  type="submit"
                  className="w-full"
                  disabled={isUpdating}
                >
                  {isUpdating ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Updating...
                    </>
                  ) : (
                    'Update Profile'
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

function cn(...inputs: any[]) {
  return inputs.filter(Boolean).join(' ')
}