'use client'

import { useState, useEffect } from 'react'
import { Avatar } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { UserBadge } from '@/components/ui/user-badge'
import { formatDistanceToNow } from 'date-fns'
import { MessageSquare, Send, Edit2, Trash2, Loader2 } from 'lucide-react'
import toast from 'react-hot-toast'
import axios from 'axios'

interface Comment {
  id: string
  content: string
  createdAt: string
  updatedAt: string
  user: {
    id: string
    name: string
    avatar?: string | null
    role: string
  }
  replies?: Comment[]
}

interface CommentSectionProps {
  reviewId: string
  currentUserId?: string
}

export function CommentSection({ reviewId, currentUserId }: CommentSectionProps) {
  const [comments, setComments] = useState<Comment[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [newComment, setNewComment] = useState('')
  const [replyTo, setReplyTo] = useState<{ id: string; name: string } | null>(null)
  const [editingComment, setEditingComment] = useState<{ id: string; content: string } | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  
  useEffect(() => {
    fetchComments()
  }, [reviewId])
  
  const fetchComments = async () => {
    try {
      const response = await axios.get(`/api/reviews/${reviewId}/comments`)
      setComments(response.data.comments)
    } catch (error) {
      console.error('Failed to fetch comments:', error)
      toast.error('Failed to load comments')
    } finally {
      setIsLoading(false)
    }
  }
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!newComment.trim() || !currentUserId) return
    
    setIsSubmitting(true)
    try {
      const token = localStorage.getItem('accessToken')
      const response = await axios.post(
        `/api/reviews/${reviewId}/comments`,
        {
          content: newComment,
          parentId: replyTo?.id,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      )
      
      if (replyTo) {
        // Add reply to the correct parent comment
        setComments(comments.map(comment => 
          comment.id === replyTo.id
            ? { ...comment, replies: [...(comment.replies || []), response.data.comment] }
            : comment
        ))
      } else {
        // Add new top-level comment
        setComments([response.data.comment, ...comments])
      }
      
      setNewComment('')
      setReplyTo(null)
      toast.success('Comment posted!')
    } catch (error) {
      console.error('Failed to post comment:', error)
      toast.error('Failed to post comment')
    } finally {
      setIsSubmitting(false)
    }
  }
  
  const handleUpdate = async (commentId: string, content: string) => {
    try {
      const token = localStorage.getItem('accessToken')
      await axios.put(
        `/api/comments/${commentId}`,
        { content },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      )
      
      // Update comment in state
      const updateCommentInList = (comments: Comment[]): Comment[] => {
        return comments.map(comment => {
          if (comment.id === commentId) {
            return { ...comment, content, updatedAt: new Date().toISOString() }
          }
          if (comment.replies) {
            return { ...comment, replies: updateCommentInList(comment.replies) }
          }
          return comment
        })
      }
      
      setComments(updateCommentInList(comments))
      setEditingComment(null)
      toast.success('Comment updated!')
    } catch (error) {
      console.error('Failed to update comment:', error)
      toast.error('Failed to update comment')
    }
  }
  
  const handleDelete = async (commentId: string) => {
    if (!confirm('Are you sure you want to delete this comment?')) return
    
    try {
      const token = localStorage.getItem('accessToken')
      await axios.delete(`/api/comments/${commentId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
      
      // Remove comment from state
      const removeCommentFromList = (comments: Comment[]): Comment[] => {
        return comments.filter(comment => {
          if (comment.id === commentId) return false
          if (comment.replies) {
            comment.replies = removeCommentFromList(comment.replies)
          }
          return true
        })
      }
      
      setComments(removeCommentFromList(comments))
      toast.success('Comment deleted!')
    } catch (error) {
      console.error('Failed to delete comment:', error)
      toast.error('Failed to delete comment')
    }
  }
  
  const CommentItem = ({ comment, isReply = false }: { comment: Comment; isReply?: boolean }) => {
    const isOwner = currentUserId === comment.user.id
    const isEditing = editingComment?.id === comment.id
    const timeAgo = formatDistanceToNow(new Date(comment.createdAt), { addSuffix: true })
    
    return (
      <div className={`${isReply ? 'ml-12' : ''}`}>
        <div className="flex gap-3 mb-4">
          <Avatar
            src={comment.user.avatar}
            alt={comment.user.name}
            fallback={comment.user.name}
            size="sm"
          />
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <span className="font-semibold text-sm">{comment.user.name}</span>
              <UserBadge role={comment.user.role} size="sm" />
              <span className="text-xs text-gray-500">{timeAgo}</span>
              {comment.createdAt !== comment.updatedAt && (
                <span className="text-xs text-gray-500">(edited)</span>
              )}
            </div>
            
            {isEditing ? (
              <form onSubmit={(e) => {
                e.preventDefault()
                handleUpdate(comment.id, editingComment.content)
              }} className="space-y-2">
                <textarea
                  value={editingComment.content}
                  onChange={(e) => setEditingComment({ ...editingComment, content: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                  rows={2}
                />
                <div className="flex gap-2">
                  <Button size="sm" type="submit">Save</Button>
                  <Button size="sm" variant="outline" onClick={() => setEditingComment(null)}>
                    Cancel
                  </Button>
                </div>
              </form>
            ) : (
              <>
                <p className="text-sm text-gray-700 mb-2">{comment.content}</p>
                
                <div className="flex items-center gap-2">
                  {!isReply && (
                    <button
                      onClick={() => setReplyTo({ id: comment.id, name: comment.user.name })}
                      className="text-xs text-gray-500 hover:text-primary"
                    >
                      Reply
                    </button>
                  )}
                  
                  {isOwner && (
                    <>
                      <button
                        onClick={() => setEditingComment({ id: comment.id, content: comment.content })}
                        className="text-xs text-gray-500 hover:text-primary"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(comment.id)}
                        className="text-xs text-gray-500 hover:text-red-600"
                      >
                        Delete
                      </button>
                    </>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
        
        {comment.replies && comment.replies.length > 0 && (
          <div className="border-l-2 border-gray-100 ml-4 pl-4">
            {comment.replies.map((reply) => (
              <CommentItem key={reply.id} comment={reply} isReply />
            ))}
          </div>
        )}
      </div>
    )
  }
  
  if (isLoading) {
    return (
      <div className="flex justify-center py-8">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    )
  }
  
  return (
    <div className="space-y-6">
      <h3 className="font-semibold flex items-center gap-2">
        <MessageSquare className="h-5 w-5" />
        Comments ({comments.length})
      </h3>
      
      {currentUserId && (
        <form onSubmit={handleSubmit} className="space-y-3">
          {replyTo && (
            <div className="text-sm text-gray-600 flex items-center justify-between bg-gray-50 px-3 py-2 rounded">
              <span>Replying to {replyTo.name}</span>
              <button
                type="button"
                onClick={() => setReplyTo(null)}
                className="text-gray-500 hover:text-gray-700"
              >
                Cancel
              </button>
            </div>
          )}
          
          <div className="flex gap-3">
            <textarea
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder={replyTo ? `Reply to ${replyTo.name}...` : 'Write a comment...'}
              className="flex-1 px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary resize-none"
              rows={3}
            />
            <Button
              type="submit"
              disabled={!newComment.trim() || isSubmitting}
              className="self-end"
            >
              {isSubmitting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
            </Button>
          </div>
        </form>
      )}
      
      <div className="space-y-4">
        {comments.length === 0 ? (
          <p className="text-center text-gray-500 py-8">
            No comments yet. Be the first to comment!
          </p>
        ) : (
          comments.map((comment) => (
            <CommentItem key={comment.id} comment={comment} />
          ))
        )}
      </div>
    </div>
  )
}