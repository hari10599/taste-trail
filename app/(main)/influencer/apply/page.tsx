'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Checkbox } from '@/components/ui/checkbox'
import { Badge } from '@/components/ui/badge'
import { 
  Star, 
  Instagram, 
  Youtube, 
  Video, 
  Users, 
  CheckCircle, 
  Clock, 
  XCircle 
} from 'lucide-react'
import axios from 'axios'
import toast from 'react-hot-toast'

const applicationSchema = z.object({
  instagramHandle: z.string().optional(),
  youtubeChannel: z.string().optional(),
  tiktokHandle: z.string().optional(),
  followerCount: z.number().min(1000, 'Minimum 1,000 followers required'),
  contentType: z.array(z.string()).min(1, 'Select at least one content type'),
  reasonForApplication: z.string().min(100, 'Please provide at least 100 characters explaining why you want to become a verified influencer')
})

type ApplicationInput = z.infer<typeof applicationSchema>

const contentTypes = [
  'Food Reviews',
  'Restaurant Visits',
  'Cooking/Recipes',
  'Food Photography',
  'Restaurant Recommendations',
  'Food Trends',
  'Dining Experiences',
  'Culinary Tips'
]

export default function InfluencerApplicationPage() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [existingApplication, setExistingApplication] = useState<any>(null)
  const [selectedContentTypes, setSelectedContentTypes] = useState<string[]>([])

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors }
  } = useForm<ApplicationInput>({
    resolver: zodResolver(applicationSchema)
  })

  useEffect(() => {
    checkExistingApplication()
  }, [])

  useEffect(() => {
    setValue('contentType', selectedContentTypes)
  }, [selectedContentTypes, setValue])

  const checkExistingApplication = async () => {
    try {
      const token = localStorage.getItem('accessToken')
      if (!token) {
        router.push('/login')
        return
      }

      const response = await axios.get('/api/influencer/apply', {
        headers: {
          Authorization: `Bearer ${token}`
        }
      })

      if (response.data.application) {
        setExistingApplication(response.data.application)
      }
    } catch (error) {
      console.error('Failed to check existing application:', error)
    }
  }

  const onSubmit = async (data: ApplicationInput) => {
    setIsLoading(true)
    try {
      const token = localStorage.getItem('accessToken')
      const response = await axios.post('/api/influencer/apply', data, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      })

      toast.success('Application submitted successfully!')
      router.push('/dashboard')
    } catch (error: any) {
      console.error('Application submission error:', error)
      toast.error(error.response?.data?.error || 'Failed to submit application')
    } finally {
      setIsLoading(false)
    }
  }

  const handleContentTypeToggle = (contentType: string) => {
    setSelectedContentTypes(prev => 
      prev.includes(contentType)
        ? prev.filter(type => type !== contentType)
        : [...prev, contentType]
    )
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'PENDING':
        return <Clock className="h-5 w-5 text-yellow-500" />
      case 'APPROVED':
        return <CheckCircle className="h-5 w-5 text-green-500" />
      case 'REJECTED':
        return <XCircle className="h-5 w-5 text-red-500" />
      default:
        return <Clock className="h-5 w-5 text-gray-500" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PENDING':
        return 'bg-yellow-100 text-yellow-800'
      case 'APPROVED':
        return 'bg-green-100 text-green-800'
      case 'REJECTED':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  if (existingApplication) {
    return (
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <Star className="h-8 w-8 text-primary" />
              <div>
                <CardTitle>Influencer Application Status</CardTitle>
                <CardDescription>
                  Track your verification application progress
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center gap-3">
              {getStatusIcon(existingApplication.status)}
              <div>
                <p className="font-medium">Application Status</p>
                <Badge className={getStatusColor(existingApplication.status)}>
                  {existingApplication.status}
                </Badge>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-sm font-medium text-gray-700">Submitted On</p>
                <p className="text-sm text-gray-600">
                  {new Date(existingApplication.submittedAt).toLocaleDateString()}
                </p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-700">Follower Count</p>
                <p className="text-sm text-gray-600">
                  {existingApplication.followerCount?.toLocaleString()}
                </p>
              </div>
            </div>

            <div className="space-y-3">
              <p className="text-sm font-medium text-gray-700">Social Media Handles</p>
              <div className="space-y-2">
                {existingApplication.instagramHandle && (
                  <div className="flex items-center gap-2">
                    <Instagram className="h-4 w-4 text-pink-600" />
                    <span className="text-sm">@{existingApplication.instagramHandle}</span>
                  </div>
                )}
                {existingApplication.youtubeChannel && (
                  <div className="flex items-center gap-2">
                    <Youtube className="h-4 w-4 text-red-600" />
                    <span className="text-sm">{existingApplication.youtubeChannel}</span>
                  </div>
                )}
                {existingApplication.tiktokHandle && (
                  <div className="flex items-center gap-2">
                    <Video className="h-4 w-4 text-gray-900" />
                    <span className="text-sm">@{existingApplication.tiktokHandle}</span>
                  </div>
                )}
              </div>
            </div>

            <div>
              <p className="text-sm font-medium text-gray-700 mb-2">Content Types</p>
              <div className="flex flex-wrap gap-2">
                {existingApplication.contentType?.map((type: string) => (
                  <Badge key={type} variant="secondary">
                    {type}
                  </Badge>
                ))}
              </div>
            </div>

            {existingApplication.reviewerNotes && (
              <div>
                <p className="text-sm font-medium text-gray-700">Reviewer Notes</p>
                <p className="text-sm text-gray-600 mt-1">
                  {existingApplication.reviewerNotes}
                </p>
              </div>
            )}

            <div className="pt-6 border-t">
              <div className="text-center">
                {existingApplication.status === 'PENDING' && (
                  <p className="text-sm text-gray-600">
                    Your application is being reviewed. We'll notify you once it's processed.
                  </p>
                )}
                {existingApplication.status === 'APPROVED' && (
                  <div className="space-y-2">
                    <p className="text-sm text-green-600 font-medium">
                      Congratulations! Your application has been approved.
                    </p>
                    <Button onClick={() => router.push('/dashboard')}>
                      Go to Dashboard
                    </Button>
                  </div>
                )}
                {existingApplication.status === 'REJECTED' && (
                  <p className="text-sm text-red-600">
                    Your application was not approved. Please check the reviewer notes above.
                  </p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <Star className="h-8 w-8 text-primary" />
            <div>
              <CardTitle>Become a Verified Influencer</CardTitle>
              <CardDescription>
                Join our community of verified food influencers and get special recognition
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-6 mb-8">
            <div className="bg-blue-50 p-4 rounded-lg">
              <h3 className="font-medium text-blue-900 mb-2">Benefits of Verification</h3>
              <ul className="text-sm text-blue-800 space-y-1">
                <li>• Verified badge on your profile</li>
                <li>• Higher visibility in search results</li>
                <li>• Access to exclusive features</li>
                <li>• Priority in trending algorithm</li>
                <li>• Custom profile URL</li>
              </ul>
            </div>

            <div className="bg-amber-50 p-4 rounded-lg">
              <h3 className="font-medium text-amber-900 mb-2">Requirements</h3>
              <ul className="text-sm text-amber-800 space-y-1">
                <li>• Minimum 1,000 followers on at least one platform</li>
                <li>• Regular food-related content</li>
                <li>• Authentic and engaging reviews</li>
                <li>• Compliance with community guidelines</li>
              </ul>
            </div>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 block">
                  Instagram Handle (optional)
                </label>
                <div className="relative">
                  <Instagram className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    {...register('instagramHandle')}
                    placeholder="username"
                    className="pl-10"
                  />
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 block">
                  YouTube Channel (optional)
                </label>
                <div className="relative">
                  <Youtube className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    {...register('youtubeChannel')}
                    placeholder="Channel name or URL"
                    className="pl-10"
                  />
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 block">
                  TikTok Handle (optional)
                </label>
                <div className="relative">
                  <Video className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    {...register('tiktokHandle')}
                    placeholder="username"
                    className="pl-10"
                  />
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 block">
                  Total Follower Count *
                </label>
                <div className="relative">
                  <Users className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    type="number"
                    {...register('followerCount', { valueAsNumber: true })}
                    placeholder="10000"
                    className="pl-10"
                  />
                </div>
                {errors.followerCount && (
                  <p className="text-sm text-red-500 mt-1">{errors.followerCount.message}</p>
                )}
              </div>
            </div>

            <div>
              <label className="text-sm font-medium text-gray-700 mb-3 block">
                Content Types * (Select all that apply)
              </label>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {contentTypes.map((type) => (
                  <div key={type} className="flex items-center space-x-2">
                    <Checkbox
                      id={type}
                      checked={selectedContentTypes.includes(type)}
                      onCheckedChange={() => handleContentTypeToggle(type)}
                    />
                    <label
                      htmlFor={type}
                      className="text-sm font-medium cursor-pointer"
                    >
                      {type}
                    </label>
                  </div>
                ))}
              </div>
              {errors.contentType && (
                <p className="text-sm text-red-500 mt-1">{errors.contentType.message}</p>
              )}
            </div>

            <div>
              <label className="text-sm font-medium text-gray-700 mb-2 block">
                Why do you want to become a verified influencer? *
              </label>
              <Textarea
                {...register('reasonForApplication')}
                placeholder="Tell us about your passion for food, your content creation experience, and how you plan to contribute to the Taste Trail community..."
                className="min-h-[120px]"
              />
              {errors.reasonForApplication && (
                <p className="text-sm text-red-500 mt-1">{errors.reasonForApplication.message}</p>
              )}
            </div>

            <div className="pt-6 border-t">
              <div className="flex items-center justify-between">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => router.back()}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={isLoading}
                  className="min-w-[120px]"
                >
                  {isLoading ? 'Submitting...' : 'Submit Application'}
                </Button>
              </div>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}