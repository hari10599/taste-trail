'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { ReviewCard } from '@/components/ReviewCard'
import { CommentSection } from '@/components/CommentSection'
import { TimelineStats } from '@/components/TimelineStats'
import { ReportDialog } from '@/components/ReportDialog'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Loader2, TrendingUp, Star, Shield, Users, RefreshCw, LogIn } from 'lucide-react'
import axios from 'axios'
import toast from 'react-hot-toast'
import Link from 'next/link'

type FilterType = 'all' | 'trending' | 'verified' | 'high-rated' | 'following'

export default function TimelinePage() {
  const [reviews, setReviews] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [currentFilter, setCurrentFilter] = useState<FilterType>('all')
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(true)
  const [user, setUser] = useState<any>(null)
  const [expandedComments, setExpandedComments] = useState<Set<string>>(new Set())
  const [likedReviews, setLikedReviews] = useState<Set<string>>(new Set())
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [reportDialog, setReportDialog] = useState<{ isOpen: boolean; targetId: string; targetType: 'review' | 'comment' | 'restaurant' | 'user'; targetName?: string }>({
    isOpen: false,
    targetId: '',
    targetType: 'review'
  })
  const observerRef = useRef<IntersectionObserver | null>(null)
  const loadMoreRef = useRef<HTMLDivElement>(null)
  
  useEffect(() => {
    checkAuth()
  }, [])
  
  useEffect(() => {
    setReviews([])
    setPage(1)
    setHasMore(true)
    fetchReviews(true)
  }, [currentFilter])
  
  useEffect(() => {
    if (page > 1) {
      fetchReviews()
    }
  }, [page])
  
  // Infinite scroll setup
  useEffect(() => {
    const options = {
      root: null,
      rootMargin: '100px',
      threshold: 0.1,
    }
    
    observerRef.current = new IntersectionObserver((entries) => {
      const [entry] = entries
      if (entry.isIntersecting && hasMore && !isLoading) {
        setPage(prev => prev + 1)
      }
    }, options)
    
    if (loadMoreRef.current) {
      observerRef.current.observe(loadMoreRef.current)
    }
    
    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect()
      }
    }
  }, [hasMore, isLoading])
  
  const checkAuth = async () => {
    try {
      const token = localStorage.getItem('accessToken')
      if (token) {
        const response = await axios.get('/api/auth/me', {
          headers: { Authorization: `Bearer ${token}` },
        })
        setUser(response.data.user)
        setIsAuthenticated(true)
      }
    } catch (error) {
      console.error('Failed to fetch user:', error)
      setIsAuthenticated(false)
    }
  }
  
  const fetchReviews = async (reset = false) => {
    if (isLoading) return
    
    setIsLoading(true)
    try {
      const currentPage = reset ? 1 : page
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: '10',
        sortBy: currentFilter === 'trending' ? 'trending' : 'createdAt',
        sortOrder: 'desc',
        filter: currentFilter,
        timestamp: Date.now().toString(), // Force cache bypass
      })
      
      const token = localStorage.getItem('accessToken')
      const headers = token ? { Authorization: `Bearer ${token}` } : {}
      
      const response = await axios.get(`/api/reviews?${params}`, { headers })
      
      if (reset) {
        setReviews(response.data.reviews)
        setPage(1)
      } else {
        setReviews(prev => [...prev, ...response.data.reviews])
      }
      
      setHasMore(response.data.pagination.page < response.data.pagination.totalPages)
      
      // Cache liked reviews
      const likedIds = new Set<string>()
      if (token && user) {
        const likePromises = response.data.reviews.map((review: any) => 
          axios.get(`/api/reviews/${review.id}/likes`, {
            headers: { Authorization: `Bearer ${token}` },
          }).then(res => {
            if (res.data.isLiked) {
              likedIds.add(review.id)
            }
          }).catch(() => {})
        )
        await Promise.all(likePromises)
        setLikedReviews(prev => new Set([...prev, ...likedIds]))
      }
    } catch (error) {
      console.error('Failed to fetch reviews:', error)
      toast.error('Failed to load reviews')
    } finally {
      setIsLoading(false)
    }
  }
  
  const handleLike = async (reviewId: string) => {
    if (!isAuthenticated) {
      toast(
        <div>
          <p>Please sign in to like reviews</p>
          <div className="flex gap-2 mt-2">
            <Button size="sm" onClick={() => window.location.href = '/login'}>
              Sign In
            </Button>
            <Button size="sm" variant="outline" onClick={() => toast.dismiss()}>
              Cancel
            </Button>
          </div>
        </div>,
        { duration: 5000 }
      )
      return
    }
    
    try {
      const token = localStorage.getItem('accessToken')
      
      if (likedReviews.has(reviewId)) {
        await axios.delete(`/api/reviews/${reviewId}/like`, {
          headers: { Authorization: `Bearer ${token}` },
        })
        setLikedReviews(new Set([...likedReviews].filter(id => id !== reviewId)))
      } else {
        await axios.post(`/api/reviews/${reviewId}/like`, {}, {
          headers: { Authorization: `Bearer ${token}` },
        })
        setLikedReviews(new Set([...likedReviews, reviewId]))
      }
      
      // Update review like count in state
      setReviews(reviews.map(review => 
        review.id === reviewId
          ? { 
              ...review, 
              _count: { 
                ...review._count, 
                likes: review._count.likes + (likedReviews.has(reviewId) ? -1 : 1) 
              } 
            }
          : review
      ))
    } catch (error: any) {
      console.error('Failed to like review:', error)
      if (error.response?.status === 401) {
        toast.error('Please login to like reviews')
      } else {
        toast.error('Failed to update like')
      }
    }
  }
  
  const handleComment = (reviewId: string) => {
    if (!isAuthenticated) {
      toast(
        <div>
          <p>Please sign in to comment on reviews</p>
          <div className="flex gap-2 mt-2">
            <Button size="sm" onClick={() => window.location.href = '/login'}>
              Sign In
            </Button>
            <Button size="sm" variant="outline" onClick={() => toast.dismiss()}>
              Cancel
            </Button>
          </div>
        </div>,
        { duration: 5000 }
      )
      return
    }
    
    setExpandedComments(new Set(
      expandedComments.has(reviewId)
        ? [...expandedComments].filter(id => id !== reviewId)
        : [...expandedComments, reviewId]
    ))
  }
  
  const handleReport = (reviewId: string, reviewAuthor: string) => {
    if (!isAuthenticated) {
      toast(
        <div>
          <p>Please sign in to report content</p>
          <div className="flex gap-2 mt-2">
            <Button size="sm" onClick={() => window.location.href = '/login'}>
              Sign In
            </Button>
            <Button size="sm" variant="outline" onClick={() => toast.dismiss()}>
              Cancel
            </Button>
          </div>
        </div>,
        { duration: 5000 }
      )
      return
    }
    
    setReportDialog({
      isOpen: true,
      targetId: reviewId,
      targetType: 'review',
      targetName: `${reviewAuthor}'s review`
    })
  }

  const handleShare = async (review: any) => {
    const url = `${window.location.origin}/restaurants/${review.restaurant.id}#review-${review.id}`
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: `Review of ${review.restaurant.name}`,
          text: review.content.substring(0, 100) + '...',
          url,
        })
      } catch (error) {
        console.error('Error sharing:', error)
      }
    } else {
      navigator.clipboard.writeText(url)
      toast.success('Link copied to clipboard!')
    }
  }
  
  const filters = [
    { key: 'all', label: 'All', icon: RefreshCw },
    { key: 'trending', label: 'Trending', icon: TrendingUp },
    { key: 'verified', label: 'Verified Only', icon: Shield },
    { key: 'high-rated', label: 'High Rated (4+)', icon: Star },
    { key: 'following', label: 'Following', icon: Users },
  ]
  
  return (
    <div>
      <div className="mb-8">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-4">
              Food Timeline
            </h1>
            <p className="text-gray-600">
              Discover what people are saying about restaurants
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setReviews([])
              setPage(1)
              setHasMore(true)
              fetchReviews(true)
            }}
            className="flex items-center gap-2"
          >
            <RefreshCw className="h-4 w-4" />
            Refresh
          </Button>
        </div>
      </div>
      
      {/* Stats */}
      <TimelineStats />
      
      {/* Sign In CTA for non-authenticated users */}
      {!isAuthenticated && (
        <Card className="bg-gradient-to-r from-primary/10 to-secondary/10 border-primary/20 mb-8">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <LogIn className="h-8 w-8 text-primary" />
              <div className="flex-1">
                <h3 className="font-semibold text-lg">Join the Taste Trail community</h3>
                <p className="text-gray-600">Sign in to like reviews, leave comments, and share your experiences</p>
              </div>
              <Link href="/login">
                <Button>Sign In</Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      )}
      
      {/* Filters */}
      <div className="flex flex-wrap gap-2 mb-8">
        {filters.map((filter) => {
          const Icon = filter.icon
          return (
            <Button
              key={filter.key}
              variant={currentFilter === filter.key ? 'default' : 'outline'}
              size="sm"
              onClick={() => {
                setCurrentFilter(filter.key as FilterType)
                setReviews([])
                setPage(1)
              }}
              className="flex items-center gap-2"
            >
              <Icon className="h-4 w-4" />
              {filter.label}
            </Button>
          )
        })}
      </div>
      
      {/* Reviews */}
      <div className="space-y-6">
        {reviews.map((review) => (
          <div key={review.id}>
            <ReviewCard
              review={review}
              currentUserId={user?.id}
              isLiked={likedReviews.has(review.id)}
              onLike={() => handleLike(review.id)}
              onComment={() => handleComment(review.id)}
              onShare={() => handleShare(review)}
              onReport={() => handleReport(review.id, review.user.name)}
            />
            
            {expandedComments.has(review.id) && (
              <Card className="mt-4 border-t-0 rounded-t-none">
                <CardContent className="pt-6">
                  <CommentSection
                    reviewId={review.id}
                    currentUserId={user?.id}
                  />
                </CardContent>
              </Card>
            )}
          </div>
        ))}
        
        {isLoading && reviews.length === 0 && (
          <div className="flex justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        )}
        
        {!isLoading && reviews.length === 0 && (
          <Card>
            <CardContent className="text-center py-12">
              <p className="text-gray-500">No reviews found. Be the first to share your experience!</p>
            </CardContent>
          </Card>
        )}
        
        {hasMore && reviews.length > 0 && (
          <>
            <div ref={loadMoreRef} className="h-10" />
            <div className="flex justify-center py-6">
              {isLoading && (
                <div className="flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Loading more reviews...
                </div>
              )}
            </div>
          </>
        )}
      </div>

      {/* Report Dialog */}
      <ReportDialog
        isOpen={reportDialog.isOpen}
        onClose={() => setReportDialog({ ...reportDialog, isOpen: false })}
        targetId={reportDialog.targetId}
        targetType={reportDialog.targetType}
        targetName={reportDialog.targetName}
      />
    </div>
  )
}