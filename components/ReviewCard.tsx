import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Avatar } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { StarRating } from '@/components/ui/star-rating'
import { UserBadge } from '@/components/ui/user-badge'
import { FollowButton } from '@/components/FollowButton'
import { 
  Heart, MessageSquare, Share2, MoreVertical, 
  Edit, Trash2, Flag, Calendar, DollarSign 
} from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import toast from 'react-hot-toast'
import axios from 'axios'

interface ReviewCardProps {
  review: {
    id: string
    rating: number
    title?: string | null
    content: string
    images: string[]
    visitDate: string
    pricePerPerson?: number | null
    createdAt: string
    user: {
      id: string
      name: string
      avatar?: string | null
      role: string
    }
    restaurant: {
      id: string
      name: string
      coverImage?: string | null
    }
    _count: {
      likes: number
      comments: number
    }
  }
  currentUserId?: string
  isLiked?: boolean
  onLike?: () => void
  onComment?: () => void
  onShare?: () => void
  onEdit?: () => void
  onDelete?: () => void
  onReport?: () => void
  showRestaurant?: boolean
}

export function ReviewCard({
  review,
  currentUserId,
  isLiked: initialIsLiked = false,
  onLike,
  onComment,
  onShare,
  onEdit,
  onDelete,
  onReport,
  showRestaurant = true,
}: ReviewCardProps) {
  const [showMenu, setShowMenu] = useState(false)
  const [imageIndex, setImageIndex] = useState(0)
  const [isLiked, setIsLiked] = useState(initialIsLiked)
  const [likeCount, setLikeCount] = useState(review._count.likes)
  const [isLiking, setIsLiking] = useState(false)
  
  const isOwner = currentUserId === review.user.id
  const timeAgo = formatDistanceToNow(new Date(review.createdAt), { addSuffix: true })
  
  // Fetch like status from database on mount
  useEffect(() => {
    const fetchLikeStatus = async () => {
      try {
        const token = localStorage.getItem('accessToken')
        if (!token || !currentUserId) return
        
        const response = await axios.get(`/api/reviews/${review.id}/likes`, {
          headers: { Authorization: `Bearer ${token}` }
        })
        
        setIsLiked(response.data.isLiked)
      } catch (error) {
        console.error('Failed to fetch like status:', error)
      }
    }
    
    fetchLikeStatus()
  }, [review.id, currentUserId])
  
  const handleLikeClick = async () => {
    if (!currentUserId) {
      toast('Please sign in to like reviews')
      return
    }
    
    if (isLiking) return // Prevent multiple clicks
    
    setIsLiking(true)
    try {
      const token = localStorage.getItem('accessToken')
      
      if (isLiked) {
        // Unlike
        await axios.delete(`/api/reviews/${review.id}/like`, {
          headers: { Authorization: `Bearer ${token}` }
        })
        setIsLiked(false)
        setLikeCount(prev => Math.max(0, prev - 1))
      } else {
        // Like
        await axios.post(`/api/reviews/${review.id}/like`, {}, {
          headers: { Authorization: `Bearer ${token}` }
        })
        setIsLiked(true)
        setLikeCount(prev => prev + 1)
      }
    } catch (error) {
      console.error('Failed to update like:', error)
      toast.error('Failed to update like')
    } finally {
      setIsLiking(false)
    }
  }
  
  return (
    <Card className="overflow-hidden hover:shadow-lg transition-shadow">
      <CardContent className="p-6">
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-start gap-3">
            <Link href={`/users/${review.user.id}`}>
              <Avatar
                src={review.user.avatar}
                alt={review.user.name}
                fallback={review.user.name}
                size="md"
              />
            </Link>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <Link href={`/users/${review.user.id}`} className="font-semibold hover:underline">
                  {review.user.name}
                </Link>
                <UserBadge role={review.user.role} size="sm" />
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-500">
                <StarRating value={review.rating} size="sm" readonly />
                <span>·</span>
                <span>{timeAgo}</span>
              </div>
            </div>
          </div>
          
          {/* Follow button */}
          {currentUserId && currentUserId !== review.user.id && (
            <FollowButton 
              userId={review.user.id} 
              size="sm" 
              className="mr-2"
            />
          )}
          
          {/* Menu */}
          {(isOwner || currentUserId) && (
            <div className="relative">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setShowMenu(!showMenu)}
              >
                <MoreVertical className="h-4 w-4" />
              </Button>
              
              {showMenu && (
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border z-10">
                  {isOwner && (
                    <>
                      <button
                        onClick={onEdit}
                        className="flex items-center gap-2 w-full px-4 py-2 text-sm hover:bg-gray-100"
                      >
                        <Edit className="h-4 w-4" />
                        Edit Review
                      </button>
                      <button
                        onClick={onDelete}
                        className="flex items-center gap-2 w-full px-4 py-2 text-sm hover:bg-gray-100 text-red-600"
                      >
                        <Trash2 className="h-4 w-4" />
                        Delete Review
                      </button>
                    </>
                  )}
                  {!isOwner && (
                    <button 
                      onClick={() => {
                        setShowMenu(false)
                        onReport?.()
                      }}
                      className="flex items-center gap-2 w-full px-4 py-2 text-sm hover:bg-gray-100"
                    >
                      <Flag className="h-4 w-4" />
                      Report Review
                    </button>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
        
        {/* Restaurant info (if shown) */}
        {showRestaurant && (
          <Link href={`/restaurants/${review.restaurant.id}`} className="block mb-4">
            <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition">
              {review.restaurant.coverImage && (
                <img
                  src={review.restaurant.coverImage}
                  alt={review.restaurant.name}
                  className="w-16 h-16 rounded-lg object-cover"
                />
              )}
              <div>
                <h4 className="font-semibold">{review.restaurant.name}</h4>
                <div className="flex items-center gap-4 text-sm text-gray-500">
                  <div className="flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    Visited {new Date(review.visitDate).toLocaleDateString()}
                  </div>
                  {review.pricePerPerson && (
                    <div className="flex items-center gap-1">
                      <DollarSign className="h-3 w-3" />
                      ${review.pricePerPerson}/person
                    </div>
                  )}
                </div>
              </div>
            </div>
          </Link>
        )}
        
        {/* Review content */}
        {review.title && (
          <h3 className="font-semibold text-lg mb-2">{review.title}</h3>
        )}
        <p className="text-gray-700 mb-4 whitespace-pre-wrap">{review.content}</p>
        
        {/* Images */}
        {review.images.length > 0 && (
          <div className="mb-4">
            <div className="relative aspect-video rounded-lg overflow-hidden bg-gray-100 mb-2">
              <img
                src={review.images[imageIndex]}
                alt={`Review image ${imageIndex + 1}`}
                className="w-full h-full object-cover"
              />
              {review.images.length > 1 && (
                <div className="absolute bottom-2 right-2 bg-black/50 text-white px-2 py-1 rounded text-sm">
                  {imageIndex + 1} / {review.images.length}
                </div>
              )}
            </div>
            
            {review.images.length > 1 && (
              <div className="flex gap-2 overflow-x-auto">
                {review.images.map((image, index) => (
                  <button
                    key={index}
                    onClick={() => setImageIndex(index)}
                    className={`flex-shrink-0 w-20 h-20 rounded overflow-hidden ${
                      index === imageIndex ? 'ring-2 ring-primary' : ''
                    }`}
                  >
                    <img
                      src={image}
                      alt={`Thumbnail ${index + 1}`}
                      className="w-full h-full object-cover"
                    />
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
        
        {/* Actions */}
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleLikeClick}
            disabled={isLiking}
            className={`flex items-center gap-2 transition-colors ${
              isLiked 
                ? 'text-red-500 hover:text-red-600' 
                : 'text-gray-500 hover:text-red-500'
            }`}
          >
            <Heart 
              className={`h-4 w-4 transition-all ${
                isLiked ? 'fill-red-500 text-red-500' : ''
              }`} 
            />
            {likeCount}
          </Button>
          
          <Button
            variant="ghost"
            size="sm"
            onClick={onComment}
            className="flex items-center gap-2"
          >
            <MessageSquare className="h-4 w-4" />
            {review._count.comments}
          </Button>
          
          <Button
            variant="ghost"
            size="sm"
            onClick={async () => {
              if (onShare) {
                await onShare()
              } else {
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
            }}
            className="flex items-center gap-2"
          >
            <Share2 className="h-4 w-4" />
            Share
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

// Add date-fns dependency
// npm install date-fns