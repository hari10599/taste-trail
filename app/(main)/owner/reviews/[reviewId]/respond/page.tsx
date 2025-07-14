'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import axios from 'axios'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { StarRating } from '@/components/ui/star-rating'
import { ChevronLeft, MessageSquare, Loader2 } from 'lucide-react'
import Link from 'next/link'
import toast from 'react-hot-toast'
import { format } from 'date-fns'

interface Review {
  id: string
  rating: number
  title?: string
  content: string
  createdAt: string
  user: {
    name: string
    avatar?: string
  }
  restaurant: {
    id: string
    name: string
  }
}

interface OwnerResponse {
  id: string
  content: string
  createdAt: string
  updatedAt: string
}

export default function RespondToReview() {
  const params = useParams()
  const router = useRouter()
  const reviewId = params.reviewId as string

  const [review, setReview] = useState<Review | null>(null)
  const [existingResponse, setExistingResponse] = useState<OwnerResponse | null>(null)
  const [response, setResponse] = useState('')
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    fetchReview()
    fetchExistingResponse()
  }, [reviewId])

  const fetchReview = async () => {
    try {
      const token = localStorage.getItem('accessToken')
      const response = await axios.get(`/api/reviews/${reviewId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
      setReview(response.data.review)
    } catch (error) {
      toast.error('Failed to fetch review')
      router.push('/owner')
    }
  }

  const fetchExistingResponse = async () => {
    try {
      const response = await axios.get(`/api/owner/reviews/${reviewId}/respond`)
      setExistingResponse(response.data.response)
      setResponse(response.data.response.content)
    } catch (error) {
      // No existing response
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async () => {
    if (response.trim().length < 10) {
      toast.error('Response must be at least 10 characters')
      return
    }

    setSubmitting(true)
    try {
      const token = localStorage.getItem('accessToken')
      await axios.post(
        `/api/owner/reviews/${reviewId}/respond`,
        { content: response },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      )
      toast.success('Response submitted successfully')
      router.push(`/owner/restaurants/${review?.restaurant.id}`)
    } catch (error) {
      toast.error('Failed to submit response')
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this response?')) {
      return
    }

    setSubmitting(true)
    try {
      const token = localStorage.getItem('accessToken')
      await axios.delete(`/api/owner/reviews/${reviewId}/respond`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
      toast.success('Response deleted successfully')
      router.push(`/owner/restaurants/${review?.restaurant.id}`)
    } catch (error) {
      toast.error('Failed to delete response')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading || !review) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto">
          <Card>
            <CardContent className="p-8">
              <div className="flex items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin" />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-2xl mx-auto">
        <Link
          href={`/owner/restaurants/${review.restaurant.id}`}
          className="inline-flex items-center text-gray-600 hover:text-gray-900 mb-6"
        >
          <ChevronLeft className="h-4 w-4 mr-1" />
          Back to Restaurant
        </Link>

        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Original Review</CardTitle>
            <CardDescription>
              by {review.user.name} on {format(new Date(review.createdAt), 'MMMM d, yyyy')}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-3 mb-4">
              <img
                src={review.user.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${review.user.name}`}
                alt={review.user.name}
                className="w-10 h-10 rounded-full"
              />
              <div>
                <p className="font-medium">{review.user.name}</p>
                <StarRating value={review.rating} readonly size="sm" />
              </div>
            </div>
            {review.title && (
              <h4 className="font-semibold mb-2">{review.title}</h4>
            )}
            <p className="text-gray-700">{review.content}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>
              <MessageSquare className="inline h-5 w-5 mr-2" />
              {existingResponse ? 'Edit Your Response' : 'Write Your Response'}
            </CardTitle>
            <CardDescription>
              Respond professionally to this review. Your response will be visible to all users.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Textarea
              value={response}
              onChange={(e) => setResponse(e.target.value)}
              placeholder="Thank you for your feedback..."
              rows={6}
              className="mb-4"
            />
            <div className="flex gap-2">
              <Button
                onClick={handleSubmit}
                disabled={submitting || response.trim().length < 10}
                className="flex-1"
              >
                {submitting ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Submitting...
                  </>
                ) : existingResponse ? (
                  'Update Response'
                ) : (
                  'Submit Response'
                )}
              </Button>
              {existingResponse && (
                <Button
                  variant="destructive"
                  onClick={handleDelete}
                  disabled={submitting}
                >
                  Delete
                </Button>
              )}
            </div>
            {existingResponse && (
              <p className="text-sm text-gray-500 mt-4">
                Last updated: {format(new Date(existingResponse.updatedAt), 'MMMM d, yyyy h:mm a')}
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}